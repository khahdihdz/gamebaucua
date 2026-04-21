'use client';
import { useStore } from '@/store';
import { gameAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

const SYMBOLS = ['bau', 'cua', 'ca', 'tom', 'ga', 'nai'] as const;
const SYMBOL_EMOJI: Record<string, string> = {
  bau: '🦐', cua: '🦀', ca: '🐟', tom: '🦞', ga: '🐓', nai: '🦌'
};
const SYMBOL_LABEL: Record<string, string> = {
  bau: 'Bầu', cua: 'Cua', ca: 'Cá', tom: 'Tôm', ga: 'Gà', nai: 'Nai'
};
const BET_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 500000];

export function BettingPanel() {
  const {
    user, currentRound, myBets,
    addBetChoice, removeBetChoice, clearBets,
    setPendingBet, pendingBet
  } = useStore();

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isBetting = currentRound?.status === 'betting';
  const totalBet = myBets.reduce((s, b) => s + b.amount, 0);
  const alreadyBet = pendingBet;

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym === selectedSymbol ? null : sym);
  };

  const handleAddBet = (amount: number) => {
    if (!selectedSymbol) {
      toast.error('Chọn ô cược trước!');
      return;
    }
    if (amount > (user?.balance || 0) - totalBet) {
      toast.error('Số dư không đủ!');
      return;
    }
    addBetChoice({ symbol: selectedSymbol, amount });
  };

  const handleSubmitBet = async () => {
    if (!currentRound || !isBetting || submitting || alreadyBet) return;
    if (myBets.length === 0) { toast.error('Chưa chọn cược!'); return; }
    if (totalBet <= 0) return;

    setSubmitting(true);
    try {
      await gameAPI.placeBet({ choices: myBets, roundId: currentRound.roundId });
      setPendingBet(true);
      toast.success('✅ Đã đặt cược thành công!', {
        style: { background: '#1a1a26', color: '#2ecc71', border: '1px solid #2ecc71' }
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi đặt cược!';
      toast.error(msg);
      clearBets();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-casino p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">
          Chọn Ô Cược
        </h3>
        {myBets.length > 0 && !alreadyBet && (
          <button onClick={clearBets} className="text-xs text-red-400 hover:text-red-300">
            Xóa hết
          </button>
        )}
      </div>

      {/* Symbol grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {SYMBOLS.map(sym => {
          const myBet = myBets.find(b => b.symbol === sym);
          const isSelected = selectedSymbol === sym;

          return (
            <motion.button
              key={sym}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleSelectSymbol(sym)}
              disabled={!isBetting || alreadyBet}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-xl border-2 
                transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected
                  ? 'border-casino-gold bg-casino-gold/10 shadow-gold'
                  : myBet
                  ? 'border-casino-green/50 bg-casino-green/5'
                  : 'border-casino-border bg-casino-surface hover:border-gray-500'
                }
              `}
            >
              <span className="text-2xl">{SYMBOL_EMOJI[sym]}</span>
              <span className="text-xs font-bold mt-1 text-gray-300">{SYMBOL_LABEL[sym]}</span>

              {/* Bet amount badge */}
              {myBet && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-casino-gold text-casino-bg text-xs font-black px-1.5 py-0.5 rounded-full"
                >
                  {myBet.amount >= 1000
                    ? `${(myBet.amount / 1000).toFixed(0)}k`
                    : myBet.amount}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bet amount chips */}
      <AnimatePresence>
        {selectedSymbol && isBetting && !alreadyBet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-gray-500">
              Đặt vào <span className="text-casino-gold font-bold">
                {SYMBOL_EMOJI[selectedSymbol]} {SYMBOL_LABEL[selectedSymbol]}
              </span>:
            </p>
            <div className="flex flex-wrap gap-2">
              {BET_AMOUNTS.map(amt => (
                <motion.button
                  key={amt}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddBet(amt)}
                  className="px-3 py-1.5 bg-casino-surface border border-casino-border rounded-lg
                             text-sm font-bold hover:border-casino-gold hover:text-casino-gold transition-colors"
                >
                  {amt >= 1000 ? `${amt / 1000}k` : amt}
                </motion.button>
              ))}
              {/* Custom amount */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Khác..."
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="w-24 input-casino text-sm py-1.5"
                />
                <button
                  onClick={() => {
                    const amt = parseInt(customAmount);
                    if (amt >= 100) { handleAddBet(amt); setCustomAmount(''); }
                  }}
                  className="px-2 py-1.5 bg-casino-gold/20 border border-casino-gold/30 rounded-lg
                             text-casino-gold text-sm font-bold hover:bg-casino-gold/30"
                >
                  +
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current bets summary */}
      {myBets.length > 0 && (
        <div className="bg-casino-surface rounded-xl p-3 space-y-1">
          {myBets.map(b => (
            <div key={b.symbol} className="flex items-center justify-between text-sm">
              <span>{SYMBOL_EMOJI[b.symbol]} {SYMBOL_LABEL[b.symbol]}</span>
              <div className="flex items-center gap-2">
                <span className="text-casino-gold font-bold">
                  {b.amount.toLocaleString('vi-VN')} xu
                </span>
                {!alreadyBet && (
                  <button
                    onClick={() => removeBetChoice(b.symbol)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="border-t border-casino-border pt-1 flex justify-between font-bold">
            <span>Tổng cược:</span>
            <span className="text-casino-gold">{totalBet.toLocaleString('vi-VN')} xu</span>
          </div>
        </div>
      )}

      {/* Submit button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSubmitBet}
        disabled={!isBetting || myBets.length === 0 || submitting || alreadyBet || totalBet === 0}
        className="btn-casino w-full text-base py-3"
      >
        {alreadyBet
          ? '✅ Đã đặt cược - Chờ kết quả...'
          : submitting
          ? '⏳ Đang xử lý...'
          : !isBetting
          ? '⏰ Chờ ván mới...'
          : `🎲 Đặt Cược ${totalBet > 0 ? totalBet.toLocaleString('vi-VN') + ' xu' : ''}`
        }
      </motion.button>
    </div>
  );
}
