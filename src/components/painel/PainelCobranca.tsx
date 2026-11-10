import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Plus, RefreshCw, Repeat, Search, Users } from 'lucide-react';
import type { Transaction } from '../../types';
import { EmptyState, inputClass, SPRING, WhiteCard } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const TZ = 'America/Sao_Paulo';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dayKeyOf = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: TZ });

const txDayKey = (t: Transaction): string | null => {
  const ms = new Date(t.timestamp).getTime();
  return Number.isNaN(ms) ? null : dayKeyOf(new Date(ms));
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  completed: 'Concluída',
  pending: 'Pendente',
  failed: 'Não aprovado',
};

type Period = '30d' | '7d' | 'all';

const PERIOD_LABEL: Record<Period, string> = {
  '30d': 'Últ. 30 dias',
  '7d': 'Últ. 7 dias',
  all: 'Todos',
};

type StatusFilter = 'all' | Transaction['status'];
type TypeFilter = 'all' | 'tap_to_pay';

/**
 * U7 — Gestão de Cobrança (v3.1 §8-U7 + v3.2 §D6.1/§D7.5).
 * Cobranças = transações `tap_to_pay` com `amount > 0` do ledger
 * (REGISTRO INTERNO). Sem exportação de CSV aqui (§D6.1: só U3 e U17
 * exportam). "Atualizar página" re-anexa as 3 inscrições via
 * `onRefresh` (App, v3.2 §D7.5) — nunca `window.location.reload()`.
 */
export const PainelCobranca: React.FC<PainelProps> = ({
  transactions,
  navigate,
  syncState,
  onRefresh,
}) => {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<Period>('30d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const loading = syncState.loading && transactions.length === 0;

  const nowSp = useMemo(
    () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ })),
    []
  );

  const charges = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = new Date(nowSp);
    if (period === '30d') start.setDate(start.getDate() - 30);
    if (period === '7d') start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    const startKey = period === 'all' ? null : dayKeyOf(start);
    const todayKey = dayKeyOf(nowSp);

    return transactions
      .filter((t) => t.type === 'tap_to_pay' && t.amount > 0)
      .filter((t) => {
        if (q) {
          const hay = `${t.title} ${t.recipientOrSender ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        const k = txDayKey(t);
        if (k === null) return true; // sem data válida: exibe, não entra no filtro por data
        if (startKey && k < startKey) return false;
        if (k > todayKey) return false;
        return true;
      })
      .map((t) => ({ t, ms: new Date(t.timestamp).getTime() }))
      .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms))
      .map((x) => x.t);
  }, [transactions, query, period, statusFilter, typeFilter, nowSp]);

  const refreshReason = onRefresh
    ? 'Recarrega os dados da conta (re-anexa as inscrições do Firestore).'
    : 'Atualização manual ainda não disponível — os dados chegam sozinhos quando mudam.';

  const refreshButton = (
    <button
      type="button"
      disabled={!onRefresh}
      title={refreshReason}
      onClick={() => onRefresh?.()}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${
        onRefresh
          ? 'bg-[var(--shell-black)] text-[var(--shell-on-black)]'
          : 'bg-[#E5E5E5] text-[#9CA3AF]'
      }`}
    >
      <RefreshCw className="w-4 h-4" />
      Atualizar página
    </button>
  );

  const shortcuts = [
    {
      label: 'Criar cobrança',
      Icon: Plus,
      onClick: () => navigate({ name: 'nova-cobranca' }),
    },
    {
      label: 'Planos e Assinaturas',
      Icon: Repeat,
      onClick: () => navigate({ name: 'planos' }),
    },
    {
      label: 'Seus Clientes',
      Icon: Users,
      onClick: () => navigate({ name: 'clientes' }),
    },
  ];

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <WhiteCard>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
            Gestão de Cobrança
          </h1>
          <p className="mt-1 text-sm text-[var(--shell-muted)]">
            Cobranças do seu registro interno · REGISTRO INTERNO
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={s.onClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--shell-black)] px-4 py-2.5 text-sm font-semibold text-[var(--shell-on-black)]"
              >
                <s.Icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>
        </WhiteCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
      >
        <WhiteCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-[var(--shell-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por cliente ou descrição"
                aria-label="Buscar cobrança"
                className={`${inputClass} pl-11`}
              />
            </div>
            {refreshButton}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  period === p
                    ? 'bg-[var(--shell-black)] text-[var(--shell-on-black)]'
                    : 'bg-[var(--shell-surface-2)] text-[var(--shell-text)]'
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
              Filtros · Status
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--shell-text)] outline-none"
              >
                <option value="all">Todos</option>
                <option value="completed">Concluída</option>
                <option value="pending">Pendente</option>
                <option value="failed">Não aprovado</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--shell-muted)]">
              Tipo
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--shell-text)] outline-none"
              >
                <option value="all">Todos</option>
                <option value="tap_to_pay">Tap</option>
              </select>
            </label>
          </div>
        </WhiteCard>
      </motion.div>

      {loading ? (
        <WhiteCard>
          <Skeleton lines={5} />
        </WhiteCard>
      ) : charges.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <EmptyState
            title="Sem cobranças no período."
            text="Nenhuma cobrança encontrada com esses filtros. As cobranças feitas pelo Tap aparecem aqui."
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {refreshButton}
            <p className="max-w-md text-[13px] text-[var(--shell-muted)]">{refreshReason}</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <WhiteCard>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-[var(--shell-border)] text-[13px] text-[var(--shell-muted)]">
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Descrição</th>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((t) => (
                  <tr key={t.id} className="border-b border-[var(--shell-border)] last:border-0">
                    <td className="px-5 py-3 text-sm font-semibold text-[var(--shell-text)]">
                      {t.recipientOrSender || '—'}
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-sm text-[var(--shell-text)]">
                      {t.description || t.title}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-[var(--shell-muted)]">
                      {t.dateFormatted}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                          t.status === 'completed'
                            ? 'bg-[var(--shell-ok-bg)] text-[var(--shell-ok-text)]'
                            : t.status === 'pending'
                              ? 'bg-[var(--shell-warn-bg)] text-[var(--shell-warn-text)]'
                              : 'bg-[var(--shell-bad-bg)] text-[var(--shell-bad-text)]'
                        }`}
                      >
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-bold tabular-nums text-[var(--shell-ok-text)]">
                      +{brl(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </WhiteCard>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-[var(--shell-muted)]">
            <FileText className="w-4 h-4" />
            Cobranças do Tap · REGISTRO INTERNO
          </p>
        </motion.div>
      )}
    </div>
  );
};
