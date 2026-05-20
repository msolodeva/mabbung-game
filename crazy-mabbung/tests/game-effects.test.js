import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/core/Game.js', import.meta.url), 'utf8');

test('game wires visual effects into explosion, item, and contact feedback', () => {
    assert.match(source, /import\s+\{\s*EffectsManager\s*\}/);
    assert.match(source, /this\.effects\s*=\s*new EffectsManager/);
    assert.match(source, /this\.effects\.triggerShake/);
    assert.match(source, /this\.effects\.spawnSplash/);
    assert.match(source, /this\.effects\.spawnText/);
    assert.match(source, /this\.effects\.update\(deltaTime\)/);
});
