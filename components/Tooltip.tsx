import React from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
    return (
        <div className="group relative flex items-center justify-center">
            {children}
            <div className={`pointer-events-none absolute ${position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-[200] w-max max-w-[180px] scale-95 group-hover:scale-100`}>
                <div className="bg-zinc-900 border-2 border-pulse-500/40 px-3 py-2 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md relative">
                    <p className="text-[8px] font-black uppercase italic tracking-[0.15em] text-pulse-500 leading-relaxed text-center">
                        {text}
                    </p>
                    {/* Arrow */}
                    <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r-2 border-b-2 border-pulse-500/40 rotate-45 ${position === 'top' ? '-bottom-1.5' : '-top-1.5'}`} />
                </div>
            </div>
        </div>
    );
};

export default Tooltip;