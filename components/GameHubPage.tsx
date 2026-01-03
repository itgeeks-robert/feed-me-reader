import React, { useMemo } from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, XIcon, ListIcon, CpuChipIcon, BoltIcon, StarIcon, ContrastIcon, WandIcon, PaletteIcon, SkinsIcon, StyleIcon, GlobeAltIcon } from './icons';
import { getHighScores, ScoreCategory } from '../services/highScoresService';
import ContextualIntel from './ContextualIntel';
import { Theme } from '../src/App';

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
    glowColor: string;
}

const ThemeIcon: React.FC<{ className?: string }> = ({ className }) => {
    return <PaletteIcon className={className} />;
};

const CabinetGraphicPattern: React.FC<{ type: string; color: string }> = ({ type, color }) => {
    switch (type) {
        case 'gyro':
            return (
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute w-[150%] h-4 -rotate-12 blur-[1px]" 
                             style={{ backgroundColor: color, opacity: 0.25, top: `${20 * i}%`, left: '-25%', boxShadow: `0 0 20px ${color}` }} />
                    ))}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${color}, ${color} 1px, transparent 1px, transparent 10px)` }} />
                </div>
            );
        case 'connections':
            return (
                <div className="absolute inset-0 overflow-hidden opacity-30">
                    <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 2px, transparent 0)`, backgroundSize: '16px 16px' }} />
                </div>
            );
        case 'wordle':
            return (
                <div className="absolute inset-0 flex justify-around opacity-30">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1.5 h-full blur-[1px]" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                    ))}
                </div>
            );
        case 'hangman':
            return (
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 15px, transparent 15px, transparent 30px)` }}>
                    <div className="absolute inset-0 bg-black/20" />
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
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-white/80" />
                        <div className="absolute bottom-0 left-3 w-3 h-3 bg-white/80" />
                        <div className="absolute bottom-3 left-1.5 w-3 h-3 bg-white/80" />
                    </div>
                );
            default:
                return <ControllerIcon className="w-8 h-8 opacity-40 text-emerald-500" />;
        }
    };

    return (
        <div className="relative p-1.5 bg-black border-2 border-zinc-700 shadow-[inset_0_0_20px_rgba(0,255,0,0.2)]">
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
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" 
                 style={{ backgroundColor: game.accentColor }} />

            <button 
                onClick={onPlay}
                onKeyDown={(e) => {
                    if(e.key === 'ArrowUp') {
                        // Attempt to move back to hub header if at the top of the grid
                        const posters = document.querySelectorAll('.cabinet-grid button');
                        const index = Array.from(posters).indexOf(e.currentTarget);
                        if (index < 5) { // Assuming 5 columns
                            e.preventDefault();
                            (document.querySelector('header button') as HTMLElement)?.focus();
                        }
                    }
                }}
                className="w-full h-full text-left relative bg-zinc-900 border-[3px] border-void-border rounded-void overflow-hidden shadow-2xl transition-all duration-500 outline-none focus:ring-8 focus:ring-pulse-500 focus:scale-105 hover:scale-105 hover:z-10 group"
            >
                <div className={`absolute inset-0 ${game.artStyle} opacity-90 group-hover:opacity-100 transition-opacity`}>
                    <CabinetGraphicPattern type={game.gameType} color={game.accentColor} />
                    
                    <div className="absolute -right-6 -bottom-6 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                         {React.cloneElement(game.icon, { className: "w-40 h-40 md:w-56 md:h-56" })}
                    </div>

                    <div className="absolute top-4 left-4 z-20">
                         <div className="relative p-1 bg-black border-[2px] border-white/10 rounded-sm shadow-2xl">
                            <GameBoardCCTV type={game.gameType} />
                         </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-black/90 backdrop-blur-md border-t border-white/5">
                    <div className="mb-2">
                         <span className="text-[7px] md:text-[8px] font-black text-white px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-lg" style={{ backgroundColor: game.accentColor }}>
                            {game.protocol}
                        </span>
                    </div>
                    
                    <h3 className="text-sm sm:text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 line-clamp-1">
                        {game.title}
                    </h3>
                    
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">
                            Inspired by
                        </span>
                        <span className="text-[7px] md:text-[9px] font-black text-zinc-300 uppercase tracking-tighter truncate">
                            {game.inspiredBy}
                        </span>
                    </div>
                </div>

                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(game.id); }}
                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xl transition-all z-30 active:scale-75 shadow-2xl outline-none focus:ring-4 focus:ring-yellow-400
                    ${isFavorite ? 'bg-yellow-500 text-black border-2 border-white' : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'}`}
            >
                <StarIcon className="w-4 h-4" filled={isFavorite} />
            </button>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const { onSelect, favoriteGameIds, onToggleFavorite, theme, onToggleTheme } = props;

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
            accentColor: '#e4e4e4', glowColor: '#71717a', artStyle: 'bg-zinc-900'
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
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-void-bg p-4 md:p-14 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide font-mono main-content-area">
            <ContextualIntel 
                tipId="arcade_intel" 
                title="The Void Arcade" 
                content="Engage with technical simulations to maintain neural sync. Use favorites to pin your most frequent nodes for rapid access." 
            />
            
            <div className="fixed inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(var(--void-text-main) 1px, transparent 1px), linear-gradient(90deg, var(--void-text-main) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,var(--void-accent-deep)_0%,transparent_70%)] opacity-20" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-void-border pb-8 md:pb-10">
                    <div className="flex items-center gap-6 md:gap-8">
                        <div className="p-3 md:p-4 bg-pulse-500 border-2 border-white/20 shadow-2xl rotate-3 rounded-void">
                            <ControllerIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-7xl font-black text-terminal tracking-tighter uppercase italic leading-none drop-shadow-md">VOID_ARCADE</h1>
                            <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-4">
                                <span className="text-pulse-500 font-black uppercase text-[9px] md:text-sm bg-void-surface px-3 py-1 rounded-sm border border-void-border">Unit_Selection</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4">
                        <button 
                            onClick={onToggleTheme} 
                            onKeyDown={(e) => { if(e.key === 'ArrowDown') { e.preventDefault(); (document.querySelector('.cabinet-grid button') as HTMLElement)?.focus(); } }}
                            className="p-3 bg-void-surface rounded-2xl text-muted border border-void-border active:scale-90 transition-transform hover:text-pulse-500 shadow-xl focus:ring-4 focus:ring-pulse-500 outline-none"
                        >
                            <ThemeIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={props.onReturnToFeeds} 
                            onKeyDown={(e) => { if(e.key === 'ArrowDown') { e.preventDefault(); (document.querySelector('.cabinet-grid button') as HTMLElement)?.focus(); } }}
                            className="px-8 py-3 bg-terminal text-inverse text-xs font-black uppercase italic tracking-widest hover:bg-pulse-500 hover:text-white transition-all shadow-xl rounded-void border border-void-border focus:ring-4 focus:ring-pulse-500 outline-none"
                        >
                            Exit
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-10 pb-40 cabinet-grid">
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
        </main>
    );
};

export default GameHubPage;