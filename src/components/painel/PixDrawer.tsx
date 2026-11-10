import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, KeyRound, X } from 'lucide-react';
import { SPRING, PrimaryButton, inputClass } from '../ui';
import type { UserProfile } from '../../types';

type PixKeyType = 'cpf' | 'email' | 'phone';

const KEY_LABEL: Record<PixKeyType, string> = {
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Telefone',
};

/**
 * Drawer Área Pix — U23 (v3.1 §8-U23).
 * - Chaves Pix REAIS do perfil, filtradas para cpf/email/phone — NUNCA
 *   o tipo aleatório gerado pelo sistema (essa chave nunca é exibida).
 * - SEM QR, SEM "Imprimir QR Code", SEM pixPayloadMock.
 * - Aba Limites: salva de verdade via `onSavePixLimits`.
 * - Sem chave real: texto honesto + botão que abre o envio de Pix
 *   interno (PixModal, aba enviar).
 */
export const PixDrawer: React.FC<{
  userProfile: UserProfile;
  initialTab?: 'keys' | 'limits';
  onClose: () => void;
  onSavePixLimits: (daily: number, nightly: number) => void;
  onOpenPixSend: () => void;
}> = ({ userProfile, initialTab = 'keys', onClose, onSavePixLimits, onOpenPixSend }) => {
  const [tab, setTab] = useState<'keys' | 'limits'>(initialTab);
  const [copied, setCopied] = useState<string | null>(null);
  const [daily, setDaily] = useState(String(userProfile.dailyPixLimit));
  const [nightly, setNightly] = useState(String(userProfile.nightlyPixLimit));
  const [saved, setSaved] = useState(false);

  const realKeys = (userProfile.pixKeys || []).filter(
    (k): k is { type: PixKeyType; value: string } =>
      (k.type === 'cpf' || k.type === 'email' || k.type === 'phone') && !!k.value
  );

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Sem acesso à área de transferência: o valor continua visível.
    }
    setCopied(value);
    window.setTimeout(() => setCopied((c) => (c === value ? null : c)), 2000);
  };

  const saveLimits = () => {
    const d = Number(daily);
    const n = Number(nightly);
    if (!Number.isFinite(d) || !Number.isFinite(n) || d < 0 || n < 0) return;
    onSavePixLimits(d, n);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Área Pix">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 1 }}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[var(--shell-surface)] text-[var(--shell-text)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--shell-border)] px-5 py-4">
          <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em]">
            <KeyRound className="w-5 h-5" /> Área Pix
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Área Pix"
            className="rounded-full p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[var(--shell-border)] px-5 pt-3">
          {(['keys', 'limits'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 pb-2 text-[14px] font-semibold transition-colors ${
                tab === t
                  ? 'border-zinc-950 text-zinc-950'
                  : 'border-transparent text-[var(--shell-muted)]'
              }`}
            >
              {t === 'keys' ? 'Chaves' : 'Limites'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'keys' && (
            <div className="space-y-3">
              {realKeys.length === 0 ? (
                <div>
                  <p className="text-[14px] leading-relaxed">
                    Você ainda não tem chave Pix cadastrada.
                  </p>
                  <div className="mt-4">
                    <PrimaryButton onClick={onOpenPixSend}>Enviar Pix</PrimaryButton>
                  </div>
                </div>
              ) : (
                realKeys.map((key) => (
                  <div
                    key={`${key.type}:${key.value}`}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--shell-border)] p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--shell-muted)]">
                        {KEY_LABEL[key.type]}
                      </p>
                      <p className="truncate text-[14px] font-medium">{key.value}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copy(key.value)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--shell-surface-2)] px-3 py-2 text-[13px] font-semibold"
                    >
                      {copied === key.value ? (
                        <>
                          <Check className="w-4 h-4" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
              <p className="text-[13px] leading-relaxed text-[var(--shell-muted)]">
                O Pix aqui funciona entre contas LeadsTap.
              </p>
            </div>
          )}

          {tab === 'limits' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[13px] font-semibold" htmlFor="pix-daily">
                  Limite diário (R$)
                </label>
                <input
                  id="pix-daily"
                  className={inputClass}
                  inputMode="decimal"
                  value={daily}
                  onChange={(e) => setDaily(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold" htmlFor="pix-nightly">
                  Limite noturno (R$)
                </label>
                <input
                  id="pix-nightly"
                  className={inputClass}
                  inputMode="decimal"
                  value={nightly}
                  onChange={(e) => setNightly(e.target.value)}
                />
              </div>
              <PrimaryButton onClick={saveLimits}>Salvar Novos Limites</PrimaryButton>
              {saved && (
                <p className="text-[13px] font-medium text-[var(--shell-ok-text)]">
                  Limites salvos.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </div>
  );
};
