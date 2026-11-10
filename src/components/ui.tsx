import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import type { TopTabName } from '../lib/routes';
import { TOP_TABS } from '../lib/routes';

/**
 * Primitivos visuais do tema claro — layout e sistema visual dos prints
 * (fundo branco, cards cinza claro, pílulas pretas, verde-limão só em
 * selos e detalhes), com movimento suave: springs sem bounce, resposta
 * no toque, só transform/opacity, animações abaixo de 300ms.
 *
 * Nada aqui copia marca ou texto do InfinitePay: só layout e sistema visual.
 * Adaptado ao modelo de dados do Bank (sem LedgerEntry / lib/leadstap).
 */

export const SPRING = { type: 'spring', stiffness: 350, damping: 35, mass: 1 } as const;

/** Spring padrão do painel novo (v3.2 §D7.2): stiffness/damping com números. */

/** Abas do topo em pílula — ativa preta com texto branco; nula em rota interna. */
export const TopPillTabs: React.FC<{
  active: TopTabName | null;
  onSelect: (tab: TopTabName) => void;
}> = ({ active, onSelect }) => (
  <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl">
    <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex gap-1 overflow-x-auto no-scrollbar">
      {TOP_TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <motion.button
            key={t.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={SPRING}
            onClick={() => onSelect(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-semibold ${
              isActive ? 'bg-zinc-950 text-white' : 'text-zinc-500'
            }`}
          >
            {t.label}
          </motion.button>
        );
      })}
    </div>
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[20px] font-bold tracking-[-0.02em] text-zinc-950">{children}</h2>
);

/** Card cinza claro — a superfície padrão das telas (tokens do shell novo). */
export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <section className={`rounded-[20px] bg-[var(--shell-surface-2)] p-5 ${className}`}>{children}</section>
);

/** Card branco com borda fina — para listas e linhas de conta. */
export const WhiteCard: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <section className={`rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-surface)] p-5 ${className}`}>
    {children}
  </section>
);

/** Selo verde-limão "Em breve" — função que ainda não existe (v3.2 §D7.5:
 *  aceita `reason` para dizer o motivo em uma linha, quando houver). */
export const SoonBadge: React.FC<{ reason?: string }> = ({ reason }) => (
  <span
    className="inline-flex items-center rounded-full bg-[var(--shell-lima)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-950"
    title={reason}
  >
    Em breve{reason ? ` — ${reason}` : ''}
  </span>
);

type IconTone = 'violet' | 'green' | 'dark' | 'amber' | 'blue';

const TONE_GRADIENT: Record<IconTone, string> = {
  violet: 'from-violet-500 via-fuchsia-400 to-violet-400',
  green: 'from-emerald-400 via-lime-400 to-emerald-500',
  dark: 'from-zinc-700 via-zinc-800 to-zinc-950',
  amber: 'from-amber-400 via-orange-400 to-amber-500',
  blue: 'from-sky-400 via-indigo-400 to-sky-500',
};

/** Ícone quadrado com gradiente — evoca os tiles coloridos dos prints. */
export const AppIcon: React.FC<{
  Icon: React.ComponentType<{ className?: string }>;
  tone?: IconTone;
  size?: 'md' | 'lg';
}> = ({ Icon, tone = 'violet', size = 'md' }) => (
  <span
    className={`relative inline-flex items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br text-white shadow-sm ${
      TONE_GRADIENT[tone]
    } ${size === 'lg' ? 'w-14 h-14' : 'w-11 h-11'}`}
  >
    <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-black/10" />
    <Icon className={`relative ${size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'}`} />
  </span>
);

/** Tile da grade 2/3/4 colunas: ícone + rótulo, com selo opcional. */
export const ActionTile: React.FC<{
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: IconTone;
  badge?: 'novo' | 'breve';
  onClick: () => void;
}> = ({ Icon, label, tone = 'violet', badge, onClick }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.96 }}
    transition={SPRING}
    onClick={onClick}
    className="flex flex-col items-start gap-3 rounded-[24px] bg-[#f4f4f5] p-4 text-left"
  >
    <span className="relative">
      <AppIcon Icon={Icon} tone={tone} />
      {badge === 'breve' && (
        <span className="absolute -bottom-2 -right-2">
          <SoonBadge />
        </span>
      )}
    </span>
    <span className="text-[14px] font-semibold leading-tight text-zinc-900">{label}</span>
  </motion.button>
);

/** Botão principal — preto (ação) ou verde (confirmação). */
export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'black' | 'green' | 'outline';
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ children, onClick, variant = 'black', disabled, type = 'button' }) => (
  <motion.button
    type={type}
    whileTap={disabled ? undefined : { scale: 0.97 }}
    transition={SPRING}
    onClick={onClick}
    disabled={disabled}
    className={`w-full rounded-full py-3.5 text-[15px] font-semibold disabled:opacity-40 ${
      variant === 'black'
        ? 'bg-[var(--shell-black)] text-[var(--shell-on-black)]'
        : variant === 'green'
          ? 'bg-[var(--shell-lima)] text-black'
          : 'border border-[var(--shell-border)] bg-[var(--shell-surface)] text-[var(--shell-text)]'
    }`}
  >
    {children}
  </motion.button>
);

export const inputClass =
  'w-full rounded-2xl bg-[var(--shell-surface-2)] border border-[var(--shell-border)] px-4 py-3 text-[15px] text-[var(--shell-text)] placeholder:text-[var(--shell-muted)] outline-none focus:border-[var(--shell-text)]';

/** Botão Voltar das telas internas. */
export const BackButton: React.FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label = 'Voltar',
}) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.95 }}
    transition={SPRING}
    onClick={onClick}
    className="flex items-center gap-1 -ml-2 rounded-full px-2 py-1 text-[15px] font-semibold text-zinc-900"
  >
    <ChevronLeft className="w-5 h-5" />
    {label}
  </motion.button>
);

export const EmptyState: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="rounded-[20px] bg-[var(--shell-surface-2)] p-5">
    <p className="font-semibold text-[var(--shell-text)]">{title}</p>
    <p className="text-sm text-[var(--shell-muted)] mt-1 leading-relaxed">{text}</p>
  </div>
);
