import test from 'node:test';
import assert from 'node:assert/strict';
import { Bea } from '../js/entities/brawlers/Bea.js';
import { TeamDeathmatchMode } from '../js/modes/TeamDeathmatch.js';
import { GameMap } from '../js/map/Map.js';
import { MAPS } from '../js/map/mapData.js';
import { BRAWLERS, VISIBILITY_CONFIG } from '../js/utils/constants.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { AIController } from '../js/ai/AIController.js';
import { scoreTeamCandidate } from '../js/ai/teamComposition.js';

function world() {
    const blue = new Bea('blue', 225, 125);
    const red = new Bea('red', 1225, 125);
    const game = {
        map: new GameMap(MAPS.open), brawlers: [blue, red], bears: [],
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
