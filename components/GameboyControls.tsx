import React from 'react';

type DPadDirection = 'up' | 'down' | 'left' | 'right';
type ButtonType = 'a' | 'b' | 'start' | 'select';
export type GameboyButton = DPadDirection | ButtonType;

interface GameboyControlsProps {
  onButtonPress: (button: GameboyButton) => void;
  onButtonRelease: (button: GameboyButton) => void;
}

const Button: React.FC<{
  onPress: () => void;
  onRelease: () => void;
  className?: string;
  children?: React.ReactNode;
}> = ({ onPress, onRelease, className, children }) => {
    
    const handlePress = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
    };

    const handleRelease = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onRelease();
    };

    return (
        <div
            className={`select-none ${className}`}
            onTouchStart={handlePress}
            onTouchEnd={handleRelease}
            onMouseDown={handlePress}
            onMouseUp={handleRelease}
            onMouseLeave={handleRelease}
        >
            {children}
        </div>
    );
};

export const GameboyControls: React.FC<GameboyControlsProps> = ({ onButtonPress, onButtonRelease }) => {
    const dpadButtonClasses = "absolute bg-[#2d2d2d] w-[33.33%] h-[33.33%] active:bg-[#454545] transition-colors";
    const actionButtonClasses = "w-16 h-16 rounded-full bg-[#a02c42] border-2 border-[#6f1d2e] shadow-md flex items-center justify-center font-bold text-lg text-white/80 active:bg-[#c03952] active:scale-95 transition-transform";
    const startSelectClasses = "w-16 h-7 bg-[#2d2d2d] rounded-full flex items-center justify-center text-xs font-bold text-white/60 uppercase active:bg-[#454545]";

    return (
        <div className="w-full bg-[#d1d1d1] p-6 pt-4 border-t-2 border-black/10 flex-shrink-0 flex flex-col items-center">
             <div className="flex justify-between items-center w-full max-w-sm">
                 {/* D-Pad */}
                <div className="relative w-36 h-36">
                    <div className="absolute inset-0 bg-[#2d2d2d] rounded-full shadow-inner"></div>
                    <div className="absolute w-[33.33%] h-full left-[33.33%] top-0 bg-[#2d2d2d]"></div>
                    <div className="absolute h-[33.33%] w-full top-[33.33%] left-0 bg-[#2d2d2d]"></div>
                    <Button onPress={() => onButtonPress('up')} onRelease={() => onButtonRelease('up')} className={`${dpadButtonClasses} top-0 left-[33.33%] rounded-t-md`}/>
                    <Button onPress={() => onButtonPress('down')} onRelease={() => onButtonRelease('down')} className={`${dpadButtonClasses} bottom-0 left-[33.33%] rounded-b-md`}/>
                    <Button onPress={() => onButtonPress('left')} onRelease={() => onButtonRelease('left')} className={`${dpadButtonClasses} left-0 top-[33.33%] rounded-l-md`}/>
                    <Button onPress={() => onButtonPress('right')} onRelease={() => onButtonRelease('right')} className={`${dpadButtonClasses} right-0 top-[33.33%] rounded-r-md`}/>
                </div>
                 {/* A & B Buttons */}
                <div className="relative w-40 h-24">
                    <Button onPress={() => onButtonPress('b')} onRelease={() => onButtonRelease('b')} className={`absolute top-8 left-0 ${actionButtonClasses}`}>B</Button>
                    <Button onPress={() => onButtonPress('a')} onRelease={() => onButtonRelease('a')} className={`absolute top-0 right-0 ${actionButtonClasses}`}>A</Button>
                </div>
             </div>

             {/* Start & Select */}
             <div className="flex justify-center items-center gap-6 mt-4">
                <Button onPress={() => onButtonPress('select')} onRelease={() => onButtonRelease('select')} className={startSelectClasses}>SELECT</Button>
                <Button onPress={() => onButtonPress('start')} onRelease={() => onButtonRelease('start')} className={startSelectClasses}>START</Button>
             </div>
        </div>
    );
};