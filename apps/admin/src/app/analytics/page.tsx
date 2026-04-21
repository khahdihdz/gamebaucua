'use client';
import { adminAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return (n || 0).toString();
};

const TOOLTIP_STYLE = {
  contentStyle: { background: '#111827', border: '1px solid #374151', borderRadius: 8 },
  labelStyle: { color: '#e5e7eb' }
};

function KPI({ label, value, sub, color }: any) {
  const colors: Record<string, string> = {
    green:  'text-green-400',
    yellow: 'text-yellow-400',
    blue:   'text-blue-400',
    red:    'text-red-400',
    white:  'text-white'
  };
  return (
    <div className="admin-card">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-1 ${colors[color] || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: adminAPI.analytics,
    refetchInterval: 60_000
  });

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Đang tải analytics...</div>
    </AdminLayout>
  );

  const d = data?.deposits || {};
  const g = data?.games || {};

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-white">📈 Analytics</h1>
          <p className="text-sm text-gray-500">Thống kê tổng hợp hệ thống</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Tổng Doanh Thu" value={`${fmt(d.total)} VNĐ`} color="green"
            sub={`Hôm nay: ${fmt(d.today)} VNĐ`} />
          <KPI label="Lợi Nhuận House" value={`${fmt(g.houseProfit)} xu`} color="yellow"
            sub={`Edge: ${g.houseEdge}%`} />
          <KPI label="Tổng Ván" value={fmt(g.totalRounds)} color="blue"
            sub={`Tổng cược: ${fmt(g.totalBetAmount)}`} />
          <KPI label="Users Nghi Ngờ" value={data?.suspiciousUsers?.length || 0} color="red"
            sub="Đang chờ review" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily deposits */}
          <div className="admin-card">
            <h2 className="text-sm font-bold text-gray-300 mb-4">💰 Doanh Thu Hàng Ngày</h2>
            {(data?.charts?.dailyDeposits || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.charts.dailyDeposits}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={fmt} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${fmt(v)} VNĐ`, 'Doanh thu']} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#ga)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          {/* User growth */}
          <div className="admin-card">
            <h2 className="text-sm font-bold text-gray-300 mb-4">👥 User Mới Đăng Ký</h2>
            {(data?.charts?.userGrowth || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [v, 'Users mới']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Finance summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="admin-card lg:col-span-1 space-y-3">
            <h2 className="text-sm font-bold text-gray-300">💼 Tóm Tắt Tài Chính</h2>
            {[
              { label: 'Tổng nạp (tất cả)', value: `${fmt(d.total)} VNĐ`, color: 'text-green-400' },
              { label: 'Tuần này',          value: `${fmt(d.thisWeek)} VNĐ`, color: 'text-blue-400' },
              { label: 'Hôm nay',           value: `${fmt(d.today)} VNĐ`,   color: 'text-yellow-400' },
              { label: 'Lượt nạp trung bình', value: `${fmt(d.avgAmount)} VNĐ`, color: 'text-gray-300' },
              { label: 'Tổng lượt nạp',     value: `${fmt(d.count)} lần`,   color: 'text-gray-300' },
              { label: 'Lợi nhuận house',   value: `${fmt(g.houseProfit)} xu`, color: 'text-yellow-400' }
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Top depositors */}
          <div className="admin-card lg:col-span-1">
            <h2 className="text-sm font-bold text-gray-300 mb-3">🏆 Top 10 Nạp Nhiều Nhất</h2>
            <div className="space-y-2">
              {(data?.topDepositors || []).map((u: any, i: number) => (
                <div key={u._id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-5 font-mono">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{u.username}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-green-400">{fmt(u.totalDeposited)}</p>
                    <p className="text-xs text-gray-600">Số dư: {fmt(u.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suspicious users */}
          <div className="admin-card lg:col-span-1">
            <h2 className="text-sm font-bold text-gray-300 mb-3">🚨 Users Nghi Ngờ</h2>
            {(data?.suspiciousUsers || []).length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">✅ Không có user đáng ngờ</p>
            ) : (
              <div className="space-y-2">
                {(data.suspiciousUsers || []).map((u: any) => (
                  <div key={u._id} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-xs text-gray-500">{u.flagCount} flags</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${u.maxScore >= 70 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {u.maxScore}
                      </p>
                      <p className="text-xs text-gray-600">score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
