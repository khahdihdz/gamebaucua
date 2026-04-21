'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '@/lib/useGameState';
import { useAuth } from '@/lib/useAuth';
import PhaseTimer from '@/components/PhaseTimer';
import DiceResult from '@/components/DiceResult';
import BettingBoard from '@/components/BettingBoard';
import ResultPopup from '@/components/ResultPopup';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

export default function GamePage() {
  const { state, error, newRound } = useGameState(2000);
  const { user, loading } = useAuth();
  const { info } = useToast();
  const [localBalance, setLocalBalance] = useState<number | null>(null);

  const handleBetPlaced = useCallback((newBalance: number) => {
    setLocalBalance(newBalance);
    info('Đặt cược thành công!', `Số dư mới: ${newBalance.toLocaleString('vi-VN')}đ`);
  }, [info]);

  const displayBalance = localBalance ?? user?.balance ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-500 text-2xl animate-pulse font-display">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      {state && (
        <ResultPopup
          result={state.result}
          myBet={state.myBet ?? null}
          phase={state.phase}
          roundId={state.roundId}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-6xl font-display font-black shimmer-text mb-2">
            Bầu Cua Tôm Cá
          </h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">Casino Trực Tuyến</p>
        </div>

        <AnimatePresence>
          {newRound && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-4 py-2 px-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-bold"
            >
              🎲 Ván mới bắt đầu!
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="text-center mb-4 text-red-400 text-sm">
            ⚠️ Mất kết nối — đang thử lại...
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {state ? (
              <>
                <PhaseTimer phase={state.phase} timeLeft={state.timeLeft} roundId={state.roundId} />
                <DiceResult result={state.result} phase={state.phase} />
              </>
            ) : (
              <div className="glass rounded-2xl p-8 text-center text-gray-500 animate-pulse">Đang kết nối...</div>
            )}

            {user && (
              <div className="glass rounded-2xl p-4 gold-glow">
                <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase mb-1">Số dư</p>
                <p className="text-2xl font-black text-yellow-400 font-display">
                  {displayBalance.toLocaleString('vi-VN')}đ
                </p>
                <a href="/deposit" className="mt-2 inline-block text-xs text-yellow-600 hover:text-yellow-400 transition">
                  + Nạp tiền
                </a>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!user ? (
              <div className="glass rounded-2xl p-12 text-center gold-glow">
                <div className="text-6xl mb-4 animate-float">🎲</div>
                <h2 className="text-2xl font-display font-bold text-yellow-400 mb-2">Đăng nhập để chơi</h2>
                <p className="text-gray-500 text-sm mb-6">Tham gia ngay và nhận 10,000đ chào mừng</p>
                <a
                  href={`${API_URL}/auth/github`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Đăng nhập GitHub
                </a>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 gold-glow">
                <h2 className="text-lg font-bold text-yellow-400 mb-4 font-display">🎯 Đặt Cược</h2>
                {state ? (
                  <BettingBoard
                    canBet={state.phase === 'betting'}
                    roundId={state.roundId}
                    myBet={state.myBet ? Object.fromEntries(Object.entries(state.myBet.betData || {})) : null}
                    onBetPlaced={handleBetPlaced}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">Đang tải game...</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 glass rounded-2xl p-6">
          <h3 className="text-sm font-bold text-yellow-400 mb-3 tracking-wider uppercase">📖 Cách chơi</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <span className="text-green-400 font-bold">1. Đặt cược (10s)</span>
              <p className="mt-1">Chọn con vật và số tiền cược trong thời gian cho phép.</p>
            </div>
            <div>
              <span className="text-yellow-400 font-bold">2. Lắc xúc xắc (5s)</span>
              <p className="mt-1">Hệ thống lắc 3 xúc xắc ngẫu nhiên.</p>
            </div>
            <div>
              <span className="text-blue-400 font-bold">3. Nhận thưởng</span>
              <p className="mt-1">Mỗi xúc xắc khớp nhân 1x tiền cược. 3 khớp = nhân 3x.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          ⚠️ Chỉ dành cho người từ 18 tuổi · Mục đích giải trí · Không phải cờ bạc thực sự
        </p>
      </div>
    </div>
  );
}
