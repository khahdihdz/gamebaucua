'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { SYMBOL_CONFIG, type Symbol } from '@/lib/symbols';

interface Props {
  result: { dice1: string; dice2: string; dice3: string } | null;
  phase: string;
}

function Dice({ symbol, delay }: { symbol: string; delay: number }) {
  const cfg = SYMBOL_CONFIG[symbol as Symbol];
  if (!cfg) return null;

  return (
    <motion.div
      initial={{ rotateY: 0, scale: 0.5, opacity: 0 }}
      animate={{ rotateY: 360, scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay, type: 'spring', bounce: 0.4 }}
      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cfg.color} flex flex-col items-center justify-center shadow-2xl border border-white/10`}
    >
      <span className="text-3xl">{cfg.emoji}</span>
      <span className="text-xs font-bold text-white/90 mt-0.5">{cfg.label}</span>
    </motion.div>
  );
}

export default function DiceResult({ result, phase }: Props) {
  const rolling = phase === 'rolling';

  return (
    <div className="glass rounded-2xl p-6 gold-glow">
      <h3 className="text-center text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">
        KẾT QUẢ XÚC XẮC
      </h3>

      <div className="flex items-center justify-center gap-4">
        {rolling ? (
          // Spinning dice during rolling phase
          [0, 1, 2].map(i => (
            <div
              key={i}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-600 to-yellow-900 flex items-center justify-center shadow-2xl border border-yellow-500/30 animate-dice"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="text-3xl">🎲</span>
            </div>
          ))
        ) : result ? (
          <AnimatePresence>
            <Dice key="d1" symbol={result.dice1} delay={0} />
            <Dice key="d2" symbol={result.dice2} delay={0.15} />
            <Dice key="d3" symbol={result.dice3} delay={0.3} />
          </AnimatePresence>
        ) : (
          [0, 1, 2].map(i => (
            <div
              key={i}
              className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <span className="text-2xl opacity-20">?</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
