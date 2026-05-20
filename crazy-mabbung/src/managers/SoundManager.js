export class SoundManager {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
        this.noiseBuffer = null;
    }

    play(name) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        switch (name) {
            case 'place_bomb': this.playPlaceBomb(); break;
            case 'explode': this.playExplode(); break;
            case 'item_get': this.playItemGet(); break;
            case 'trap': this.playTrap(); break;
            case 'die': this.playDie(); break;
            case 'start': this.playStart(); break;
            case 'win': this.playWin(); break;
            case 'lose': this.playLose(); break;
            case 'click': this.playClick(); break;
        }
    }

    // --- Synthesized Sound Effects ---

    playPlaceBomb() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplode() {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        if (typeof noise.stop === 'function') {
            noise.stop(this.ctx.currentTime + 0.5);
        }
    }

    getNoiseBuffer() {
        if (this.noiseBuffer) return this.noiseBuffer;

        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }

        this.noiseBuffer = buffer;
        return this.noiseBuffer;
    }

    playItemGet() {
        const t = this.ctx.currentTime;

        // Note 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.frequency.setValueAtTime(1200, t);
        gain1.gain.setValueAtTime(0.3, t);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc1.start(t);
        osc1.stop(t + 0.1);

        // Note 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.frequency.setValueAtTime(1800, t + 0.1);
        gain2.gain.setValueAtTime(0.3, t + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.3);
    }

    playTrap() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        // Bubble effect: rapid modulation or sweep up
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playDie() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playStart() {
        // Simple major scale up
        [440, 554, 659].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.value = 0.1;
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1 + (i * 0.15));
            osc.start(this.ctx.currentTime + (i * 0.1));
            osc.stop(this.ctx.currentTime + 0.1 + (i * 0.15));
        });
    }

    playWin() {
        // Victory fanfare snippet
        [523, 659, 784, 1046].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.value = 0.2;
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3 + (i * 0.1));
            osc.start(this.ctx.currentTime + (i * 0.1));
            osc.stop(this.ctx.currentTime + 0.5 + (i * 0.1));
        });
    }

    playLose() {
        // Sad trombone-ish
        [400, 380, 360, 340].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            gain.gain.value = 0.2;
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4 + (i * 0.3));
            osc.start(this.ctx.currentTime + (i * 0.3));
            osc.stop(this.ctx.currentTime + 0.4 + (i * 0.3));
        });
    }

    playClick() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'square';
        osc.frequency.value = 800;
        gain.gain.value = 0.1;
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
}
