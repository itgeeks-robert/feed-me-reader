

import React, { useState } from 'react';
import SudokuPage from './SudokuPage';
import MinesweeperPage from './MinesweeperPage';
import SolitairePage from './SolitairePage';
import PoolGamePage from './PoolGamePage';
import type { SudokuStats, SudokuDifficulty, SolitaireStats, SolitaireSettings } from '../src/App';
import { BrainIcon, FireIcon, CubeTransparentIcon, CubeIcon } from './icons';

interface GameHubPageProps {
  sudokuStats: SudokuStats;
  onSudokuWin: (difficulty: SudokuDifficulty, time: number, isDaily: boolean) => void;
  solitaireStats: SolitaireStats;
  onSolitaireWin: (time: number, moves: number) => void;
  onSolitaireStart: () => void;
  solitaireSettings: SolitaireSettings;
  onUpdateSolitaireSettings: (settings: SolitaireSettings) => void;
  isApiKeyMissing: boolean;
  onReturnToFeeds: () => void;
}

const GameHubPage: React.FC<GameHubPageProps> = (props) => {
  const { 
    sudokuStats, onSudokuWin, 
    solitaireStats, onSolitaireWin, onSolitaireStart,
    solitaireSettings, onUpdateSolitaireSettings,
    isApiKeyMissing,
    onReturnToFeeds
  } = props;

  const [activeGame, setActiveGame] = useState<'menu' | 'sudoku' | 'minesweeper' | 'solitaire' | 'pool'>('menu');

  const GameCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white/50 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg w-full text-left p-6 hover:border-white/40 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl text-white group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );

  const renderContent = () => {
    switch (activeGame) {
      case 'sudoku':
        return <SudokuPage stats={sudokuStats} onGameWin={onSudokuWin} onBackToHub={() => setActiveGame('menu')} />;
      case 'minesweeper':
        return <MinesweeperPage onBackToHub={() => setActiveGame('menu')} />;
      case 'solitaire':
        return (
          <SolitairePage 
            onBackToHub={() => setActiveGame('menu')} 
            stats={solitaireStats} 
            onGameWin={onSolitaireWin} 
            onGameStart={onSolitaireStart}
            settings={solitaireSettings}
            onUpdateSettings={onUpdateSolitaireSettings}
            isApiKeyMissing={isApiKeyMissing}
          />
        );
      case 'pool':
        return <PoolGamePage onBackToHub={() => setActiveGame('menu')} />;
      case 'menu':
      default:
        return (
          <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-2">Game Hub</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 md:mb-12">Choose a game to play.</p>
            <div className="w-full max-w-md space-y-4">
              <GameCard title="Sudoku" description="A classic logic puzzle." icon={<BrainIcon className="w-8 h-8" />} onClick={() => setActiveGame('sudoku')} />
              <GameCard title="Minesweeper" description="Don't step on the mines." icon={<FireIcon className="w-8 h-8" />} onClick={() => setActiveGame('minesweeper')} />
              <GameCard title="Solitaire" description="The timeless card game." icon={<CubeTransparentIcon className="w-8 h-8" />} onClick={() => setActiveGame('solitaire')} />
              <GameCard title="8-Ball Pool" description="A realistic pool simulation." icon={<CubeIcon className="w-8 h-8" />} onClick={() => setActiveGame('pool')} />
            </div>
             <button 
                onClick={onReturnToFeeds}
                className="mt-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 inline-flex items-center gap-2 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Return to All Feeds
            </button>
          </div>
        );
    }
  };

  return (
    <main className="flex-grow overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex flex-col">
      {renderContent()}
    </main>
  );
};

export default GameHubPage;