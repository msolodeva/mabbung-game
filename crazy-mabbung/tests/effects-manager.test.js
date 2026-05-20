import test from 'node:test';
import assert from 'node:assert/strict';

import { EffectsManager } from '../src/managers/EffectsManager.js';

function createRandom(values) {
    let index = 0;
    return () => values[index++ % values.length];
}

test('splash particles age out after their lifetime', () => {
    const effects = new EffectsManager({ random: createRandom([0.5]) });

    effects.spawnSplash(2, 3, 64, { count: 4 });

    assert.equal(effects.particles.length, 4);

    effects.update(900);

    assert.equal(effects.particles.length, 0);
});

test('floating text moves upward and expires', () => {
    const effects = new EffectsManager({ random: createRandom([0.5]) });

    effects.spawnText('TRAP', 100, 120, '#ffffff');
    effects.update(250);

    assert.equal(effects.texts.length, 1);
    assert.equal(effects.texts[0].y < 120, true);

    effects.update(900);

    assert.equal(effects.texts.length, 0);
});

test('screen shake produces deterministic offset and then stops', () => {
    const effects = new EffectsManager({ random: createRandom([0, 1]) });

    effects.triggerShake(200, 8);

    assert.deepEqual(effects.getShakeOffset(), { x: -8, y: 8 });

    effects.update(250);

    assert.deepEqual(effects.getShakeOffset(), { x: 0, y: 0 });
});

test('splash bursts are capped so chain explosions cannot flood the frame', () => {
    const effects = new EffectsManager({
        random: createRandom([0.5]),
        maxParticles: 10,
        maxTexts: 3
    });

    for (let i = 0; i < 6; i++) {
        effects.spawnSplash(i, 0, 64, { count: 8 });
        effects.spawnText(`SPLASH ${i}`, i * 10, 20);
    }

    assert.equal(effects.particles.length, 10);
    assert.equal(effects.texts.length, 3);
});
