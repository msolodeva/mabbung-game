import test from 'node:test';
import assert from 'node:assert/strict';

import { Projectile } from '../js/entities/Projectile.js';
import { Vector2 } from '../js/utils/Vector2.js';

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

