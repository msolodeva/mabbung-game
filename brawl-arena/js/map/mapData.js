// ========================================
// MAP DATA - Curated Team Deathmatch Arenas
// ========================================

import { TILE_TYPES } from '../utils/constants.js';

const G = TILE_TYPES.GROUND;
const W = TILE_TYPES.WALL;
const B = TILE_TYPES.BUSH;
const D = TILE_TYPES.DESTRUCTIBLE;
const SB = TILE_TYPES.SPAWN_BLUE;
const SR = TILE_TYPES.SPAWN_RED;
const WA = TILE_TYPES.WATER;

const ROWS = 31;
const COLS = 40;

function createEmptyArena(rows = ROWS, cols = COLS) {
    return Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) =>
            row === 0 || row === rows - 1 || col === 0 || col === cols - 1 ? W : G
        )
    );
}

function paintRect(tiles, left, top, right, bottom, tile) {
    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            tiles[row][col] = tile;
        }
    }
}

function clearRect(tiles, left, top, right, bottom) {
    paintRect(tiles, left, top, right, bottom, G);
}

function drawHorizontalLine(tiles, row, from, to, tile, gaps = []) {
    for (let col = from; col <= to; col++) {
        if (!gaps.includes(col)) {
            tiles[row][col] = tile;
        }
    }
}

function drawVerticalLine(tiles, col, from, to, tile, gaps = []) {
    for (let row = from; row <= to; row++) {
        if (!gaps.includes(row)) {
            tiles[row][col] = tile;
        }
    }
}

function setTiles(tiles, coords, tile) {
    coords.forEach(([col, row]) => {
        tiles[row][col] = tile;
    });
}

function addSpawnRows(tiles, topSpawns, bottomSpawns) {
    setTiles(tiles, topSpawns, SR);
    setTiles(tiles, bottomSpawns, SB);
}

// Mirror terrain across the horizontal centerline so both teams get equal routes.
function mirrorTeamHalves(tiles) {
    for (let row = 0; row < Math.floor(tiles.length / 2); row++) {
        tiles[tiles.length - 1 - row] = tiles[row].map(tile =>
            tile === SR ? SB : tile === SB ? SR : tile
        );
    }
    return tiles;
}

function buildTheme(theme) {
    return theme;
}

const THEMES = {
    open: buildTheme({
        ground: '#b68c55',
        groundDark: '#9f7643',
        detail: '#d4b06e',
        wall: '#6c5a4e',
        wallTop: '#8c7666',
        wallEdge: '#c5b19c',
        bush: '#56723a',
        bushDark: '#40582b',
        bushGlow: '#7eab52',
        water: '#4f7a88',
        waterShallow: '#82b6c0',
        accent: '#f0c36a',
        shadow: 'rgba(60, 40, 20, 0.24)',
        decorationStyle: 'dunes',
    }),
    maze: buildTheme({
        ground: '#5f5a4f',
        groundDark: '#4f4a40',
        detail: '#8b8577',
        wall: '#38414b',
        wallTop: '#566272',
        wallEdge: '#8e9aaa',
        bush: '#4f6734',
        bushDark: '#364723',
        bushGlow: '#8db763',
        water: '#53697c',
        waterShallow: '#89a7be',
        accent: '#d7d2c2',
        shadow: 'rgba(20, 24, 30, 0.28)',
        decorationStyle: 'grid',
    }),
    river: buildTheme({
        ground: '#6e8b45',
        groundDark: '#5e793b',
        detail: '#9ec768',
        wall: '#5c4f43',
        wallTop: '#7a6857',
        wallEdge: '#c1a68b',
        bush: '#3f6a2f',
        bushDark: '#29451f',
        bushGlow: '#79bc5f',
        water: '#2d82c4',
        waterShallow: '#7fd3f4',
        accent: '#d8f0ff',
        shadow: 'rgba(10, 35, 60, 0.22)',
        decorationStyle: 'canals',
    }),
    crossfire: buildTheme({
        ground: '#58606b',
        groundDark: '#4a515b',
        detail: '#8794a3',
        wall: '#2f3640',
        wallTop: '#4d5967',
        wallEdge: '#9fb0c2',
        bush: '#2f6b4f',
        bushDark: '#1f4a36',
        bushGlow: '#5fb98a',
        water: '#2f6f8f',
        waterShallow: '#79c0d9',
        accent: '#ff9f5a',
        shadow: 'rgba(15, 22, 30, 0.3)',
        decorationStyle: 'slabs',
    }),
    fortress: buildTheme({
        ground: '#82735d',
        groundDark: '#6c5f4d',
        detail: '#baa98a',
        wall: '#4b4037',
        wallTop: '#67584d',
        wallEdge: '#b9a189',
        bush: '#586b40',
        bushDark: '#39462a',
        bushGlow: '#88a760',
        water: '#54687d',
        waterShallow: '#91b4d1',
        accent: '#ffd27a',
        shadow: 'rgba(25, 20, 15, 0.28)',
        decorationStyle: 'slabs',
    }),
};

function createOpenMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[4, 2], [19, 2], [35, 2]],
        [[4, 28], [20, 28], [35, 28]]
    );

    drawHorizontalLine(tiles, 7, 6, 33, D, [13, 20, 27]);
    drawHorizontalLine(tiles, 23, 6, 33, D, [12, 19, 26]);
    paintRect(tiles, 10, 10, 12, 13, B);
    paintRect(tiles, 27, 10, 29, 13, B);
    paintRect(tiles, 10, 17, 12, 20, B);
    paintRect(tiles, 27, 17, 29, 20, B);
    paintRect(tiles, 16, 11, 17, 19, W);
    paintRect(tiles, 22, 11, 23, 19, W);
    paintRect(tiles, 18, 9, 21, 10, D);
    paintRect(tiles, 18, 20, 21, 21, D);
    paintRect(tiles, 4, 12, 6, 18, B);
    paintRect(tiles, 33, 12, 35, 18, B);
    // Three broad spawn exits and four open approaches to the center.
    for (const [left, right] of [[11, 14], [18, 21], [25, 28]]) {
        clearRect(tiles, left, 7, right, 7);
    }
    clearRect(tiles, 18, 9, 21, 10);
    clearRect(tiles, 16, 14, 23, 16);
    // Short flank cover breaks long firing lanes without sealing them.
    paintRect(tiles, 7, 10, 8, 11, D);
    paintRect(tiles, 31, 10, 32, 11, D);
    clearRect(tiles, 18, 14, 21, 16);

    return {
        id: 'open',
        name: 'Sunset Flats',
        description: '네 방향으로 열린 중앙 광장과 세 갈래 진입로. 측면 엄폐를 타고 합류하거나 긴 시야로 접근을 견제하세요.',
        theme: THEMES.open,
        tiles: mirrorTeamHalves(tiles),
    };
}

function createMazeMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[5, 2], [19, 2], [34, 2]],
        [[5, 28], [20, 28], [34, 28]]
    );

    // Offset islands create rotations, with wide crosscuts instead of one-tile doors.
    for (const [left, top, right, bottom] of [
        [8, 5, 9, 10], [14, 8, 15, 13],
        [24, 8, 25, 13], [30, 5, 31, 10],
    ]) paintRect(tiles, left, top, right, bottom, W);
    paintRect(tiles, 17, 6, 22, 7, D);
    paintRect(tiles, 4, 13, 9, 14, D);
    paintRect(tiles, 30, 13, 35, 14, D);
    paintRect(tiles, 11, 9, 12, 12, B);
    paintRect(tiles, 27, 9, 28, 12, B);
    paintRect(tiles, 16, 13, 17, 14, B);
    paintRect(tiles, 22, 13, 23, 14, B);
    clearRect(tiles, 18, 14, 21, 16);

    return {
        id: 'maze',
        name: 'Switchback',
        description: '엇갈린 엄폐 섬 사이의 넓은 교차로. 정면 사격을 피하면서 옆길로 회전해 아군과 교차 사격을 만드세요.',
        theme: THEMES.maze,
        tiles: mirrorTeamHalves(tiles),
    };
}

function createRiverMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[4, 2], [19, 2], [35, 2]],
        [[4, 28], [20, 28], [35, 28]]
    );

    paintRect(tiles, 1, 10, 38, 12, WA);
    paintRect(tiles, 1, 18, 38, 20, WA);
    clearRect(tiles, 6, 10, 9, 12);
    clearRect(tiles, 16, 10, 23, 12);
    clearRect(tiles, 30, 10, 33, 12);
    clearRect(tiles, 8, 18, 11, 20);
    clearRect(tiles, 16, 18, 23, 20);
    clearRect(tiles, 28, 18, 31, 20);
    paintRect(tiles, 14, 13, 16, 17, B);
    paintRect(tiles, 23, 13, 25, 17, B);
    paintRect(tiles, 18, 8, 21, 9, D);
    paintRect(tiles, 18, 21, 21, 22, D);
    paintRect(tiles, 4, 6, 7, 8, B);
    paintRect(tiles, 32, 6, 35, 8, B);
    paintRect(tiles, 5, 22, 8, 24, B);
    paintRect(tiles, 31, 22, 34, 24, B);
    // Partial bridge-head cover leaves both a firing lane and a sheltered entry.
    paintRect(tiles, 17, 8, 18, 9, D);
    clearRect(tiles, 19, 8, 22, 9);
    paintRect(tiles, 5, 8, 6, 9, D);
    paintRect(tiles, 33, 8, 34, 9, D);
    clearRect(tiles, 18, 14, 21, 16);

    return {
        id: 'river',
        name: 'Twin Canals',
        description: '중앙의 넓은 다리와 양옆 우회 다리. 물 위로 탄환은 통과하므로 교두보 엄폐를 활용해 건널 타이밍을 잡으세요.',
        theme: THEMES.river,
        tiles: mirrorTeamHalves(tiles),
    };
}

function createCrossfireMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[4, 2], [19, 2], [35, 2]],
        [[4, 28], [20, 28], [35, 28]]
    );

    // Flank ponds: bullets cross water, so they make sniping lanes but block walking.
    paintRect(tiles, 7, 9, 11, 12, WA);
    paintRect(tiles, 28, 9, 32, 12, WA);
    // Destructible cover on the pond edges lets flankers open or close sightlines.
    paintRect(tiles, 7, 13, 8, 14, D);
    paintRect(tiles, 31, 13, 32, 14, D);
    // Walls frame the central ambush pocket while leaving all four sides open.
    paintRect(tiles, 15, 11, 16, 12, W);
    paintRect(tiles, 23, 11, 24, 12, W);
    paintRect(tiles, 15, 15, 16, 15, W);
    paintRect(tiles, 23, 15, 24, 15, W);
    // A bush pocket on the midline rewards control of the middle.
    paintRect(tiles, 18, 14, 21, 15, B);
    // Lane bushes let teams hide a flank approach before the pond bridges.
    paintRect(tiles, 13, 5, 14, 8, B);
    paintRect(tiles, 25, 5, 26, 8, B);
    paintRect(tiles, 3, 9, 5, 12, B);
    paintRect(tiles, 34, 9, 36, 12, B);
    // Destructible shields guard each spawn exit.
    paintRect(tiles, 9, 5, 10, 6, D);
    paintRect(tiles, 29, 5, 30, 6, D);
    paintRect(tiles, 18, 6, 21, 6, D);
    clearRect(tiles, 19, 6, 20, 6);
    // Keep the center and its approaches usable for every route.
    clearRect(tiles, 17, 9, 22, 13);
    clearRect(tiles, 12, 14, 17, 14);
    clearRect(tiles, 22, 14, 27, 14);

    return {
        id: 'crossfire',
        name: 'Crossfire Basin',
        description: '물웅덩이 너머로 시선이 열린 측면과 중앙의 풀숲 매복 지대. 측면에서 견제하고 중앙을 장악해 교차 사격을 만드세요.',
        theme: THEMES.crossfire,
        tiles: mirrorTeamHalves(tiles),
    };
}

function createFortressMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[4, 2], [11, 2], [28, 2], [35, 2]],
        [[4, 28], [12, 28], [27, 28], [35, 28]]
    );

    paintRect(tiles, 12, 8, 27, 22, D);
    clearRect(tiles, 15, 11, 24, 19);
    paintRect(tiles, 16, 12, 23, 18, W);
    clearRect(tiles, 18, 14, 21, 16);
    clearRect(tiles, 18, 14, 21, 16);
    clearRect(tiles, 18, 12, 21, 13);
    clearRect(tiles, 18, 17, 21, 18);
    clearRect(tiles, 14, 14, 15, 16);
    clearRect(tiles, 24, 14, 25, 16);
    paintRect(tiles, 4, 10, 7, 13, B);
    paintRect(tiles, 32, 10, 35, 13, B);
    paintRect(tiles, 4, 17, 7, 20, B);
    paintRect(tiles, 32, 17, 35, 20, B);
    paintRect(tiles, 9, 9, 10, 21, W);
    paintRect(tiles, 29, 9, 30, 21, W);
    clearRect(tiles, 9, 13, 10, 16);
    clearRect(tiles, 29, 14, 30, 17);
    paintRect(tiles, 18, 6, 21, 7, D);
    paintRect(tiles, 18, 23, 21, 24, D);

    // Open four gates through BOTH rings; breaking walls only creates shortcuts.
    clearRect(tiles, 18, 8, 21, 13);
    clearRect(tiles, 12, 14, 17, 16);
    clearRect(tiles, 22, 14, 27, 16);
    clearRect(tiles, 19, 6, 20, 7);

    return {
        id: 'fortress',
        name: 'Citadel Ring',
        description: '처음부터 열린 네 방향 성문과 파괴 가능한 외곽 성벽. 성문을 견제하거나 벽을 부숴 새로운 공격 각도를 만드세요.',
        theme: THEMES.fortress,
        tiles: mirrorTeamHalves(tiles),
    };
}

const MAP_OPEN = createOpenMap();
const MAP_MAZE = createMazeMap();
const MAP_RIVER = createRiverMap();
const MAP_CROSSFIRE = createCrossfireMap();
const MAP_FORTRESS = createFortressMap();

export const MAPS = {
    [MAP_OPEN.id]: MAP_OPEN,
    [MAP_MAZE.id]: MAP_MAZE,
    [MAP_RIVER.id]: MAP_RIVER,
    [MAP_CROSSFIRE.id]: MAP_CROSSFIRE,
    [MAP_FORTRESS.id]: MAP_FORTRESS,
};

export const DEFAULT_MAP = MAP_OPEN;
