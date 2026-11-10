import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Fingerprint, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  UserPlus,
  Loader2
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { AccountApplication, UserProfile } from '../types';
import { 
  findApplicationByEmailOrCpf, 
  findUserProfileByEmailOrCpf,
  getLocalUserApplication,
  ADMIN_EMAIL,
  saveRegistrationDraft
} from '../services/firebaseBankService';
import { auth } from '../firebase/config';

interface AccessAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn?: () => Promise<void>;
  onManualAccess: (profile?: UserProfile) => void;
  onOpenRegister: (prefill?: { email?: string; cpf?: string }) => void;
  onShowPendingApproval: (app: AccountApplication) => void;
}

export const AccessAccountModal: React.FC<AccessAccountModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onManualAccess,
  onOpenRegister,
  onShowPendingApproval
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    if (!onGoogleSignIn) return;
    try {
      setErrorMessage(null);
      setIsGoogleLoading(true);
      await onGoogleSignIn();

      const currentUser = auth.currentUser;
      const userEmail = currentUser?.email?.toLowerCase().trim() || '';

      // 1. If admin, grant direct access
      if (userEmail === ADMIN_EMAIL.toLowerCase()) {
        setIsSuccess(true);
        soundEffects.playPixSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          setIsGoogleLoading(false);
          onClose();
          onManualAccess();
        }, 700);
        return;
      }

      // 2. Search for registered application
      const app = (currentUser?.uid ? getLocalUserApplication(currentUser.uid) : null) || 
                  (userEmail ? findApplicationByEmailOrCpf(userEmail) : null);

      if (app) {
        setIsGoogleLoading(false);
        onClose();
        if (app.status === 'approved') {
          soundEffects.playPixSuccess();
          const profile = findUserProfileByEmailOrCpf(userEmail) || findUserProfileByEmailOrCpf(app.cpf);
          onManualAccess(profile || undefined);
        } else {
          // Status is 'pending' or 'needs_revision': Show pending approval screen!
          onShowPendingApproval(app);
        }
        return;
      }

      // 3. Search for existing user profile
      const existingProfile = findUserProfileByEmailOrCpf(userEmail);
      if (existingProfile && existingProfile.status === 'approved') {
        setIsSuccess(true);
        soundEffects.playPixSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          setIsGoogleLoading(false);
          onClose();
          onManualAccess(existingProfile);
        }, 700);
        return;
      }

      // 4. User does not have an account!
      // "quando o usuario apertar em acessar conta se ele nao tiver conta no app mande ele pra abrir uma conta"
      setIsGoogleLoading(false);
      onClose();

      // Pre-save Google details to draft
      saveRegistrationDraft({
        fullName: currentUser?.displayName || '',
        preferredName: currentUser?.displayName?.split(' ')[0] || '',
        email: userEmail,
        selfiePhoto: currentUser?.photoURL || ''
      });

      onOpenRegister({ email: userEmail });
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      setIsGoogleLoading(false);
      const authErr = err as { code?: string; message?: string };
      if (authErr?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage('Não foi possível conectar com o Google. Tente novamente ou use seus dados abaixo.');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) return;

    setErrorMessage(null);
    const cleanLower = cleanId.toLowerCase();

    // 1. Admin login check
    if (cleanLower === ADMIN_EMAIL.toLowerCase()) {
      setIsSuccess(true);
      soundEffects.playPixSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        onManualAccess();
      }, 700);
      return;
    }

    // 2. Search for registered application
    const app = findApplicationByEmailOrCpf(cleanId);
    if (app) {
      if (app.status === 'approved') {
        setIsSuccess(true);
        soundEffects.playPixSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
          onManualAccess();
        }, 700);
      } else {
        // Proposal is pending or needs revision -> Show "Aguarde a aprovação da sua conta"
        onClose();
        onShowPendingApproval(app);
      }
      return;
    }

    // 3. Search for existing user profile
    const existingProfile = findUserProfileByEmailOrCpf(cleanId);
    if (existingProfile && existingProfile.status === 'approved') {
      setIsSuccess(true);
      soundEffects.playPixSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        onManualAccess(existingProfile);
      }, 700);
      return;
    }

    // 4. User does not have an account!
    // As explicitly requested: redirect to open account!
    const isEmail = cleanId.includes('@');
    const isCpf = cleanId.replace(/\D/g, '').length >= 11;

    saveRegistrationDraft({
      email: isEmail ? cleanId : '',
      cpf: isCpf ? cleanId : ''
    });

    onClose();
    onOpenRegister({
      email: isEmail ? cleanId : undefined,
      cpf: isCpf ? cleanId : undefined
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[#0c120e] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,230,118,0.25)] text-white relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSuccess ? (
            <div>
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-5 text-left">
                <div className="w-10 h-10 rounded-2xl bg-[#a3e635]/20 border border-[#a3e635]/40 flex items-center justify-center text-[#a3e635] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    Acessar LeadsPay Bank
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acesse sua conta individual ou verifique sua proposta
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. GOOGLE SIGN IN BUTTON */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isGoogleLoading ? 'Autenticando...' : 'Entrar com o Google'}</span>
              </button>

              {/* DIVIDER */}
              <div className="flex items-center gap-3 my-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <div className="flex-1 h-px bg-white/10" />
                <span>ou acesse com CPF/E-mail</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* MANUAL LOGIN FORM */}
              <form onSubmit={handleManualSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    CPF ou E-mail cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00 ou seu@email.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 focus:border-[#a3e635] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Senha de acesso
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 focus:border-[#a3e635] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none tracking-widest"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#a3e635] hover:bg-[#92d628] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all cursor-pointer"
                  >
                    <span>Acessar Minha Conta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* FOOTER SWITCH TO REGISTER */}
              <div className="mt-5 pt-3 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Ainda não tem conta LeadsPay?{' '}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRegister();
                    }}
                    className="text-[#a3e635] font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Criar conta
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#a3e635]/20 border border-[#a3e635] flex items-center justify-center text-[#a3e635] mx-auto shadow-[0_0_30px_rgba(163,230,53,0.5)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-display font-bold text-white">
                Acesso Autorizado!
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Carregando sua conta individual LeadsPay...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
