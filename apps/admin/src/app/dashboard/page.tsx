'use client';
import { adminAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

function StatCard({ icon, label, value, sub, color = 'indigo' }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    green:  'border-green-500/30 bg-green-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    red:    'border-red-500/30 bg-red-500/5'
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`admin-card border ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </motion.div>
  );
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`;
  return n?.toString() || '0';
};

export default function DashboardPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminAPI.dashboard,
    refetchInterval: 30_000
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminAPI.analytics,
    refetchInterval: 60_000
  });

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Đang tải...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống realtime</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Tổng Users" value={fmt(dash?.users?.total || 0)}
            sub={`${dash?.users?.onlineNow || 0} đang online`} color="indigo" />
          <StatCard icon="💰" label="Doanh Thu Hôm Nay" value={`${fmt(dash?.finance?.revenueToday || 0)} VNĐ`}
            sub={`${dash?.finance?.depositsToday || 0} giao dịch`} color="green" />
          <StatCard icon="⏳" label="TX Chờ Duyệt" value={dash?.finance?.pendingTransactions || 0}
            color="yellow" />
          <StatCard icon="🚨" label="Fraud Pending" value={dash?.fraud?.pending || 0}
            color={dash?.fraud?.pending > 0 ? 'red' : 'indigo'} />
        </div>

        {/* Revenue chart */}
        {analytics?.charts?.dailyDeposits?.length > 0 && (
          <div className="admin-card">
            <h2 className="text-sm font-bold text-gray-300 mb-4">📈 Doanh Thu 7 Ngày Qua</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.charts.dailyDeposits}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={fmt} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                  formatter={(v: any) => [`${fmt(v)} VNĐ`, 'Doanh thu']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent rounds + Top depositors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent rounds */}
          <div className="admin-card">
            <h2 className="text-sm font-bold text-gray-300 mb-3">🎲 Ván Gần Nhất</h2>
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Kết quả</th>
                  <th>Lợi nhuận</th>
                </tr>
              </thead>
              <tbody>
                {(dash?.recentRounds || []).slice(0, 8).map((r: any) => (
                  <tr key={r.roundId}>
                    <td className="font-mono text-xs text-gray-400">
                      #{r.roundId?.slice(-6).toUpperCase()}
                    </td>
                    <td className="text-sm">
                      {r.result ? (
                        <span>
                          {['bau','cua','ca','tom','ga','nai'].reduce((acc, s) => ({
                            ...acc, [s]: {bau:'🦐',cua:'🦀',ca:'🐟',tom:'🦞',ga:'🐓',nai:'🦌'}[s]
                          }), {} as any)[r.result.dice1]}
                          {' '}{({bau:'🦐',cua:'🦀',ca:'🐟',tom:'🦞',ga:'🐓',nai:'🦌'} as any)[r.result.dice2]}
                          {' '}{({bau:'🦐',cua:'🦀',ca:'🐟',tom:'🦞',ga:'🐓',nai:'🦌'} as any)[r.result.dice3]}
                        </span>
                      ) : '-'}
                    </td>
                    <td className={r.houseProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {r.houseProfit >= 0 ? '+' : ''}{fmt(r.houseProfit || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top depositors */}
          <div className="admin-card">
            <h2 className="text-sm font-bold text-gray-300 mb-3">💰 Top Nạp Tiền</h2>
            <div className="space-y-2">
              {(analytics?.topDepositors || []).slice(0, 6).map((u: any, i: number) => (
                <div key={u._id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.username}</p>
                    <p className="text-xs text-gray-500">{u.gamesPlayed} ván</p>
                  </div>
                  <p className="text-sm font-bold text-green-400">
                    {fmt(u.totalDeposited)} VNĐ
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
