import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XIcon, SparklesIcon, FilmIcon, MusicIcon, FireIcon, BeakerIcon, CpuChipIcon, ClockIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import { HANGMAN_DATA, HangmanWord, fetchDynamicHangmanData } from '../services/hangmanData';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

/**
 * NEON SIGNAL: HEADS UP PARTY PROTOCOL v5.1
 * Updated for THE VOID ecosystem.
 */

const GAME_DURATION = 60;
const TILT_THRESHOLD_SYNC = 110; // Facing Ground
const TILT_THRESHOLD_VOID = 50;  // Facing Ceiling

const CATEGORY_CONFIG = [
    { id: 'FILM', name: 'BLOCKBUSTERS', icon: <FilmIcon className="w-5 h-5" />, img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400' },
    { id: 'MUSIC', name: 'TOP CHARTS', icon: <MusicIcon className="w-5 h-5" />, img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400' },
    { id: 'TECH', name: 'CORE TECH', icon: <CpuChipIcon className="w-5 h-5" />, img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400' },
    { id: 'GAMING', name: 'ARCADE RUSH', icon: <SparklesIcon className="w-5 h-5" />, img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400' },
    { id: 'SPORT', name: 'ATHLETICS', icon: <FireIcon className="w-5 h-5" />, img: 'https://images.unsplash.com/photo-1461896756913-c8b40e722162?q=80&w=400' },
    { id: 'FASHION', name: 'STREETWEAR', icon: <BeakerIcon className="w-5 h-5" />, img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400' }
];

const NeonSignalPage: React.FC<{ onBack: () => void; onReturnToFeeds?: () => void; onWin?: (score: number) => void }> = ({ onBack, onReturnToFeeds, onWin }) => {
    const [gameState, setGameState] = useState<'LOADING' | 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS'>('LOADING');
    const [wordPool, setWordPool] = useState<HangmanWord[]>([]);
    const [activePool, setActivePool] = useState<HangmanWord[]>([]);
    const [selectedCat, setSelectedCat] = useState<typeof CATEGORY_CONFIG[0] | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [history, setHistory] = useState<{ word: string; correct: boolean }[]>([]);
    const [initials, setInitials] = useState("");
    const [showHelp, setShowHelp] = useState(false);
    const [showScores, setShowScores] = useState(false);
    
    const tiltLock = useRef(false);
    const timerRef = useRef<number | null>(null);

    // Score Cycle
    useEffect(() => {
        if (gameState === 'MENU') {
            const interval = setInterval(() => setShowScores(prev => !prev), 5000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    // Initial Data Sync
    useEffect(() => {
        fetchDynamicHangmanData().then(dynamic => {
            setWordPool([...HANGMAN_DATA, ...dynamic]);
            setGameState('MENU');
        });
    }, []);

    // Action Handler
    const handleAction = useCallback((correct: boolean) => {
        if (gameState !== 'PLAYING' || tiltLock.current) return;
        
        tiltLock.current = true;
        const currentWord = activePool[currentIndex]?.word || "UNKNOWN";
        
        setHistory(prev => [...prev, { word: currentWord, correct }]);
        if (correct) setScore(s => s + 1);
        
        if (currentIndex < activePool.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Lock tilt for 1.2s to prevent double-triggers and allow reset
            setTimeout(() => { tiltLock.current = false; }, 1200);
        } else {
            setGameState('RESULTS');
        }
    }, [gameState, activePool, currentIndex]);

    // Accelerometer Listener
    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (gameState !== 'PLAYING' || tiltLock.current) return;
            const { beta } = event; // Vertical tilt
            if (beta === null) return;

            if (beta > TILT_THRESHOLD_SYNC) { 
                handleAction(true); // TILT DOWN
            } else if (beta < TILT_THRESHOLD_VOID) {
                handleAction(false); // TILT UP
            }
        };

        if (gameState === 'PLAYING') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [gameState, handleAction]);

    const requestMotionPermission = async (cat: typeof CATEGORY_CONFIG[0]) => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') startTransmission(cat);
            } catch (e) { startTransmission(cat); }
        } else {
            startTransmission(cat);
        }
    };

    const startTransmission = (cat: typeof CATEGORY_CONFIG[0]) => {
        const filtered = wordPool.filter(w => w.category === cat.id);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setActivePool(shuffled);
        setSelectedCat(cat);
        setGameState('COUNTDOWN');
        setTimeLeft(3);
        setHistory([]);
        setScore(0);
        setCurrentIndex(0);
    };

    const handleSaveScore = () => {
        saveHighScore('neon_signal', {
            name: initials.toUpperCase() || "???",
            score: score,
            displayValue: `${score} PKTS`,
            date: new Date().toISOString()
        });
        if (onWin) onWin(score);
        setGameState('MENU');
    };

    useEffect(() => {
        if (gameState === 'COUNTDOWN' && timeLeft > 0) {
            timerRef.current = window.setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (gameState === 'COUNTDOWN' && timeLeft === 0) {
            setGameState('PLAYING');
            setTimeLeft(GAME_DURATION);
        } else if (gameState === 'PLAYING' && timeLeft > 0) {
            timerRef.current = window.setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (gameState === 'PLAYING' && timeLeft === 0) {
            setGameState('RESULTS');
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, timeLeft]);

    if (gameState === 'LOADING') {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center font-mono text-cyan-400 p-8">
                <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_40px_#22d3ee]" />
                <p className="font-black uppercase italic tracking-[0.4em] animate-pulse">Initializing_Data_Stream...</p>
            </div>
        );
    }

    if (gameState === 'MENU') {
        return (
            <div className="w-full h-full bg-zinc-950 p-6 font-mono overflow-y-auto scrollbar-hide">
                <header className="flex justify-between items-center mb-10 shrink-0 mt-[var(--safe-top)]">
                    <button onClick={onBack} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl active:scale-90 transition-all"><XIcon className="w-6 h-6 text-white"/></button>
                    <div className="text-center">
                        <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase italic block">Protocol: NEON_SIGNAL</span>
                        <h1 className="text-2xl font-black italic text-white tracking-tighter leading-none">THE CORE</h1>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl active:scale-90 transition-all"><BookOpenIcon className="w-6 h-6 text-white"/></button>
                </header>

                <div className="max-w-2xl mx-auto space-y-8 pb-32">
                    <div className="h-[260px] flex items-center justify-center overflow-hidden relative bg-zinc-900/40 rounded-[3rem] border-2 border-white/5 p-8">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-fade-in">
                            {showScores ? (
                                <HighScoreTable entries={getHighScores('neon_signal')} title="NEON" />
                            ) : (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="p-6 bg-cyan-500 rounded-full shadow-[0_0_50px_rgba(34,211,238,0.5)]">
                                        <CpuChipIcon className="w-16 h-16 text-white" />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.6em] italic text-center px-4">Mount terminal on forehead for proximity sync</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CATEGORY_CONFIG.map(cat => (
                            <button key={cat.id} onClick={() => requestMotionPermission(cat)} className="relative w-full h-48 rounded-[2.5rem] overflow-hidden group border-2 border-zinc-800 hover:border-cyan-500 shadow-2xl transition-all active:scale-95">
                                <img src={cat.img} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-60 transition-all duration-700" alt={cat.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                                <div className="absolute bottom-8 left-8 text-left">
                                    <div className="flex items-center gap-2 text-cyan-400 mb-2">{cat.icon} <span className="text-[10px] font-black tracking-widest uppercase italic">NODE: {cat.id}</span></div>
                                    <div className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{cat.name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    if (gameState === 'COUNTDOWN') {
        return (
            <div className="w-full h-full bg-cyan-600 flex flex-col items-center justify-center font-mono text-center p-10">
                <div className="absolute inset-0 static-noise opacity-20 pointer-events-none" />
                <div className="relative z-10 space-y-4">
                    <div className="inline-block px-6 py-2 bg-black text-white font-black uppercase italic tracking-[0.4em] rounded-full mb-6">MOUNT_ON_FOREHEAD</div>
                    <div className="text-[12rem] font-black text-white italic leading-none animate-pulse drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">{timeLeft}</div>
                    <div className="flex justify-center gap-12 mt-10">
                         <div className="flex flex-col items-center gap-2">
                             <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center animate-bounce">&darr;</div>
                             <span className="text-xs font-black text-black">SYNC (DOWN)</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center animate-bounce">&uarr;</div>
                             <span className="text-xs font-black text-black">VOID (UP)</span>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'PLAYING') {
        const isUrgent = timeLeft <= 10;
        return (
            <div className={`w-full h-full flex flex-col font-mono transition-colors duration-500 overflow-hidden ${isUrgent ? 'bg-red-950' : 'bg-void-950'}`}>
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <div className="h-4 bg-black/60 w-full relative z-20">
                    <div className={`h-full transition-all duration-1000 ease-linear ${isUrgent ? 'bg-red-500 shadow-[0_0_30px_#ef4444]' : 'bg-cyan-500 shadow-[0_0_30px_#22d3ee]'}`} style={{ width: `${(timeLeft/GAME_DURATION)*100}%` }} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                    <div className={`text-xs font-black tracking-[0.8em] mb-12 flex items-center gap-4 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                        <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                        DECRYPTING_SIGNAL
                        <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                    </div>
                    
                    <h2 className="text-[clamp(2.5rem,10vw,8rem)] font-black text-white uppercase italic tracking-tighter leading-[0.8] mb-16 drop-shadow-2xl font-horror">
                        {activePool[currentIndex]?.word}
                    </h2>
                    
                    <div className="flex items-center gap-8">
                        <div className="px-10 py-5 bg-black/60 border-2 border-white/5 rounded-[2.5rem] text-white font-black text-5xl font-mono italic shadow-2xl">
                            {timeLeft}s
                        </div>
                        <div className="px-10 py-5 bg-cyan-500/20 border-2 border-cyan-500/40 rounded-[2.5rem] text-cyan-400 font-black text-5xl font-mono italic shadow-2xl">
                            {score}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-zinc-950 p-6 font-mono flex flex-col overflow-hidden">
            <div className="text-center mt-8 mb-10 shrink-0 relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[120px] font-black text-white/5 italic select-none">DONE</div>
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-4 glitch-text">SYNC_COMPLETE</h2>
                <div className="inline-block px-10 py-3 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-3xl shadow-lg">
                    <span className="text-cyan-400 font-black text-3xl italic uppercase tracking-widest">{score} PACKETS EXTRACTED</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-8 scrollbar-hide bg-black/40 rounded-[3rem] p-6 border border-white/5">
                {history.map((h, i) => (
                    <div key={i} className={`p-6 rounded-2xl flex justify-between items-center border-2 animate-fade-in ${h.correct ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-500/40'}`} style={{ animationDelay: `${i * 100}ms` }}>
                        <span className="font-black italic uppercase text-2xl tracking-tighter truncate max-w-[70%]">{h.word}</span>
                        <span className={`text-[10px] font-black border px-4 py-1.5 rounded-full uppercase tracking-widest ${h.correct ? 'border-emerald-500/40 text-emerald-500' : 'border-red-500/40 text-red-500'}`}>
                            {h.correct ? 'SYNCED' : 'VOIDED'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="space-y-4 shrink-0 pb-[calc(1.5rem+var(--safe-bottom))] bg-zinc-950 pt-4 max-w-lg mx-auto w-full">
                <div className="flex flex-col gap-4">
                     <div className="flex gap-4">
                        <input 
                            autoFocus
                            maxLength={3} 
                            value={initials} 
                            onChange={e => setInitials(e.target.value.toUpperCase())}
                            className="bg-black/50 border-2 border-cyan-500 text-white rounded-2xl px-4 py-3 text-center text-2xl font-black w-24 outline-none uppercase italic"
                            placeholder="???"
                        />
                        <button onClick={handleSaveScore} className="flex-1 py-4 bg-pulse-600 text-white font-black uppercase italic rounded-2xl text-lg shadow-xl border-2 border-pulse-400 active:scale-95 transition-all">Transmit Record</button>
                     </div>
                     <button onClick={() => setGameState('MENU')} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl text-xl shadow-[6px_6px_0px_#e11d48] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">New Transmission</button>
                     <button onClick={onBack} className="w-full py-2 text-zinc-700 font-black uppercase text-[10px] tracking-[0.4em] italic hover:text-zinc-400 transition-colors">Abort_To_Arcade</button>
                </div>
            </div>
            {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
        </div>
    );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
            <div className="max-w-xl w-full bg-void-900 border-4 border-cyan-500 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
                <header className="h-12 bg-cyan-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <BookOpenIcon className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">SYNC_CALIBRATION_MANUAL.PDF</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400 transition-colors">
                        <XIcon className="w-5 h-5 text-black" />
                    </button>
                </header>
                <div className="p-6 md:p-10 overflow-y-auto flex-grow bg-void-950/40 relative scrollbar-hide">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                    <section className="space-y-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <SparklesIcon className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Proximity Decryption</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-cyan-500/30 pl-4">
                                Neon Signal utilizes gyroscopic sensors for physical data confirmation. Mount the terminal securely for optimal sync.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Mount_Protocol" desc="Place the device against your forehead, screen facing outwards. Ensure teammates have a direct line of sight to the signal." color="text-cyan-400" />
                            <ManualPoint title="0x02_Sync_Tilt" desc="When a teammate correctly decodes the signal, tilt the device DOWN (towards the floor) to confirm and advance." color="text-cyan-400" />
                            <ManualPoint title="0x03_Void_Tilt" desc="If a signal is too fragmented to resolve, tilt the device UP (towards the ceiling) to skip and request a new packet." color="text-cyan-400" />
                            <ManualPoint title="0x04_Time_Constraint" desc="Each sector sync lasts 60 seconds. High-intensity speed is required to maximize packet extraction rewards." color="text-cyan-400" />
                        </div>
                        <div className="p-5 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1 italic">Warning: Physical Safety</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Avoid rapid, jerky movements. Maintain spatial awareness of your surroundings while the terminal is mounted.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
                <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-cyan-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-cyan-950 text-[10px] font-black uppercase italic text-white hover:bg-cyan-500 active:bg-cyan-700 transition-all shadow-lg">
                        ACKNOWLEDGE_PROTOCOLS
                    </button>
                </footer>
            </div>
        </div>
    );
};

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>
            {title}
        </h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">
            {desc}
        </p>
    </div>
);

export default NeonSignalPage;
