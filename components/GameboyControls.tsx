
import React from 'react';

type DPadDirection = 'up' | 'down' | 'left' | 'right';
type ButtonType = 'a' | 'b' | 'start' | 'select' | 'quit';
export type GameboyButton = DPadDirection | ButtonType;

interface GameboyControlsProps {
  onButtonPress: (button: GameboyButton) => void;
  onButtonRelease: (button: GameboyButton) => void;
}

const ControlButton: React.FC<{
  onPress: () => void;
  onRelease: () => void;
  className?: string;
  children?: React.ReactNode;
}> = ({ onPress, onRelease, className, children }) => {
    const handlePress = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); onPress();
    };
    const handleRelease = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); onRelease();
    };

    return (
        <div
            className={`select-none cursor-pointer active:scale-95 transition-transform ${className}`}
            onTouchStart={handlePress} onTouchEnd={handleRelease}
            onMouseDown={handlePress} onMouseUp={handleRelease} onMouseLeave={handleRelease}
        >
            {children}
        </div>
    );
};

export const GameboyControls: React.FC<GameboyControlsProps> = ({ onButtonPress, onButtonRelease }) => {
    return (
        <div className="w-full bg-[#2a2a2a] p-8 pb-12 border-t-4 border-black relative overflow-hidden flex flex-col items-center">
            {/* Texture and Antenna */}
            <div className="absolute top-0 left-12 w-4 h-24 bg-[#1a1a1a] -translate-y-full border-x-2 border-black" />
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            <div className="w-full max-w-md flex flex-col gap-8 relative z-10">
                {/* Speaker Grille Area */}
                <div className="w-full h-12 flex flex-col gap-1.5 px-4 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-full h-1 bg-black/40 rounded-full" />
                    ))}
                </div>

                <div className="flex justify-between items-start w-full">
                    {/* Tactical D-Pad (Rugged Arrows) */}
                    <div className="relative w-36 h-36 bg-[#1a1a1a] rounded-2xl border-4 border-black shadow-2xl flex items-center justify-center p-2">
                         <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1">
                            <div />
                            <ControlButton onPress={() => onButtonPress('up')} onRelease={() => onButtonRelease('up')} className="bg-[#333] border-2 border-black rounded-lg flex items-center justify-center text-zinc-500 hover:text-white">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                            </ControlButton>
                            <div />
                            
                            <ControlButton onPress={() => onButtonPress('left')} onRelease={() => onButtonRelease('left')} className="bg-[#333] border-2 border-black rounded-lg flex items-center justify-center text-zinc-500 hover:text-white">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M4 12l8-8v16l-8-8z"/></svg>
                            </ControlButton>
                            <div className="bg-[#0a0a0a] rounded-full border-2 border-black m-2 shadow-inner" />
                            <ControlButton onPress={() => onButtonPress('right')} onRelease={() => onButtonRelease('right')} className="bg-[#333] border-2 border-black rounded-lg flex items-center justify-center text-zinc-500 hover:text-white">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M20 12l-8 8v-16l8 8z"/></svg>
                            </ControlButton>

                            <div />
                            <ControlButton onPress={() => onButtonPress('down')} onRelease={() => onButtonRelease('down')} className="bg-[#333] border-2 border-black rounded-lg flex items-center justify-center text-zinc-500 hover:text-white">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 20l8-8h-16l8 8z"/></svg>
                            </ControlButton>
                            <div />
                         </div>
                    </div>

                    {/* Industrial Dials and Action Buttons */}
                    <div className="flex flex-col gap-6 items-end">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Link</span>
                                <ControlButton onPress={() => onButtonPress('start')} onRelease={() => onButtonRelease('start')} className="w-14 h-14 bg-zinc-800 rounded-full border-4 border-black shadow-xl flex items-center justify-center relative group">
                                    <div className="w-full h-full rounded-full border-t-2 border-white/10 group-active:rotate-45 transition-transform" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-1 h-6 bg-red-600 rounded-full shadow-[0_0_5px_red]" />
                                    </div>
                                </ControlButton>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Freq</span>
                                <ControlButton onPress={() => onButtonPress('select')} onRelease={() => onButtonRelease('select')} className="w-14 h-14 bg-zinc-800 rounded-full border-4 border-black shadow-xl flex items-center justify-center relative group">
                                    <div className="w-full h-full rounded-full border-t-2 border-white/10 group-active:rotate-[120deg] transition-transform" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-1 bg-zinc-600 rounded-full" />
                                    </div>
                                </ControlButton>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <ControlButton onPress={() => onButtonPress('b')} onRelease={() => onButtonRelease('b')} className="w-16 h-16 bg-[#b91c1c] border-4 border-black rounded-2xl shadow-xl flex items-center justify-center text-white font-black italic">B</ControlButton>
                            <ControlButton onPress={() => onButtonPress('a')} onRelease={() => onButtonRelease('a')} className="w-16 h-16 bg-[#b91c1c] border-4 border-black rounded-2xl shadow-xl flex items-center justify-center text-white font-black italic">A</ControlButton>
                        </div>
                    </div>
                </div>

                {/* SAFETY EXIT BUTTON */}
                <div className="flex justify-center mt-4">
                    <div className="flex flex-col items-center">
                         <span className="text-[8px] font-black text-pulse-500 uppercase tracking-[0.3em] mb-1 italic">Abort Simulation</span>
                         <ControlButton 
                            onPress={() => onButtonPress('quit')} 
                            onRelease={() => onButtonRelease('quit')} 
                            className="px-8 py-2 bg-[#111] border-2 border-pulse-500 rounded-full flex items-center justify-center text-pulse-500 font-black italic uppercase text-[10px] shadow-lg hover:bg-pulse-500 hover:text-white transition-all active:scale-90"
                         >
                            QUIT_MISSION
                         </ControlButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
