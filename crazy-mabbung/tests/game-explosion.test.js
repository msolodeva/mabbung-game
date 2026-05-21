import test from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../src/core/Game.js';
import { Bomb } from '../src/entities/Bomb.js';

function createExplosionHarness() {
    const tileSize = 64;
    const owner = { activeBombs: 0 };
    const calls = {
        sounds: [],
        shakes: 0,
        texts: 0,
        splashes: 0
    };
    const game = {
        tileSize,
        map: {
            cols: 7,
            rows: 5,
            data: [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ],
            destroyBlock() {}
        },
        bombs: [],
        explosions: [],
        items: [],
        players: [],
        effects: {
            triggerShake: () => calls.shakes++,
            spawnText: () => calls.texts++,
            spawnSplash: () => calls.splashes++
        },
        sounds: {
            play: name => calls.sounds.push(name)
        },
        addExplosion: Game.prototype.addExplosion,
        triggerExplosion: Game.prototype.triggerExplosion,
        spawnItem: Game.prototype.spawnItem,
        checkEntityOnTile: Game.prototype.checkEntityOnTile
    };

    game.bombs.push(
        new Bomb(1, 2, 4, owner, tileSize),
        new Bomb(2, 2, 4, owner, tileSize),
        new Bomb(3, 2, 4, owner, tileSize)
    );

    return { game, calls };
}

test('chain explosions only emit global feedback once', () => {
    const { game, calls } = createExplosionHarness();

    game.bombs[0].explode(game);

    assert.equal(game.bombs.filter(bomb => bomb.isDead).length, 3);
    assert.deepEqual(calls.sounds, ['explode']);
    assert.equal(calls.shakes, 1);
    assert.equal(calls.texts, 1);
    assert.equal(calls.splashes > 1, true);
});
