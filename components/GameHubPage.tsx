
import React, { useState, useCallback, Suspense, useMemo } from 'react';
import type { SudokuStats, SolitaireStats, SolitaireSettings } from '../src/App';

import SudokuPage from './SudokuPage';
import SolitairePage from './SolitairePage';
import MinesweeperPage from './MinesweeperPage';
import TetrisPage from './TetrisPage';
import PoolGamePage from './PoolGamePage';
import SporeCryptPage from './SporeCryptPage';
/* Fix: Import VoidRunnerPage correctly. The default export was breaking due to syntax errors in the source file. */
import VoidRunnerPage from './VoidRunnerPage';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon } from './icons';

interface GameInfo {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    bannerColor: string;
    stats?: string;
}

const VHSCard: React.FC<{ game: GameInfo; onPlay: () => void }> = ({ game, onPlay }) => {
    return (
        <div onClick={onPlay} className="group relative bg-void-900 border-2 border-zinc-800 hover:border-pulse-500 transition-all duration-300 cursor-pointer h-[350px] shadow-[10px_10px_0px_black] hover:translate-x-[-4px] hover:translate-y-[-4px]">
            <div className="h-44 w-full bg-void-950 flex items-center justify-center relative overflow-hidden border-b-2 border-zinc-800">
                <div className="absolute top-0 left-0 bg-pulse-500 text-white px-3 py-1 text-[8px] font-black uppercase font-mono tracking-widest">VHS-MASTER</div>
                <div className="opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 text-pulse-500">
                    {React.cloneElement(game.icon as React.ReactElement, { className: "w-28 h-28" })}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pulse-500 via-neon-400 to-pulse-500 animate-pulse"></div>
            </div>

            <div className="p-6 flex flex-col justify-between h-[calc(350px-11rem)]">
                <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 font-horror group-hover:text-pulse-500 transition-colors">{game.title}</h3>
                    <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest font-mono leading-relaxed">{game.description}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                     <div className="px-4 py-1 border border-pulse-500/40 text-pulse-500 text-[9px] font-black uppercase tracking-tighter">Play Simulation</div>
                     {game.stats && <span className="text-[9px] font-bold text-zinc-700 uppercase font-mono">{game.stats}</span>}
                </div>
            </div>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const [activeGame, setActiveGame] = useState<string>('hub');
    const handleBackToHub = useCallback(() => setActiveGame('hub'), []);

    const games: GameInfo[] = [
        { 
            id: 'void-runner', 
            title: 'Void Runner', 
            description: 'Navigate the multidimensional maze. Avoid the Demogorgons.', 
            icon: <SparklesIcon />, 
            bannerColor: 'from-pulse-950 to-void-900',
            stats: 'LEVEL 1-8'
        },
        { 
            id: 'sudoku', 
            title: 'Pattern Zero', 
            description: 'A logical cryptogram leaked from the mainframe.', 
            icon: <KeypadIcon />, 
            bannerColor: 'from-zinc-950 to-void-900',
            stats: props.sudokuStats.totalWins > 0 ? `${props.sudokuStats.totalWins} LOGS` : undefined
        },
        { 
            id: 'spore-crypt', 
            title: 'The Frequency', 
            description: 'Intercept the daily code before the static takes over.', 
            icon: <WalkieTalkieIcon />, 
            bannerColor: 'from-void-950 to-black',
            stats: 'ENCRYPTED'
        },
        { 
            id: 'solitaire', 
            title: 'Void Patience', 
            description: 'Arrange the sequence or face the shadow.', 
            icon: <RadioIcon />, 
            bannerColor: 'from-void-950 to-black',
            stats: props.solitaireStats.gamesWon > 0 ? `${props.solitaireStats.gamesWon} CLEARED` : undefined
        },
        { id: 'minesweeper', title: 'Void Breakers', description: 'Defuse the anomalies hidden in the grid.', icon: <EntityIcon />, bannerColor: 'from-void-950 to-black' },
        { id: 'tetris', title: 'Matrix Stacker', description: 'Stack the data blocks. Avoid overflow.', icon: <ControllerIcon />, bannerColor: 'from-void-950 to-black' },
        { id: 'pool', title: 'Dark Pocket', description: 'Simulated physics in a pocket dimension.', icon: <EntityIcon />, bannerColor: 'from-void-950 to-black' }
    ];

    if (activeGame === 'hub') {
        return (
            <main className="h-full min-h-0 flex-grow overflow-y-auto bg-void-950 p-8 md:p-16 animate-fade-in relative scrollbar-hide pb-40">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-20 flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b-2 border-pulse-500/20 pb-12">
                        <div className="flex items-center gap-8">
                            <div className="p-4 bg-pulse-500 shadow-[8px_8px_0px_white]">
                                <ControllerIcon className="w-14 h-14 text-white" />
                            </div>
                            <div>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none font-horror glitch-text">DARK ARCADE</h1>
                                <p className="text-pulse-500 font-bold tracking-[0.8em] uppercase text-[10px] md:text-xs mt-4 font-mono">1984 - Unauthorized Entry Detected</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10 bg-void-900 p-6 shadow-[10px_10px_0px_black]">
                             <div className="flex flex-col items-center gap-2">
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest font-mono">System Energy</span>
                                <div className="w-48 h-2 bg-black rounded-none border border-pulse-500/30 overflow-hidden">
                                    <div className="h-full bg-pulse-500" style={{ width: `${props.fertilizer}%` }} />
                                </div>
                             </div>
                             <button onClick={props.onReturnToFeeds} className="px-8 py-3 bg-white text-black text-xs font-black uppercase italic tracking-widest hover:bg-pulse-500 hover:text-white transition-all shadow-[4px_4px_0px_#e11d48]">
                                Exit Simulation
                             </button>
                        </div>
                    </header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                        {games.map(game => <VHSCard key={game.id} game={game} onPlay={() => setActiveGame(game.id)} />)}
                    </div>
                </div>
            </main>
        );
    }
    
    return (
        <Suspense fallback={<div className="w-full h-full flex flex-col items-center justify-center bg-void-950 text-pulse-500 font-black text-4xl italic animate-pulse uppercase font-horror">Loading Simulation...</div>}>
            {activeGame === 'void-runner' && <VoidRunnerPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'sudoku' && <SudokuPage stats={props.sudokuStats} onGameWin={props.onSudokuWin} onGameLoss={props.onSudokuLoss} onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'spore-crypt' && <SporeCryptPage onBackToHub={handleBackToHub} fertilizer={props.fertilizer} setFertilizer={props.setFertilizer} />}
            {activeGame === 'solitaire' && <SolitairePage stats={props.solitaireStats} onGameWin={props.onSolitaireWin} onGameStart={props.onSolitaireStart} settings={props.solitaireSettings} onUpdateSettings={props.onUpdateSolitaireSettings} onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'minesweeper' && <MinesweeperPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'tetris' && <TetrisPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'pool' && <PoolGamePage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
        </Suspense>
    );
};

export default GameHubPage;
