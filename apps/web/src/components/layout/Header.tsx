'use client';
import { useStore } from '@/store';
import { authAPI } from '@/lib/api';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function Header() {
  const { user, setUser, setDepositModal, setLeaderboard } = useStore();

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="bg-casino-surface border-b border-casino-border sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            <span className="font-display font-black text-xl text-gold">
              Bầu Cua
            </span>
            <span className="hidden sm:block text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
              Casino
            </span>
          </div>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setLeaderboard(true)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-casino-gold transition-colors rounded-lg hover:bg-casino-card"
            >
              🏆 Bảng Xếp Hạng
            </button>
          </div>

          {/* Right: balance + user */}
          <div className="flex items-center gap-3">
            {/* Balance */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setDepositModal(true)}
              className="flex items-center gap-2 bg-casino-card border border-casino-border rounded-xl px-3 py-1.5 hover:border-casino-gold transition-colors"
            >
              <span className="text-casino-gold text-sm font-bold">
                💰 {(user?.balance || 0).toLocaleString('vi-VN')}
              </span>
              <span className="bg-casino-gold text-casino-bg text-xs font-black px-2 py-0.5 rounded-lg">
                +NẠP
              </span>
            </motion.button>

            {/* Avatar dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    width={32}
                    height={32}
                    className="rounded-full border border-casino-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-casino-purple flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium">
                  {user?.displayName || user?.username}
                </span>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-casino-card border border-casino-border rounded-xl shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-3 border-b border-casino-border">
                  <p className="text-sm font-semibold">{user?.displayName}</p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                </div>
                <div className="p-2">
                  {user?.role === 'admin' && (
                    <a href="/admin" className="block px-3 py-2 text-sm text-casino-gold hover:bg-casino-surface rounded-lg">
                      ⚙️ Admin Panel
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-casino-surface rounded-lg"
                  >
                    🚪 Đăng Xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
