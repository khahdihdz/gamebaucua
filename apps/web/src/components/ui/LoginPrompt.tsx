'use client';
import { motion } from 'framer-motion';

const SYMBOLS = ['🦐','🦀','🐟','🦞','🐓','🦌'];

export function LoginPrompt() {
  const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/github`;

  return (
    <div className="min-h-screen bg-casino-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background symbols */}
      {SYMBOLS.map((sym, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl opacity-5 pointer-events-none select-none"
          style={{
            left: `${(i * 17 + 5) % 90}%`,
            top: `${(i * 13 + 10) % 80}%`
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5
          }}
        >
          {sym}
        </motion.div>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-7xl mb-4 inline-block"
          >
            🎲
          </motion.div>
          <h1 className="text-4xl font-black text-gold mb-2">BẦU CUA</h1>
          <p className="text-gray-400 text-sm">Casino Online · Realtime Multiplayer</p>
        </div>

        {/* Features */}
        <div className="card-casino p-5 mb-6 space-y-3">
          {[
            { icon: '🎲', text: 'Chơi Bầu Cua realtime với hàng trăm người' },
            { icon: '💰', text: 'Nạp tiền tự động qua chuyển khoản ngân hàng' },
            { icon: '🏆', text: 'Bảng xếp hạng & giải thưởng hàng ngày' },
            { icon: '🔐', text: 'Đăng nhập an toàn qua GitHub OAuth' }
          ].map(({ icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-xl w-8 text-center">{icon}</span>
              <span className="text-sm text-gray-300">{text}</span>
            </motion.div>
          ))}
        </div>

        {/* Welcome bonus */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-casino-gold/10 border border-casino-gold/30 rounded-2xl p-4 mb-6 text-center"
        >
          <p className="text-casino-gold font-black text-lg">🎁 Thưởng Đăng Ký</p>
          <p className="text-3xl font-black text-white mt-1">10,000 xu</p>
          <p className="text-xs text-gray-400 mt-1">Tặng ngay khi đăng nhập lần đầu</p>
        </motion.div>

        {/* Login button */}
        <motion.a
          href={loginUrl}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn-casino w-full flex items-center justify-center gap-3 py-4 text-base no-underline"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Đăng Nhập Bằng GitHub
        </motion.a>

        <p className="text-center text-xs text-gray-600 mt-4">
          Bằng cách đăng nhập, bạn đồng ý với điều khoản sử dụng dịch vụ
        </p>
      </motion.div>
    </div>
  );
}
