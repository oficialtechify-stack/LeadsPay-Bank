import React from 'react';
import {
  Eye,
  EyeOff,
  Headphones,
  LogOut,
  Bell,
  QrCode,
  Sparkles,
  MapPin
} from 'lucide-react';
import { UserProfile } from '../types';

/**
 * Header do app logado, no padrão AppHeader da referência (extraído do
 * `const` local em App.tsx da QA — nunca importado dela).
 * O header ROLA PARA FORA — só as pílulas ficam fixas no topo (§4.5, R4).
 *
 * Elementos NOVOS neste plano: sino (SoonView "Notificações") e QR
 * (abre o PixModal na aba Receber — QR aqui é Pix a receber, não Tap).
 * Selo "Modo Rua" sobrevive ao lado do "Olá, $nome".
 * Saíram: logo central (desktop), botão de segurança com animate-ping
 * (vira item de "Mais ações" na Conta, fase B), toggle isMobileFrame
 * (o estado e o wrapper ficam em App.tsx; item discreto em Ajustes, fase C).
 * Ficam: Admin KYC (admin), Sair, Suporte (não listado como saída no §4.5).
 * Olho com a semântica da QA: saldo visível = ícone Eye.
 * Ag/Cc mantidos numa linha discreta até a seção "Sua conta" (fase B).
 */
interface HeaderBarProps {
  userProfile: UserProfile;
  showBalance: boolean;
  onToggleBalance: () => void;
  onOpenNotifications: () => void;
  onOpenPixReceive: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
  onOpenAdminReview?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userProfile,
  showBalance,
  onToggleBalance,
  onOpenNotifications,
  onOpenPixReceive,
  onOpenSupport,
  onLogout,
  onOpenAdminReview
}) => {
  const isAdmin = userProfile.email?.toLowerCase().trim() === 'rickmarketing81@gmail.com';
  const firstName = (userProfile.preferredName || userProfile.name || 'você').split(' ')[0];
  return (
    <header className="w-full px-4 sm:px-6 pt-4 pb-1">
      <div className="flex items-center justify-between">
        {/* Left: Avatar + Olá, $nome */}
        <div className="flex items-center gap-3 min-w-0">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt=""
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[#f4f4f5] text-lg font-bold text-zinc-900 shrink-0">
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm text-zinc-500 leading-none">Olá,</p>
              {userProfile.streetProtectionMode && (
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  Modo Rua
                </span>
              )}
            </div>
            <p className="font-bold text-[17px] leading-tight text-zinc-950 truncate">
              {firstName}
            </p>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Ag {userProfile.agency} · Cc {userProfile.accountNumber}
            </p>
          </div>
        </div>

        {/* Right: olho, sino, QR, suporte, Admin KYC, sair */}
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && onOpenAdminReview && (
            <button
              onClick={onOpenAdminReview}
              className="px-2.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200/70 border border-amber-200 text-amber-800 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Painel de Aprovação KYC de Contas"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Admin KYC</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleBalance}
            aria-label={showBalance ? 'Ocultar valores' : 'Mostrar valores'}
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            className="rounded-full p-2.5"
          >
            {showBalance ? (
              <Eye className="w-5 h-5 text-zinc-700" />
            ) : (
              <EyeOff className="w-5 h-5 text-zinc-700" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notificações"
            title="Notificações"
            className="rounded-full p-2.5"
          >
            <Bell className="w-5 h-5 text-zinc-700" />
          </button>

          <button
            type="button"
            onClick={onOpenPixReceive}
            aria-label="Receber Pix por QR"
            title="Receber Pix por QR"
            className="rounded-full p-2.5"
          >
            <QrCode className="w-5 h-5 text-zinc-700" />
          </button>

          <button
            type="button"
            onClick={onOpenSupport}
            aria-label="Suporte"
            title="Suporte LeadsPay 24/7"
            className="rounded-full p-2.5 hidden sm:block"
          >
            <Headphones className="w-5 h-5 text-zinc-700" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            title="Sair / Tela Inicial"
            className="rounded-full p-2.5"
          >
            <LogOut className="w-5 h-5 text-zinc-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
