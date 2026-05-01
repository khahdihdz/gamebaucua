'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { SYMBOLS, SYMBOL_CONFIG, formatVND, type Symbol } from '@/lib/symbols';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

const CHIPS = [
  { value: 1000,   label: '1K',   color: 'from-slate-500 to-slate-700' },
  { value: 5000,   label: '5K',   color: 'from-emerald-600 to-emerald-800' },
  { value: 10000,  label: '10K',  color: 'from-blue-600 to-blue-800' },
  { value: 50000,  label: '50K',  color: 'from-purple-600 to-purple-800' },
  { value: 100000, label: '100K', color: 'from-yellow-500 to-yellow-700' },
];

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
  const { success, error: toastError } = useToast();

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

  const locked = !!myBet || !canBet;

  return (
    <div className="space-y-4">
      {/* Chip selector */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase mb-2">
          Mệnh Giá Cược
        </p>
        <div className="flex gap-2 flex-wrap">
          {CHIPS.map(chip => (
            <button
              key={chip.value}
              onClick={() => setActiveChip(chip.value)}
              className={`relative w-12 h-12 rounded-full chip transition-all duration-150 text-white
                bg-gradient-to-br ${chip.color}
                ${activeChip === chip.value
                  ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black scale-110 shadow-lg shadow-yellow-500/20'
                  : 'opacity-60 hover:opacity-90'
                }`}
            >
              {chip.label}
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
              whileHover={!locked ? { scale: 1.06, y: -2 } : {}}
              whileTap={!locked ? { scale: 0.94 } : {}}
              onClick={() => addBet(sym)}
              disabled={locked}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${cfg.color}
                flex flex-col items-center justify-center
                border transition-all duration-150 select-none
                ${!locked
                  ? 'cursor-pointer border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl'
                  : 'cursor-not-allowed opacity-60 border-white/8'
                }
                ${betAmt > 0 ? 'ring-2 ring-yellow-400 shadow-yellow-500/20' : ''}
              `}
            >
              <span className="text-3xl sm:text-4xl leading-none">{cfg.emoji}</span>
              <span className="text-[10px] sm:text-xs font-bold text-white/90 mt-1 tracking-wide">
                {cfg.label}
              </span>
              {betAmt > 0 && (
                <motion.div
                  initial={{ scale: 0, y: 4 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-black rounded-full px-1.5 py-0.5 shadow-lg min-w-[24px] text-center"
                >
                  {betAmt >= 1000 ? `${betAmt / 1000}K` : betAmt}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Placed bet display */}
      {myBet && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold">
          <span>✅</span>
          <span>Đã đặt cược — Tổng: {formatVND(Object.values(myBet).reduce((a: any, b: any) => a + b, 0))}</span>
        </div>
      )}

      {/* Status when not betting phase */}
      {!canBet && !myBet && (
        <div className="text-center py-3 text-gray-500 text-sm">
          ⏳ Chờ ván mới để đặt cược...
        </div>
      )}

      {/* Action buttons */}
      {canBet && !myBet && (
        <div className="flex gap-2">
          <button
            onClick={clearBets}
            disabled={totalBet === 0}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-semibold text-sm hover:bg-white/4 hover:text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Xóa Cược
          </button>
          <button
            onClick={placeBet}
            disabled={totalBet === 0 || loading}
            className="flex-[2] py-3 btn-gold text-sm"
          >
            {loading
              ? '⏳ Đang đặt...'
              : totalBet > 0
                ? `Đặt ${formatVND(totalBet)}`
                : 'Chọn ô để cược'
            }
          </button>
        </div>
      )}
    </div>
  );
}
