import React from 'react';
import { BrandLogo } from './BrandLogo';
import { formatBRL } from '../lib/format';
import type { LeadsTapProfile } from '../types';

interface HeaderBarProps {
  profile: LeadsTapProfile | null;
  balanceCents: number;
  displayName: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  balanceCents,
  displayName,
}) => {
  const name = profile?.displayName || displayName;
  return (
    <header className="sticky top-0 z-40 bg-[#050607]/90 backdrop-blur border-b border-white/10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <BrandLogo size="sm" />
        <div className="text-right leading-tight">
          <p className="text-xs text-slate-400 truncate max-w-[160px]">{name}</p>
          <p className="font-mono-numbers font-semibold text-[#00e676]">
            {formatBRL(balanceCents)}
          </p>
        </div>
      </div>
    </header>
  );
};
