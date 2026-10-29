// Short, layered arcade effects, synthesized once and reused during combat.
const tone = (wave, from, to, duration, gain, delay = 0) =>
    ({ wave, from, to, duration, gain, delay });
const noise = (duration, gain, smooth = 0.3, delay = 0) =>
    ({ wave: 'noise', duration, gain, smooth, delay });
const chime = notes => notes.map((frequency, i) =>
    tone('sine', frequency, frequency, 0.19, 0.24, i * 0.075));

export const SOUND_RECIPES = {
    shoot: [tone('triangle', 460, 110, 0.12, 0.4), noise(0.045, 0.2)],
    'shoot:brock': [tone('sine', 180, 42, 0.24, 0.55), noise(0.22, 0.45, 0.12)],
    'shoot:bea': [tone('triangle', 1100, 360, 0.16, 0.35), tone('sine', 1550, 700, 0.09, 0.17)],
    'shoot:colt': [noise(0.035, 0.36, 0.85), tone('triangle', 520, 140, 0.065, 0.28),
        noise(0.035, 0.26, 0.85, 0.065), tone('triangle', 480, 120, 0.065, 0.22, 0.065)],
    'shoot:dynamike': [tone('triangle', 280, 620, 0.16, 0.3), noise(0.13, 0.25, 0.5)],
    'shoot:spike': [tone('sine', 750, 180, 0.12, 0.4), noise(0.07, 0.22, 0.7)],
    'shoot:rico': [tone('square', 720, 420, 0.09, 0.13), tone('sine', 1080, 640, 0.12, 0.12)],
    'shoot:rex': [tone('sawtooth', 900, 120, 0.2, 0.3), noise(0.1, 0.4, 0.9), tone('sine', 140, 50, 0.22, 0.4)],
    super: [tone('triangle', 180, 1100, 0.2, 0.3), noise(0.22, 0.32, 0.3, 0.14),
        tone('sine', 160, 45, 0.35, 0.45, 0.18), ...chime([660, 880, 1320]).map(l => ({ ...l, delay: l.delay + 0.18 }))],
    hit: [noise(0.04, 0.32, 0.65), tone('sine', 330, 90, 0.09, 0.38)],
    explosion: [tone('sine', 140, 35, 0.36, 0.55), noise(0.32, 0.55, 0.14),
        noise(0.065, 0.25, 0.8)],
    death: [tone('triangle', 420, 65, 0.32, 0.3), tone('sine', 180, 40, 0.3, 0.32, 0.08), noise(0.12, 0.2, 0.15)],
    ricochet: [tone('sine', 1400, 850, 0.09, 0.16)],
    heal: chime([520, 780]),
    start: chime([440, 660, 880, 1320]),
    finish: [...chime([660, 880, 1100, 1320]), tone('sine', 660, 660, 0.5, 0.18, 0.3)],
    draw: chime([660, 550, 660]),
};

const MAX_VOICES = 24;
const COOLDOWNS = { ricochet: 0.09, hit: 0.055, explosion: 0.09, death: 0.12, heal: 0.2 };

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.sfxVolume = 0.5;
        this.musicVolume = 0.3;
        this.enabled = true;
        this.voices = new Set();
        this.lastPlayed = new Map();
        this.initSounds();
    }

    initSounds() {
        try {
            const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
            this.audioContext = new Context();
            this.master = this.audioContext.createGain();
            this.master.gain.value = this.sfxVolume;
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -18;
            this.compressor.knee.value = 18;
            this.compressor.ratio.value = 5;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.16;
            this.master.connect(this.compressor);
            this.compressor.connect(this.audioContext.destination);
            for (const [name, layers] of Object.entries(SOUND_RECIPES)) {
                this.sounds[name] = this.synthesize(layers);
            }
        } catch {
            this.cleanup();
        }
    }

    synthesize(layers) {
        const rate = this.audioContext.sampleRate;
        const duration = Math.max(...layers.map(l => l.delay + l.duration)) + 0.01;
        const buffer = this.audioContext.createBuffer(1, Math.ceil(duration * rate), rate);
        const data = buffer.getChannelData(0);
        for (const layer of layers) {
            let phase = 0, filteredNoise = 0;
            const offset = Math.round(layer.delay * rate);
            const length = Math.floor(layer.duration * rate);
            for (let i = 0; i < length; i++) {
                const progress = i / length;
                const attack = Math.min(1, i / (rate * 0.004));
                const envelope = attack * (1 - progress) ** 2;
                let sample;
                if (layer.wave === 'noise') {
                    filteredNoise += layer.smooth * (Math.random() * 2 - 1 - filteredNoise);
                    sample = filteredNoise;
                } else {
                    const frequency = layer.from * (layer.to / layer.from) ** progress;
                    phase += 2 * Math.PI * frequency / rate;
                    sample = layer.wave === 'triangle'
                        ? 2 / Math.PI * Math.asin(Math.sin(phase)) : Math.sin(phase);
                }
                data[offset + i] += sample * layer.gain * envelope;
            }
        }
        // Soft saturation leaves room for overlapping effects.
        for (let i = 0; i < data.length; i++) data[i] = Math.tanh(data[i]) * 0.8;
        return buffer;
    }

    play(name, character) {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return false;
        const key = this.sounds[`${name}:${character}`] ? `${name}:${character}` : name;
        const buffer = this.sounds[key];
        if (!buffer) return false;
        const now = this.audioContext.currentTime;
        const previous = this.lastPlayed.get(key) ?? -Infinity;
        if (now - previous < (COOLDOWNS[name] ?? 0.035)) return false;
        this.lastPlayed.set(key, now);
        if (this.voices.size >= MAX_VOICES) {
            const oldest = this.voices.values().next().value;
            oldest.stop();
            oldest.disconnect();
            this.voices.delete(oldest);
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        if (name === 'shoot' || name === 'hit' || name === 'explosion') {
            source.playbackRate.value = 0.96 + Math.random() * 0.08;
        }
        source.connect(this.master);
        this.voices.add(source);
        source.onended = () => {
            source.disconnect();
            this.voices.delete(source);
        };
        source.start();
        return true;
    }

    setVolume(sfx, music = this.musicVolume) {
        this.sfxVolume = Number.isFinite(sfx) ? Math.max(0, Math.min(1, sfx)) : this.sfxVolume;
        this.musicVolume = Number.isFinite(music) ? Math.max(0, Math.min(1, music)) : this.musicVolume;
        if (this.master) this.master.gain.value = this.enabled ? this.sfxVolume : 0;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.master) this.master.gain.value = this.enabled ? this.sfxVolume : 0;
        return this.enabled;
    }

    resume() {
        if (this.audioContext?.state === 'suspended') this.audioContext.resume().catch(() => {});
    }

    cleanup() {
        this.enabled = false;
        for (const source of this.voices) {
            source.onended = null;
            source.stop();
            source.disconnect();
        }
        this.voices.clear();
        this.lastPlayed.clear();
        this.sounds = {};
        this.master?.disconnect();
        this.compressor?.disconnect();
        if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close().catch(() => {});
        this.audioContext = null;
    }
}
