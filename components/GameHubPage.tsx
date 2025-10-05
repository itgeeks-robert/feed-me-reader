import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import type { SudokuStats, SudokuDifficulty, SolitaireStats, SolitaireSettings } from '../src/App';

import SudokuPage from './SudokuPage';
import SolitairePage from './SolitairePage';
import MinesweeperPage from './MinesweeperPage';
import TetrisPage from './TetrisPage';
import PoolGamePage from './PoolGamePage';
import MarioPage from './MarioPage';
import { ControllerIcon, BrainIcon, CubeIcon, MushroomIcon, TetrisTBlockIcon, SeymourIcon, FlagIcon, CubeTransparentIcon } from './icons';

// --- CHRONO ECHOES GAME ---
// The original GameHubPage content is preserved here as a standalone game component.
const ChronoEchoesGame: React.FC<{ onReturnToFeeds: () => void, onBackToHub: () => void }> = ({ onReturnToFeeds, onBackToHub }) => {
    const [gamePhase, setGamePhase] = useState<'TITLE' | 'PLAYING'>('TITLE');

    if (gamePhase === 'TITLE') {
        return <ChronoEchoesTitleScreen onStartGame={() => setGamePhase('PLAYING')} />;
    }

    return <ChronoEchoesGameScreen onReturnToFeeds={onReturnToFeeds} onBackToHub={onBackToHub} />;
};

const chronoEchoesStyles: { [key: string]: React.CSSProperties } = {
  gameContainer: { width: '100%', height: '100%', backgroundColor: '#1a1a1a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' },
  canvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', imageRendering: 'pixelated' },
  uiContainer: { position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' },
  dPad: { position: 'relative', width: '150px', height: '150px', pointerEvents: 'auto' },
  dPadButton: { position: 'absolute', width: '50px', height: '50px', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '10px' },
  actionButtons: { display: 'flex', gap: '20px', pointerEvents: 'auto' },
  actionButton: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white', border: '3px solid rgba(255, 255, 255, 0.5)' },
  dialogueBox: { position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: '800px', minHeight: '100px', backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '3px solid #6c5ce7', borderRadius: '10px', color: 'white', padding: '20px', fontSize: '18px', fontFamily: 'monospace', boxShadow: '0 0 15px rgba(108, 92, 231, 0.7)' },
  titleScreen: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)', color: 'white', fontFamily: 'serif' },
  title: { fontSize: '5rem', textShadow: '3px 3px 0px #fd79a8, 6px 6px 0px #a29bfe', marginBottom: '0.5rem' },
  subtitle: { fontSize: '1.5rem', color: '#dfe6e9', marginBottom: '3rem', fontStyle: 'italic' },
  startButton: { fontSize: '1.5rem', padding: '1rem 3rem', backgroundColor: '#fd79a8', color: '#2d3436', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(253, 121, 168, 0.4)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }
};

const ChronoEchoesTitleScreen: React.FC<{ onStartGame: () => void }> = ({ onStartGame }) => (
  <div style={chronoEchoesStyles.titleScreen}>
    <h1 style={chronoEchoesStyles.title}>Chrono Echoes</h1>
    <p style={chronoEchoesStyles.subtitle}>The Shard of Worlds</p>
    <button style={chronoEchoesStyles.startButton} onClick={onStartGame} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>Start Game</button>
  </div>
);
const ChronoEchoesGameScreen: React.FC<{ onReturnToFeeds: () => void, onBackToHub: () => void }> = ({ onReturnToFeeds, onBackToHub }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number>();
    const playerRef = useRef({ x: 100, y: 100, w: 20, h: 20, speed: 3 });
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const [dialogue, setDialogue] = useState<string | null>(null);

    const handleInteraction = useCallback(() => {
        if (dialogue) {
            setDialogue(null);
        } else {
            setDialogue("The air hums with forgotten magic. A path lies east, toward the Whispering Peaks.");
        }
    }, [dialogue]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.code] = true;
            if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); handleInteraction(); }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { e.preventDefault(); }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        
        const gameLoop = () => {
            const player = playerRef.current;
            if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) player.y -= player.speed;
            if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) player.y += player.speed;
            if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) player.x -= player.speed;
            if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) player.x += player.speed;
            player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6ab04c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#2ecc71'; ctx.fillRect(player.x, player.y, player.w, player.h);
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };
        gameLoop();
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [handleInteraction]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
        window.addEventListener('resize', resize); resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div style={chronoEchoesStyles.gameContainer} className="animate-fade-in">
             <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                <button onClick={onBackToHub} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Back to Hub</button>
                <button onClick={onReturnToFeeds} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Back to Feeds</button>
            </div>
            <canvas ref={canvasRef} style={chronoEchoesStyles.canvas} />
            {dialogue && <div style={chronoEchoesStyles.dialogueBox}><p>{dialogue}</p></div>}
        </div>
    );
};


// --- NEW GAME HUB ---

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

type ActiveGame = 'hub' | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool' | 'mario' | 'chrono-echoes';

const GameCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onPlay: () => void }> = ({ icon, title, description, onPlay }) => (
    <div className="bg-zinc-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center group hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1">
        <div className="w-16 h-16 text-orange-400 mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 flex-grow mb-4">{description}</p>
        <button onClick={onPlay} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg transition-colors">
            Play
        </button>
    </div>
);

const GameHubPage: React.FC<GameHubPageProps> = (props) => {
    const [activeGame, setActiveGame] = useState<ActiveGame>('hub');
    const handleBackToHub = useCallback(() => setActiveGame('hub'), []);

    const games = [
        { id: 'sudoku', title: 'Sudoku', description: 'A classic logic puzzle. Fill the grid with numbers 1-9.', icon: <BrainIcon className="w-full h-full" /> },
        { id: 'solitaire', title: 'Solitaire', description: 'The timeless card game of patience and strategy.', icon: <CubeTransparentIcon className="w-full h-full" /> },
        { id: 'minesweeper', title: 'Minesweeper', description: 'Clear the board without detonating any hidden mines.', icon: <FlagIcon className="w-full h-full" /> },
        { id: 'tetris', title: 'Tetris', description: 'Fit the falling blocks to clear lines and score points.', icon: <TetrisTBlockIcon className="w-full h-full" /> },
        { id: 'pool', title: '8-Ball Pool', description: 'A realistic physics-based pool game simulation.', icon: <CubeIcon className="w-full h-full" /> },
        { id: 'mario', title: 'Platformer', description: 'Jump and run in this classic platforming adventure.', icon: <MushroomIcon className="w-full h-full" /> },
        { id: 'chrono-echoes', title: 'Chrono Echoes', description: 'A mini-RPG adventure. Explore a forgotten world.', icon: <SeymourIcon className="w-full h-full" /> }
    ];

    if (activeGame === 'hub') {
        return (
            <div className="flex-grow overflow-y-auto bg-zinc-900 p-4 md:p-8">
                <div className="text-center mb-8">
                    <ControllerIcon className="w-16 h-16 mx-auto text-orange-500 mb-2" />
                    <h1 className="text-4xl font-bold text-white">Game Hub</h1>
                    <p className="text-zinc-400">Select a game to play</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games.map(game => (
                        <GameCard
                            key={game.id}
                            icon={game.icon}
                            title={game.title}
                            description={game.description}
                            onPlay={() => setActiveGame(game.id as ActiveGame)}
                        />
                    ))}
                </div>
            </div>
        );
    }
    
    // Lazy loading is better, but for this exercise, direct rendering is fine to avoid adding files/complexity.
    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white">Loading Game...</div>}>
            {activeGame === 'sudoku' && <SudokuPage stats={props.sudokuStats} onGameWin={props.onSudokuWin} onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'solitaire' && <SolitairePage stats={props.solitaireStats} onGameWin={props.onSolitaireWin} onGameStart={props.onSolitaireStart} settings={props.solitaireSettings} onUpdateSettings={props.onUpdateSolitaireSettings} isApiKeyMissing={props.isApiKeyMissing} onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'minesweeper' && <MinesweeperPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'tetris' && <TetrisPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'pool' && <PoolGamePage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'mario' && <MarioPage onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
            {activeGame === 'chrono-echoes' && <ChronoEchoesGame onBackToHub={handleBackToHub} onReturnToFeeds={props.onReturnToFeeds} />}
        </Suspense>
    );
};

export default GameHubPage;
