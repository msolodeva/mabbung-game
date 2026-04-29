import test from 'node:test';
import assert from 'node:assert/strict';

import { AIController } from '../js/ai/AIController.js';
import { AI_DIFFICULTY } from '../js/utils/constants.js';
import { Vector2 } from '../js/utils/Vector2.js';

function createController(difficulty) {
    const brawler = {
        config: { id: 'brock', role: 'ROCKETEER' },
        position: new Vector2(0, 0),
        moveDirection: new Vector2(0, 0),
        attackRange: 300,
        health: 3000,
        maxHealth: 3000,
        ammo: 3,
        ammoMax: 3,
        gems: 0,
        attack: () => {},
        canAttack: () => true,
        isAlive: true,
        team: 'blue',
    };

    const map = {
        cols: 20,
        rows: 20,
        getTile: () => 0,
        isPositionSolid: () => false,
    };

    const game = {
        aiDifficulty: difficulty,
        map,
        flowField: null,
        brawlers: [brawler],
        gems: [],
    };

    return new AIController(brawler, game);
}

function createTeamDifficultyController(team, difficultiesByTeam) {
    const controller = createController(AI_DIFFICULTY.EASY);
    controller.brawler.team = team;
    controller.game.getAiDifficultyForTeam = targetTeam => difficultiesByTeam[targetTeam];
    return controller;
}

test('AI difficulty exposes only easy and hard presets', () => {
    assert.deepEqual(Object.keys(AI_DIFFICULTY), ['EASY', 'HARD']);
    assert.equal(AI_DIFFICULTY.NORMAL, undefined);
});

test('difficulty presets keep both AI levels intentionally imperfect', () => {
    assert.equal(AI_DIFFICULTY.EASY.reactionDelay >= 500, true);
    assert.equal(AI_DIFFICULTY.EASY.combatAttackChance <= 0.35, true);
    assert.equal(AI_DIFFICULTY.EASY.combatStrafeChance <= 0.12, true);

    assert.equal(AI_DIFFICULTY.HARD.reactionDelay >= 220, true);
    assert.equal(AI_DIFFICULTY.HARD.poorDecisionChance >= 0.16, true);
    assert.equal(AI_DIFFICULTY.HARD.combatAttackChance <= 0.68, true);
    assert.equal(AI_DIFFICULTY.HARD.combatStrafeChance <= 0.5, true);
    assert.equal(AI_DIFFICULTY.HARD.combatBackoffChance <= 0.62, true);
});

test('AI controller reads difficulty from its own team', () => {
    const controller = createTeamDifficultyController('red', {
        blue: AI_DIFFICULTY.EASY,
        red: AI_DIFFICULTY.HARD,
    });

    assert.equal(controller.getDifficulty(), AI_DIFFICULTY.HARD);
});

test('borderline attack windows are no longer automatic even on hard', () => {
    const easyController = createController(AI_DIFFICULTY.EASY);
    const hardController = createController(AI_DIFFICULTY.HARD);

    const distance = 260;
    const randomValue = 0.7;

    assert.equal(
        easyController.shouldAttemptCombatShot(distance, randomValue),
        false
    );
    assert.equal(
        hardController.shouldAttemptCombatShot(distance, randomValue),
        false
    );
});

test('hard still strafes more than easy, but only on confident movement rolls', () => {
    const easyController = createController(AI_DIFFICULTY.EASY);
    const hardController = createController(AI_DIFFICULTY.HARD);
    const toTarget = new Vector2(1, 0);
    const distance = 220;

    const easyMove = easyController.chooseCombatMovement(toTarget, distance, () => 0.2);
    const hardMove = hardController.chooseCombatMovement(toTarget, distance, () => 0.2);

    assert.equal(easyMove.x > 0.95, true);
    assert.equal(Math.abs(easyMove.y) < 0.15, true);
    assert.equal(Math.abs(hardMove.y) > 0.5, true);
});

test('easy close-range movement is less reliable at backing off', () => {
    const easyController = createController(AI_DIFFICULTY.EASY);
    const hardController = createController(AI_DIFFICULTY.HARD);
    const toTarget = new Vector2(1, 0);
    const distance = 100;

    const easyMove = easyController.chooseCombatMovement(toTarget, distance, () => 0.3);
    const hardMove = hardController.chooseCombatMovement(toTarget, distance, () => 0.3);

    assert.equal(easyMove.x > 0, true);
    assert.equal(hardMove.x < 0, true);
});

test('chase preserves combat spacing inside attack range instead of rushing directly in', () => {
    const controller = createController({
        ...AI_DIFFICULTY.HARD,
        combatStrafeChance: 1,
    });
    const enemy = {
        config: { id: 'colt', role: 'MARKSMAN' },
        position: new Vector2(220, 0),
        health: 3000,
        maxHealth: 3000,
        gems: 0,
        isAlive: true,
        team: 'red',
    };
    controller.currentTarget = enemy;
    controller.game.brawlers.push(enemy);

    controller.chase();

    assert.equal(controller.brawler.moveDirection.x < 0.95, true);
    assert.equal(Math.abs(controller.brawler.moveDirection.y) > 0.2, true);
});
