'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SYMBOLS, SYMBOL_CONFIG, formatVND, type Symbol } from '@/lib/symbols';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

const CHIPS = [1000, 5000, 10000, 50000, 100000];

interface Props {
  canBet: boolean;
  roundId: string;
  myBet: Record<string, number> | null;
  onBetPlaced: (balance: number) => void;
}

export default function BettingBoard({ canBet, roundId, myBet, onBetPlaced }: Props) {
  const [bets, setBets] = useState<Record<string, number>>({});
  const [activeChip, setActiveChip] = useState(10000);
  const [loading, setLoading] = useState(false);
  const { success, error: toastError, warning } = useToast();

  const addBet = (symbol: string) => {
    if (!canBet || myBet) return;
    setBets(prev => ({ ...prev, [symbol]: (prev[symbol] || 0) + activeChip }));
  };

  const clearBets = () => setBets({});

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const placeBet = async () => {
    if (totalBet === 0 || loading || myBet) return;
    setLoading(true);
    try {
      const data = await api.post('/api/game/bet', { betData: bets });
      success('Đặt cược thành công!', `Tổng: ${formatVND(totalBet)}`);
      onBetPlaced(data.newBalance);
      setBets({});
    } catch (e: any) {
      toastError('Đặt cược thất bại', e.message);
    } finally {
      setLoading(false);
    }
  };

  const displayBets = myBet
    ? Object.fromEntries(Object.entries(myBet).map(([k, v]) => [k, v]))
    : bets;

  return (
    <div className="space-y-4">
      {/* Chip selector */}
      <div className="glass rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-2 font-semibold tracking-wider uppercase">Chọn mệnh giá</p>
        <div className="flex gap-2 flex-wrap">
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                activeChip === chip
                  ? 'bg-yellow-500 text-black border-yellow-500'
                  : 'border-yellow-500/20 text-yellow-400 hover:border-yellow-500/50'
              }`}
            >
              {chip >= 1000 ? `${chip / 1000}K` : chip}
            </button>
          ))}
        </div>
      </div>

      {/* Betting grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SYMBOLS.map(sym => {
          const cfg = SYMBOL_CONFIG[sym as Symbol];
          const betAmt = displayBets[sym] || 0;
          return (
            <motion.button
              key={sym}
              whileHover={canBet && !myBet ? { scale: 1.05 } : {}}
              whileTap={canBet && !myBet ? { scale: 0.95 } : {}}
              onClick={() => addBet(sym)}
              disabled={!canBet || !!myBet}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${cfg.color} flex flex-col items-center justify-center border transition
                ${canBet && !myBet ? 'cursor-pointer border-white/20 hover:border-white/40 shadow-lg' : 'cursor-not-allowed opacity-70 border-white/10'}
                ${betAmt > 0 ? 'ring-2 ring-yellow-400' : ''}
              `}
            >
              <span className="text-3xl">{cfg.emoji}</span>
              <span className="text-xs font-bold text-white/90 mt-1">{cfg.label}</span>
              {betAmt > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black rounded-full px-1.5 py-0.5 shadow-lg"
                >
                  {betAmt >= 1000 ? `${betAmt / 1000}K` : betAmt}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Already bet */}
      {myBet && (
        <div className="text-center text-yellow-400 text-sm font-semibold glass rounded-xl py-3">
          ✅ Đã đặt cược — Tổng: {formatVND(Object.values(myBet).reduce((a: any, b: any) => a + b, 0))}
        </div>
      )}

      {/* Action buttons */}
      {!myBet && (
        <div className="flex gap-3">
          <button
            onClick={clearBets}
            disabled={totalBet === 0}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition disabled:opacity-40"
          >
            Xóa cược
          </button>
          <button
            onClick={placeBet}
            disabled={!canBet || totalBet === 0 || loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black text-sm hover:from-yellow-400 hover:to-yellow-500 transition disabled:opacity-40 shadow-lg"
          >
            {loading ? '⏳ Đang đặt...' : `Đặt ${totalBet > 0 ? formatVND(totalBet) : 'cược'}`}
          </button>
        </div>
      )}
    </div>
  );
}
