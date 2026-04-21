'use client';
import { useStore } from '@/store';
import { userAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';

type SortBy = 'totalWon' | 'totalBet' | 'gamesPlayed' | 'balance';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'totalWon', label: '🏆 Thắng nhiều' },
  { value: 'balance', label: '💰 Giàu nhất' },
  { value: 'gamesPlayed', label: '🎲 Chơi nhiều' }
];

interface LeaderboardPanelProps {
  modal?: boolean;
}

export function LeaderboardPanel({ modal }: LeaderboardPanelProps) {
  const { setLeaderboard, user } = useStore();
  const [sortBy, setSortBy] = [
    'totalWon' as SortBy,
    (_: SortBy) => {}
  ];

  const { data: leaders = [], isLoading, refetch } = useQuery({
    queryKey: ['leaderboard', sortBy],
    queryFn: () => userAPI.leaderboard(sortBy),
    refetchInterval: 30_000
  });

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return n.toString();
  };

  const MEDALS = ['🥇', '🥈', '🥉'];

  const content = (
    <div className={`card-casino flex flex-col ${modal ? 'max-h-[80vh]' : 'flex-1'}`}>
      {/* Header */}
      <div className="p-3 border-b border-casino-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🏆</span>
          <span className="text-sm font-bold">Bảng Xếp Hạng</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => refetch()}
            className="text-gray-500 hover:text-casino-gold text-sm transition-colors"
            title="Làm mới"
          >
            🔄
          </button>
          {modal && (
            <button
              onClick={() => setLeaderboard(false)}
              className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-casino-surface text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 p-2 border-b border-casino-border overflow-x-auto">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => {/* setSortBy(opt.value) */}}
            className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold transition-all
              ${sortBy === opt.value
                ? 'bg-casino-gold/20 text-casino-gold border border-casino-gold/30'
                : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-casino-border border-t-casino-gold rounded-full"
            />
          </div>
        ) : leaders.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-8">Chưa có dữ liệu</p>
        ) : (
          <div className="divide-y divide-casino-border/50">
            {leaders.map((player: any, i: number) => {
              const isMe = player._id === user?.id;
              return (
                <motion.div
                  key={player._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors
                    ${isMe ? 'bg-casino-gold/5 border-l-2 border-l-casino-gold' : 'hover:bg-casino-surface/50'}`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {i < 3
                      ? <span className="text-lg">{MEDALS[i]}</span>
                      : <span className="text-sm font-bold text-gray-500">#{i + 1}</span>
                    }
                  </div>

                  {/* Avatar */}
                  {player.avatar ? (
                    <Image
                      src={player.avatar}
                      alt={player.username}
                      width={28}
                      height={28}
                      className="rounded-full border border-casino-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-casino-purple flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {player.username?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Name + stats */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-casino-gold' : 'text-white'}`}>
                      {player.displayName || player.username}
                      {isMe && <span className="text-xs ml-1 text-casino-gold/60">(bạn)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {player.gamesPlayed || 0} ván
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-casino-gold">
                      {fmt(player[sortBy] || player.totalWon || 0)}
                    </p>
                    <p className="text-xs text-gray-600">xu</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (!modal) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setLeaderboard(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {content}
      </motion.div>
    </div>
  );
}
