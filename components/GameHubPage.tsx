

import React, { useState } from 'react';
import SudokuPage from './SudokuPage';
import MinesweeperPage from './MinesweeperPage';
import SolitairePage from './SolitairePage';
import PoolGamePage from './PoolGamePage';
import type { SudokuStats, SudokuDifficulty, SolitaireStats, SolitaireSettings } from '../src/App';
import { BrainIcon, FireIcon, CubeTransparentIcon, CubeIcon, ChevronLeftIcon } from './icons';

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
  
  const games = [
    { 
      key: 'sudoku',
      title: "Sudoku", 
      description: "A classic logic puzzle.", 
      icon: <BrainIcon className="w-10 h-10" />, 
      onClick: () => setActiveGame('sudoku'),
      style: {
        background: 'radial-gradient(circle at 100% 0%, rgba(109, 40, 217, 0.2), rgba(109, 40, 217, 0) 50%), radial-gradient(circle at 0% 100%, rgba(79, 70, 229, 0.2), rgba(79, 70, 229, 0) 50%)',
        glowColor: 'rgba(124, 58, 237, 0.5)'
      }
    },
    { 
      key: 'minesweeper',
      title: "Minesweeper", 
      description: "Don't step on the mines.", 
      icon: <FireIcon className="w-10 h-10" />, 
      onClick: () => setActiveGame('minesweeper'),
      style: {
        backgroundImage: 'linear-gradient(rgba(124, 58, 237, 0.05) 1px, transparent 1px), linear-gradient(to right, rgba(124, 58, 237, 0.05) 1px, transparent 1px)',
        backgroundSize: '2rem 2rem',
        glowColor: 'rgba(234, 179, 8, 0.4)'
      }
    },
    { 
      key: 'solitaire',
      title: "Solitaire", 
      description: "The timeless card game.", 
      icon: <CubeTransparentIcon className="w-10 h-10" />, 
      onClick: () => setActiveGame('solitaire'),
      style: {
        background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1), transparent 70%)',
        glowColor: 'rgba(16, 185, 129, 0.5)'
      }
    },
    { 
      key: 'pool',
      title: "8-Ball Pool", 
      description: "A realistic pool simulation.", 
      icon: <CubeIcon className="w-10 h-10" />, 
      onClick: () => setActiveGame('pool'),
      style: {
        background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1), transparent 70%)',
        glowColor: 'rgba(6, 182, 212, 0.5)'
      }
    },
  ];

  const GameCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; style: any; animationDelay: string; }> = ({ title, description, icon, onClick, style, animationDelay }) => (
    <button
      onClick={onClick}
      className="relative group overflow-hidden rounded-3xl p-6 bg-zinc-900/50 backdrop-blur-lg border border-white/10 text-left transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay }}
    >
      <div className="absolute inset-0" style={{ background: style.background, backgroundImage: style.backgroundImage, backgroundSize: style.backgroundSize }} />
      <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(400px at center, ${style.glowColor}, transparent)` }} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-3 mb-4 inline-block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-white group-hover:text-orange-300 transition-colors">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-white/60 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );

  const renderContent = () => {
    switch (activeGame) {
      case 'sudoku':
        return <SudokuPage stats={sudokuStats} onGameWin={onSudokuWin} onBackToHub={() => setActiveGame('menu')} />;
      case 'minesweeper':
        return <MinesweeperPage onBackToHub={() => setActiveGame('menu')} onReturnToFeeds={onReturnToFeeds} />;
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
          <div className="flex-grow flex flex-col w-full p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
              <button 
                  onClick={onReturnToFeeds}
                  className="p-2.5 rounded-full text-zinc-400 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors"
              >
                  <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">Game Hub</h1>
                  <p className="text-zinc-600 dark:text-zinc-400">Choose a game to play.</p>
              </div>
            </header>
            <div className="flex-grow w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game, index) => (
                <GameCard 
                  key={game.key}
                  {...game} 
                  animationDelay={`${index * 100}ms`}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex-grow overflow-y-auto bg-zinc-100 dark:bg-zinc-950 flex flex-col relative">
       <div className="absolute inset-0 bg-grid-zinc-300/20 dark:bg-grid-zinc-700/20 [mask-image:linear-gradient(to_bottom,white_5%,transparent_50%)] dark:[mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]"></div>
       <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_20%_20%,_rgba(124,58,237,0.1)_0%,_transparent_40%)]"></div>
       {renderContent()}
    </main>
  );
};

export default GameHubPage;