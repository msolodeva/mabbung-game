import test from 'node:test';
import assert from 'node:assert/strict';
import { Projectile } from '../js/entities/Projectile.js';
import { Colt } from '../js/entities/brawlers/Colt.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { Game } from '../js/game/Game.js';
import { TeamDeathmatchMode } from '../js/modes/TeamDeathmatch.js';
import { GAME_STATES } from '../js/utils/constants.js';

function world() {
    return { map: { width: 1000, height: 1000, isPositionInBush: () => false,
        getTileAtPosition: () => null, isPositionSolidForProjectile: () => false,
        damageWallAtPosition() {} }, brawlers: [], spikeFields: [], createEffect() {} };
}
function target(x) {
    return { id: x, team: 'red', isAlive: true, position: new Vector2(x, 100), radius: 25,
        damage: 0, takeDamage(amount) { this.damage += amount; } };
}
for (const Type of [Projectile]) {
    test(`${Type.name} hits a target crossed during a 100ms frame`, () => {
        const g = world(); const enemy = target(135); g.brawlers.push(enemy);
        const shot = new Type(100, 100, new Vector2(1, 0), { speed: 700, size: 6, range: 500, team: 'blue', damage: 100 });
        shot.update(0.1, g);
        assert.equal(enemy.damage, 100);
        assert.equal(shot.active, false);
    });
    test(`${Type.name} cannot hit an enemy through an intervening wall`, () => {
        const g = world(); const enemy = target(200); g.brawlers.push(enemy);
        g.map.isPositionSolidForProjectile = x => x >= 120 && x < 170;
        const shot = new Type(100, 100, new Vector2(1, 0), { speed: 1000, range: 500, team: 'blue' });
        shot.update(0.1, g);
        assert.equal(enemy.damage, 0);
        assert.equal(shot.active, false);
        assert.ok(shot.position.x < 170);
    });
}
test('piercing bullets hit each crossed target once and stop at range', () => {
    const g = world(); g.brawlers = [target(135), target(170), target(260)];
    const shot = new Projectile(100, 100, new Vector2(1, 0), { speed: 1000, range: 100, team: 'blue', damage: 100, piercing: true });
    shot.update(0.1, g);
    assert.deepEqual(g.brawlers.map(b => b.damage), [100, 100, 0]);
    assert.equal(shot.position.x, 200);
    assert.equal(shot.active, false);
});
for (const attack of ['createAttackProjectiles', 'activateSuper']) {
    test(`Colt ${attack} freezes during pause and resumes its cadence`, () => {
        const g = Object.assign(Object.create(Game.prototype), { scheduledActions: [], projectiles: [], state: GAME_STATES.PAUSED });
        const colt = new Colt('blue', 100, 100);
        colt[attack](new Vector2(1, 0), g);
        assert.equal(g.projectiles.length, 1);
        g.update(10);
        assert.equal(g.projectiles.length, 1);
        const interval = attack === 'activateSuper' ? colt.config.superBulletInterval : colt.config.bulletInterval;
        g.updateScheduledActions((interval - 1) / 1000);
        assert.equal(g.projectiles.length, 1);
        g.updateScheduledActions(0.001);
        assert.equal(g.projectiles.length, 2);
        colt.isAlive = false;
        g.updateScheduledActions(1);
        colt.isAlive = true;
        g.updateScheduledActions(1);
        assert.equal(g.projectiles.length, 2);
        assert.equal(g.scheduledActions.length, 0);
    });
}
test('cleanup cancels outstanding bursts', () => {
    const noop = () => {};
    const g = Object.assign(Object.create(Game.prototype), { scheduledActions: [], projectiles: [],
        stop: noop, inputManager: { cleanup: noop }, audioManager: { cleanup: noop, play: noop },
        effectsManager: { clear: noop }, renderSystem: { cleanup: noop }, ui: { cleanup: noop } });
    new Colt('blue', 100, 100).activateSuper(new Vector2(1, 0), g);
    g.cleanup(); g.updateScheduledActions(1);
    assert.equal(g.projectiles.length, 0);
});
test('expiry includes the final-frame death score', () => {
    let outcome;
    const mode = new TeamDeathmatchMode({ playerTeam: 'blue', endGame(value) { outcome = value; } });
    mode.teamScores = { blue: 2, red: 2 };
    mode.onBrawlerDeath({ team: 'blue' });
    mode.matchTimer = 0.01;
    mode.update(0.02);
    assert.equal(outcome, false);
    assert.equal(mode.getMatchStats().redScore, 3);
    assert.equal(mode.matchTimer, 0);
});
test('spawn animation returns to normal size at different frame rates and after respawn', () => {
    for (const firstDelta of [-0.005, 0, 1 / 144, 1 / 60, 0.1]) {
        const b = new Colt('blue', 100, 100); const g = world();
        b.update(firstDelta, g);
        for (let i = 0; i < 120; i++) b.update(1 / 60, g);
        assert.equal(b.spawnScale, 1);
        g.map.getSpawnPosition = () => ({ x: 100, y: 100 });
        b.respawn(g);
        for (let i = 0; i < 120; i++) b.update(1 / 144, g);
        assert.equal(b.spawnScale, 1);
    }
});
test('game loop clamps negative frame deltas', () => {
    let delta;
    const g = { running: true, lastTime: 100, update(dt) { delta = dt; this.running = false; }, renderSystem: { render() {} } };
    Game.prototype.gameLoop.call(g, 95);
    assert.equal(delta, 0);
});
