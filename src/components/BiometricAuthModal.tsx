import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Fingerprint, Scan, CheckCircle2, Lock, X } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface BiometricAuthModalProps {
  isOpen: boolean;
  title?: string;
  reason?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  title = 'Autenticação Biométrica',
  reason = 'Confirme sua identidade com biometria facial ou digital para prosseguir com segurança.',
  onSuccess,
  onCancel
}) => {
  const [authMethod, setAuthMethod] = useState<'face' | 'fingerprint' | 'pin'>('face');
  const [status, setStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');
  const [pinCode, setPinCode] = useState<string[]>(['', '', '', '']);

  useEffect(() => {
    if (!isOpen) {
      setStatus('scanning');
      setPinCode(['', '', '', '']);
      return;
    }

    soundEffects.playBiometricScan();
    // Simulate biometric scan process: takes 1.4s then succeeds
    const timer = setTimeout(() => {
      setStatus('success');
      soundEffects.playPixSuccess();
      const closeTimer = setTimeout(() => {
        onSuccess();
      }, 700);
      return () => clearTimeout(closeTimer);
    }, 1400);

    return () => clearTimeout(timer);
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm bg-[#0e1410] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,230,118,0.2)] text-white overflow-hidden"
        >
          {/* Subtle green ambient light */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00e676]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mt-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>LeadsPay Knox Shield 256-bit</span>
            </div>
            <h3 className="text-lg font-display font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {reason}
            </p>
          </div>

          {/* Biometric Interactive Scanner Graphic */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-2xl bg-black/60 border border-emerald-500/40 overflow-hidden shadow-inner">
              {/* Laser Scanning Line */}
              {status === 'scanning' && (
                <motion.div
                  animate={{ y: [-40, 40, -40] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#00e676] to-transparent shadow-[0_0_12px_#00e676]"
                />
              )}

              {/* Scanning visual icon */}
              {status === 'scanning' ? (
                authMethod === 'face' ? (
                  <div className="relative">
                    <Scan className="w-14 h-14 text-emerald-400 animate-pulse" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-emerald-300 font-bold">
                      SCAN
                    </span>
                  </div>
                ) : (
                  <Fingerprint className="w-14 h-14 text-emerald-400 animate-pulse" />
                )
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center"
                >
                  <CheckCircle2 className="w-14 h-14 text-[#00e676]" />
                </motion.div>
              )}

              {/* Subtle radar circular rings */}
              <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl pointer-events-none" />
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs font-semibold tracking-wide text-emerald-400">
                {status === 'scanning' ? 'Verificando dados biométricos...' : 'Identidade verificada com sucesso!'}
              </span>
            </div>
          </div>

          {/* Fallback Option */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => setAuthMethod(authMethod === 'face' ? 'fingerprint' : 'face')}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              {authMethod === 'face' ? <Fingerprint className="w-3.5 h-3.5" /> : <Scan className="w-3.5 h-3.5" />}
              <span>Usar {authMethod === 'face' ? 'Touch ID' : 'Face ID'}</span>
            </button>
            <button
              onClick={() => {
                setStatus('success');
                setTimeout(() => onSuccess(), 400);
              }}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Usar PIN do app</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
