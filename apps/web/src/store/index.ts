import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  balance: number;
  role: string;
}

interface GameRound {
  roundId: string;
  status: 'betting' | 'rolling' | 'completed';
  bettingEndsAt: number;
  result?: { dice1: string; dice2: string; dice3: string };
  timeLeft?: number;
}

interface ChatMessage {
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: number;
}

interface BetChoice {
  symbol: string;
  amount: number;
}

interface AppState {
  // Auth
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;

  // Game
  currentRound: GameRound | null;
  lastResult: GameRound['result'] | null;
  myBets: BetChoice[];
  pendingBet: boolean;
  winAmount: number | null;
  setRound: (round: GameRound | null) => void;
  setResult: (result: GameRound['result']) => void;
  addBetChoice: (choice: BetChoice) => void;
  removeBetChoice: (symbol: string) => void;
  clearBets: () => void;
  setPendingBet: (v: boolean) => void;
  setWinAmount: (amount: number | null) => void;
  updateBalance: (balance: number) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // UI
  showDepositModal: boolean;
  showLeaderboard: boolean;
  setDepositModal: (v: boolean) => void;
  setLeaderboard: (v: boolean) => void;
}

export const useStore = create<AppState>()(
  devtools((set, get) => ({
    // Auth
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setLoading: (isLoading) => set({ isLoading }),

    // Game
    currentRound: null,
    lastResult: null,
    myBets: [],
    pendingBet: false,
    winAmount: null,

    setRound: (currentRound) => set({ currentRound }),
    setResult: (result) => set({ lastResult: result }),
    addBetChoice: (choice) => set((state) => {
      const existing = state.myBets.findIndex(b => b.symbol === choice.symbol);
      if (existing >= 0) {
        const updated = [...state.myBets];
        updated[existing] = { ...updated[existing], amount: updated[existing].amount + choice.amount };
        return { myBets: updated };
      }
      return { myBets: [...state.myBets, choice] };
    }),
    removeBetChoice: (symbol) => set((state) => ({
      myBets: state.myBets.filter(b => b.symbol !== symbol)
    })),
    clearBets: () => set({ myBets: [], pendingBet: false }),
    setPendingBet: (pendingBet) => set({ pendingBet }),
    setWinAmount: (winAmount) => set({ winAmount }),
    updateBalance: (balance) => set((state) => ({
      user: state.user ? { ...state.user, balance } : null
    })),

    // Chat
    chatMessages: [],
    addChatMessage: (msg) => set((state) => ({
      chatMessages: [...state.chatMessages.slice(-99), msg] // keep last 100
    })),

    // UI
    showDepositModal: false,
    showLeaderboard: false,
    setDepositModal: (showDepositModal) => set({ showDepositModal }),
    setLeaderboard: (showLeaderboard) => set({ showLeaderboard })
  }))
);
