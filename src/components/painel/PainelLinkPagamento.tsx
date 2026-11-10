import React from 'react';
import { motion } from 'motion/react';
import { Link2, Plus } from 'lucide-react';
import { EmptyState, SoonBadge, SPRING, WhiteCard } from '../ui';
import { SyncBanner } from './shared';
import type { PainelProps } from './types';

/**
 * U9 — Link de Pagamento (v3.1 §8-U9).
 * Estado vazio honesto: não existe tipo de transação de link de
 * pagamento no ledger (os tipos são pix_in, pix_out, tap_to_pay,
 * card_payment, bill_payment e investment) e não existe trilho
 * `create_checkout` no código — sem ele, o botão "Criar link" fica
 * desabilitado com o motivo exato do plano. Quando o checkout da
 * LeadsPay existir, a lista passa a mostrar os links reais aqui.
 */
export const PainelLinkPagamento: React.FC<PainelProps> = ({ syncState }) => {
  const createReason = 'Links de pagamento precisam do checkout da LeadsPay — ainda não ligado.';

  return (
    <div className="space-y-4">
      <SyncBanner syncState={syncState} />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <WhiteCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--shell-lima)]">
                <Link2 className="h-6 w-6 text-zinc-950" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--shell-text)]">
                    Link de Pagamento
                  </h1>
                  <SoonBadge reason={createReason} />
                </div>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--shell-muted)]">
                  Crie links para produtos ou serviços e envie para os seus clientes pagarem
                  online.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled
              title={createReason}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E5E5E5] px-4 py-2.5 text-sm font-semibold text-[#9CA3AF]"
            >
              <Plus className="h-4 w-4" />
              Criar link
            </button>
          </div>
          <p className="mt-2 text-[13px] text-[var(--shell-muted)]">{createReason}</p>
        </WhiteCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
      >
        <EmptyState
          title="Você ainda não criou nenhum link de pagamento."
          text="Quando o checkout da LeadsPay estiver ligado, seus links aparecem aqui e você pode copiar e enviar para os clientes."
        />
      </motion.div>
    </div>
  );
};
