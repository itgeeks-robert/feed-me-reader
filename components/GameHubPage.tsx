import React, { useMemo } from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, XIcon, ListIcon, CpuChipIcon, BoltIcon, StarIcon } from './icons';
import { getHighScores, ScoreCategory } from '../services/highScoresService';

interface GameInfo {
    id: string;
    title: string;
    protocol: string; 
    inspiredBy: string;
    description: string;
    // FIX: Use a more specific type for the icon to ensure it's a React element that accepts a className.
    // This resolves the type inference issue with React.cloneElement.
    icon: React.ReactElement<{ className?: string }>;
    posterColor: string;
    cameraId: string;
    gameType: 'sudoku' | 'tetris' | 'minesweeper' | 'pacman' | 'wordle' | 'connections' | 'cards' | 'gyro' | 'hangman' | 'grid';
    scoreKey?: ScoreCategory;
    isDaily?: boolean;
}

const GameBoardCCTV: React.FC<{ type: string }> = ({ type }) => {
    const renderBoard = () => {
        switch (type) {
            case 'sudoku':
                return (
                    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-12 h-12 border border-white/20">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/10 flex items-center justify-center text-[4px] font-black opacity-40">
                                {i + 1}
                            </div>
                        ))}
                        <div className="absolute inset-0 border-2 border-emerald-500/20 animate-pulse" />
                    </div>
                );
            case 'tetris':
                return (
                    <div className="w-10 h-14 border border-white/20 relative">
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-white/40 border border-white/10" />
                        <div className="absolute bottom-0 left-3 w-3 h-3 bg-white/40 border border-white/10" />
                        <div className="absolute bottom-3 left-1.5 w-3 h-3 bg-white/40 border border-white/10" />
                        <div className="absolute top-2 left-4 w-3 h-6 bg-emerald-500/40 border border-emerald-500/20" />
                    </div>
                );
            case 'minesweeper':
                return (
                    <div className="grid grid-cols-5 grid-rows-5 gap-px w-12 h-12">
                        {[...Array(25)].map((_, i) => (
                            <div key={i} className={`w-full h-full border border-white/5 ${Math.random() > 0.8 ? 'bg-red-500/40' : 'bg-white/10'}`} />
                        ))}
                    </div>
                );
            case 'pacman':
                return (
                    <div className="w-12 h-12 border-2 border-white/10 rounded-full relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-500/20 rounded-full border border-yellow-500/40" />
                        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-ping" />
                    </div>
                );
            case 'wordle':
                return (
                    <div className="flex flex-col gap-1 w-12">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex gap-1">
                                {[...Array(5)].map((_, j) => (
                                    <div key={j} className={`w-2 h-2 border border-white/20 ${i === 0 && j < 3 ? 'bg-emerald-500/40' : ''}`} />
                                ))}
                            </div>
                        ))}
                    </div>
                );
            case 'connections':
                return (
                    <div className="flex flex-col gap-1 w-12 h-12">
                        <div className="h-2 w-full bg-yellow-500/30 border border-yellow-500/40" />
                        <div className="h-2 w-full bg-emerald-500/30 border border-emerald-500/40" />
                        <div className="flex-1 w-full border border-white/10 grid grid-cols-4 gap-0.5 p-0.5">
                            {[...Array(8)].map((_, i) => <div key={i} className="bg-white/5" />)}
                        </div>
                    </div>
                );
            case 'cards':
                return (
                    <div className="flex gap-1">
                        <div className="w-4 h-7 bg-white/10 border border-white/20 rounded-sm" />
                        <div className="w-4 h-7 bg-white/10 border border-white/20 rounded-sm -ml-2 translate-y-1" />
                        <div className="w-4 h-7 bg-white/10 border border-white/20 rounded-sm -ml-2 translate-y-2" />
                    </div>
                );
            case 'gyro':
                return (
                    <div className="w-14 h-8 border-2 border-white/20 rounded-lg flex items-center justify-center">
                         <div className="w-1 h-4 bg-emerald-500/40 rounded-full animate-bounce" />
                    </div>
                );
            case 'hangman':
                return (
                    <div className="w-10 h-14 border-l-2 border-b-2 border-white/20 relative">
                        <div className="absolute top-0 left-0 w-6 h-0.5 bg-white/20" />
                        <div className="absolute top-0 right-4 w-0.5 h-3 bg-white/20" />
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full border border-red-500/40" />
                    </div>
                );
            case 'grid':
                return (
                    <div className="grid grid-cols-3 gap-1 w-12 h-12">
                         {[...Array(9)].map((_, i) => <div key={i} className={`rounded-sm border border-white/10 ${Math.random() > 0.6 ? 'bg-pulse-500/40' : ''}`} />)}
                    </div>
                );
            default:
                return <ControllerIcon className="w-8 h-8 opacity-20" />;
        }
    };

    return (
        <div className="relative p-2 bg-black border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
            {renderBoard()}
            {/* Scanlines on preview */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(0,0,0,0.2)_1px,rgba(0,0,0,0.2)_2px)] pointer-events-none" />
        </div>
    );
};

const CabinetPoster: React.FC<{ game: GameInfo; onPlay: () => void; isFavorite: boolean; onToggleFavorite: (id: string) => void; }> = ({ game, onPlay, isFavorite, onToggleFavorite }) => {
    return (
        <div className="relative group/card aspect-[2/3] sm:aspect-[3/4] transition-all duration-300">
            <button 
                onClick={onPlay}
                className="w-full h-full text-left relative bg-zinc-900 border-2 border-zinc-800 rounded-lg overflow-hidden shadow-2xl transition-all duration-500 outline-none focus:ring-4 focus:ring-emerald-500 focus:scale-105 group-hover/card:scale-105 group-hover/card:z-10 group-hover/card:border-emerald-500/50"
            >
                {/* 1980s Cabinet Art Style */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.posterColor}`}>
                    {/* The "Big Symbol" Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                         {/* FIX: Removed the type cast as GameInfo.icon is now correctly typed. */}
                         {React.cloneElement(game.icon, { className: "w-48 h-48" })}
                    </div>

                    {/* CCTV Feed Window */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2">
                        <div className="flex flex-col items-center gap-2">
                             <div className="relative p-1 bg-zinc-950 border-2 border-white/10 rounded-sm shadow-2xl">
                                <GameBoardCCTV type={game.gameType} />
                                <div className="absolute -top-3 -left-3 bg-red-600 px-1 py-0.5 rounded-sm">
                                    <span className="text-[5px] font-black text-white uppercase animate-pulse">REC</span>
                                </div>
                             </div>
                             <span className="text-[6px] font-black text-white/40 tracking-[0.4em] uppercase font-mono">{game.cameraId}</span>
                        </div>
                    </div>

                    {/* Logo Area */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[7px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm uppercase tracking-widest border border-emerald-500/20">
                               {game.protocol}
                            </span>
                        </div>
                        
                        <h3 className="text-sm sm:text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {game.title}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-[6px] sm:text-[8px] font-bold text-zinc-400 uppercase tracking-widest italic line-clamp-1">
                                Inspired by {game.inspiredBy}
                            </span>
                        </div>
                    </div>

                    {/* Overlay effects */}
                    <div className="absolute inset-0 bg-black/10 group-hover/card:bg-transparent transition-colors duration-500 pointer-events-none" />
                    <div className="absolute inset-0 opacity-20 pointer-events-none cctv-overlay" />
                </div>
            </button>

            {/* Favorite Star */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(game.id); }}
                className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all z-30 active:scale-75
                    ${isFavorite ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' : 'bg-black/40 text-zinc-600 hover:text-white border border-white/5'}`}
            >
                <StarIcon className="w-3.5 h-3.5" filled={isFavorite} />
            </button>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const { credits, setShowShop, onSelect, favoriteGameIds, onToggleFavorite } = props;

    const games: GameInfo[] = [
        { 
            id: 'neon_signal', title: 'NEON SIGNAL', protocol: 'GYRO_SYNC', inspiredBy: 'Heads Up!',
            description: 'Forehead-mount physical modulation simulation.',
            icon: <RadioIcon />, posterColor: 'from-blue-600 to-indigo-900', cameraId: 'S_01_FEED', gameType: 'gyro', scoreKey: 'neon_signal'
        },
        { 
            id: 'synapse_link', title: 'SYNAPSE LINK', protocol: 'LOGIC_CLUSTER', inspiredBy: 'Connections',
            description: 'Decipher synaptic word clusters.',
            icon: <ListIcon />, posterColor: 'from-amber-600 to-red-900', cameraId: 'S_02_FEED', gameType: 'connections', scoreKey: 'synapse_link'
        },
        { 
            id: 'cipher_core', title: 'CIPHER CORE', protocol: 'BIT_SEQUENCE', inspiredBy: 'Wordle',
            description: 'Daily signal decryption routine.',
            icon: <WalkieTalkieIcon />, posterColor: 'from-emerald-600 to-cyan-900', cameraId: 'S_03_FEED', gameType: 'wordle', isDaily: true
        },
        { 
            id: 'hangman', title: 'SIGNAL BREACH', protocol: 'CORE_SHIELD', inspiredBy: 'Hangman',
            description: 'Defend the core from critical leak.',
            icon: <BoltIcon />, posterColor: 'from-red-600 to-rose-900', cameraId: 'S_04_FEED', gameType: 'hangman', scoreKey: 'hangman' as any
        },
        { 
            id: 'grid_reset', title: 'GRID RESET', protocol: 'MODULE_FLIP', inspiredBy: 'Lights Out',
            description: 'Achieve 100% grid blackout.',
            icon: <CpuChipIcon />, posterColor: 'from-purple-600 to-indigo-950', cameraId: 'S_05_FEED', gameType: 'grid', scoreKey: 'grid_reset'
        },
        { 
            id: 'sudoku', title: 'PATTERN ZERO', protocol: 'GRID_LOGIC', inspiredBy: 'Sudoku',
            description: 'Stabilize deterministic patterns.',
            icon: <KeypadIcon />, posterColor: 'from-cyan-600 to-blue-950', cameraId: 'S_06_FEED', gameType: 'sudoku', scoreKey: 'sudoku_medium'
        },
        { 
            id: 'void_runner', title: 'VOID RUNNER', protocol: 'PATH_RECON', inspiredBy: 'Pac-Man',
            description: 'Evade sentinels, collect packets.',
            icon: <SparklesIcon />, posterColor: 'from-emerald-700 to-zinc-950', cameraId: 'S_07_FEED', gameType: 'pacman', scoreKey: 'void_runner'
        },
        { 
            id: 'minesweeper', title: 'ANOMALY DETECTOR', protocol: 'HAZARD_ID', inspiredBy: 'Minesweeper',
            description: 'Isolate signal fractures.',
            icon: <EntityIcon />, posterColor: 'from-red-700 to-black', cameraId: 'S_08_FEED', gameType: 'minesweeper', scoreKey: 'minesweeper_medium'
        },
        { 
            id: 'solitaire', title: 'SIGNAL ALIGN', protocol: 'DATA_STACK', inspiredBy: 'Solitaire',
            description: 'Re-order frequency stacks.',
            icon: <RadioIcon />, posterColor: 'from-zinc-700 to-black', cameraId: 'S_09_FEED', gameType: 'cards', scoreKey: 'solitaire'
        },
        { 
            id: 'tetris', title: 'STACK TRACE', protocol: 'BUFFER_FILL', inspiredBy: 'Tetris',
            description: 'Compact falling data blocks.',
            icon: <ControllerIcon />, posterColor: 'from-indigo-600 to-zinc-900', cameraId: 'S_10_FEED', gameType: 'tetris', scoreKey: 'tetris'
        }
    ];

    const sortedGames = useMemo(() => {
        return [...games].sort((a, b) => {
            const aFav = favoriteGameIds.has(a.id);
            const bFav = favoriteGameIds.has(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });
    }, [games, favoriteGameIds]);

    return (
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-black p-4 md:p-12 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide font-mono">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-emerald-600 border border-white/20 shadow-[4px_4px_0px_#111]">
                            <ControllerIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none glitch-text">VOID_ARCADE</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-emerald-500 font-bold uppercase text-[9px] md:text-xs">Sector Select</span>
                                <div className="h-px w-8 bg-white/20" />
                                <span className="text-zinc-600 font-black uppercase text-[8px] md:text-[10px] italic tracking-widest">v1.8.4_ENCRYPTED</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div onClick={() => setShowShop(true)} className="bg-zinc-900 px-4 py-2 border-2 border-emerald-500/20 hover:border-emerald-500 transition-all cursor-pointer flex items-center gap-3 active:scale-95 group">
                            <SparklesIcon className="w-4 h-4 text-emerald-500 group-hover:animate-pulse" />
                            <span className="text-sm md:text-lg font-black italic text-white">{credits.toLocaleString()} <span className="text-[10px] text-zinc-500">SC</span></span>
                        </div>
                        <button onClick={props.onReturnToFeeds} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase italic tracking-widest hover:bg-pulse-500 hover:text-white transition-all shadow-[4px_4px_0px_#e11d48]">Abort_Sim</button>
                    </div>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 pb-32">
                    {sortedGames.map(game => (
                        <CabinetPoster 
                            key={game.id} 
                            game={game} 
                            onPlay={() => onSelect(game.id)} 
                            isFavorite={favoriteGameIds.has(game.id)}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))}
                </div>
            </div>
            
            <div className="fixed bottom-24 right-8 pointer-events-none opacity-20 hidden lg:block">
                <span className="text-[8px] font-black text-white uppercase tracking-[1em] italic">DPAD_NAVIGATION_ENABLED</span>
            </div>
        </main>
    );
};

export default GameHubPage;
