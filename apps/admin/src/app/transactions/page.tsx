'use client';
import { adminAPI } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useState } from 'react';
import toast from 'react-hot-toast';

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN');

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-yellow',
  completed: 'badge-green',
  failed:    'badge-red',
  rejected:  'badge-red'
};

const TYPE_BADGE: Record<string, string> = {
  deposit:  'badge-blue',
  bet:      'badge-gray',
  win:      'badge-green',
  bonus:    'badge-blue',
  withdraw: 'badge-yellow'
};

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType,   setFilterType]   = useState('deposit');
  const [page, setPage] = useState(1);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: 'confirm' | 'reject' } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions', filterStatus, filterType, page],
    queryFn: () => adminAPI.transactions({
      status: filterStatus || undefined,
      type:   filterType   || undefined,
      page,
      limit: 30
    }),
    refetchInterval: 10_000
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, action, note }: any) => adminAPI.reviewTx(id, action, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      toast.success(reviewTarget?.action === 'confirm' ? '✅ Đã xác nhận!' : '❌ Đã từ chối!');
      setReviewTarget(null);
      setReviewNote('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi xử lý')
  });

  const pendingCount = data?.pagination?.total || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white">💳 Giao Dịch</h1>
            <p className="text-sm text-gray-500">{pendingCount} giao dịch</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type filter */}
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="admin-input w-36"
            >
              <option value="">Tất cả loại</option>
              <option value="deposit">Nạp tiền</option>
              <option value="bet">Cược</option>
              <option value="win">Thắng</option>
              <option value="bonus">Bonus</option>
            </select>
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="admin-input w-36"
            >
              <option value="">Tất cả TT</option>
              <option value="pending">Chờ duyệt</option>
              <option value="completed">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>
            <button onClick={() => refetch()} className="admin-btn bg-gray-800 text-gray-300 px-3 py-2 text-sm">
              🔄
            </button>
          </div>
        </div>

        {/* Pending deposits alert */}
        {filterType === 'deposit' && filterStatus === 'pending' && pendingCount > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <span className="text-yellow-400 text-sm font-medium">
              {pendingCount} giao dịch nạp tiền đang chờ xử lý
            </span>
          </div>
        )}

        {/* Table */}
        <div className="admin-card p-0 overflow-x-auto">
          <table className="admin-table w-full min-w-[800px]">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>User</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Số dư sau</th>
                <th>Nội dung / Ref</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Đang tải...</td></tr>
              ) : (data?.transactions || []).length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Không có giao dịch</td></tr>
              ) : (data?.transactions || []).map((tx: any) => (
                <tr key={tx._id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <p className="text-sm font-medium">
                      {tx.userId?.username || tx.userId?._id?.slice(-8) || 'Unknown'}
                    </p>
                  </td>
                  <td>
                    <span className={TYPE_BADGE[tx.type] || 'badge-gray'}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`font-bold whitespace-nowrap ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                  </td>
                  <td className="text-gray-300 whitespace-nowrap">
                    {fmt(tx.balanceAfter)}
                  </td>
                  <td className="max-w-[160px]">
                    {tx.depositContent && (
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {tx.depositContent}
                      </span>
                    )}
                    {tx.sepayTxId && (
                      <p className="text-xs text-gray-600 mt-0.5">SePay: {tx.sepayTxId}</p>
                    )}
                    {tx.roundId && (
                      <span className="font-mono text-xs text-gray-500">
                        #{tx.roundId?.slice(-6).toUpperCase()}
                      </span>
                    )}
                    {tx.adminNote && (
                      <p className="text-xs text-gray-600 truncate" title={tx.adminNote}>
                        {tx.adminNote}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className={STATUS_BADGE[tx.status] || 'badge-gray'}>
                      {tx.status}
                    </span>
                  </td>
                  <td>
                    {tx.status === 'pending' && tx.type === 'deposit' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setReviewTarget({ id: tx._id, action: 'confirm' })}
                          className="admin-btn-success text-xs px-2 py-1"
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => setReviewTarget({ id: tx._id, action: 'reject' })}
                          className="admin-btn-danger text-xs px-2 py-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Hiển thị {((page - 1) * 30) + 1}–{Math.min(page * 30, data.pagination.total)} / {data.pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn bg-gray-800 text-gray-300 disabled:opacity-40 px-3 py-1.5 text-xs"
              >
                ← Trước
              </button>
              <span className="px-3 py-1.5 text-xs bg-gray-800 rounded-lg">
                {page} / {Math.ceil(data.pagination.total / 30)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 30 >= data.pagination.total}
                className="admin-btn bg-gray-800 text-gray-300 disabled:opacity-40 px-3 py-1.5 text-xs"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className={`font-bold text-lg ${reviewTarget.action === 'confirm' ? 'text-green-400' : 'text-red-400'}`}>
              {reviewTarget.action === 'confirm' ? '✅ Xác nhận giao dịch' : '❌ Từ chối giao dịch'}
            </h3>
            <textarea
              placeholder="Ghi chú (không bắt buộc)..."
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={3}
              className="admin-input resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => reviewMut.mutate({ id: reviewTarget.id, action: reviewTarget.action, note: reviewNote })}
                disabled={reviewMut.isPending}
                className={`flex-1 admin-btn ${reviewTarget.action === 'confirm' ? 'admin-btn-success' : 'admin-btn-danger'}`}
              >
                {reviewMut.isPending ? 'Đang...' : 'Xác nhận'}
              </button>
              <button
                onClick={() => { setReviewTarget(null); setReviewNote(''); }}
                className="flex-1 admin-btn bg-gray-800 text-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
