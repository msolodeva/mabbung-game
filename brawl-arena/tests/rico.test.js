import test from 'node:test';
import assert from 'node:assert/strict';
import { Rico } from '../js/entities/brawlers/Rico.js';
import { Bea } from '../js/entities/brawlers/Bea.js';
import { RicochetProjectile } from '../js/entities/RicochetProjectile.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { traceRicochet } from '../js/utils/ricochet.js';
import { Game } from '../js/game/Game.js';

function setup(solid = (x, y) => x >= 200 || x < 0 || y < 0 || y >= 300) {
    const owner = new Rico('blue', 100, 100);
    const game = { brawlers: [owner], projectiles: [], scheduledActions: [], createEffect() {},
        map: { isPositionSolidForProjectile: solid, damageWallAtPosition() { throw Error('walls must remain intact'); } },
        scheduleAction: Game.prototype.scheduleAction, updateScheduledActions: Game.prototype.updateScheduledActions };
    return { owner, game };
}
function shot(owner, direction = new Vector2(1, 0), extra = {}) {
    return new RicochetProjectile(100, 100, direction, { owner, team: 'blue', speed: 600, size: 7, damage: 240, range: 500, maxBounces: 2, ...extra });
}

test('shots reflect from horizontal, vertical, and corner cover without destroying it', () => {
    for (const [solid, direction, expected] of [
        [(x, y) => x >= 200, new Vector2(1, 0), [-1, 0]],
        [(x, y) => y >= 200, new Vector2(0, 1), [0, -1]],
        [(x, y) => x >= 200 && y >= 200, new Vector2(1, 1), [-Math.SQRT1_2, -Math.SQRT1_2]],
    ]) {
        const { owner, game } = setup(solid);
        const p = shot(owner, direction);
        p.update(0.3, game);
        assert.ok(Math.abs(p.direction.x - expected[0]) < 1e-9);
        assert.ok(Math.abs(p.direction.y - expected[1]) < 1e-9);
        assert.equal(p.bouncesRemaining, 1);
        assert.ok(p.active);
    }
});

test('reflected shots hit enemies but not allies; solid cover prevents hits behind it', () => {
    const { owner, game } = setup();
    const behindWall = new Bea('red', 230, 100);
    const reflectedTarget = new Bea('red', 40, 100);
    const ally = new Bea('blue', 150, 100);
    game.brawlers.push(behindWall, reflectedTarget, ally);
    const p = shot(owner);
    p.update(0.6, game);
    assert.equal(reflectedTarget.health, reflectedTarget.maxHealth - 240);
    assert.equal(behindWall.health, behindWall.maxHealth);
    assert.equal(ally.health, ally.maxHealth);
    assert.equal(p.active, false);
});

test('super pierces each enemy once even after returning along the same route', () => {
    const { owner, game } = setup();
    const enemies = [140, 170].map(x => new Bea('red', x, 100));
    game.brawlers.push(...enemies);
    const p = shot(owner, new Vector2(1, 0), { piercing: true, isSuper: true });
    p.update(0.7, game);
    for (const target of enemies) assert.equal(target.health, target.maxHealth - 240);
    assert.equal(owner.superCharge, 0);
});

test('range and bounce limits bound lifetime, including large frame deltas', () => {
    const { owner, game } = setup();
    const limited = shot(owner, new Vector2(1, 0), { maxBounces: 0 });
    limited.update(1, game);
    assert.equal(limited.active, false);
    const ranged = shot(owner, new Vector2(1, 0), { range: 300, maxBounces: 20 });
    ranged.update(10, game);
    assert.equal(ranged.distanceTraveled, 300);
    assert.equal(ranged.active, false);
});

test('preview follows the same reflected path as the live projectile', () => {
    const { owner, game } = setup();
    const p = shot(owner);
    const points = traceRicochet(p.position, p.direction, p.range, p.bouncesRemaining, game.map);
    p.update(1, game);
    assert.deepEqual(p.position, points.at(-1));
    assert.ok(points.length > 2);
});

test('normal and super bursts use scheduled actions, frozen aim, and cancel after death', () => {
    const { owner, game } = setup();
    const aim = new Vector2(1, 0);
    owner.createAttackProjectiles(aim, game);
    aim.x = 0; aim.y = 1;
    game.updateScheduledActions(0.09);
    assert.ok(game.projectiles.length > 0);
    for (const p of game.projectiles) assert.deepEqual(p.direction, new Vector2(1, 0));
    owner.die();
    const before = game.projectiles.length;
    game.updateScheduledActions(1);
    assert.equal(game.projectiles.length, before);
    const fresh = setup();
    fresh.owner.activateSuper(new Vector2(1, 0), fresh.game);
    fresh.game.updateScheduledActions(1);
    assert.equal(fresh.game.projectiles.length, fresh.owner.config.superProjectiles);
    assert.ok(fresh.game.projectiles.every(p => p.isSuper && p.piercing && p.bouncesRemaining === 4));
});
