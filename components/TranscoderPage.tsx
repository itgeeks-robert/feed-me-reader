import React, { useState, useEffect } from 'react';
import { XIcon, CodeBracketIcon, ArrowPathIcon } from './icons';

const TranscoderPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [input, setInput] = useState("");
    const [hex, setHex] = useState("");
    const [binary, setBinary] = useState("");
    const [base64, setBase64] = useState("");

    useEffect(() => {
        if (!input) {
            setHex(""); setBinary(""); setBase64("");
            return;
        }

        try {
            // Hex
            const hexResult = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
            setHex(hexResult);

            // Binary
            const binResult = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            setBinary(binResult);

            // Base64
            setBase64(btoa(input));
        } catch (e) {
            console.warn("Transcoding error", e);
        }
    }, [input]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Packet Cloned to Buffer.");
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white overflow-y-auto scrollbar-hide">
            <div className="max-w-4xl w-full space-y-8 pb-20">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-signal-500 uppercase tracking-[0.4em] block mb-1 italic">Protocol: TRANSCODE_V1</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">DATA TRANSCODER</h2>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 italic block">Input Buffer (ASCII)</label>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter plaintext to transcode..."
                            className="w-full h-80 bg-void-900 border-4 border-zinc-800 rounded-[2.5rem] p-8 text-white font-black italic placeholder-zinc-700 outline-none focus:border-pulse-500 transition-all shadow-inner resize-none"
                        />
                    </div>

                    <div className="space-y-6">
                        <OutputBlock label="Hexadecimal Protocol" value={hex} onCopy={() => copyToClipboard(hex)} />
                        <OutputBlock label="Binary Stream" value={binary} onCopy={() => copyToClipboard(binary)} />
                        <OutputBlock label="Base64 Encoding" value={base64} onCopy={() => copyToClipboard(base64)} />
                    </div>
                </div>
            </div>
        </main>
    );
};

const OutputBlock: React.FC<{ label: string, value: string, onCopy: () => void }> = ({ label, value, onCopy }) => (
    <div className="bg-void-900 border-2 border-zinc-800 rounded-3xl p-6 relative group hover:border-pulse-500/50 transition-all">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 block italic">{label}</span>
        <div className="min-h-[60px] max-h-[120px] overflow-y-auto scrollbar-hide mb-4">
            <p className="text-xs font-black text-signal-500 break-all leading-relaxed">{value || "AWAITING_INPUT..."}</p>
        </div>
        <button 
            onClick={onCopy}
            disabled={!value}
            className="w-full py-3 bg-zinc-800/50 text-[9px] font-black uppercase italic tracking-widest text-zinc-400 hover:bg-pulse-500 hover:text-white disabled:opacity-30 transition-all rounded-xl border border-white/5"
        >
            Extract Packet
        </button>
    </div>
);

export default TranscoderPage;
