import React from 'react';
import { motion } from 'motion/react';
import { Package, Settings, Share2, Store } from 'lucide-react';
import { EmptyState, PrimaryButton, SPRING, WhiteCard } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const REASON = 'A loja da LeadsTap ainda não está ativa.';

/**
 * U10 — Sua Loja Online (v3.1 §8-U10).
 * Pedidos: não existe coleção de pedidos/loja — vazio honesto.
 * Atalhos e "Novo Produto" desabilitados com o motivo.
 */
export const PainelLoja: React.FC<PainelProps> = ({ syncState }) => {
  const shortcuts = [
    { Icon: Share2, label: 'Compartilhar loja' },
    { Icon: Package, label: 'Seu catálogo' },
    { Icon: Settings, label: 'Configurar' },
  ];

  return (
    <div>
      <SyncBanner syncState={syncState} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] md:text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
              Sua Loja Online
            </h1>
            <p className="mt-1 text-sm text-[var(--shell-muted)]">
              Venda online com a sua vitrine da LeadsTap.
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px]" title={REASON}>
            <PrimaryButton onClick={() => undefined} disabled>
              Novo Produto
            </PrimaryButton>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="mt-4 grid grid-cols-3 gap-3"
      >
        {shortcuts.map(({ Icon, label }) => (
          <button
            key={label}
            type="button"
            disabled
            title={REASON}
            className="flex flex-col items-start gap-3 rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-surface)] p-4 text-left disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--shell-surface-2)]">
              <Icon className="h-6 w-6 text-[var(--shell-text)]" />
            </span>
            <span className="text-sm font-semibold leading-tight text-[var(--shell-text)]">
              {label}
            </span>
          </button>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="mt-2 text-[13px] text-[var(--shell-muted)]"
      >
        {REASON}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.15 }}
        className="mt-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <Store className="h-5 w-5 text-[var(--shell-text)]" />
          <h2 className="text-[16px] font-bold text-[var(--shell-text)]">Pedidos</h2>
        </div>
        {syncState.loading ? (
          <WhiteCard>
            <Skeleton lines={4} />
          </WhiteCard>
        ) : (
          <WhiteCard>
            <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-2 border-b border-[var(--shell-border)] pb-3 text-[13px] font-semibold text-[var(--shell-muted)] md:grid">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Data</span>
              <span>Status</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="mt-4">
              <EmptyState
                title="Você ainda não tem pedidos."
                text="Quando a sua loja estiver ativa, os pedidos feitos nela aparecem aqui."
              />
            </div>
          </WhiteCard>
        )}
      </motion.div>
    </div>
  );
};
