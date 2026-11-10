import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  CalendarDays,
  Globe,
  Link2,
  Send,
  Share2,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { EmptyState, SPRING, WhiteCard } from '../ui';
import { Skeleton } from './shared';
import type { PainelProps } from './types';

const SP = 'America/Sao_Paulo';

/** Dia no fuso de São Paulo, como 'dd/mm/aaaa'. */
function dayKey(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: SP });
}

/** Timestamp ISO válido ou null (inválido fica fora das contas por data). */
function parseTs(ts: string): Date | null {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function brl(v: number): string {
  return `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

const WEEKDAY_PT: Record<string, number> = {
  Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5,
};
const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * U2 — Assistente (v3.1 §8-U2 + v3.2 §D5.5, §D6.2).
 * O assistente com IA NÃO está ligado: o campo de pergunta é desabilitado
 * e nunca promete resposta. O painel direito (400px no desktop) mostra só
 * o que o dado sustenta; "Meta do dia" NÃO existe e não é exibida.
 * "Seu site", domínio, rotinas, redes e reputação são "Em breve" honestos.
 */
export const PainelAssistenteView: React.FC<PainelProps> = ({
  userProfile,
  transactions,
  syncState,
}) => {
  const [sendNotice, setSendNotice] = useState(false);

  const displayName =
    userProfile.preferredName?.trim() ||
    userProfile.name?.trim() ||
    '';
  const greeting = displayName ? `Olá, ${displayName.split(' ')[0]}` : 'Olá';

  const loading = syncState.loading && transactions.length === 0;

  const { todayCount, todayTotal, weekBars } = useMemo(() => {
    const now = new Date();
    const today = dayKey(now);
    const weekdayEn = now.toLocaleDateString('en-US', { timeZone: SP, weekday: 'short' });
    // Índice da segunda-feira da semana atual (seg=0 … dom=6).
    const mondayOffset = WEEKDAY_PT[weekdayEn] ?? 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const weekKeys: string[] = Array.from(
      { length: 7 },
      (_, i) => dayKey(new Date(now.getTime() - (mondayOffset - i) * dayMs))
    );

    let count = 0;
    let total = 0;
    const bars = weekKeys.map(() => 0);
    for (const tx of transactions) {
      if (tx.status !== 'completed' || tx.category !== 'Vendas' || tx.amount <= 0) continue;
      const d = parseTs(tx.timestamp);
      if (!d) continue;
      const key = dayKey(d);
      if (key === today) {
        count += 1;
        total += tx.amount;
      }
      const wi = weekKeys.indexOf(key);
      if (wi >= 0) bars[wi] += tx.amount;
    }
    return { todayCount: count, todayTotal: total, weekBars: bars };
  }, [transactions]);

  const weekMax = Math.max(1, ...weekBars);

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Coluna do chat */}
        <motion.div {...stagger(0)}>
          <WhiteCard className="rounded-[24px]">
            <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
              <Sparkles className="w-6 h-6" /> Assistente
            </h1>
            <p className="mt-1 text-[14px] text-[var(--shell-muted)]">
              {greeting} — por onde quer começar?
            </p>

            <div className="mt-6 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--shell-lima)]">
                <Sparkles className="w-5 h-5 text-zinc-950" />
              </span>
              <div className="rounded-[20px] rounded-tl-[4px] bg-[var(--shell-surface-2)] px-4 py-3 text-[14px] leading-relaxed">
                O assistente ainda não está ligado — em breve ele vai ajudar você a
                vender, cobrar e organizar o seu dia por aqui.
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface-2)] py-1.5 pl-4 pr-1.5">
                <input
                  type="text"
                  disabled
                  aria-disabled="true"
                  placeholder="O assistente ainda não está ligado — em breve."
                  className="w-full bg-transparent text-[15px] text-[var(--shell-text)] placeholder:text-[var(--shell-muted)] outline-none disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setSendNotice(true)}
                  aria-label="Enviar (assistente desligado)"
                  title="O assistente ainda não está ligado"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--shell-black)] text-[var(--shell-on-black)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {sendNotice && (
                <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
                  O assistente ainda não está ligado — em breve.
                </p>
              )}
            </div>
          </WhiteCard>

          <p className="mt-4 px-1 text-center text-[13px] text-[var(--shell-muted)]">
            Seu assistente para vender mais.
          </p>
        </motion.div>

        {/* Painel direito — 400px no desktop, abaixo do chat no mobile */}
        <div className="space-y-4">
          <motion.div {...stagger(1)}>
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold">
                <CalendarDays className="w-5 h-5" /> Resumo do dia
              </h2>
              {loading ? (
                <div className="mt-3">
                  <Skeleton lines={2} />
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-[28px] font-bold tabular-nums">{brl(todayTotal)}</p>
                  <p className="text-[14px] text-[var(--shell-muted)]">
                    {todayCount === 0
                      ? 'Sem vendas hoje.'
                      : `${todayCount} ${todayCount === 1 ? 'venda' : 'vendas'} hoje.`}
                  </p>
                </div>
              )}
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(2)}>
            <WhiteCard>
              <h2 className="text-[16px] font-bold">Sua semana</h2>
              {loading ? (
                <div className="mt-3">
                  <Skeleton lines={3} />
                </div>
              ) : (
                <>
                  <div className="mt-4 flex h-28 items-end gap-2">
                    {weekBars.map((v, i) => (
                      <div key={WEEK_LABELS[i]} className="flex flex-1 flex-col items-center gap-1.5">
                        <span
                          className="w-full rounded-t-[6px] bg-[var(--shell-lima)]"
                          style={{ height: `${Math.max(v > 0 ? 6 : 2, (v / weekMax) * 96)}px` }}
                          title={`${WEEK_LABELS[i]}: ${brl(v)}`}
                        />
                        <span className="text-[11px] text-[var(--shell-muted)]">{WEEK_LABELS[i]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[13px] text-[var(--shell-muted)]">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--shell-lima)]" />
                    Vendas
                  </p>
                  {weekBars.every((v) => v === 0) && (
                    <p className="mt-1 text-[13px] text-[var(--shell-muted)]">
                      Sem vendas nesta semana ainda.
                    </p>
                  )}
                </>
              )}
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(3)}>
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold">
                <Globe className="w-5 h-5" /> Seu site
              </h2>
              <div className="mt-3">
                <EmptyState
                  title="Em breve"
                  text="Seu site ainda não existe na LeadsTap."
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: 'Copiar link', Icon: Link2 },
                  { label: 'Catálogo', Icon: Share2 },
                  { label: 'Agendamentos', Icon: CalendarDays },
                ].map(({ label, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title="Seu site ainda não existe na LeadsTap."
                    className="flex items-center gap-1.5 rounded-full bg-[#E5E5E5] px-3 py-2 text-[13px] font-semibold text-[#9CA3AF]"
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(4)}>
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold">
                <BarChart3 className="w-5 h-5" /> Performance (últimos 30 dias)
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {['Visitas', 'Visitantes únicos', 'Visualizações'].map((label) => (
                  <div
                    key={label}
                    className="rounded-[16px] bg-[var(--shell-surface-2)] px-2 py-3"
                  >
                    <p className="text-[22px] font-bold tabular-nums">0</p>
                    <p className="text-[12px] text-[var(--shell-muted)]">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-[var(--shell-muted)]">
                Você vai ver os resultados do seu site aqui quando houver visitas.
              </p>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(5)}>
            <WhiteCard>
              <h2 className="text-[16px] font-bold">Conectar domínio (Em breve)</h2>
              <p className="mt-2 text-[14px] text-[var(--shell-muted)]">
                Conectar domínio ainda não disponível.
              </p>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(6)}>
            <WhiteCard>
              <h2 className="text-[16px] font-bold">Suas rotinas</h2>
              <p className="mt-2 text-[14px] text-[var(--shell-muted)]">
                Rotinas ainda não disponíveis.
              </p>
              <button
                type="button"
                disabled
                title="Rotinas ainda não disponíveis."
                className="mt-3 rounded-full bg-[#E5E5E5] px-4 py-2.5 text-[14px] font-semibold text-[#9CA3AF]"
              >
                Criar nova
              </button>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(7)}>
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold">
                <Users className="w-5 h-5" /> Redes sociais
              </h2>
              <p className="mt-2 text-[14px] text-[var(--shell-muted)]">
                Conecte suas redes sociais para acompanhar comentários e vendas vindas
                delas. Em breve.
              </p>
            </WhiteCard>
          </motion.div>

          <motion.div {...stagger(8)}>
            <WhiteCard>
              <h2 className="flex items-center gap-2 text-[16px] font-bold">
                <Star className="w-5 h-5" /> Sua reputação
              </h2>
              <p className="mt-2 text-[14px] text-[var(--shell-muted)]">
                Avaliações e nota dos seus clientes aparecem aqui. Em breve.
              </p>
            </WhiteCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
