'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Analytics {
  totalUsers: number;
  suspiciousUsers: number;
  totalRevenue: number;
  pendingTransactions: number;
  doneTransactions: number;
  todayProfit: number;
  todayRounds: number;
}

function StatCard({ label, value, color = 'text-yellow-400', icon }: {
  label: string; value: string | number; color?: string; icon: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 gold-glow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-black font-display ${color}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-white/5 rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-display font-black text-yellow-400 mb-6">📊 Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Tổng người dùng" value={stats.totalUsers} />
          <StatCard icon="⚠️" label="Tài khoản nghi vấn" value={stats.suspiciousUsers} color="text-red-400" />
          <StatCard icon="💰" label="Tổng doanh thu nạp" value={`${(stats.totalRevenue/1000).toFixed(0)}K`} />
          <StatCard icon="📈" label="Lợi nhuận hôm nay" value={`${(stats.todayProfit/1000).toFixed(0)}K`} color="text-green-400" />
          <StatCard icon="⏳" label="GD đang chờ" value={stats.pendingTransactions} color="text-orange-400" />
          <StatCard icon="✅" label="GD hoàn tất" value={stats.doneTransactions} color="text-green-400" />
          <StatCard icon="🎲" label="Ván hôm nay" value={stats.todayRounds} />
        </div>
      )}
    </div>
  );
}
