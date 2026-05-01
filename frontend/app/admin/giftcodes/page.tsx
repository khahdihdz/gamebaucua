'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface GiftCode {
  _id: string;
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  note: string;
  createdAt: string;
}

const EMPTY_FORM = { code: '', amount: 10000, maxUses: 1, expiresAt: '', note: '' };

function randomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function AdminGiftCodes() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  const toast = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchCodes = () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    if (activeFilter !== 'all') q.set('active', activeFilter);
    api.get(`/admin/giftcodes?${q}`)
      .then(d => { setCodes(d.codes); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCodes(); }, [page, activeFilter]);

  const handleCreate = async () => {
    if (!form.code || !form.amount) return toast('Vui lòng điền đủ thông tin', 'err');
    setSaving(true);
    try {
      await api.post('/admin/giftcodes', {
        ...form,
        amount: Number(form.amount),
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      });
      toast('✅ Tạo giftcode thành công');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchCodes();
    } catch (e: any) {
      toast(`❌ ${e.message}`, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const r = await api.patch(`/admin/giftcodes/${id}/toggle`, {});
      toast(r.isActive ? '✅ Đã bật' : '⏸️ Đã tắt');
      fetchCodes();
    } catch (e: any) {
      toast(`❌ ${e.message}`, 'err');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Xóa code "${code}"?`)) return;
    try {
      await api.delete(`/admin/giftcodes/${id}`);
      toast('🗑️ Đã xóa');
      fetchCodes();
    } catch (e: any) {
      toast(`❌ ${e.message}`, 'err');
    }
  };

  const progressPct = (gc: GiftCode) =>
    gc.maxUses === 0 ? 0 : Math.min(100, (gc.usedCount / gc.maxUses) * 100);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-display font-black text-yellow-400">🎁 Gift Codes</h1>
        <button
          onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}
          className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-sm font-bold hover:bg-yellow-500/30 transition"
        >
          {showForm ? '✕ Đóng' : '+ Tạo code mới'}
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-center border ${
          msg.type === 'ok'
            ? 'bg-green-500/15 text-green-400 border-green-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 border border-yellow-500/20">
          <p className="text-sm font-bold text-yellow-400 mb-4">🆕 Tạo Gift Code Mới</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Code</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="VD: SUMMER2025"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 font-mono"
                />
                <button
                  onClick={() => setForm({ ...form, code: randomCode() })}
                  title="Tạo ngẫu nhiên"
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-yellow-400 text-sm transition"
                >🎲</button>
              </div>
            </div>
            {/* Amount */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Số tiền (đ)</label>
              <input
                type="number"
                value={form.amount}
                min={1000}
                step={1000}
                onChange={e => setForm({ ...form, amount: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            {/* Max uses */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Lượt dùng (0 = vô hạn)</label>
              <input
                type="number"
                value={form.maxUses}
                min={0}
                onChange={e => setForm({ ...form, maxUses: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            {/* Expires */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Hết hạn (để trống = không hết hạn)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            {/* Note */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Ghi chú</label>
              <input
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="VD: Tặng sự kiện Tết 2025"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-sm font-bold hover:bg-yellow-500/30 disabled:opacity-50 transition"
            >
              {saving ? '⏳ Đang tạo...' : '✅ Tạo code'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-sm font-bold hover:text-white transition"
            >Hủy</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'true', 'false'] as const).map(f => (
          <button key={f} onClick={() => { setActiveFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
              activeFilter === f
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'border-white/10 text-gray-400 hover:border-yellow-500/20'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'true' ? '✅ Đang hoạt động' : '⏸️ Đã tắt'}
          </button>
        ))}
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {/* Desktop table */}
      <div className="glass rounded-2xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-gray-500 font-semibold">Code</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Số tiền</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Lượt dùng</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Hết hạn</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Ghi chú</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Trạng thái</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : codes.map(gc => (
                <tr key={gc._id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="p-4">
                    <span className="font-mono font-bold text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-lg text-xs tracking-wider">
                      {gc.code}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">
                    {gc.amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            gc.maxUses === 0 ? 'w-0' :
                            progressPct(gc) >= 100 ? 'bg-red-500' :
                            progressPct(gc) >= 60 ? 'bg-orange-400' : 'bg-green-400'
                          }`}
                          style={{ width: gc.maxUses === 0 ? '0%' : `${progressPct(gc)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {gc.usedCount}/{gc.maxUses === 0 ? '∞' : gc.maxUses}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-400">
                    {gc.expiresAt
                      ? new Date(gc.expiresAt) < new Date()
                        ? <span className="text-red-400">Hết hạn</span>
                        : new Date(gc.expiresAt).toLocaleDateString('vi-VN')
                      : <span className="text-gray-600">Không hết hạn</span>
                    }
                  </td>
                  <td className="p-4 text-xs text-gray-500 max-w-[150px] truncate">
                    {gc.note || '—'}
                  </td>
                  <td className="p-4">
                    {gc.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        ✅ Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        ⏸️ Tắt
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(gc._id)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                          gc.isActive
                            ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {gc.isActive ? '⏸️ Tắt' : '▶️ Bật'}
                      </button>
                      <button
                        onClick={() => handleDelete(gc._id, gc.code)}
                        className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-white/5">
          <span className="text-xs text-gray-500">Tổng: {total} codes</span>
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-28 animate-pulse" />
          ))
        ) : codes.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-500">
            Chưa có gift code nào
          </div>
        ) : codes.map(gc => (
          <div key={gc._id} className="glass rounded-xl p-4 border border-white/5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="font-mono font-bold text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-lg text-sm tracking-wider">
                  {gc.code}
                </span>
                {gc.note && <p className="text-xs text-gray-500 mt-1">{gc.note}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                gc.isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {gc.isActive ? '✅ Active' : '⏸️ Tắt'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-gray-600">Số tiền: </span>
                <span className="font-bold text-white">{gc.amount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div>
                <span className="text-gray-600">Lượt dùng: </span>
                <span className="font-bold text-white">
                  {gc.usedCount}/{gc.maxUses === 0 ? '∞' : gc.maxUses}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Hết hạn: </span>
                <span className={gc.expiresAt && new Date(gc.expiresAt) < new Date() ? 'text-red-400' : 'text-gray-400'}>
                  {gc.expiresAt
                    ? new Date(gc.expiresAt) < new Date()
                      ? 'Đã hết hạn'
                      : new Date(gc.expiresAt).toLocaleDateString('vi-VN')
                    : 'Không hết hạn'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(gc._id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  gc.isActive
                    ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {gc.isActive ? '⏸️ Tắt' : '▶️ Bật'}
              </button>
              <button
                onClick={() => handleDelete(gc._id, gc.code)}
                className="flex-1 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition"
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}

        {/* Mobile pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm border border-white/10 disabled:opacity-40 hover:border-yellow-500/30 transition"
            >← Trước</button>
            <span className="text-sm text-yellow-400 font-bold">Trang {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 rounded-xl text-sm border border-white/10 disabled:opacity-40 hover:border-yellow-500/30 transition"
            >Sau →</button>
          </div>
        )}
      </div>
    </div>
  );
}
