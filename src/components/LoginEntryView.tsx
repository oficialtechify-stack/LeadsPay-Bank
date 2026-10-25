import React from 'react';
import { Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface LoginEntryViewProps {
  onLogin: () => void;
}

export const LoginEntryView: React.FC<LoginEntryViewProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <BrandLogo size="xl" showSubtitle />
      <h1 className="font-display text-3xl font-bold text-center mt-8 leading-tight">
        Sua conta individual.
        <br />
        Sem taxa para mover seu dinheiro.
      </h1>
      <ul className="mt-8 space-y-3 w-full max-w-sm text-sm">
        {[
          'Carregar a conta é grátis — Pix interno e saldo interno, taxa zero.',
          'Taxa só existe na venda — uma só, mostrada antes de confirmar.',
          'Quem migra da LeadsPay não paga mais os R$ 2,00 para sacar.',
          'Cobrança entre contas LeadsTap, paga com saldo real.',
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="w-5 h-5 text-[#00e676] shrink-0" />
            <span className="text-slate-300">{item}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onLogin}
        className="mt-10 w-full max-w-sm rounded-full bg-[#00e676] text-black font-semibold py-3.5"
      >
        Entrar com Google
      </button>
      <p className="text-xs text-slate-500 text-center mt-6 max-w-sm leading-relaxed">
        Pix entre usuários LeadsTap já funciona. Pix para outros bancos e saque
        para banco ainda dependem de trilho parceiro e não estão disponíveis —
        nenhum valor é movimentado para fora até lá. A LeadsTap é uma conta
        individual de uma fintech, não um banco.
      </p>
    </div>
  );
};
