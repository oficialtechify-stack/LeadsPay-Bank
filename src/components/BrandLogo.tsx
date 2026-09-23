import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Stylized Neon Green LeadsPay Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        {/* Ambient neon lime glow */}
        <div className="absolute inset-0 bg-[#00e676]/30 rounded-full blur-md animate-pulse pointer-events-none" />
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 filter drop-shadow-[0_0_8px_rgba(0,230,118,0.7)]"
        >
          {/* Top Left Sphere / Person Head */}
          <circle cx="28" cy="30" r="14" fill="#a3e635" />
          <circle cx="25" cy="27" r="8" fill="#d9f99d" opacity="0.8" />
          
          {/* Bottom Right Sphere */}
          <circle cx="72" cy="70" r="14" fill="#00e676" />
          <circle cx="69" cy="67" r="8" fill="#86efac" opacity="0.8" />
          
          {/* Dynamic Slanted Energy Percent Bar */}
          <path
            d="M20 78 C 30 76, 52 52, 60 40 C 66 30, 80 18, 86 18 C 90 18, 88 26, 82 36 C 72 52, 44 80, 28 84 C 22 85, 18 82, 20 78 Z"
            fill="url(#leadsGreenGrad)"
          />
          
          {/* Secondary crossing neon wing */}
          <path
            d="M32 20 C 44 26, 68 54, 76 74 C 78 80, 74 84, 68 82 C 60 80, 42 56, 32 38 C 28 32, 28 22, 32 20 Z"
            fill="#22c55e"
            opacity="0.85"
          />

          <defs>
            <linearGradient id="leadsGreenGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="50%" stopColor="#00e676" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography: LeadsPay */}
      <div className="flex flex-col leading-none">
        <div className={`font-display font-extrabold tracking-tight flex items-baseline ${textSizes[size]}`}>
          <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Leads</span>
          <span className="text-[#00e676] ml-0.5 relative drop-shadow-[0_0_12px_rgba(0,230,118,0.6)]">
            Pay
            <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-[#a3e635] rounded-full animate-ping" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90 ml-1.5 border border-emerald-500/30 px-1 py-0.2 rounded bg-emerald-950/40">
            Bank
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] tracking-wider text-slate-400 uppercase font-medium mt-0.5">
            Conta Digital & Tap to Pay
          </span>
        )}
      </div>
    </div>
  );
};
