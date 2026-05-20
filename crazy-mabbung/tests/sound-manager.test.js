import test from 'node:test';
import assert from 'node:assert/strict';

class FakeAudioParam {
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
    linearRampToValueAtTime() {}
}

class FakeNode {
    constructor() {
        this.frequency = new FakeAudioParam();
        this.gain = new FakeAudioParam();
    }

    connect() {}
    start() {}
    stop() {}
}

class FakeBuffer {
    constructor(length) {
        this.data = new Float32Array(length);
    }

    getChannelData() {
        return this.data;
    }
}

class FakeAudioContext {
    constructor() {
        this.sampleRate = 100;
        this.currentTime = 0;
        this.destination = new FakeNode();
        this.state = 'running';
        this.createBufferCalls = 0;
    }

    createGain() {
        return new FakeNode();
    }

    createOscillator() {
        return new FakeNode();
    }

    createBufferSource() {
        return new FakeNode();
    }

    createBiquadFilter() {
        return new FakeNode();
    }

    createBuffer(channels, length) {
        this.createBufferCalls++;
        return new FakeBuffer(length);
    }

    resume() {}
}

test('explosion sound reuses its noise buffer during splash chains', async () => {
    globalThis.window = { AudioContext: FakeAudioContext };

    const { SoundManager } = await import('../src/managers/SoundManager.js');
    const sounds = new SoundManager();

    sounds.play('explode');
    sounds.play('explode');
    sounds.play('explode');

    assert.equal(sounds.ctx.createBufferCalls, 1);
});
