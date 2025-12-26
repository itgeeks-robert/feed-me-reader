
import React from 'react';
import { SeymourIcon, GoogleIcon } from './icons';

interface LoginViewProps {
    onLogin: () => void;
    onGuestLogin: () => void;
    isApiReady: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestLogin, isApiReady }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-zinc-950">
            <div className="w-full max-w-sm mx-auto text-center px-6">
                <div className="p-4 bg-plant-500 rounded-[2.5rem] shadow-[0_0_50px_rgba(34,197,94,0.3)] w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                    <SeymourIcon className="w-16 h-16 text-black" />
                </div>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">FEED ME!</h1>
                <p className="text-plant-500/60 font-bold uppercase tracking-[0.3em] text-[10px] mb-12">The Offline Alley Arcade</p>
                
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={onGuestLogin}
                        className="w-full bg-white text-black font-black py-4 px-6 rounded-2xl italic uppercase text-lg shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3"
                    >
                        <span>Enter The Pit</span>
                    </button>
                    
                    <button
                        type="button"
                        onClick={onLogin}
                        disabled={!isApiReady}
                        className="w-full bg-zinc-900 text-zinc-400 font-bold py-3 px-6 rounded-2xl uppercase text-xs border border-white/5 hover:text-white transition-colors flex items-center justify-center gap-3"
                    >
                        <GoogleIcon className="w-4 h-4" />
                        <span>Sync Spores (Google)</span>
                    </button>
                </div>
                
                {!isApiReady && <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-8 animate-pulse">Initializing DNA...</p>}
            </div>
        </div>
    );
};

export default LoginView;
