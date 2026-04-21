'use client';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/transactions', label: '💳 Giao dịch' },
  { href: '/admin/users', label: '👥 Người dùng' },
  { href: '/admin/fraud', label: '🔒 Fraud' },
  { href: '/admin/rounds', label: '🎲 Ván cược' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse font-display text-xl">Đang tải...</div>
    </div>
  );

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-400 text-xl font-bold">🚫 Không có quyền truy cập</p>
        <Link href="/" className="mt-4 inline-block text-yellow-400 hover:underline">← Về trang chủ</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Admin Sidebar */}
      <div className="flex">
        <aside className="w-56 min-h-screen glass border-r border-yellow-500/10 p-4 hidden md:block">
          <p className="text-xs font-bold text-red-400 tracking-widest uppercase mb-4">ADMIN PANEL</p>
          <nav className="space-y-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  pathname === n.href
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/5'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full overflow-x-auto border-b border-yellow-500/10">
          <div className="flex px-4 py-2 gap-2 min-w-max">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  pathname === n.href ? 'bg-yellow-500/15 text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
