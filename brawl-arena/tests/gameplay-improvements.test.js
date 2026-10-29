import test from 'node:test';
import assert from 'node:assert/strict';
import { Bea } from '../js/entities/brawlers/Bea.js';
import { Brock } from '../js/entities/brawlers/Brock.js';
import { Dynamike } from '../js/entities/brawlers/Dynamike.js';
import { TeamDeathmatchMode } from '../js/modes/TeamDeathmatch.js';
import { GameMap } from '../js/map/Map.js';
import { MAPS } from '../js/map/mapData.js';
import { BRAWLERS, GAME_CONFIG, TILE_TYPES, VISIBILITY_CONFIG } from '../js/utils/constants.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { AIController } from '../js/ai/AIController.js';
import { scoreTeamCandidate } from '../js/ai/teamComposition.js';
import { RenderSystem } from '../js/game/RenderSystem.js';
import { EffectsManager } from '../js/effects/Effects.js';
import { Game } from '../js/game/Game.js';

function world() {
    const blue = new Bea('blue', 225, 125);
    const red = new Bea('red', 1225, 125);
    const game = {
        map: new GameMap(MAPS.open), brawlers: [blue, red],
        projectiles: [], spikeFields: [], playerTeam: 'blue', createEffect() {},
        endGame(outcome) { this.outcome = outcome; },
    };
    game.gameMode = new TeamDeathmatchMode(game);
    return { game, blue, red, mode: game.gameMode };
}

test('both teams hide in bushes and reveal on proximity, attacking and damage', () => {
    const { game, blue, red } = world();
    game.map.isPositionInBush = () => true;
    for (const brawler of [blue, red]) {
        brawler.updateVisibility(game);
        assert.equal(brawler.isVisible, false);
        brawler.attack(new Vector2(1, 0), game);
        assert.equal(brawler.isVisible, true);
        assert.equal(brawler.revealRemaining, VISIBILITY_CONFIG.ACTION_REVEAL_MS);
        brawler.update(1.5, game);
        assert.equal(brawler.isVisible, false);
        brawler.takeDamage(1);
        assert.equal(brawler.isVisible, true);
        brawler.revealRemaining = 0;
    }
    red.position = blue.position.add(new Vector2(100, 0));
    for (const brawler of [blue, red]) {
        brawler.updateVisibility(game);
        assert.equal(brawler.isVisible, true);
    }
});

test('AI cannot choose a concealed enemy', () => {
    const { game, blue, red } = world();
    const ai = new AIController(blue, game);
    red.isVisible = false;
    assert.equal(ai.findNearestEnemy(), null);
    assert.equal(ai.findBestStrategicTarget().enemy, null);
    red.isVisible = true;
    assert.equal(ai.findNearestEnemy(), red);
});

test('bot team selection fills missing capabilities and avoids duplicate brawlers', () => {
    const zero = () => 0;
    const ranged = [{ config: BRAWLERS.BROCK }];
    assert.ok(scoreTeamCandidate(BRAWLERS.SPIKE, ranged, zero) > scoreTeamCandidate(BRAWLERS.COLT, ranged, zero));
    const rangedControl = [...ranged, { config: BRAWLERS.SPIKE }];
    assert.ok(scoreTeamCandidate(BRAWLERS.RICO, rangedControl, zero) > scoreTeamCandidate(BRAWLERS.BEA, rangedControl, zero));
    for (const candidate of Object.values(BRAWLERS).filter(b => b.id !== 'brock')) {
        assert.ok(scoreTeamCandidate(candidate, ranged, zero) > scoreTeamCandidate(BRAWLERS.BROCK, ranged, zero));
    }
});

test('Bea keeps her strong slow but gives targets more travel time to dodge', () => {
    const { game, blue } = world();
    blue.createAttackProjectiles(new Vector2(1, 0), game);
    assert.equal(game.projectiles[0].speed, 700);
    assert.equal(blue.config.stingSlowMultiplier, 0.4);
    assert.equal(blue.config.stingSlowDuration, 2000);
    assert.equal(blue.config.ammoMax, 3);
});

test('brawlers regenerate health out of combat, and attacking or damage resets the delay', () => {
    const { game, blue } = world();
    blue.takeDamage(1000);
    const damagedHealth = blue.health;

    // Still inside the 3-second delay window: no healing yet
    blue.update(2.5, game);
    assert.equal(blue.health, damagedHealth);

    // Attacking resets the out-of-combat timer
    blue.attack(new Vector2(1, 0), game);
    blue.update(2.5, game);
    assert.equal(blue.health, damagedHealth);

    // Waiting out the full delay restores health gradually up to maxHealth
    blue.update(1.0, game);
    assert.ok(blue.health > damagedHealth);
    blue.update(10, game);
    assert.equal(blue.health, blue.maxHealth);
});

test('respawn grants a temporary shield that blocks damage and breaks on attack', () => {
    const { game, blue, red } = world();
    blue.die();
    blue.respawn(game);

    assert.equal(blue.spawnShieldRemaining, GAME_CONFIG.SPAWN_SHIELD_DURATION);
    blue.takeDamage(900, red);
    blue.applySlow(0.4, 2000);
    blue.applyKnockback(new Vector2(1, 0), 100);
    assert.equal(blue.health, blue.maxHealth);
    assert.equal(blue.slowRemaining, 0);
    assert.equal(blue.knockbackVelocity.magnitude(), 0);
    assert.equal(red.superCharge, 0);

    // Attacking ends spawn protection early
    blue.attack(new Vector2(1, 0), game);
    assert.equal(blue.spawnShieldRemaining, 0);
    blue.takeDamage(500, red);
    assert.equal(blue.health, blue.maxHealth - 500);
});

test('direct-fire AI chases around intervening walls while Dynamike still lobs over cover', () => {
    const { game, blue, red } = world();
    blue.position.set(225, 125);
    red.position.set(425, 125);
    // Place a solid wall tile directly between blue (col 4) and red (col 8) at col 6, row 2
    game.map.tiles[2][6] = TILE_TYPES.WALL;

    const directAi = new AIController(blue, game);
    directAi.lastSeenEnemy = red;
    directAi.getDifficulty = () => ({ retreatThreshold: 0.2, poorDecisionChance: 0, reactionDelay: 0, smoothingFactor: 0.3 });
    assert.equal(directAi.hasClearShot(red), false);
    directAi.makeDecision();
    assert.equal(directAi.state, 'chase');

    const mike = new Dynamike('blue', 225, 125);
    game.brawlers[0] = mike;
    const artilleryAi = new AIController(mike, game);
    artilleryAi.lastSeenEnemy = red;
    artilleryAi.getDifficulty = () => ({ retreatThreshold: 0.2, poorDecisionChance: 0, reactionDelay: 0, smoothingFactor: 0.3 });
    assert.equal(artilleryAi.hasClearShot(red), true);
    artilleryAi.makeDecision();
    assert.equal(artilleryAi.state, 'attack');
});

test('AI steers away from enemy spike fields and incoming lobbed bombs', () => {
    const { game, blue } = world();
    blue.position.set(500, 500);
    const ai = new AIController(blue, game);
    ai.state = 'idle';

    game.spikeFields.push({
        active: true,
        team: 'red',
        position: new Vector2(460, 500),
        radius: 150,
    });
    ai.executeState(0.016);
    assert.ok(blue.moveDirection.x > 0.5);

    game.spikeFields = [];
    ai.smoothedDirection = new Vector2(0, 0);
    game.projectiles.push({
        active: true,
        team: 'red',
        projectileType: 'lobbedBomb',
        targetPosition: new Vector2(540, 500),
        explosionRadius: 105,
    });
    ai.executeState(0.016);
    assert.ok(blue.moveDirection.x < -0.5);
});

test('aim preview reflects full brawler range, wall clamping, and Dynamike lobbed landing circle', () => {
    const { game, red } = world();
    const renderer = Object.assign(Object.create(RenderSystem.prototype), {
        map: game.map,
        shakeRemaining: 0,
        shakeDuration: 0,
        shakeIntensity: 0,
    });

    const brock = new Brock('blue', 225, 125);
    brock.aimDirection = new Vector2(1, 0);
    const openPreview = renderer.getAimPreview(brock, game);
    assert.equal(openPreview.type, 'line');
    assert.equal(openPreview.blockedByWall, false);
    assert.equal(openPreview.endRadius, brock.config.rocketExplosionRadius);
    assert.ok(Math.abs(openPreview.end.x - (brock.position.x + brock.attackRange)) <= 8);

    // Place a solid wall at col 6, row 2 (x = 300..350, y = 100..150)
    game.map.tiles[2][6] = TILE_TYPES.WALL;
    const blockedPreview = renderer.getAimPreview(brock, game);
    assert.equal(blockedPreview.blockedByWall, true);
    assert.ok(blockedPreview.end.x < 350);

    // Dynamike lobbed preview ignores intervening cover and snaps to visible enemy in cone
    const mike = new Dynamike('blue', 225, 125);
    mike.aimDirection = new Vector2(1, 0);
    red.position.set(525, 125);
    const lobbedPreview = renderer.getAimPreview(mike, game);
    assert.equal(lobbedPreview.type, 'lobbed');
    assert.equal(lobbedPreview.radius, mike.config.explosionRadius);
    assert.ok(Math.abs(lobbedPreview.target.x - red.position.x) < 1);
});

test('taking damage queues floating damage text and heavy hits or explosions trigger screen shake', () => {
    const { blue } = world();
    const renderer = Object.assign(Object.create(RenderSystem.prototype), {
        shakeRemaining: 0,
        shakeDuration: 0,
        shakeIntensity: 0,
    });
    const fakeGame = {
        effectsManager: new EffectsManager(),
        renderSystem: renderer,
        createEffect: Game.prototype.createEffect,
    };

    blue.takeDamage(1250, null, { isSuper: true });
    assert.equal(blue.pendingDamagePopups.length, 1);

    const popup = blue.pendingDamagePopups.shift();
    fakeGame.createEffect('damageText', popup.x, popup.y, popup);
    assert.equal(fakeGame.effectsManager.effects.length, 1);
    assert.equal(fakeGame.effectsManager.effects[0].type, 'damageText');
    assert.equal(fakeGame.effectsManager.effects[0].options.amount, 1250);
    assert.equal(fakeGame.effectsManager.effects[0].options.isSuper, true);
    assert.ok(renderer.shakeRemaining > 0);

    const offset = renderer.getShakeOffset();
    assert.ok(Math.abs(offset.x) <= renderer.shakeIntensity);
    renderer.updateShake(1.0);
    assert.equal(renderer.shakeRemaining, 0);
    assert.deepEqual(renderer.getShakeOffset(), { x: 0, y: 0 });
});
