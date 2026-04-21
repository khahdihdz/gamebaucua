'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { authAPI } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 }
  }
});

function AuthInit({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useStore();

  useEffect(() => {
    authAPI.me()
      .then(user => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>{children}</AuthInit>
    </QueryClientProvider>
  );
}
