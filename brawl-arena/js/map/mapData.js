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

// Map 2: The Maze (Close Quarters) - True maze with 2-tile wide corridors
const MAP_MAZE = {
    name: 'The Maze',
    id: 'maze',
    description: 'Twisting corridors and dead ends. Master the labyrinth!',
    tiles: [
        /* 00 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
        /* 01 */[W, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, W],
        /* 02 */[W, G, SR, G, G, W, W, G, G, SR, G, G, G, W, W, G, G, B, B, G, G, B, B, G, G, W, W, G, G, G, SR, G, G, W, W, G, G, SR, G, W],
        /* 03 */[W, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, B, B, G, G, B, B, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, W],
        /* 04 */[W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W],
        /* 05 */[W, W, W, W, G, G, G, G, W, W, W, W, W, W, W, W, G, G, D, D, D, D, G, G, W, W, W, W, W, W, W, W, G, G, G, G, W, W, W, W],
        /* 06 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, D, D, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 07 */[W, G, G, B, B, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, B, B, G, G, W],
        /* 08 */[W, G, G, B, B, G, G, W, W, G, G, W, W, W, W, G, G, G, G, G, G, G, G, G, G, W, W, W, W, G, G, W, W, G, G, B, B, G, G, W],
        /* 09 */[W, G, G, G, G, G, G, W, W, G, G, W, W, W, W, G, G, G, G, G, G, G, G, G, G, W, W, W, W, G, G, W, W, G, G, G, G, G, G, W],
        /* 10 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 11 */[W, W, W, W, W, W, G, G, G, G, D, D, G, G, G, G, G, W, W, G, G, W, W, G, G, G, G, G, D, D, G, G, G, G, W, W, W, W, W, W],
        /* 12 */[W, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, GS, GS, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, W],
        /* 13 */[W, G, G, D, D, G, G, G, G, G, G, G, G, G, W, W, G, B, GS, GS, GS, GS, B, G, W, W, G, G, G, G, G, G, G, G, D, D, G, G, W],
        /* 14 */[W, G, G, D, D, G, G, G, G, G, G, G, G, G, W, W, G, B, GS, GS, GS, GS, B, G, W, W, G, G, G, G, G, G, G, G, D, D, G, G, W],
        /* 15 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, B, GS, GS, GS, GS, B, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 16 */[W, G, G, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, GS, GS, G, G, G, G, G, G, G, D, D, G, G, G, G, G, G, G, G, G, W],
        /* 17 */[W, W, W, W, W, W, G, G, G, G, D, D, G, G, G, G, G, W, W, G, G, W, W, G, G, G, G, G, D, D, G, G, G, G, W, W, W, W, W, W],
        /* 18 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 19 */[W, G, G, G, G, G, G, W, W, G, G, W, W, W, W, G, G, G, G, G, G, G, G, G, G, W, W, W, W, G, G, W, W, G, G, G, G, G, G, W],
        /* 20 */[W, G, G, B, B, G, G, W, W, G, G, W, W, W, W, G, G, G, G, G, G, G, G, G, G, W, W, W, W, G, G, W, W, G, G, B, B, G, G, W],
        /* 21 */[W, G, G, B, B, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, B, B, G, G, W],
        /* 22 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, D, D, D, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 23 */[W, W, W, W, G, G, G, G, W, W, W, W, W, W, W, W, G, G, D, D, D, D, G, G, W, W, W, W, W, W, W, W, G, G, G, G, W, W, W, W],
        /* 24 */[W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W],
        /* 25 */[W, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, B, B, G, G, B, B, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, W],
        /* 26 */[W, G, SB, G, G, W, W, G, G, SB, G, G, G, W, W, G, G, B, B, G, G, B, B, G, G, W, W, G, G, G, SB, G, G, W, W, G, G, SB, G, W],
        /* 27 */[W, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, G, G, G, G, G, G, W, W, G, G, G, G, G, G, W, W, G, G, G, G, W],
        /* 28 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 29 */[W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
        /* 30 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
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

// Export ALL maps
export const MAPS = {
    [MAP_OPEN.id]: MAP_OPEN,
    [MAP_MAZE.id]: MAP_MAZE,
};

// Default export for backward compatibility if needed, though we should switch to named exports
export const GEM_GRAB_MAP = MAP_OPEN; 
