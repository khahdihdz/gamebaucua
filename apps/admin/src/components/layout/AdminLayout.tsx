'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { href: '/analytics',    icon: '📈', label: 'Analytics' },
  { href: '/users',        icon: '👥', label: 'Users' },
  { href: '/transactions', icon: '💳', label: 'Transactions' },
  { href: '/fraud',        icon: '🛡️', label: 'Fraud Monitor' },
  { href: '/game-control', icon: '🎮', label: 'Game Control' }
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            <div>
              <p className="font-black text-white text-sm">Bầu Cua</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Về trang game
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
