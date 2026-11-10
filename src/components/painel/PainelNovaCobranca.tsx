import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, HandCoins, Repeat } from 'lucide-react';
import { BackButton, inputClass, SoonBadge, SPRING, WhiteCard } from '../ui';
import { SyncBanner } from './shared';
import type { PainelProps } from './types';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FEE = 0.99;

const parseValor = (raw: string): number => {
  const normalized = raw.trim().replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

/**
 * U8 — Nova cobrança (v3.1 §8-U8).
 * "Cobrança única" vai pelo trilho EXISTENTE: o Tap (LeadsTapModal,
 * código de 6 letras). O formulário define a cobrança (cliente, valor,
 * descrição) e o resumo mostra a taxa de R$ 0,99 antes de confirmar.
 * Prefill NÃO é possível: `onOpenTap` não recebe argumentos e o
 * LeadsTapModal não tem props de pré-preenchimento — o valor é
 * confirmado de novo dentro do Tap, e a tela diz isso. Nada é gravado
 * aqui: nenhuma transação é criada por este formulário.
 * "Cobrança recorrente" fica desabilitada com o motivo exato do plano.
 */
export const PainelNovaCobranca: React.FC<PainelProps> = ({
  navigate,
  onOpenTap,
  syncState,
}) => {
  const [cliente, setCliente] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [descricao, setDescricao] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valor = useMemo(() => parseValor(valorStr), [valorStr]);
  const valorValido = valor > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorValido) {
      setError('Informe um valor maior que zero para gerar a cobrança.');
      return;
    }
    setError(null);
    onOpenTap();
  };

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <BackButton onClick={() => navigate({ name: 'gestao' })} label="Voltar para Gestão de Cobrança" />
        <h1 className="mt-2 text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
          Nova cobrança
        </h1>
        <p className="mt-1 text-sm text-[var(--shell-muted)]">
          Escolha o tipo de cobrança. A cobrança única usa o Tap que já existe.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cobrança única — trilho Tap existente. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
        >
          <WhiteCard>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--shell-lima)]">
                <HandCoins className="h-6 w-6 text-zinc-950" />
              </span>
              <div>
                <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
                  Cobrança única
                </h2>
                <p className="text-[13px] text-[var(--shell-muted)]">
                  Gere um código Tap e receba na hora.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-[var(--shell-text)]">
                Cliente
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome de quem vai pagar"
                  aria-label="Cliente"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--shell-text)]">
                Valor (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorStr}
                  onChange={(e) => {
                    setValorStr(e.target.value);
                    setError(null);
                  }}
                  placeholder="0,00"
                  aria-label="Valor da cobrança em reais"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--shell-text)]">
                Descrição
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="O que está sendo cobrado"
                  aria-label="Descrição da cobrança"
                  className={`${inputClass} mt-1`}
                />
              </label>

              <div className="rounded-[16px] bg-[var(--shell-surface-2)] p-4 text-sm">
                <p className="font-semibold text-[var(--shell-text)]">Resumo da cobrança</p>
                <p className="mt-2 flex justify-between text-[var(--shell-muted)]">
                  <span>Cliente</span>
                  <span className="font-semibold text-[var(--shell-text)]">
                    {cliente.trim() || '—'}
                  </span>
                </p>
                <p className="mt-1 flex justify-between text-[var(--shell-muted)]">
                  <span>Valor</span>
                  <span className="font-semibold text-[var(--shell-text)] tabular-nums">
                    {valorValido ? brl(valor) : '—'}
                  </span>
                </p>
                <p className="mt-1 flex justify-between text-[var(--shell-muted)]">
                  <span>Taxa por venda</span>
                  <span className="font-semibold text-[var(--shell-text)] tabular-nums">
                    {brl(FEE)}
                  </span>
                </p>
                {descricao.trim() && (
                  <p className="mt-1 text-[13px] text-[var(--shell-muted)]">{descricao.trim()}</p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm font-semibold text-[var(--shell-bad-text)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--shell-black)] py-3.5 text-[15px] font-semibold text-[var(--shell-on-black)]"
              >
                Gerar código Tap
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[13px] leading-relaxed text-[var(--shell-muted)]">
                O código do Tap é gerado no próximo passo, onde você confirma o valor — o
                formulário não grava a cobrança sozinho.
              </p>
            </form>
          </WhiteCard>
        </motion.div>

        {/* Cobrança recorrente — sem trilho, desabilitada. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <WhiteCard>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--shell-surface-2)]">
                <Repeat className="h-6 w-6 text-zinc-950" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
                    Cobrança recorrente
                  </h2>
                  <SoonBadge reason="Cobrança recorrente precisa do trilho da LeadsPay — ainda não ligada." />
                </div>
                <p className="text-[13px] text-[var(--shell-muted)]">
                  Cobre todo mês, sem gerar código novo.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--shell-muted)]">
              Cobrança recorrente precisa do trilho da LeadsPay — ainda não ligada.
            </p>
            <button
              type="button"
              disabled
              title="Cobrança recorrente precisa do trilho da LeadsPay — ainda não ligada."
              className="mt-4 w-full rounded-full bg-[#E5E5E5] py-3.5 text-[15px] font-semibold text-[#9CA3AF]"
            >
              Criar recorrência
            </button>
          </WhiteCard>
        </motion.div>
      </div>
    </div>
  );
};
