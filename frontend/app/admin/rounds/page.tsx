'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SYMBOL_CONFIG, type Symbol } from '@/lib/symbols';

export default function AdminRounds() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/rounds')
      .then(setRounds)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display font-black text-yellow-400 mb-6">🎲 Lịch sử ván</h1>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-gray-500 font-semibold">Round ID</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Kết quả</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Tổng cược</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Trả thưởng</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Lợi nhuận</th>
                <th className="p-4 text-left text-gray-500 font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : rounds.map(r => (
                <tr key={r._id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="p-4 font-mono text-xs text-gray-500">{r.roundId?.slice(-10)}</td>
                  <td className="p-4">
                    {r.result ? (
                      <div className="flex gap-1">
                        {[r.result.dice1, r.result.dice2, r.result.dice3].map((d, i) => {
                          const cfg = SYMBOL_CONFIG[d as Symbol];
                          return cfg ? (
                            <span key={i} title={cfg.label} className="text-xl">{cfg.emoji}</span>
                          ) : <span key={i} className="text-gray-600">?</span>;
                        })}
                      </div>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="p-4 font-bold">{(r.totalBets || 0).toLocaleString('vi-VN')}đ</td>
                  <td className="p-4 text-red-400">{(r.totalWins || 0).toLocaleString('vi-VN')}đ</td>
                  <td className={`p-4 font-bold ${(r.houseProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(r.houseProfit || 0).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
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
