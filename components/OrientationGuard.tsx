import React, { useState, useEffect } from 'react';
import { XIcon, ExclamationTriangleIcon, ArrowPathIcon } from './icons';

interface OrientationGuardProps {
    children: React.ReactNode;
    portraitOnly?: boolean;
    landscapeOnly?: boolean;
}

const OrientationGuard: React.FC<OrientationGuardProps> = ({ children, portraitOnly = false, landscapeOnly = false }) => {
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            if (window.screen && window.screen.orientation) {
                const type = window.screen.orientation.type;
                setIsLandscape(type.includes('landscape'));
            } else {
                setIsLandscape(window.innerWidth > window.innerHeight);
            }
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener('change', checkOrientation);
        }
        
        return () => {
            window.removeEventListener('resize', checkOrientation);
            if (window.screen && window.screen.orientation) {
                window.screen.orientation.removeEventListener('change', checkOrientation);
            }
        };
    }, []);

    const showPortraitOverlay = portraitOnly && isLandscape;
    const showLandscapeOverlay = landscapeOnly && !isLandscape;

    return (
        <div className="relative w-full h-full">
            {children}
            
            {(showPortraitOverlay || showLandscapeOverlay) && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/98 backdrop-blur-2xl p-8 font-mono text-center animate-fade-in">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                    <div className="max-w-md space-y-10 relative z-10">
                        <div className="relative w-28 h-28 mx-auto">
                            <div className="absolute inset-0 bg-pulse-600/30 rounded-full animate-ping" />
                            <div className="relative z-10 w-full h-full bg-zinc-900 border-4 border-pulse-500 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(225,29,72,0.4)]">
                                <ArrowPathIcon className="w-14 h-14 text-pulse-500 animate-spin" />
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Alignment Error</h2>
                            <div className="inline-block px-4 py-2 bg-pulse-950/40 border-2 border-pulse-500/30 rounded-xl">
                                <span className="text-xs font-black text-pulse-500 uppercase tracking-[0.4em] italic">
                                    {showPortraitOverlay ? 'FORCE: VERTICAL' : 'FORCE: HORIZONTAL'}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest leading-relaxed italic px-6">
                                Neural link unstable. Simulation requires <span className="text-white font-black">{showPortraitOverlay ? 'PORTRAIT' : 'LANDSCAPE'}</span> orientation to calibrate gyroscopic frequency nodes.
                            </p>
                        </div>
                        
                        <div className="pt-12 opacity-30">
                            <div className={`border-4 border-dashed border-zinc-800 rounded-2xl mx-auto relative transition-all duration-700 ${showPortraitOverlay ? 'w-16 h-28' : 'w-28 h-16'}`}>
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-800 rounded-full ${showPortraitOverlay ? 'w-6 h-1' : 'w-1 h-6'}`} />
                            </div>
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.5em] mt-6 block italic">RE-SYNC_REQUIRED</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrientationGuard;