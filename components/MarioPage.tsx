import React, { useEffect, useRef } from 'react';
import { GameboyControls, GameboyButton } from './GameboyControls';

// Dispatches a keyboard event to the window, which the iframe will listen for.
const dispatchKeyEvent = (type: 'keydown' | 'keyup', key: string, code: string) => {
    window.dispatchEvent(new KeyboardEvent(type, {
        key: key,
        code: code,
        bubbles: true,
        cancelable: true,
    }));
};

// Controls are mapped to common emulator keybindings for Super Mario Bros.
const CONTROLS = {
    LEFT: { key: 'ArrowLeft', code: 'ArrowLeft' },
    RIGHT: { key: 'ArrowRight', code: 'ArrowRight' },
    DOWN: { key: 'ArrowDown', code: 'ArrowDown' },
    JUMP: { key: 'x', code: 'KeyX' }, // 'A' button
    RUN: { key: 'z', code: 'KeyZ' },   // 'B' button
};


interface MarioPageProps {
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const MarioPage: React.FC<MarioPageProps> = ({ onBackToHub, onReturnToFeeds }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Periodically focus the iframe to help ensure it receives dispatched key events
        const focusInterval = setInterval(() => {
            if (document.activeElement !== iframeRef.current) {
                iframeRef.current?.focus();
            }
        }, 1000);

        return () => {
            clearInterval(focusInterval);
        };
    }, []);

    const handleButtonPress = (button: GameboyButton) => {
        switch(button) {
            case 'left': dispatchKeyEvent('keydown', CONTROLS.LEFT.key, CONTROLS.LEFT.code); break;
            case 'right': dispatchKeyEvent('keydown', CONTROLS.RIGHT.key, CONTROLS.RIGHT.code); break;
            case 'down': dispatchKeyEvent('keydown', CONTROLS.DOWN.key, CONTROLS.DOWN.code); break;
            case 'a': dispatchKeyEvent('keydown', CONTROLS.JUMP.key, CONTROLS.JUMP.code); break;
            case 'b': dispatchKeyEvent('keydown', CONTROLS.RUN.key, CONTROLS.RUN.code); break;
        }
    };
    const handleButtonRelease = (button: GameboyButton) => {
        switch(button) {
            case 'left': dispatchKeyEvent('keyup', CONTROLS.LEFT.key, CONTROLS.LEFT.code); break;
            case 'right': dispatchKeyEvent('keyup', CONTROLS.RIGHT.key, CONTROLS.RIGHT.code); break;
            case 'down': dispatchKeyEvent('keyup', CONTROLS.DOWN.key, CONTROLS.DOWN.code); break;
            case 'a': dispatchKeyEvent('keyup', CONTROLS.JUMP.key, CONTROLS.JUMP.code); break;
            case 'b': dispatchKeyEvent('keyup', CONTROLS.RUN.key, CONTROLS.RUN.code); break;
        }
    };


  return (
    <main className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white font-mono overflow-hidden">
        <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
            <button onClick={onBackToHub} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Hub</button>
            <button onClick={onReturnToFeeds} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Feeds</button>
        </div>

        <div className="w-full flex-grow bg-black relative">
            <iframe
                ref={iframeRef}
                src="https://super-mario-bros-online.github.io/"
                className="w-full h-full border-none"
                title="Super Mario Bros Online"
                allow="gamepad"
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            ></iframe>
        </div>
        <GameboyControls onButtonPress={handleButtonPress} onButtonRelease={handleButtonRelease} />
    </main>
  );
};

export default MarioPage;
