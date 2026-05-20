import test from 'node:test';
import assert from 'node:assert/strict';

import { Player } from '../src/entities/Player.js';

const TILE_SIZE = 64;

function createPlayer(overrides = {}) {
    const player = new Player(1, 1, TILE_SIZE, '#e74c3c', {
        up: 'up',
        down: 'down',
        left: 'left',
        right: 'right',
        bomb: 'bomb'
    });

    Object.assign(player, overrides);
    return player;
}

test('player exposes a visual state for richer movement rendering', () => {
    const player = createPlayer({
        isMoving: true,
        facing: 'RIGHT',
        moveDir: { x: 4, y: 0 }
    });

    assert.equal(typeof player.getVisualState, 'function');

    const visual = player.getVisualState(1000);

    assert.ok(visual.rotation > 0);
    assert.ok(visual.trailOpacity > 0);
    assert.ok(visual.shadowScaleX > 1);
    assert.equal(visual.teamAccent, '#e74c3c');
});

test('trapped player visual state carries bubble and urgency values', () => {
    const player = createPlayer({
        state: 'TRAPPED',
        trappedTimer: 1200
    });

    const visual = player.getVisualState(1000);

    assert.equal(visual.bubbleVisible, true);
    assert.ok(visual.bubblePulse > 0);
    assert.ok(visual.urgency >= 0.7);
});
