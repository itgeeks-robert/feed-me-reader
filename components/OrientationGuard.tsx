
import React from 'react';
import { XIcon, ExclamationTriangleIcon } from './icons';

interface OrientationGuardProps {
    children: React.ReactNode;
    portraitOnly?: boolean;
}

const OrientationGuard: React.FC<OrientationGuardProps> = ({ children, portraitOnly = false }) => {
    return (
        <div className="relative w-full h-full">
            {children}
            
            {portraitOnly && (
                <div className="fixed inset-0 z-[200] hidden landscape:flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-8 font-mono text-center animate-fade-in">
                    <div className="max-w-md space-y-8">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping" />
                            <div className="relative z-10 w-full h-full bg-zinc-900 border-4 border-pulse-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.4)]">
                                <ExclamationTriangleIcon className="w-12 h-12 text-pulse-500 animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">SIGNAL UNSTABLE</h2>
                            <div className="inline-block px-3 py-1 bg-red-950/40 border border-red-500/30 rounded-lg">
                                <span className="text-[10px] font-black text-pulse-500 uppercase tracking-widest">Error: Gyro_Alignment_Fault</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] leading-relaxed italic">
                                This simulation requires a vertical data flow. Rotate device to <span className="text-white">PORTRAIT</span> to stabilize the connection.
                            </p>
                        </div>
                        
                        <div className="pt-8 opacity-20">
                            <div className="w-12 h-16 border-2 border-dashed border-zinc-700 rounded-lg mx-auto relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-zinc-800 rounded-full" />
                            </div>
                            <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest mt-2 block">Optimal Orientation</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrientationGuard;
