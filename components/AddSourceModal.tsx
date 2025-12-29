import React from 'react';
import AddSource, { SourceType } from './AddSource';
import { XIcon } from './icons';

interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({ isOpen, onClose, onAddSource }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-md relative animate-fade-in" onClick={e => e.stopPropagation()}>
                {/* 3D Frame Highlighting */}
                <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700 pointer-events-none z-10" />
                <div className="absolute inset-0 border-b-2 border-r-2 border-black pointer-events-none z-10" />

                <header className="h-10 bg-zinc-800 flex items-center justify-between px-1 relative z-20 border-b-2 border-black">
                    <div className="flex items-center gap-2 h-full">
                        <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                           <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                        </button>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-widest italic px-2">NEW_SIGNAL_LINK</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                        <XIcon className="w-4 h-4 text-black" />
                    </button>
                </header>
                
                <div className="p-8 bg-void-950">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                    <div className="relative z-10">
                        <AddSource onAddSource={onAddSource} onSuccess={onClose} />
                    </div>
                </div>

                <footer className="h-4 bg-zinc-300 border-t-2 border-black shrink-0" />
            </div>
        </div>
    );
};

export default AddSourceModal;