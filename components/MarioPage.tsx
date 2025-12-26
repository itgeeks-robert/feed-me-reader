import React from 'react';

const MarioPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void }> = ({ onBackToHub }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 font-black uppercase italic">
            <p>Game Removed</p>
            <button onClick={onBackToHub} className="mt-4 px-6 py-2 bg-zinc-900 border border-white/10 rounded-full text-xs">Back to Hub</button>
        </div>
    );
};

export default MarioPage;
