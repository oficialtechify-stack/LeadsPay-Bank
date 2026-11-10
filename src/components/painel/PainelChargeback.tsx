import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  Copy,
  Download,
  FileText,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { EmptyState, SPRING, WhiteCard } from '../ui';
import { Skeleton } from './shared';
import type { PainelProps } from './types';
import type { Transaction } from '../../types';

const SP = 'America/Sao_Paulo';

const INTRO =
  'O chargeback é quando o cliente contesta uma compra no banco dele. O valor é retirado da sua conta e devolvido ao cliente enquanto a contestação é analisada. Abaixo estão os 5 passos de como funciona e o que enviar em cada motivo.';

const STEPS = [
  'O cliente contesta a compra no banco dele.',
  'O banco abre a contestação e avisa a operadora do cartão.',
  'A LeadsTap recebe o aviso e o valor é retirado da sua conta.',
  'Você pode recorrer enviando os documentos da venda.',
  'A bandeira analisa as evidências e decide quem fica com o valor.',
] as const;

const ACCORDIONS = [
  {
    title: 'Crédito não processado',
    body: 'Comprovante de que o crédito não foi processado, ou do estorno, se ele já foi feito.',
  },
  {
    title: 'Portador não reconhece',
    body: 'Termo de autorização da compra assinado pelo cliente e o comprovante da transação.',
    termo: true,
  },
  {
    title: 'Produto não entregue ou com defeito',
    body: 'Comprovante de entrega ou de postagem e fotos do produto.',
  },
  {
    title: 'Serviço não prestado',
    body: 'Contrato ou proposta aceita, registro do atendimento e a conversa com o cliente.',
  },
  {
    title: 'Venda duplicada ou por outros meios',
    body: 'Extrato mostrando as duas cobranças ou o comprovante do pagamento pelo outro meio.',
  },
] as const;

const TYPE_LABEL: Record<Transaction['type'], string> = {
  pix_in: 'Pix',
  pix_out: 'Pix',
  tap_to_pay: 'Tap',
  card_payment: 'Cartão',
  bill_payment: 'Boleto',
  investment: 'Investimento',
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  completed: 'Concluída',
  pending: 'Pendente',
  failed: 'Não aprovado',
};

function parseTs(ts: string): Date | null {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoDay(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: SP });
}

function brl(v: number): string {
  return `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

const TERMO_TEMPLATE = `TERMO DE AUTORIZAÇÃO DE COMPRA

Eu, [NOME], portador(a) do documento [CPF/CNPJ], autorizo a cobrança no valor de [VALOR], realizada em [DATA], referente a [DESCRIÇÃO].

Declaro que reconheço a transação acima e que fui informado(a) sobre a compra antes de autorizá-la.

Assinatura do cliente: ________________________________________
Data: ____/____/________`;

const CONTRATO_TEMPLATE = `CONTRATO DE VENDA / PRESTAÇÃO DE SERVIÇO

Partes: [NOME], portador(a) do documento [CPF/CNPJ], e o vendedor, pela LeadsTap.

Objeto: [DESCRIÇÃO].
Valor: [VALOR].
Data: [DATA].

O cliente declara que recebeu as informações sobre o produto ou serviço antes da compra e que autoriza a cobrança no valor acima.

Assinatura do cliente: ________________________________________
Assinatura do vendedor: ________________________________________
Data: ____/____/________`;

const RECIBO_TEMPLATE = `RECIBO

Recebi de [NOME], portador(a) do documento [CPF/CNPJ], o valor de [VALOR], em [DATA], referente a [DESCRIÇÃO].

Assinatura: ________________________________________
Data: ____/____/________`;

type DocKind = 'termo' | 'contrato' | 'recibo';

const DOC_META: Record<DocKind, { title: string; template: string; file: string }> = {
  termo: { title: 'Termo de autorização', template: TERMO_TEMPLATE, file: 'termo-autorizacao' },
  contrato: { title: 'Contrato', template: CONTRATO_TEMPLATE, file: 'contrato' },
  recibo: { title: 'Recibo', template: RECIBO_TEMPLATE, file: 'recibo' },
};

/**
 * Preenche o template com o que a transação tem de real. O que não existe
 * no dado fica como placeholder literal ([NOME], [CPF/CNPJ]) para o
 * usuário completar — nada é inventado.
 */
function fillTemplate(template: string, tx: Transaction): string {
  const name = tx.recipientOrSender?.trim();
  const description = tx.description?.trim()
    ? `${tx.title} — ${tx.description}`
    : tx.title;
  return template
    .replace('[NOME]', name || '[NOME]')
    .replace('[VALOR]', brl(tx.amount))
    .replace('[DATA]', tx.dateFormatted)
    .replace('[DESCRIÇÃO]', description);
}

function downloadTxt(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * U19 — Chargeback (v3.1 §8-U19 + v3.2 §D5.1, §D7.5).
 * Página educativa com os textos exatos do plano. Contrato, recibo e termo
 * são gerados em .txt a partir de uma transação REAL concluída, com os
 * placeholders do plano; sem transação, os botões travam de verdade.
 */
export const PainelChargeback: React.FC<PainelProps> = ({ transactions, syncState }) => {
  const [openAcc, setOpenAcc] = useState<number | null>(null);
  const [method, setMethod] = useState<'all' | Transaction['type']>('all');
  const [status, setStatus] = useState<'all' | Transaction['status']>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [docKind, setDocKind] = useState<DocKind | null>(null);
  const [copied, setCopied] = useState(false);

  const loading = syncState.loading && transactions.length === 0;

  const completed = useMemo(
    () => transactions.filter((t) => t.status === 'completed'),
    [transactions]
  );

  const filtered = useMemo(() => {
    const min = minValue === '' ? null : Number(minValue.replace(',', '.'));
    const max = maxValue === '' ? null : Number(maxValue.replace(',', '.'));
    return transactions.filter((tx) => {
      if (method !== 'all' && tx.type !== method) return false;
      if (status !== 'all' && tx.status !== status) return false;
      const d = parseTs(tx.timestamp);
      if ((dateFrom || dateTo) && !d) return false;
      if (d) {
        const iso = isoDay(d);
        if (dateFrom && iso < dateFrom) return false;
        if (dateTo && iso > dateTo) return false;
      }
      const abs = Math.abs(tx.amount);
      if (min !== null && Number.isFinite(min) && abs < min) return false;
      if (max !== null && Number.isFinite(max) && abs > max) return false;
      return true;
    });
  }, [transactions, method, status, dateFrom, dateTo, minValue, maxValue]);

  const selectable = useMemo(
    () => filtered.filter((t) => t.status === 'completed'),
    [filtered]
  );

  const selectedTx = completed.find((t) => t.id === selectedId) ?? null;
  const generated =
    docKind && selectedTx ? fillTemplate(DOC_META[docKind].template, selectedTx) : null;

  const copyText = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
    } catch {
      // Sem acesso à área de transferência: o texto continua visível.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  return (
    <div>
      <motion.div {...stagger(0)}>
        <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
          <ShieldAlert className="w-6 h-6" /> Chargeback
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[var(--shell-muted)]">
          {INTRO}
        </p>
      </motion.div>

      <motion.div {...stagger(1)}>
        <WhiteCard className="mt-4">
          <h2 className="text-[16px] font-bold">Como funciona</h2>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-[14px] leading-relaxed">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--shell-black)] text-[13px] font-bold text-[var(--shell-on-black)]">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </WhiteCard>
      </motion.div>

      <motion.div {...stagger(2)}>
        <WhiteCard className="mt-4">
          <h2 className="text-[16px] font-bold">O que enviar em cada motivo</h2>
          <div className="mt-3 divide-y divide-[var(--shell-border)] border-y border-[var(--shell-border)]">
            {ACCORDIONS.map((acc, i) => {
              const open = openAcc === i;
              return (
                <div key={acc.title}>
                  <button
                    type="button"
                    onClick={() => setOpenAcc(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[15px] font-semibold"
                  >
                    {acc.title}
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-[var(--shell-muted)] transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-[14px] leading-relaxed text-[var(--shell-muted)]">
                          {acc.body}
                        </p>
                        {'termo' in acc && acc.termo && (
                          <div className="pb-4">
                            <button
                              type="button"
                              disabled={!selectedTx}
                              onClick={() => setDocKind('termo')}
                              title={
                                completed.length === 0
                                  ? 'Você ainda não tem transações.'
                                  : !selectedTx
                                    ? 'Selecione uma transação para gerar o documento.'
                                    : undefined
                              }
                              className="rounded-full bg-[var(--shell-black)] px-4 py-2.5 text-[14px] font-semibold text-[var(--shell-on-black)] disabled:bg-[#E5E5E5] disabled:text-[#9CA3AF]"
                            >
                              Gerar termo de autorização
                            </button>
                            {!selectedTx && (
                              <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
                                {completed.length === 0
                                  ? 'Você ainda não tem transações.'
                                  : 'Selecione uma transação para gerar o documento.'}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--shell-muted)]">
            Atenção: comprovante da transação não é comprovante de entrega — para
            contestar entrega, envie o comprovante de envio ou de entrega.
          </p>
          <button
            type="button"
            disabled
            title="Página de ajuda detalhada ainda não disponível."
            className="mt-3 text-[14px] font-semibold text-[var(--shell-muted)] underline underline-offset-2 disabled:cursor-not-allowed"
          >
            Saiba mais...
          </button>
        </WhiteCard>
      </motion.div>

      <motion.div {...stagger(3)}>
        <WhiteCard className="mt-4">
          <h2 className="flex items-center gap-2 text-[16px] font-bold">
            <FileText className="w-5 h-5" /> Proteja suas transações
          </h2>
          <p className="mt-1 text-[14px] text-[var(--shell-muted)]">
            Gere um contrato ou um recibo a partir de uma venda real, para ter o
            documento em mãos se o cliente contestar.
          </p>

          {loading ? (
            <div className="mt-4">
              <Skeleton lines={3} />
            </div>
          ) : completed.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Você ainda não tem transações."
                text="Quando uma venda for concluída, ela aparece aqui para gerar o documento."
              />
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="text-[13px] font-semibold text-[var(--shell-muted)]">Método</span>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'all' | Transaction['type'])}
                    className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                  >
                    <option value="all">Todos</option>
                    {(
                      ['pix_in', 'tap_to_pay', 'card_payment', 'bill_payment', 'investment'] as const
                    ).map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-[var(--shell-muted)]">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'all' | Transaction['status'])}
                    className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="completed">Concluída</option>
                    <option value="pending">Pendente</option>
                    <option value="failed">Não aprovado</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-[var(--shell-muted)]">De</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-[var(--shell-muted)]">Até</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-[var(--shell-muted)]">Valor mínimo (R$)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="0,00"
                    className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-[var(--shell-muted)]">Valor máximo (R$)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="0,00"
                    className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-[13px] font-semibold text-[var(--shell-muted)]">
                  Transação ({selectable.length}{' '}
                  {selectable.length === 1 ? 'encontrada' : 'encontradas'})
                </span>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setDocKind(null);
                  }}
                  className="mt-1 w-full rounded-[16px] border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2.5 text-[14px] outline-none"
                >
                  <option value="">Selecione uma transação</option>
                  {selectable.map((tx) => (
                    <option key={tx.id} value={tx.id}>
                      {tx.dateFormatted} — {tx.title} — {brl(tx.amount)} (
                      {TYPE_LABEL[tx.type]})
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    ['contrato', 'Criar contrato', FileText],
                    ['recibo', 'Criar recibo', Receipt],
                  ] as const
                ).map(([kind, label, Icon]) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={!selectedTx}
                    onClick={() => setDocKind(kind)}
                    title={
                      !selectedTx
                        ? 'Selecione uma transação para gerar o documento.'
                        : undefined
                    }
                    className="flex items-center gap-1.5 rounded-full bg-[var(--shell-black)] px-4 py-2.5 text-[14px] font-semibold text-[var(--shell-on-black)] disabled:bg-[#E5E5E5] disabled:text-[#9CA3AF]"
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
              {!selectedTx && (
                <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
                  Selecione uma transação para gerar o documento.
                </p>
              )}
            </>
          )}

          {generated && selectedTx && docKind && (
            <div className="mt-5">
              <h3 className="text-[15px] font-bold">{DOC_META[docKind].title}</h3>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-[16px] bg-[var(--shell-surface-2)] p-4 text-[13px] leading-relaxed">
                {generated}
              </pre>
              <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
                Os campos [NOME] e [CPF/CNPJ] ficam para você completar — a LeadsTap
                não tem o documento do cliente.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadTxt(
                      `${DOC_META[docKind].file}-${selectedTx.id.slice(0, 8)}.txt`,
                      generated
                    )
                  }
                  className="flex items-center gap-1.5 rounded-full bg-[var(--shell-lima)] px-4 py-2.5 text-[14px] font-semibold text-black"
                >
                  <Download className="w-4 h-4" /> Baixar .txt
                </button>
                <button
                  type="button"
                  onClick={copyText}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-2.5 text-[14px] font-semibold"
                >
                  <Copy className="w-4 h-4" /> {copied ? 'Copiado' : 'Copiar texto'}
                </button>
              </div>
            </div>
          )}
        </WhiteCard>
      </motion.div>
    </div>
  );
};
