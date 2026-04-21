'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Status = 'all' | 'pending' | 'done' | 'rejected';

export default function AdminTransactions() {
  const [txs, setTxs] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const q = status !== 'all' ? `?status=${status}&page=${page}` : `?page=${page}`;
    api.get(`/admin/transactions${q}`)
      .then(d => { setTxs(d.transactions); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, page]);

  const statusBadge = (s: string) => ({
    pending:  'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    done:     'bg-green-500/20 text-green-400 border border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }[s] || 'bg-gray-500/20 text-gray-400');

  return (
    <div>
      <h1 className="text-2xl font-display font-black text-yellow-400 mb-6">💳 Giao Dịch</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'done', 'rejected'] as Status[]).map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
              status === s ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'border-white/10 text-gray-400 hover:border-yellow-500/20'
            }`}
          >
            {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Đang chờ' : s === 'done' ? 'Hoàn tất' : 'Từ chối'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="p-4 text-gray-500 font-semibold">Người dùng</th>
                <th className="p-4 text-gray-500 font-semibold">Số tiền</th>
                <th className="p-4 text-gray-500 font-semibold">Nội dung</th>
                <th className="p-4 text-gray-500 font-semibold">Trạng thái</th>
                <th className="p-4 text-gray-500 font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : txs.map(tx => (
                <tr key={tx._id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {tx.userId?.avatar && (
                        <img src={tx.userId.avatar} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <span className="text-yellow-300">{tx.userId?.username || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">{tx.amount.toLocaleString('vi-VN')}đ</td>
                  <td className="p-4 font-mono text-xs text-gray-400">{tx.content}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(tx.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-white/5">
          <span className="text-xs text-gray-500">Tổng: {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 disabled:opacity-40 hover:border-yellow-500/30 transition"
            >← Trước</button>
            <span className="px-3 py-1.5 text-xs text-yellow-400 font-bold">Trang {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 disabled:opacity-40 hover:border-yellow-500/30 transition"
            >Sau →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
