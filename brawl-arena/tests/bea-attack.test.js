import test from 'node:test';
import assert from 'node:assert/strict';
import { Bea } from '../js/entities/brawlers/Bea.js';
import { Vector2 } from '../js/utils/Vector2.js';

const right = new Vector2(1, 0);
function setup() {
    const bea = new Bea('blue', 100, 100);
    const target = new Bea('red', 240, 100);
    const game = {
        projectiles: [], brawlers: [bea, target], createEffect() {},
        map: { isPositionSolidForProjectile: () => false, damageWallAtPosition() {} },
    };
    return { bea, target, game };
}
test('three single shots deal the same damage after hits and misses, then ammo runs out', () => {
    const { bea, target, game } = setup();
    target.health = target.maxHealth = 10000;
    for (let i = 0; i < 3; i++) {
        bea.attackCooldown = 0;
        // Miss the middle shot; neither hit history nor misses change the next shot.
        target.position.y = i === 1 ? 400 : 100;
        assert.equal(bea.attack(right, game), true);
        const shot = game.projectiles[i];
        assert.equal(shot.damage, 900);
        shot.update(0.2, game);
        assert.equal(bea.ammo, 2 - i);
    }
    assert.equal(target.health, 8200);
    bea.attackCooldown = 0;
    assert.equal(bea.attack(right, game), false);
    assert.equal(game.projectiles.length, 3);
});
test('walls block the single shot', () => {
    const { bea, target, game } = setup();
    game.map.isPositionSolidForProjectile = () => true;
    bea.attack(right, game);
    game.projectiles[0].update(1, game);
    assert.equal(game.projectiles[0].active, false);
    assert.equal(target.health, target.maxHealth);
});
test('zero direction preserves all three rounds', () => {
    const { bea, game } = setup();
    assert.equal(bea.attack(new Vector2(0, 0), game), false);
    assert.equal(bea.ammo, 3);
    assert.equal(game.projectiles.length, 0);
});
test('bee fan pushes enemies away without recharging super', () => {
    const { bea, target, game } = setup();
    bea.superReady = true;
    bea.useSuper(right, game);
    assert.equal(game.projectiles.length, bea.config.superProjectileCount);
    assert.equal(bea.superReady, false);
    for (const shot of game.projectiles) shot.update(0.2, game);
    assert.ok(target.health < target.maxHealth);
    assert.ok(target.knockbackVelocity.x > 0);
    assert.equal(bea.superCharge, 0);
});

test('stings slow movement briefly, refresh without stacking, and expire', () => {
    const { bea, target, game } = setup();
    Object.assign(game.map, {
        width: 2000, height: 2000, isPositionSolid: () => false,
        getTileAtPosition: () => null, isPositionInBush: () => false,
    });
    bea.attack(right, game);
    game.projectiles[0].update(0.2, game);
    assert.equal(target.getMovementSpeedMultiplier(game), 0.4);
    target.moveDirection = right;
    const start = target.position.x;
    target.update(0.25, game);
    assert.equal(target.position.x - start, target.speed * 0.4 * 0.25);
    target.applySlow(bea.config.stingSlowMultiplier, bea.config.stingSlowDuration);
    assert.equal(target.slowRemaining, 2000);
    assert.equal(target.getMovementSpeedMultiplier(game), 0.4);
    target.update(0.5, game);
    assert.equal(target.getMovementSpeedMultiplier(game), 0.4);
    target.update(1.4, game);
    assert.equal(target.getMovementSpeedMultiplier(game), 0.4);
    target.update(0.11, game);
    assert.equal(target.getMovementSpeedMultiplier(game), 1);
});

test('sting and spike field use the stronger slow, and death clears the sting', () => {
    const { bea, target, game } = setup();
    bea.attack(right, game);
    game.projectiles[0].update(0.2, game);
    game.spikeFields = [{
        active: true, team: bea.team, position: target.position.clone(),
        radius: 100, slowMultiplier: 0.7,
    }];
    assert.equal(target.getMovementSpeedMultiplier(game), 0.4);
    target.die();
    game.spikeFields = [];
    assert.equal(target.slowRemaining, 0);
    assert.equal(target.getMovementSpeedMultiplier(game), 1);
    target.applySlow(0.4, 2000);
    assert.equal(target.slowRemaining, 0);
});

test('misses and allies do not receive the sting slow', () => {
    const { bea, target, game } = setup();
    target.position.y = 400;
    bea.createAttackProjectiles(right, game);
    game.projectiles[0].update(1, game);
    assert.equal(target.slowRemaining, 0);
    target.position.y = 100;
    target.team = bea.team;
    bea.createAttackProjectiles(right, game);
    game.projectiles[1].update(1, game);
    assert.equal(target.slowRemaining, 0);
    bea.activateSuper(right, game);
    for (const shot of game.projectiles.slice(2)) shot.update(0.2, game);
    assert.equal(target.slowRemaining, 0);
});

test('each super bee slows its target and repeated hits refresh without stacking', () => {
    const { bea, target, game } = setup();
    bea.activateSuper(right, game);
    for (const shot of game.projectiles) {
        // Place the target in each bee's path to verify every angle carries the effect.
        target.position = shot.position.add(shot.direction.multiply(60));
        target.slowRemaining = 100;
        shot.update(0.1, game);
        assert.equal(shot.active, false);
        assert.equal(target.slowRemaining, 2000);
        assert.equal(target.getMovementSpeedMultiplier(game), 0.4);
    }
    assert.equal(target.health, target.maxHealth - bea.config.superDamage * bea.config.superProjectileCount);
    assert.ok(target.knockbackVelocity.magnitude() > 0);
    assert.equal(bea.superCharge, 0);
});
