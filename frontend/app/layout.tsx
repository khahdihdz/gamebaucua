import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/useAuth';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import DisclaimerModal from '@/components/DisclaimerModal';

export const metadata: Metadata = {
  title: 'Bầu Cua Casino 🎲',
  description: 'Casino Bầu Cua Tôm Cá trực tuyến',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="noise">
        <AuthProvider>
          <ToastProvider>
            <DisclaimerModal />
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
