'use client';
import { useStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const SYMBOL_EMOJI: Record<string, string> = {
  bau: '🦐', cua: '🦀', ca: '🐟', tom: '🦞', ga: '🐓', nai: '🦌'
};
const SYMBOL_LABEL: Record<string, string> = {
  bau: 'Bầu', cua: 'Cua', ca: 'Cá', tom: 'Tôm', ga: 'Gà', nai: 'Nai'
};
const SYMBOL_COLOR: Record<string, string> = {
  bau: '#4cc9f0', cua: '#e63946', ca: '#2ecc71',
  tom: '#e67e22', ga: '#e74c3c', nai: '#9b59b6'
};

function Dice({ symbol, rolling }: { symbol?: string; rolling: boolean }) {
  return (
    <motion.div
      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center gap-1
                 bg-casino-card border-2 border-casino-border shadow-card"
      animate={rolling ? {
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 1.1, 0.9, 1.1, 1]
      } : {}}
      transition={rolling ? { duration: 0.4, repeat: Infinity } : {}}
      style={symbol && !rolling ? {
        borderColor: SYMBOL_COLOR[symbol],
        boxShadow: `0 0 20px ${SYMBOL_COLOR[symbol]}40`
      } : {}}
    >
      <span className="text-3xl md:text-4xl">
        {rolling ? '🎲' : (symbol ? SYMBOL_EMOJI[symbol] : '?')}
      </span>
      {symbol && !rolling && (
        <span className="text-xs font-bold" style={{ color: SYMBOL_COLOR[symbol] }}>
          {SYMBOL_LABEL[symbol]}
        </span>
      )}
    </motion.div>
  );
}

function CountdownTimer({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, endsAt - Date.now()));
    }, 100);
    return () => clearInterval(interval);
  }, [endsAt]);

  const seconds = Math.ceil(timeLeft / 1000);
  const pct = Math.min(100, (timeLeft / 10000) * 100);
  const urgent = seconds <= 3;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={urgent ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className={`text-4xl font-black tabular-nums ${urgent ? 'text-casino-red' : 'text-casino-gold'}`}
      >
        {seconds}s
      </motion.div>
      <div className="w-full h-2 bg-casino-surface rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${urgent ? 'bg-casino-red' : 'bg-casino-gold'}`}
          style={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

export function GameBoard() {
  const { currentRound, lastResult, winAmount, myBets } = useStore();
  const isRolling = currentRound?.status === 'rolling';
  const isCompleted = currentRound?.status === 'completed';
  const isBetting = currentRound?.status === 'betting';

  // My bet symbols for win highlight
  const myBetSymbols = myBets.map(b => b.symbol);

  return (
    <div className="card-casino p-6">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${isBetting ? 'bg-green-400' : isRolling ? 'bg-yellow-400' : 'bg-gray-400'}`}
            animate={isBetting ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          <span className="text-sm font-semibold">
            {isBetting ? '🟢 Đang đặt cược' : isRolling ? '🎲 Đang quay...' : '✅ Kết thúc'}
          </span>
        </div>
        {currentRound?.roundId && (
          <span className="text-xs text-gray-500 font-mono">
            #{currentRound.roundId.slice(-8).toUpperCase()}
          </span>
        )}
      </div>

      {/* Main dice display */}
      <div className="flex justify-center items-center gap-4 my-6">
        <Dice
          symbol={isCompleted ? currentRound?.result?.dice1 : undefined}
          rolling={isRolling}
        />
        <Dice
          symbol={isCompleted ? currentRound?.result?.dice2 : undefined}
          rolling={isRolling}
        />
        <Dice
          symbol={isCompleted ? currentRound?.result?.dice3 : undefined}
          rolling={isRolling}
        />
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {isCompleted && winAmount !== null && winAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-3 rounded-xl bg-casino-gold/10 border border-casino-gold/30 mb-4"
          >
            <p className="text-casino-gold font-black text-2xl">
              🎉 +{winAmount.toLocaleString('vi-VN')} xu!
            </p>
          </motion.div>
        )}
        {isCompleted && winAmount === 0 && myBets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2 text-gray-500 text-sm mb-4"
          >
            Ván này chưa may mắn 😔
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer or result info */}
      {isBetting && currentRound?.bettingEndsAt && (
        <div className="max-w-xs mx-auto">
          <p className="text-center text-xs text-gray-500 mb-2 uppercase tracking-wider">
            Thời gian đặt cược
          </p>
          <CountdownTimer endsAt={currentRound.bettingEndsAt} />
        </div>
      )}

      {isRolling && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="text-center text-casino-gold font-bold text-lg"
        >
          🎲 Đang lắc bầu cua...
        </motion.p>
      )}

      {isCompleted && currentRound?.result && (
        <div className="flex justify-center gap-3 mt-2">
          {[currentRound.result.dice1, currentRound.result.dice2, currentRound.result.dice3].map((sym, i) => {
            const isMyBet = myBetSymbols.includes(sym);
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border
                  ${isMyBet
                    ? 'bg-casino-gold/20 border-casino-gold text-casino-gold'
                    : 'bg-casino-surface border-casino-border text-gray-400'
                  }`}
              >
                {SYMBOL_EMOJI[sym]} {SYMBOL_LABEL[sym]}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
