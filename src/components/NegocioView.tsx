import React from 'react';
import { Code2, PieChart, PiggyBank } from 'lucide-react';
import type { Route } from '../lib/routes';
import { ActionTile, SectionTitle, SoonBadge, WhiteCard } from './ui';

/**
 * Aba Meu Negócio (§4.3 do plano v2) — composta SÓ com o que existe no Bank:
 * Gestão Financeira, Rendimentos (`investedBalance` real) e Integrações/API.
 *
 * NADA de clientes/site/catálogo/agenda/equipe/Jim/Renda Protegida. Os
 * cartões "Quem são os concorrentes?" e "Como consigo crédito?" NÃO entram
 * neste passo (Q2). Sem "105% CDI" em lugar nenhum (§7.10).
 */
export const NegocioView: React.FC<{
  investedBalance: number;
  showBalance: boolean;
  onNavigate: (route: Route) => void;
}> = ({ investedBalance, showBalance, onNavigate }) => {
  const soon = (title: string, reason: string): Route => ({
    name: 'soon',
    title,
    reason,
    backTo: { name: 'negocio' },
  });

  return (
    <div className="space-y-5">
      {/* Organize seu negócio */}
      <div>
        <SectionTitle>Organize seu negócio</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <ActionTile
            Icon={PieChart}
            label="Gestão Financeira"
            tone="amber"
            onClick={() => onNavigate({ name: 'gestao' })}
          />
          <ActionTile
            Icon={Code2}
            label="Integrações / API"
            tone="dark"
            onClick={() => onNavigate({ name: 'api' })}
          />
        </div>
      </div>

      {/* Seus rendimentos — valor real do perfil, sem promessa */}
      <div>
        <SectionTitle>Seus rendimentos</SectionTitle>
        <WhiteCard className="mt-3 !p-0 overflow-hidden divide-y divide-black/[0.06]">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[15px] font-semibold">Investimentos</p>
              <p className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums mt-0.5 text-zinc-950">
                {showBalance
                  ? `R$ ${Math.max(0, investedBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'R$ ••••••'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onNavigate(
                soon(
                  'CDB',
                  'CDB e investimento só existem com parceiro licenciado. Nenhum rendimento é prometido até o parceiro existir.',
                ),
              )
            }
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <span>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-zinc-950">
                <PiggyBank className="w-5 h-5 text-zinc-900" />
                CDB
              </span>
              <span className="block text-sm text-zinc-500 mt-0.5">Sem investimento ativo</span>
            </span>
            <SoonBadge />
          </button>
        </WhiteCard>
        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
          CDB e investimento só existem com parceiro licenciado. Nenhum
          rendimento é prometido até o parceiro existir.
        </p>
      </div>
    </div>
  );
};
