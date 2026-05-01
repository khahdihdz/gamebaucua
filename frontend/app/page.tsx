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
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl animate-dice">🎲</div>
          <p className="text-yellow-500 font-semibold animate-pulse" style={{ fontFamily: 'var(--font-body)' }}>
            Đang tải...
          </p>
        </div>
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

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl sm:text-7xl font-black shimmer-text mb-2 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bầu Cua Tôm Cá
          </h1>
          <p className="text-gray-500 text-xs tracking-[0.25em] uppercase font-semibold">
            Casino Trực Tuyến
          </p>
        </div>

        {/* New round banner */}
        <AnimatePresence>
          {newRound && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className="text-center mb-4 py-2.5 px-5 glass border border-yellow-500/30 rounded-2xl text-yellow-400 text-sm font-bold gold-glow inline-block mx-auto"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span className="animate-dice inline-block">🎲</span>
              Ván mới bắt đầu!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection error */}
        {error && (
          <div className="text-center mb-4 py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            ⚠️ Mất kết nối — đang thử lại...
          </div>
        )}

        {/* Main layout */}
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left column: timer + dice + balance */}
          <div className="lg:col-span-2 space-y-4">
            {state ? (
              <>
                <PhaseTimer phase={state.phase} timeLeft={state.timeLeft} roundId={state.roundId} />
                <DiceResult result={state.result} phase={state.phase} />
              </>
            ) : (
              <div className="glass rounded-2xl p-10 text-center text-gray-600 animate-pulse">
                Đang kết nối...
              </div>
            )}

            {/* Balance card */}
            {user && (
              <div className="glass rounded-2xl p-4 gold-glow">
                <p className="text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase mb-1">
                  Số Dư Của Bạn
                </p>
                <p
                  className="text-3xl font-black text-yellow-400"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {displayBalance.toLocaleString('vi-VN')}
                  <span className="text-lg ml-1 text-yellow-600">đ</span>
                </p>
                <a
                  href="/deposit"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-600 hover:text-yellow-400 transition"
                >
                  <span>💳</span> Nạp thêm
                </a>
              </div>
            )}
          </div>

          {/* Right column: betting board or login prompt */}
          <div className="lg:col-span-3">
            {!user ? (
              <div className="glass rounded-2xl p-10 text-center gold-glow h-full flex flex-col items-center justify-center">
                <div className="text-7xl mb-5 animate-float">🎲</div>
                <h2
                  className="text-3xl font-black text-yellow-400 mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Đăng nhập để chơi
                </h2>
                <p className="text-gray-500 text-sm mb-7 max-w-xs">
                  Tham gia ngay và nhận <span className="text-yellow-400 font-bold">10.000đ</span> chào mừng
                </p>
                <a
                  href={`${API_URL}/auth/github`}
                  className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Đăng nhập GitHub
                </a>
              </div>
            ) : (
              <div className="glass rounded-2xl p-5 gold-glow h-full">
                <h2
                  className="text-base font-bold text-yellow-400 mb-4 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  🎯 Đặt Cược
                </h2>
                {state ? (
                  <BettingBoard
                    canBet={state.phase === 'betting'}
                    roundId={state.roundId}
                    myBet={state.myBet ? Object.fromEntries(Object.entries(state.myBet.betData || {})) : null}
                    onBetPlaced={handleBetPlaced}
                  />
                ) : (
                  <div className="text-center text-gray-600 py-12 animate-pulse">
                    Đang tải game...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* How to play */}
        <div className="mt-6 glass rounded-2xl p-5 gold-border-top">
          <h3
            className="text-xs font-bold text-yellow-500 mb-4 tracking-[0.15em] uppercase flex items-center gap-2"
          >
            📖 Cách Chơi
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', color: 'text-emerald-400', title: 'Đặt Cược (10 giây)', desc: 'Chọn con vật và số tiền muốn cược trong thời gian cho phép.' },
              { step: '02', color: 'text-yellow-400', title: 'Lắc Xúc Xắc (5 giây)', desc: 'Hệ thống tự động lắc 3 xúc xắc Bầu Cua ngẫu nhiên.' },
              { step: '03', color: 'text-blue-400', title: 'Nhận Thưởng', desc: 'Mỗi xúc xắc khớp nhân 1x. Trúng 3 xúc xắc = thắng 3x tiền cược.' },
            ].map(({ step, color, title, desc }) => (
              <div key={step} className="flex gap-3">
                <span className={`text-2xl font-black ${color} opacity-40 leading-none shrink-0`}
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {step}
                </span>
                <div>
                  <p className={`text-sm font-bold ${color} mb-1`}>{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-5 tracking-wide">
          ⚠️ Chỉ dành cho người từ 18 tuổi · Mục đích giải trí · Không phải cờ bạc thực sự
        </p>
      </div>
    </div>
  );
}
