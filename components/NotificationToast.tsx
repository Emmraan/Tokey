'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'shield';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { ...toast, id };

    setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

    const duration = toast.duration || 3000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        id="tokey-toast-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success' || !toast.type;
            const isError = toast.type === 'error';
            const isShield = toast.type === 'shield';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-auto rounded-lg p-3 bg-zinc-900 border border-zinc-700/80 text-zinc-100 shadow-xl flex items-start gap-2.5 text-xs"
              >
                <div className="shrink-0 mt-0.5">
                  {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  {isShield && <ShieldCheck className="w-4 h-4 text-zinc-300" />}
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-100">{toast.title}</p>
                  {toast.description && (
                    <p className="text-zinc-400 mt-0.5 leading-snug">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-zinc-400 hover:text-white transition-colors shrink-0 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

