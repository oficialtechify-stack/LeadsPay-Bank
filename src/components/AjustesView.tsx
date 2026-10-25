import React from 'react';
import { LogOut } from 'lucide-react';
import type { LeadsTapProfile, MigrationRequest } from '../types';

interface AjustesViewProps {
  profile: LeadsTapProfile | null;
  migration: MigrationRequest | null;
  onLogout: () => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  profile,
  migration,
  onLogout,
}) => {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Ajustes</h1>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold">Sua conta</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Nome: </span>
            {profile?.displayName || '—'}
          </p>
          <p>
            <span className="text-slate-500">E-mail: </span>
            {profile?.email || '—'}
          </p>
          <p>
            <span className="text-slate-500">Chaves Pix registradas: </span>
            {profile ? profile.pixKeys.length : '—'}
          </p>
          <p>
            <span className="text-slate-500">Migração LeadsPay: </span>
            {profile?.migratedFromLeadsPay
              ? 'Concluída'
              : migration?.status === 'awaiting_confirmation'
                ? 'Solicitada — aguardando confirmação'
                : 'Não solicitada'}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold">Sobre a LeadsTap</h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          A LeadsTap é sua conta individual dentro de uma fintech — não é um
          banco. Carregar a conta é grátis, taxa só existe na venda (uma só,
          mostrada antes), e quem migra da LeadsPay não paga mais os R$ 2,00
          para sacar. Pix para outros bancos e saque para banco dependem de
          trilho parceiro e ainda não estão disponíveis.
        </p>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-full border border-red-500/40 text-red-300 font-semibold py-3 text-sm flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>
    </div>
  );
};
