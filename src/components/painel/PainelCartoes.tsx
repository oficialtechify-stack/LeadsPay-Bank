import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Lock, Plus, Settings, Unlock } from 'lucide-react';
import type { Transaction, VirtualCard } from '../../types';
import { EmptyState, SPRING, WhiteCard } from '../ui';
import { EyeValue, Skeleton, SyncBanner } from './shared';
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

const BRAND_LABEL: Record<VirtualCard['brand'], string> = {
  mastercard: 'Mastercard',
  visa: 'Visa',
};

/**
 * Últimos 4 (e primeiros 4) REAIS do cartão, derivados só dos dígitos
 * guardados em `cardNumber` — nunca inventados, nunca fixos no código.
 * O número guardado já vem mascarado (`5482 •••• •••• 0993`); o que se
 * exibe aqui são os dígitos reais que ele carrega.
 */
const cardNumberParts = (cardNumber: string): { first4: string; last4: string } => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 8) return { first4: '', last4: '' };
  return { first4: digits.slice(0, 4), last4: digits.slice(-4) };
};

const isoDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });

/** U4 — Cartões (v3.1 §8-U4 + v3.2 §D2/§D7.5). Sem limit/usedLimit, sem CVV. */
export const PainelCartoes: React.FC<PainelProps> = ({
  userProfile,
  transactions,
  cards,
  showBalance,
  onToggleBalance,
  navigate,
  onToggleFreeze,
  syncState,
}) => {
  const loading = syncState.loading && cards.length === 0;
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Filtro de data das transações do cartão — padrão: últimos 90 dias.
  const defaultFrom = useMemo(() => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
    d.setDate(d.getDate() - 90);
    return isoDate(d);
  }, []);
  const defaultTo = useMemo(
    () => isoDate(new Date(new Date().toLocaleString('en-US', { timeZone: TZ }))),
    []
  );
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const cardTxs = useMemo(() => {
    const fromKey = from ? dayKeyOf(new Date(`${from}T12:00:00`)) : null;
    const toKey = to ? dayKeyOf(new Date(`${to}T12:00:00`)) : null;
    return transactions
      .filter((t) => t.type === 'card_payment')
      .filter((t) => {
        const k = txDayKey(t);
        if (k === null) return true; // sem data válida: exibe, não entra no filtro por data
        if (fromKey && k < fromKey) return false;
        if (toKey && k > toKey) return false;
        return true;
      })
      .map((t) => ({ t, ms: new Date(t.timestamp).getTime() }))
      .sort((a, b) => (Number.isNaN(b.ms) ? -1 : Number.isNaN(a.ms) ? 1 : b.ms - a.ms))
      .map((x) => x.t);
  }, [transactions, from, to]);

  const handleToggle = async (cardId: string) => {
    if (!onToggleFreeze || pendingId) return;
    setPendingId(cardId);
    try {
      await onToggleFreeze(cardId);
    } finally {
      setPendingId(null);
    }
  };

  const newCardReason = 'Criar outro cartão ainda não disponível.';
  const depositReason = 'Depósito ainda não disponível — sem trilho de depósito.';

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <WhiteCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
                Seus cartões
              </h1>
              <p className="mt-1 text-sm text-[var(--shell-muted)]">
                Saldo interno da LeadsTap · REGISTRO INTERNO
              </p>
            </div>
            <button
              type="button"
              disabled
              title={newCardReason}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E5E5E5] px-4 py-2.5 text-sm font-semibold text-[#9CA3AF]"
            >
              <Plus className="w-4 h-4" />
              Novo cartão
            </button>
          </div>
          <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{newCardReason}</p>
        </WhiteCard>
      </motion.div>

      {loading ? (
        <WhiteCard>
          <Skeleton lines={5} />
        </WhiteCard>
      ) : cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
        >
          <EmptyState
            title="Você ainda não tem cartão virtual."
            text="O cartão virtual da LeadsTap só é criado quando você solicita. Em breve será possível solicitar por aqui."
          />
        </motion.div>
      ) : (
        cards.map((card, i) => {
          const { first4, last4 } = cardNumberParts(card.cardNumber);
          const maskedNumber =
            first4 && last4 ? `${first4} •••• •••• ${last4}` : card.cardNumber;
          const pending = pendingId === card.id;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: (i + 1) * 0.05 }}
            >
              <WhiteCard>
                {/* Cartão virtual real — número mascarado com os 4 últimos reais. */}
                <div
                  className="rounded-[20px] p-5 text-white"
                  style={{ background: card.color || 'var(--shell-black)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold">
                      <CreditCard className="w-4 h-4" />
                      Digital
                    </span>
                    <span className="text-sm font-semibold">{BRAND_LABEL[card.brand]}</span>
                  </div>
                  <p className="mt-6 font-mono-numbers text-xl font-bold tracking-widest tabular-nums">
                    {maskedNumber}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-white/70">
                        Titular
                      </p>
                      <p className="truncate text-sm font-semibold">{card.cardHolder}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] uppercase tracking-wide text-white/70">
                        Validade
                      </p>
                      <p className="text-sm font-semibold tabular-nums">{card.expiry}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] font-semibold text-white/90">
                    {card.isFrozen ? 'Cartão bloqueado' : 'Cartão ativo'}
                  </p>
                </div>

                <p className="mt-3 text-sm text-[var(--shell-muted)]">
                  Cartão virtual interno — não paga compras fora do app.
                </p>
                <p className="mt-2 text-sm text-[var(--shell-muted)]">
                  Saldo interno:{' '}
                  <span className="text-[16px] font-bold text-[var(--shell-text)]">
                    <EyeValue
                      value={brl(userProfile.balance ?? 0)}
                      show={showBalance}
                      onToggle={onToggleBalance}
                    />
                  </span>
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--shell-border)] pt-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--shell-text)]">
                      Bloqueio temporário
                    </p>
                    <p className="text-[13px] text-[var(--shell-muted)]">
                      {card.isFrozen
                        ? 'Bloqueado — desbloqueie para usar.'
                        : 'Ativo — bloqueie quando precisar.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={card.isFrozen}
                    aria-label="Bloqueio temporário do cartão"
                    disabled={!onToggleFreeze || pending}
                    onClick={() => void handleToggle(card.id)}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                      card.isFrozen ? 'bg-[var(--shell-lima)]' : 'bg-[var(--shell-surface-2)]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        card.isFrozen ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    title={depositReason}
                    className="rounded-full bg-[#E5E5E5] px-4 py-2.5 text-sm font-semibold text-[#9CA3AF]"
                  >
                    Depositar
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'ajustes' })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--shell-surface-2)] px-4 py-2.5 text-sm font-semibold text-[var(--shell-text)]"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                </div>
                <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{depositReason}</p>
                {card.isFrozen && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--shell-bad-text)]">
                    <Lock className="w-4 h-4" />
                    Cartão bloqueado temporariamente.
                  </p>
                )}
                {!card.isFrozen && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[var(--shell-muted)]">
                    <Unlock className="w-4 h-4" />
                    Cartão desbloqueado.
                  </p>
                )}
              </WhiteCard>
            </motion.div>
          );
        })
      )}

      {/* Transações do cartão — só type='card_payment' do ledger. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
      >
        <WhiteCard>
          <h2 className="text-[16px] font-bold text-[var(--shell-text)]">
            Transações do cartão
          </h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-[var(--shell-muted)]">
              De
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2 text-sm text-[var(--shell-text)] outline-none"
              />
            </label>
            <label className="text-sm text-[var(--shell-muted)]">
              Até
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface-2)] px-3 py-2 text-sm text-[var(--shell-text)] outline-none"
              />
            </label>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton lines={3} />
            ) : cardTxs.length === 0 ? (
              <EmptyState
                title="Sem lançamentos do cartão no período."
                text="Nenhuma transação de cartão encontrada com esses filtros."
              />
            ) : (
              <ul className="divide-y divide-[var(--shell-border)]">
                {cardTxs.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
                        {t.title || 'Cartão'}
                      </p>
                      <p className="truncate text-[13px] text-[var(--shell-muted)]">
                        {t.dateFormatted} · {STATUS_LABEL[t.status]}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        t.status === 'failed'
                          ? 'line-through text-[var(--shell-muted)]'
                          : 'text-[var(--shell-text)]'
                      }`}
                    >
                      {t.amount > 0 ? '+' : ''}
                      {brl(t.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </WhiteCard>
      </motion.div>
    </div>
  );
};
