// Web Audio API Synthesizer for Drone Logic Lab
// Self-contained sound effects and cozy retro chiptune background music

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Background Music (BGM) State & Nodes
  private bgmGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private isBgmPlaying: boolean = false;
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;
  public bgmVolume: number = 0.028; // Soft, ambient, non-strident

  // Timing: 110 BPM, 8th-note steps (~0.2727 seconds per step)
  private readonly STEP_TIME = (60 / 110) / 2;
  private readonly LOOKAHEAD = 0.25;
  private readonly SCHEDULE_INTERVAL = 90;

  // 32-step retro farm adventure chord progression (C - Am - F - G)
  // Designed to be melodic, relaxed, joyful, and never sharp or annoying
  private readonly BGM_PATTERN: Array<{ melody?: number; bass?: number }> = [
    // Measure 1: C Major (C - E - G - B - C)
    { bass: 130.81, melody: 261.63 }, // C3, C4
    { melody: 329.63 },               // E4
    { bass: 196.00, melody: 392.00 }, // G3, G4
    { melody: 493.88 },               // B4
    { bass: 130.81, melody: 523.25 }, // C3, C5
    { melody: 392.00 },               // G4
    { bass: 196.00, melody: 329.63 }, // G3, E4
    { melody: 293.66 },               // D4

    // Measure 2: A Minor (A - C - E - A)
    { bass: 110.00, melody: 261.63 }, // A2, C4
    { melody: 329.63 },               // E4
    { bass: 164.81, melody: 440.00 }, // E3, A4
    { melody: 523.25 },               // C5
    { bass: 110.00, melody: 493.88 }, // A2, B4
    { melody: 440.00 },               // A4
    { bass: 164.81, melody: 392.00 }, // E3, G4
    { melody: 329.63 },               // E4

    // Measure 3: F Major (F - A - C - F)
    { bass: 87.31, melody: 220.00 },  // F2, A3
    { melody: 261.63 },               // C4
    { bass: 130.81, melody: 349.23 }, // C3, F4
    { melody: 440.00 },               // A4
    { bass: 87.31, melody: 523.25 },  // F2, C5
    { melody: 440.00 },               // A4
    { bass: 130.81, melody: 392.00 }, // C3, G4
    { melody: 349.23 },               // F4

    // Measure 4: G Major (G - B - D - G)
    { bass: 98.00, melody: 246.94 },  // G2, B3
    { melody: 293.66 },               // D4
    { bass: 146.83, melody: 392.00 }, // D3, G4
    { melody: 493.88 },               // B4
    { bass: 98.00, melody: 587.33 },  // G2, D5
    { melody: 493.88 },               // B4
    { bass: 146.83, melody: 440.00 }, // D3, A4
    { melody: 392.00 },               // G4
  ];

  public initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private initBgmNodes() {
    if (!this.ctx) return;
    if (!this.bgmFilter) {
      // Warm lowpass filter to eliminate any harsh or strident treble frequencies
      this.bgmFilter = this.ctx.createBiquadFilter();
      this.bgmFilter.type = 'lowpass';
      this.bgmFilter.frequency.setValueAtTime(850, this.ctx.currentTime); // 850 Hz warm cutoff
      this.bgmFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);
      this.bgmFilter.connect(this.ctx.destination);
    }
    if (!this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.enabled ? this.bgmVolume : 0.0001, this.ctx.currentTime);
      this.bgmGain.connect(this.bgmFilter);
    }
  }

  private scheduleNote(time: number, freq: number, isBass: boolean) {
    if (!this.ctx || !this.bgmGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Triangle wave delivers a mellow, warm retro chiptune timbre without annoying square buzz
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const vol = isBass ? 0.42 : 0.28;
      const duration = isBass ? this.STEP_TIME * 1.7 : this.STEP_TIME * 0.82;

      noteGain.gain.setValueAtTime(0.0001, time);
      noteGain.gain.linearRampToValueAtTime(vol, time + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration + 0.04);
    } catch {}
  }

  private scheduler() {
    if (!this.ctx || !this.isBgmPlaying) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    while (this.nextNoteTime < this.ctx.currentTime + this.LOOKAHEAD) {
      const step = this.BGM_PATTERN[this.noteIndex % this.BGM_PATTERN.length];
      if (step.bass) {
        this.scheduleNote(this.nextNoteTime, step.bass, true);
      }
      if (step.melody) {
        this.scheduleNote(this.nextNoteTime, step.melody, false);
      }
      this.nextNoteTime += this.STEP_TIME;
      this.noteIndex++;
    }
  }

  startBgm() {
    this.initCtx();
    if (!this.ctx) return;
    this.initBgmNodes();

    if (this.isBgmPlaying) {
      this.resumeBgm();
      return;
    }

    this.isBgmPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.noteIndex = 0;

    if (this.bgmGain && this.enabled) {
      this.bgmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, this.ctx.currentTime + 0.6);
    }

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }

    this.schedulerTimer = setInterval(() => {
      this.scheduler();
    }, this.SCHEDULE_INTERVAL);
  }

  pauseBgm() {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
    }
  }

  resumeBgm() {
    if (!this.enabled) return;
    if (!this.isBgmPlaying) {
      this.startBgm();
      return;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, this.ctx.currentTime + 0.4);
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.pauseBgm();
    } else {
      this.resumeBgm();
    }
  }

  // --- Sound Effects (SFX) ---

  playMove() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }

  playTurn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playHarvest() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  playAnalyze() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }

  playCrash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.5, t: 0.3 },
        { f: 1318.5, t: 0.45 },
      ];
      chords.forEach(({ f, t }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + t);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + t);
        osc.stop(this.ctx.currentTime + t + 0.4);
      });
    } catch {}
  }

  playSuccess() {
    this.playVictory();
  }
}

export const soundManager = new SoundManager();
