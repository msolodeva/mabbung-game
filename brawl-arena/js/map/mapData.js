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
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 02 */[W, G, SR, G, G, B, B, B, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, B, B, B, G, G, SR, G, W],
        /* 03 */[W, G, G, G, G, B, B, B, G, G, G, W, W, G, G, G, B, B, B, B, B, B, B, B, G, G, G, W, W, G, G, G, B, B, B, G, G, G, G, W],
        /* 04 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, B, B, B, B, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 05 */[W, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, W],
        /* 06 */[W, G, B, B, W, W, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, W, W, B, B, G, W],
        /* 07 */[W, G, B, B, G, G, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, G, G, B, B, G, W],
        /* 08 */[W, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 09 */[W, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 10 */[W, G, B, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, B, G, G, W],
        /* 11 */[W, G, B, B, B, G, G, G, D, D, G, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, G, D, D, G, G, B, B, B, G, G, W],
        /* 12 */[W, G, G, G, G, G, G, G, D, D, G, G, G, G, G, B, B, B, GS, GS, GS, GS, B, B, B, G, G, G, G, G, D, D, G, G, G, G, G, G, W],
        /* 13 */[W, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, W],
        /* 14 */[W, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, W],
        /* 15 */[W, G, G, G, G, G, G, G, W, W, B, B, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, B, B, W, W, G, G, G, G, G, G, G, W],
        /* 16 */[W, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, W],
        /* 17 */[W, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, W],
        /* 18 */[W, G, G, G, G, G, G, G, D, D, G, G, G, G, G, B, B, B, GS, GS, GS, GS, B, B, B, G, G, G, G, G, D, D, G, G, G, G, G, G, W],
        /* 19 */[W, G, B, B, B, G, G, G, D, D, G, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, G, D, D, G, G, B, B, B, G, G, W],
        /* 20 */[W, G, B, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, B, G, G, W],
        /* 21 */[W, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 22 */[W, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 23 */[W, G, B, B, G, G, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, G, G, B, B, G, W],
        /* 24 */[W, G, B, B, W, W, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, W, W, B, B, G, W],
        /* 25 */[W, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, W],
        /* 26 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, B, B, B, B, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 27 */[W, G, G, G, G, B, B, B, G, G, G, W, W, G, G, G, B, B, B, B, B, B, B, B, G, G, G, W, W, G, G, G, B, B, B, G, G, G, G, W],
        /* 28 */[W, G, SB, G, G, B, B, B, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, B, B, B, G, G, SB, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    ],

    spawnBlue: [
        { x: 2, y: 28 },
        { x: 37, y: 28 },
        { x: 20, y: 28 },
    ],

    spawnRed: [
        { x: 2, y: 2 },
        { x: 37, y: 2 },
        { x: 20, y: 2 },
    ],

    gemSpawns: [
        { x: 19, y: 14 },
        { x: 20, y: 14 },
        { x: 19, y: 15 },
        { x: 20, y: 15 },
        { x: 19, y: 16 },
        { x: 20, y: 16 },
    ],
};
