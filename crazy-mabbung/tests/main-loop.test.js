import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const activeSource = source.replace(/\/\/.*$/gm, '');

test('main schedules one animation loop bootstrap and no extra game-start loop', () => {
    const matches = activeSource.match(/requestAnimationFrame\s*\(\s*gameLoop\s*\)/g) ?? [];

    assert.equal(matches.length, 3);
});

test('main loop schedules the next frame even when a game frame fails', () => {
    const loopMatch = activeSource.match(/function\s+gameLoop\s*\([^)]*\)\s*\{[\s\S]*?\n    \}/);

    assert.ok(loopMatch, 'gameLoop function should exist');
    assert.match(loopMatch[0], /try\s*\{/);
    assert.match(loopMatch[0], /catch\s*\(\s*error\s*\)/);
    assert.match(loopMatch[0], /finally\s*\{[\s\S]*requestAnimationFrame\s*\(\s*gameLoop\s*\)/);
});

test('map selector renders a visible title on each thumbnail', () => {
    assert.match(source, /className\s*=\s*'map-title'/);
    assert.match(source, /textContent\s*=\s*theme\.name/);
});
