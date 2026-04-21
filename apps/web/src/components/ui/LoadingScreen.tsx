'use client';
import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-casino-bg flex flex-col items-center justify-center gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="text-6xl"
      >
        🎲
      </motion.div>
      <div className="text-center">
        <p className="text-casino-gold font-black text-xl">Đang tải...</p>
        <p className="text-gray-600 text-sm mt-1">Bầu Cua Casino</p>
      </div>
      {/* Loading bar */}
      <div className="w-48 h-1 bg-casino-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-casino-gold rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
