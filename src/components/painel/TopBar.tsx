import React from 'react';
import { CircleHelp } from 'lucide-react';
import type { UserProfile } from '../../types';
import type { ShellUi } from './types';
import { EyeValue, maskEmail } from './shared';

/**
 * TopBar do painel (v3.2 §D4.1): avatar + nome + e-mail mascarado,
 * botão "?" (abre U25), olho que embaralha valores (EyeValue, 300ms).
 * SEM ⋮ — o único ⋮ do painel fica no rodapé do Sidebar.
 */
export const TopBar: React.FC<{
  userProfile: UserProfile;
  showBalance: boolean;
  onToggleBalance: () => void;
  setShellUi: (patch: Partial<ShellUi>) => void;
}> = ({ userProfile, showBalance, onToggleBalance, setShellUi }) => (
  <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--shell-border)] bg-[var(--shell-surface)] px-6">
    <div className="flex min-w-0 items-center gap-3">
      {userProfile.photoURL ? (
        <img
          src={userProfile.photoURL}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--shell-surface-2)] text-[14px] font-bold">
          {(userProfile.name || '?').slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight">{userProfile.name}</p>
        <p className="truncate text-[13px] text-[var(--shell-muted)]">
          {maskEmail(userProfile.email)}
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <EyeValue show={showBalance} onToggle={onToggleBalance} />
      <button
        type="button"
        onClick={() => setShellUi({ ajudaOpen: true })}
        aria-label="Central de Ajuda"
        title="Central de Ajuda"
        className="rounded-full p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)] transition-colors"
      >
        <CircleHelp className="w-5 h-5" />
      </button>
    </div>
  </header>
);
