import test from 'node:test';
import assert from 'node:assert/strict';

import { GameMap } from '../js/map/Map.js';
import { MAPS } from '../js/map/mapData.js';
import { TILE_TYPES } from '../js/utils/constants.js';

test('map roster is rebuilt around exactly five curated arenas', () => {
    assert.equal(Object.keys(MAPS).length, 5);
    assert.deepEqual(
        Object.keys(MAPS),
        ['open', 'maze', 'river', 'bush', 'fortress']
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
