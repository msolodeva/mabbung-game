export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  public soundEnabled = true;
  public musicEnabled = true;

  private isBgmPlaying = false;
  private bgmInterval: number | null = null;
  private bgmStep = 0;

  constructor() {}

  private init(): void {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();

      this.masterGain.gain.value = 0.6;
      this.sfxGain.gain.value = 0.8;
      this.bgmGain.gain.value = 0.35;

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio(): void {
    this.init();
    if (this.musicEnabled && !this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.soundEnabled ? 0.8 : 0;
    }
    return this.soundEnabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.musicEnabled ? 0.35 : 0;
    }
    if (this.musicEnabled && !this.isBgmPlaying) {
      this.startBGM();
    }
    return this.musicEnabled;
  }

  // --- SOUND EFFECTS (SFX) ---

  public playHitLight(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);

    this.playNoise(0.04, 900, 0.4);
  }

  public playHitHeavy(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);

    this.playNoise(0.14, 450, 0.75);
  }

  public playBlock(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playGuardCrush(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Glass shatter + heavy crash
    [800, 1200, 1600, 2400].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.02);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25 + idx * 0.02);
      gain.gain.setValueAtTime(0.6, t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25 + idx * 0.02);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.02);
      osc.stop(t + 0.25 + idx * 0.02);
    });
    this.playNoise(0.25, 2000, 0.9);
  }

  public playRoll(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.22);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);

    this.playNoise(0.18, 600, 0.35);
  }

  public playWhoosh(pitch = 300): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playFireballLaunch(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.25);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);

    this.playNoise(0.18, 1200, 0.5);
  }

  public playDragonPunch(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.22);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);

    this.playNoise(0.16, 1000, 0.45);
  }

  public playTatsumaki(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const st = t + i * 0.07;
      osc.frequency.setValueAtTime(420, st);
      osc.frequency.exponentialRampToValueAtTime(180, st + 0.06);
      gain.gain.setValueAtTime(0.4, st);
      gain.gain.exponentialRampToValueAtTime(0.01, st + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.06);
    }
  }

  public playHyakuretsu(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const st = t + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(500, st);
      osc.frequency.exponentialRampToValueAtTime(120, st + 0.04);
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.01, st + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.04);
    }
  }

  public playBusterWolf(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Sub bass shockwave + roaring blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);

    this.playNoise(0.35, 300, 1.0);
  }

  public playSuperActivate(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(300, t);
    osc1.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    gain1.gain.setValueAtTime(1.0, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.6);

    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0.3, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5 + i * 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.5 + i * 0.05);
    });
  }

  public playJump(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playKO(): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const freqs = [110, 164.81, 220, 330];
    freqs.forEach(f => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 1.2);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.2);
    });
    this.playNoise(0.5, 300, 0.8);
  }

  public playAnnounce(type: 'fight' | 'round' | 'ko' | 'win'): void {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const freqs = type === 'fight' ? [440, 880] : type === 'win' ? [523.25, 659.25, 783.99, 1046.5] : [330, 440];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const startTime = t + idx * 0.12;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  private playNoise(duration: number, cutoff = 1000, volume = 0.5): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // --- PROCEDURAL RETRO BGM ENGINE ---

  private startBGM(): void {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    const bassline = [110, 110, 130.81, 110, 146.83, 110, 164.81, 146.83];
    const melody = [
      440, 0, 523.25, 440, 659.25, 587.33, 523.25, 440,
      392, 0, 440, 523.25, 587.33, 523.25, 440, 392
    ];

    const stepDuration = 140;
    this.bgmInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.bgmGain) return;
      if (this.ctx.state === 'suspended') return;

      const t = this.ctx.currentTime;
      const bassFreq = bassline[this.bgmStep % bassline.length];
      const melodyFreq = melody[this.bgmStep % melody.length];

      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq / 2, t);
        bassGain.gain.setValueAtTime(0.3, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.12);
      }

      if (melodyFreq > 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'square';
        melOsc.frequency.setValueAtTime(melodyFreq, t);
        melGain.gain.setValueAtTime(0.18, t);
        melGain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);
        melOsc.connect(melGain);
        melGain.connect(this.bgmGain);
        melOsc.start(t);
        melOsc.stop(t + 0.13);
      }

      if (this.bgmStep % 2 === 0) {
        this.playHiHat(t);
      }

      this.bgmStep++;
    }, stepDuration);
  }

  private playHiHat(t: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'highpass' as unknown as OscillatorType;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public stopBGM(): void {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }
}
