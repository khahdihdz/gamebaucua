import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminProviders } from '@/components/layout/AdminProviders';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Panel · Bầu Cua Casino',
  robots: 'noindex,nofollow'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <AdminProviders>
          {children}
          <Toaster position="top-right" />
        </AdminProviders>
      </body>
    </html>
  );
}
