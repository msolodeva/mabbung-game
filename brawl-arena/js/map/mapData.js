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

// Map 1: Open Field (Original)
const MAP_OPEN = {
    name: 'Open Field',
    id: 'open',
    description: 'Classic open arena for long-range battles.',
    tiles: [
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 02 */[W, G, SR, G, G, B, B, B, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, B, B, B, G, G, SR, G, W],
        /* 03 */[W, G, G, G, G, B, B, B, G, G, G, W, W, G, G, G, B, B, B, B, B, B, B, B, G, G, G, W, W, G, G, G, B, B, B, G, G, G, G, W],
        /* 04 */[W, G, G, G, G, G, G, G, G, G, G, D, D, G, G, G, B, B, B, B, B, B, B, B, G, G, G, D, D, G, G, G, G, G, G, G, G, G, G, W],
        /* 05 */[W, G, B, B, B, B, G, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, B, B, B, B, G, W],
        /* 06 */[W, G, B, B, B, B, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, B, B, B, B, G, W],
        /* 07 */[W, G, G, G, G, G, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, G, G, G, G, G, W],
        /* 08 */[W, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 09 */[W, G, B, B, B, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, B, B, B, G, W],
        /* 10 */[W, G, B, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, B, G, W],
        /* 11 */[W, G, B, B, B, G, G, G, D, D, G, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, G, D, D, G, G, B, B, B, G, W],
        /* 12 */[W, G, G, G, G, G, G, G, D, D, G, G, G, G, W, B, B, B, GS, GS, GS, GS, B, B, B, W, G, G, G, G, D, D, G, G, G, G, G, G, W],
        /* 13 */[W, G, D, D, D, G, G, G, G, G, G, G, G, G, W, G, GS, GS, GS, GS, GS, GS, G, G, W, G, G, G, G, G, G, G, G, G, D, D, D, G, W],
        /* 14 */[W, G, D, W, D, G, G, G, G, G, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, G, G, G, G, G, G, D, W, D, G, W],
        /* 15 */[W, G, D, D, D, G, G, G, W, W, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, W, W, G, G, G, G, D, D, D, G, W],
        /* 16 */[W, G, D, W, D, G, G, G, W, W, G, G, G, G, G, G, GS, GS, GS, GS, GS, GS, G, G, G, G, G, G, W, W, G, G, G, G, D, W, D, G, W],
        /* 17 */[W, G, D, D, D, G, G, G, G, G, G, G, G, G, W, G, GS, GS, GS, GS, GS, GS, G, G, W, G, G, G, G, G, G, G, G, G, D, D, D, G, W],
        /* 18 */[W, G, G, G, G, G, G, G, D, D, G, G, G, G, W, B, B, B, GS, GS, GS, GS, B, B, B, W, G, G, G, G, D, D, G, G, G, G, G, G, W],
        /* 19 */[W, G, B, B, B, G, G, G, D, D, G, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, G, D, D, G, G, B, B, B, G, W],
        /* 20 */[W, G, B, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, B, G, W],
        /* 21 */[W, G, B, B, B, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, B, B, B, G, W],
        /* 22 */[W, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 23 */[W, G, G, G, G, G, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, G, G, G, G, G, W],
        /* 24 */[W, G, B, B, B, B, G, G, D, D, D, G, G, G, G, B, B, B, G, G, G, G, B, B, B, G, G, G, G, D, D, D, G, G, B, B, B, B, G, W],
        /* 25 */[W, G, B, B, B, B, G, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, B, B, B, B, G, W],
        /* 26 */[W, G, G, G, G, G, G, G, G, G, G, D, D, G, G, G, B, B, B, B, B, B, B, B, G, G, G, D, D, G, G, G, G, G, G, G, G, G, G, W],
        /* 27 */[W, G, G, G, G, B, B, B, G, G, G, W, W, G, G, G, B, B, B, B, B, B, B, B, G, G, G, W, W, G, G, G, B, B, B, G, G, G, G, W],
        /* 28 */[W, G, SB, G, G, B, B, B, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, B, B, B, G, G, SB, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
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

// Map 2: The Maze (Close Quarters) - True maze with 2-tile wide corridors
const MAP_MAZE = {
    name: 'The Maze',
    id: 'maze',
    description: 'Twisting corridors and dead ends. Master the labyrinth!',
    tiles: [
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, W],
        /* 02 */[W, G, SR, G, G, W, W, G, G, SR, G, G, G, W, W, G, G, B, B, G, G, B, B, G, G, W, W, G, G, G, SR, G, G, W, W, G, G, SR, G, W],
        /* 03 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 04 */[W, G, G, G, G, W, W, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, W, W, G, G, G, G, W],
        /* 05 */[W, W, W, W, G, G, G, G, W, D, D, W, W, W, G, G, G, G, D, D, D, D, G, G, G, G, W, W, W, D, D, W, G, G, G, G, W, W, W, W],
        /* 06 */[W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W],
        /* 07 */[W, G, G, B, B, G, G, W, W, G, G, D, D, G, G, G, B, B, B, G, G, B, B, B, G, G, G, D, D, G, G, W, W, G, G, B, B, G, G, W],
        /* 08 */[W, G, G, B, B, G, G, D, D, G, G, G, G, G, G, G, B, B, B, G, G, B, B, B, G, G, G, G, G, G, G, D, D, G, G, B, B, G, G, W],
        /* 09 */[W, G, G, G, G, G, G, D, D, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, D, D, G, G, G, G, G, G, W],
        /* 10 */[W, G, G, G, G, G, G, W, W, G, G, B, B, W, W, G, G, G, G, G, G, G, G, G, G, W, W, B, B, G, G, W, W, G, G, G, G, G, G, W],
        /* 11 */[W, W, D, D, W, W, G, G, G, G, G, G, G, W, W, G, G, W, W, G, G, W, W, G, G, W, W, G, G, G, G, G, G, G, W, W, D, D, W, W],
        /* 12 */[W, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, GS, GS, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, W],
        /* 13 */[W, G, G, D, D, G, G, G, G, G, G, G, G, G, D, D, G, B, GS, GS, GS, GS, B, G, D, D, G, G, G, G, G, G, G, G, G, D, D, G, G, W],
        /* 14 */[W, G, G, D, D, G, G, G, G, G, G, G, G, G, D, D, G, B, GS, GS, GS, GS, B, G, D, D, G, G, G, G, G, G, G, G, G, D, D, G, G, W],
        /* 15 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, GS, GS, GS, GS, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 16 */[W, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, GS, GS, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, W],
        /* 17 */[W, W, D, D, W, W, G, G, G, G, G, G, G, W, W, G, G, W, W, G, G, W, W, G, G, W, W, G, G, G, G, G, G, G, W, W, D, D, W, W],
        /* 18 */[W, G, G, G, G, G, G, W, W, G, G, B, B, W, W, G, G, G, G, G, G, G, G, G, G, W, W, B, B, G, G, W, W, G, G, G, G, G, G, W],
        /* 19 */[W, G, G, G, G, G, G, D, D, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, D, D, G, G, G, G, G, G, W],
        /* 20 */[W, G, G, B, B, G, G, D, D, G, G, G, G, G, G, G, B, B, B, G, G, B, B, B, G, G, G, G, G, G, G, D, D, G, G, B, B, G, G, W],
        /* 21 */[W, G, G, B, B, G, G, W, W, G, G, D, D, G, G, G, B, B, B, G, G, B, B, B, G, G, G, D, D, G, G, W, W, G, G, B, B, G, G, W],
        /* 22 */[W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W],
        /* 23 */[W, W, W, W, G, G, G, G, W, D, D, W, W, W, G, G, G, G, D, D, D, D, G, G, G, G, W, W, W, D, D, W, G, G, G, G, W, W, W, W],
        /* 24 */[W, G, G, G, G, W, W, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, W, W, G, G, G, G, W],
        /* 25 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 26 */[W, G, SB, G, G, W, W, G, G, SB, G, G, G, W, W, G, G, B, B, G, G, B, B, G, G, W, W, G, G, G, SB, G, G, W, W, G, G, SB, G, W],
        /* 27 */[W, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, W],
        /* 28 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
    ],

    spawnBlue: [
        { x: 2, y: 26 },
        { x: 37, y: 26 },
        { x: 9, y: 26 },
        { x: 30, y: 26 },
    ],

    spawnRed: [
        { x: 2, y: 2 },
        { x: 37, y: 2 },
        { x: 9, y: 2 },
        { x: 30, y: 2 },
    ],

    gemSpawns: [
        { x: 19, y: 13 },
        { x: 20, y: 13 },
        { x: 19, y: 14 },
        { x: 20, y: 14 },
        { x: 19, y: 15 },
        { x: 20, y: 15 },
    ],
};

// Map 3: River Crossing (Sniper's Paradise) - Open but divided by water
const MAP_RIVER = {
    name: 'River Crossing',
    id: 'river',
    description: 'A wide river splits the map. Long range brawlers dominate here!',
    tiles: [
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 02 */[W, G, SR, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, G, G, G, G, B, B, G, G, SR, G, W],
        /* 03 */[W, G, G, G, G, G, G, G, G, G, G, D, D, D, G, G, G, G, G, G, G, G, G, G, G, G, D, D, D, G, G, G, G, G, G, G, G, G, G, W],
        /* 04 */[W, G, G, G, G, G, G, G, G, G, G, D, D, D, G, G, G, W, W, W, W, G, G, G, G, G, D, D, D, G, G, G, G, G, G, G, G, G, G, W],
        /* 05 */[W, G, G, G, W, W, G, G, G, G, B, 7, 7, G, G, 7, 7, 7, G, G, 7, 7, 7, G, G, 7, 7, B, G, G, G, W, W, G, G, G, G, G, G, W],
        /* 06 */[W, G, G, G, W, W, G, G, G, G, B, 7, 7, G, G, 7, 7, 7, 7, 7, 7, 7, 7, G, G, 7, 7, B, G, G, G, W, W, G, G, G, G, G, G, W],
        /* 07 */[W, G, G, G, G, G, G, G, G, G, B, G, G, 7, 7, 7, 7, 7, 7, G, G, 7, 7, 7, 7, G, G, B, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 08 */[W, G, G, G, G, G, G, G, G, G, B, G, G, 7, 7, 7, 7, 7, 7, G, G, 7, 7, 7, 7, G, G, B, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 09 */[W, G, G, G, G, G, B, B, G, G, B, 7, 7, 7, 7, W, W, W, G, G, G, G, W, W, W, 7, 7, B, G, G, G, B, B, G, G, G, G, G, G, W],
        /* 10 */[W, G, G, G, G, G, B, B, G, G, B, 7, 7, 7, 7, W, W, G, G, G, G, G, G, G, G, W, W, B, 7, 7, G, G, B, B, G, G, G, G, G, W],
        /* 11 */[W, G, B, B, B, G, G, G, G, G, B, 7, 7, 7, W, G, G, G, G, G, G, G, G, G, G, W, 7, B, 7, 7, 7, G, G, G, G, B, B, B, G, W],
        /* 12 */[W, G, G, G, G, G, G, G, 7, 7, B, G, G, G, G, G, GS, GS, GS, GS, GS, GS, GS, GS, G, G, G, B, 7, 7, 7, 7, 7, G, G, G, G, G, G, W],
        /* 13 */[W, G, G, G, G, G, G, 7, 7, 7, B, G, G, G, G, G, GS, GS, GS, GS, GS, GS, GS, GS, GS, G, G, B, 7, 7, 7, 7, 7, 7, G, G, G, G, W],
        /* 14 */[W, G, G, G, G, G, G, 7, 7, 7, B, G, G, G, G, G, GS, GS, GS, GS, GS, GS, GS, GS, GS, G, G, B, 7, 7, 7, 7, 7, 7, G, G, G, G, W],
        /* 15 */[W, G, G, G, G, G, G, G, 7, 7, B, 7, 7, 7, G, G, GS, GS, GS, GS, GS, GS, GS, GS, G, G, G, B, G, G, G, 7, 7, G, G, G, G, G, G, W],
        /* 16 */[W, G, B, B, B, G, G, G, G, G, B, 7, 7, 7, W, G, G, G, G, G, G, G, G, G, G, W, 7, B, 7, 7, 7, G, G, G, G, B, B, B, G, W],
        /* 17 */[W, G, G, G, G, G, B, B, G, G, B, 7, 7, 7, W, W, G, G, G, G, G, G, G, G, W, W, 7, B, 7, 7, G, G, B, B, G, G, G, G, G, W],
        /* 18 */[W, G, G, G, G, G, B, B, G, G, B, 7, 7, 7, 7, W, W, W, G, G, G, G, W, W, W, 7, 7, B, G, G, G, G, B, B, G, G, G, G, G, W],
        /* 19 */[W, G, G, G, G, G, G, G, G, G, B, G, G, 7, 7, 7, 7, 7, 7, G, G, 7, 7, 7, 7, 7, G, B, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 20 */[W, G, G, G, G, G, G, G, G, G, B, G, G, 7, 7, 7, 7, 7, 7, G, G, 7, 7, 7, 7, 7, G, B, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 21 */[W, G, G, G, W, W, G, G, G, G, B, 7, 7, G, G, 7, 7, 7, 7, G, G, 7, 7, 7, 7, G, G, B, G, G, G, W, W, G, G, G, G, G, G, W],
        /* 22 */[W, G, G, G, W, W, G, G, G, G, B, 7, 7, G, G, 7, 7, 7, G, G, G, 7, 7, 7, G, G, G, B, G, G, G, W, W, G, G, G, G, G, G, W],
        /* 23 */[W, G, G, G, G, G, G, G, G, G, G, D, D, D, G, G, G, W, W, W, W, G, G, G, G, G, D, D, D, G, G, G, G, G, G, G, G, G, G, W],
        /* 24 */[W, G, G, G, G, G, G, G, G, G, G, D, D, D, G, G, G, G, G, G, G, G, G, G, G, G, D, D, D, G, G, G, G, G, G, G, G, G, G, W],
        /* 25 */[W, G, SB, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, G, G, G, G, B, B, G, G, SB, G, W],
        /* 26 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 27 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 28 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
    ],
    spawnBlue: [{ x: 2, y: 25 }, { x: 37, y: 25 }, { x: 20, y: 27 }],
    spawnRed: [{ x: 2, y: 2 }, { x: 37, y: 2 }, { x: 20, y: 1 }],
    gemSpawns: [{ x: 19, y: 13 }, { x: 20, y: 13 }, { x: 19, y: 14 }, { x: 20, y: 14 }],
};

// Map 4: Bush Ambush (Snake Prairie Style) - Tons of bushes
const MAP_BUSH = {
    name: 'Bush Ambush',
    id: 'bush',
    description: 'Sneak through the grass. Close range brawlers thrive here!',
    tiles: [
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, SR, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, SR, W, W],
        /* 02 */[W, B, B, B, B, G, G, B, B, B, B, W, W, B, B, B, G, G, G, G, G, G, B, B, B, W, W, B, B, B, B, G, G, B, B, B, B, B, W, W],
        /* 03 */[W, B, B, B, W, W, G, B, B, B, B, W, W, B, B, B, G, G, G, G, G, G, B, B, B, W, W, B, B, B, B, G, W, W, B, B, B, B, G, W],
        /* 04 */[W, B, B, G, W, W, G, B, D, D, D, B, B, B, G, G, G, G, G, G, G, G, G, G, B, B, B, D, D, D, B, G, W, W, G, B, B, B, G, W],
        /* 05 */[W, B, B, G, G, G, G, B, D, D, D, B, B, B, G, G, B, B, B, B, B, B, G, G, B, B, B, D, D, D, B, G, G, G, G, B, B, B, G, W],
        /* 06 */[W, B, B, B, B, B, B, B, B, B, B, B, B, B, G, G, B, B, W, W, B, B, G, G, B, B, B, B, B, B, B, B, B, B, B, B, B, B, G, W],
        /* 07 */[W, B, B, W, W, B, B, B, B, B, B, B, B, B, G, G, B, B, W, W, B, B, G, G, B, B, B, B, B, B, B, B, W, W, B, B, B, B, G, W],
        /* 08 */[W, B, B, W, W, B, B, B, W, W, W, B, B, B, G, G, B, B, B, B, B, B, G, G, B, B, B, W, W, W, B, B, W, W, B, B, B, B, G, W],
        /* 09 */[W, B, B, B, D, D, D, B, W, W, W, B, B, B, G, G, G, G, G, G, G, G, G, G, B, B, B, W, W, W, B, D, D, D, B, B, B, B, G, W],
        /* 10 */[W, B, B, B, D, D, D, B, B, B, B, B, B, B, B, B, B, W, W, W, B, B, B, B, B, B, B, B, B, B, B, D, D, D, B, B, B, B, G, W],
        /* 11 */[W, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, G, G, G, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, G, W],
        /* 12 */[W, B, B, G, G, G, B, B, D, D, B, B, B, B, B, G, G, GS, GS, GS, G, G, B, B, B, B, B, D, D, B, B, G, G, G, B, B, B, B, G, W],
        /* 13 */[W, B, B, G, G, G, B, B, D, D, B, B, B, B, B, G, GS, GS, GS, GS, GS, G, B, B, B, B, B, D, D, B, B, G, G, G, B, B, B, B, G, W],
        /* 14 */[W, B, B, G, G, G, B, B, D, D, B, B, B, B, B, G, GS, GS, GS, GS, GS, G, B, B, B, B, B, D, D, B, B, G, G, G, B, B, B, B, G, W],
        /* 15 */[W, B, B, G, G, G, B, B, D, D, B, B, B, B, B, G, G, GS, GS, GS, G, G, B, B, B, B, B, D, D, B, B, G, G, G, B, B, B, B, G, W],
        /* 16 */[W, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, G, G, G, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, G, W],
        /* 17 */[W, B, B, B, D, D, D, B, B, B, B, B, B, B, B, B, B, W, W, W, B, B, B, B, B, B, B, B, B, B, B, D, D, D, B, B, B, B, G, W],
        /* 18 */[W, B, B, B, D, D, D, B, W, W, W, B, B, B, G, G, G, G, G, G, G, G, G, G, B, B, B, W, W, W, B, D, D, D, B, B, B, B, G, W],
        /* 19 */[W, B, B, W, W, B, B, B, W, W, W, B, B, B, G, G, B, B, B, B, B, B, G, G, B, B, B, W, W, W, B, B, W, W, B, B, B, B, G, W],
        /* 20 */[W, B, B, W, W, B, B, B, B, B, B, B, B, B, G, G, B, B, W, W, B, B, G, G, B, B, B, B, B, B, B, B, W, W, B, B, B, B, G, W],
        /* 21 */[W, B, B, B, B, B, B, B, B, B, B, B, B, B, G, G, B, B, W, W, B, B, G, G, B, B, B, B, B, B, B, B, B, B, B, B, B, B, G, W],
        /* 22 */[W, B, B, G, G, G, G, B, D, D, D, B, B, B, G, G, B, B, B, B, B, B, G, G, B, B, B, D, D, D, B, G, G, G, G, B, B, B, G, W],
        /* 23 */[W, B, B, G, W, W, G, B, D, D, D, B, B, B, G, G, G, G, G, G, G, G, G, G, B, B, B, D, D, D, B, G, W, W, G, B, B, B, G, W],
        /* 24 */[W, B, B, B, W, W, G, B, B, B, B, W, W, B, B, B, G, G, G, G, G, G, B, B, B, W, W, B, B, B, B, G, W, W, B, B, B, B, G, W],
        /* 25 */[W, B, B, B, B, G, G, B, B, B, B, W, W, B, B, B, G, G, G, G, G, G, B, B, B, W, W, B, B, B, B, G, G, B, B, B, B, B, G, W],
        /* 26 */[W, SB, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, SB, W, W],
        /* 27 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 28 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
    ],
    spawnBlue: [{ x: 1, y: 26 }, { x: 37, y: 26 }, { x: 19, y: 26 }],
    spawnRed: [{ x: 1, y: 1 }, { x: 37, y: 1 }, { x: 19, y: 1 }],
    gemSpawns: [{ x: 19, y: 13 }, { x: 20, y: 13 }, { x: 19, y: 14 }, { x: 20, y: 14 }],
};

// Map 5: The Fortress - Central fortified position
const MAP_FORTRESS = {
    name: 'The Fortress',
    id: 'fortress',
    description: 'A fortified gem mine in the center. Break the walls or flank!',
    tiles: [
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 02 */[W, G, SR, G, G, SR, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, SR, G, G, SR, G, W],
        /* 03 */[W, G, G, G, G, G, G, G, B, B, B, B, B, G, B, B, B, B, B, B, B, B, B, B, G, B, B, B, B, B, G, G, G, G, G, G, G, G, G, W],
        /* 04 */[W, G, G, D, D, D, G, G, B, W, W, W, B, G, B, B, G, G, G, G, G, G, B, B, G, B, W, W, W, B, G, G, D, D, D, G, G, G, G, W],
        /* 05 */[W, G, G, D, D, D, G, G, B, W, W, W, B, G, G, G, G, G, G, G, G, G, G, G, G, B, W, W, W, B, G, G, D, D, D, G, G, G, G, W],
        /* 06 */[W, G, G, D, D, D, G, G, G, B, B, B, G, G, G, G, W, W, W, W, W, W, G, G, G, G, B, B, B, G, G, G, D, D, D, G, G, G, G, W],
        /* 07 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, G, G, G, G, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 08 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, G, GS, GS, G, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 09 */[W, G, B, B, G, G, G, G, W, W, W, G, G, G, G, G, D, G, GS, GS, G, D, G, G, G, G, G, W, W, W, G, G, G, G, B, B, G, G, W],
        /* 10 */[W, G, B, B, G, G, G, G, W, W, W, G, G, G, G, G, D, G, GS, GS, G, D, G, G, G, G, G, W, W, W, G, G, G, G, B, B, G, G, W],
        /* 11 */[W, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, W, G, G, G, G, W, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        /* 12 */[W, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, W, W, G, G, W, W, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        /* 13 */[W, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        /* 14 */[W, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 15 */[W, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 16 */[W, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        /* 17 */[W, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, W, W, G, G, W, W, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        /* 18 */[W, G, G, G, B, B, G, G, G, G, G, G, G, G, G, G, W, G, G, G, G, W, G, G, G, G, G, G, G, G, G, G, B, B, G, G, G, G, W],
        /* 19 */[W, G, B, B, G, G, G, G, W, W, W, G, G, G, G, G, D, G, GS, GS, G, D, G, G, G, G, G, W, W, W, G, G, G, G, B, B, G, G, W],
        /* 20 */[W, G, B, B, G, G, G, G, W, W, W, G, G, G, G, G, D, G, GS, GS, G, D, G, G, G, G, G, W, W, W, G, G, G, G, B, B, G, G, W],
        /* 21 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, G, GS, GS, G, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 22 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, G, G, G, G, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 23 */[W, G, G, D, D, D, G, G, G, B, B, B, G, G, G, G, W, W, W, W, W, W, G, G, G, G, B, B, B, G, G, G, D, D, D, G, G, G, G, W],
        /* 24 */[W, G, G, D, D, D, G, G, B, W, W, W, B, G, G, G, G, G, G, G, G, G, G, G, G, B, W, W, W, B, G, G, D, D, D, G, G, G, G, W],
        /* 25 */[W, G, G, D, D, D, G, G, B, W, W, W, B, G, B, B, G, G, G, G, G, G, B, B, G, B, W, W, W, B, G, G, D, D, D, G, G, G, G, W],
        /* 26 */[W, G, G, G, G, G, G, G, B, B, B, B, B, G, B, B, B, B, B, B, B, B, B, B, G, B, B, B, B, B, G, G, G, G, G, G, G, G, G, W],
        /* 27 */[W, G, SB, G, G, SB, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, SB, G, G, SB, G, W],
        /* 28 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W]
    ],
    spawnBlue: [{ x: 2, y: 27 }, { x: 5, y: 27 }, { x: 33, y: 27 }, { x: 36, y: 27 }],
    spawnRed: [{ x: 2, y: 2 }, { x: 5, y: 2 }, { x: 33, y: 2 }, { x: 36, y: 2 }],
    gemSpawns: [{ x: 19, y: 9 }, { x: 20, y: 9 }, { x: 19, y: 20 }, { x: 20, y: 20 }, { x: 19, y: 15 }, { x: 20, y: 15 }],
};


// Export ALL maps
export const MAPS = {
    [MAP_OPEN.id]: MAP_OPEN,
    [MAP_MAZE.id]: MAP_MAZE,
    [MAP_RIVER.id]: MAP_RIVER,
    [MAP_BUSH.id]: MAP_BUSH,
    [MAP_FORTRESS.id]: MAP_FORTRESS,
};

// Default export for backward compatibility if needed, though we should switch to named exports
export const GEM_GRAB_MAP = MAP_OPEN; 
