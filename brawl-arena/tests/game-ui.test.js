import test from 'node:test';
import assert from 'node:assert/strict';

import { GameUI } from '../js/game/GameUI.js';

const ui = new GameUI({ documentRef: {}, windowRef: {} });

test('game UI maps match outcomes to one presentation model', () => {
    assert.deepEqual(ui.getWinnerPresentation(true), {
        label: '🔵 BLUE TEAM WINS!',
        className: 'victory',
    });
    assert.deepEqual(ui.getWinnerPresentation(false), {
        label: '🔴 RED TEAM WINS!',
        className: 'defeat',
    });
    assert.deepEqual(ui.getWinnerPresentation('draw'), {
        label: '🤝 DRAW!',
        className: 'draw',
    });
});

test('game UI awards stars from the kill margin', () => {
    assert.equal(ui.calculateStarCount({ blueScore: 5, redScore: 5 }), 1);
    assert.equal(ui.calculateStarCount({ blueScore: 5, redScore: 2 }), 2);
    assert.equal(ui.calculateStarCount({ blueScore: 7, redScore: 2 }), 3);
});
