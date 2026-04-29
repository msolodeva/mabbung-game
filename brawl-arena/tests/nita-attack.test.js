import test from 'node:test';
import assert from 'node:assert/strict';

import { Projectile } from '../js/entities/Projectile.js';
import { Nita } from '../js/entities/brawlers/Nita.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { BRAWLERS } from '../js/utils/constants.js';

function targetAt(x, y, radius = 20) {
    return {
        id: `target-${x}-${y}`,
        position: new Vector2(x, y),
        radius,
    };
}

test('wave projectiles use configured width for side hit detection', () => {
    const wave = new Projectile(0, 0, new Vector2(1, 0), {
        size: 25,
        width: 100,
        projectileType: 'wave',
    });

    assert.equal(wave.checkHit(targetAt(15, 45)), true);
    assert.equal(wave.checkHit(targetAt(15, 90)), false);
});

test('nita has stronger close-range bruiser attack stats', () => {
    assert.equal(BRAWLERS.NITA.attackDamage, 900);
    assert.equal(BRAWLERS.NITA.attackRange, 360);
    assert.equal(BRAWLERS.NITA.attackSpeed, 740);
});

test('nita creates a broad piercing shockwave', () => {
    const nita = new Nita('blue', 0, 0);
    const game = {
        projectiles: [],
        audioManager: null,
    };

    nita.createAttackProjectiles(new Vector2(1, 0), game);

    assert.equal(game.projectiles.length, 1);
    assert.equal(game.projectiles[0].projectileType, 'wave');
    assert.equal(game.projectiles[0].piercing, true);
    assert.equal(game.projectiles[0].width, 100);
    assert.equal(game.projectiles[0].radius, 28);
});
