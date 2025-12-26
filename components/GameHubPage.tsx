
import React, { useState, useCallback, Suspense } from 'react';
import type { SudokuStats, SudokuDifficulty, SolitaireStats, SolitaireSettings } from '../src/App';

import SudokuPage from './SudokuPage';
import SolitairePage from './SolitairePage';
import MinesweeperPage from './MinesweeperPage';
import TetrisPage from './TetrisPage';
import PoolGamePage from './PoolGamePage';
import MarioPage from './MarioPage';
import { ControllerIcon, BrainIcon, CubeIcon, MushroomIcon, TetrisTBlockIcon, SeymourIcon, FlagIcon, CubeTransparentIcon } from './icons';

const SkidRowSurvivalGame: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [gamePhase, setGamePhase] = useState<'TITLE' | 'PLAYING'>('TITLE');

    if (gamePhase === 'TITLE') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#050a06] text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="w-full h-full bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.5)0px,rgba(0,0,0,0.5)1px,transparent 1px,transparent 2px)] bg-[length:100%_2px]"></div>
                </div>
                <div className="mb-6 p-6 bg-plant-500 rounded-full shadow-[0_0_60px_rgba(34,197,94,0.6)] animate-bounce">
                    <SeymourIcon className="w-40 h-40 text-black" />
                </div>
                <h1 className="text-7xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-plant-400 via-flesh-500 to-plant-600 italic uppercase drop-shadow-2xl text-center">SKID ROW SURVIVAL</h1>
                <p className="text-plant-400 mb-8 font-bold tracking-[0.5em] uppercase animate-pulse">Total Botanical Carnage</p>
                <button onClick={() => setGamePhase('PLAYING')} className="px-16 py-5 bg-flesh-600 hover:bg-flesh-500 text-white rounded-full font-black text-2xl italic uppercase transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(236,72,153,0.4)] border-4 border-white/20">
                    FEED THE PLANT
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-[#0a0a14] flex flex-col items-center justify-center p-4">
             <div className="absolute top-4 right-4 z-20">
                <button onClick={onBackToHub} className="px-5 py-2 bg-plant-600 text-black rounded-full text-xs font-black uppercase italic tracking-widest shadow-lg">Eject</button>
            </div>
            <div className="text-center bg-black/80 p-12 rounded-[3rem] border-4 border-plant-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <p className="text-flesh-500 font-black text-5xl animate-pulse italic tracking-tighter mb-4 uppercase">Level 1: The Pit</p>
                <p className="text-plant-500 font-mono text-sm uppercase tracking-widest">Digesting logic gates...</p>
            </div>
        </div>
    );
};

interface GameInfo {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    bannerColor: string;
}

const GameCard: React.FC<{ game: GameInfo; onPlay: () => void }> = ({ game, onPlay }) => {
    return (
        <div onClick={onPlay} className="group relative bg-zinc-950 border-4 border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.05] hover:border-plant-500 hover:shadow-[0_0_50px_rgba(34,197,94,0.25)] cursor-pointer h-[320px] shadow-2xl">
            <div className="absolute inset-0 pointer-events-none z-10 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            
            <div className={`h-40 w-full relative overflow-hidden bg-gradient-to-br ${game.bannerColor} flex items-center justify-center`}>
                <div className="opacity-30 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700">
                    {React.cloneElement(game.icon as React.ReactElement, { className: "w-24 h-24" })}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-plant-500 shadow-[0_0_15px_#22c55e]"></div>
            </div>

            <div className="p-6 flex-grow flex flex-col justify-between bg-zinc-900">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-flesh-500">{React.cloneElement(game.icon as React.ReactElement, { className: "w-6 h-6" })}</span>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{game.title}</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest line-clamp-2 leading-relaxed opacity-80">{game.description}</p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-plant-600 text-black font-black text-[10px] uppercase italic tracking-tighter group-hover:bg-flesh-500 group-hover:text-white transition-colors text-center">
                    Insert Coin
                </div>
            </div>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const [activeGame, setActiveGame] = useState<string>('hub');
    const handleBackToHub = useCallback(() => setActiveGame('hub'), []);

    const games: GameInfo[] = [
        { id: 'sudoku', title: 'Brain Spores', description: 'Logical mutation puzzles that grow your mental vines.', icon: <BrainIcon />, bannerColor: 'from-green-950 to-black' },
        { id: 'solitaire', title: 'Leaf Patience', description: 'Strategic survival cards for the Skid Row elite.', icon: <CubeTransparentIcon />, bannerColor: 'from-emerald-950 to-black' },
        { id: 'minesweeper', title: 'Toxic Pods', description: 'Defuse the mutated seed pods before they burst!', icon: <FlagIcon />, bannerColor: 'from-red-950 to-black' },
        { id: 'tetris', title: 'Planter Stacker', description: 'Organize the planters or let the jungle take over.', icon: <TetrisTBlockIcon />, bannerColor: 'from-purple-950 to-black' },
        { id: 'pool', title: 'Eyeball Billiards', description: 'Sink the seeds into the fleshy pockets. Don\'t scratch.', icon: <CubeIcon />, bannerColor: 'from-zinc-900 to-black' },
        { id: 'mario', title: 'Plumber Snack', description: 'Help the greenery reclaim the mushroom kingdom.', icon: <MushroomIcon />, bannerColor: 'from-orange-950 to-black' },
        { id: 'skid-row', title: 'Skid Row Survival', description: 'The flagship. Feed Seymour. Survive the night.', icon: <SeymourIcon />, bannerColor: 'from-plant-950 to-flesh-950' }
    ];

    if (activeGame === 'hub') {
        return (
            <main className="h-full flex-grow overflow-y-auto bg-zinc-950 p-6 md:p-12 animate-fade-in relative scrollbar-hide pb-40 z-10 touch-pan-y">
                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-plant-500 rounded-[2rem] shadow-[0_0_40px_rgba(34,197,94,0.4)] rotate-3">
                                <SeymourIcon className="w-12 h-12 text-black" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">THE FEEDING PIT</h1>
                                <p className="text-flesh-500 font-black tracking-[0.6em] uppercase text-[10px] md:text-xs mt-2">Mean green games from space</p>
                            </div>
                        </div>
                        <button onClick={props.onReturnToFeeds} className="px-10 py-3 bg-zinc-900 border-2 border-plant-500/20 rounded-full text-zinc-400 hover:text-plant-500 transition-all text-sm font-black uppercase tracking-widest italic">
                          Eat News
                        </button>
                    </header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {games.map(game => <GameCard key={game.id} game={game} onPlay={() => setActiveGame(game.id)} />)}
                    </div>
                </div>
            </main>
        );
    }
    
    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-zinc-950 text-plant-500 font-black text-3xl italic animate-pulse uppercase">Incubating...</div>}>
            {activeGame === 'sudoku' && <SudokuPage stats={props.sudokuStats} onGameWin={props.onSudokuWin} onGameLoss={props.onSudokuLoss} onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'solitaire' && <SolitairePage stats={props.solitaireStats} onGameWin={props.onSolitaireWin} onGameStart={props.onSolitaireStart} settings={props.solitaireSettings} onUpdateSettings={props.onUpdateSolitaireSettings} onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'minesweeper' && <MinesweeperPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'tetris' && <TetrisPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'pool' && <PoolGamePage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'mario' && <MarioPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'skid-row' && <SkidRowSurvivalGame onBackToHub={handleBackToHub} />}
        </Suspense>
    );
};

export default GameHubPage;
