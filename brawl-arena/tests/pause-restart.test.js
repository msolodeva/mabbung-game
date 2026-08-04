import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pause overlay offers restart and dispatches restart request', () => {
    const gameUiSource = readFileSync(new URL('../js/game/GameUI.js', import.meta.url), 'utf8');
    const appSource = readFileSync(new URL('../js/app/BrawlArena.js', import.meta.url), 'utf8');

    assert.equal(gameUiSource.includes('restart-btn'), true);
    assert.equal(gameUiSource.includes('처음부터 다시'), true);
    assert.equal(gameUiSource.includes('restart-current-game'), true);
    assert.equal(appSource.includes('restart-current-game'), true);
    assert.equal(appSource.includes('restartGame()'), true);
});
