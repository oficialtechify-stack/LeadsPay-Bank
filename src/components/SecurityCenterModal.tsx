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
  const [devices, setDevices] = useState([
    { id: '1', name: 'iPhone 16 Pro (Este aparelho)', type: 'phone', location: 'São Paulo, Brasil', status: 'Ativo agora', isCurrent: true },
    { id: '2', name: 'MacBook Pro M3 Max', type: 'laptop', location: 'São Paulo, Brasil', status: 'Último acesso ontem às 19:40', isCurrent: false }
  ]);

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
        className="relative w-full max-w-md bg-[#090e0b] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,230,118,0.25)] text-white flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#00e676]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Central de Segurança</h3>
              <p className="text-[11px] text-slate-400">Proteção Knox Shield & Biometria Ativa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Security Score Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-black/60 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold tracking-wider">
                Status do Sistema
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">Nível Máximo de Proteção</h4>
              <span className="text-[11px] text-slate-300">Biometria + Criptografia AES-256</span>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-[#00e676] bg-emerald-500/20 flex items-center justify-center text-xs font-bold font-mono text-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.4)]">
              100%
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {/* Street Protection Mode */}
            <div className="p-3.5 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-start gap-3 pr-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-[#00e676] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Modo Proteção na Rua</span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
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
                  userProfile.streetProtectionMode ? 'bg-[#00e676]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    userProfile.streetProtectionMode ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Biometric Toggle */}
            <div className="p-3.5 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-start gap-3 pr-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-[#00e676] flex items-center justify-center shrink-0 mt-0.5">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Autenticação Facial & Digital</span>
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Exigir Face ID / Touch ID para abrir o banco e autorizar qualquer Pix ou LeadsTap.
                  </span>
                </div>
              </div>

              <button
                onClick={onToggleBiometrics}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  userProfile.biometricEnabled ? 'bg-[#00e676]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    userProfile.biometricEnabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="space-y-2 pt-2">
            <span className="text-xs text-slate-400 font-medium">Aparelhos Conectados</span>
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {d.type === 'phone' ? (
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Laptop className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <span className="font-semibold text-white block">{d.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{d.status}</span>
                    </div>
                  </div>

                  {!d.isCurrent && (
                    <button
                      onClick={() => handleRevokeDevice(d.id)}
                      className="text-[11px] text-rose-400 hover:text-rose-300"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Password Reset button */}
          <div className="pt-2">
            <button
              onClick={() => alert('Código de verificação enviado para o seu WhatsApp/SMS para troca de senha do cartão.')}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Alterar senha do app ou PIN do cartão</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
