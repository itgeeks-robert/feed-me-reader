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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white/50 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add New Source</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10" aria-label="Close">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="p-6">
                    <AddSource onAddSource={onAddSource} onSuccess={onClose} />
                </div>
            </div>
        </div>
    );
};

export default AddSourceModal;