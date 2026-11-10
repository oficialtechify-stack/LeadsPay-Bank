import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Copy, Check, RefreshCw } from 'lucide-react';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState('784 921');
  const [timeLeft, setTimeLeft] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Generate new 6 digit code
          const part1 = Math.floor(100 + Math.random() * 900);
          const part2 = Math.floor(100 + Math.random() * 900);
          setToken(`${part1} ${part2}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(token.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="w-full max-w-sm bg-[#0c120e] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,230,118,0.2)] text-white relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#a3e635]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">
                Token LeadsPay Knox
              </h3>
              <p className="text-xs text-slate-400">
                Código dinâmico para autorização segura
              </p>
            </div>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 text-center space-y-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest block font-medium">
              Código de Validação
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-[#a3e635] py-1">
              {token}
            </div>

            {/* Circular countdown progress bar */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${timeLeft <= 5 ? 'animate-spin' : ''}`} />
              <span>Atualiza em <strong className="text-white font-mono">{timeLeft}s</strong></span>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-[#a3e635]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Código copiado!' : 'Copiar código do token'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
