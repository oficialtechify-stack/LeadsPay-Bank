import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, ChevronLeft, ChevronRight, Table2, X } from 'lucide-react';
import type { Transaction } from '../../types';
import { EmptyState, SoonBadge, WhiteCard } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const TZ = 'America/Sao_Paulo';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "Agora" no fuso de São Paulo, como Date local deslocado. */
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

const STATUS_LABEL: Record<Transaction['status'], string> = {
  completed: 'Concluída',
  pending: 'Pendente',
  failed: 'Não aprovado',
};

const WEEK_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

function mondayOfWeek(d: Date): Date {
  const c = new Date(d);
  const dow = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - dow);
  c.setHours(0, 0, 0, 0);
  return c;
}

const LEGEND_COLORS: Record<Transaction['type'], string> = {
  pix_in: 'var(--shell-lima)',
  pix_out: 'var(--shell-black)',
  tap_to_pay: 'var(--shell-orange)',
  card_payment: 'var(--shell-ok-text)',
  bill_payment: 'var(--shell-warn-text)',
  investment: 'var(--shell-muted)',
};

function WeekBars({ values, highlightToday }: { values: number[]; highlightToday?: boolean }) {
  const max = Math.max(...values, 0);
  return (
    <div className="flex items-end gap-2 h-32">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
          <span className="text-[12px] font-semibold text-[var(--shell-text)] tabular-nums">
            {v > 0 ? brl(v) : ''}
          </span>
          <div
            className="w-full max-w-[36px] rounded-t-[8px]"
            style={{
              height: v > 0 ? `${Math.max(8, (v / (max || 1)) * 64)}%` : '4px',
              background:
                highlightToday && i === (spNow().getDay() + 6) % 7
                  ? 'var(--shell-lima)'
                  : 'var(--shell-black)',
            }}
            title={`${WEEK_DAYS[i]}: ${brl(v)}`}
          />
          <span className="text-[12px] text-[var(--shell-muted)]">{WEEK_DAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}

type Tab = 'calendar' | 'table' | 'charts';

/** U6 — Suas vendas (v3.1 §8-U6 + v3.2 §D6.2). Ledger = REGISTRO INTERNO. */
export const PainelVendas: React.FC<PainelProps> = ({
  transactions,
  syncState,
  shellUi,
  setShellUi,
}) => {
  const loading = syncState.loading && transactions.length === 0;
  const tab: Tab = shellUi.salesTab;
  const clientFilter = shellUi.salesClientFilter;

  const now = useMemo(() => spNow(), []);
  const todayKey = dayKeyOf(now);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const scoped = useMemo(
    () =>
      clientFilter
        ? transactions.filter(
            (t) => (t.recipientOrSender ?? '').toLowerCase() === clientFilter.toLowerCase()
          )
        : transactions,
    [transactions, clientFilter]
  );

  const isToday = (t: Transaction) => txDayKey(t) === todayKey;

  // §D6.2 — 3 fórmulas DISTINTAS.
  const recebendoHoje = useMemo(
    () =>
      scoped
        .filter((t) => t.status === 'completed' && t.amount > 0 && isToday(t))
        .reduce((s, t) => s + t.amount, 0),
    [scoped, todayKey]
  );
  const vendasHojeList = useMemo(
    () =>
      scoped.filter(
        (t) => t.status === 'completed' && t.category === 'Vendas' && t.amount > 0 && isToday(t)
      ),
    [scoped, todayKey]
  );
  const vendasHoje = vendasHojeList.reduce((s, t) => s + t.amount, 0);
  const totalHoje = useMemo(
    () =>
      scoped
        .filter((t) => t.status === 'completed' && isToday(t))
        .reduce((s, t) => s + t.amount, 0),
    [scoped, todayKey]
  );

  const monthKey = (y: number, m: number) =>
    `${String(y)}-${String(m + 1).padStart(2, '0')}`;
  const txMonthKey = (t: Transaction): string | null => {
    const ms = txMs(t);
    if (Number.isNaN(ms)) return null;
    const d = new Date(ms);
    return monthKey(d.getFullYear(), d.getMonth());
  };

  const vendasMes = useMemo(
    () =>
      scoped
        .filter(
          (t) =>
            t.status === 'completed' &&
            t.category === 'Vendas' &&
            t.amount > 0 &&
            txMonthKey(t) === monthKey(now.getFullYear(), now.getMonth())
        )
        .reduce((s, t) => s + t.amount, 0),
    [scoped, now]
  );

  const numVendasMes = useMemo(
    () =>
      scoped.filter(
        (t) =>
          t.status === 'completed' &&
          t.category === 'Vendas' &&
          t.amount > 0 &&
          txMonthKey(t) === monthKey(now.getFullYear(), now.getMonth())
      ).length,
    [scoped, now]
  );

  // Sua semana: Σ category='Vendas' por dia da semana atual (seg–dom).
  const semana = useMemo(() => {
    const monday = mondayOfWeek(now);
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      keys.push(dayKeyOf(d));
    }
    return keys.map((k) =>
      scoped
        .filter(
          (t) => t.status === 'completed' && t.category === 'Vendas' && t.amount > 0 && txDayKey(t) === k
        )
        .reduce((s, t) => s + t.amount, 0)
    );
  }, [scoped, now]);

  // Últimos 3 meses: Σ Vendas por mês.
  const ultimos3Meses = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    for (let back = 2; back >= 0; back--) {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: TZ });
      const key = monthKey(d.getFullYear(), d.getMonth());
      out.push({
        label,
        value: scoped
          .filter(
            (t) =>
              t.status === 'completed' &&
              t.category === 'Vendas' &&
              t.amount > 0 &&
              txMonthKey(t) === key
          )
          .reduce((s, t) => s + t.amount, 0),
      });
    }
    return out;
  }, [scoped, now]);

  // Calendário do mês selecionado.
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // seg = 0
    const cells: { day: number | null; key: string | null; value: number }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ day: null, key: null, value: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d, 12);
      const key = dayKeyOf(date);
      const value = scoped
        .filter(
          (t) =>
            t.status === 'completed' &&
            t.category === 'Vendas' &&
            t.amount > 0 &&
            txDayKey(t) === key
        )
        .reduce((s, t) => s + t.amount, 0);
      cells.push({ day: d, key, value });
    }
    return cells;
  }, [calYear, calMonth, scoped]);

  const melhorDia = useMemo(() => {
    let best: { day: number; value: number } | null = null;
    for (const c of calDays) {
      if (c.day !== null && c.value > 0 && (!best || c.value > best.value)) {
        best = { day: c.day, value: c.value };
      }
    }
    return best;
  }, [calDays]);

  const calLabel = new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });

  // Gráficos: legenda só com os tipos que existem no dado.
  const tiposPresentes = useMemo(() => {
    const set = new Set<Transaction['type']>();
    scoped
      .filter((t) => t.status === 'completed' && t.amount > 0)
      .forEach((t) => set.add(t.type));
    return [...set];
  }, [scoped]);

  const mesAnterior = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = monthKey(d.getFullYear(), d.getMonth());
    return scoped
      .filter(
        (t) =>
          t.status === 'completed' &&
          t.category === 'Vendas' &&
          t.amount > 0 &&
          txMonthKey(t) === key
      )
      .reduce((s, t) => s + t.amount, 0);
  }, [scoped, now]);

  // Ranking dos últimos 90 dias: top 5 DIAS por valor.
  const ranking90 = useMemo(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 90);
    const byDay = new Map<string, number>();
    scoped
      .filter((t) => t.status === 'completed' && t.category === 'Vendas' && t.amount > 0)
      .forEach((t) => {
        const k = txDayKey(t);
        if (!k) return;
        const ms = txMs(t);
        if (Number.isNaN(ms) || ms < start.getTime()) return;
        byDay.set(k, (byDay.get(k) ?? 0) + t.amount);
      });
    return [...byDay.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [scoped, now]);

  const tableRows = useMemo(
    () =>
      scoped
        .map((t) => ({ t, ms: txMs(t) }))
        .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms))
        .map((x) => x.t),
    [scoped]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'calendar', label: 'Calendário' },
    { id: 'table', label: 'Tabela' },
    { id: 'charts', label: 'Gráficos' },
  ];

  const cardStyle =
    'rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-surface)] p-5';

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />
      <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
        Suas vendas
      </h1>

      {clientFilter && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--shell-surface-2)] px-3 py-1.5 text-sm font-semibold text-[var(--shell-text)]">
            Cliente: {clientFilter}
            <button
              type="button"
              aria-label="Limpar filtro de cliente"
              onClick={() => setShellUi({ salesClientFilter: null })}
              className="rounded-full p-0.5 hover:bg-[var(--shell-surface)]"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        </div>
      )}

      {/* Abas com sublinhado preto (§7). */}
      <div className="flex gap-6 border-b border-[var(--shell-border)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setShellUi({ salesTab: t.id })}
            className={`relative pb-2 text-[15px] font-semibold ${
              tab === t.id ? 'text-[var(--shell-text)]' : 'text-[var(--shell-muted)]'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="sales-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--shell-black)]"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 3 cards com fórmulas DISTINTAS (§D6.2). Sem bruto/líquido — só Total. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={cardStyle}>
          <p className="text-sm text-[var(--shell-muted)]">Recebendo hoje</p>
          <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
            {brl(recebendoHoje)}
          </p>
          <p className="text-[13px] text-[var(--shell-muted)]">
            Entradas de hoje · REGISTRO INTERNO
          </p>
        </div>
        <div className={cardStyle}>
          <p className="text-sm text-[var(--shell-muted)]">Vendas hoje</p>
          <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
            {brl(vendasHoje)}
          </p>
          <p className="text-[13px] text-[var(--shell-muted)]">
            {vendasHojeList.length} {vendasHojeList.length === 1 ? 'venda' : 'vendas'} hoje
          </p>
        </div>
        <div className={cardStyle}>
          <p className="text-sm text-[var(--shell-muted)]">Total de hoje</p>
          <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
            {brl(totalHoje)}
          </p>
          <p className="text-[13px] text-[var(--shell-muted)]">
            Entradas menos saídas de hoje · REGISTRO INTERNO
          </p>
        </div>
      </div>

      {loading ? (
        <WhiteCard>
          <Skeleton lines={6} />
        </WhiteCard>
      ) : (
        <>
          {tab === 'calendar' && (
            <WhiteCard>
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-[var(--shell-text)] capitalize">
                  {calLabel}
                </h2>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Mês anterior"
                    onClick={() => {
                      const d = new Date(calYear, calMonth - 1, 1);
                      setCalYear(d.getFullYear());
                      setCalMonth(d.getMonth());
                    }}
                    className="rounded-full bg-[var(--shell-surface-2)] p-2 text-[var(--shell-text)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Próximo mês"
                    onClick={() => {
                      const d = new Date(calYear, calMonth + 1, 1);
                      setCalYear(d.getFullYear());
                      setCalMonth(d.getMonth());
                    }}
                    className="rounded-full bg-[var(--shell-surface-2)] p-2 text-[var(--shell-text)]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-[var(--shell-muted)]">
                {WEEK_DAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calDays.map((c, i) => {
                  if (c.day === null) return <span key={`e-${i}`} />;
                  const isTodayCell = c.key === todayKey;
                  const isBest = melhorDia !== null && c.day === melhorDia.day;
                  return (
                    <div
                      key={c.key}
                      title={c.value > 0 ? `${c.day}: ${brl(c.value)}` : `${c.day}: sem vendas`}
                      className={`flex min-h-[56px] flex-col items-center justify-center rounded-[16px] px-1 py-1.5 ${
                        isBest ? 'bg-[var(--shell-warn-bg)]' : ''
                      } ${isTodayCell ? 'ring-2 ring-[var(--shell-black)]' : ''}`}
                    >
                      <span className="text-sm font-bold text-[var(--shell-text)]">{c.day}</span>
                      <span className="text-[11px] text-[var(--shell-muted)] tabular-nums">
                        {c.value > 0 ? brl(c.value) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--shell-muted)]">
                <CalendarDays className="w-4 h-4" />
                {melhorDia ? (
                  <span>
                    Melhor dia: dia {melhorDia.day} ({brl(melhorDia.value)})
                  </span>
                ) : (
                  <span>Sem vendas neste mês.</span>
                )}
                <span>· Hoje circulado.</span>
              </div>
            </WhiteCard>
          )}

          {tab === 'table' && (
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold text-[var(--shell-text)]">
                <Table2 className="w-5 h-5" /> Vendas
              </h2>
              {tableRows.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Sem vendas no período."
                    text="Quando você vender, as vendas aparecem aqui."
                  />
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--shell-border)]">
                  {tableRows.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
                          {t.title || TYPE_LABEL[t.type]}
                        </p>
                        <p className="text-[13px] text-[var(--shell-muted)]">
                          {t.dateFormatted} · {TYPE_LABEL[t.type]} · #{t.id.slice(0, 6)} ·{' '}
                          {STATUS_LABEL[t.status]}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          t.status === 'failed' ? 'line-through text-[var(--shell-muted)]' : ''
                        } ${t.amount > 0 ? 'text-[var(--shell-ok-text)]' : 'text-[var(--shell-text)]'}`}
                      >
                        {t.amount > 0 ? '+' : ''}
                        {brl(t.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </WhiteCard>
          )}

          {tab === 'charts' && (
            <div className="space-y-4">
              <WhiteCard>
                <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
                  Faturamento da Semana
                </h2>
                <p className="mt-1 text-[13px] text-[var(--shell-muted)]">
                  Somente os métodos que existem no seu dado aparecem na legenda.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tiposPresentes.length === 0 ? (
                    <span className="text-sm text-[var(--shell-muted)]">Sem vendas registradas.</span>
                  ) : (
                    tiposPresentes.map((ty) => (
                      <span
                        key={ty}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--shell-surface-2)] px-3 py-1 text-[13px] font-semibold text-[var(--shell-text)]"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: LEGEND_COLORS[ty] }}
                        />
                        {TYPE_LABEL[ty]}
                      </span>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <WeekBars values={semana} highlightToday />
                </div>
              </WhiteCard>

              <div className="grid gap-4 sm:grid-cols-2">
                <WhiteCard>
                  <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
                    Comparativo com o mês anterior
                  </h2>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: 'Mês anterior', value: mesAnterior },
                      { label: 'Este mês', value: vendasMes },
                    ].map((r) => {
                      const max = Math.max(mesAnterior, vendasMes, 1);
                      return (
                        <div key={r.label}>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--shell-muted)]">{r.label}</span>
                            <span className="font-bold text-[var(--shell-text)] tabular-nums">
                              {brl(r.value)}
                            </span>
                          </div>
                          <div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--shell-surface-2)]">
                            <motion.div
                              className="h-full rounded-full bg-[var(--shell-lima)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${(r.value / max) * 100}%` }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </WhiteCard>
                <WhiteCard>
                  <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
                    Top dias — últimos 90 dias
                  </h2>
                  {ranking90.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--shell-muted)]">
                      Sem vendas nos últimos 90 dias.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {ranking90.map(([dia, valor]) => (
                        <li key={dia} className="flex justify-between text-sm">
                          <span className="text-[var(--shell-muted)]">{dia}</span>
                          <span className="font-bold text-[var(--shell-text)] tabular-nums">
                            {brl(valor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </WhiteCard>
              </div>

              <WhiteCard>
                <h2 className="text-[16px] font-bold text-[var(--shell-text)]">Movimento de Hoje</h2>
                {vendasHojeList.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--shell-muted)]">Sem vendas hoje.</p>
                ) : (
                  <p className="mt-3 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
                    {brl(vendasHoje)}
                    <span className="ml-2 text-sm font-normal text-[var(--shell-muted)]">
                      {vendasHojeList.length} {vendasHojeList.length === 1 ? 'venda' : 'vendas'}
                    </span>
                  </p>
                )}
              </WhiteCard>
            </div>
          )}

          {/* Resumo — sempre visível. */}
          <WhiteCard>
            <h2 className="text-[16px] font-bold text-[var(--shell-text)]">Resumo</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[var(--shell-muted)]">Total do mês</p>
                <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
                  {brl(vendasMes)}
                </p>
                <p className="text-[13px] text-[var(--shell-muted)]">Vendas · REGISTRO INTERNO</p>
              </div>
              <div>
                <p className="text-sm text-[var(--shell-muted)]">Nº de vendas</p>
                <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
                  {numVendasMes}
                </p>
                <p className="text-[13px] text-[var(--shell-muted)]">Vendas neste mês</p>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--shell-text)]">Sua semana</p>
              <div className="mt-2">
                <WeekBars values={semana} highlightToday />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--shell-text)]">Últimos 3 meses</p>
              <div className="mt-2 flex items-end gap-3 h-24">
                {ultimos3Meses.map((m) => {
                  const max = Math.max(...ultimos3Meses.map((x) => x.value), 1);
                  return (
                    <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[12px] font-semibold text-[var(--shell-text)] tabular-nums">
                        {brl(m.value)}
                      </span>
                      <div
                        className="w-full max-w-[48px] rounded-t-[8px] bg-[var(--shell-black)]"
                        style={{ height: m.value > 0 ? `${Math.max(8, (m.value / max) * 70)}%` : '4px' }}
                        title={`${m.label}: ${brl(m.value)}`}
                      />
                      <span className="text-[12px] capitalize text-[var(--shell-muted)]">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--shell-border)] pt-4">
              <p className="text-sm text-[var(--shell-muted)]">Sem meta definida.</p>
              <button
                type="button"
                disabled
                title="Definir meta ainda não disponível."
                className="rounded-full bg-[#E5E5E5] px-4 py-2 text-sm font-semibold text-[#9CA3AF]"
              >
                Definir meta
              </button>
              <SoonBadge reason="Definir meta ainda não disponível." />
            </div>
          </WhiteCard>
        </>
      )}
    </div>
  );
};
