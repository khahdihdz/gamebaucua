'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { adminAPI } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .catch(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`;
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Đang xác thực...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </QueryClientProvider>
  );
}
