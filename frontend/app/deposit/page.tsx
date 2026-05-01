'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { api } from '@/lib/api';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import GiftCodeInput from '@/components/GiftCodeInput';

interface DepositInfo {
  transactionId: string;
  content: string;
  amount: number;
  bank: string;
  account: string;
  qrUrl: string;
}

const AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function DepositPage() {
  const { user, refresh } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { success, error: toastError } = useToast();
  const [deposit, setDeposit] = useState<DepositInfo | null>(null);
  const [pollStatus, setPollStatus] = useState<'pending' | 'done' | null>(null);

  // Poll for payment status
  useEffect(() => {
    if (!deposit || pollStatus === 'done') return;
    
    const id = setInterval(async () => {
      try {
        const data = await api.get(`/api/deposit/status/${deposit.transactionId}`);
        if (data.status === 'done') {
          setPollStatus('done');
          refresh();
          clearInterval(id);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(id);
  }, [deposit, pollStatus, refresh]);

  const createDeposit = async () => {
    setError('');
    const amt = parseInt(amount);
    if (isNaN(amt) || amt < 10000) {
      setError('Số tiền tối thiểu 10,000đ');
      return;
    }
    setLoading(true);
    
    try {
      const data = await api.post('/api/deposit/create', { amount: amt });
      setDeposit(data);
      setPollStatus('pending');
    } catch (e: any) {
      toastError('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-yellow-400">Vui lòng đăng nhập để nạp tiền</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-display font-black shimmer-text text-center mb-2">
          💳 Nạp Tiền
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Tự động xử lý qua SePay
        </p>

        {/* Balance */}
        <div className="glass rounded-2xl p-4 mb-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">Số dư hiện tại</span>
          <span className="text-yellow-400 font-black text-xl">
            {user.balance.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Gift Code */}
        <div className="mb-6">
          <GiftCodeInput onSuccess={() => {}} />
        </div>

        {pollStatus === 'done' ? (
          <div className="glass rounded-2xl p-8 text-center gold-glow">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-display font-bold text-green-400 mb-2">Nạp tiền thành công!</h2>
            <p className="text-gray-400 mb-6">
              +{deposit?.amount.toLocaleString('vi-VN')}đ đã được cộng vào tài khoản
            </p>
            <button
              onClick={() => { setDeposit(null); setPollStatus(null); setAmount(''); }}
              className="px-6 py-3 bg-yellow-500 text-black font-black rounded-xl hover:bg-yellow-400 transition"
            >
              Nạp thêm
            </button>
          </div>
        ) : deposit ? (
          <div className="glass rounded-2xl p-6 gold-glow">
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-bold">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                Đang chờ thanh toán...
              </span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-white rounded-xl">
                <Image
                  src={deposit.qrUrl}
                  alt="VietQR"
                  width={200} height={200}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Payment details */}
            <div className="space-y-3 text-sm">
              {[
                { label: 'Ngân hàng', value: deposit.bank },
                { label: 'Số tài khoản', value: deposit.account, copy: true },
                { label: 'Số tiền', value: `${deposit.amount.toLocaleString('vi-VN')}đ` },
                { label: 'Nội dung CK', value: deposit.content, copy: true, highlight: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-500">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${item.highlight ? 'text-yellow-400' : 'text-white'}`}>
                      {item.value}
                    </span>
                    {item.copy && (
                      <button
                        onClick={() => navigator.clipboard.writeText(item.value)}
                        className="text-xs text-gray-500 hover:text-yellow-400 transition"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-red-400 mt-4 text-center">
              ⚠️ Nhập ĐÚNG nội dung chuyển khoản để tiền được xử lý tự động
            </p>

            <button
              onClick={() => { setDeposit(null); setPollStatus(null); }}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Huỷ
            </button>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 gold-glow">
            {/* Preset amounts */}
            <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">Số tiền nhanh</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`py-2 rounded-lg text-sm font-bold transition border ${
                    amount === String(a)
                      ? 'bg-yellow-500 text-black border-yellow-500'
                      : 'border-yellow-500/20 text-yellow-400 hover:border-yellow-500/50'
                  }`}
                >
                  {(a / 1000)}K
                </button>
              ))}
            </div>

            {/* Manual input */}
            <div className="relative mb-4">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Hoặc nhập số tiền..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={createDeposit}
              disabled={loading || !amount}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-40 shadow-lg"
            >
              {loading ? '⏳ Đang tạo...' : '🏦 Tạo lệnh nạp tiền'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
