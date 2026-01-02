import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, XIcon } from './icons';

interface OrientationGuardProps {
    children: React.ReactNode;
    portraitOnly?: boolean;
    landscapeOnly?: boolean;
}

const OrientationGuard: React.FC<OrientationGuardProps> = ({ children, portraitOnly = false, landscapeOnly = false }) => {
    const [isLandscape, setIsLandscape] = useState(false);
    const [userDismissed, setUserDismissed] = useState(false);

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

    const subOptimalPortrait = portraitOnly && isLandscape;
    const subOptimalLandscape = landscapeOnly && !isLandscape;
    const isCurrentlySubOptimal = subOptimalPortrait || subOptimalLandscape;

    // Reset dismissal when the user fixes the orientation, 
    // so it will show again if they rotate back to a "bad" mode.
    useEffect(() => {
        if (!isCurrentlySubOptimal) {
            setUserDismissed(false);
        }
    }, [isCurrentlySubOptimal]);

    const showAdvisory = isCurrentlySubOptimal && !userDismissed;

    return (
        <div className="relative w-full h-full">
            {/* The game always renders */}
            {children}
            
            {showAdvisory && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm pointer-events-none animate-fade-in">
                    <div className="bg-zinc-900/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-start gap-4 border-l-[6px] pointer-events-auto relative">
                        
                        {/* Dismiss Button */}
                        <button 
                            onClick={() => setUserDismissed(true)}
                            className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white transition-colors active:scale-90"
                            aria-label="Dismiss Advisory"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>

                        <div className="shrink-0 pt-1">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 relative z-10" />
                            </div>
                        </div>
                        
                        <div className="flex-1 pr-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] italic">Diagnostic Advisory</span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Live_Monitor</span>
                                </span>
                            </div>
                            
                            <h4 className="text-white text-[11px] font-black uppercase tracking-tight mb-1">
                                {subOptimalPortrait ? 'PORTRAIT MODE RECOMMENDED' : 'LANDSCAPE MODE RECOMMENDED'}
                            </h4>
                            
                            <p className="text-zinc-400 text-[9px] uppercase font-bold leading-snug tracking-wide italic">
                                {subOptimalPortrait 
                                    ? 'Horizontal drift detected. Tactical controls and UI scaling may be fragmented in this orientation.' 
                                    : 'Vertical clearance is insufficient. Terminal sync requires a wider horizontal plane for optimal data visualization.'}
                            </p>
                            
                            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest italic">Error_Code: 0xORNT_FAIL</span>
                                <div className="flex items-center gap-2">
                                     <ArrowPathIcon className="w-3 h-3 text-zinc-700" />
                                     <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">Rotation_Sync_Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Visual hint for the user that the game is still active underneath */}
                    <div className="mt-2 text-center pointer-events-none">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] italic">Simulation_Active // Proceed_At_Risk</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrientationGuard;