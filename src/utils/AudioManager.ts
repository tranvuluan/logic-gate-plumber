/**
 * AudioManager - High-performance Cyberpunk Procedural Music & Sound Engine
 * Features a multi-track Web Audio step-sequencer with unique musical themes
 * for EACH Chapter (Chapters 1 to 5, Endless Mode, and Menu).
 * 
 * 100% offline, zero external audio asset dependencies, zero network latency.
 */

interface ChapterTheme {
  name: string;
  bpm: number;
  kickPattern: number[];      // 16-step kick drum trigger (1 = hit, 0 = rest)
  hatPattern: number[];       // 16-step electronic hi-hat trigger
  bassPattern: (number | null)[]; // 16-step bass frequencies (Hz)
  leadPattern: (number | null)[]; // 16-step melodic arp lead frequencies (Hz)
  bassType: OscillatorType;
  leadType: OscillatorType;
  filterFreq: number;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMutedState: boolean = false;
  private masterGain: GainNode | null = null;
  private bgmMasterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Step-sequencer scheduler state
  private isBgmPlaying: boolean = false;
  private currentChapter: number = 0; // 0 = Menu, 1-5 = Chapters, 6 = Endless
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private schedulerTimerId: any = null;
  private readonly lookaheadMs: number = 25;
  private readonly scheduleAheadSec: number = 0.1;
  private readonly STORAGE_KEY = 'logic_gate_plumber_muted';

  // 7 Unique Themes: Menu + Chapters 1 to 5 + Endless Mode
  private themes: Record<number, ChapterTheme> = {
    // 0: Menu Theme - Chill Cyber Lounge (104 BPM, D minor dream)
    0: {
      name: 'Cyber Lounge',
      bpm: 104,
      kickPattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      hatPattern:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
      bassPattern: [
        146.83, null, null, 146.83, null, null, 174.61, null,
        130.81, null, null, 130.81, null, null, 116.54, null,
      ],
      leadPattern: [
        293.66, null, 349.23, null, 440.0, null, 523.25, null,
        392.0, null, 349.23, null, 293.66, 329.63, 349.23, null,
      ],
      bassType: 'triangle',
      leadType: 'sine',
      filterFreq: 850,
    },

    // 1: Chapter 1 - "Genesis / Khởi Nguyên" (110 BPM, Melodic, Optimistic A-minor)
    1: {
      name: 'Genesis',
      bpm: 110,
      kickPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hatPattern:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
      bassPattern: [
        110.0, null, 110.0, null, 130.81, null, 146.83, null,
        98.0, null, 98.0, null, 123.47, null, 110.0, null,
      ],
      leadPattern: [
        440.0, null, 523.25, 659.25, null, 523.25, 440.0, null,
        392.0, null, 493.88, 587.33, null, 493.88, 440.0, 523.25,
      ],
      bassType: 'triangle',
      leadType: 'sine',
      filterFreq: 950,
    },

    // 2: Chapter 2 - "Inversion & Bridges" (118 BPM, Funky 80s Synthwave)
    2: {
      name: 'Synthwave Neon',
      bpm: 118,
      kickPattern: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
      hatPattern:  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
      bassPattern: [
        146.83, 146.83, null, 146.83, 174.61, null, 196.0, null,
        130.81, 130.81, null, 130.81, 164.81, null, 146.83, null,
      ],
      leadPattern: [
        587.33, null, 440.0, null, 698.46, null, 587.33, null,
        523.25, null, 392.0, null, 659.25, null, 587.33, null,
      ],
      bassType: 'sawtooth',
      leadType: 'triangle',
      filterFreq: 700,
    },

    // 3: Chapter 3 - "Locked Tiles & Multi-State" (124 BPM, Darksynth Industrial Cyberpunk)
    3: {
      name: 'Industrial Cyber',
      bpm: 124,
      kickPattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
      hatPattern:  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
      bassPattern: [
        92.5, null, 92.5, null, 92.5, 110.0, null, 123.47,
        82.41, null, 82.41, null, 82.41, 98.0, null, 92.5,
      ],
      leadPattern: [
        370.0, 440.0, null, 370.0, 493.88, null, 554.37, null,
        329.63, 392.0, null, 329.63, 440.0, null, 370.0, null,
      ],
      bassType: 'sawtooth',
      leadType: 'sawtooth',
      filterFreq: 600,
    },

    // 4: Chapter 4 - "Clock & Truth Tables" (128 BPM, Energetic Techno Pulse)
    4: {
      name: 'Matrix Clockwork',
      bpm: 128,
      kickPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hatPattern:  [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      bassPattern: [
        82.41, null, 82.41, null, 98.0, null, 110.0, null,
        73.42, null, 73.42, null, 87.31, null, 98.0, 82.41,
      ],
      leadPattern: [
        659.25, 783.99, 987.77, 659.25, 783.99, 987.77, 1174.66, null,
        587.33, 698.46, 880.0, 587.33, 698.46, 880.0, 1046.5, null,
      ],
      bassType: 'triangle',
      leadType: 'triangle',
      filterFreq: 1100,
    },

    // 5: Chapter 5 - "Master Engineer / Bậc Thầy Vi Mạch" (134 BPM, Epic High-Tech Anthem)
    5: {
      name: 'Master Anthem',
      bpm: 134,
      kickPattern: [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0],
      hatPattern:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      bassPattern: [
        130.81, 130.81, null, 155.56, 174.61, null, 196.0, null,
        116.54, 116.54, null, 138.59, 155.56, null, 130.81, null,
      ],
      leadPattern: [
        523.25, 622.25, 783.99, 1046.5, 783.99, 622.25, 523.25, 622.25,
        466.16, 587.33, 698.46, 932.33, 698.46, 587.33, 523.25, 622.25,
      ],
      bassType: 'sawtooth',
      leadType: 'triangle',
      filterFreq: 1250,
    },

    // 6: Endless Mode - "Infinite Cosmos" (120 BPM, Futuristic Galaxy Rave)
    6: {
      name: 'Cosmic Endless',
      bpm: 120,
      kickPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hatPattern:  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
      bassPattern: [
        174.61, null, 174.61, null, 220.0, null, 261.63, null,
        146.83, null, 146.83, null, 196.0, null, 174.61, null,
      ],
      leadPattern: [
        698.46, 880.0, 1046.5, null, 880.0, 1046.5, 1318.51, null,
        587.33, 783.99, 880.0, null, 783.99, 880.0, 1174.66, null,
      ],
      bassType: 'triangle',
      leadType: 'sine',
      filterFreq: 1000,
    },
  };

  constructor() {
    try {
      this.isMutedState = localStorage.getItem(this.STORAGE_KEY) === 'true';
    } catch {
      this.isMutedState = false;
    }
  }

  /**
   * Initializes or resumes the AudioContext on user touch/click.
   */
  public resume(): void {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // BGM Master Gain (Separate channel so BGM stays well balanced behind SFX)
        this.bgmMasterGain = this.ctx.createGain();
        this.bgmMasterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.bgmMasterGain.connect(this.masterGain);

        // Pre-create 1-second white noise buffer for crisp hi-hats
        this.createNoiseBuffer();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
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
   * Selects and starts the background music specifically tuned for the given Chapter.
   * @param chapter 0 = Menu, 1 = Chapter 1, 2 = Chapter 2, 3 = Chapter 3, 4 = Chapter 4, 5 = Chapter 5, 6 = Endless
   */
  public setChapterBGM(chapter: number): void {
    const validChapter = Math.max(0, Math.min(6, chapter));
    if (this.currentChapter !== validChapter || !this.isBgmPlaying) {
      this.currentChapter = validChapter;
      this.currentStep = 0;
      this.startBGM();
    }
  }

  /**
   * Starts the high-precision step sequencer scheduler
   */
  public startBGM(): void {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    this.isBgmPlaying = true;
    if (this.nextStepTime < this.ctx.currentTime) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }

    if (!this.schedulerTimerId) {
      this.schedulerTimerId = setInterval(() => this.scheduleNextNotes(), this.lookaheadMs);
    }
  }

  public stopBGM(): void {
    this.isBgmPlaying = false;
    if (this.schedulerTimerId) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
  }

  /**
   * Lookahead Step Scheduler: Schedules audio events strictly into the future
   * ensuring zero audio drift and crystal clear rhythmic timing across all devices.
   */
  private scheduleNextNotes(): void {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmMasterGain) return;

    const theme = this.themes[this.currentChapter] || this.themes[0];
    const secondsPerBeat = 60.0 / theme.bpm;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.triggerStep(theme, this.currentStep, this.nextStepTime);
      this.nextStepTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  /**
   * Triggers the Kick drum, Hi-hat, Bass synth, and Melodic Arp for a single step
   */
  private triggerStep(theme: ChapterTheme, step: number, time: number): void {
    if (!this.ctx || !this.bgmMasterGain || this.isMutedState) return;

    // 1. Kick Drum
    if (theme.kickPattern[step]) {
      this.scheduleKick(time);
    }

    // 2. Electronic Hi-hat
    if (theme.hatPattern[step]) {
      this.scheduleHat(time, step % 2 === 1);
    }

    // 3. Bassline Synth
    const bassFreq = theme.bassPattern[step];
    if (bassFreq) {
      this.scheduleBass(bassFreq, theme.bassType, theme.filterFreq, time);
    }

    // 4. Melodic Arp Lead
    const leadFreq = theme.leadPattern[step];
    if (leadFreq) {
      this.scheduleLead(leadFreq, theme.leadType, time);
    }
  }

  private scheduleKick(time: number): void {
    if (!this.ctx || !this.bgmMasterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

      gain.gain.setValueAtTime(0.38, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      osc.connect(gain);
      gain.connect(this.bgmMasterGain);

      osc.start(time);
      osc.stop(time + 0.095);
    } catch {}
  }

  private scheduleHat(time: number, accent: boolean): void {
    if (!this.ctx || !this.bgmMasterGain || !this.noiseBuffer) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      const gain = this.ctx.createGain();
      const volume = accent ? 0.07 : 0.035;
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmMasterGain);

      source.start(time);
      source.stop(time + 0.045);
    } catch {}
  }

  private scheduleBass(freq: number, type: OscillatorType, filterCutoff: number, time: number): void {
    if (!this.ctx || !this.bgmMasterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, time);

      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmMasterGain);

      osc.start(time);
      osc.stop(time + 0.19);
    } catch {}
  }

  private scheduleLead(freq: number, type: OscillatorType, time: number): void {
    if (!this.ctx || !this.bgmMasterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(gain);
      gain.connect(this.bgmMasterGain);

      osc.start(time);
      osc.stop(time + 0.17);
    } catch {}
  }

  // ==========================================
  // SOUND EFFECTS (SFX)
  // ==========================================

  public playRotate(direction: 1 | -1 = 1): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = direction === 1 ? 380 : 640;
      const endFreq = direction === 1 ? 740 : 280;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.065);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.075);

      // Tactile click pulse
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1500, t);
      clickGain.gain.setValueAtTime(0.14, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      clickOsc.connect(clickGain);
      clickGain.connect(this.masterGain);
      clickOsc.start(t);
      clickOsc.stop(t + 0.02);
    } catch {}
  }

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

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  public playLedLit(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      [880, 1320].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.03);

        const startTime = t + idx * 0.03;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.23);
      });
    } catch {}
  }

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

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.23);
    } catch {}
  }

  public playWin(): void {
    if (this.isMutedState) return;
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const noteStart = t + i * 0.1;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.24, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.38);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch {}
  }

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

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.42);
    } catch {}
  }

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

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.055);
    } catch {}
  }
}

export const audio = new AudioManager();
