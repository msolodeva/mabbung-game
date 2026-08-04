import test from 'node:test';
import assert from 'node:assert/strict';

import { Nita } from '../js/entities/brawlers/Nita.js';
import { Spike } from '../js/entities/brawlers/Spike.js';
import { Vector2 } from '../js/utils/Vector2.js';

function createTarget(x = 60, y = 0) {
    return {
        id: 'target',
        team: 'red',
        isAlive: true,
        radius: 25,
        position: new Vector2(x, y),
        health: 10000,
        takeDamage(amount, attacker, source = null) {
            this.health -= amount;
            if (!source?.isSuper) attacker?.addSuperCharge(1);
        },
    };
}

function createProjectileGame(spike, target) {
    return {
        projectiles: [],
        spikeFields: [],
        brawlers: [spike, target],
        bears: [],
        map: {
            isPositionSolidForProjectile: () => false,
            damageWallAtPosition: () => false,
        },
        createEffect: () => {},
        audioManager: null,
    };
}

function updateProjectiles(game, frames = 20) {
    for (let i = 0; i < frames; i++) {
        for (const projectile of game.projectiles) {
            projectile.update(1 / 60, game);
        }
        game.projectiles = game.projectiles.filter(projectile => projectile.active);
    }
}

test('spike split projectiles damage a direct target only once', () => {
    const spike = new Spike('blue', 0, 0);
    const target = createTarget();
    const game = createProjectileGame(spike, target);

    spike.attack(new Vector2(1, 0), game);
    updateProjectiles(game);

    assert.equal(10000 - target.health, 720);
    assert.equal(spike.superCharge, 2);
});

test('spike super seed deals zero damage and its radial burst hits once', () => {
    const spike = new Spike('blue', 0, 0);
    const target = createTarget();
    const game = createProjectileGame(spike, target);
    spike.superReady = true;

    spike.useSuper(new Vector2(1, 0), game);
    updateProjectiles(game);

    assert.equal(10000 - target.health, 240);
    assert.equal(game.spikeFields.length, 1);
});

test('enemy spike fields slow movement by thirty percent', () => {
    const nita = new Nita('blue', 100, 100);
    nita.moveDirection = new Vector2(1, 0);

    const game = {
        spikeFields: [{
            active: true,
            team: 'red',
            position: new Vector2(100, 100),
            radius: 220,
            slowMultiplier: 0.7,
        }],
        brawlers: [nita],
        playerTeam: 'blue',
        map: {
            width: 1000,
            height: 1000,
            isPositionSolid: () => false,
            getTileAtPosition: () => null,
            isPositionInBush: () => false,
        },
    };

    nita.update(0.1, game);

    assert.ok(Math.abs(nita.position.x - 117.15) < 0.001);
});
