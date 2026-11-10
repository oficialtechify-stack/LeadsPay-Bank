import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Repeat, Search } from 'lucide-react';
import { EmptyState, PrimaryButton, SPRING, WhiteCard, inputClass } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const REASON = 'Assinaturas precisam do trilho da LeadsPay — ainda não ligado.';

/**
 * U11 — Planos e Recorrências (v3.1 §8-U11).
 * Não existe coleção de planos: todos os contadores são zero honesto.
 * "Criar Assinatura" desabilitado com o motivo.
 */
export const PainelPlanos: React.FC<PainelProps> = ({ syncState }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [sort, setSort] = useState('recentes');

  const vencimentos = [
    { label: 'Vencem hoje', value: 0 },
    { label: 'Vencem esta semana', value: 0 },
    { label: 'Vencem este mês', value: 0 },
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
              Planos e Recorrências
            </h1>
            <p className="mt-1 text-sm text-[var(--shell-muted)]">
              0 planos / 0 cobranças ativas
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[180px]" title={REASON}>
            <PrimaryButton onClick={() => undefined} disabled>
              Criar Assinatura
            </PrimaryButton>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {vencimentos.map(({ label, value }) => (
          <WhiteCard key={label}>
            <p className="text-[13px] text-[var(--shell-muted)]">{label}</p>
            <p className="mt-1 text-[28px] font-bold leading-none tabular-nums text-[var(--shell-text)]">
              {value}
            </p>
          </WhiteCard>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="mt-4"
      >
        <WhiteCard>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-[var(--shell-text)]">
              Assinaturas Ativas
            </p>
            <span className="rounded-full bg-[var(--shell-surface-2)] px-3 py-1 text-sm font-bold tabular-nums text-[var(--shell-text)]">
              0
            </span>
          </div>
        </WhiteCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.15 }}
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar plano"
            aria-label="Buscar plano"
            style={{ paddingLeft: 40 }}
            className={inputClass}
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por status"
            className={inputClass}
          >
            <option value="todos">Todos os status</option>
            <option value="ativas">Ativas</option>
            <option value="vencidas">Vencidas</option>
            <option value="canceladas">Canceladas</option>
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Ordenar planos"
            className={inputClass}
          >
            <option value="recentes">Mais recentes</option>
            <option value="valor">Maior valor</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </div>
        <button
          type="button"
          disabled
          title="Nenhum plano para exportar."
          className="flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] px-5 py-3 text-sm font-semibold text-[var(--shell-text)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileText className="h-4 w-4" />
          Relatório
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.2 }}
        className="mt-4"
      >
        {syncState.loading ? (
          <WhiteCard>
            <Skeleton lines={4} />
          </WhiteCard>
        ) : (
          <WhiteCard className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
              <Repeat className="h-7 w-7 text-[var(--shell-muted)]" />
            </div>
            <div className="mt-4">
              <EmptyState
                title="Você ainda não tem planos."
                text="Crie assinaturas e cobranças recorrentes para os seus clientes. O trilho de recorrência da LeadsPay ainda não está ligado."
              />
            </div>
            <div className="mx-auto mt-4 max-w-[240px]" title={REASON}>
              <PrimaryButton onClick={() => undefined} disabled>
                Criar assinatura
              </PrimaryButton>
            </div>
            <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{REASON}</p>
          </WhiteCard>
        )}
      </motion.div>
    </div>
  );
};
