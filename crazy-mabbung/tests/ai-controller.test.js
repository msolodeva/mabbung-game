import test from 'node:test';
import assert from 'node:assert/strict';

import { AIController } from '../src/managers/AIController.js';

const TILE_SIZE = 64;

function createPlayer(col, row, overrides = {}) {
    return {
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2,
        tileSize: TILE_SIZE,
        speed: 150,
        state: 'NORMAL',
        team: 1,
        bombRange: 3,
        maxBombs: 1,
        activeBombs: 0,
        controls: {
            up: 'up',
            down: 'down',
            left: 'left',
            right: 'right',
            bomb: 'bomb'
        },
        ...overrides
    };
}

function createGrid(cols, rows, solidTiles = new Set(), breakableTiles = new Set()) {
    const data = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (solidTiles.has(`${c},${r}`)) row.push(1);
            else if (breakableTiles.has(`${c},${r}`)) row.push(2);
            else row.push(0);
        }
        data.push(row);
    }
    return data;
}

function createController(options = []) {
    const config = Array.isArray(options) ? { otherPlayers: options } : options;
    const player = config.player ?? createPlayer(1, 1);
    const cols = config.cols ?? 9;
    const rows = config.rows ?? 7;
    const data = config.data ?? createGrid(
        cols,
        rows,
        config.solidTiles ?? new Set(),
        config.breakableTiles ?? new Set()
    );
    const game = {
        players: [player, ...(config.otherPlayers ?? [])],
        map: {
            cols,
            rows,
            data,
            isSolid: (col, row) => {
                if (col < 0 || col >= cols || row < 0 || row >= rows) return true;
                return data[row][col] !== 0;
            }
        },
        items: config.items ?? [],
        bombs: config.bombs ?? []
    };

    const dangerMap = {
        isDangerous: () => false,
        findSafePath: () => null,
        simulateBombForTeam: () => true,
        dangerGrid: [],
        ...(config.dangerMap ?? {})
    };

    return new AIController(player, game, dangerMap);
}

test('AI blocks the tile actually occupied by another normal player', () => {
    const other = createPlayer(3, 4, { team: 2 });
    const controller = createController([other]);

    assert.equal(controller.isBlockedByPlayer(3, 4), true);
});

test('AI does not block the tile diagonally offset from another player center', () => {
    const other = createPlayer(3, 4, { team: 2 });
    const controller = createController([other]);

    assert.equal(controller.isBlockedByPlayer(4, 5), false);
});

test('AI does not bomb an enemy behind blocking terrain', () => {
    const player = createPlayer(2, 2, { bombRange: 4 });
    const enemy = createPlayer(4, 2, { team: 2 });
    const controller = createController({
        player,
        otherPlayers: [enemy],
        solidTiles: new Set(['3,2'])
    });

    assert.equal(controller.shouldPlaceBomb(), false);
});

test('AI still bombs an enemy on a clear blast line with a safe escape', () => {
    const player = createPlayer(2, 2, { bombRange: 4 });
    const enemy = createPlayer(4, 2, { team: 2 });
    const controller = createController({
        player,
        otherPlayers: [enemy]
    });

    assert.equal(controller.shouldPlaceBomb(), true);
});

test('AI chooses a reachable item instead of the nearest blocked item', () => {
    const controller = createController({
        player: createPlayer(1, 1),
        solidTiles: new Set(['2,1', '3,2', '4,1']),
        items: [
            { col: 3, row: 1, type: 'range' },
            { col: 1, row: 3, type: 'speed' }
        ]
    });

    assert.equal(typeof controller.findBestItemTarget, 'function');

    const target = controller.findBestItemTarget(1, 1);

    assert.deepEqual(
        { col: target.item.col, row: target.item.row, nextMove: target.nextMove },
        { col: 1, row: 3, nextMove: 'down' }
    );
});

test('AI plans for a bomb lane instead of walking onto a normal enemy', () => {
    const enemy = createPlayer(4, 3, { team: 2 });
    const controller = createController({
        player: createPlayer(1, 1, { bombRange: 3 }),
        otherPlayers: [enemy]
    });

    assert.equal(typeof controller.findBestAttackPlan, 'function');
    assert.equal(typeof controller.hasClearBlastLine, 'function');

    const plan = controller.findBestAttackPlan(1, 1, enemy);

    assert.ok(plan);
    assert.notDeepEqual({ col: plan.targetCol, row: plan.targetRow }, { col: 4, row: 3 });
    assert.equal(controller.hasClearBlastLine(plan.targetCol, plan.targetRow, 4, 3, 3), true);
});
