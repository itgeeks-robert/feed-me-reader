import React, { useState, useEffect } from 'react';
import { XIcon, RadioIcon, ArrowPathIcon, VoidIcon } from './icons';

const SignalScramblerPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [intensity, setIntensity] = useState(0.5);

    const scramble = (str: string) => {
        const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return str.split('').map(char => {
            if (char === ' ' || char === '\n') return char;
            if (Math.random() < intensity) {
                return chars[Math.floor(Math.random() * chars.length)];
            }
            return char.toUpperCase();
        }).join('');
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (input) setOutput(scramble(input));
        }, 100);
        return () => clearInterval(timer);
    }, [input, intensity]);

    const copyToBuffer = () => {
        navigator.clipboard.writeText(output);
        alert("Encrypted Segment Cloned to Buffer.");
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white overflow-y-auto scrollbar-hide">
            <div className="max-w-2xl w-full space-y-8">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-neon-400 uppercase tracking-[0.4em] block mb-1 italic">Protocol: SIGNAL_MASKING</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL SCRAMBLER</h2>
                        </div>
                    </div>
                </header>

                <div className="bg-void-900/40 p-8 rounded-[3rem] border-4 border-zinc-800 shadow-2xl space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block italic">Input Sequence</label>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter data to mask..."
                            className="w-full h-32 bg-black/40 border-2 border-zinc-800 rounded-2xl p-4 text-white font-black italic focus:border-neon-400 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase italic">
                            <span>Interference Level</span>
                            <span className="text-neon-400">{Math.round(intensity * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.01" 
                            value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))}
                            className="w-full accent-neon-400"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block italic">Masked Output</label>
                        <div className="w-full h-48 bg-black border-2 border-neon-400/30 rounded-2xl p-6 overflow-y-auto scrollbar-hide relative group">
                            <div className="absolute inset-0 cctv-overlay opacity-20 pointer-events-none" />
                            <p className="text-sm font-black text-neon-400 break-all leading-relaxed whitespace-pre-wrap">{output || "AWAITING_INPUT..."}</p>
                        </div>
                    </div>

                    <button 
                        onClick={copyToBuffer}
                        disabled={!output}
                        className="w-full py-5 bg-neon-500 text-black font-black text-sm uppercase italic tracking-widest rounded-2xl hover:bg-white transition-all disabled:opacity-30 shadow-lg"
                    >
                        EXTRACT_MASKED_PACKET
                    </button>
                </div>
            </div>
        </main>
    );
};

export default SignalScramblerPage;