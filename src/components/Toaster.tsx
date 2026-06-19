import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, CheckCircle, Info } from 'lucide-react';
import { ToastMessage, subscribeToToasts } from '../lib/toast';

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 5000);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto rounded-xl shadow-lg border p-4 flex gap-3 w-80 bg-white dark:bg-slate-800
              ${t.type === 'error' ? 'border-red-200' : t.type === 'success' ? 'border-emerald-200' : 'border-blue-200'}
            `}
          >
            <div className="mt-0.5 flex-shrink-0">
              {t.type === 'error' && <AlertCircle className="text-red-600" size={20} />}
              {t.type === 'success' && <CheckCircle className="text-emerald-600" size={20} />}
              {t.type === 'info' && <Info className="text-blue-600" size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${t.type === 'error' ? 'text-red-900 dark:text-red-400' : t.type === 'success' ? 'text-emerald-900 dark:text-emerald-400' : 'text-blue-900 dark:text-blue-400'}`}>
                {t.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 self-start">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
