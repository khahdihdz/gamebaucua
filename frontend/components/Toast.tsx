'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastCtx {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastCtx>({
  toast: () => {}, success: () => {}, error: () => {}, warning: () => {}, info: () => {}
});

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const STYLES: Record<ToastType, string> = {
  success: 'border-green-500/40 bg-green-500/10',
  error:   'border-red-500/40 bg-red-500/10',
  warning: 'border-yellow-500/40 bg-yellow-500/10',
  info:    'border-blue-500/40 bg-blue-500/10',
};

const TITLE_COLORS: Record<ToastType, string> = {
  success: 'text-green-400',
  error:   'text-red-400',
  warning: 'text-yellow-400',
  info:    'text-blue-400',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative flex items-start gap-3 w-80 max-w-[90vw] rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl cursor-pointer ${STYLES[toast.type]}`}
      onClick={() => onDismiss(toast.id)}
      style={{ background: 'rgba(10,10,15,0.92)' }}
    >
      <span className="text-xl mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm leading-tight ${TITLE_COLORS[toast.type]}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(toast.id); }}
        className="text-gray-600 hover:text-gray-400 transition text-xs shrink-0 mt-0.5"
      >
        ✕
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error'   ? 'bg-red-500' :
          toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration ?? 4000) / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]); // max 5
  }, []);

  const success = useCallback((title: string, message?: string) =>
    toast({ type: 'success', title, message }), [toast]);
  const error = useCallback((title: string, message?: string) =>
    toast({ type: 'error', title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) =>
    toast({ type: 'warning', title, message }), [toast]);
  const info = useCallback((title: string, message?: string) =>
    toast({ type: 'info', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
