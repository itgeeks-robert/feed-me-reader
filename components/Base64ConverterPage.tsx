
import React, { useState, useRef, useEffect } from 'react';
/* Added ExclamationTriangleIcon to the imports from ./icons to fix the "Cannot find name" error */
import { XIcon, BookmarkIcon, CloudArrowUpIcon, CloudArrowDownIcon, SparklesIcon, ArrowPathIcon, ExclamationTriangleIcon } from './icons';
import Tooltip from './Tooltip';

const Base64ConverterPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [inputString, setInputString] = useState("");
    const [outputString, setOutputString] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            setFileName(file.name);
            setMimeType(file.type);
            const reader = new FileReader();
            reader.onload = (event) => {
                const b64 = event.target?.result as string;
                setOutputString(b64);
                setIsProcessing(false);
            };
            reader.onerror = () => {
                alert("Intercept failed: Corruption in source packet.");
                setIsProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = () => {
        if (!inputString) return;
        try {
            const link = document.createElement('a');
            link.href = inputString;
            link.download = `VOID_RECON_${Date.now()}`;
            link.click();
        } catch (e) {
            alert("Export error: Packet sequence invalid.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Encoded string synchronized to clipboard buffer.");
    };

    const clearBuffers = () => {
        setInputString("");
        setOutputString("");
        setFileName(null);
        setMimeType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Auto-detect MIME for the preview
    const detectedMime = inputString.match(/^data:([^;]+);base64,/)?.[1];

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 md:p-8 font-mono text-white overflow-y-auto scrollbar-hide">
            <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
            
            <div className="max-w-4xl w-full space-y-6 md:space-y-10 relative z-10 pb-[calc(4rem+var(--safe-bottom))]">
                
                <header className="flex justify-between items-center bg-zinc-900/60 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl shrink-0 mt-[var(--safe-top)]">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 border border-white/5 shadow-md">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div>
                             <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] block mb-1 italic">ENCODING_STATION_v2</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">BASE64 INTERCEPT</h2>
                        </div>
                    </div>
                    <button onClick={clearBuffers} className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all active:rotate-180 duration-500">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ENCODE SECTION */}
                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border-2 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest italic">Signal to String</h3>
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        
                        <div className="flex-grow flex flex-col gap-6">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[16/6] border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-amber-500 hover:bg-amber-500/5 transition-all active:scale-95"
                            >
                                <CloudArrowUpIcon className="w-8 h-8 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white">INTERCEPT_LOCAL_FILE</span>
                            </button>

                            <div className="relative">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1 italic">Output Data URI</label>
                                <div className="w-full h-40 bg-black border-2 border-zinc-800 rounded-2xl p-4 overflow-y-auto scrollbar-hide text-[10px] font-black text-amber-600/80 break-all leading-relaxed relative">
                                    {isProcessing ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <span className="animate-pulse">ENCODING_BITS...</span>
                                        </div>
                                    ) : outputString || "AWAITING_INPUT_PACKET..."}
                                </div>
                                {outputString && (
                                    <button 
                                        onClick={() => copyToClipboard(outputString)}
                                        className="absolute bottom-4 right-4 bg-zinc-800/80 p-2 rounded-lg text-white hover:bg-amber-500 transition-colors border border-white/5"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DECODE SECTION */}
                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border-2 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest italic">String to Signal</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        <div className="flex-grow flex flex-col gap-6">
                            <div className="relative">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1 italic">Input Data Stream</label>
                                <textarea 
                                    value={inputString}
                                    onChange={(e) => setInputString(e.target.value)}
                                    placeholder="Paste Base64 data string here (data:image/png;base64,...)"
                                    className="w-full h-32 bg-black border-2 border-zinc-800 rounded-2xl p-4 text-[10px] font-black text-emerald-600/80 outline-none focus:border-emerald-500 transition-all resize-none scrollbar-hide"
                                />
                            </div>

                            <div className="flex-grow">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1 italic">Reconstructed Preview</label>
                                <div className="w-full aspect-video bg-black border-2 border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center relative">
                                    {inputString ? (
                                        <>
                                            <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40 z-10" />
                                            {detectedMime?.startsWith('image') ? (
                                                <img src={inputString} className="max-w-full max-h-full object-contain saturate-50" />
                                            ) : detectedMime?.startsWith('video') ? (
                                                <video src={inputString} controls className="max-w-full max-h-full" />
                                            ) : detectedMime?.startsWith('audio') ? (
                                                <audio src={inputString} controls className="w-[80%] invert" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <ExclamationTriangleIcon className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                                                    <p className="text-[8px] text-zinc-600 uppercase font-black">Unknown_Mime_Type</p>
                                                    <p className="text-[6px] text-zinc-700 mt-1">{detectedMime || 'NULL'}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-10">
                                            <BookmarkIcon className="w-12 h-12 mb-2" />
                                            <span className="text-[8px] font-black uppercase">RECON_IDLE</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleDownload}
                                disabled={!inputString}
                                className="w-full py-4 bg-zinc-100 text-black font-black uppercase italic text-xs tracking-[0.2em] rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                            >
                                <CloudArrowDownIcon className="w-5 h-5" />
                                <span>Export Signal</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl text-center opacity-40">
                     <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[1em] italic">PACKET_TRANSMISSION_STATION // NOIR_ENCRYPT</span>
                </div>
            </div>
        </main>
    );
};

export default Base64ConverterPage;
