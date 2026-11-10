import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bell, CalendarCheck, CalendarClock, CalendarDays, Wallet } from 'lucide-react';
import { PrimaryButton, SoonBadge, SPRING, WhiteCard } from '../ui';
import { SyncBanner } from './shared';
import type { PainelProps } from './types';

const REASON = 'Agendamentos ainda não disponíveis na LeadsTap.';

/** Benefícios do §D5.2 (v3.2) — genéricos, sem números prometidos. */
const BENEFITS = [
  { Icon: CalendarCheck, label: 'Controle total da agenda' },
  { Icon: CalendarClock, label: 'Acompanhe seus agendamentos' },
  { Icon: Wallet, label: 'Receba pagamentos antecipados' },
  { Icon: Bell, label: 'Notificações sobre o agendamento' },
];

/** Passos de como vai funcionar (descrição do fluxo, sem agenda real). */
const STEPS = [
  { n: 1, title: 'Configure sua agenda', text: 'Defina dias, horários e serviços.' },
  { n: 2, title: 'Compartilhe o link', text: 'Envie o link de agendamento para os seus clientes.' },
  { n: 3, title: 'Receba os agendamentos', text: 'Acompanhe tudo aqui, sem trocar de aplicativo.' },
];

/**
 * U12 — Agendamentos (v3.1 §8-U12, v3.2 §D5.2 e §D7.3).
 * Onboarding em 2 colunas (bloco de cor + ícone no lugar de foto),
 * título 32px desktop / 26px mobile, 4 benefícios e 3 passos.
 * Nada de agenda falsa: botão desabilitado com o motivo.
 */
export const PainelAgendamentos: React.FC<PainelProps> = ({ syncState }) => (
  <div>
    <SyncBanner syncState={syncState} />

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0 }}
    >
      <WhiteCard className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="flex min-h-[220px] items-center justify-center rounded-[20px] bg-[#EDE9FE]">
          <CalendarDays className="h-10 w-10 text-[var(--shell-muted)]" />
        </div>
        <div>
          <SoonBadge reason={REASON} />
          <h1 className="mt-3 text-[26px] md:text-[32px] font-bold leading-tight tracking-[-0.02em] text-[var(--shell-text)]">
            Agendamento online
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--shell-muted)]">
            Deixe seus clientes marcarem horário sozinhos, sem você precisar
            responder mensagem por mensagem.
          </p>
          <ul className="mt-5 space-y-3">
            {BENEFITS.map(({ Icon, label }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.05 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
                  <Icon className="h-5 w-5 text-[var(--shell-text)]" />
                </span>
                <span className="text-[15px] font-semibold text-[var(--shell-text)]">
                  {label}
                </span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-6 max-w-[260px]" title={REASON}>
            <PrimaryButton onClick={() => undefined} disabled>
              Vamos começar
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </PrimaryButton>
          </div>
          <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{REASON}</p>
        </div>
      </WhiteCard>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.15 }}
      className="mt-4"
    >
      <WhiteCard>
        <h2 className="text-[16px] font-bold text-[var(--shell-text)]">Como vai funcionar</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ n, title, text }, i) => (
            <motion.li
              key={n}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.2 + i * 0.05 }}
              className="rounded-[20px] bg-[var(--shell-surface-2)] p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--shell-lima)] text-sm font-bold text-black">
                {n}
              </span>
              <p className="mt-3 text-[15px] font-semibold text-[var(--shell-text)]">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--shell-muted)]">{text}</p>
            </motion.li>
          ))}
        </ol>
      </WhiteCard>
    </motion.div>
  </div>
);
