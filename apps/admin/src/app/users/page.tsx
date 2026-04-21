'use client';
import { adminAPI } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

const fmt = (n: number) => n?.toLocaleString('vi-VN') || '0';

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [banReason, setBanReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => adminAPI.users({ search, page, limit: 20 }),
    keepPreviousData: true
  } as any);

  const banMut = useMutation({
    mutationFn: ({ id, banned, reason }: any) => adminAPI.banUser(id, banned, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Cập nhật thành công!'); }
  });

  const balMut = useMutation({
    mutationFn: ({ id, amount, reason }: any) => adminAPI.adjustBal(id, amount, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Đã điều chỉnh số dư!'); setSelectedUser(null); }
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Quản Lý Users</h1>
            <p className="text-sm text-gray-500">{data?.pagination?.total || 0} tài khoản</p>
          </div>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Tìm username..."
            className="admin-input w-56"
          />
        </div>

        <div className="admin-card p-0 overflow-hidden">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Số dư</th>
                <th>Đã nạp</th>
                <th>Ván</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Đang tải...</td></tr>
              ) : (data?.users || []).map((u: any) => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {u.avatar ? (
                        <Image src={u.avatar} alt="" width={28} height={28} className="rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{u.username}</p>
                        <p className="text-xs text-gray-500">{u.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-yellow-400 font-bold">{fmt(u.balance)}</td>
                  <td className="text-green-400">{fmt(u.totalDeposited)}</td>
                  <td>{u.gamesPlayed || 0}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge-blue' : 'badge-gray'}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.isBanned
                      ? <span className="badge-red">🚫 Banned</span>
                      : <span className="badge-green">✅ Active</span>
                    }
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="admin-btn bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/40 text-xs px-2 py-1"
                      >
                        💰 Xu
                      </button>
                      {u.isBanned ? (
                        <button
                          onClick={() => banMut.mutate({ id: u._id, banned: false })}
                          className="admin-btn-success text-xs px-2 py-1"
                        >
                          Mở
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt('Lý do ban:');
                            if (reason) banMut.mutate({ id: u._id, banned: true, reason });
                          }}
                          className="admin-btn-danger text-xs px-2 py-1"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Trang {page} / {Math.ceil(data.pagination.total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="admin-btn bg-gray-800 text-gray-300 disabled:opacity-40 px-3 py-1.5 text-xs">
                ← Trước
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.pagination.total}
                className="admin-btn bg-gray-800 text-gray-300 disabled:opacity-40 px-3 py-1.5 text-xs">
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Balance modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-white">Điều chỉnh số dư: {selectedUser.username}</h3>
            <p className="text-sm text-gray-400">Số dư hiện tại: <span className="text-yellow-400 font-bold">{fmt(selectedUser.balance)}</span> xu</p>
            <input
              type="number"
              placeholder="Số tiền (dương = cộng, âm = trừ)"
              value={balanceInput}
              onChange={e => setBalanceInput(e.target.value)}
              className="admin-input"
            />
            <input
              placeholder="Lý do điều chỉnh..."
              value={balanceReason}
              onChange={e => setBalanceReason(e.target.value)}
              className="admin-input"
            />
            <div className="flex gap-2">
              <button
                onClick={() => balMut.mutate({ id: selectedUser._id, amount: parseInt(balanceInput), reason: balanceReason })}
                disabled={!balanceInput || !balanceReason || balMut.isPending}
                className="admin-btn-primary flex-1"
              >
                {balMut.isPending ? 'Đang...' : 'Xác nhận'}
              </button>
              <button onClick={() => setSelectedUser(null)} className="admin-btn bg-gray-800 text-gray-300 flex-1">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
