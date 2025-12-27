import React from 'react';
import { VoidIcon, GoogleIcon } from './icons';

interface LoginViewProps {
    onLogin: () => void;
    onGuestLogin: () => void;
    isApiReady: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestLogin, isApiReady }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-void-950 relative overflow-hidden">
            {/* Background scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.1)_2px,rgba(225,29,72,0.1)_4px)]"></div>
            
            <div className="w-full max-w-sm mx-auto text-center px-6 relative z-10">
                <div className="p-6 bg-pulse-500 rounded-[2rem] shadow-[0_0_60px_rgba(225,29,72,0.4)] w-28 h-28 mx-auto mb-10 flex items-center justify-center border-4 border-white/20 animate-pulse">
                    <VoidIcon className="w-20 h-20 text-white" />
                </div>
                
                <div className="mb-12">
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-3 glitch-text">THE VOID</h1>
                    <div className="flex items-center justify-center gap-2">
                        <span className="h-px w-8 bg-pulse-500/50"></span>
                        <p className="text-pulse-500 font-bold uppercase tracking-[0.4em] text-[10px]">Signal Reader v1.8.4</p>
                        <span className="h-px w-8 bg-pulse-500/50"></span>
                    </div>
                </div>
                
                <div className="space-y-5">
                    <button
                        type="button"
                        onClick={onGuestLogin}
                        className="w-full bg-white text-black font-black py-5 px-6 rounded-2xl italic uppercase text-xl shadow-[8px_8px_0px_rgba(225,29,72,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <span>Establish Link</span>
                        <div className="w-2 h-2 rounded-full bg-pulse-500 animate-ping group-hover:bg-black"></div>
                    </button>
                    
                    <button
                        type="button"
                        onClick={onLogin}
                        disabled={!isApiReady}
                        className="w-full bg-void-900 text-zinc-400 font-black py-4 px-6 rounded-2xl uppercase text-[10px] tracking-widest border-2 border-zinc-800 hover:border-pulse-500 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <GoogleIcon className="w-4 h-4" />
                        <span>Sync Nodes (Secure Link)</span>
                    </button>
                </div>
                
                <div className="mt-16 pt-8 border-t border-zinc-800/50">
                    {!isApiReady ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 border-2 border-t-pulse-500 border-zinc-800 rounded-full animate-spin"></div>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] animate-pulse">Initializing Kernel...</p>
                        </div>
                    ) : (
                        <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest leading-relaxed">
                            UNAUTHORIZED ACCESS PROHIBITED<br/>
                            ENCRYPTED VIA VOID_CORE_NET
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginView;