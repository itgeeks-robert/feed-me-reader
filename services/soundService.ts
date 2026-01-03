
/**
 * THE VOID // SOUND_SYNTH_v1.0
 * Procedural audio generation for technical noir aesthetic.
 * Uses Web Audio API to avoid external asset dependencies.
 */

class SoundManager {
    private ctx: AudioContext | null = null;

    private getContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, fade: boolean = true) {
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(volume, ctx.currentTime);
            if (fade) {
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            }

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio bypass triggered.");
        }
    }

    // --- GAME PRESETS ---

    public playClick() {
        this.playTone(800, 'sine', 0.05, 0.05);
    }

    public playCorrect() {
        const ctx = this.getContext();
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(900, 'sine', 0.15, 0.1), 50);
    }

    public playWrong() {
        this.playTone(150, 'sawtooth', 0.3, 0.08);
    }

    public playNeutral() {
        this.playTone(400, 'sine', 0.1, 0.05);
    }

    public playPop() {
        this.playTone(1200, 'sine', 0.03, 0.03);
    }

    public playWin() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.1), i * 100);
        });
    }

    public playLoss() {
        const notes = [300, 200, 150];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sawtooth', 0.5, 0.1), i * 150);
        });
    }

    public playAction() {
        this.playTone(250, 'square', 0.08, 0.04);
    }

    public playGlitch() {
        const ctx = this.getContext();
        for(let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(Math.random() * 1000 + 100, 'square', 0.02, 0.02);
            }, i * 20);
        }
    }
}

export const soundService = new SoundManager();
