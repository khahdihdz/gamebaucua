'use client';
import { motion } from 'framer-motion';

interface Props {
  phase: 'betting' | 'rolling' | 'result';
  timeLeft: number;
  roundId: string;
}

const PHASE_CONFIG = {
  betting:  { label: '🎯 Đặt cược', color: 'text-green-400', bg: 'bg-green-500/20', max: 10 },
  rolling:  { label: '🎲 Đang lắc', color: 'text-yellow-400', bg: 'bg-yellow-500/20', max: 5 },
  result:   { label: '🏆 Kết quả', color: 'text-blue-400', bg: 'bg-blue-500/20', max: 3 },
};

export default function PhaseTimer({ phase, timeLeft, roundId }: Props) {
  const cfg = PHASE_CONFIG[phase];
  const pct = (timeLeft / cfg.max) * 100;

  return (
    <div className="glass rounded-2xl p-4 gold-glow">
      {/* Round ID */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-bold ${cfg.color} px-3 py-1 rounded-full ${cfg.bg}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          #{roundId?.slice(-8)}
        </span>
      </div>

      {/* Timer number */}
      <motion.div
        key={timeLeft}
        initial={{ scale: 1.3, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-5xl font-display font-black text-center mb-3 ${cfg.color}`}
      >
        {timeLeft}s
      </motion.div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            phase === 'betting' ? 'bg-green-500' :
            phase === 'rolling' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
