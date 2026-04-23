import test from 'node:test';
import assert from 'node:assert/strict';

import { AIController } from '../js/ai/AIController.js';
import { AI_DIFFICULTY } from '../js/utils/constants.js';
import { Vector2 } from '../js/utils/Vector2.js';

function createController(difficulty) {
    const brawler = {
        position: new Vector2(0, 0),
        moveDirection: new Vector2(0, 0),
        attackRange: 300,
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
    };

    return new AIController(brawler, game);
}

test('easy combat logic skips borderline attack windows that normal still takes', () => {
    const easyController = createController(AI_DIFFICULTY.EASY);
    const normalController = createController(AI_DIFFICULTY.NORMAL);

    const distance = 260;
    const randomValue = 0.7;

    assert.equal(
        easyController.shouldAttemptCombatShot(distance, randomValue),
        false
    );
    assert.equal(
        normalController.shouldAttemptCombatShot(distance, randomValue),
        true
    );
});

test('easy combat movement favors simpler movement over strafe at mid range', () => {
    const easyController = createController(AI_DIFFICULTY.EASY);
    const normalController = createController(AI_DIFFICULTY.NORMAL);
    const toTarget = new Vector2(1, 0);
    const distance = 220;

    const easyMove = easyController.chooseCombatMovement(toTarget, distance, () => 0.4);
    const normalMove = normalController.chooseCombatMovement(toTarget, distance, () => 0.4);

    assert.equal(easyMove.x > 0.95, true);
    assert.equal(Math.abs(easyMove.y) < 0.15, true);
    assert.equal(Math.abs(normalMove.y) > 0.5, true);
});

test('easy close-range movement is less reliable at backing off', () => {
    const easyController = createController(AI_DIFFICULTY.EASY);
    const normalController = createController(AI_DIFFICULTY.NORMAL);
    const toTarget = new Vector2(1, 0);
    const distance = 100;

    const easyMove = easyController.chooseCombatMovement(toTarget, distance, () => 0.3);
    const normalMove = normalController.chooseCombatMovement(toTarget, distance, () => 0.3);

    assert.equal(easyMove.x > 0, true);
    assert.equal(normalMove.x < 0, true);
});
