import test from 'node:test';
import assert from 'node:assert/strict';

import { GameMap } from '../js/map/Map.js';
import { MAPS } from '../js/map/mapData.js';
import { TILE_TYPES } from '../js/utils/constants.js';

test('map roster is rebuilt around exactly five curated arenas', () => {
    assert.equal(Object.keys(MAPS).length, 5);
    assert.deepEqual(
        Object.keys(MAPS),
        ['open', 'maze', 'river', 'crossfire', 'fortress']
    );
});

test('every curated arena defines a full visual theme and tactical summary', () => {
    for (const map of Object.values(MAPS)) {
        assert.equal(typeof map.description, 'string');
        assert.equal(map.description.length >= 30, true);
        assert.equal(typeof map.theme, 'object');
        assert.equal(typeof map.theme.ground, 'string');
        assert.equal(typeof map.theme.groundDark, 'string');
        assert.equal(typeof map.theme.detail, 'string');
        assert.equal(typeof map.theme.bush, 'string');
        assert.equal(typeof map.theme.water, 'string');
        assert.equal(typeof map.theme.accent, 'string');
        assert.equal(typeof map.theme.decorationStyle, 'string');
    }
});

test('game map uses the provided visual theme instead of only global defaults', () => {
    const map = new GameMap({
        tiles: [
            [TILE_TYPES.WALL, TILE_TYPES.WATER, TILE_TYPES.GROUND],
            [TILE_TYPES.BUSH, TILE_TYPES.GROUND, TILE_TYPES.DESTRUCTIBLE],
            [TILE_TYPES.GROUND, TILE_TYPES.GROUND, TILE_TYPES.GROUND],
        ],
        theme: {
            ground: '#101010',
            groundDark: '#090909',
            detail: '#202020',
            wall: '#303030',
            wallTop: '#404040',
            wallEdge: '#505050',
            bush: '#606060',
            bushDark: '#707070',
            bushGlow: '#808080',
            water: '#909090',
            waterShallow: '#a0a0a0',
            accent: '#b0b0b0',
            shadow: 'rgba(10, 10, 10, 0.5)',
            decorationStyle: 'rings',
        },
    });

    assert.equal(map.getThemeColor('ground', '#fff'), '#101010');
    assert.equal(map.getThemeColor('accent', '#fff'), '#b0b0b0');
    assert.equal(map.getThemeColor('missing', '#fff'), '#fff');
});

const blocked = new Set([TILE_TYPES.WALL, TILE_TYPES.DESTRUCTIBLE, TILE_TYPES.WATER]);
function distances(tiles, start) {
    const queue = [start];
    const result = new Map([[start.join(','), 0]]);
    for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, key = [nx, ny].join(',');
            if (tiles[ny]?.[nx] === undefined || blocked.has(tiles[ny][nx]) || result.has(key)) continue;
            result.set(key, result.get([x, y].join(',')) + 1);
            queue.push([nx, ny]);
        }
    }
    return result;
}

test('every spawn reaches the center without destroying cover, with equal team travel distances', () => {
    for (const data of Object.values(MAPS)) {
        const map = new GameMap(data);
        for (const spawn of map.spawnPoints.red) {
            const red = distances(map.tiles, [spawn.x, spawn.y]);
            const blue = distances(map.tiles, [spawn.x, map.rows - 1 - spawn.y]);
            for (const center of [{ x: Math.floor(map.cols / 2), y: Math.floor(map.rows / 2) }]) {
                const distance = red.get([center.x, center.y].join(','));
                assert.ok(Number.isFinite(distance), `${data.id}: spawn cannot reach center`);
                assert.equal(distance, blue.get([center.x, map.rows - 1 - center.y].join(',')), data.id);
            }
        }
    }
});

test('team halves have mirrored terrain and spawns', () => {
    for (const data of Object.values(MAPS)) {
        const tiles = data.tiles;
        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[0].length; x++) {
                const tile = tiles[y][x];
                const mirror = tile === TILE_TYPES.SPAWN_RED ? TILE_TYPES.SPAWN_BLUE
                    : tile === TILE_TYPES.SPAWN_BLUE ? TILE_TYPES.SPAWN_RED : tile;
                assert.equal(tiles[tiles.length - 1 - y][x], mirror, data.id);
            }
        }
    }
});

test('open and fortress central clearings have usable gates on all four sides', () => {
    for (const id of ['open', 'fortress']) {
        const tiles = MAPS[id].tiles;
        for (const y of [14, 15, 16]) {
            for (let x = 11; x <= 28; x++) assert.equal(blocked.has(tiles[y][x]), false, id);
        }
        for (let y = 8; y <= 22; y++) {
            for (let x = 18; x <= 21; x++) assert.equal(blocked.has(tiles[y][x]), false, id);
        }
    }
});

test('destroyed cover does not leak into the next match or map preview', () => {
    const data = MAPS.fortress;
    const first = new GameMap(data);
    const y = first.tiles.findIndex(row => row.includes(TILE_TYPES.DESTRUCTIBLE));
    const x = first.tiles[y].indexOf(TILE_TYPES.DESTRUCTIBLE);
    const position = first.getTileCenter(x, y);
    assert.equal(first.damageWallAtPosition(position.x, position.y, 3000), true);
    assert.equal(first.getTile(x, y), TILE_TYPES.GROUND);
    assert.equal(data.tiles[y][x], TILE_TYPES.DESTRUCTIBLE);
    assert.equal(new GameMap(data).getTile(x, y), TILE_TYPES.DESTRUCTIBLE);
});
