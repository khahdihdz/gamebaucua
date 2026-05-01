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
      initial={{ rotateY: -90, scale: 0.6, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', bounce: 0.35 }}
      className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${cfg.color} flex flex-col items-center justify-center shadow-2xl border border-white/15 gold-glow-strong`}
    >
      <span className="text-3xl sm:text-4xl leading-none">{cfg.emoji}</span>
      <span className="text-[10px] sm:text-xs font-bold text-white/90 mt-1 tracking-wide">{cfg.label}</span>
    </motion.div>
  );
}

const SpinningDice = ({ i }: { i: number }) => (
  <div
    className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-700/60 to-yellow-950 flex items-center justify-center shadow-xl border border-yellow-500/25 animate-dice"
    style={{ animationDelay: `${i * 0.12}s` }}
  >
    <span className="text-3xl">🎲</span>
  </div>
);

const EmptyDice = () => (
  <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
    <span className="text-2xl opacity-15">?</span>
  </div>
);

export default function DiceResult({ result, phase }: Props) {
  const rolling = phase === 'rolling';

  return (
    <div className="glass rounded-2xl p-5 gold-glow">
      <p className="text-center text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase mb-4">
        Kết Quả Xúc Xắc
      </p>

      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {rolling ? (
          [0, 1, 2].map(i => <SpinningDice key={i} i={i} />)
        ) : result ? (
          <AnimatePresence>
            <Dice key={`d1-${result.dice1}`} symbol={result.dice1} delay={0} />
            <Dice key={`d2-${result.dice2}`} symbol={result.dice2} delay={0.12} />
            <Dice key={`d3-${result.dice3}`} symbol={result.dice3} delay={0.24} />
          </AnimatePresence>
        ) : (
          [0, 1, 2].map(i => <EmptyDice key={i} />)
        )}
      </div>
    </div>
  );
}
