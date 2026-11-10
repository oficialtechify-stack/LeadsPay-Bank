import React from 'react';
import { motion } from 'motion/react';
import { FileText, TriangleAlert } from 'lucide-react';
import { SPRING, WhiteCard } from '../ui';
import type { PainelProps } from './types';

/**
 * U18 — DAS MEI (v3.1 §8-U18).
 * SEMPRE o estado bloqueado honesto: não existe campo de CNPJ no dado
 * nem fluxo para cadastrá-lo (`document` é CPF-ou-CNPJ único). Sem ramo
 * "Com CNPJ" — ele é inalcançável por construção.
 */
export const PainelDasMei: React.FC<PainelProps> = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={SPRING}
  >
    <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
      <FileText className="w-6 h-6" /> Guias DAS
    </h1>
    <p className="mt-1 text-[14px] text-[var(--shell-muted)]">
      As guias do DAS MEI aparecem aqui quando estiverem disponíveis.
    </p>

    <WhiteCard className="mt-4">
      <div className="flex items-start gap-3 rounded-[16px] bg-[var(--shell-warn-bg)] px-4 py-3.5">
        <TriangleAlert className="mt-0.5 w-5 h-5 shrink-0 text-[var(--shell-warn-text)]" />
        <div>
          <p className="text-[15px] font-semibold text-[var(--shell-warn-text)]">
            Conta sem CNPJ cadastrado
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--shell-warn-text)]">
            Conta sem CNPJ cadastrado — as guias DAS ainda não estão disponíveis na
            LeadsTap.
          </p>
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-[var(--shell-muted)]">
        O DAS é a guia mensal do MEI. Quando a LeadsTap passar a emitir as guias,
        elas aparecem nesta tela com o valor e o vencimento de cada mês.
      </p>
    </WhiteCard>
  </motion.div>
);
