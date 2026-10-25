import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface Toast {
  message: string;
  kind: 'success' | 'error';
}

export const NotificationToast: React.FC<{ toast: Toast | null }> = ({ toast }) => {
  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`max-w-md w-full rounded-2xl px-4 py-3 text-sm shadow-xl border ${
              toast.kind === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : 'bg-red-950/90 border-red-500/40 text-red-100'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
