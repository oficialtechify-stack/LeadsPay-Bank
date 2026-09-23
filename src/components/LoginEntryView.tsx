import React from 'react';
import { 
  ArrowUpRight, 
  Sparkles, 
  KeyRound, 
  ChevronRight
} from 'lucide-react';

interface LoginEntryViewProps {
  onAccessAccount: () => void;
  onOpenRegister: () => void;
  onOpenQuickPix: () => void;
  onOpenSupport: () => void;
  onOpenToken: () => void;
  onGoogleLogin: () => void;
}

export const LoginEntryView: React.FC<LoginEntryViewProps> = ({
  onAccessAccount,
  onOpenRegister,
  onOpenQuickPix,
  onOpenSupport,
  onOpenToken,
  onGoogleLogin
}) => {
  return (
    <div className="relative w-full h-full min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-black text-white select-none">
      {/* Background Image: Person holding coffee cup with LeadsPay logo & contactless card near payment terminal */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/lifestyle_card_terminal_1790116104071.jpg"
          alt="LeadsPay Bank"
          className="w-full h-full object-cover object-center"
        />

        {/* Translucent overlay that leaves the background visible through the bottom sheet */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/40" />
      </div>

      {/* TOP HEADER SECTION */}
      <div className="relative z-10 pt-8 sm:pt-12 px-6 text-center flex flex-col items-center">
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-2">
          {/* Stylized Lime Green LeadsPay Glyphs */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 relative flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full filter drop-shadow-[0_0_10px_rgba(163,230,53,0.8)]"
            >
              {/* Top Left Sphere */}
              <circle cx="28" cy="28" r="13" fill="#a3e635" />
              {/* Bottom Right Sphere */}
              <circle cx="72" cy="72" r="13" fill="#a3e635" />
              {/* Slanted Energy Dynamic Slash */}
              <path
                d="M20 78 C 30 76, 52 50, 60 40 C 66 30, 80 18, 86 18 C 90 18, 88 26, 82 36 C 72 52, 44 80, 28 84 C 22 85, 18 82, 20 78 Z"
                fill="#a3e635"
              />
              <path
                d="M32 20 C 44 26, 68 54, 76 74 C 78 80, 74 84, 68 82 C 60 80, 42 56, 32 38 C 28 32, 28 22, 32 20 Z"
                fill="#84cc16"
                opacity="0.9"
              />
            </svg>
          </div>

          <div className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight leading-none flex items-baseline">
            <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Leads</span>
            <span className="text-[#a3e635] drop-shadow-[0_0_12px_rgba(163,230,53,0.6)]">Pay</span>
          </div>
        </div>

        {/* Headline & Subheadline */}
        <h1 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight leading-snug mt-3 sm:mt-4 text-center drop-shadow-md">
          Pague com simplicidade.
        </h1>
        <p className="text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed mt-0.5 text-center max-w-[270px] sm:max-w-xs drop-shadow">
          Uma experiência financeira feita para o seu dia a dia.
        </p>
      </div>

      {/* MIDDLE SPACER to show the card terminal in the background */}
      <div className="flex-1 min-h-[30px]" />

      {/* BOTTOM SHEET / CARD ("Acesse sua conta") - TRANSPARENT GLASS TO REVEAL BACKGROUND */}
      <div className="relative z-10 w-full px-3.5 sm:px-4 pb-2">
        <div className="w-full bg-black/35 backdrop-blur-md border border-white/15 rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 shadow-[0_15px_45px_rgba(0,0,0,0.7)] text-white">
          {/* Header */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
              Acesse sua conta
            </h2>
            <p className="text-[11px] sm:text-xs text-[#a0ada3] mt-0.5">
              Entrar para acompanhar vendas, Pix e saldo.
            </p>
          </div>

          {/* 4 Quick Action Icons Row with Vertical Dividers */}
          <div className="flex items-center justify-between my-3 py-1.5 border-y border-white/10">
            {/* 1. Transferir */}
            <button
              onClick={onOpenQuickPix}
              className="flex-1 flex flex-col items-center justify-center py-0.5 group transition-all"
            >
              <div className="text-[#a3e635] mb-1 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-4 h-4 text-[#a3e635] stroke-[2.2]" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-200">
                Transferir
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 bg-white/10 shrink-0" />

            {/* 2. Pagar */}
            <button
              onClick={onOpenQuickPix}
              className="flex-1 flex flex-col items-center justify-center py-0.5 group transition-all"
            >
              <div className="text-[#a3e635] mb-1 group-hover:scale-110 transition-transform">
                {/* Barcode representation */}
                <div className="flex items-center gap-[2px] h-4 px-0.5">
                  <div className="w-[2px] h-4 bg-[#a3e635] rounded-full" />
                  <div className="w-[1px] h-4 bg-[#a3e635] rounded-full" />
                  <div className="w-[2.5px] h-4 bg-[#a3e635] rounded-full" />
                  <div className="w-[1px] h-4 bg-[#a3e635] rounded-full" />
                  <div className="w-[2px] h-4 bg-[#a3e635] rounded-full" />
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-200">
                Pagar
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 bg-white/10 shrink-0" />

            {/* 3. Área Pix */}
            <button
              onClick={onOpenQuickPix}
              className="flex-1 flex flex-col items-center justify-center py-0.5 group transition-all"
            >
              <div className="text-[#a3e635] mb-1 group-hover:scale-110 transition-transform">
                {/* Pix Diamond Glyph */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-[#a3e635] stroke-[2]">
                  <rect x="7" y="7" width="10" height="10" rx="1.5" transform="rotate(45 12 12)" />
                  <circle cx="12" cy="12" r="1.5" fill="#a3e635" />
                </svg>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-200">
                Área Pix
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 bg-white/10 shrink-0" />

            {/* 4. Token */}
            <button
              onClick={onOpenToken}
              className="flex-1 flex flex-col items-center justify-center py-0.5 group transition-all"
            >
              <div className="text-[#a3e635] mb-1 group-hover:scale-110 transition-transform">
                <KeyRound className="w-4 h-4 text-[#a3e635] stroke-[2.2]" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-200">
                Token
              </span>
            </button>
          </div>

          {/* Primary Action Button: Acessar conta */}
          <button
            onClick={onAccessAccount}
            className="w-full h-11 sm:h-12 rounded-full bg-[#a3e635] hover:bg-[#92d628] active:scale-[0.98] text-black font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all flex items-center justify-center cursor-pointer"
          >
            <span>Acessar conta</span>
          </button>

          {/* Google Sign-in Button */}
          <button
            onClick={onGoogleLogin}
            className="w-full h-10 sm:h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white border border-white/20 font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 mt-2 cursor-pointer backdrop-blur-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com o Google</span>
          </button>

          {/* Secondary Action Button: Abrir uma conta */}
          <button
            onClick={onOpenRegister}
            className="w-full h-10 sm:h-11 rounded-full bg-transparent hover:bg-white/5 active:scale-[0.98] text-[#a3e635] border border-[#a3e635]/60 hover:border-[#a3e635] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center mt-2 cursor-pointer"
          >
            <span>Abrir uma conta</span>
          </button>

          {/* Help link / Sparkle footer row */}
          <div className="flex items-center justify-between pt-3 mt-0.5">
            <button
              onClick={onOpenSupport}
              className="text-[11px] sm:text-xs text-[#a0ada3] hover:text-white transition-colors cursor-pointer"
            >
              Precisa de ajuda?
            </button>

            <button
              onClick={onOpenSupport}
              className="flex items-center gap-0.5 text-slate-300 hover:text-[#a3e635] transition-colors p-1 cursor-pointer"
              title="Ajuda com Inteligência LeadsPay"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Version outside the card */}
        <div className="text-center py-2">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">
            v:2.1.20
          </span>
        </div>
      </div>
    </div>
  );
};
