import React from 'react';
import { motion } from 'motion/react';
import { AtSign, LayoutGrid, Link2, MessageCircle, X } from 'lucide-react';
import { PrimaryButton, SoonBadge } from '../ui';

/**
 * Modal Link na Bio — U24 (v3.1 §8-U24 + v3.2 §D5.2).
 * 3 benefícios com copy própria; abas da bio em prévia (ainda não ativa);
 * "Experimentar" e "Fale conosco" desabilitados com o motivo. "X" fecha
 * e volta para a Home.
 */
const BENEFITS = [
  { Icon: Link2, title: 'Receba pagamentos', text: 'Seu link recebe pagamentos direto na sua conta.' },
  { Icon: LayoutGrid, title: 'Uma vitrine toda sua', text: 'Seus produtos e serviços num só endereço.' },
  { Icon: AtSign, title: 'Tudo em um só lugar', text: 'Loja, catálogo e agendamentos reunidos na sua bio.' },
];

export const LinkBioModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Seu Link na Bio">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-black/40"
      onClick={onClose}
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative w-full max-w-md rounded-[24px] bg-[var(--shell-surface)] p-6 text-[var(--shell-text)] shadow-xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 rounded-full p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)]"
      >
        <X className="w-5 h-5" />
      </button>

      <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#ede9fe] text-violet-600">
        <AtSign className="w-7 h-7" />
      </span>
      <h2 className="mt-4 text-[24px] font-bold leading-tight tracking-[-0.02em]">
        Seu Link na Bio
      </h2>
      <p className="mt-1 text-[14px] leading-relaxed text-[var(--shell-muted)]">
        Um só link com tudo o que você vende.
      </p>

      <div className="mt-5 space-y-4">
        {BENEFITS.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--shell-surface-2)]">
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[14px] font-semibold">{title}</p>
              <p className="text-[13px] leading-relaxed text-[var(--shell-muted)]">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-[13px] font-semibold">Abas da bio</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Loja', 'Catálogo', 'Agendamentos'].map((tab) => (
            <span
              key={tab}
              className="rounded-full bg-[var(--shell-surface-2)] px-3 py-1.5 text-[13px] font-medium"
            >
              {tab}
            </span>
          ))}
          <SoonBadge reason="Link na Bio ainda não disponível." />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <PrimaryButton onClick={() => {}} disabled>
          Experimentar
        </PrimaryButton>
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e5e5e5] py-3.5 text-[15px] font-semibold text-[#9ca3af]"
          title="Fale conosco — em breve."
        >
          <MessageCircle className="w-4 h-4" /> Fale conosco
        </button>
        <p className="text-center text-[13px] text-[var(--shell-muted)]">
          Link na Bio ainda não disponível.
        </p>
      </div>
    </motion.div>
  </div>
);
