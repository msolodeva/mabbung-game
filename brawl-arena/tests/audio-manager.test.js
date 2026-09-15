import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager, SOUND_RECIPES } from '../js/audio/AudioManager.js';
import { Game } from '../js/game/Game.js';

class Context {
    constructor() { this.sampleRate = 22050; this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
    createDynamicsCompressor() {
        return { ...this.createGain(), ...Object.fromEntries(
            ['threshold', 'knee', 'ratio', 'attack', 'release'].map(key => [key, { value: 0 }])) };
    }
    createBuffer(channels, length, sampleRate) {
        const data = new Float32Array(length);
        return { duration: length / sampleRate, getChannelData: () => data };
    }
    createBufferSource() {
        return { playbackRate: { value: 1 }, connect() {}, disconnect() {},
            start() { this.started = true; }, stop() { this.stopped = true; } };
    }
    close() { this.state = 'closed'; return Promise.resolve(); }
}
function withAudio(run) {
    const previous = globalThis.AudioContext;
    globalThis.AudioContext = Context;
    const manager = new AudioManager();
    try { run(manager); } finally {
        manager.cleanup();
        if (previous === undefined) delete globalThis.AudioContext;
        else globalThis.AudioContext = previous;
    }
}
test('all synthesized effects contain bounded, finite audio and fade to silence', () => withAudio(manager => {
    assert.equal(manager.enabled, true);
    for (const name of Object.keys(SOUND_RECIPES)) {
        const data = manager.sounds[name].getChannelData(0);
        assert.ok(data.some(sample => Math.abs(sample) > 0.01), name);
        assert.ok(data.every(sample => Number.isFinite(sample) && Math.abs(sample) <= 0.8), name);
        assert.equal(data[0], 0, name);
        assert.equal(data.at(-1), 0, name);
    }
    assert.notDeepEqual(manager.sounds['shoot:bea'].getChannelData(0), manager.sounds['shoot:brock'].getChannelData(0));
}));
test('character routing, spam suppression and voice limits bound busy fights', () => withAudio(manager => {
    assert.equal(manager.play('shoot', 'bea'), true);
    const first = [...manager.voices][0];
    assert.equal(first.buffer, manager.sounds['shoot:bea']);
    assert.equal(manager.play('shoot', 'bea'), false);
    for (let i = 0; i < 40; i++) {
        manager.audioContext.currentTime += 0.1;
        manager.play('shoot', 'colt');
    }
    assert.equal(manager.voices.size, 24);
    assert.equal(first.stopped, true);
    const voice = [...manager.voices][0];
    voice.onended();
    assert.equal(manager.voices.size, 23);
}));
test('mute silences active voices, volume is clamped, and cleanup releases playback', () => withAudio(manager => {
    manager.play('super');
    const source = [...manager.voices][0];
    manager.toggle();
    assert.equal(manager.master.gain.value, 0);
    assert.equal(manager.play('hit'), false);
    manager.setVolume(10);
    manager.toggle();
    assert.equal(manager.master.gain.value, 1);
    manager.audioContext.state = 'suspended';
    assert.equal(manager.play('hit'), false);
    manager.cleanup();
    assert.equal(source.stopped, true);
    assert.equal(manager.voices.size, 0);
    assert.equal(manager.play('hit'), false);
}));
test('combat visual events trigger matching audio', () => {
    const sounds = [], visuals = [];
    const game = { audioManager: { play: name => sounds.push(name) },
        effectsManager: { add: type => visuals.push(type) } };
    for (const type of ['hit', 'explosion', 'heal']) Game.prototype.createEffect.call(game, type, 0, 0);
    assert.deepEqual(sounds, ['hit', 'explosion', 'heal']);
    assert.equal(visuals.length, 3);
});
