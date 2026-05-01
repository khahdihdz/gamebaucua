'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/useAuth';

interface Props {
  onSuccess?: (amount: number) => void;
}

export default function GiftCodeInput({ onSuccess }: Props) {
  const { refresh } = useAuth();
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ amount: number; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input khi mở
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setCode('');
      setResult(null);
    }
  }, [open]);

  // Đóng bằng Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post('/api/giftcode/redeem', { code: trimmed });
      setResult({ amount: data.amount, message: data.message });
      await refresh(); // cập nhật số dư
      onSuccess?.(data.amount);
    } catch (e: any) {
      toastError('Mã không hợp lệ', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 glass rounded-xl border border-dashed border-yellow-500/25 hover:border-yellow-500/50 transition group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl group-hover:scale-110 transition-transform">🎁</span>
          <div className="text-left">
            <p className="text-sm font-bold text-yellow-400">Nhập Gift Code</p>
            <p className="text-xs text-gray-500">Nhận tiền thưởng ngay lập tức</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => !loading && setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className="fixed z-50 inset-x-4 bottom-6 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm"
            >
              <div className="glass rounded-2xl border border-yellow-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="font-black text-yellow-400 text-base">Gift Code</p>
                      <p className="text-xs text-gray-500">Nhập mã để nhận thưởng</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !loading && setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5">
                  {result ? (
                    /* ── Success state ── */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ delay: 0.05, duration: 0.45 }}
                        className="text-6xl mb-3"
                      >
                        🎉
                      </motion.div>
                      <p className="text-xl font-black text-green-400 mb-1">
                        +{result.amount.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-sm text-gray-400 mb-5">{result.message}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setCode(''); setResult(null); }}
                          className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition"
                        >
                          Nhập mã khác
                        </button>
                        <button
                          onClick={() => setOpen(false)}
                          className="flex-1 py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-sm font-bold text-yellow-400 hover:bg-yellow-500/30 transition"
                        >
                          Đóng
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* ── Input state ── */
                    <>
                      {/* Code input */}
                      <div className="relative mb-4">
                        <input
                          ref={inputRef}
                          type="text"
                          value={code}
                          onChange={e => setCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && !loading && handleRedeem()}
                          placeholder="VD: SUMMER2025"
                          maxLength={20}
                          spellCheck={false}
                          autoComplete="off"
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white text-center font-mono text-lg font-bold tracking-widest placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition uppercase"
                        />
                        {code && (
                          <button
                            onClick={() => setCode('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition text-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Hint */}
                      <p className="text-xs text-gray-600 text-center mb-4">
                        Mỗi tài khoản chỉ dùng mỗi mã một lần
                      </p>

                      {/* Submit */}
                      <button
                        onClick={handleRedeem}
                        disabled={loading || !code.trim()}
                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg text-sm"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Đang kiểm tra...
                          </span>
                        ) : '🎁 Nhận thưởng'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
