import React from 'react';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Zap } from 'lucide-react';
import { formatBRL, formatTimestamp } from '../lib/format';
import { savingsFromWithdrawalsCents } from '../lib/leadstap';
import type {
  LeadsTapProfile,
  LedgerEntry,
  MigrationRequest,
} from '../types';
import type { MainTab } from './BottomNavBar';

export function entryLabel(type: LedgerEntry['type']): string {
  switch (type) {
    case 'pix_in':
      return 'Pix recebido';
    case 'pix_out':
      return 'Pix enviado';
    case 'tap_payment':
      return 'Pagamento LeadsTap';
    case 'tap_receipt':
      return 'Venda LeadsTap';
    case 'withdrawal':
      return 'Saque';
    default:
      return 'Movimento';
  }
}

interface DashboardViewProps {
  profile: LeadsTapProfile | null;
  entries: LedgerEntry[];
  balanceCents: number;
  migration: MigrationRequest | null;
  migrationBusy: boolean;
  onRequestMigration: () => void;
  onGoTab: (tab: MainTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  entries,
  balanceCents,
  migration,
  migrationBusy,
  onRequestMigration,
  onGoTab,
}) => {
  const savingsCents = savingsFromWithdrawalsCents(entries);
  const recent = entries.slice(0, 5);
  const name = profile?.displayName || 'Bem-vindo à LeadsTap';

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/60 to-[#0a0c0d] p-5">
        <p className="text-sm text-slate-400">{name}</p>
        <p className="text-xs text-slate-500 mt-1">Saldo da sua conta LeadsTap</p>
        <p className="font-display text-4xl font-bold mt-2 font-mono-numbers">
          {formatBRL(balanceCents)}
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Saldo = soma dos seus movimentos reais no extrato. Nenhum valor aqui é
          estimado.
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => onGoTab('cobrar')}
            className="flex-1 rounded-full bg-[#00e676] text-black font-semibold py-2.5 text-sm"
          >
            Cobrar
          </button>
          <button
            type="button"
            onClick={() => onGoTab('pix')}
            className="flex-1 rounded-full border border-white/20 font-semibold py-2.5 text-sm"
          >
            Enviar Pix
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-950/30 p-5">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-[#00e676]" />
          <h2 className="font-semibold">Você economizou {formatBRL(savingsCents)} em saques</h2>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Cada saque feito pela LeadsTap economiza R$ 2,00 em relação ao saque na
          LeadsPay. O valor acima vem só dos seus saques reais registrados — zero
          quando ainda não há nenhum.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        {profile?.migratedFromLeadsPay ? (
          <>
            <h2 className="font-semibold">Você já recebe na LeadsTap</h2>
            <p className="text-sm text-slate-400 mt-2">
              Sua conta está migrada: saques por aqui não pagam os R$ 2,00 da
              LeadsPay.
            </p>
          </>
        ) : migration?.status === 'awaiting_confirmation' ? (
          <>
            <h2 className="font-semibold">Migração solicitada — aguardando confirmação</h2>
            <p className="text-sm text-slate-400 mt-2">
              Sua solicitação foi registrada. A liquidação entre LeadsPay e LeadsTap
              depende de integração de backend e está pendente. Nenhum valor foi
              transferido até lá.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-semibold">Receber seu saldo da LeadsPay aqui</h2>
            <p className="text-sm text-slate-400 mt-2">
              Com um toque você solicita que seu saldo da LeadsPay passe a ficar na
              LeadsTap — e aí seus saques deixam de pagar os R$ 2,00. Registrar a
              solicitação não move dinheiro: a transferência só acontece após a
              confirmação da liquidação entre os dois sistemas.
            </p>
            <button
              type="button"
              onClick={onRequestMigration}
              disabled={migrationBusy}
              className="mt-4 w-full rounded-full bg-[#00e676] text-black font-semibold py-3 text-sm disabled:opacity-50"
            >
              {migrationBusy ? 'Registrando…' : 'Quero receber na LeadsTap'}
            </button>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Movimentos recentes</h2>
          <button
            type="button"
            onClick={() => onGoTab('extrato')}
            className="text-sm text-[#00e676]"
          >
            Ver tudo
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400 mt-3">
            Nenhum movimento ainda. Seu extrato começa vazio — e só mostra o que
            realmente aconteceu.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {e.amountCents >= 0 ? (
                    <ArrowDownLeft className="w-5 h-5 text-[#00e676] shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm truncate">{entryLabel(e.type)}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {e.description || e.counterpartyName} · {formatTimestamp(e.createdAt)}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-mono-numbers text-sm shrink-0 ${
                    e.amountCents >= 0 ? 'text-[#00e676]' : 'text-slate-200'
                  }`}
                >
                  {e.amountCents >= 0 ? '+' : ''}
                  {formatBRL(e.amountCents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex gap-3">
        <Zap className="w-5 h-5 text-[#00e676] shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400">
          <span className="text-slate-100 font-semibold">Regra da LeadsTap: </span>
          carregar a conta é grátis e taxa só existe na venda — uma só, mostrada
          antes de você confirmar.
        </p>
      </section>
    </div>
  );
};
