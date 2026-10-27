/**
 * AudioManager - High-performance Web Audio API Sound Synthesizer
 * Synthesizes cyberpunk digital audio effects and ambient BGM purely in code.
 * 100% offline, zero network latency, zero external audio asset dependencies.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMutedState: boolean = false;
  private bgmGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmIntervalId: any = null;
  private isBgmPlaying: boolean = false;
  private readonly STORAGE_KEY = 'logic_gate_plumber_muted';

  constructor() {
    try {
      this.isMutedState = localStorage.getItem(this.STORAGE_KEY) === 'true';
    } catch {
      this.isMutedState = false;
    }
  }

  /**
   * Initializes or resumes the AudioContext on user interaction.
   * Required by modern browsers / mobile devices to unlock audio.
   */
  public resume(): void {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public setMute(muted: boolean): boolean {
    this.isMutedState = muted;
    try {
      localStorage.setItem(this.STORAGE_KEY, String(muted));
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }

    return this.isMutedState;
  }

  public toggleMute(): boolean {
    return this.setMute(!this.isMutedState);
  }

  /**
   * Plays snappy logic gate rotation click
   * direction 1 (Clockwise) has an ascending crisp tone, -1 has a descending tone
   */
  public playRotate(direction: 1 | -1 = 1): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = direction === 1 ? 380 : 640;
      const endFreq = direction === 1 ? 720 : 280;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.065);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.075);

      // Add high tactile click pulse
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1400, t);
      clickGain.gain.setValueAtTime(0.12, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      clickOsc.connect(clickGain);
      clickGain.connect(this.masterGain);
      clickOsc.start(t);
      clickOsc.stop(t + 0.02);
    } catch {}
  }

  /**
   * Plays electric signal flow surge when electricity routes through gates
   */
  public playFlow(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(580, t + 0.14);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  /**
   * Plays bright LED bulb illumination chime
   */
  public playLedLit(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;

      // Dual harmonic bell
      [880, 1320].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.03);

        const startTime = t + idx * 0.03;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.23);
      });
    } catch {}
  }

  /**
   * Plays electric spark / short-circuit buzz crackle
   */
  public playShortCircuit(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(140, t + 0.08);
      osc.frequency.linearRampToValueAtTime(70, t + 0.18);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.23);
    } catch {}
  }

  /**
   * Plays victory fanfare arpeggio on level completion
   */
  public playWin(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      // C Major cyber arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const noteStart = t + i * 0.1;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.22, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.38);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch {}
  }

  /**
   * Plays out of moves / fail buzz
   */
  public playFail(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.35);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.42);
    } catch {}
  }

  /**
   * Plays hint used / magical cyber unlock sound
   */
  public playHint(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [440, 660, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const noteTime = t + idx * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.22);
      });
    } catch {}
  }

  /**
   * Plays standard UI button blip
   */
  public playButtonClick(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.055);
    } catch {}
  }

  /**
   * Starts ambient sci-fi digital pulse BGM (Cyberpunk Arp Synth)
   * Ambient, relaxing, non-intrusive for puzzle gameplay
   */
  public startBGM(): void {
    if (this.isBgmPlaying) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    this.isBgmPlaying = true;

    // Ambient note progression (C minor 9th space chords: C3, G3, Eb4, Bb4, D5)
    const arpNotes = [130.81, 196.0, 311.13, 466.16, 587.33, 466.16, 311.13, 196.0];
    let noteIdx = 0;

    const playNextArp = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.masterGain || this.isMutedState) return;

      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        const freq = arpNotes[noteIdx];
        noteIdx = (noteIdx + 1) % arpNotes.length;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, t);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.7);
      } catch {}
    };

    // Low gentle pulse every 600ms (100 BPM ambient)
    this.bgmIntervalId = setInterval(playNextArp, 600);
  }

  public stopBGM(): void {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const audio = new AudioManager();
