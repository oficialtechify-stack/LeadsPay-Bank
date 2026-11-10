import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, WifiOff } from 'lucide-react';
import type { SyncStateShape } from './types';

/** E-mail mascarado: 2 primeiros caracteres + *** + domínio. */
export function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const at = email.indexOf('@');
  if (at <= 0) return '—';
  return `${email.slice(0, 2)}***${email.slice(at)}`;
}

/**
 * Olho que mascara/desmascara valores (v3.1 §6, v3.2 §D7.3).
 * Ao revelar, embaralha os caracteres 1 vez por 300ms EXATOS e assenta —
 * única exceção à regra "não animar valores de pagamento"; nunca anima
 * continuamente. Sem `value`, renderiza só o botão do olho (TopBar).
 */
export const EyeValue: React.FC<{
  value?: string;
  show: boolean;
  onToggle: () => void;
  label?: string;
}> = ({ value, show, onToggle, label = 'Mostrar ou ocultar valores' }) => {
  const [display, setDisplay] = useState(value ?? '');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (value === undefined) return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (!show) {
      // Oculto: dígitos viram •, o resto (R$, vírgula, ponto) fica.
      setDisplay(value.replace(/\d/g, '•'));
      return;
    }
    // Revelar: embaralha 300ms exatos e assenta no valor real. O embaralho
    // é determinístico (contador de ticks) — sem sorteio.
    let tick = 0;
    const scramble = () => {
      tick += 1;
      return value.replace(/\d/g, (_d, i: number) => String((tick * 7 + i * 3) % 10));
    };
    setDisplay(scramble());
    const interval = window.setInterval(() => setDisplay(scramble()), 40);
    const done = window.setTimeout(() => {
      window.clearInterval(interval);
      setDisplay(value);
    }, 300);
    timers.current = [interval, done];
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [show, value]);

  return (
    <span className="inline-flex items-center gap-1.5">
      {value !== undefined && (
        <span className="font-mono-numbers tabular-nums">{display}</span>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        title={label}
        className="rounded-full p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-2)] hover:text-[var(--shell-text)] transition-colors"
      >
        {show ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>
    </span>
  );
};

/** Linhas cinza com shimmer suave — SÓ enquanto `loading` e sem dados. */
export const Skeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`} aria-label="Carregando">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 rounded-full bg-[var(--shell-surface-2)] animate-pulse"
        style={{ width: `${100 - i * 12}%` }}
      />
    ))}
  </div>
);

/**
 * Banner de sincronização por causa (v3.2 §D7.5):
 * - offline (`navigator.onLine === false`) → texto de offline;
 * - `permission-denied` ou outro erro de leitura → texto de sincronização;
 * nunca "offline" para erro com o usuário online.
 * Só aparece quando `error != null` ou offline.
 */
export const SyncBanner: React.FC<{ syncState: SyncStateShape }> = ({ syncState }) => {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-[16px] bg-[var(--shell-warn-bg)] px-4 py-3 text-sm font-medium text-[var(--shell-warn-text)]">
        <WifiOff className="w-4 h-4 shrink-0" />
        Você está offline — mostrando dados salvos no aparelho.
      </div>
    );
  }
  if (syncState.error == null) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-[16px] bg-[var(--shell-warn-bg)] px-4 py-3 text-sm font-medium text-[var(--shell-warn-text)]">
      <WifiOff className="w-4 h-4 shrink-0" />
      Não foi possível sincronizar seus dados. Mostrando dados salvos no aparelho.
    </div>
  );
};
