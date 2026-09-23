import React from 'react';
import { 
  ShieldCheck, 
  PieChart, 
  Code2, 
  Headphones, 
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
  onOpenSupport: () => void;
  onOpenPix: () => void;
  onLogout: () => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  userProfile,
  onOpenFinance,
  onOpenDevApi,
  onOpenSecurity,
  onOpenSupport,
  onOpenPix,
  onLogout
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <span>Ajustes da Conta</span>
          <span className="text-xs bg-[#00e676]/20 text-[#00e676] px-2 py-0.5 rounded-full font-mono">
            LeadsPay
          </span>
        </h2>
        <p className="text-xs text-slate-400">
          Gerencie segurança, inteligência financeira, integrações e suporte
        </p>
      </div>

      {/* User Mini Profile Card */}
      <div className="p-4 rounded-3xl bg-black/60 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-950 to-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(0,230,118,0.2)]">
            HM
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{userProfile.name}</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Agência {userProfile.agency} · Conta {userProfile.accountNumber}
            </p>
            <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/70 px-2 py-0.2 rounded-full border border-emerald-500/30">
              Conta Pro Verificada
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSecurity}
          className="text-xs text-slate-300 hover:text-white p-2 rounded-xl bg-white/5 border border-white/5"
        >
          Editar
        </button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-1">
          Funcionalidades & Serviços
        </span>

        {/* Option 1: Gestão Financeira */}
        <button
          onClick={onOpenFinance}
          className="w-full p-3.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Gestão Financeira & Analytics
              </span>
              <span className="text-[11px] text-slate-400">
                Fluxo de caixa semanal, orçamentos e categorias
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* Option 2: Portal Dev API */}
        <button
          onClick={onOpenDevApi}
          className="w-full p-3.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Portal do Desenvolvedor (Dev API)
              </span>
              <span className="text-[11px] text-slate-400">
                Chaves de API REST, Webhooks e Sandbox
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* Option 3: Central de Segurança */}
        <button
          onClick={onOpenSecurity}
          className="w-full p-3.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00e676] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Central de Segurança & Biometria
              </span>
              <span className="text-[11px] text-slate-400">
                Face ID / Touch ID, Modo Rua e Dispositivos
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* Option 4: Suporte 24/7 */}
        <button
          onClick={onOpenSupport}
          className="w-full p-3.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Suporte Bancário 24/7
              </span>
              <span className="text-[11px] text-slate-400">
                Atendimento por IA e Especialista Humano
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* Option 5: Limites & Chaves Pix */}
        <button
          onClick={onOpenPix}
          className="w-full p-3.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5 text-[#00e676]" />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Limites Pix Diurno e Noturno
              </span>
              <span className="text-[11px] text-slate-400">
                Cadastrar novas chaves e teto por período
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Logout button */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta LeadsPay</span>
        </button>
      </div>
    </div>
  );
};
