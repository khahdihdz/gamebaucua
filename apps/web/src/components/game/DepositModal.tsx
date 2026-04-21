'use client';
import { useStore } from '@/store';
import { paymentAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

type Step = 'amount' | 'qr' | 'success';

export function DepositModal() {
  const { setDepositModal, user } = useStore();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositData, setDepositData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 min
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    if (step !== 'qr') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStep('amount');
          toast.error('Hết thời gian, vui lòng tạo lại yêu cầu nạp.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step]);

  // Poll deposit status every 5s
  useEffect(() => {
    if (step !== 'qr' || !depositData?.content) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await paymentAPI.checkStatus(depositData.content);
        if (res.status === 'completed') {
          clearInterval(pollRef.current!);
          setStep('success');
        }
      } catch {}
    }, 5000);
    return () => clearInterval(pollRef.current!);
  }, [step, depositData?.content]);

  const handleCreateDeposit = async () => {
    const num = parseInt(amount.replace(/,/g, ''));
    if (!num || num < 10000) {
      toast.error('Nạp tối thiểu 10,000 VNĐ');
      return;
    }
    setLoading(true);
    try {
      const data = await paymentAPI.createDeposit(num);
      setDepositData(data);
      setTimeLeft(900);
      setStep('qr');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tạo yêu cầu nạp tiền');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('vi-VN');
  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setDepositModal(false)}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-casino-card border border-casino-border rounded-2xl shadow-card overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-casino-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <h2 className="font-black text-lg">Nạp Tiền</h2>
          </div>
          <button
            onClick={() => setDepositModal(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-casino-surface hover:bg-casino-border transition-colors text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Step: Amount */}
        {step === 'amount' && (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Số dư hiện tại</p>
              <p className="text-casino-gold font-black text-2xl">💰 {fmt(user?.balance || 0)} xu</p>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(a.toString())}
                  className={`py-2 rounded-xl border text-sm font-bold transition-all
                    ${amount === a.toString()
                      ? 'border-casino-gold bg-casino-gold/10 text-casino-gold'
                      : 'border-casino-border bg-casino-surface hover:border-gray-500 text-gray-300'
                    }`}
                >
                  {a >= 1000000 ? `${a / 1000000}M` : `${a / 1000}k`}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hoặc nhập số tiền (VNĐ)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="VD: 200000"
                className="input-casino"
              />
              {amount && parseInt(amount) >= 10000 && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ +{fmt(parseInt(amount))} xu vào tài khoản
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-casino-surface rounded-xl p-3 text-xs text-gray-500 space-y-1">
              <p>✅ Tự động cộng xu sau khi chuyển khoản</p>
              <p>🏦 Hỗ trợ chuyển khoản ngân hàng / ví</p>
              <p>⚡ Thường xử lý trong vòng 1-2 phút</p>
            </div>

            <button
              onClick={handleCreateDeposit}
              disabled={loading || !amount || parseInt(amount) < 10000}
              className="btn-casino w-full py-3 text-base"
            >
              {loading ? '⏳ Đang tạo...' : 'Tạo Mã QR Chuyển Khoản →'}
            </button>
          </div>
        )}

        {/* Step: QR Code */}
        {step === 'qr' && depositData && (
          <div className="p-4 space-y-4">
            {/* Timer */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Hết hạn sau:</p>
              <span className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-400' : 'text-casino-gold'}`}>
                ⏱ {fmtTime(timeLeft)}
              </span>
            </div>

            {/* Amount */}
            <div className="text-center bg-casino-surface rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Số tiền chuyển khoản</p>
              <p className="text-2xl font-black text-casino-gold">{fmt(depositData.amount)} VNĐ</p>
            </div>

            {/* QR Image */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-2xl">
                <Image
                  src={depositData.vietQRUrl}
                  alt="QR Code"
                  width={220}
                  height={220}
                  className="rounded-xl"
                  unoptimized
                />
              </div>
            </div>

            {/* Bank info */}
            <div className="bg-casino-surface rounded-xl p-3 space-y-2 text-sm">
              <InfoRow label="Ngân hàng" value={depositData.bankCode} />
              <InfoRow label="Số tài khoản" value={depositData.accountNumber} copyable />
              <InfoRow label="Tên TK" value={depositData.accountName} />
              <InfoRow label="Số tiền" value={`${fmt(depositData.amount)} VNĐ`} highlight />
              <div className="border-t border-casino-border pt-2">
                <InfoRow label="Nội dung CK" value={depositData.content} copyable highlight />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400">
              ⚠️ Nhập đúng nội dung <strong>{depositData.content}</strong> khi chuyển khoản để tự động cộng xu!
            </div>

            {/* Polling indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-3 h-3 border border-gray-500 border-t-casino-gold rounded-full"
              />
              Đang chờ xác nhận thanh toán...
            </div>

            <button
              onClick={() => setStep('amount')}
              className="w-full py-2 border border-casino-border rounded-xl text-sm text-gray-400 hover:border-gray-500"
            >
              ← Tạo lại
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
            <div>
              <h3 className="text-xl font-black text-casino-green">Nạp Tiền Thành Công!</h3>
              <p className="text-gray-400 text-sm mt-1">
                +{fmt(depositData?.amount || 0)} xu đã được cộng vào tài khoản
              </p>
            </div>
            <button
              onClick={() => setDepositModal(false)}
              className="btn-casino w-full"
            >
              🎲 Chơi Ngay!
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value, copyable, highlight }: {
  label: string; value: string; copyable?: boolean; highlight?: boolean;
}) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Đã sao chép!', { duration: 1500 });
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500 flex-shrink-0">{label}:</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className={`font-bold truncate ${highlight ? 'text-casino-gold' : 'text-white'}`}>
          {value}
        </span>
        {copyable && (
          <button onClick={copy} className="text-gray-500 hover:text-casino-gold flex-shrink-0 text-base">
            📋
          </button>
        )}
      </div>
    </div>
  );
}
