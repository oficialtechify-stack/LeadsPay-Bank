import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, FileText, Settings, ShoppingCart } from 'lucide-react';
import { EmptyState, PrimaryButton, SoonBadge, SPRING, WhiteCard } from '../ui';
import { Skeleton, SyncBanner } from './shared';
import type { PainelProps } from './types';

const REASON = 'Checkout ainda não disponível — precisa do trilho da LeadsPay.';

/** Benefícios do §D5.2 (v3.2) — genéricos, sem números prometidos. */
const BENEFITS = [
  'Compare os hábitos de pagamento',
  'Exiba as opções de pagamento da LeadsTap',
  'Receba todas as informações dos seus clientes',
];

type CheckoutTab = 'checkouts' | 'docs' | 'settings';

const TABS: { id: CheckoutTab; label: string }[] = [
  { id: 'checkouts', label: 'Seus Checkouts' },
  { id: 'docs', label: 'Documentação' },
  { id: 'settings', label: 'Configurações' },
];

/**
 * U13 — Checkout (v3.1 §8-U13, v3.2 §D5.2).
 * Não existe trilho de checkout no código (nenhum `create_checkout`):
 * criar checkout é "Em breve" com o motivo. As 3 abas existem e são
 * honestas sobre o estado atual.
 */
export const PainelCheckout: React.FC<PainelProps> = ({ syncState }) => {
  const [tab, setTab] = useState<CheckoutTab>('checkouts');

  return (
    <div>
      <SyncBanner syncState={syncState} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0 }}
      >
        <h1 className="text-[20px] md:text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-[var(--shell-muted)]">
          Cobre online com a página de pagamento da LeadsTap.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="mt-4 flex gap-1 overflow-x-auto border-b border-[var(--shell-border)]"
        role="tablist"
        aria-label="Seções do checkout"
      >
        {TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`relative shrink-0 px-4 pb-3 pt-2 text-[15px] font-semibold ${
                active ? 'text-[var(--shell-text)]' : 'text-[var(--shell-muted)]'
              }`}
            >
              {label}
              {active && (
                <motion.span
                  layoutId="checkout-tab-underline"
                  transition={SPRING}
                  className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[var(--shell-black)]"
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {tab === 'checkouts' && (
        <motion.div
          key="checkouts"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="mt-4"
        >
          <WhiteCard className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="flex min-h-[180px] items-center justify-center rounded-[20px] bg-[#EDE9FE]">
              <ShoppingCart className="h-10 w-10 text-[var(--shell-muted)]" />
            </div>
            <div>
              <SoonBadge reason={REASON} />
              <h2 className="mt-3 text-[20px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
                Crie seu Checkout
              </h2>
              <ul className="mt-4 space-y-3">
                {BENEFITS.map((label, i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: 0.15 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--shell-lima)]">
                      <Check className="h-4 w-4 text-black" />
                    </span>
                    <span className="text-[15px] font-medium leading-snug text-[var(--shell-text)]">
                      {label}
                    </span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="min-w-[170px] flex-1" title={REASON}>
                  <PrimaryButton onClick={() => undefined} disabled>
                    Criar Checkout
                  </PrimaryButton>
                </div>
                <div className="min-w-[170px] flex-1" title={REASON}>
                  <PrimaryButton onClick={() => undefined} variant="outline" disabled>
                    Ver documentação
                  </PrimaryButton>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{REASON}</p>
            </div>
          </WhiteCard>

          <div className="mt-4">
            {syncState.loading ? (
              <WhiteCard>
                <Skeleton lines={3} />
              </WhiteCard>
            ) : (
              <EmptyState
                title="Você ainda não tem checkouts."
                text="Quando o checkout da LeadsPay estiver ligado, as páginas de pagamento que você criar aparecem aqui."
              />
            )}
          </div>
        </motion.div>
      )}

      {tab === 'docs' && (
        <motion.div
          key="docs"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="mt-4"
        >
          <WhiteCard className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
              <FileText className="h-7 w-7 text-[var(--shell-muted)]" />
            </div>
            <div className="mt-4">
              <EmptyState
                title="A documentação do checkout ainda não está disponível."
                text="Quando o checkout da LeadsPay estiver ligado, os guias de integração e os exemplos de uso aparecem aqui."
              />
            </div>
          </WhiteCard>
        </motion.div>
      )}

      {tab === 'settings' && (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="mt-4"
        >
          <WhiteCard className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--shell-surface-2)]">
              <Settings className="h-7 w-7 text-[var(--shell-muted)]" />
            </div>
            <div className="mt-4">
              <EmptyState
                title="As configurações do checkout aparecem quando o checkout estiver ativo."
                text="Opções de pagamento, confirmação por e-mail e comportamento da página de pagamento ficam aqui."
              />
            </div>
            <p className="mt-3 text-[13px] text-[var(--shell-muted)]">{REASON}</p>
          </WhiteCard>
        </motion.div>
      )}
    </div>
  );
};
