import test from 'node:test';
import assert from 'node:assert/strict';

import { BRAWLER_CLASSES } from '../js/entities/brawlers/index.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { BRAWLERS } from '../js/utils/constants.js';

test('Rex trades a very long reload for the highest damage per shot', () => {
    const rex = BRAWLERS.REX;
    const others = Object.values(BRAWLERS).filter(b => b !== rex);

    assert.equal(typeof BRAWLER_CLASSES.rex, 'function');
    assert.ok(others.every(b => rex.attackDamage > b.attackDamage * b.attackProjectiles));
    assert.ok(others.every(b => rex.ammoReloadTime > b.ammoReloadTime));
    assert.equal(rex.ammoMax, 1);
});

test('Rex compensates with low health and high speed', () => {
    const rex = BRAWLERS.REX;
    assert.equal(rex.health, Math.min(...Object.values(BRAWLERS).map(b => b.health)));
    assert.ok(rex.speed > BRAWLERS.BROCK.speed);
    assert.ok(rex.attackRange < BRAWLERS.BROCK.attackRange);
    assert.ok(rex.attackDamage < BRAWLERS.BROCK.health);
});

test('Rex fires a single piercing slug', () => {
    const rex = new BRAWLER_CLASSES.rex('blue', 100, 100);
    const projectiles = [];
    rex.createAttackProjectiles(new Vector2(1, 0), { projectiles });

    assert.equal(projectiles.length, 1);
    assert.equal(projectiles[0].damage, BRAWLERS.REX.attackDamage);
    assert.equal(projectiles[0].piercing, true);
});
