import React, { useMemo } from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, XIcon, ListIcon, CpuChipIcon, BoltIcon, StarIcon, PaletteIcon } from './icons';
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

const CabinetPoster: React.FC<{ 
    game: GameInfo; 
    onPlay: () => void; 
    isFavorite: boolean; 
    onToggleFavorite: (id: string) => void; 
}> = ({ game, onPlay, isFavorite, onToggleFavorite }) => {
    return (
        <div className="relative group cabinet-poster aspect-[2/3] sm:aspect-[3/4]">
            <button 
                onClick={onPlay}
                className="w-full h-full text-left relative bg-zinc-900 border-[3px] border-void-border overflow-hidden shadow-2xl transition-all duration-300 outline-none focus:ring-8 focus:ring-pulse-500 hover:z-10 flex flex-col"
            >
                <div className={`relative flex-grow ${game.artStyle} opacity-90 group-hover:opacity-100 transition-opacity overflow-hidden image-halftone-overlay`}>
                    <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                         {React.cloneElement(game.icon, { className: "w-40 h-40 md:w-56 md:h-56" })}
                    </div>
                    
                    <div className="absolute top-4 left-4 z-20">
                         <span className="text-[7px] md:text-[9px] font-black text-white px-2 py-1 rounded-sm uppercase tracking-[0.2em] shadow-xl" style={{ backgroundColor: game.accentColor }}>
                            {game.protocol}
                        </span>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-app-card border-t-4 border-zinc-950">
                    <h3 className="text-base sm:text-xl font-black text-app-text italic uppercase tracking-tighter leading-none mb-1 line-clamp-1">
                        {game.title}
                    </h3>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic truncate opacity-60">
                        {game.description}
                    </p>
                </div>
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(game.id); }}
                className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl transition-all z-30 active:scale-75 shadow-lg
                    ${isFavorite ? 'bg-yellow-500 text-black border-2 border-white' : 'bg-black/40 text-zinc-400 hover:text-white border border-white/10'}`}
            >
                <StarIcon className="w-4 h-4" filled={isFavorite} />
            </button>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const { onSelect, favoriteGameIds, onToggleFavorite, theme, onToggleTheme } = props;

    const themeLabel = useMemo(() => {
        switch(theme) {
            case 'liquid-glass': return 'GLASS';
            case 'bento-grid': return 'BENTO';
            case 'monochrome-zen': return 'ZEN';
            case 'claymorphism': return 'CLAY';
            case 'brutalist': return 'BRUTAL';
            default: return theme.toUpperCase();
        }
    }, [theme]);

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
                content="Engage with technical simulations to maintain neural sync. In Comic mode, look for the skewed panels representing your active session blocks." 
            />
            
            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-8 border-zinc-950 pb-8 md:pb-10">
                    <div className="flex items-center gap-6 md:gap-8">
                        <div className="p-3 md:p-4 bg-pulse-500 border-4 border-zinc-950 shadow-[8px_8px_0_black] -rotate-3">
                            <ControllerIcon className="w-8 h-8 md:w-12 md:h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-8xl font-black text-app-text tracking-tighter uppercase italic leading-none drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]">VOID_ARCADE</h1>
                            <div className="flex items-center gap-3 mt-4">
                                <span className="bg-app-accent text-white font-black uppercase text-[10px] md:text-sm px-4 py-1 italic tracking-widest shadow-[4px_4px_0_black]">Simulation_Active</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={onToggleTheme} className="flex items-center gap-3 p-4 bg-app-card border-4 border-zinc-950 rounded-2xl text-zinc-500 hover:text-app-accent shadow-[6px_6px_0_black] active:translate-x-1 active:translate-y-1 transition-all focus:ring-4 focus:ring-pulse-500 outline-none">
                            <PaletteIcon className="w-6 h-6 md:w-8 md:h-8" />
                            <span className="text-xs font-black uppercase italic tracking-widest hidden sm:inline">{themeLabel}</span>
                        </button>
                        <button onClick={props.onReturnToFeeds} className="px-10 py-4 bg-app-text text-app-bg text-sm font-black uppercase italic tracking-widest hover:bg-app-accent hover:text-white transition-all shadow-[8px_8px_0_black] active:translate-x-1 active:translate-y-1 focus:ring-4 focus:ring-pulse-500 outline-none">
                            Exit
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-12 pb-40 cabinet-grid">
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