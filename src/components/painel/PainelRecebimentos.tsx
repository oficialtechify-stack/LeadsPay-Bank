import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Transaction } from '../../types';
import { EmptyState, SPRING, WhiteCard } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const TZ = 'America/Sao_Paulo';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const spNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));

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

/**
 * Último dia útil antes de hoje (§D6.2): segunda → sexta anterior;
 * terça–sábado → dia anterior; domingo → sexta-feira.
 * (Dia útil = segunda a sexta; feriados não são conhecidos pelo calendário.)
 */
function previousBusinessDay(d: Date): Date {
  const c = new Date(d);
  const dow = c.getDay(); // 0 dom … 6 sáb
  if (dow === 1) c.setDate(c.getDate() - 3); // segunda → sexta
  else if (dow === 0) c.setDate(c.getDate() - 2); // domingo → sexta
  else c.setDate(c.getDate() - 1); // terça–sábado → dia anterior
  c.setHours(0, 0, 0, 0);
  return c;
}

type Period = 'today' | '7d' | '30d' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  month: 'Este mês',
};

/** U16 — Seus recebimentos (v3.1 §8-U16 + v3.2 §D6.2). Ledger = REGISTRO INTERNO. */
export const PainelRecebimentos: React.FC<PainelProps> = ({ transactions, syncState }) => {
  const [period, setPeriod] = useState<Period>('today');
  const loading = syncState.loading && transactions.length === 0;

  const now = useMemo(() => spNow(), []);
  const todayKey = dayKeyOf(now);
  const prevBiz = useMemo(() => previousBusinessDay(now), [now]);
  const prevBizKey = dayKeyOf(prevBiz);

  const entradas = (key: string) =>
    transactions
      .filter((t) => t.status === 'completed' && t.amount > 0 && txDayKey(t) === key)
      .reduce((s, t) => s + t.amount, 0);

  const diaUtilAnterior = entradas(prevBizKey);
  const hoje = entradas(todayKey);

  const lancamentos = useMemo(() => {
    const start = new Date(now);
    if (period === '7d') start.setDate(start.getDate() - 7);
    if (period === '30d') start.setDate(start.getDate() - 30);
    if (period === 'month') start.setDate(1);
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else start.setHours(0, 0, 0, 0);
    const startKey = dayKeyOf(start);
    return transactions
      .filter(
        (t) =>
          t.status === 'completed' &&
          t.amount > 0 &&
          (() => {
            const k = txDayKey(t);
            return k !== null && k >= startKey && k <= todayKey;
          })()
      )
      .map((t) => ({ t, ms: txMs(t) }))
      .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms))
      .map((x) => x.t);
  }, [transactions, period, now, todayKey]);

  const cardStyle =
    'rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-surface)] p-5';

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />
      <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
        Seus recebimentos
      </h1>
      <p className="text-sm text-[var(--shell-muted)]">REGISTRO INTERNO</p>

      {/* 4 cards de período (§8-U16). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          className={cardStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <p className="text-sm text-[var(--shell-muted)]">Dia útil anterior</p>
          <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
            {brl(diaUtilAnterior)}
          </p>
          <p className="text-[13px] text-[var(--shell-muted)]">
            Entradas de {prevBizKey} · REGISTRO INTERNO
          </p>
        </motion.div>
        <motion.div
          className={cardStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
        >
          <p className="text-sm text-[var(--shell-muted)]">Hoje</p>
          <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
            {brl(hoje)}
          </p>
          <p className="text-[13px] text-[var(--shell-muted)]">
            Entradas de hoje · REGISTRO INTERNO
          </p>
        </motion.div>
        <motion.div
          className={cardStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <p className="text-sm text-[var(--shell-muted)]">Próxima semana</p>
          {/* §D6.2: SÓ o texto — sem "R$ 0,00". */}
          <p className="mt-1 text-[16px] font-bold leading-snug text-[var(--shell-text)]">
            Sem recebimentos agendados.
          </p>
        </motion.div>
        <motion.div
          className={cardStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
        >
          <p className="text-sm text-[var(--shell-muted)]">Definir novo período</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                  period === p
                    ? 'bg-[var(--shell-black)] text-[var(--shell-on-black)]'
                    : 'bg-[var(--shell-surface-2)] text-[var(--shell-text)]'
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Lista de lançamentos (entradas do período). */}
      <WhiteCard>
        <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
          Lançamentos · {PERIOD_LABEL[period]}
        </h2>
        <div className="mt-4">
          {loading ? (
            <Skeleton lines={5} />
          ) : lancamentos.length === 0 ? (
            <EmptyState
              title={
                period === 'today'
                  ? 'Você não tem lançamentos hoje.'
                  : 'Você não tem lançamentos no período.'
              }
              text="Quando você receber, os lançamentos aparecem aqui."
            />
          ) : (
            <ul className="divide-y divide-[var(--shell-border)]">
              {lancamentos.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
                      {t.title || TYPE_LABEL[t.type]}
                    </p>
                    <p className="text-[13px] text-[var(--shell-muted)]">
                      {t.dateFormatted} · {TYPE_LABEL[t.type]}
                      {t.recipientOrSender ? ` · ${t.recipientOrSender}` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[var(--shell-ok-text)] tabular-nums">
                    +{brl(t.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </WhiteCard>
    </div>
  );
};
