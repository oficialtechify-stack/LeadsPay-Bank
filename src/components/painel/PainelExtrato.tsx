import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Search } from 'lucide-react';
import type { Transaction } from '../../types';
import { EmptyState, inputClass, SPRING, WhiteCard } from '../ui';
import { EyeValue, Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const TZ = 'America/Sao_Paulo';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dayKeyOf = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: TZ });

const txMs = (t: Transaction) => new Date(t.timestamp).getTime();

const txDayKey = (t: Transaction): string | null => {
  const ms = txMs(t);
  return Number.isNaN(ms) ? null : dayKeyOf(new Date(ms));
};

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

type Period = '30d' | '7d' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  '30d': 'Últimos 30 dias',
  '7d': 'Últimos 7 dias',
  month: 'Este mês',
};

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** U3 — Seu extrato (v3.1 §8-U3 + v3.2 §D6.1/§D7.5). Ledger = REGISTRO INTERNO. */
export const PainelExtrato: React.FC<PainelProps> = ({
  userProfile,
  transactions,
  showBalance,
  onToggleBalance,
  syncState,
}) => {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<Period>('30d');
  const loading = syncState.loading && transactions.length === 0;

  const nowSp = useMemo(
    () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ })),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = new Date(nowSp);
    if (period === '30d') start.setDate(start.getDate() - 30);
    if (period === '7d') start.setDate(start.getDate() - 7);
    if (period === 'month') start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const startKey = dayKeyOf(start);
    const todayKey = dayKeyOf(nowSp);

    return transactions
      .filter((t) => {
        if (q) {
          const hay = `${t.title} ${t.description} ${t.recipientOrSender ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        const k = txDayKey(t);
        if (k === null) return true; // sem data válida: exibe, não entra nas contas por data
        return k >= startKey && k <= todayKey;
      })
      .map((t) => ({ t, ms: txMs(t) }))
      .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms))
      .map((x) => x.t);
  }, [transactions, query, period, nowSp]);

  const groups = useMemo(() => {
    const out: { label: string; items: Transaction[] }[] = [];
    for (const t of filtered) {
      const label = txDayKey(t) ?? t.dateFormatted;
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [filtered]);

  const exportCsv = () => {
    const yyyymmdd = new Date()
      .toLocaleDateString('en-CA', { timeZone: TZ })
      .replace(/-/g, '');
    const rows: string[][] = [
      ['Data', 'Tipo', 'Descrição', 'Valor (R$)', 'Status'],
      ...filtered.map((t) => [
        t.dateFormatted,
        TYPE_LABEL[t.type],
        t.description || t.title,
        t.amount >= 0 ? `+${brl(t.amount)}` : brl(t.amount),
        STATUS_LABEL[t.status],
      ]),
    ];
    downloadCsv(`leads-tap-extrato-${yyyymmdd}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        <WhiteCard>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
            Seu extrato
          </h1>
          <p className="mt-1 text-sm text-[var(--shell-muted)]">
            Saldo interno da LeadsTap · REGISTRO INTERNO
          </p>
          <p className="mt-2 text-[28px] font-bold text-[var(--shell-text)]">
            <EyeValue
              value={brl(userProfile.balance ?? 0)}
              show={showBalance}
              onToggle={onToggleBalance}
            />
          </p>
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
                placeholder="Pesquisar"
                aria-label="Pesquisar no extrato"
                className={`${inputClass} pl-11`}
              />
            </div>
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--shell-black)] px-4 py-3 text-sm font-semibold text-[var(--shell-on-black)]"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            )}
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
        </WhiteCard>
      </motion.div>

      {loading ? (
        <WhiteCard>
          <Skeleton lines={6} />
        </WhiteCard>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sem lançamentos no período."
          text="Nenhuma transação encontrada com esses filtros."
        />
      ) : (
        groups.map((g, gi) => (
          <motion.div
            key={g.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: gi * 0.05 }}
          >
            <WhiteCard>
              <h2 className="text-[16px] font-bold text-[var(--shell-text)]">{g.label}</h2>
              <ul className="mt-3 divide-y divide-[var(--shell-border)]">
                {g.items.map((t) => {
                  const failed = t.status === 'failed';
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
                          {t.title || TYPE_LABEL[t.type]}
                        </p>
                        <p className="truncate text-[13px] text-[var(--shell-muted)]">
                          {t.description || TYPE_LABEL[t.type]}
                          {t.recipientOrSender ? ` · ${t.recipientOrSender}` : ''}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                            t.status === 'completed'
                              ? 'bg-[var(--shell-ok-bg)] text-[var(--shell-ok-text)]'
                              : t.status === 'pending'
                                ? 'bg-[var(--shell-warn-bg)] text-[var(--shell-warn-text)]'
                                : 'bg-[var(--shell-bad-bg)] text-[var(--shell-bad-text)]'
                          }`}
                        >
                          {STATUS_LABEL[t.status]}
                        </span>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          failed ? 'line-through text-[var(--shell-muted)]' : ''
                        } ${t.amount > 0 ? 'text-[var(--shell-ok-text)]' : 'text-[var(--shell-text)]'}`}
                      >
                        {t.amount > 0 ? '+' : ''}
                        {brl(t.amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </WhiteCard>
          </motion.div>
        ))
      )}
    </div>
  );
};
