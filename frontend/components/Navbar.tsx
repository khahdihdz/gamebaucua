'use client';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-yellow-500/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <span className="font-display text-xl shimmer-text font-bold">Bầu Cua</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold tracking-wide">
          <Link href="/" className="text-yellow-400/80 hover:text-yellow-400 transition">CHƠI NGAY</Link>
          <Link href="/deposit" className="text-yellow-400/80 hover:text-yellow-400 transition">NẠP TIỀN</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="text-red-400/80 hover:text-red-400 transition">ADMIN</Link>
          )}
        </div>

        {/* User area */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Balance */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-yellow-400 text-xs font-bold">💰</span>
                <span className="text-yellow-300 text-sm font-bold">
                  {user.balance.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <Image
                    src={user.avatar || '/default-avatar.png'}
                    alt={user.username}
                    width={32} height={32}
                    className="rounded-full border border-yellow-500/40"
                  />
                  <span className="hidden sm:block text-sm text-yellow-200 font-semibold">
                    {user.username}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-10 w-44 glass rounded-xl border border-yellow-500/20 shadow-xl overflow-hidden">
                    <Link href="/deposit"
                      className="block px-4 py-3 text-sm hover:bg-yellow-500/10 transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      💳 Nạp tiền
                    </Link>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <a
              href={`${API_URL}/auth/github`}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Đăng nhập
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
