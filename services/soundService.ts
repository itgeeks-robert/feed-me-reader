
/**
 * THE VOID // SOUND_SYNTH_v1.3
 * Procedural audio generation for technical noir aesthetic.
 */

import { Theme } from '../src/App';

class SoundManager {
    private ctx: AudioContext | null = null;
    private ambientOsc: OscillatorNode | null = null;
    private ambientGain: GainNode | null = null;
    private filter: BiquadFilterNode | null = null;
    private isAmbientPlaying: boolean = false;

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
            console.warn("Audio Context Restriction Active.");
        }
    }

    public setAmbient(enabled: boolean, theme: Theme = 'noir') {
        if (!enabled) {
            this.stopAmbientInternal();
            return;
        }
        if (!this.isAmbientPlaying) {
            this.startAmbientInternal(theme);
        }
    }

    private startAmbientInternal(theme: Theme) {
        try {
            const ctx = this.getContext();
            this.isAmbientPlaying = true;
            this.ambientGain = ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.0001, ctx.currentTime);
            this.ambientGain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2);

            this.filter = ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 400;

            this.ambientOsc = ctx.createOscillator();
            this.ambientOsc.type = 'sawtooth';
            this.ambientOsc.frequency.value = 55;

            this.ambientOsc.connect(this.filter);
            this.filter.connect(this.ambientGain);
            this.ambientGain.connect(ctx.destination);
            this.ambientOsc.start();
        } catch (e) {
            this.isAmbientPlaying = false;
        }
    }

    private stopAmbientInternal() {
        if (this.ambientGain && this.ctx) {
            this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
            setTimeout(() => {
                this.ambientOsc?.stop();
                this.ambientOsc?.disconnect();
                this.ambientGain?.disconnect();
                this.isAmbientPlaying = false;
            }, 1000);
        }
    }

    // --- UI SOUNDS ---
    public playClick() { this.playTone(800, 'sine', 0.05, 0.05); }
    public playCorrect() { this.playTone(600, 'sine', 0.1, 0.1); setTimeout(() => this.playTone(900, 'sine', 0.15, 0.1), 50); }
    public playWrong() { this.playTone(150, 'sawtooth', 0.3, 0.08); }
    public playAction() { this.playTone(250, 'square', 0.08, 0.04); }
    public playPop() { this.playTone(1200, 'sine', 0.03, 0.03); }

    public playWin() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.4, 0.06, true), i * 100);
        });
    }

    public playLoss() {
        const notes = [220, 164.81, 110];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sawtooth', 0.6, 0.08, true), i * 200);
        });
    }

    // --- BOOT SEQUENCE ---
    public playBootPing(progress: number) {
        // High frequency ping that rises slightly with progress
        const freq = 1200 + (progress * 5);
        this.playTone(freq, 'sine', 0.06, 0.03, true);
    }

    public playBootComplete() {
        // Uplifting major sequence for successful breach
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 1.2, 0.05, true), i * 120);
        });
    }
}

export const soundService = new SoundManager();
