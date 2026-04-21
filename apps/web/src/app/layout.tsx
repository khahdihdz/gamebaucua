import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Bầu Cua Casino | Chơi Bầu Cua Online',
  description: 'Trò chơi Bầu Cua Tôm Cá online với đồ họa đẹp, realtime multiplayer',
  manifest: '/manifest.json',
  themeColor: '#0a0a0f',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-casino-bg antialiased">
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
