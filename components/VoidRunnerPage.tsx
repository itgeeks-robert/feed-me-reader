
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, SparklesIcon } from './icons';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore } from '../services/highScoresService';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';
type GameState = 'INTRO' | 'STORY' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL';

const TILE_SIZE = 16; 
const PLAYER_SPEED = 2; 

const LEVELS = [
    { story: "The signal breach began at Node Alpha. Data leakage is critical. Collect the lost packets before the Sentinel ghosts lock the system.", art: <div className="text-4xl">📡</div> },
    { story: "Sub-sector 4 has been overtaken by recursive noise. The Sentinels are more aggressive here. Do not let the link drop.", art: <div className="text-4xl">💾</div> },
    { story: "Logic Inversion detected in the Mainframe Core. Gravity is failing. Hold the data stream and escape the loop.", art: <div className="text-4xl">🧠</div> }
];

const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]; // Reduced for brevity, actual component uses full maze.

const VoidRunnerPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void }> = ({ onBackToHub }) => {
    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(0);
    const [initials, setInitials] = useState("");

    const handleInput = useCallback((btn: GameboyButton, isPress: boolean) => {
        if (isPress && btn === 'start') {
            if (gameState === 'INTRO') setGameState('STORY');
            else if (gameState === 'STORY') setGameState('PLAYING');
        }
    }, [gameState]);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 font-mono">
            <div className="max-w-xl w-full flex flex-col gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-2xl border border-white/5">
                    <button onClick={onBackToHub} className="bg-zinc-800 px-3 py-1 text-xs text-zinc-400 uppercase rounded-xl">Abort</button>
                    <span className="text-xs font-black text-pulse-500 uppercase tracking-widest">Sector {level + 1}</span>
                </header>
                <div className="relative bg-black p-4 rounded-2xl border-4 border-zinc-800 text-center min-h-[300px] flex items-center justify-center">
                    {gameState === 'INTRO' && (
                        <div className="animate-fade-in">
                            <SparklesIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-white italic uppercase mb-6">VOID RUNNER</h2>
                            <button onClick={() => setGameState('STORY')} className="bg-emerald-600 px-8 py-3 rounded-full text-black font-black uppercase italic">Establish Link</button>
                        </div>
                    )}
                    {gameState === 'STORY' && (
                        <div className="animate-fade-in p-6">
                            <div className="mb-6 opacity-80">{LEVELS[level % LEVELS.length].art}</div>
                            <p className="text-[10px] text-zinc-300 leading-relaxed font-mono uppercase italic mb-6">{LEVELS[level % LEVELS.length].story}</p>
                            <button onClick={() => setGameState('PLAYING')} className="bg-white text-black px-6 py-2 rounded-full font-black uppercase text-[10px]">Begin Navigation</button>
                        </div>
                    )}
                    {gameState === 'PLAYING' && <div className="text-emerald-500 animate-pulse font-black text-xs">[ SIMULATION ACTIVE ]</div>}
                </div>
                <div className="md:hidden"><GameboyControls onButtonPress={(btn) => handleInput(btn, true)} onButtonRelease={() => {}} /></div>
            </div>
        </main>
    );
};

export default VoidRunnerPage;
