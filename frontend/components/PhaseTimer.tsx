'use client';
import { motion } from 'framer-motion';

interface Props {
  phase: 'betting' | 'rolling' | 'result';
  timeLeft: number;
  roundId: string;
}

const PHASE_CONFIG = {
  betting: {
    label: 'Đặt Cược',
    icon: '🎯',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    max: 10,
  },
  rolling: {
    label: 'Đang Lắc',
    icon: '🎲',
    color: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
    max: 5,
  },
  result: {
    label: 'Kết Quả',
    icon: '🏆',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    max: 3,
  },
};

export default function PhaseTimer({ phase, timeLeft, roundId }: Props) {
  const cfg = PHASE_CONFIG[phase];
  const pct = Math.max(0, Math.min(100, (timeLeft / cfg.max) * 100));
  const urgent = timeLeft <= 3 && phase === 'betting';

  return (
    <div className={`glass rounded-2xl p-5 gold-glow border ${cfg.borderColor} transition-colors duration-500`}>
      <div className="flex items-center justify-between mb-4">
        {/* Phase badge */}
        <div className={`phase-badge ${cfg.bgColor} ${cfg.borderColor} border ${cfg.color}`}>
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>
        {/* Round ID */}
        <span className="text-[10px] text-gray-600 font-mono tracking-wider">
          #{roundId?.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Timer */}
      <motion.div
        key={timeLeft}
        initial={{ scale: 1.25, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`text-6xl font-bold text-center mb-4 ${cfg.color} ${urgent ? 'animate-pulse' : ''}`}
        style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
      >
        {timeLeft}
        <span className="text-2xl ml-1 opacity-60">s</span>
      </motion.div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${cfg.barColor}`}
          style={{ boxShadow: `0 0 8px currentColor` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
