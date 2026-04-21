'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/store';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export function useSocket() {
  const initialized = useRef(false);
  const {
    setRound, setResult, addChatMessage, updateBalance,
    clearBets, setPendingBet, setWinAmount, user
  } = useStore();

  useEffect(() => {
    if (initialized.current || !user) return;
    initialized.current = true;

    socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/game`, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket?.emit('get_state');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // ─── Game events ────────────────────────────────────────────────────────
    socket.on('game_state', (data) => {
      if (data) setRound(data);
    });

    socket.on('new_round', (data) => {
      setRound({ ...data, status: 'betting' });
      clearBets();
      setWinAmount(null);
    });

    socket.on('round_rolling', (data) => {
      setRound((prev: any) => prev ? { ...prev, status: 'rolling' } : prev);
    });

    socket.on('round_completed', (data) => {
      setRound((prev: any) => prev ? { ...prev, status: 'completed', result: data.result } : prev);
      setResult(data.result);
    });

    // ─── Personal events ──────────────────────────────────────────────────
    socket.on('round_result', (data) => {
      setPendingBet(false);
      if (data.winAmount > 0) {
        setWinAmount(data.winAmount);
        toast.success(`🎉 Thắng ${data.winAmount.toLocaleString('vi-VN')} xu!`, {
          duration: 4000,
          style: { background: '#1a1a26', color: '#f5c842', border: '1px solid #f5c842' }
        });
      } else {
        toast(`Ván này chưa may mắn 😔`, {
          duration: 2000,
          style: { background: '#1a1a26', color: '#e8e8f0' }
        });
      }
    });

    socket.on('balance_update', (data) => {
      updateBalance(data.balance);
    });

    socket.on('deposit_success', (data) => {
      toast.success(`✅ Nạp ${data.amount.toLocaleString('vi-VN')} VNĐ thành công!`, {
        duration: 5000,
        style: { background: '#1a1a26', color: '#2ecc71', border: '1px solid #2ecc71' }
      });
    });

    // ─── Chat ──────────────────────────────────────────────────────────────
    socket.on('chat_message', (msg) => {
      addChatMessage(msg);
    });

    // ─── Bet activity ──────────────────────────────────────────────────────
    socket.on('bet_placed', (data) => {
      // Could show in activity feed
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialized.current = false;
    };
  }, [user?.id]);

  const sendChat = (message: string) => {
    socket?.emit('chat_message', { message });
  };

  return { socket, sendChat };
}

export function getSocket() {
  return socket;
}
