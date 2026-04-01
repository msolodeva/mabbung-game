export class SoundManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.enabled = false;
  }

  init() {
    if (this.context) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.2; // overall volume
      this.enabled = true;
      console.log('SoundManager initialized.');
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  _playSound(freq, type, duration, volume = 1, slide = 0) {
    if (!this.enabled || !this.context) return;
    
    this.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(freq + slide, this.context.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playStep() {
    // Snappy high-freq pulse
    this._playSound(600, 'square', 0.05, 0.5);
  }

  playTurn() {
    // Slightly lower chirp
    this._playSound(440, 'square', 0.08, 0.4);
  }

  playCoin() {
    // High-pitched "ding"
    const now = this.context.currentTime;
    this._playSound(880, 'sine', 0.1, 0.6);
    setTimeout(() => {
        this._playSound(1320, 'sine', 0.15, 0.4);
    }, 50);
  }

  playDeath() {
    // Descending slide
    this._playSound(400, 'sawtooth', 0.5, 0.6, -350);
  }

  playUIHover() {
    // Subtle short click
    this._playSound(150, 'sine', 0.02, 0.2);
  }

  playUISelect() {
    // Confirmatory blip
    this._playSound(523.25, 'triangle', 0.1, 0.5); // C5
  }
}
