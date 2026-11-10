import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState, SPRING, WhiteCard, inputClass } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const REASON = 'Cadastro de produtos ainda não disponível — a loja da LeadsTap ainda não está ativa.';

/**
 * U14 — Seu catálogo (v3.1 §8-U14).
 * Não existe coleção de produtos — lista vazia honesta, sem produto
 * inventado. Busca filtra a lista real (vazia); "+ Adicionar" e
 * "Filtros" desabilitados com o motivo.
 */
export const PainelCatalogo: React.FC<PainelProps> = ({ syncState }) => {
  const [query, setQuery] = useState('');

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
              Seu catálogo
            </h1>
            <p className="mt-1 text-sm text-[var(--shell-muted)]">
              Os produtos da sua loja, em um só lugar.
            </p>
          </div>
          <button
            type="button"
            disabled
            title={REASON}
            className="flex items-center gap-2 rounded-full bg-[var(--shell-black)] px-5 py-3 text-sm font-semibold text-[var(--shell-on-black)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            style={{ paddingLeft: 40 }}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          disabled
          title={REASON}
          className="flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] px-5 py-3 text-sm font-semibold text-[var(--shell-text)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="mt-4"
      >
        {syncState.loading ? (
          <WhiteCard>
            <Skeleton lines={4} />
          </WhiteCard>
        ) : (
          <WhiteCard>
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-2 border-b border-[var(--shell-border)] pb-3 text-[13px] font-semibold text-[var(--shell-muted)] md:grid">
              <span>Produto</span>
              <span>Preço</span>
              <span>Estoque</span>
              <span className="text-right">Status</span>
            </div>
            <div className="mt-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
                <Package className="h-7 w-7 text-[var(--shell-muted)]" />
              </div>
              <div className="mt-4">
                <EmptyState
                  title="Você ainda não tem produtos cadastrados."
                  text="Quando a loja da LeadsTap estiver ativa, você cadastra produtos aqui e eles aparecem no seu catálogo."
                />
              </div>
              <p className="mt-3 text-[13px] text-[var(--shell-muted)]">{REASON}</p>
            </div>
          </WhiteCard>
        )}
      </motion.div>
    </div>
  );
};
