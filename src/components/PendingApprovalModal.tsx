import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  Sparkles,
  Camera,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/audio';
import { AccountApplication } from '../types';
import { getLocalApplications, getLocalUserProfile } from '../services/firebaseBankService';

interface PendingApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: AccountApplication | null;
  onOpenRevision?: (app: AccountApplication) => void;
  onApprovedLogin?: (app: AccountApplication) => void;
}

export const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({
  isOpen,
  onClose,
  application,
  onOpenRevision,
  onApprovedLogin
}) => {
  const [currentApp, setCurrentApp] = useState<AccountApplication | null>(application);
  const [isChecking, setIsChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setCurrentApp(application);
  }, [application]);

  if (!isOpen || !currentApp) return null;

  const handleRefreshStatus = () => {
    setIsChecking(true);
    setCheckFeedback(null);
    soundEffects.playNfcTap();

    setTimeout(() => {
      // Re-read applications from storage
      const all = getLocalApplications();
      const fresh = all.find(
        (a) => a.id === currentApp.id || a.userId === currentApp.userId || a.cpf === currentApp.cpf
      );

      if (fresh) {
        setCurrentApp(fresh);
        if (fresh.status === 'approved') {
          soundEffects.playPixSuccess();
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#00e676', '#a3e635', '#ffffff']
          });
          setCheckFeedback('Parabéns! Sua conta foi aprovada pela administração!');
        } else if (fresh.status === 'needs_revision') {
          setCheckFeedback('A administração solicitou um ajuste em sua proposta.');
        } else {
          setCheckFeedback('Sua proposta continua em análise com a equipe de validação.');
        }
      } else {
        setCheckFeedback('Sua proposta continua em análise.');
      }
      setIsChecking(false);
    }, 900);
  };

  const isApproved = currentApp.status === 'approved';
  const isRevision = currentApp.status === 'needs_revision';
  const isPending = currentApp.status === 'pending';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-[#0a100c] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_80px_rgba(0,230,118,0.25)] text-white relative flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center pb-4 border-b border-white/10 shrink-0">
            <div className={`w-16 h-16 rounded-3xl mx-auto mb-3 flex items-center justify-center border shadow-lg ${
              isApproved
                ? 'bg-emerald-500/20 border-emerald-500/50 text-[#00e676]'
                : isRevision
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-[#00e676]'
            }`}>
              {isApproved ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : isRevision ? (
                <AlertCircle className="w-9 h-9" />
              ) : (
                <Clock className="w-9 h-9 animate-pulse" />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isApproved
                  ? 'bg-emerald-500/20 text-[#00e676] border-emerald-500/40'
                  : isRevision
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isApproved
                  ? 'Conta Aprovada'
                  : isRevision
                  ? 'Ajuste Solicitado'
                  : 'Em Análise de Conformidade'}
              </span>
            </div>

            <h3 className="text-xl font-display font-bold text-white tracking-tight">
              {isApproved
                ? 'Sua Conta Foi Aprovada!'
                : isRevision
                ? 'Ajuste Necessário na Documentação'
                : 'Aguarde a aprovação da sua conta'}
            </h3>

            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
              {isApproved
                ? 'Seus documentos e validação facial foram aceitos pela administração.'
                : isRevision
                ? 'A administração solicitou que você reenvie ou ajuste dados da sua proposta.'
                : 'Sua proposta está em processo de validação de segurança pela administração do LeadsPay.'}
            </p>
          </div>

          {/* Feedback banner */}
          {checkFeedback && (
            <div className="my-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-center text-emerald-300 font-medium shrink-0 animate-fadeIn">
              {checkFeedback}
            </div>
          )}

          {/* Scrollable content body */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 text-left text-xs">
            {/* Timeline / SLA Card */}
            {!isApproved && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00e676]" />
                    <span>Prazo Médio de Validação:</span>
                  </span>
                  <span className="font-mono text-[#00e676] font-bold text-xs">
                    24 a 48 horas úteis
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para garantir a segurança financeira do aplicativo, nenhuma conta é liberada sem a conferência e validação da administração.
                </p>
              </div>
            )}

            {/* Revision Callout (if admin requested revisions) */}
            {isRevision && currentApp.revisionNotes && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Mensagem da Administração:</span>
                </div>
                <p className="text-xs bg-black/40 p-2.5 rounded-xl border border-white/5 text-amber-100 font-mono">
                  "{currentApp.revisionNotes}"
                </p>
                {onOpenRevision && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRevision(currentApp);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Corrigir / Reenviar Documentos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Stepper Timeline */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Etapas do Processo
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#00e676]" />
                  </div>
                  <span className="text-white font-medium">1. Dados e Documentos Enviados</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isApproved 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-[#00e676]'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  }`}>
                    {isApproved ? <Check className="w-3 h-3 text-[#00e676]" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </div>
                  <span className={isApproved ? 'text-white font-medium' : 'text-amber-300 font-semibold'}>
                    2. Validação Facial e Documental pela Administração
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isApproved 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-[#00e676]'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    {isApproved ? <Check className="w-3 h-3 text-[#00e676]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                  </div>
                  <span className={isApproved ? 'text-white font-medium' : 'text-slate-500'}>
                    3. Liberação da Conta LeadsPay e Saldo
                  </span>
                </div>
              </div>
            </div>

            {/* Proposal Details Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Dados da Proposta Registrada
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Titular:</span>
                  <span className="font-semibold text-white">{currentApp.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">CPF:</span>
                  <span className="font-mono text-white">{currentApp.cpf}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="font-mono text-slate-300">{currentApp.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Data de Envio:</span>
                  <span className="text-slate-300">
                    {new Date(currentApp.createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(currentApp.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fotos Registradas:</span>
                  <span className="text-emerald-400 font-medium">✓ Doc Frente, Verso e Selfie</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-3 border-t border-white/10 shrink-0 space-y-2">
            {isApproved ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprovedLogin?.(currentApp);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all cursor-pointer"
              >
                <span>Acessar Minha Conta Aprovada</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={isChecking}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#00e676]' : ''}`} />
                  <span>{isChecking ? 'Verificando...' : 'Verificar Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
