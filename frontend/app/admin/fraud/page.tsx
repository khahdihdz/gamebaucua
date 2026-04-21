'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const REASON_LABELS: Record<string, string> = {
  deposit_spam:    '🔁 Spam nạp tiền',
  amount_mismatch: '💸 Sai số tiền',
  duplicate:       '📋 Webhook trùng lặp',
};

export default function AdminFraud() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/fraud')
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display font-black text-yellow-400 mb-6">🔒 Fraud Logs</h1>

      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-20 animate-pulse" />
          ))
        ) : logs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-500">
            ✅ Không có hoạt động đáng ngờ
          </div>
        ) : logs.map(log => (
          <div key={log._id} className="glass rounded-xl p-4 border border-red-500/10 hover:border-red-500/20 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {log.userId?.avatar && (
                  <img src={log.userId.avatar} alt="" className="w-8 h-8 rounded-full border border-red-500/30" />
                )}
                <div>
                  <p className="font-bold text-red-300">{log.userId?.username || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">
                    {REASON_LABELS[log.reason] || log.reason}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xl font-black ${log.score >= 70 ? 'text-red-400' : log.score >= 40 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  +{log.score}
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {log.details && Object.keys(log.details).length > 0 && (
              <div className="mt-3 p-2 bg-white/3 rounded-lg font-mono text-xs text-gray-500">
                {JSON.stringify(log.details)}
              </div>
            )}

            {log.userId?.isFlagged && (
              <div className="mt-2">
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 font-bold">
                  🚨 TK bị khóa · Risk: {log.userId.riskScore}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
