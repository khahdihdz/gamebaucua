'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SYMBOL_CONFIG, formatVND, type Symbol } from '@/lib/symbols';

interface Props {
  result: { dice1: string; dice2: string; dice3: string } | null;
  myBet: { betData: Record<string, number>; totalBet: number; winAmount: number } | null;
  phase: string;
  roundId: string;
}

export default function ResultPopup({ result, myBet, phase, roundId }: Props) {
  const [visible, setVisible] = useState(false);
  const [lastRoundId, setLastRoundId] = useState<string | null>(null);

  useEffect(() => {
    // Show popup when phase becomes 'result' and we have a bet
    if (phase === 'result' && myBet && result && roundId !== lastRoundId) {
      setVisible(true);
      setLastRoundId(roundId);
      // Auto-dismiss after 5s
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [phase, myBet, result, roundId, lastRoundId]);

  if (!myBet || !result) return null;

  const isWin = myBet.winAmount > 0;
  const profit = myBet.winAmount - myBet.totalBet;
  const resultArr = [result.dice1, result.dice2, result.dice3];

  // Count matches per symbol
  const matchCounts: Record<string, number> = {};
  resultArr.forEach(d => { matchCounts[d] = (matchCounts[d] || 0) + 1; });

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
            onClick={() => setVisible(false)}
          />

          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'rgba(10,10,18,0.97)' }}
            >
              {/* Win/lose header */}
              <div className={`px-6 py-5 text-center ${
                isWin
                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-900/20 border-b border-yellow-500/30'
                  : 'bg-gradient-to-br from-red-900/20 to-red-950/20 border-b border-red-500/20'
              }`}>
                <motion.div
                  animate={isWin ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 0.6, repeat: isWin ? 2 : 0 }}
                  className="text-5xl mb-2"
                >
                  {isWin ? '🏆' : '💀'}
                </motion.div>
                <h2 className={`font-display text-2xl font-black ${isWin ? 'shimmer-text' : 'text-red-400'}`}>
                  {isWin ? 'THẮNG!' : 'THUA!'}
                </h2>
              </div>

              {/* Dice result */}
              <div className="px-6 py-4">
                <p className="text-xs text-gray-600 font-semibold tracking-wider uppercase text-center mb-3">
                  Kết quả xúc xắc
                </p>
                <div className="flex justify-center gap-3 mb-4">
                  {resultArr.map((d, i) => {
                    const cfg = SYMBOL_CONFIG[d as Symbol];
                    return cfg ? (
                      <motion.div
                        key={i}
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${cfg.color} flex flex-col items-center justify-center border border-white/10`}
                      >
                        <span className="text-2xl">{cfg.emoji}</span>
                        <span className="text-xs text-white/80 font-bold">{cfg.label}</span>
                      </motion.div>
                    ) : null;
                  })}
                </div>

                {/* Bet breakdown */}
                <div className="space-y-2 mb-4">
                  {Object.entries(myBet.betData || {}).map(([sym, amount]) => {
                    const cfg = SYMBOL_CONFIG[sym as Symbol];
                    const matches = matchCounts[sym] || 0;
                    const win = matches > 0 ? (amount as number) * matches + (amount as number) : 0;
                    return cfg ? (
                      <div key={sym} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{cfg.emoji}</span>
                          <span className="text-gray-400">{cfg.label}</span>
                          {matches > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-bold">
                              ×{matches}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 text-xs">{formatVND(amount as number)}</span>
                          {win > 0 && (
                            <span className="text-green-400 font-bold ml-2">+{formatVND(win)}</span>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>

                {/* Total */}
                <div className={`rounded-xl p-3 text-center ${
                  isWin ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <p className="text-xs text-gray-500 mb-1">Kết quả vòng này</p>
                  <p className={`text-2xl font-black font-display ${isWin ? 'text-yellow-400' : 'text-red-400'}`}>
                    {isWin ? '+' : ''}{formatVND(profit)}
                  </p>
                  {isWin && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Nhận về: {formatVND(myBet.winAmount)}
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="px-6 pb-5">
                <button
                  onClick={() => setVisible(false)}
                  className={`w-full py-3 rounded-xl font-black text-sm transition ${
                    isWin
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500'
                      : 'bg-gradient-to-r from-red-800 to-red-900 text-white hover:from-red-700 hover:to-red-800'
                  }`}
                >
                  {isWin ? '🎯 Tiếp tục chơi' : '🔄 Chơi lại'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
