import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  X,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { ADMIN_EMAIL } from '../services/firebaseBankService';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../firebase/config';

interface AccessAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn?: () => Promise<void>;
  onOpenRegister: (prefill?: { email?: string; cpf?: string }) => void;
  // DET-1: mensagem inicial do modal (gate do `onApprovedLogin`, §3.5, e
  // atalho "Área Pix", §3.6). Alimenta o `errorMessage` na abertura.
  initialMessage?: string;
}

// Tabela de erros do login manual (§3.2): com a proteção contra enumeração
// ativada, `signInWithEmailAndPassword` devolve `auth/invalid-credential`
// tanto para e-mail inexistente quanto para senha errada — `user-not-found`
// e `wrong-password` não são retornados. Ramo padrão sem vazar detalhe.
const manualErrorMessage = (code?: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/invalid-email':
      return 'Verifique o e-mail digitado.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'auth/user-disabled':
      return 'Conta desativada. Fale com o suporte.';
    case 'auth/operation-not-allowed':
      return 'O login por e-mail e senha não está ativado. Fale com o suporte.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique a internet e tente de novo.';
    default:
      return 'Não foi possível entrar. Tente de novo.';
  }
};

export const AccessAccountModal: React.FC<AccessAccountModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onOpenRegister,
  initialMessage
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // §3.3: "Esqueci a senha" — `view: 'login' | 'reset'`, sem modal novo.
  const [view, setView] = useState<'login' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Abertura: estado fresco; a `initialMessage` (se houver) alimenta o erro.
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(initialMessage ?? null);
    setView('login');
    setResetSent(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // §3.5: após `onGoogleSignIn` resolver, mantém a animação de sucesso de
  // 700ms como hoje e chama `onClose()` — e NADA de `onManualAccess` /
  // `onShowPendingApproval`. O listener decide a tela.
  const handleGoogleClick = async () => {
    if (!onGoogleSignIn) return;
    try {
      setErrorMessage(null);
      setIsGoogleLoading(true);
      await onGoogleSignIn();
      setIsSuccess(true);
      soundEffects.playPixSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        setIsGoogleLoading(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      setIsGoogleLoading(false);
      const authErr = err as { code?: string; message?: string };
      if (authErr?.code === 'auth/popup-closed-by-user') return;
      if (authErr?.code === 'auth/account-exists-with-different-credential') {
        // DET-2: hoje ninguém trata esse código. Sem segunda frase (§3.1,
        // correção da revisão v3): o vínculo inverso não existe no §3.7.
        setErrorMessage('Essa conta já tem senha de acesso — entre com e-mail e senha.');
        return;
      }
      setErrorMessage('Não foi possível conectar com o Google. Tente novamente ou use seus dados abaixo.');
    }
  };

  // §3.2: as 3 portas sem senha foram removidas. O único caminho de
  // entrada é a chamada ao Auth — senha errada NUNCA entra, nem com perfil
  // local no aparelho.
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) return;

    setErrorMessage(null);
    const cleanLower = cleanId.toLowerCase();

    // 1. Atalho do admin — REMOVIDO. Com a Q2 decidida (b), o e-mail do
    // admin é recusado com aviso; nada mais é tentado.
    if (cleanLower === ADMIN_EMAIL.toLowerCase()) {
      setErrorMessage('O acesso do administrador é só com o Google.');
      return;
    }

    const isEmail = cleanId.includes('@');
    const digitsOnly = cleanId.replace(/\D/g, '');

    // 2. CPF: o Auth não autentica por CPF. Mensagem, sem chamar o Auth.
    if (!isEmail) {
      if (digitsOnly.length >= 11) {
        setErrorMessage('O acesso com senha é pelo e-mail cadastrado; pelo CPF, use o Google.');
        return;
      }
      // DET-6: nem e-mail nem CPF — ramo padrão, sem chamar o Auth.
      setErrorMessage('Digite um e-mail ou CPF válido.');
      return;
    }

    // 3. Chamada ao Auth — o único caminho de entrada.
    setIsManualLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanId, password);
      setIsManualLoading(false);
      // 4. Após o sign-in: fechar o modal — SÓ `onClose()` (DET-7). Quem
      // decide para onde o usuário vai é o `onAuthStateChanged` (§3.4).
      onClose();
    } catch (err: unknown) {
      setIsManualLoading(false);
      const code = (err as { code?: string })?.code;
      setErrorMessage(manualErrorMessage(code));
    }
  };

  // §3.3: "Esqueci a senha" — `sendPasswordResetEmail`. Cópia condicional,
  // sem promessa: o comportamento do reset sobre conta só-Google não está
  // confirmado e não é assumido.
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Verifique o e-mail digitado.');
      return;
    }
    setErrorMessage(null);
    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setErrorMessage(manualErrorMessage(code));
    } finally {
      setIsResetLoading(false);
    }
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
                    {view === 'reset' ? 'Redefinir sua senha' : 'Acessar LeadsPay Bank'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {view === 'reset'
                      ? 'Enviamos um link de redefinição para o seu e-mail'
                      : 'Acesse sua conta individual ou verifique sua proposta'}
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {view === 'reset' ? (
                <div className="space-y-3.5 text-left">
                  {resetSent ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                      <p className="text-xs text-emerald-200 leading-relaxed">
                        Se esse e-mail tiver uma senha cadastrada, você receberá o link de redefinição.
                      </p>
                      <button
                        type="button"
                        onClick={() => setView('login')}
                        className="text-xs text-[#a3e635] font-semibold hover:underline cursor-pointer"
                      >
                        Voltar para o login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetSubmit} className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          E-mail cadastrado
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            placeholder="seu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 focus:border-[#a3e635] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={isResetLoading}
                          className="w-full py-3 rounded-xl bg-[#a3e635] hover:bg-[#92d628] disabled:opacity-50 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all cursor-pointer"
                        >
                          {isResetLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                          ) : (
                            <span>Enviar link de redefinição</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {!resetSent && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setView('login')}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Voltar para o login
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
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
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(identifier.includes('@') ? identifier : '');
                            setResetSent(false);
                            setErrorMessage(null);
                            setView('reset');
                          }}
                          className="text-[11px] text-[#a3e635] hover:underline font-medium cursor-pointer"
                        >
                          Esqueci a senha
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isManualLoading}
                        className="w-full py-3 rounded-xl bg-[#a3e635] hover:bg-[#92d628] disabled:opacity-50 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all cursor-pointer"
                      >
                        {isManualLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                        ) : (
                          <>
                            <span>Acessar Minha Conta</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
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
              )}
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
