import test from 'node:test';
import assert from 'node:assert/strict';

import { GameMap } from '../js/map/Map.js';
import { MAPS } from '../js/map/mapData.js';
import { FlowField } from '../js/ai/FlowField.js';
import { AIController } from '../js/ai/AIController.js';
import { Game } from '../js/game/Game.js';
import { Brock } from '../js/entities/brawlers/Brock.js';
import { Spike } from '../js/entities/brawlers/Spike.js';
import { Rex } from '../js/entities/brawlers/Rex.js';
import { Vector2 } from '../js/utils/Vector2.js';
import { TILE_TYPES } from '../js/utils/constants.js';

function mapWithDestructible() {
    const map = new GameMap(MAPS.open);
    map.tiles[5][5] = TILE_TYPES.DESTRUCTIBLE;
    map.destructibleHealth['5,5'] = 100;
    return map;
}

test('destroying cover notifies listeners so navigation caches can rebuild', () => {
    const map = mapWithDestructible();
    let calls = 0;
    map.onTilesChanged = () => calls++;
    map.damageWallAtPosition(5 * map.tileSize + 1, 5 * map.tileSize + 1, 50);
    assert.equal(calls, 0);
    map.damageWallAtPosition(5 * map.tileSize + 1, 5 * map.tileSize + 1, 50);
    assert.equal(calls, 1);
});

test('game clears flow field and path caches when terrain changes', () => {
    let flowCleared = 0, pathCleared = 0;
    const g = Object.assign(Object.create(Game.prototype), {
        flowField: { clearCache() { flowCleared++; } },
        aiControllers: [{ pathfinder: { clearCache() { pathCleared++; } } }],
    });
    g.handleTerrainChanged();
    assert.deepEqual([flowCleared, pathCleared], [1, 1]);
});

test('pregenerated flow fields use the key AI navigation looks up', () => {
    const map = new GameMap(MAPS.open);
    const flow = new FlowField(map);
    flow.pregenerate();
    const spawn = map.getSpawnPosition('blue');
    assert.ok(flow.fieldCache.has(flow.destinationKey(spawn.x, spawn.y)));
    assert.ok(flow.fieldCache.has(flow.destinationKey(map.width / 2, map.height / 2)));
});

test('projectiles receive the game explicitly instead of mutating their owner', () => {
    const map = new GameMap(MAPS.open);
    const game = { map, projectiles: [], brawlers: [], audioManager: null, createEffect() {} };
    for (const Type of [Brock, Spike]) {
        const owner = new Type('blue', 100, 100);
        owner.createAttackProjectiles(new Vector2(1, 0), game);
        assert.equal(game.projectiles.at(-1).game, game);
        assert.equal('game' in owner, false);
    }
});

test('AI timers advance only through update, so pausing freezes them', () => {
    const rex = new Rex('blue', 100, 100);
    const game = { map: new GameMap(MAPS.open), brawlers: [rex], flowField: null, gameMode: null };
    const ai = new AIController(rex, game);
    ai.update(0.1);
    assert.equal(Math.round(ai.clock), 100);
});

test('Rex AI fires its super only inside super range', () => {
    const rex = new Rex('blue', 100, 100);
    rex.superReady = true;
    const far = new Rex('red', 100 + rex.config.superRange, 100);
    const game = { map: new GameMap(MAPS.open), brawlers: [rex, far], flowField: null, gameMode: null };
    const ai = new AIController(rex, game);
    ai.getDifficulty = () => ({ wasteSuperChance: 0 });
    let used = 0;
    rex.useSuper = () => { used++; return true; };
    ai.tryUseSuper();
    assert.equal(used, 0);
    far.position.set(100 + rex.config.superRange * 0.5, 100);
    ai.tryUseSuper();
    assert.equal(used, 1);
});
