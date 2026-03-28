/**
 * THE VOID // SOUND_SYNTH v2.0
 * Mode-aware procedural audio. Tones adapt to noir / glass / terminal aesthetics.
 * All synthesis is Web Audio API only — zero dependencies, zero network calls.
 */

import type { Mode } from '../src/App';

/* ─── Tone profiles per mode ─── */
interface ModeProfile {
  oscType:    OscillatorType;
  baseFreq:   number;          // root pitch multiplier (1 = neutral)
  filterFreq: number;          // ambient low-pass cutoff
  ambientFreq: number;         // drone frequency
  volume:     number;          // master output scale
}

const MODE_PROFILES: Record<string, ModeProfile> = {
  noir: {
    oscType:    'sawtooth',
    baseFreq:   1,
    filterFreq: 380,
    ambientFreq: 55,           // low industrial hum
    volume:     0.05,
  },
  glass: {
    oscType:    'sine',
    baseFreq:   1.25,          // brighter pitch
    filterFreq: 800,
    ambientFreq: 110,          // airy, higher drone
    volume:     0.035,
  },
  terminal: {
    oscType:    'square',
    baseFreq:   0.9,
    filterFreq: 250,           // narrower, more retro
    ambientFreq: 40,           // deep CRT hum
    volume:     0.06,
  },
};

class SoundManager {
  private ctx:             AudioContext | null = null;
  private masterGain:      GainNode | null = null;
  private ambientOsc:      OscillatorNode | null = null;
  private ambientGain:     GainNode | null = null;
  private ambientFilter:   BiquadFilterNode | null = null;
  private isAmbientActive: boolean = false;
  private currentMode:     string = 'noir';
  private isMuted:         boolean = false;

  /* ── Context lazy-init ── */
  private ctx_(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /* ── Master gain (shared across all sounds) ── */
  private master(): GainNode {
    const ctx = this.ctx_();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  /* ── Core tone builder ── */
  private tone(
    freq:     number,
    type:     OscillatorType,
    duration: number,
    volume:   number = 0.08,
    options:  { detune?: number; attack?: number; decay?: number } = {}
  ) {
    if (this.isMuted) return;
    try {
      const ctx  = this.ctx_();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const now  = ctx.currentTime;
      const { detune = 0, attack = 0.005, decay = duration } = options;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (detune) osc.detune.setValueAtTime(detune, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.master());

      osc.start(now);
      osc.stop(now + decay + 0.01);
    } catch {
      /* AudioContext restrictions (autoplay policy) — silent fail */
    }
  }

  /* ── Profile helper ── */
  private profile(): ModeProfile {
    return MODE_PROFILES[this.currentMode] ?? MODE_PROFILES.noir;
  }

  /* ═══════════════════════════════════════
     PUBLIC: Ambient drone
  ═══════════════════════════════════════ */
  public setAmbient(enabled: boolean, mode: Mode | string = 'noir') {
    this.currentMode = mode;
    if (!enabled) {
      this.stopAmbient();
      return;
    }
    if (!this.isAmbientActive) this.startAmbient();
    else this.updateAmbientForMode(); // live-update if mode changed while ambient running
  }

  private startAmbient() {
    try {
      const ctx   = this.ctx_();
      const prof  = this.profile();
      const now   = ctx.currentTime;

      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientFilter.type            = 'lowpass';
      this.ambientFilter.frequency.value = prof.filterFreq;
      this.ambientFilter.Q.value         = 0.8;

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(prof.volume, now + 3);

      this.ambientOsc = ctx.createOscillator();
      this.ambientOsc.type = prof.oscType;
      this.ambientOsc.frequency.setValueAtTime(prof.ambientFreq, now);

      this.ambientOsc.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.master());

      this.ambientOsc.start();
      this.isAmbientActive = true;
    } catch {
      this.isAmbientActive = false;
    }
  }

  private updateAmbientForMode() {
    if (!this.ctx || !this.ambientOsc || !this.ambientFilter || !this.ambientGain) return;
    const prof = this.profile();
    const now  = this.ctx.currentTime;
    this.ambientOsc.frequency.exponentialRampToValueAtTime(prof.ambientFreq, now + 2);
    this.ambientFilter.frequency.exponentialRampToValueAtTime(prof.filterFreq, now + 2);
    this.ambientGain.gain.exponentialRampToValueAtTime(prof.volume, now + 2);
  }

  private stopAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    setTimeout(() => {
      try {
        this.ambientOsc?.stop();
        this.ambientOsc?.disconnect();
        this.ambientFilter?.disconnect();
        this.ambientGain?.disconnect();
      } catch {}
      this.ambientOsc     = null;
      this.ambientFilter  = null;
      this.ambientGain    = null;
      this.isAmbientActive = false;
    }, 1600);
  }

  /* ═══════════════════════════════════════
     PUBLIC: UI sounds — mode-adaptive
  ═══════════════════════════════════════ */

  /** Short confirm click */
  public playClick() {
    const p = this.profile();
    this.tone(800 * p.baseFreq, 'sine', 0.06, 0.05, { attack: 0.002 });
  }

  /** Lightweight pop (nav hover, toggle) */
  public playPop() {
    const p = this.profile();
    this.tone(1200 * p.baseFreq, 'sine', 0.04, 0.03, { attack: 0.001, decay: 0.04 });
  }

  /** Correct answer / success */
  public playCorrect() {
    const p = this.profile();
    this.tone(600 * p.baseFreq, 'sine', 0.12, 0.08);
    setTimeout(() => this.tone(900 * p.baseFreq, 'sine', 0.18, 0.08), 60);
  }

  /** Wrong answer / error */
  public playWrong() {
    this.tone(120, 'sawtooth', 0.35, 0.07, { attack: 0.01 });
    setTimeout(() => this.tone(90, 'sawtooth', 0.25, 0.05), 80);
  }

  /** Action (hard drop, confirm, lock-in) */
  public playAction() {
    const p = this.profile();
    this.tone(260 * p.baseFreq, p.oscType, 0.1, 0.06, { attack: 0.003 });
  }

  /** Victory fanfare */
  public playWin() {
    const p    = this.profile();
    const base = p.baseFreq;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => this.tone(f * base, 'sine', 0.45, 0.06), i * 110);
    });
  }

  /** Defeat / loss */
  public playLoss() {
    [220, 164.81, 110].forEach((f, i) => {
      setTimeout(() => this.tone(f, 'sawtooth', 0.7, 0.07, { attack: 0.02 }), i * 220);
    });
  }

  /** Splash screen boot ping (progress 0–100) */
  public playBootPing(progress: number) {
    const freq = 1200 + progress * 6;
    this.tone(freq, 'sine', 0.07, 0.025, { attack: 0.003, decay: 0.06 });
  }

  /** Splash screen boot complete */
  public playBootComplete() {
    const p = this.profile();
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => this.tone(f * p.baseFreq, 'sine', 1.4, 0.05, { attack: 0.02 }), i * 130);
    });
  }

  /* ═══════════════════════════════════════
     PUBLIC: Utility
  ═══════════════════════════════════════ */

  /** Toggle global mute without stopping ambient (fades master gain) */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.2);
  }

  public getMuted() { return this.isMuted; }
}

export const soundService = new SoundManager();
