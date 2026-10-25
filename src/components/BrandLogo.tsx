import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <div className="absolute inset-0 bg-[#00e676]/30 rounded-full blur-md animate-pulse pointer-events-none" />
        <span className="relative z-10 flex items-center justify-center w-full h-full rounded-full bg-[#00e676] text-black font-display font-bold">
          L
        </span>
      </div>
      <div className="leading-none">
        <span className={`font-display font-bold tracking-tight ${textSizes[size]}`}>
          Leads<span className="text-[#00e676]">Tap</span>
        </span>
        {showSubtitle && (
          <p className="text-xs text-slate-400 mt-1">Sua conta individual</p>
        )}
      </div>
    </div>
  );
};
