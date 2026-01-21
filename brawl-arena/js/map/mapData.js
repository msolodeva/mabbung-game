// ========================================
// MAP DATA - Gem Grab Arena
// ========================================

import { TILE_TYPES } from '../utils/constants.js';

const G = TILE_TYPES.GROUND;
const W = TILE_TYPES.WALL;
const B = TILE_TYPES.BUSH;
const D = TILE_TYPES.DESTRUCTIBLE;
const SB = TILE_TYPES.SPAWN_BLUE;
const SR = TILE_TYPES.SPAWN_RED;
const GS = TILE_TYPES.GEM_SPAWN;

export const GEM_GRAB_MAP = {
    tiles: [
        // Row 0-4: Top border and red spawn area
        [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        [W, G, SR, G, G, B, B, G, G, G, D, D, G, G, G, G, G, G, D, D, G, G, G, B, B, G, G, SR, G, W],
        [W, G, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        [W, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, W],

        // Row 5-9: Upper play area
        [W, G, G, G, G, G, G, G, W, W, G, G, B, B, G, G, B, B, G, G, W, W, G, G, G, G, G, G, G, W],
        [W, G, B, B, G, G, D, G, G, G, G, G, B, B, G, G, B, B, G, G, G, G, G, D, G, G, B, B, G, W],
        [W, G, B, B, G, G, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, G, G, B, B, G, W],
        [W, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, W],
        [W, G, G, G, G, G, G, G, G, G, W, W, G, G, GS, GS, G, G, W, W, G, G, G, G, G, G, G, G, G, W],

        // Row 10: Center gem mine
        [W, G, G, G, W, W, G, G, G, G, G, G, G, GS, GS, GS, GS, G, G, G, G, G, G, G, W, W, G, G, G, W],

        // Row 11-14: Lower play area (mirrored)
        [W, G, G, G, G, G, G, G, G, G, W, W, G, G, GS, GS, G, G, W, W, G, G, G, G, G, G, G, G, G, W],
        [W, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, W],
        [W, G, B, B, G, G, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, G, G, B, B, G, W],
        [W, G, B, B, G, G, D, G, G, G, G, G, B, B, G, G, B, B, G, G, G, G, G, D, G, G, B, B, G, W],

        // Row 15-18: Blue spawn area
        [W, G, G, G, G, G, G, G, W, W, G, G, B, B, G, G, B, B, G, G, W, W, G, G, G, G, G, G, G, W],
        [W, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, W],
        [W, G, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        [W, G, SB, G, G, B, B, G, G, G, D, D, G, G, G, G, G, G, D, D, G, G, G, B, B, G, G, SB, G, W],
        [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    ],

    spawnBlue: [
        { x: 2, y: 18 },
        { x: 27, y: 18 },
        { x: 14, y: 19 },
    ],

    spawnRed: [
        { x: 2, y: 2 },
        { x: 27, y: 2 },
        { x: 14, y: 1 },
    ],

    gemSpawns: [
        { x: 14, y: 9 },
        { x: 15, y: 9 },
        { x: 13, y: 10 },
        { x: 14, y: 10 },
        { x: 15, y: 10 },
        { x: 16, y: 10 },
        { x: 14, y: 11 },
        { x: 15, y: 11 },
    ],
};
