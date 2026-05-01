'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [editing, setEditing] = useState<{ id: string; balance: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/admin/users${flaggedOnly ? '?flagged=true' : ''}`)
      .then(d => setUsers(d.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [flaggedOnly]);

  const saveBalance = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/admin/users/${editing.id}/balance`, { balance: editing.balance });
      setMsg('✅ Cập nhật thành công');
      setEditing(null);
      fetchUsers();
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const unflag = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/unflag`, {});
      fetchUsers();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-black text-yellow-400">👥 Người Dùng</h1>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={e => setFlaggedOnly(e.target.checked)}
            className="accent-yellow-500"
          />
          <span className="text-sm text-gray-400">Chỉ nghi vấn</span>
        </label>
      </div>

      {msg && <p className="mb-4 text-sm text-center">{msg}</p>}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-gray-500 font-semibold">Người dùng</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Số dư</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Risk</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Trạng thái</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Hành động</th>
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
              ) : users.map(u => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {u.avatar && <img src={u.avatar} alt="" className="w-7 h-7 rounded-full border border-yellow-500/20" />}
                      <div>
                        <p className="font-bold text-yellow-300">{u.username}</p>
                        <p className="text-xs text-gray-600">{u.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {editing?.id === u._id ? (
                      <input
                        type="number"
                        value={editing!.balance}
                        onChange={e => setEditing({ ...editing!, balance: parseInt(e.target.value) })}
                        className="w-28 bg-white/10 border border-yellow-500/30 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold">{u.balance.toLocaleString('vi-VN')}đ</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${u.riskScore > 70 ? 'bg-red-500' : u.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${u.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{u.riskScore}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.isFlagged ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        🚨 Flagged
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        ✅ OK
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {editing?.id === u._id ? (
                        <>
                          <button onClick={saveBalance} disabled={saving}
                            className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 transition">
                            {saving ? '...' : '💾'}
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition">
                            ✕
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setEditing({ id: u._id, balance: u.balance })}
                          className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition">
                          ✏️ Sửa số dư
                        </button>
                      )}
                      {u.isFlagged && (
                        <button onClick={() => unflag(u._id)}
                          className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition">
                          🔓 Mở khóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
