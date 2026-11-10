import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Barcode,
  ChevronRight,
  CreditCard,
  Nfc,
  QrCode,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import type { Transaction } from '../../types';
import { EmptyState, SPRING, WhiteCard } from '../ui';
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

const TYPE_ICON: Record<Transaction['type'], React.ComponentType<{ className?: string }>> = {
  pix_in: QrCode,
  pix_out: QrCode,
  tap_to_pay: Nfc,
  card_payment: CreditCard,
  bill_payment: Receipt,
  investment: TrendingUp,
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  completed: 'Concluída',
  pending: 'Pendente',
  failed: 'Não aprovado',
};

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/** "09 Nov, 2026" — formato da Home da InfinitePay do print. */
const fmtDay = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;

/** Rótulo do grupo: "Hoje • 10 Nov, 2026" / "Ontem • 09 Nov, 2026" / "09 Nov, 2026". */
const dayGroupLabel = (key: string, todayKey: string, yesterdayKey: string) => {
  const nowSp = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  if (key === todayKey) return `Hoje • ${fmtDay(nowSp)}`;
  if (key === yesterdayKey) {
    const y = new Date(nowSp);
    y.setDate(y.getDate() - 1);
    return `Ontem • ${fmtDay(y)}`;
  }
  const [dd, mm, yyyy] = key.split('/').map(Number);
  const parsed = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(parsed.getTime())) return key; // sem data válida: exibe como está
  return fmtDay(parsed);
};

const fmtTime = (t: Transaction) => {
  const d = new Date(t.timestamp);
  if (Number.isNaN(d.getTime())) return t.dateFormatted;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
};

/** Ilustração própria (SVG) — cesta roxa do card "Nenhuma venda hoje". */
const BasketIllustration: React.FC = () => (
  <svg viewBox="0 0 96 84" className="h-[76px] w-auto shrink-0" aria-hidden="true">
    <circle cx="36" cy="13" r="11" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
    <circle cx="60" cy="9" r="11" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
    <path d="M28 36 Q48 12 68 36" fill="none" stroke="#7e22ce" strokeWidth="5" strokeLinecap="round" />
    <rect x="20" y="32" width="56" height="9" rx="4.5" fill="#9333ea" />
    <polygon points="24,41 72,41 66,78 30,78" fill="#a855f7" />
    <line x1="38" y1="43" x2="36" y2="76" stroke="#7e22ce" strokeWidth="3" />
    <line x1="48" y1="43" x2="48" y2="76" stroke="#7e22ce" strokeWidth="3" />
    <line x1="58" y1="43" x2="60" y2="76" stroke="#7e22ce" strokeWidth="3" />
  </svg>
);

/** Ilustração própria (SVG) — laptop com gráfico do card "Recebimentos do dia". */
const LaptopIllustration: React.FC = () => (
  <svg viewBox="0 0 110 80" className="h-[72px] w-auto shrink-0" aria-hidden="true">
    <rect x="14" y="6" width="82" height="52" rx="6" fill="#1f2937" />
    <rect x="20" y="12" width="70" height="40" fill="#ffffff" />
    <rect x="26" y="38" width="9" height="14" fill="#22c55e" />
    <rect x="40" y="28" width="9" height="24" fill="#a855f7" />
    <rect x="54" y="34" width="9" height="18" fill="#22c55e" />
    <rect x="68" y="20" width="9" height="32" fill="#a855f7" />
    <polygon points="6,58 104,58 112,70 -2,70" fill="#d1d5db" />
    <rect x="48" y="60" width="14" height="4" rx="2" fill="#9ca3af" />
  </svg>
);

/** Ilustração própria (SVG) — mesa de trabalho do banner "Gestão de Cobrança". */
const BannerScene: React.FC = () => (
  <svg viewBox="0 0 380 230" className="block h-auto w-full" role="img" aria-label="Ilustração: mesa de trabalho com notebook">
    <defs>
      <linearGradient id="leadsTapBannerDesk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ead9bd" />
        <stop offset="100%" stopColor="#c9ad83" />
      </linearGradient>
    </defs>
    <rect width="380" height="230" fill="url(#leadsTapBannerDesk)" />
    {/* caderno verde ao fundo */}
    <rect x="18" y="28" width="104" height="118" rx="6" fill="#55751f" />
    <rect x="26" y="36" width="88" height="102" rx="4" fill="#f5f0e1" />
    <rect x="36" y="52" width="68" height="5" rx="2.5" fill="#d6d3c4" />
    <rect x="36" y="66" width="68" height="5" rx="2.5" fill="#d6d3c4" />
    <rect x="36" y="80" width="48" height="5" rx="2.5" fill="#d6d3c4" />
    {/* laptop com gráfico */}
    <rect x="138" y="42" width="196" height="118" rx="8" fill="#22252a" />
    <rect x="147" y="51" width="178" height="100" fill="#ffffff" />
    <rect x="160" y="131" width="12" height="20" fill="#22c55e" />
    <rect x="180" y="116" width="12" height="35" fill="#a3e635" />
    <rect x="200" y="123" width="12" height="28" fill="#22c55e" />
    <rect x="220" y="103" width="12" height="48" fill="#a3e635" />
    <rect x="240" y="111" width="12" height="40" fill="#22c55e" />
    <rect x="260" y="89" width="12" height="62" fill="#a3e635" />
    <rect x="280" y="96" width="12" height="55" fill="#22c55e" />
    <rect x="300" y="76" width="12" height="75" fill="#a3e635" />
    <rect x="160" y="148" width="152" height="2" fill="#e5e7eb" />
    <polygon points="128,160 344,160 362,180 110,180" fill="#c9ced6" />
    <rect x="228" y="160" width="20" height="6" rx="3" fill="#9ca3af" />
    {/* celular */}
    <rect x="52" y="138" width="52" height="88" rx="10" fill="#1f2937" />
    <rect x="58" y="146" width="40" height="72" fill="#f8fafc" />
    <rect x="64" y="196" width="28" height="7" rx="3.5" fill="#22c55e" />
    <rect x="64" y="184" width="28" height="7" rx="3.5" fill="#a3e635" />
    {/* café */}
    <ellipse cx="318" cy="214" rx="34" ry="7" fill="#f8fafc" />
    <rect x="296" y="178" width="44" height="32" rx="5" fill="#ffffff" />
    <ellipse cx="318" cy="180" rx="20" ry="5" fill="#92400e" />
    <path d="M340 186 q14 4 0 16" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

/**
 * U1 — Home, layout igual ao print da Home da InfinitePay do Rick
 * (image-53.png): coluna esquerda com perfil + 5 atalhos + banner
 * "Gestão de Cobrança"; coluna direita com "Nenhuma venda hoje" /
 * "Recebimentos do dia" e o Extrato agrupado por dia.
 * DADOS DA LEADSTAP (ledger): nada da InfinitePay aqui — sem a tag da
 * conta dele lá, sem os lançamentos da conta dele lá, sem rendimento de CDI.
 */
export const PainelHome: React.FC<PainelProps> = ({
  userProfile,
  transactions,
  showBalance,
  onToggleBalance,
  navigate,
  onOpenPix,
  syncState,
  setShellUi,
}) => {
  const loading = syncState.loading && transactions.length === 0;

  const nowSp = useMemo(
    () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ })),
    []
  );
  const todayKey = dayKeyOf(nowSp);
  const yesterdayKey = useMemo(() => {
    const y = new Date(nowSp);
    y.setDate(y.getDate() - 1);
    return dayKeyOf(y);
  }, [nowSp]);

  // Vendas hoje (§9): Σ category='Vendas' de hoje, concluídas.
  const vendasHoje = useMemo(() => {
    const list = transactions.filter(
      (t) =>
        t.status === 'completed' &&
        t.category === 'Vendas' &&
        t.amount > 0 &&
        txDayKey(t) === todayKey
    );
    return {
      count: list.length,
      total: list.reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions, todayKey]);

  // Recebimentos do dia = "Recebendo hoje" (§D6.2): Σ entradas de hoje.
  const recebimentosHoje = useMemo(
    () =>
      transactions
        .filter(
          (t) => t.status === 'completed' && t.amount > 0 && txDayKey(t) === todayKey
        )
        .reduce((s, t) => s + t.amount, 0),
    [transactions, todayKey]
  );

  // Valor líquido: no ledger da LeadsTap não há taxa deduzida — é o mesmo
  // valor das vendas de hoje.
  const liquidoHoje = vendasHoje.total;

  // Últimas 10, agrupadas por dia; o total do dia soma TODAS as concluídas
  // daquele dia (não só as visíveis), como no print.
  const groups = useMemo(() => {
    const sorted = transactions
      .map((t) => ({ t, ms: txMs(t) }))
      .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms));
    const recent = sorted.slice(0, 10).map((x) => x.t);
    const out: { label: string; dayTotal: number; items: Transaction[] }[] = [];
    for (const t of recent) {
      const key = txDayKey(t) ?? t.dateFormatted;
      let g = out.find((x) => x.label === key);
      if (!g) {
        const dayTotal = transactions
          .filter((x) => x.status === 'completed' && txDayKey(x) === key)
          .reduce((s, x) => s + x.amount, 0);
        g = { label: key, dayTotal, items: [] };
        out.push(g);
      }
      g.items.push(t);
    }
    return out;
  }, [transactions]);

  const saldo = userProfile.balance ?? 0;
  const saldoTexto = brl(saldo);
  const displayName = userProfile.preferredName || userProfile.name || '—';
  const fullNameUpper = (userProfile.name || '').toUpperCase();
  const showSecondLine =
    fullNameUpper !== '' && fullNameUpper !== displayName.toUpperCase();
  const initials = (displayName || 'L').slice(0, 1).toUpperCase();

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  const atalhos: {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  }[] = [
    { label: 'Cobrar', Icon: ArrowDownToLine, onClick: () => navigate({ name: 'nova-cobranca' }) },
    { label: 'Pix', Icon: QrCode, onClick: () => onOpenPix('keys') },
    {
      label: 'Pagar',
      Icon: Barcode,
      onClick: () => undefined,
      disabled: true,
      title: 'Pagamento de boletos ainda não disponível — a LeadsTap ainda não tem trilho de pagamento.',
    },
    { label: 'Cartões', Icon: CreditCard, onClick: () => navigate({ name: 'cartao' }) },
    {
      label: 'Vendas',
      Icon: TrendingUp,
      onClick: () => navigate({ name: 'vendas' }, { salesTab: 'charts' }),
    },
  ];

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ============ COLUNA ESQUERDA ============ */}
        <div className="space-y-4 min-w-0">
          {/* Card de perfil */}
          <motion.div {...stagger(0)}>
            <WhiteCard className="rounded-[24px]">
              <div className="flex items-center gap-4">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--shell-lima)] text-xl font-bold text-zinc-950">
                    {initials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[20px] font-bold leading-tight text-[var(--shell-text)]">
                    {displayName}
                  </p>
                  {showSecondLine && (
                    <p className="truncate text-[13px] uppercase tracking-wide text-[var(--shell-muted)]">
                      {fullNameUpper}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'ajustes' })}
                  aria-label="Ver perfil"
                  title="Ver perfil"
                  className="shrink-0 rounded-full p-1 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShellUi({ linkBioOpen: true })}
                className="mt-4 inline-flex items-center rounded-full bg-[var(--shell-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--shell-text)] hover:opacity-80"
              >
                Conheça o Link na Bio
              </button>

              <div className="my-4 border-t border-[var(--shell-border)]" />

              <p className="text-sm text-[var(--shell-muted)]">Seu saldo é de</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[32px] font-bold leading-tight tabular-nums text-[var(--shell-text)]">
                  <span className="font-mono-numbers">
                    {showBalance ? saldoTexto : saldoTexto.replace(/\d/g, '•')}
                  </span>
                </p>
                <EyeValue show={showBalance} onToggle={onToggleBalance} />
              </div>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {atalhos.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    disabled={a.disabled}
                    title={a.title}
                    className="flex flex-col items-center gap-2 disabled:opacity-60"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
                      <a.Icon className="w-6 h-6 text-[var(--shell-text)]" />
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--shell-text)]">
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </WhiteCard>
          </motion.div>

          {/* Banner Gestão de Cobrança */}
          <motion.div {...stagger(1)}>
            <button
              type="button"
              onClick={() => navigate({ name: 'gestao' })}
              className="relative block w-full overflow-hidden rounded-[20px] text-left"
              aria-label="Gestão de Cobrança — saiba mais"
            >
              <BannerScene />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-4 left-4 text-[20px] font-bold text-white">
                Gestão de Cobrança
              </span>
              <span className="absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900">
                Saiba mais
              </span>
            </button>
          </motion.div>
        </div>

        {/* ============ COLUNA DIREITA ============ */}
        <div className="space-y-4 min-w-0">
          {/* Cards do topo */}
          <motion.div {...stagger(0)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <WhiteCard className="relative overflow-hidden">
                <div className="pr-[96px]">
                  <p className="text-sm text-[var(--shell-muted)]">
                    {vendasHoje.count === 0 ? 'Nenhuma venda hoje' : 'Vendas hoje'}
                  </p>
                  <p className="mt-1 text-[28px] font-bold leading-tight tabular-nums text-[var(--shell-text)]">
                    {brl(vendasHoje.total)}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--shell-muted)]">
                    Valor líquido {brl(liquidoHoje)}
                  </p>
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <BasketIllustration />
                </span>
              </WhiteCard>
              <WhiteCard className="relative overflow-hidden">
                <div className="pr-[104px]">
                  <p className="text-sm text-[var(--shell-muted)]">Recebimentos do dia</p>
                  <p className="mt-1 text-[28px] font-bold leading-tight tabular-nums text-[var(--shell-text)]">
                    {brl(recebimentosHoje)}
                  </p>
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LaptopIllustration />
                </span>
              </WhiteCard>
            </div>
          </motion.div>

          {/* Extrato */}
          <motion.div {...stagger(1)}>
            <WhiteCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-bold text-[var(--shell-text)]">Extrato</h2>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'extrato' })}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--shell-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--shell-text)] hover:opacity-80"
                >
                  Ver página
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {loading ? (
                <div className="mt-4">
                  <Skeleton lines={5} />
                </div>
              ) : groups.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Você ainda não tem movimentações."
                    text="Quando você vender ou receber, os lançamentos aparecem aqui."
                  />
                </div>
              ) : (
                <div className="mt-2">
                  {groups.map((g) => (
                    <div key={g.label} className="mt-4 border-t border-[var(--shell-border)] pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[15px] font-semibold text-[var(--shell-text)]">
                          {dayGroupLabel(g.label, todayKey, yesterdayKey)}
                        </p>
                        <p className="shrink-0 text-[15px] font-semibold tabular-nums text-[var(--shell-text)]">
                          {brl(g.dayTotal)}
                        </p>
                      </div>
                      <div className="mt-3 divide-y divide-[var(--shell-border)] border-t border-[var(--shell-border)]">
                        {g.items.map((t) => {
                          const TypeIcon = TYPE_ICON[t.type];
                          const isIn = t.amount > 0;
                          const subtitle =
                            t.status === 'completed'
                              ? isIn
                                ? 'Recebido'
                                : 'Saldo da conta'
                              : STATUS_LABEL[t.status];
                          return (
                            <div key={t.id} className="flex items-center gap-3 py-3">
                              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
                                <TypeIcon className="h-5 w-5 text-[var(--shell-text)]" />
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--shell-surface)] ring-2 ring-[var(--shell-surface)]">
                                  {isIn ? (
                                    <ArrowDownLeft className="h-3 w-3 text-[#22c55e]" />
                                  ) : (
                                    <ArrowUpRight className="h-3 w-3 text-[#f59e0b]" />
                                  )}
                                </span>
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold text-[var(--shell-text)]">
                                  {t.title || TYPE_LABEL[t.type]}
                                </p>
                                <p className="text-[13px] text-[var(--shell-muted)]">
                                  {fmtTime(t)} • {subtitle}
                                </p>
                              </div>
                              <p
                                className={`shrink-0 text-[15px] font-bold tabular-nums ${
                                  t.status === 'failed'
                                    ? 'text-[var(--shell-muted)] line-through'
                                    : isIn
                                      ? 'text-[var(--shell-ok-text)]'
                                      : 'text-[var(--shell-text)]'
                                }`}
                              >
                                {isIn ? '+' : ''}
                                {brl(t.amount)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WhiteCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
