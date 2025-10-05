import React, { useEffect, useRef, useCallback } from 'react';
import * as JSNES from 'jsnes';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { rom } from '../data/mario_rom';

// Maps GameboyButton strings to JSNES controller constants
const controllerMap: { [key in GameboyButton]?: number } = {
    right: JSNES.Controller.BUTTON_RIGHT,
    left: JSNES.Controller.BUTTON_LEFT,
    down: JSNES.Controller.BUTTON_DOWN,
    up: JSNES.Controller.BUTTON_UP,
    a: JSNES.Controller.BUTTON_A,
    b: JSNES.Controller.BUTTON_B,
    select: JSNES.Controller.BUTTON_SELECT,
    start: JSNES.Controller.BUTTON_START,
};

// Maps keyboard event codes to JSNES controller constants
const keyboardMap: { [key: string]: { player: number; button: number } } = {
    ArrowRight: { player: 1, button: JSNES.Controller.BUTTON_RIGHT },
    ArrowLeft:  { player: 1, button: JSNES.Controller.BUTTON_LEFT },
    ArrowDown:  { player: 1, button: JSNES.Controller.BUTTON_DOWN },
    ArrowUp:    { player: 1, button: JSNES.Controller.BUTTON_UP },
    KeyX:       { player: 1, button: JSNES.Controller.BUTTON_A },
    KeyZ:       { player: 1, button: JSNES.Controller.BUTTON_B },
    Enter:      { player: 1, button: JSNES.Controller.BUTTON_START },
    Tab:        { player: 1, button: JSNES.Controller.BUTTON_SELECT },
};

interface MarioPageProps {
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const MarioPage: React.FC<MarioPageProps> = ({ onBackToHub, onReturnToFeeds }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nesRef = useRef<JSNES.NES | null>(null);
    // FIX: `useRef<number>()` is invalid. It needs an initial value. Using `null` for consistency.
    const animationFrameId = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const SCREEN_WIDTH = 256;
    const SCREEN_HEIGHT = 240;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        canvas.width = SCREEN_WIDTH;
        canvas.height = SCREEN_HEIGHT;
        
        const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        const buffer = new Uint32Array(imageData.data.buffer);
        const onFrame = (frameBuffer: number[]) => {
            for (let i = 0; i < frameBuffer.length; i++) {
                buffer[i] = 0xff000000 | frameBuffer[i];
            }
            ctx.putImageData(imageData, 0, 0);
        };

        const AUDIO_BUFFER_SIZE = 4096;
        
        let localAudioContext: AudioContext;
        try {
            // Pass an empty options object to the AudioContext constructor.
            localAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({});
            audioContextRef.current = localAudioContext;
        } catch (e) {
            console.error("Could not create AudioContext:", e);
            return; // Exit if audio context fails
        }

        const scriptProcessor = localAudioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 0, 1);
        
        scriptProcessor.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            if(nesRef.current) {
                nesRef.current.audio.fill_buffer(output);
            }
        };

        nesRef.current = new JSNES.NES({ 
            onFrame,
            sampleRate: localAudioContext.sampleRate,
        });

        // Connect the script processor to the audio context destination *after*
        // the NES instance is created to avoid a race condition where the audio
        // process callback might fire before nesRef.current is initialized.
        scriptProcessor.connect(localAudioContext.destination);

        const nes = nesRef.current;
        
        try {
            const decodedRom = atob(rom);
            nes.loadROM(decodedRom);
        } catch(e) {
            console.error("Error decoding or loading ROM:", e);
            return;
        }

        const gameLoop = () => {
            nes.frame();
            animationFrameId.current = requestAnimationFrame(gameLoop);
        };
        
        const onKeyDown = (e: KeyboardEvent) => {
            const mapping = keyboardMap[e.code];
            if (mapping && nesRef.current) {
                e.preventDefault();
                nesRef.current.buttonDown(mapping.player, mapping.button);
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const mapping = keyboardMap[e.code];
            if (mapping && nesRef.current) {
                e.preventDefault();
                nesRef.current.buttonUp(mapping.player, mapping.button);
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        gameLoop();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            scriptProcessor.disconnect();
            localAudioContext.close();
            nesRef.current = null;
        };
    }, []);

    const handleButtonPress = useCallback((button: GameboyButton) => {
        audioContextRef.current?.resume(); // Ensure audio starts on user interaction
        const nesButton = controllerMap[button];
        if (nesButton !== undefined && nesRef.current) {
            nesRef.current.buttonDown(1, nesButton);
        }
    }, []);

    const handleButtonRelease = useCallback((button: GameboyButton) => {
        const nesButton = controllerMap[button];
        if (nesButton !== undefined && nesRef.current) {
            nesRef.current.buttonUp(1, nesButton);
        }
    }, []);

    return (
        <main className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white font-mono overflow-hidden">
            <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
                <button onClick={onBackToHub} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Hub</button>
                <button onClick={onReturnToFeeds} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Feeds</button>
            </div>

            <div className="w-full flex-grow bg-black flex items-center justify-center">
                <canvas 
                    ref={canvasRef} 
                    className="w-full h-full object-contain"
                />
            </div>
            <GameboyControls onButtonPress={handleButtonPress} onButtonRelease={handleButtonRelease} />
        </main>
    );
};

export default MarioPage;
