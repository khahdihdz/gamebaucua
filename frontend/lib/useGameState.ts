'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export interface GameState {
  roundId: string;
  phase: 'betting' | 'rolling' | 'result';
  timeLeft: number;
  result: { dice1: string; dice2: string; dice3: string } | null;
  myBet?: { betData: Record<string, number>; totalBet: number; winAmount: number } | null;
}

export function useGameState(intervalMs = 2000) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevRoundId = useRef<string | null>(null);
  const [newRound, setNewRound] = useState(false);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const data = await api.get('/api/game/state');
        if (!active) return;
        setState(data);
        setError(null);
        if (prevRoundId.current && prevRoundId.current !== data.roundId) {
          setNewRound(true);
          setTimeout(() => setNewRound(false), 2000);
        }
        prevRoundId.current = data.roundId;
      } catch (e: any) {
        if (active) setError(e.message);
      }
    };

    poll();
    const id = setInterval(poll, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return { state, error, newRound };
}
