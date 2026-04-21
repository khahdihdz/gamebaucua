'use client';
import { adminAPI } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useState } from 'react';
import toast from 'react-hot-toast';

const SYMBOLS = ['bau','cua','ca','tom','ga','nai'];
const SYMBOL_EMOJI: Record<string, string> = {
  bau:'🦐', cua:'🦀', ca:'🐟', tom:'🦞', ga:'🐓', nai:'🦌'
};
const SYMBOL_LABEL: Record<string, string> = {
  bau:'Bầu', cua:'Cua', ca:'Cá', tom:'Tôm', ga:'Gà', nai:'Nai'
};

function DiceSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SYMBOLS.map(sym => (
        <button
          key={sym}
          onClick={() => onChange(sym)}
          className={`flex flex-col items-center p-3 rounded-xl border transition-all
            ${value === sym
              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
              : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
            }`}
        >
          <span className="text-2xl">{SYMBOL_EMOJI[sym]}</span>
          <span className="text-xs font-bold mt-1">{SYMBOL_LABEL[sym]}</span>
        </button>
      ))}
    </div>
  );
}

export default function GameControlPage() {
  const qc = useQueryClient();
  const [rtp, setRtp] = useState('97');
  const [d1, setD1] = useState('bau');
  const [d2, setD2] = useState('cua');
  const [d3, setD3] = useState('ca');

  const { data: configs } = useQuery({
    queryKey: ['admin-config'],
    queryFn: adminAPI.getConfig
  });

  const rtpConfig = configs?.find((c: any) => c.key === 'rtp');

  const setRtpMut = useMutation({
    mutationFn: () => adminAPI.setConfig('rtp', parseInt(rtp), 'RTP % của game'),
    onSuccess: () => { toast.success(`RTP đã set: ${rtp}%`); qc.invalidateQueries({ queryKey: ['admin-config'] }); }
  });

  const forceResultMut = useMutation({
    mutationFn: () => adminAPI.forceResult(d1, d2, d3),
    onSuccess: () => toast.success(`Đã set kết quả ép: ${SYMBOL_EMOJI[d1]}${SYMBOL_EMOJI[d2]}${SYMBOL_EMOJI[d3]}`),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không có ván betting đang chạy')
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-black text-white">🎮 Game Control</h1>
          <p className="text-sm text-gray-500">Điều chỉnh RTP và kết quả game</p>
        </div>

        {/* RTP Control */}
        <div className="admin-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">⚙️ Cài Đặt RTP</h2>
            <span className="text-xs text-gray-500">
              Hiện tại: <span className="text-yellow-400 font-bold">{rtpConfig?.value || 97}%</span>
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              RTP (Return to Player): <span className="text-white font-bold">{rtp}%</span>
            </label>
            <input
              type="range" min="85" max="99" value={rtp}
              onChange={e => setRtp(e.target.value)}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>85% (House edge cao)</span>
              <span>99% (House edge thấp)</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-3 text-sm">
            <p className="text-gray-400">House edge: <span className="text-red-400 font-bold">{100 - parseInt(rtp)}%</span></p>
            <p className="text-gray-500 text-xs mt-1">
              RTP = {rtp}% nghĩa là cứ 100 xu đặt cược, người chơi nhận lại ~{rtp} xu
            </p>
          </div>

          <button
            onClick={() => setRtpMut.mutate()}
            disabled={setRtpMut.isPending}
            className="admin-btn-primary w-full"
          >
            {setRtpMut.isPending ? 'Đang lưu...' : '💾 Lưu RTP'}
          </button>
        </div>

        {/* Force result */}
        <div className="admin-card space-y-4">
          <div>
            <h2 className="font-bold text-white">🎯 Ép Kết Quả Ván Hiện Tại</h2>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Chỉ hoạt động trong phase betting. Sẽ ghi đè RTP engine cho ván này.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center">Xúc xắc 1</p>
              <DiceSelector value={d1} onChange={setD1} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center">Xúc xắc 2</p>
              <DiceSelector value={d2} onChange={setD2} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center">Xúc xắc 3</p>
              <DiceSelector value={d3} onChange={setD3} />
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-800 rounded-xl">
            {[d1, d2, d3].map((sym, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-4xl">{SYMBOL_EMOJI[sym]}</span>
                <span className="text-xs text-gray-400 mt-1">{SYMBOL_LABEL[sym]}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => forceResultMut.mutate()}
            disabled={forceResultMut.isPending}
            className="admin-btn bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 w-full"
          >
            {forceResultMut.isPending ? 'Đang set...' : `⚡ Ép kết quả: ${SYMBOL_EMOJI[d1]} ${SYMBOL_EMOJI[d2]} ${SYMBOL_EMOJI[d3]}`}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
