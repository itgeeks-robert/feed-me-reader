import React, { useState, useEffect, useRef } from 'react';
import { XIcon, RadioIcon, ClockIcon, ArrowPathIcon } from './icons';

const DeepSyncPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [isActive, setIsActive] = useState(false);
    const [noiseType, setNoiseType] = useState<'WHITE' | 'PINK' | 'BROWN'>('BROWN');
    const [timeLeft, setTimeLeft] = useState(1500); // 25 mins
    const audioCtx = useRef<AudioContext | null>(null);
    const noiseNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    useEffect(() => {
        let timer: number;
        if (isActive && timeLeft > 0) {
            timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            stopNoise();
        }
        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    const createNoise = () => {
        if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioCtx.current;
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            if (noiseType === 'WHITE') {
                output[i] = Math.random() * 2 - 1;
            } else if (noiseType === 'BROWN') {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // amplification
            } else { // PINK
                const white = Math.random() * 2 - 1;
                // Simple pink noise approximation
                output[i] = (lastOut + (0.1 * white)) / 1.1;
                lastOut = output[i];
                output[i] *= 2;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    };

    const startNoise = () => {
        if (!audioCtx.current) audioCtx.current = new AudioContext();
        gainNode.current = audioCtx.current.createGain();
        gainNode.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
        gainNode.current.gain.linearRampToValueAtTime(0.15, audioCtx.current.currentTime + 2);
        
        noiseNode.current = createNoise();
        noiseNode.current.connect(gainNode.current);
        gainNode.current.connect(audioCtx.current.destination);
        (noiseNode.current as AudioBufferSourceNode).start();
    };

    const stopNoise = () => {
        if (gainNode.current && audioCtx.current) {
            gainNode.current.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 1);
            setTimeout(() => {
                if (noiseNode.current) (noiseNode.current as AudioBufferSourceNode).stop();
            }, 1000);
        }
    };

    const toggleSync = () => {
        if (!isActive) {
            startNoise();
            setIsActive(true);
        } else {
            stopNoise();
            setIsActive(false);
        }
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            <div className="max-w-md w-full relative z-10 space-y-8">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { stopNoise(); onBackToHub(); }} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1 italic">Protocol: COGNITIVE_FOCUS</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">DEEP SYNC</h2>
                        </div>
                    </div>
                </header>

                <div className="bg-void-900/40 p-10 rounded-[3rem] border-4 border-zinc-800 shadow-2xl text-center relative overflow-hidden">
                    <div className="mb-10 relative">
                        <div className={`w-32 h-32 rounded-full border-4 mx-auto flex items-center justify-center transition-all duration-1000 ${isActive ? 'border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.4)] animate-pulse' : 'border-zinc-800'}`}>
                            <RadioIcon className={`w-16 h-16 ${isActive ? 'text-pulse-500' : 'text-zinc-700'}`} />
                        </div>
                    </div>

                    <div className="mb-8">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Sync Timer</span>
                        <div className="text-6xl font-black italic text-white tracking-tighter font-mono drop-shadow-lg">
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-10">
                        {(['WHITE', 'PINK', 'BROWN'] as const).map(t => (
                            <button 
                                key={t}
                                onClick={() => { setNoiseType(t); if(isActive) { stopNoise(); startNoise(); } }}
                                className={`py-3 rounded-xl text-[9px] font-black uppercase italic border-2 transition-all ${noiseType === t ? 'bg-pulse-600 border-pulse-400 text-white shadow-lg' : 'bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={toggleSync}
                        className={`w-full py-5 rounded-2xl font-black text-xl uppercase italic tracking-widest transition-all shadow-xl border-2 ${isActive ? 'bg-zinc-800 border-zinc-700 text-pulse-500' : 'bg-white border-white text-black hover:scale-[1.02]'}`}
                    >
                        {isActive ? 'TERMINATE_LINK' : 'ESTABLISH_SYNC'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setTimeLeft(1500)} className="py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase italic text-zinc-500 hover:text-white transition-all">Reset Buffer</button>
                    <button onClick={() => setTimeLeft(prev => prev + 300)} className="py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase italic text-zinc-500 hover:text-white transition-all">+5 Minutes</button>
                </div>
            </div>
        </main>
    );
};

export default DeepSyncPage;