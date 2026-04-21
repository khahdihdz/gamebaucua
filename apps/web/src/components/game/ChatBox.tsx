'use client';
import { useStore } from '@/store';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ChatBoxProps {
  onSend: (msg: string) => void;
  compact?: boolean;
}

export function ChatBox({ onSend, compact }: ChatBoxProps) {
  const { chatMessages, user } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !user) return;
    onSend(msg);
    setInput('');
  };

  return (
    <div className={`card-casino flex flex-col ${compact ? 'h-48' : 'flex-1 min-h-0'}`}>
      <div className="p-3 border-b border-casino-border flex items-center gap-2">
        <span className="text-sm">💬</span>
        <span className="text-sm font-bold">Live Chat</span>
        <span className="ml-auto text-xs text-green-400">● {chatMessages.length > 0 ? 'Online' : 'Đang kết nối...'}</span>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${compact ? 'max-h-24' : ''}`}>
        {chatMessages.length === 0 && (
          <p className="text-center text-gray-600 text-xs py-4">Chưa có tin nhắn</p>
        )}
        {chatMessages.map((msg, i) => (
          <motion.div
            key={`${msg.timestamp}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2"
          >
            {msg.avatar ? (
              <Image src={msg.avatar} alt="" width={20} height={20} className="rounded-full mt-0.5 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-casino-purple flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <span className="text-xs font-bold text-casino-gold">{msg.username} </span>
              <span className="text-xs text-gray-300 break-words">{msg.message}</span>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-casino-border flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={user ? 'Nhắn tin...' : 'Đăng nhập để chat'}
          disabled={!user}
          maxLength={200}
          className="flex-1 bg-casino-surface border border-casino-border rounded-lg px-3 py-1.5
                     text-sm text-white placeholder-gray-600 focus:outline-none focus:border-casino-gold
                     disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!user || !input.trim()}
          className="px-3 py-1.5 bg-casino-gold/20 border border-casino-gold/30 rounded-lg
                     text-casino-gold font-bold text-sm hover:bg-casino-gold/30 disabled:opacity-40"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
