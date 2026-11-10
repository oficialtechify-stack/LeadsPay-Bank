import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  Receipt,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { Transaction } from '../../types';
import { Card, EmptyState, SoonBadge, SPRING, WhiteCard } from '../ui';
import { EyeValue, Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const TZ = 'America/Sao_Paulo';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const dayKeyOf = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: TZ });

const txDayKey = (t: Transaction): string | null => {
  const d = new Date(t.timestamp);
  return Number.isNaN(d.getTime()) ? null : dayKeyOf(d);
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

const firstName = (name?: string | null) => {
  const n = (name ?? '').trim();
  return n ? n.split(/\s+/)[0] : '';
};

/** U1 — Home (v3.1 §8-U1 + v3.2 §D6.2). Ledger = REGISTRO INTERNO. */
export const PainelHome: React.FC<PainelProps> = ({
  userProfile,
  transactions,
  showBalance,
  onToggleBalance,
  navigate,
  onOpenPix,
  onOpenTap,
  syncState,
  setShellUi,
}) => {
  const loading = syncState.loading && transactions.length === 0;

  const todayKey = useMemo(
    () => dayKeyOf(new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))),
    []
  );

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

  // Vendas hoje (§9): Σ category='Vendas' de hoje.
  const vendasHoje = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            t.category === 'Vendas' &&
            t.amount > 0 &&
            txDayKey(t) === todayKey
        )
        .reduce((s, t) => s + t.amount, 0),
    [transactions, todayKey]
  );

  const ultimas = useMemo(() => {
    const withDate = transactions
      .map((t) => ({ t, ms: new Date(t.timestamp).getTime() }))
      .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms));
    return withDate.slice(0, 5).map((x) => x.t);
  }, [transactions]);

  const saudacao = firstName(userProfile.preferredName) || firstName(userProfile.name);
  const initials = (saudacao || 'L').slice(0, 1).toUpperCase();

  // Carrossel: 2 banners, avanço automático a cada 6s, pausa no hover (§7).
  const [banner, setBanner] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setBanner((b) => (b + 1) % 2), 6000);
    return () => window.clearInterval(id);
  }, [paused]);

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  const atalhos: {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    breve?: string;
  }[] = [
    { label: 'Cobrar', Icon: HandCoins, onClick: () => navigate({ name: 'nova-cobranca' }) },
    { label: 'Pix', Icon: Send, onClick: () => onOpenPix('keys') },
    {
      label: 'Pagar',
      Icon: Receipt,
      onClick: () => undefined,
      breve: 'Pagamento de boletos ainda não disponível — a LeadsTap ainda não tem trilho de pagamento.',
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

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 min-w-0">
          {/* Card de perfil — raio 24px (destaque, §D7.3). */}
          <motion.div {...stagger(0)}>
            <WhiteCard className="rounded-[24px]">
              <div className="flex items-center gap-4">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex w-14 h-14 items-center justify-center rounded-full bg-[var(--shell-lima)] text-xl font-bold text-zinc-950">
                    {initials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)] leading-tight">
                    {saudacao ? `Olá, ${saudacao}` : 'Olá'}
                  </h1>
                  <p className="text-sm text-[var(--shell-muted)]">Seu saldo é de</p>
                  <p className="text-[28px] font-bold leading-tight text-[var(--shell-text)]">
                    <EyeValue
                      value={brl(userProfile.balance ?? 0)}
                      show={showBalance}
                      onToggle={onToggleBalance}
                    />
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--shell-muted)]">
                    saldo interno da LeadsTap · REGISTRO INTERNO
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShellUi({ linkBioOpen: true })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--shell-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--shell-text)] hover:opacity-80"
              >
                Conheça o Link na Bio
                <ArrowRight className="w-4 h-4" />
              </button>
            </WhiteCard>
          </motion.div>

          {/* Atalhos */}
          <motion.div {...stagger(1)}>
            <div className="grid grid-cols-5 gap-2">
              {atalhos.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  disabled={Boolean(a.breve)}
                  title={a.breve}
                  className="flex flex-col items-center gap-2 rounded-[20px] bg-[var(--shell-surface)] border border-[var(--shell-border)] p-3 disabled:opacity-60"
                >
                  <span className="flex w-14 h-14 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
                    <a.Icon className="w-6 h-6 text-[var(--shell-text)]" />
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--shell-text)]">
                    {a.label}
                  </span>
                  {a.breve && <SoonBadge reason="Pagamento de boletos ainda não disponível." />}
                </button>
              ))}
            </div>
            {atalhos.some((a) => a.breve) && (
              <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
                Pagamento de boletos ainda não disponível — a LeadsTap ainda não tem trilho de
                pagamento.
              </p>
            )}
          </motion.div>

          {/* Cards: Vendas hoje / Recebimentos do dia / Rendimentos / Organize */}
          <motion.div {...stagger(2)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <WhiteCard>
                <p className="text-sm text-[var(--shell-muted)]">Vendas hoje</p>
                <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
                  {brl(vendasHoje)}
                </p>
                <p className="text-[13px] text-[var(--shell-muted)]">REGISTRO INTERNO</p>
              </WhiteCard>
              <WhiteCard>
                <p className="text-sm text-[var(--shell-muted)]">Recebimentos do dia</p>
                <p className="mt-1 text-[24px] font-bold text-[var(--shell-text)] tabular-nums">
                  {brl(recebimentosHoje)}
                </p>
                <p className="text-[13px] text-[var(--shell-muted)]">REGISTRO INTERNO</p>
              </WhiteCard>
              <WhiteCard>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[var(--shell-muted)]">Rendimentos</p>
                  <SoonBadge reason="Rendimentos ainda não disponíveis na LeadsTap." />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--shell-text)]">
                  Em breve — rendimentos ainda não disponíveis na LeadsTap.
                </p>
              </WhiteCard>
              <WhiteCard>
                <p className="text-sm text-[var(--shell-muted)]">Organize as suas finanças</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--shell-text)]">
                  Acompanhe todos os seus lançamentos no extrato.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'extrato' })}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--shell-black)] px-4 py-2 text-sm font-semibold text-[var(--shell-on-black)]"
                >
                  Ver página
                  <ArrowRight className="w-4 h-4" />
                </button>
              </WhiteCard>
            </div>
          </motion.div>

          {/* Carrossel — 2 banners, copy própria (§8-U1). */}
          <motion.div {...stagger(3)}>
            <div
              className="relative overflow-hidden rounded-[20px] bg-[var(--shell-surface)] border border-[var(--shell-border)]"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <motion.div
                key={banner}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-5 min-h-[132px]"
              >
                {banner === 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'gestao' })}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex w-12 h-12 shrink-0 items-center justify-center rounded-[16px] bg-[#EDE9FE]">
                        <HandCoins className="w-6 h-6 text-zinc-950" />
                      </span>
                      <span>
                        <span className="block text-[16px] font-bold text-[var(--shell-text)]">
                          Gestão de Cobrança
                        </span>
                        <span className="block text-sm text-[var(--shell-muted)]">
                          Acompanhe quem te deve e cobre sem constrangimento.
                        </span>
                      </span>
                    </div>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex w-12 h-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--shell-surface-2)]">
                        <Receipt className="w-6 h-6 text-zinc-950" />
                      </span>
                      <span>
                        <span className="block text-[16px] font-bold text-[var(--shell-text)]">
                          Pagamento de boletos
                        </span>
                        <span className="block text-sm text-[var(--shell-muted)]">
                          Em breve na LeadsTap.
                        </span>
                      </span>
                    </div>
                    <span className="mt-3 inline-block">
                      <SoonBadge reason="Pagamento de boletos ainda não disponível." />
                    </span>
                  </div>
                )}
              </motion.div>
              <div className="absolute bottom-3 right-4 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Banner anterior"
                  onClick={() => setBanner((b) => (b + 1) % 2)}
                  className="rounded-full bg-[var(--shell-surface-2)] p-1.5 text-[var(--shell-text)]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Próximo banner"
                  onClick={() => setBanner((b) => (b + 1) % 2)}
                  className="rounded-full bg-[var(--shell-surface-2)] p-1.5 text-[var(--shell-text)]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="flex gap-1.5">
                  {[0, 1].map((i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Ir para o banner ${i + 1}`}
                      onClick={() => setBanner(i)}
                      className={`h-2 w-2 rounded-full ${
                        banner === i ? 'bg-[var(--shell-text)]' : 'bg-[var(--shell-muted)] opacity-40'
                      }`}
                    />
                  ))}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card preto do assistente — copy própria. */}
          <motion.div {...stagger(4)}>
            <Card className="!bg-[var(--shell-black)]">
              <div className="flex items-center gap-3">
                <span className="flex w-12 h-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--shell-orange)]">
                  <Sparkles className="w-6 h-6 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-[var(--shell-on-black)]">
                    Conheça o Assistente
                  </p>
                  <p className="text-sm text-[var(--shell-on-black)] opacity-70">
                    Pergunte, organize e venda mais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'assistente' })}
                  className="shrink-0 rounded-full bg-[var(--shell-lima)] px-4 py-2 text-sm font-semibold text-zinc-950"
                >
                  Abrir
                </button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Extrato lateral — últimas 5 transações (REGISTRO INTERNO). */}
        <motion.div {...stagger(2)} className="min-w-0">
          <WhiteCard>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[var(--shell-text)]">Extrato</h2>
              <button
                type="button"
                onClick={() => navigate({ name: 'extrato' })}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--shell-text)]"
              >
                Ver página
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? (
                <Skeleton lines={5} />
              ) : ultimas.length === 0 ? (
                <EmptyState
                  title="Você ainda não tem movimentações."
                  text="Quando você vender ou receber, os lançamentos aparecem aqui."
                />
              ) : (
                ultimas.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
                        {t.title || TYPE_LABEL[t.type]}
                      </p>
                      <p className="text-[13px] text-[var(--shell-muted)]">
                        {t.dateFormatted} · {TYPE_LABEL[t.type]} · {STATUS_LABEL[t.status]}
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
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={onOpenTap}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--shell-lima)] py-3 text-[15px] font-semibold text-zinc-950"
            >
              <BarChart3 className="w-5 h-5" />
              Cobrar com Tap
            </button>
          </WhiteCard>
        </motion.div>
      </div>
    </div>
  );
};
