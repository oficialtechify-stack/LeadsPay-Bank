import React from 'react';
import { 
  ShieldCheck, 
  PieChart, 
  Code2, 
  Sliders, 
  Smartphone, 
  Key, 
  ChevronRight, 
  User, 
  Bell, 
  Sparkles,
  Lock,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types';

interface AjustesViewProps {
  userProfile: UserProfile;
  onOpenFinance: () => void;
  onOpenDevApi: () => void;
  onOpenSecurity: () => void;
  onOpenPix: () => void;
  onLogout: () => void;
  onOpenAdminReview?: () => void;
  /** Q6: a moldura de celular vira item discreto em Ajustes (estado em App.tsx). */
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  userProfile,
  onOpenFinance,
  onOpenDevApi,
  onOpenSecurity,
  onOpenPix,
  onLogout,
  onOpenAdminReview,
  isMobileFrame,
  onToggleMobileFrame
}) => {
  const isAdmin = userProfile.email?.toLowerCase().trim() === 'rickmarketing81@gmail.com';
  const initials = (userProfile.preferredName || userProfile.name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight flex items-center gap-2">
          <span>Ajustes da Conta</span>
          <span className="text-xs bg-[#00e676]/15 text-[#00a854] px-2 py-0.5 rounded-full font-mono">
            LeadsPay
          </span>
        </h2>
        <p className="text-xs text-zinc-500">
          Gerencie segurança, inteligência financeira, integrações e suporte
        </p>
      </div>

      {/* User Mini Profile Card */}
      <div className="p-4 rounded-3xl bg-[#f4f4f5] border border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-950 to-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(0,230,118,0.2)]">
            {initials ? initials : <User className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950">{userProfile.name || "Sua conta"}</h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              Agência {userProfile.agency} · Conta {userProfile.accountNumber}
            </p>
            {/* Fase D: o selo só aparece quando o perfil real está
                verificado/aprovado — no perfil anônimo/mock ele não existe. */}
            {userProfile.status === 'approved' && (
              <span className="inline-block mt-0.5 text-[10px] text-[#00a854] font-semibold bg-[#00e676]/15 px-2 py-0.2 rounded-full border border-[#00e676]/30">
                Conta Pro Verificada
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenSecurity}
          className="text-xs text-zinc-600 hover:text-zinc-950 p-2 rounded-xl bg-white border border-black/[0.06]"
        >
          Editar
        </button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block px-1">
          Funcionalidades & Serviços
        </span>

        {/* Option 0: Painel de Administração & Banners (Exclusive to rickmarketing81@gmail.com) */}
        {isAdmin && onOpenAdminReview && (
          <button
            onClick={onOpenAdminReview}
            className="w-full p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-300 transition-all flex items-center justify-between group shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-amber-800 block">
                    Painel do Administrador & Banners
                  </span>
                  <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                    Admin
                  </span>
                </div>
                <span className="text-[11px] text-amber-700/80">
                  Aprovar contas KYC e gerenciar as 3 imagens da tela de login
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Option 1: Gestão Financeira */}
        <button
          onClick={onOpenFinance}
          className="w-full p-3.5 rounded-2xl bg-[#f4f4f5] hover:bg-zinc-200/60 border border-black/[0.06] hover:border-[#00e676]/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-zinc-950 block">
                Gestão Financeira
              </span>
              <span className="text-[11px] text-zinc-500">
                Fluxo de caixa semanal, orçamentos e categorias
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </button>

        {/* Option 2: Portal Dev API */}
        <button
          onClick={onOpenDevApi}
          className="w-full p-3.5 rounded-2xl bg-[#f4f4f5] hover:bg-zinc-200/60 border border-black/[0.06] hover:border-[#00e676]/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-zinc-950 block">
                Portal do Desenvolvedor (Dev API)
              </span>
              <span className="text-[11px] text-zinc-500">
                Chaves de API REST, Webhooks e Sandbox
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </button>

        {/* Option 3: Central de Segurança */}
        <button
          onClick={onOpenSecurity}
          className="w-full p-3.5 rounded-2xl bg-[#f4f4f5] hover:bg-zinc-200/60 border border-black/[0.06] hover:border-[#00e676]/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 text-[#00a854] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-zinc-950 block">
                Central de Segurança & Biometria
              </span>
              <span className="text-[11px] text-zinc-500">
                Face ID / Touch ID, Modo Rua e Dispositivos
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </button>

        {/* Option 5: Limites & Chaves Pix */}
        <button
          onClick={onOpenPix}
          className="w-full p-3.5 rounded-2xl bg-[#f4f4f5] hover:bg-zinc-200/60 border border-black/[0.06] hover:border-[#00e676]/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.06] text-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5 text-[#00e676]" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-zinc-950 block">
                Limites Pix Diurno e Noturno
              </span>
              <span className="text-[11px] text-zinc-500">
                Cadastrar novas chaves e teto por período
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </button>
      </div>

      {/* Q6 — Moldura de celular: item discreto, com toggle ligado ao
          estado isMobileFrame de App.tsx (não some, não some do header). */}
      <div className="p-3.5 rounded-2xl bg-[#f4f4f5] border border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.06] text-zinc-700 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-xs sm:text-sm font-semibold text-zinc-950 block">
              Moldura de celular
            </span>
            <span className="text-[11px] text-zinc-500">
              Exibe o app dentro de uma moldura de telefone no computador
            </span>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isMobileFrame}
          aria-label="Moldura de celular"
          onClick={onToggleMobileFrame}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
            isMobileFrame ? 'bg-[#00e676]' : 'bg-zinc-300'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
              isMobileFrame ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Logout button */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-2xl bg-[#f4f4f5] hover:bg-rose-50 border border-black/[0.06] hover:border-rose-300 text-zinc-600 hover:text-rose-600 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta LeadsPay</span>
        </button>
      </div>
    </div>
  );
};
