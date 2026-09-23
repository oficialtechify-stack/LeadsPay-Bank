import React from 'react';
import { 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Headphones, 
  Smartphone, 
  Monitor, 
  LogOut, 
  Bell, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { UserProfile } from '../types';

interface HeaderBarProps {
  userProfile: UserProfile;
  showBalance: boolean;
  onToggleBalance: () => void;
  onOpenSecurity: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userProfile,
  showBalance,
  onToggleBalance,
  onOpenSecurity,
  onOpenSupport,
  onLogout,
  isMobileFrame,
  onToggleMobileFrame
}) => {
  return (
    <header className="w-full bg-[#080c09]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      {/* Left: User Avatar & Account info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#132217] to-[#00e676]/30 border border-[#00e676]/50 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(0,230,118,0.2)]">
            HM
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00e676] rounded-full border-2 border-black" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
              {userProfile.name}
            </span>
            {userProfile.streetProtectionMode && (
              <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-mono flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                Modo Rua
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Ag {userProfile.agency}</span>
            <span>·</span>
            <span>Cc {userProfile.accountNumber}</span>
          </div>
        </div>
      </div>

      {/* Center: Brand Logo */}
      <div className="hidden md:flex items-center">
        <BrandLogo size="md" />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle Balance Visibility */}
        <button
          onClick={onToggleBalance}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
        >
          {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Security Center */}
        <button
          onClick={onOpenSecurity}
          className="p-2 rounded-xl text-emerald-400 hover:text-[#00e676] bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-500/30 transition-all relative"
          title="Central de Segurança e Biometria"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00e676] rounded-full animate-ping" />
        </button>

        {/* 24/7 Support */}
        <button
          onClick={onOpenSupport}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors hidden sm:flex"
          title="Suporte LeadsPay 24/7"
        >
          <Headphones className="w-4 h-4 text-[#00e676]" />
        </button>

        {/* Viewport Frame Toggle (Mobile App View vs Desktop Web Banking) */}
        <button
          onClick={onToggleMobileFrame}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors hidden lg:flex items-center gap-1.5 text-xs font-mono"
          title={isMobileFrame ? 'Expandir para tela cheia' : 'Simular tela de smartphone'}
        >
          {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-[#00e676]" />}
          <span className="text-[11px] text-slate-400">{isMobileFrame ? 'Desktop' : 'App Celular'}</span>
        </button>

        {/* Logout / Switch to Stories */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-950/30 transition-colors"
          title="Sair / Tela Inicial"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
