'use client';
import { adminAPI } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function FraudPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['fraud-logs', status],
    queryFn: () => adminAPI.fraudLogs({ status, limit: 50 }),
    refetchInterval: 15_000
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, status: s, note }: any) => adminAPI.reviewFraud(id, s, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fraud-logs'] }); toast.success('Đã cập nhật!'); }
  });

  const STATUS_TABS = [
    { value: 'pending',  label: '⏳ Chờ xử lý', color: 'text-yellow-400' },
    { value: 'confirmed', label: '🚨 Xác nhận gian lận', color: 'text-red-400' },
    { value: 'cleared',  label: '✅ Đã xóa',    color: 'text-green-400' }
  ];

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-red-400' : s >= 40 ? 'text-yellow-400' : 'text-green-400';

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-black text-white">🛡️ Fraud Monitor</h1>
          <p className="text-sm text-gray-500">Phát hiện và xử lý gian lận tự động</p>
        </div>

        {/* Score legend */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Spam Deposit', score: '+30', desc: '>5 lần nạp/phút' },
            { label: 'Amount Mismatch', score: '+50', desc: 'Sai số tiền chuyển' },
            { label: 'Duplicate Webhook', score: '+40', desc: 'Webhook trùng lặp' }
          ].map(item => (
            <div key={item.label} className="admin-card border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs font-bold text-yellow-400">{item.label}</p>
              <p className="text-2xl font-black text-white">{item.score}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Threshold note */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          ⚠️ Score &gt; 70 = auto-flag user, cần admin review. Score tích lũy trong 24h.
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${status === tab.value
                  ? 'bg-gray-800 ' + tab.color
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Log table */}
        <div className="admin-card p-0 overflow-hidden">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Score</th>
                <th>Lý do</th>
                <th>Chi tiết</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Đang tải...</td></tr>
              ) : (data?.logs || []).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : (data?.logs || []).map((log: any) => (
                <tr key={log._id}>
                  <td>
                    <div>
                      <p className="font-medium text-sm">{log.userId?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{log.userId?._id?.slice(-8)}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xl font-black ${scoreColor(log.score)}`}>
                      {log.score}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(log.reasons || []).map((r: string, i: number) => (
                        <span key={i} className="badge-yellow text-xs">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-xs text-gray-400 truncate font-mono">
                      {JSON.stringify(log.details)}
                    </p>
                  </td>
                  <td className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    {log.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => reviewMut.mutate({ id: log._id, status: 'confirmed' })}
                          className="admin-btn-danger text-xs px-2 py-1"
                        >
                          🚨 Flag
                        </button>
                        <button
                          onClick={() => reviewMut.mutate({ id: log._id, status: 'cleared' })}
                          className="admin-btn-success text-xs px-2 py-1"
                        >
                          ✅ Clear
                        </button>
                      </div>
                    )}
                    {log.status !== 'pending' && (
                      <span className={log.status === 'cleared' ? 'badge-green' : 'badge-red'}>
                        {log.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
