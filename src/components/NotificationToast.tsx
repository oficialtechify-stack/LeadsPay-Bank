import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Smartphone, Sparkles, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export interface BankNotification {
  id: string;
  title: string;
  message: string;
  amount?: number;
  time?: string;
  type?: 'pix' | 'tap' | 'card' | 'security';
}

interface NotificationToastProps {
  notification: BankNotification | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.9 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-[#0e1611]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(0,230,118,0.3)] text-white flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-[#00e676] flex items-center justify-center text-black font-bold shadow-md shrink-0">
            {notification.type === 'tap' ? (
              <Smartphone className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>

          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight">{notification.title}</span>
              <span className="text-[10px] text-emerald-400 font-mono">agora</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{notification.message}</p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
