'use client';
import { useStore } from '@/store';
import { useSocket } from '@/hooks/useSocket';
import { GameBoard } from '@/components/game/GameBoard';
import { BettingPanel } from '@/components/game/BettingPanel';
import { ChatBox } from '@/components/game/ChatBox';
import { Header } from '@/components/layout/Header';
import { DepositModal } from '@/components/game/DepositModal';
import { LeaderboardPanel } from '@/components/game/LeaderboardPanel';
import { LoginPrompt } from '@/components/ui/LoginPrompt';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function HomePage() {
  const { user, isLoading, showDepositModal, showLeaderboard } = useStore();
  const { sendChat } = useSocket();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <LoginPrompt />;

  return (
    <div className="min-h-screen bg-casino-bg flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
        {/* Desktop: 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 h-full">
          {/* Left: Chat */}
          <div className="hidden lg:flex flex-col">
            <ChatBox onSend={sendChat} />
          </div>

          {/* Center: Game */}
          <div className="flex flex-col gap-4">
            <GameBoard />
            <BettingPanel />
          </div>

          {/* Right: Leaderboard */}
          <div className="hidden lg:flex flex-col">
            <LeaderboardPanel />
          </div>
        </div>

        {/* Mobile: Chat below game */}
        <div className="mt-4 lg:hidden">
          <ChatBox onSend={sendChat} compact />
        </div>
      </main>

      {/* Modals */}
      {showDepositModal && <DepositModal />}
      {showLeaderboard && <LeaderboardPanel modal />}
    </div>
  );
}
