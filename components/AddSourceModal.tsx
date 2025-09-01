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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-white">Add New Source</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700" aria-label="Close">
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