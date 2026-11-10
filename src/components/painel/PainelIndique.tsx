import React from 'react';
import { motion } from 'motion/react';
import { Gift, QrCode, Share2, TrendingUp } from 'lucide-react';
import { SPRING, SoonBadge, WhiteCard } from '../ui';
import type { PainelProps } from './types';

/**
 * U20 — Indique e ganhe (v3.1 §8-U20).
 * NENHUM ganho ou recompensa prometido: sem valores, sem produtos de
 * terceiros. O programa ainda não está aberto — os 3 passos descrevem
 * como vai funcionar, sem prometer nada.
 */
export const PainelIndique: React.FC<PainelProps> = () => {
  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay: i * 0.05 },
  });

  return (
    <div>
      <motion.div {...stagger(0)}>
        <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
          <Gift className="w-6 h-6" /> Indique e ganhe
        </h1>
        <p className="mt-1 text-[14px] text-[var(--shell-muted)]">
          O programa de indicação ainda não está aberto.
        </p>
      </motion.div>

      <motion.div {...stagger(1)} className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          {
            Icon: TrendingUp,
            title: 'Venda com Tap',
            text: 'Gere um código e receba na hora, sem maquininha.',
          },
          {
            Icon: QrCode,
            title: 'Receba com Pix',
            text: 'Compartilhe sua chave Pix com quem vai pagar.',
          },
          {
            Icon: Share2,
            title: 'Acompanhe suas vendas',
            text: 'Veja quem pagou você e quanto entrou.',
          },
        ].map(({ Icon, title, text }) => (
          <WhiteCard key={title}>
            <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--shell-surface-2)]">
              <Icon className="w-7 h-7" />
            </span>
            <p className="mt-3 text-[16px] font-bold">{title}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--shell-muted)]">
              {text}
            </p>
            <p className="mt-3">
              <SoonBadge reason="o programa ainda não está aberto" />
            </p>
          </WhiteCard>
        ))}
      </motion.div>

      <motion.div {...stagger(2)}>
        <WhiteCard className="mt-4">
          <h2 className="text-[16px] font-bold">Como vai funcionar</h2>
          <ol className="mt-3 space-y-3">
            {[
              'Convide alguém para conhecer a LeadsTap.',
              'A pessoa cria a conta dela.',
              'Quando o programa abrir, você acompanha suas indicações aqui.',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-[14px] leading-relaxed">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--shell-black)] text-[13px] font-bold text-[var(--shell-on-black)]">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            disabled
            title="O programa de indicação ainda não está aberto."
            className="mt-5 rounded-full bg-[#E5E5E5] px-5 py-3 text-[14px] font-semibold text-[#9CA3AF]"
          >
            Compartilhar convite
          </button>
          <p className="mt-2 text-[13px] text-[var(--shell-muted)]">
            Nenhuma recompensa é prometida por enquanto — quando o programa abrir,
            as regras aparecem aqui.
          </p>
        </WhiteCard>
      </motion.div>
    </div>
  );
};
