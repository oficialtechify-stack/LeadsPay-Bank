import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Sparkles, 
  KeyRound, 
  ChevronRight
} from 'lucide-react';
import { 
  getLocalLoginBanners, 
  subscribeToLoginBanners, 
  DEFAULT_LOGIN_BANNERS 
} from '../services/firebaseBankService';

interface LoginEntryViewProps {
  onAccessAccount: () => void;
  onOpenRegister: () => void;
  onOpenQuickPix: () => void;
  onOpenSupport: () => void;
  onOpenToken: () => void;
}

export const LoginEntryView: React.FC<LoginEntryViewProps> = ({
  onAccessAccount,
  onOpenRegister,
  onOpenQuickPix,
  onOpenSupport,
  onOpenToken
}) => {
  const [banners, setBanners] = useState<[string, string, string]>(() => getLocalLoginBanners());
  const [activeSlide, setActiveSlide] = useState(0);

  // Subscribe to live banners configured by the admin in real-time
  useEffect(() => {
    const unsub = subscribeToLoginBanners((freshBanners) => {
      if (freshBanners && freshBanners.length >= 3) {
        setBanners(freshBanners);
      }
    });
    return unsub;
  }, []);

  // Auto-play the 3 images carousel every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 4500);

    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="relative w-full h-full min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-black text-white select-none">
      {/* 3 AUTOMATIC ROTATING BACKGROUND IMAGES */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {banners.map((imgSrc, idx) => {
          const isActive = idx === activeSlide;
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              } transform transition-transform duration-[4500ms]`}
            >
              <img
                src={imgSrc || DEFAULT_LOGIN_BANNERS[idx]}
                alt={`LeadsPay Imagem ${idx + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </div>
          );
        })}

        {/* Ambient Dark Gradient Overlays for High Legibility and Luxury Feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/35 to-black/90 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/60 pointer-events-none" />
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

      {/* MIDDLE SECTION WITH 3-IMAGE CAROUSEL INDICATOR PILLS */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-3">
        {/* Carousel indicators dots */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
          {[0, 1, 2].map((idx) => {
            const isCurrent = idx === activeSlide;
            return (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isCurrent
                    ? 'w-6 h-1.5 bg-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.8)]'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Ir para banner ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* BOTTOM SHEET / CARD ("Acesse sua conta") - TRANSPARENT GLASS TO REVEAL BACKGROUND */}
      <div className="relative z-10 w-full px-3.5 sm:px-4 pb-2">
        <div className="w-full bg-black/45 backdrop-blur-md border border-white/15 rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 shadow-[0_15px_45px_rgba(0,0,0,0.7)] text-white">
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
          <div className="grid grid-cols-4 my-4 sm:my-5 divide-x divide-white/10">
            {/* 1. Transferir */}
            <button
              onClick={onAccessAccount}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-1 text-center group cursor-pointer"
            >
              <div className="flex items-center justify-center text-white/90 group-hover:text-[#a3e635] transition-colors">
                <ArrowUpRight className="w-5 h-5 text-white group-hover:text-[#a3e635]" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
                Transferir
              </span>
            </button>

            {/* 2. Pagar (Barcode Icon) */}
            <button
              onClick={onAccessAccount}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-1 text-center group cursor-pointer"
            >
              <div className="flex items-center justify-center text-white/90 group-hover:text-[#a3e635] transition-colors">
                {/* Clean Barcode Glyphs */}
                <div className="w-5 h-5 flex items-center justify-center gap-[2.5px]">
                  <div className="w-[2px] h-4 bg-white group-hover:bg-[#a3e635]" />
                  <div className="w-[3px] h-4 bg-white group-hover:bg-[#a3e635]" />
                  <div className="w-[1px] h-4 bg-white group-hover:bg-[#a3e635]" />
                  <div className="w-[2px] h-4 bg-white group-hover:bg-[#a3e635]" />
                  <div className="w-[3px] h-4 bg-white group-hover:bg-[#a3e635]" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
                Pagar
              </span>
            </button>

            {/* 3. Área Pix */}
            <button
              onClick={onOpenQuickPix}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-1 text-center group cursor-pointer"
            >
              <div className="flex items-center justify-center text-white/90 group-hover:text-[#a3e635] transition-colors">
                {/* Official Pix Diamond Geometry */}
                <div className="w-4 h-4 border-2 border-white group-hover:border-[#a3e635] rotate-45 rounded-[3px] flex items-center justify-center transition-colors">
                  <div className="w-1.5 h-1.5 bg-[#a3e635] rounded-full" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
                Área Pix
              </span>
            </button>

            {/* 4. Token */}
            <button
              onClick={onOpenToken}
              className="flex flex-col items-center justify-center gap-1.5 px-1 py-1 text-center group cursor-pointer"
            >
              <div className="flex items-center justify-center text-white/90 group-hover:text-[#a3e635] transition-colors">
                <KeyRound className="w-4 h-4 text-white group-hover:text-[#a3e635]" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
                Token
              </span>
            </button>
          </div>

          {/* Action Buttons: Green Primary & Outlined Secondary */}
          <div className="space-y-2.5">
            {/* Green button: Acessar conta */}
            <button
              onClick={onAccessAccount}
              className="w-full py-3.5 px-4 rounded-full bg-[#a3e635] hover:bg-[#84cc16] active:scale-[0.99] text-black font-bold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(163,230,53,0.35)] cursor-pointer text-center"
            >
              Acessar conta
            </button>

            {/* Black button with subtle green border: Abrir uma conta */}
            <button
              onClick={onOpenRegister}
              className="w-full py-3.5 px-4 rounded-full bg-black/40 hover:bg-black/70 active:scale-[0.99] border border-[#a3e635]/80 hover:border-[#a3e635] text-[#a3e635] hover:text-[#bef264] font-bold text-sm transition-all duration-200 cursor-pointer text-center"
            >
              Abrir uma conta
            </button>
          </div>

          {/* Footer inside the card: Precisa de ajuda? */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
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

        {/* Clean Version tag without admin kyc button */}
        <div className="flex items-center justify-center py-2">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">
            v:2.1.20
          </span>
        </div>
      </div>
    </div>
  );
};
