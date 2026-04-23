// ========================================
// MAP DATA - Curated Gem Grab Arenas
// ========================================

import { TILE_TYPES } from '../utils/constants.js';

const G = TILE_TYPES.GROUND;
const W = TILE_TYPES.WALL;
const B = TILE_TYPES.BUSH;
const D = TILE_TYPES.DESTRUCTIBLE;
const SB = TILE_TYPES.SPAWN_BLUE;
const SR = TILE_TYPES.SPAWN_RED;
const GS = TILE_TYPES.GEM_SPAWN;
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

function addGemCluster(tiles, left, top, width, height) {
    for (let row = top; row < top + height; row++) {
        for (let col = left; col < left + width; col++) {
            tiles[row][col] = GS;
        }
    }
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
    bush: buildTheme({
        ground: '#6a7a38',
        groundDark: '#59672f',
        detail: '#a7c75b',
        wall: '#705648',
        wallTop: '#977563',
        wallEdge: '#d6b59c',
        bush: '#244f1f',
        bushDark: '#173314',
        bushGlow: '#4f8a3d',
        water: '#4c6d4e',
        waterShallow: '#87b084',
        accent: '#d7f27a',
        shadow: 'rgba(15, 35, 10, 0.24)',
        decorationStyle: 'garden',
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
    addGemCluster(tiles, 18, 13, 4, 4);

    return {
        id: 'open',
        name: 'Sunset Flats',
        description: '긴 시야와 얇은 엄폐가 교차하는 기본형 맵으로, 중앙 장악과 양옆 포켓 압박을 동시에 요구합니다.',
        theme: THEMES.open,
        tiles,
    };
}

function createMazeMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[5, 2], [19, 2], [34, 2]],
        [[5, 28], [20, 28], [34, 28]]
    );

    [8, 14, 20, 26, 32].forEach((col, index) => {
        drawVerticalLine(tiles, col, 4, 26, W, index % 2 === 0 ? [8, 15, 22] : [11, 18, 24]);
    });
    [11, 17, 23, 29].forEach((row, index) => {
        drawHorizontalLine(tiles, row, 4, 35, D, index % 2 === 0 ? [10, 18, 27] : [7, 15, 24, 32]);
    });
    paintRect(tiles, 17, 12, 22, 18, G);
    paintRect(tiles, 16, 13, 23, 17, B);
    clearRect(tiles, 18, 13, 21, 17);
    addGemCluster(tiles, 18, 14, 4, 2);
    paintRect(tiles, 3, 6, 5, 9, B);
    paintRect(tiles, 34, 21, 36, 24, B);
    paintRect(tiles, 4, 21, 6, 24, B);
    paintRect(tiles, 33, 6, 35, 9, B);

    return {
        id: 'maze',
        name: 'Switchback',
        description: '굽이치는 차단벽과 엇갈린 문이 계속 진로를 바꾸게 만들어, 한타보다 회전과 합류 타이밍이 더 중요합니다.',
        theme: THEMES.maze,
        tiles,
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
    paintRect(tiles, 18, 13, 21, 17, GS);

    return {
        id: 'river',
        name: 'Twin Canals',
        description: '두 줄의 수로와 시차 브리지가 시야전과 회전전을 동시에 만들며, 어느 다리에서 건널지 선택이 계속 갈립니다.',
        theme: THEMES.river,
        tiles,
    };
}

function createBushMap() {
    const tiles = createEmptyArena();

    addSpawnRows(
        tiles,
        [[4, 2], [19, 2], [35, 2]],
        [[4, 28], [20, 28], [35, 28]]
    );

    paintRect(tiles, 2, 4, 11, 10, B);
    paintRect(tiles, 28, 4, 37, 10, B);
    paintRect(tiles, 2, 20, 11, 26, B);
    paintRect(tiles, 28, 20, 37, 26, B);
    clearRect(tiles, 5, 6, 8, 8);
    clearRect(tiles, 31, 6, 34, 8);
    clearRect(tiles, 5, 22, 8, 24);
    clearRect(tiles, 31, 22, 34, 24);
    paintRect(tiles, 15, 11, 24, 19, B);
    clearRect(tiles, 17, 13, 22, 17);
    paintRect(tiles, 13, 14, 14, 16, D);
    paintRect(tiles, 25, 14, 26, 16, D);
    paintRect(tiles, 17, 10, 22, 11, W);
    paintRect(tiles, 17, 19, 22, 20, W);
    paintRect(tiles, 12, 5, 14, 8, D);
    paintRect(tiles, 25, 5, 27, 8, D);
    paintRect(tiles, 12, 22, 14, 25, D);
    paintRect(tiles, 25, 22, 27, 25, D);
    addGemCluster(tiles, 18, 14, 4, 2);

    return {
        id: 'bush',
        name: 'Thorn Garden',
        description: '풀숲이 대부분을 덮지만 중앙은 비어 있어, 매복과 시야 체크를 반복하면서도 한 번의 돌파 각이 크게 열립니다.',
        theme: THEMES.bush,
        tiles,
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
    addGemCluster(tiles, 18, 14, 4, 3);
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

    return {
        id: 'fortress',
        name: 'Citadel Ring',
        description: '파괴 가능한 외곽 성벽과 네 방향 돌입문이 있어, 포지션을 잡아도 벽이 무너지면 전장이 즉시 다시 열립니다.',
        theme: THEMES.fortress,
        tiles,
    };
}

const MAP_OPEN = createOpenMap();
const MAP_MAZE = createMazeMap();
const MAP_RIVER = createRiverMap();
const MAP_BUSH = createBushMap();
const MAP_FORTRESS = createFortressMap();

export const MAPS = {
    [MAP_OPEN.id]: MAP_OPEN,
    [MAP_MAZE.id]: MAP_MAZE,
    [MAP_RIVER.id]: MAP_RIVER,
    [MAP_BUSH.id]: MAP_BUSH,
    [MAP_FORTRESS.id]: MAP_FORTRESS,
};

export const GEM_GRAB_MAP = MAP_OPEN;
