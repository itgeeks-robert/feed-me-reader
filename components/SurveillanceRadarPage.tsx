
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, RadioIcon, GlobeAltIcon, ArrowPathIcon } from './icons';
import { soundService } from '../services/soundService';

const SurveillanceRadarPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number>(0);

    const startMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            
            source.connect(analyzer);
            audioCtxRef.current = audioCtx;
            analyzerRef.current = analyzer;
            
            setIsMonitoring(true);
            soundService.playAction();
            draw();
        } catch (err) {
            alert("Microphone Access Denied. Cannot establish intercept.");
        }
    };

    const stopMonitoring = () => {
        setIsMonitoring(false);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const analyzer = analyzerRef.current;
        if (!canvas || !analyzer) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            analyzer.getByteFrequencyData(dataArray);

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(centerX, centerY) * 0.8;

            // Draw Background Radar Rings
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            [0.3, 0.6, 0.9].forEach(r => {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
                ctx.stroke();
            });

            // Draw Frequency Points
            ctx.beginPath();
            ctx.strokeStyle = 'var(--void-accent)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'var(--void-accent)';

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i] / 255;
                const angle = (i / bufferLength) * Math.PI * 2;
                const dist = radius * 0.3 + (value * radius * 0.6);
                
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Sweeping Radar Line
            const sweepAngle = (Date.now() / 1000) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.stroke();
        };

        render();
    };

    useEffect(() => {
        return () => stopMonitoring();
    }, []);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-6 font-mono text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
            <div className="max-w-xl w-full flex flex-col h-full relative z-10">
                <header className="mb-8 flex justify-between items-center bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1 italic">Protocol: ACOUSTIC_MONITOR</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">SURVEILLANCE RADAR</h2>
                        </div>
                    </div>
                </header>

                <div className="flex-grow flex items-center justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <GlobeAltIcon className="w-64 h-64 text-zinc-800 animate-pulse" />
                    </div>
                    <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-[400px] aspect-square" />
                    
                    {!isMonitoring && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-full m-8">
                            <button onClick={startMonitoring} className="p-8 bg-pulse-500 rounded-full shadow-[0_0_50px_rgba(225,29,72,0.5)] border-4 border-white/20 active:scale-90 transition-transform">
                                <RadioIcon className="w-12 h-12 text-white animate-pulse" />
                            </button>
                            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-pulse-500 italic">Initiate_Acoustic_Link</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 bg-zinc-900/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Signal_Status</span>
                        <span className={`text-[8px] font-black uppercase italic ${isMonitoring ? 'text-emerald-500' : 'text-red-500'}`}>{isMonitoring ? 'STABLE' : 'OFFLINE'}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed uppercase italic">Monitoring for ultrasonic triggers and unauthorized vocal telemetry within the immediate sector.</p>
                    {isMonitoring && (
                        <button onClick={stopMonitoring} className="w-full mt-6 py-4 bg-zinc-800 border border-pulse-500/30 text-pulse-500 font-black uppercase italic text-xs rounded-xl active:scale-95 transition-all">Sever_Intercept</button>
                    )}
                </div>
            </div>
        </main>
    );
};

export default SurveillanceRadarPage;
