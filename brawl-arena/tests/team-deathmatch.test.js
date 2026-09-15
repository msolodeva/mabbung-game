import test from 'node:test';
import assert from 'node:assert/strict';
import { TeamDeathmatchMode } from '../js/modes/TeamDeathmatch.js';
import { GameUI } from '../js/game/GameUI.js';
import { AIController } from '../js/ai/AIController.js';
import { Bea } from '../js/entities/brawlers/Bea.js';
import { GameMap } from '../js/map/Map.js';
import { MAPS } from '../js/map/mapData.js';

function setup(playerTeam = 'blue') {
    const outcomes = [], hud = [];
    const mode = new TeamDeathmatchMode({ playerTeam, endGame: value => outcomes.push(value),
        ui: { updateHud: value => hud.push(value) } });
    return { mode, outcomes, hud };
}

test('time limit awards victory to the higher kill count from either player perspective', () => {
    for (const playerTeam of ['blue', 'red']) {
        for (const winner of ['blue', 'red']) {
            const { mode, outcomes, hud } = setup(playerTeam);
            mode.teamScores[winner] = 100;
            mode.update(mode.matchTime - 1);
            assert.deepEqual(outcomes, []);
            mode.update(2);
            assert.deepEqual(outcomes, [playerTeam === winner]);
            assert.equal(hud.at(-1).matchTimer, 0);
            assert.equal(mode.getMatchStats().matchTime, mode.matchTime);
            mode.onBrawlerDeath({ team: winner });
            mode.update(1);
            mode.endMatch();
            assert.equal(outcomes.length, 1);
            assert.equal(mode.teamScores[winner === 'blue' ? 'red' : 'blue'], 0);
        }
    }
});

test('equal scores draw, including simultaneous deaths on the last frame', () => {
    const { mode, outcomes } = setup();
    mode.onBrawlerDeath({ team: 'blue' });
    mode.onBrawlerDeath({ team: 'red' });
    mode.update(mode.matchTime);
    assert.deepEqual(outcomes, ['draw']);
    assert.deepEqual(mode.getMatchStats(), { blueScore: 1, redScore: 1, matchTime: mode.matchTime });
    const empty = setup();
    empty.mode.update(empty.mode.matchTime);
    assert.deepEqual(empty.outcomes, ['draw']);
});

test('HUD and results display the same team kill totals', () => {
    const elements = Object.fromEntries(['blue-score', 'red-score', 'match-timer'].map(id => [id, { textContent: '', querySelector() { return this; } }]));
    const ui = new GameUI({ documentRef: { getElementById: id => elements[id] }, windowRef: {} });
    ui.updateHud({ teamScores: { blue: 12, red: 9 }, matchTimer: 61 });
    assert.equal(elements['blue-score'].textContent, 12);
    assert.equal(elements['red-score'].textContent, 9);
    assert.equal(elements['match-timer'].textContent, '1:01');
    const markup = ui.createResultMarkup({ blueScore: 12, redScore: 9 });
    assert.match(markup, /score-count">12</);
    assert.match(markup, /score-count">9</);
    assert.equal((markup.match(/>처치</g) || []).length, 2);
});

test('combat AI completes a decision and execution cycle and retreats at low health', () => {
    const blue = new Bea('blue', 100, 100);
    const red = new Bea('red', 300, 100);
    const game = { map: new GameMap(MAPS.open), brawlers: [blue, red], projectiles: [], createEffect() {} };
    const ai = new AIController(blue, game);
    ai.lastSeenEnemy = red;
    ai.getDifficulty = () => ({ retreatThreshold: 0.3, poorDecisionChance: 0, reactionDelay: 0, smoothingFactor: 0.2 });
    ai.makeDecision();
    assert.equal(ai.currentTarget, red);
    assert.equal(ai.state, 'attack');
    ai.executeState(0.016);
    blue.health = blue.maxHealth * 0.2;
    ai.makeDecision();
    assert.equal(ai.state, 'retreat');
    ai.executeState(0.016);
    ai.resetPathfinding();
});
