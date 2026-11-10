import React from 'react';
import { motion } from 'motion/react';
import { Check, HandCoins } from 'lucide-react';
import { SoonBadge, SPRING, WhiteCard } from '../ui';
import { SyncBanner } from './shared';
import type { PainelProps } from './types';

/** Checklist do §D5.3 — itens genéricos, SEM números, SEM promessa. */
const CHECKLIST = [
  'Taxas claras por dia, sem surpresa',
  'Pagamento em poucas parcelas',
  'Desconto direto das suas vendas',
];

/** U5 — Empréstimo Inteligente (v3.1 §8-U5 + v3.2 §D5.3). Sem valor aprovado. */
export const PainelEmprestimo: React.FC<PainelProps> = ({ syncState }) => (
  <div className="space-y-4">
    <SyncBanner syncState={syncState} />

    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
      <WhiteCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Bloco de cor + ícone no lugar de foto (§5 — sem ilustração copiada). */}
          <span className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-[20px] bg-[#EDE9FE]">
            <HandCoins className="h-10 w-10 text-zinc-950" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
                Empréstimo Inteligente
              </h1>
              <SoonBadge reason="Empréstimo ainda não disponível na LeadsTap." />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--shell-muted)]">
              Em breve — empréstimo ainda não disponível na LeadsTap.
            </p>
          </div>
        </div>
      </WhiteCard>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.05 }}
    >
      <WhiteCard>
        <h2 className="text-[16px] font-bold text-[var(--shell-text)]">Como vai funcionar</h2>
        <ul className="mt-3 space-y-3">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--shell-lima)]">
                <Check className="h-4 w-4 text-zinc-950" />
              </span>
              <span className="text-sm font-medium text-[var(--shell-text)]">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-[var(--shell-border)] pt-4 text-sm leading-relaxed text-[var(--shell-muted)]">
          O Empréstimo Inteligente ainda não está disponível na LeadsTap. Quando estiver, as
          condições aparecem aqui.
        </p>
      </WhiteCard>
    </motion.div>
  </div>
);
