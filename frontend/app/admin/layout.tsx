'use client';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin',              label: 'Dashboard',    icon: '📊' },
  { href: '/admin/transactions', label: 'Giao dịch',   icon: '💳' },
  { href: '/admin/users',        label: 'Người dùng',  icon: '👥' },
  { href: '/admin/giftcodes',    label: 'Gift Codes',  icon: '🎁' },
  { href: '/admin/fraud',        label: 'Fraud',       icon: '🔒' },
  { href: '/admin/rounds',       label: 'Ván cược',    icon: '🎲' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse font-display text-xl">Đang tải...</div>
    </div>
  );

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-sm w-full">
        <p className="text-red-400 text-xl font-bold">🚫 Không có quyền truy cập</p>
        <Link href="/" className="mt-4 inline-block text-yellow-400 hover:underline text-sm">← Về trang chủ</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">

      {/* Mobile topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass border-b border-yellow-500/10 sticky top-0 z-40">
        <span className="text-xs font-black text-red-400 tracking-widest uppercase">ADMIN</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-yellow-400">
            {NAV.find(n => n.href === pathname)?.icon}{' '}
            {NAV.find(n => n.href === pathname)?.label ?? 'Panel'}
          </span>
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-yellow-400 transition"
            aria-label="Menu"
          >
            {drawerOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed top-0 right-0 h-full w-64 z-50 glass border-l border-yellow-500/15 transform transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <p className="text-xs font-black text-red-400 tracking-widest uppercase">ADMIN PANEL</p>
          <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
                pathname === n.href
                  ? 'bg-yellow-500/15 text-yellow-400'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/5'
              }`}
            >
              <span className="text-base">{n.icon}</span>
              <span>{n.label}</span>
              {pathname === n.href && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-3 right-3">
          <div className="flex items-center gap-3 px-3 py-2 glass rounded-xl border border-white/5">
            {user.avatar && <img src={user.avatar} alt="" className="w-7 h-7 rounded-full border border-yellow-500/30" />}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-yellow-300 truncate">{user.username}</p>
              <p className="text-xs text-red-400 font-semibold">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop layout */}
      <div className="flex">
        <aside className="hidden md:flex flex-col w-60 min-h-screen glass border-r border-yellow-500/10 p-4 sticky top-0 self-start">
          <p className="text-xs font-black text-red-400 tracking-widest uppercase mb-5 px-1">ADMIN PANEL</p>
          <nav className="space-y-0.5 flex-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
                  pathname === n.href
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/5'
                }`}
              >
                <span className="text-base group-hover:scale-110 transition-transform">{n.icon}</span>
                <span>{n.label}</span>
                {pathname === n.href && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex items-center gap-3 px-3 py-2.5 glass rounded-xl border border-white/5">
            {user.avatar && <img src={user.avatar} alt="" className="w-7 h-7 rounded-full border border-yellow-500/30 shrink-0" />}
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-yellow-300 truncate">{user.username}</p>
              <p className="text-xs text-red-400 font-semibold">Admin</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
