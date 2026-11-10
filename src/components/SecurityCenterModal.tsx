import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Smartphone, 
  Fingerprint, 
  Scan, 
  MapPin, 
  KeyRound, 
  Laptop, 
  Sliders, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { UserProfile } from '../types';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onToggleStreetProtection: () => void;
  onToggleBiometrics: () => void;
  onRequestBiometric: (actionName: string, onVerified: () => void) => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onToggleStreetProtection,
  onToggleBiometrics,
  onRequestBiometric
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices'>('overview');
  // Fase D: sem dado inventado — o Bank não registra dispositivos; a lista
  // fixa anterior ("iPhone 16 Pro", "MacBook Pro M3 Max", "Último acesso ontem
  // às 19:40") era dado inventado apresentado como real e foi removida.
  // Estado vazio derivado da ausência de dado: nenhum dispositivo registrado.
  const [devices, setDevices] = useState<
    { id: string; name: string; type: 'phone' | 'laptop'; location: string; status: string; isCurrent: boolean }[]
  >([]);

  if (!isOpen) return null;

  const handleRevokeDevice = (id: string) => {
    onRequestBiometric('Revogar acesso do dispositivo', () => {
      setDevices(prev => prev.filter(d => d.id !== id));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.15)] text-zinc-950 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00a854]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Central de Segurança</h3>
              <p className="text-[11px] text-zinc-500">Proteção Knox Shield & Biometria Ativa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Security Score Banner */}
          <div className="p-4 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#00a854] uppercase font-mono font-bold tracking-wider">
                Status do Sistema
              </span>
              <h4 className="text-sm font-bold text-zinc-950 mt-0.5">Nível Máximo de Proteção</h4>
              <span className="text-[11px] text-zinc-500">Biometria + Criptografia AES-256</span>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-[#00e676] bg-[#00e676]/15 flex items-center justify-center text-xs font-bold font-mono text-[#00a854] shadow-[0_0_15px_rgba(0,230,118,0.4)]">
              100%
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {/* Street Protection Mode */}
            <div className="p-3.5 bg-[#f4f4f5] border border-black/[0.06] rounded-2xl flex items-center justify-between">
              <div className="flex items-start gap-3 pr-2">
                <div className="w-8 h-8 rounded-xl bg-[#00e676]/15 text-[#00a854] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-950 block">Modo Proteção na Rua</span>
                  <span className="text-[10px] text-zinc-500 leading-tight block mt-0.5">
                    Oculta saldo total e investimentos fora das suas redes Wi-Fi e locais seguros cadastrados.
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onRequestBiometric(
                    userProfile.streetProtectionMode ? 'Desativar Modo Rua' : 'Ativar Modo Rua com Segurança',
                    onToggleStreetProtection
                  );
                }}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  userProfile.streetProtectionMode ? 'bg-[#00e676]' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                    userProfile.streetProtectionMode ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Biometric Toggle */}
            <div className="p-3.5 bg-[#f4f4f5] border border-black/[0.06] rounded-2xl flex items-center justify-between">
              <div className="flex items-start gap-3 pr-2">
                <div className="w-8 h-8 rounded-xl bg-[#00e676]/15 text-[#00a854] flex items-center justify-center shrink-0 mt-0.5">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-950 block">Autenticação Facial & Digital</span>
                  <span className="text-[10px] text-zinc-500 leading-tight block mt-0.5">
                    Exigir Face ID / Touch ID para abrir o banco e autorizar qualquer Pix ou LeadsTap.
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleBiometrics}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  userProfile.biometricEnabled ? 'bg-[#00e676]' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                    userProfile.biometricEnabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="space-y-2 pt-2">
            <span className="text-xs text-zinc-500 font-medium">Aparelhos Conectados</span>
            <div className="space-y-2">
              {devices.length === 0 ? (
                <p className="p-3 bg-[#f4f4f5] border border-black/[0.06] rounded-2xl text-xs text-zinc-500">
                  Nenhum dispositivo registrado.
                </p>
              ) : (
                devices.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-[#f4f4f5] border border-black/[0.06] rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {d.type === 'phone' ? (
                      <Smartphone className="w-4 h-4 text-[#00a854]" />
                    ) : (
                      <Laptop className="w-4 h-4 text-zinc-400" />
                    )}
                    <div>
                      <span className="font-semibold text-zinc-950 block">{d.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{d.status}</span>
                    </div>
                  </div>

                  {!d.isCurrent && (
                    <button
                      onClick={() => handleRevokeDevice(d.id)}
                      className="text-[11px] text-rose-600 hover:text-rose-500"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              ))
              )}
            </div>
          </div>

          {/* Quick Password Reset button */}
          <div className="pt-2">
            <button
              onClick={() => alert('Código de verificação enviado para o seu WhatsApp/SMS para troca de senha do cartão.')}
              className="w-full py-2.5 bg-[#f4f4f5] hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-black/[0.06] transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#00a854]" />
              <span>Alterar senha do app ou PIN do cartão</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
