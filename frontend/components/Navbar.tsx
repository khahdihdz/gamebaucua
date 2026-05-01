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
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl group-hover:animate-dice">🎲</span>
          <span
            className="shimmer-text font-bold text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bầu Cua
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/', label: 'Chơi Ngay' },
            { href: '/deposit', label: 'Nạp Tiền' },
            ...(user?.role === 'admin' ? [{ href: '/admin', label: '⚙ Admin' }] : []),
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/8 transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-32 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Balance pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-yellow-400 text-xs">💰</span>
                <span className="text-yellow-300 text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>
                  {user.balance.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 transition"
                >
                  <Image
                    src={user.avatar || '/default-avatar.png'}
                    alt={user.username}
                    width={30} height={30}
                    className="rounded-full border border-yellow-500/40"
                  />
                  <span className="hidden sm:block text-sm font-semibold text-yellow-200 max-w-[120px] truncate">
                    {user.username}
                  </span>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-48 glass rounded-2xl border border-yellow-500/15 shadow-2xl overflow-hidden animate-slide-up">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-gray-500">Số dư</p>
                        <p className="text-base font-bold text-yellow-400">{user.balance.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <Link href="/deposit"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium hover:bg-yellow-500/8 transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>💳</span> Nạp tiền
                      </Link>
                      <Link href="/deposit#giftcode"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium hover:bg-yellow-500/8 transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>🎁</span> Gift Code
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin"
                          className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-orange-400 hover:bg-orange-500/8 transition"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span>⚙️</span> Quản trị
                        </Link>
                      )}
                      <div className="gold-divider mx-3" />
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/8 transition"
                      >
                        <span>🚪</span> Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <a
              href={`${API_URL}/auth/github`}
              className="btn-gold flex items-center gap-2 px-4 py-2 text-sm"
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
