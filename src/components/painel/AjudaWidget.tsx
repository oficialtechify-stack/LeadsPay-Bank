import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, CircleHelp, Search, X } from 'lucide-react';
import { inputClass } from '../ui';

/**
 * Central de Ajuda — U25 (v3.1 §8-U25, Apêndice A).
 * Painel com as 6 FAQ, busca local, abas Início / Mensagens / Ajuda.
 * "Mensagens" é honesta (sem canal de suporte); "Enviar uma mensagem"
 * é desabilitado. NENHUM caminho aqui leva ao bot falso (desmontado).
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'O que é a LeadsTap?',
    a: 'A carteira da LeadsPay: você vende, cobra e acompanha o seu dinheiro no mesmo lugar.',
  },
  {
    q: 'Meu saldo aqui é dinheiro de verdade?',
    a: 'Seu saldo aqui é o registro das suas vendas e recebimentos dentro da LeadsTap. O saque para conta bancária ainda não está disponível.',
  },
  {
    q: 'Como recebo um Pix?',
    a: 'Compartilhe sua chave Pix (e-mail ou telefone) com quem vai pagar. O Pix aqui funciona entre contas LeadsTap.',
  },
  {
    q: 'O que é o Tap?',
    a: 'Na aba Vendas, você gera um código de 6 letras e o cliente paga com ele. A taxa por venda é R$ 0,99, mostrada antes de confirmar.',
  },
  {
    q: 'O cartão virtual paga compras?',
    a: 'Não. O cartão virtual é só a identificação da sua conta por enquanto — pagamentos com ele ainda não funcionam.',
  },
  {
    q: 'Como sei se minha conta foi aprovada?',
    a: 'Você acompanha o andamento na tela de pendência. Quando for aprovada, o acesso à área logada libera sozinho.',
  },
];

export const AjudaWidget: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [tab, setTab] = useState<'inicio' | 'mensagens' | 'ajuda'>('inicio');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filtered = FAQ.filter(
    (f) =>
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.a.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed bottom-24 right-6 z-50" role="dialog" aria-label="Central de Ajuda">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex max-h-[70vh] w-[calc(100vw-3rem)] max-w-md flex-col overflow-hidden rounded-[24px] border border-[var(--shell-border)] bg-[var(--shell-surface)] text-[var(--shell-text)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--shell-border)] px-5 py-4">
          <h2 className="flex items-center gap-2 text-[18px] font-bold tracking-[-0.02em]">
            <CircleHelp className="w-5 h-5" /> Como podemos ajudar?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Central de Ajuda"
            className="rounded-full p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[var(--shell-border)] px-5 pt-3">
          {(
            [
              ['inicio', 'Início'],
              ['mensagens', 'Mensagens'],
              ['ajuda', 'Ajuda'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`border-b-2 px-1 pb-2 text-[14px] font-semibold transition-colors ${
                tab === id
                  ? 'border-zinc-950 text-zinc-950'
                  : 'border-transparent text-[var(--shell-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'mensagens' ? (
            <p className="text-[14px] leading-relaxed text-[var(--shell-muted)]">
              Nenhuma mensagem — o chat de suporte ainda não está disponível.
            </p>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-[var(--shell-muted)]" />
                <input
                  className={`${inputClass} pl-10`}
                  placeholder="Buscar na ajuda"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="mt-4 space-y-2">
                {filtered.length === 0 && (
                  <p className="text-[14px] text-[var(--shell-muted)]">
                    Nenhum resultado para essa busca.
                  </p>
                )}
                {filtered.map((f) => {
                  const idx = FAQ.indexOf(f);
                  const open = openFaq === idx;
                  return (
                    <div
                      key={f.q}
                      className="overflow-hidden rounded-[16px] border border-[var(--shell-border)]"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : idx)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[14px] font-semibold"
                      >
                        {f.q}
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {open && (
                        <p className="px-4 pb-3 text-[14px] leading-relaxed text-[var(--shell-muted)]">
                          {f.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[var(--shell-border)] p-4">
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-[#e5e5e5] py-3.5 text-[15px] font-semibold text-[#9ca3af]"
            title="Enviar mensagem ainda não disponível — sem canal de suporte no momento."
          >
            Enviar uma mensagem
          </button>
          <p className="mt-2 text-center text-[12px] text-[var(--shell-muted)]">
            Enviar mensagem ainda não disponível — sem canal de suporte no momento.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
