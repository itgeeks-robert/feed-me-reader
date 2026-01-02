import React, { useMemo } from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, XIcon, ListIcon, CpuChipIcon, BoltIcon, StarIcon } from './icons';
import { getHighScores, ScoreCategory } from '../services/highScoresService';

interface GameInfo {
    id: string;
    title: string;
    protocol: string; 
    inspiredBy: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    cameraId: string;
    gameType: 'sudoku' | 'tetris' | 'minesweeper' | 'pacman' | 'wordle' | 'connections' | 'cards' | 'gyro' | 'hangman' | 'grid';
    scoreKey?: ScoreCategory;
    isDaily?: boolean;
    artStyle: string; 
    accentColor: string;
    glowColor: string; // Tailored glow for the backlit effect
}

const CabinetGraphicPattern: React.FC<{ type: string; color: string }> = ({ type, color }) => {
    // Increased opacities and added glow layers for maximum visibility
    switch (type) {
        case 'gyro': // Neon Signal - Electric Waves
            return (
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute w-[150%] h-4 -rotate-12 blur-[1px]" 
                             style={{ backgroundColor: color, opacity: 0.25, top: `${20 * i}%`, left: '-25%', boxShadow: `0 0 20px ${color}` }} />
                    ))}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${color}, ${color} 1px, transparent 1px, transparent 10px)` }} />
                </div>
            );
        case 'connections': // Synapse Link - Neural Clusters
            return (
                <div className="absolute inset-0 overflow-hidden opacity-30">
                    <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 2px, transparent 0)`, backgroundSize: '16px 16px' }} />
                    <div className="absolute inset-0 blur-sm" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 4px, transparent 0)`, backgroundSize: '32px 32px' }} />
                </div>
            );
        case 'wordle': // Cipher Core - Matrix Bits
            return (
                <div className="absolute inset-0 flex justify-around opacity-30">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1.5 h-full blur-[1px]" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                    ))}
                </div>
            );
        case 'hangman': // Signal Breach - Hazard Stripes
            return (
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 15px, transparent 15px, transparent 30px)` }}>
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            );
        case 'sudoku': // Pattern Zero - Technical Blueprint
            return (
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`, backgroundSize: '30px 30px' }} />
            );
        case 'pacman': // Void Runner - Velocity Streaks
            return (
                <div className="absolute inset-0 opacity-40">
                     <div className="absolute top-[30%] left-0 w-full h-1" style={{ backgroundColor: color, boxShadow: `0 0 25px ${color}` }} />
                     <div className="absolute top-[50%] left-0 w-full h-2" style={{ backgroundColor: color, boxShadow: `0 0 30px ${color}` }} />
                     <div className="absolute top-[70%] left-0 w-full h-1" style={{ backgroundColor: color, boxShadow: `0 0 25px ${color}` }} />
                </div>
            );
        case 'grid': // Grid Reset
             return (
                <div className="absolute inset-0 opacity-30">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className="absolute border-4 rounded-full -translate-x-1/2 -translate-y-1/2" 
                             style={{ borderColor: color, width: `${(i+1)*80}px`, height: `${(i+1)*80}px`, top: '50%', left: '50%', boxShadow: `inset 0 0 20px ${color}` }} />
                     ))}
                </div>
             );
        case 'tetris': // Stack Trace
            return (
                <div className="absolute inset-0 opacity-30 grid grid-cols-4 gap-2 p-2">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="border-2 border-white/10" style={{ backgroundColor: i % 3 === 0 ? color : 'transparent' }} />
                    ))}
                </div>
            );
        default:
            return <div className="absolute inset-0 opacity-10 bg-white/10" />;
    }
};

const GameBoardCCTV: React.FC<{ type: string }> = ({ type }) => {
    const renderBoard = () => {
        switch (type) {
            case 'sudoku':
                return (
                    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-12 h-12 border border-white/20">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/10 flex items-center justify-center text-[5px] font-black text-emerald-500">{i + 1}</div>
                        ))}
                    </div>
                );
            case 'tetris':
                return (
                    <div className="w-10 h-14 border border-white/20 relative">
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-white/80 border border-white/10" />
                        <div className="absolute bottom-0 left-3 w-3 h-3 bg-white/80 border border-white/10" />
                        <div className="absolute bottom-3 left-1.5 w-3 h-3 bg-white/80 border border-white/10" />
                        <div className="absolute top-2 left-4 w-3 h-6 bg-emerald-500 border border-emerald-500/20" />
                    </div>
                );
            case 'minesweeper':
                return (
                    <div className="grid grid-cols-5 grid-rows-5 gap-px w-12 h-12">
                        {[...Array(25)].map((_, i) => (
                            <div key={i} className={`w-full h-full border border-white/5 ${Math.random() > 0.8 ? 'bg-red-500' : 'bg-white/20'}`} />
                        ))}
                    </div>
                );
            default:
                return <ControllerIcon className="w-8 h-8 opacity-40 text-emerald-500" />;
        }
    };

    return (
        <div className="relative p-1.5 bg-black border-2 border-zinc-700 shadow-[inset_0_0_20px_rgba(0,255,0,0.2)] group-focus:scale-110 group-hover:scale-110 transition-transform duration-700">
            {renderBoard()}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(34,197,94,0.1)_2px,rgba(34,197,94,0.1)_4px)] pointer-events-none" />
        </div>
    );
};

const CabinetPoster: React.FC<{ 
    game: GameInfo; 
    onPlay: () => void; 
    isFavorite: boolean; 
    onToggleFavorite: (id: string) => void; 
}> = ({ game, onPlay, isFavorite, onToggleFavorite }) => {
    return (
        <div className="relative group aspect-[2/3] sm:aspect-[3/4] transition-all duration-300">
            {/* AMBIENT LIGHT SPILL BENEATH CABINET */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" 
                 style={{ backgroundColor: game.accentColor }} />

            <button 
                onClick={onPlay}
                className="w-full h-full text-left relative bg-zinc-900 border-[3px] border-zinc-800 rounded-xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all duration-500 outline-none focus:ring-4 focus:ring-emerald-500 focus:scale-105 hover:scale-105 hover:z-10 group"
            >
                {/* CABINET BODY */}
                <div className={`absolute inset-0 ${game.artStyle}`}>
                    
                    {/* BACKLIT SILK-SCREEN PATTERN */}
                    <CabinetGraphicPattern type={game.gameType} color={game.accentColor} />
                    
                    {/* CABINET T-MOLDING (Plastic Edge Highlight) */}
                    <div className="absolute inset-0 border-t border-l border-white/10 pointer-events-none z-30" />
                    <div className="absolute inset-0 border-b-4 border-r-4 border-black/40 pointer-events-none z-30" />

                    {/* LARGE ICON SHADOW (Increased contrast) */}
                    <div className="absolute -right-6 -bottom-6 opacity-20 group-focus:opacity-50 group-hover:opacity-50 transition-opacity drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                         {React.cloneElement(game.icon, { className: "w-40 h-40 md:w-56 md:h-56" })}
                    </div>

                    {/* CCTV MONITOR WINDOW */}
                    <div className="absolute top-4 left-4 z-20">
                        <div className="flex flex-col gap-1.5 md:gap-2">
                             <div className="relative p-1 bg-zinc-950 border-[2px] md:border-[3px] border-zinc-800 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.9)]">
                                <GameBoardCCTV type={game.gameType} />
                                <div className="absolute -top-2 -right-2 bg-red-600 px-1 py-0.5 rounded-sm shadow-lg border border-white/20">
                                    <span className="text-[5px] font-black text-white uppercase animate-pulse">LIVE</span>
                                </div>
                             </div>
                             <span className="text-[6px] md:text-[7px] font-black text-white/50 tracking-[0.3em] uppercase font-mono bg-black/40 px-1 py-0.5 self-start">{game.cameraId}</span>
                        </div>
                    </div>

                    {/* LOGO AREA (Fixed truncation logic) */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
                        <div className="mb-2">
                             <span className="text-[7px] md:text-[8px] font-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-lg" style={{ backgroundColor: game.accentColor }}>
                                {game.protocol}
                            </span>
                        </div>
                        
                        <h3 className="text-sm sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1 drop-shadow-[0_4px_4px_rgba(0,0,0,1)] line-clamp-1">
                            {game.title}
                        </h3>
                        
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <div className="bg-zinc-800 px-1.5 py-0.5 rounded-sm border border-white/10">
                                    <span className="text-[6px] md:text-[7px] font-black text-zinc-300 uppercase italic">V_84</span>
                                </div>
                                <span className="text-[7px] md:text-[8px] font-bold text-zinc-400 uppercase tracking-wider italic leading-tight">
                                    Inspired by
                                </span>
                            </div>
                            <span className="text-[7px] md:text-[8px] font-black text-zinc-300 uppercase tracking-widest leading-tight block truncate">
                                {game.inspiredBy}
                            </span>
                        </div>
                    </div>

                    {/* VINYL TEXTURE & DUST */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none mix-blend-overlay" />
                    <div className="absolute inset-0 bg-black/10 group-focus:bg-transparent group-hover:bg-transparent transition-colors pointer-events-none" />
                </div>
            </button>

            {/* Favorite Star */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(game.id); }}
                className={`absolute top-3 right-3 p-2 md:p-2.5 rounded-full backdrop-blur-xl transition-all z-30 active:scale-75 shadow-2xl
                    ${isFavorite ? 'bg-yellow-500 text-black border-2 border-white' : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'}`}
            >
                <StarIcon className="w-4 h-4 md:w-4.5 md:h-4.5" filled={isFavorite} />
            </button>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const { credits, setShowShop, onSelect, favoriteGameIds, onToggleFavorite } = props;

    const games: GameInfo[] = [
        { 
            id: 'neon_signal', title: 'NEON SIGNAL', protocol: 'GYRO_SYNC', inspiredBy: 'Heads Up!',
            description: 'Physical modulation simulation.',
            icon: <RadioIcon />, cameraId: 'FEED_01', gameType: 'gyro', scoreKey: 'neon_signal',
            accentColor: '#38bdf8', glowColor: '#0ea5e9', artStyle: 'bg-sky-950'
        },
        { 
            id: 'synapse_link', title: 'SYNAPSE LINK', protocol: 'LOGIC_CLUSTER', inspiredBy: 'Connections',
            description: 'Synaptic cluster analysis.',
            icon: <ListIcon />, cameraId: 'FEED_02', gameType: 'connections', scoreKey: 'synapse_link',
            accentColor: '#fbbf24', glowColor: '#f59e0b', artStyle: 'bg-amber-950'
        },
        { 
            id: 'cipher_core', title: 'CIPHER CORE', protocol: 'BIT_SEQUENCE', inspiredBy: 'Wordle',
            description: 'Daily signal decryption.',
            icon: <WalkieTalkieIcon />, cameraId: 'FEED_03', gameType: 'wordle', isDaily: true,
            accentColor: '#10b981', glowColor: '#059669', artStyle: 'bg-emerald-950'
        },
        { 
            id: 'hangman', title: 'SIGNAL BREACH', protocol: 'CORE_SHIELD', inspiredBy: 'Hangman',
            description: 'Contain the core leak.',
            icon: <BoltIcon />, cameraId: 'FEED_04', gameType: 'hangman', scoreKey: 'hangman' as any,
            accentColor: '#f43f5e', glowColor: '#e11d48', artStyle: 'bg-rose-950'
        },
        { 
            id: 'grid_reset', title: 'GRID RESET', protocol: 'MODULE_FLIP', inspiredBy: 'Lights Out',
            description: 'Manual node blackout.',
            icon: <CpuChipIcon />, cameraId: 'FEED_05', gameType: 'grid', scoreKey: 'grid_reset',
            accentColor: '#a78bfa', glowColor: '#8b5cf6', artStyle: 'bg-violet-950'
        },
        { 
            id: 'sudoku', title: 'PATTERN ZERO', protocol: 'GRID_LOGIC', inspiredBy: 'Sudoku',
            description: 'Mathematical grid stability.',
            icon: <KeypadIcon />, cameraId: 'FEED_06', gameType: 'sudoku', scoreKey: 'sudoku_medium',
            accentColor: '#22d3ee', glowColor: '#06b6d4', artStyle: 'bg-cyan-950'
        },
        { 
            id: 'void_runner', title: 'VOID RUNNER', protocol: 'PATH_RECON', inspiredBy: 'Pac-Man',
            description: 'Navigate sector architectures.',
            icon: <SparklesIcon />, cameraId: 'FEED_07', gameType: 'pacman', scoreKey: 'void_runner',
            accentColor: '#fcd34d', glowColor: '#fbbf24', artStyle: 'bg-yellow-950'
        },
        { 
            id: 'minesweeper', title: 'ANOMALY DETECTOR', protocol: 'HAZARD_ID', inspiredBy: 'Minesweeper',
            description: 'Isolate signal fractures.',
            icon: <EntityIcon />, cameraId: 'FEED_08', gameType: 'minesweeper', scoreKey: 'minesweeper_medium',
            accentColor: '#fb7185', glowColor: '#f43f5e', artStyle: 'bg-rose-950'
        },
        { 
            id: 'solitaire', title: 'SIGNAL ALIGN', protocol: 'DATA_STACK', inspiredBy: 'Solitaire',
            description: 'Sorting frequency packets.',
            icon: <RadioIcon />, cameraId: 'FEED_09', gameType: 'cards', scoreKey: 'solitaire',
            accentColor: '#e4e4e7', glowColor: '#71717a', artStyle: 'bg-zinc-900'
        },
        { 
            id: 'tetris', title: 'STACK TRACE', protocol: 'BUFFER_FILL', inspiredBy: 'Tetris',
            description: 'Consolidate data line buffers.',
            icon: <ControllerIcon />, cameraId: 'FEED_10', gameType: 'tetris', scoreKey: 'tetris',
            accentColor: '#60a5fa', glowColor: '#3b82f6', artStyle: 'bg-blue-950'
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
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-zinc-950 p-4 md:p-14 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide font-mono">
            {/* ARCADE FLOOR GRID EFFECT */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(225,29,72,0.05)_0%,transparent_70%)]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-white/5 pb-8 md:pb-10">
                    <div className="flex items-center gap-6 md:gap-8">
                        <div className="p-3 md:p-4 bg-emerald-600 border-2 border-white/20 shadow-[6px_6px_0px_black] rotate-3">
                            <ControllerIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">VOID_ARCADE</h1>
                            <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-4">
                                <span className="text-emerald-500 font-black uppercase text-[9px] md:text-sm bg-emerald-950/50 px-2 py-0.5 md:px-3 md:py-1 rounded-sm border border-emerald-500/30">Select Unit</span>
                                <div className="h-px w-6 md:w-10 bg-white/20" />
                                <span className="text-zinc-600 font-black uppercase text-[8px] md:text-[10px] italic tracking-widest">v1.8.4_STABLE</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4">
                        <div onClick={() => setShowShop(true)} className="bg-zinc-900 px-4 py-2 md:px-6 md:py-3 border-2 border-emerald-500/40 hover:border-emerald-500 transition-all cursor-pointer flex items-center gap-3 md:gap-4 active:scale-95 group shadow-2xl">
                            <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 group-hover:animate-pulse" />
                            <span className="text-base md:text-2xl font-black italic text-white leading-none">{credits.toLocaleString()} <span className="text-[10px] text-zinc-500">SC</span></span>
                        </div>
                        <button onClick={props.onReturnToFeeds} className="px-6 py-2 md:px-8 md:py-3 bg-white text-black text-[10px] md:text-xs font-black uppercase italic tracking-widest hover:bg-pulse-500 hover:text-white transition-all shadow-[4px_4px_0px_#e11d48]">Eject_Rec</button>
                    </div>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-10 pb-40">
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
            
            <div className="fixed bottom-28 right-10 pointer-events-none opacity-20 hidden lg:block">
                <span className="text-[10px] font-black text-white uppercase tracking-[1em] italic">WIRELESS_INPUT_ENABLED</span>
            </div>
        </main>
    );
};

export default GameHubPage;