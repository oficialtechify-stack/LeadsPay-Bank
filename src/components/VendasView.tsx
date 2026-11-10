import React from 'react';
import { ArrowUpRight, QrCode, Smartphone, Store } from 'lucide-react';
import type { Transaction } from '../types';
import type { Route } from '../lib/routes';
import { computeSalesToday } from '../lib/missions';
import { ActionTile, Card, SectionTitle } from './ui';

/**
 * Aba Vendas (§4.2 do plano v2) — compõe sobre o ExtratoView + LeadsTapModal.
 *
 * "Vendas de hoje" = soma das `transactions` de hoje com venda Tap e
 * `amount > 0` (Q12=(A): pagar pelo Tap grava negativo e fica fora).
 * Conta nova: 0 vendas / R$ 0,00. SEM seção de taxas (Q5=omitir — não
 * aplicar a regra R$ 0,99 da LeadsTap, outro produto). O ExtratoView
 * inteiro vive como rota interna (`extrato`, bottom "Extrato").
 */
export const VendasView: React.FC<{
  transactions: Transaction[];
  showBalance: boolean;
  onNavigate: (route: Route) => void;
}> = ({ transactions, showBalance, onNavigate }) => {
  const { count, total } = computeSalesToday(transactions);

  return (
    <div className="space-y-5">
      {/* Vendas de hoje — dados reais do ledger */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-zinc-950">
              {count === 1 ? '1 venda hoje' : `${count} vendas hoje`}
            </p>
            <p className="text-[26px] font-extrabold tracking-[-0.02em] tabular-nums mt-1 text-zinc-950">
              {showBalance
                ? `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'R$ ••••••'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {count === 0
                ? 'Nenhuma venda registrada hoje.'
                : 'Soma das cobranças Tap de hoje.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'extrato' })}
            className="flex items-center gap-1 text-[15px] font-semibold text-zinc-900 shrink-0"
          >
            Ver todas
            <ArrowUpRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </Card>

      {/* Vender agora */}
      <div>
        <SectionTitle>Vender agora</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'tap' })}
            className="flex flex-col items-start justify-between rounded-[24px] bg-zinc-950 p-4 min-h-[132px] text-left"
          >
            <Smartphone className="w-8 h-8 text-[#00e676]" />
            <span className="text-[15px] font-semibold text-white leading-tight">
              Cobrar com Tap
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'pix' })}
            className="flex flex-col items-start justify-between rounded-[24px] bg-[#f4f4f5] p-4 min-h-[132px] text-left"
          >
            <QrCode className="w-8 h-8 text-zinc-900" />
            <span className="text-[15px] font-semibold leading-tight text-zinc-900">
              Receber Pix
            </span>
          </button>
        </div>
      </div>

      {/* Seu negócio — só o atalho; o conteúdo vive na aba própria */}
      <div>
        <SectionTitle>Seu negócio</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <ActionTile
            Icon={Store}
            label="Meu Negócio"
            tone="green"
            onClick={() => onNavigate({ name: 'negocio' })}
          />
        </div>
      </div>
    </div>
  );
};
