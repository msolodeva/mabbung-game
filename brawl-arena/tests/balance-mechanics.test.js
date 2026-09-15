import test from 'node:test';
import assert from 'node:assert/strict';
import { BRAWLERS } from '../js/utils/constants.js';
import { BRAWLER_CLASSES } from '../js/entities/brawlers/index.js';
import { Vector2 } from '../js/utils/Vector2.js';

const right = new Vector2(1, 0);
function world(brawlers) {
    return { brawlers, bears: [], projectiles: [], spikeFields: [], createEffect() {},
        map: { width: 2000, height: 2000, isPositionSolid: () => false,
            getTileAtPosition: () => null, isPositionInBush: () => false,
            isPositionSolidForProjectile: () => false, damageWallAtPosition() {} } };
}
function simulateProjectiles(g, seconds = 1) {
    for (let frame = 0; frame < seconds * 60; frame++) {
        for (const p of g.projectiles) p.update(1 / 60, g);
        g.projectiles = g.projectiles.filter(p => p.active);
    }
}
test('Dynamike hits a midrange target with a delayed throw over cover', () => {
    const mike = new BRAWLER_CLASSES.dynamike('blue', 100, 100);
    const enemy = new BRAWLER_CLASSES.bea('red', 400, 100);
    const g = world([mike, enemy]);
    g.map.isPositionSolidForProjectile = () => true;
    mike.createAttackProjectiles(right, g);
    const bomb = g.projectiles[0];
    assert.equal(bomb.targetPosition.x, enemy.position.x);
    bomb.update(0.5, g);
    assert.equal(enemy.health, enemy.maxHealth);
    bomb.update(0.3, g);
    assert.equal(enemy.health, enemy.maxHealth - mike.attackDamage);
});
test('Dynamike distance assistance preserves aim direction and minimum range', () => {
    const mike = new BRAWLER_CLASSES.dynamike('blue', 100, 100);
    const side = new BRAWLER_CLASSES.colt('red', 100, 350);
    const ally = new BRAWLER_CLASSES.bea('blue', 300, 100);
    const g = world([mike, side, ally]);
    assert.equal(mike.getThrowRange(right, g, mike.attackRange), mike.attackRange);
    const diver = new BRAWLER_CLASSES.rico('red', 140, 100);
    g.brawlers.push(diver);
    mike.createAttackProjectiles(right, g);
    assert.equal(g.projectiles[0].targetPosition.y, 100);
    assert.equal(g.projectiles[0].range, mike.config.minThrowRange);
    simulateProjectiles(g);
    assert.equal(diver.health, diver.maxHealth);
});
test('Dynamike landing can be dodged after the bomb is thrown', () => {
    const mike = new BRAWLER_CLASSES.dynamike('blue', 100, 100);
    const enemy = new BRAWLER_CLASSES.colt('red', 400, 100);
    const g = world([mike, enemy]);
    mike.createAttackProjectiles(right, g);
    enemy.position.y += 180;
    simulateProjectiles(g);
    assert.equal(enemy.health, enemy.maxHealth);
});
test('Brock full super cannot delete a full-health Colt on its own', () => {
    const brock = new BRAWLER_CLASSES.brock('blue', 100, 100);
    const colt = new BRAWLER_CLASSES.colt('red', 160, 100);
    const g = world([brock, colt]);
    brock.activateSuper(right, g);
    simulateProjectiles(g);
    assert.ok(colt.health > 0);
    assert.equal(brock.superCharge, 0);
});
