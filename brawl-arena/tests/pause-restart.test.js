import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pause overlay offers restart and dispatches restart request', () => {
    const gameSource = readFileSync(new URL('../js/game/Game.js', import.meta.url), 'utf8');
    const mainSource = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');

    assert.equal(gameSource.includes('restart-btn'), true);
    assert.equal(gameSource.includes('처음부터 다시'), true);
    assert.equal(gameSource.includes("restart-current-game"), true);
    assert.equal(mainSource.includes("restart-current-game"), true);
    assert.equal(mainSource.includes('restartGame()'), true);
});
