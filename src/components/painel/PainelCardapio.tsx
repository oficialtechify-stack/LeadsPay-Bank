import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Link2, MessageCircle, RefreshCw, UtensilsCrossed } from 'lucide-react';
import { PrimaryButton, SoonBadge, SPRING, WhiteCard } from '../ui';
import { SyncBanner } from './shared';
import type { PainelProps } from './types';

const REASON = 'Cardápio ainda não disponível na LeadsTap.';

/** Benefícios do §D5.2 (v3.2) — genéricos, sem números prometidos. */
const BENEFITS = [
  { Icon: UtensilsCrossed, label: 'Monte seu cardápio' },
  { Icon: Link2, label: 'Compartilhe com um link' },
  { Icon: MessageCircle, label: 'Pedidos no seu WhatsApp' },
  { Icon: RefreshCw, label: 'Atualize quando quiser' },
];

/**
 * U15 — Cardápio (v3.1 §8-U15, v3.2 §D5.2).
 * Onboarding em 2 colunas (bloco de cor + ícone no lugar de foto),
 * mesmo padrão da U12, 4 benefícios. Sem item de cardápio inventado:
 * botão desabilitado com o motivo.
 */
export const PainelCardapio: React.FC<PainelProps> = ({ syncState }) => (
  <div>
    <SyncBanner syncState={syncState} />

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0 }}
    >
      <WhiteCard className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="flex min-h-[220px] items-center justify-center rounded-[20px] bg-[#EDE9FE]">
          <UtensilsCrossed className="h-10 w-10 text-[var(--shell-muted)]" />
        </div>
        <div>
          <SoonBadge reason={REASON} />
          <h1 className="mt-3 text-[26px] md:text-[32px] font-bold leading-tight tracking-[-0.02em] text-[var(--shell-text)]">
            Seu cardápio online
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--shell-muted)]">
            Monte o cardápio do seu negócio, compartilhe o link e receba os
            pedidos direto no seu WhatsApp.
          </p>
          <ul className="mt-5 space-y-3">
            {BENEFITS.map(({ Icon, label }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.05 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
                  <Icon className="h-5 w-5 text-[var(--shell-text)]" />
                </span>
                <span className="text-[15px] font-semibold text-[var(--shell-text)]">
                  {label}
                </span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-6 max-w-[260px]" title={REASON}>
            <PrimaryButton onClick={() => undefined} disabled>
              Vamos começar
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </PrimaryButton>
          </div>
          <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{REASON}</p>
        </div>
      </WhiteCard>
    </motion.div>
  </div>
);
