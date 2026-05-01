import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/useAuth';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import DisclaimerModal from '@/components/DisclaimerModal';

export const metadata: Metadata = {
  title: 'Bầu Cua Casino 🎲',
  description: 'Casino Bầu Cua Tôm Cá trực tuyến — Đặt cược, thắng lớn!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Ambient background orbs */}
        <div className="bg-orb bg-orb-1" aria-hidden="true" />
        <div className="bg-orb bg-orb-2" aria-hidden="true" />

        <AuthProvider>
          <ToastProvider>
            <DisclaimerModal />
            <Navbar />
            <main className="relative z-10 min-h-screen">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
