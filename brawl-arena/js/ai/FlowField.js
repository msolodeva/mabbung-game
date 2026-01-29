// ========================================
// FLOW FIELD - Pre-computed Navigation
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { TILE_TYPES, GAME_CONFIG } from '../utils/constants.js';

/**
 * FlowField provides pre-computed navigation directions for AI.
 * Instead of calculating paths at runtime, the AI looks up the 
 * optimal direction from any tile to reach the destination.
 */
export class FlowField {
    constructor(map) {
        this.map = map;
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.cols = map.cols;
        this.rows = map.rows;

        // Cache of flow fields by destination key
        this.fieldCache = new Map();
        this.maxCacheSize = 20; // LRU 캐시 크기 제한
        this.cacheOrder = []; // 캐시 접근 순서 추적
    }

    /**
     * Generate or retrieve a flow field for a destination.
     * @param {string} key - Cache key (e.g., "center", "gem_5_8")
     * @param {number} targetX - World X coordinate
     * @param {number} targetY - World Y coordinate
     * @returns {Int8Array[][]} 2D array of direction indices
     */
    getOrCreateField(key, targetX, targetY) {
        if (this.fieldCache.has(key)) {
            // LRU: 최근 사용으로 이동
            this.cacheOrder = this.cacheOrder.filter(k => k !== key);
            this.cacheOrder.push(key);
            return this.fieldCache.get(key);
        }

        const field = this.generateField(targetX, targetY);

        // LRU 캐시 정리
        if (this.fieldCache.size >= this.maxCacheSize) {
            const oldestKey = this.cacheOrder.shift();
            if (oldestKey && !oldestKey.startsWith('spawn_') && oldestKey !== 'center') {
                this.fieldCache.delete(oldestKey);
            }
        }

        this.fieldCache.set(key, field);
        this.cacheOrder.push(key);
        return field;
    }

    /**
     * Generate a flow field using BFS from the target.
     * Each cell stores the direction to move towards the target.
     */
    generateField(targetWorldX, targetWorldY) {
        const targetCol = Math.floor(targetWorldX / this.tileSize);
        const targetRow = Math.floor(targetWorldY / this.tileSize);

        // Direction vectors: 0=none, 1-8 = 8 directions
        // We'll store dx, dy pairs encoded as index
        const directions = [
            { dx: 0, dy: 0 },   // 0: at target
            { dx: 1, dy: 0 },   // 1: right
            { dx: -1, dy: 0 },  // 2: left
            { dx: 0, dy: 1 },   // 3: down
            { dx: 0, dy: -1 },  // 4: up
            { dx: 1, dy: 1 },   // 5: down-right
            { dx: -1, dy: 1 },  // 6: down-left
            { dx: 1, dy: -1 },  // 7: up-right
            { dx: -1, dy: -1 }, // 8: up-left
        ];

        // Initialize arrays
        const costField = [];
        const directionField = [];
        for (let row = 0; row < this.rows; row++) {
            costField[row] = new Array(this.cols).fill(Infinity);
            directionField[row] = new Array(this.cols).fill(-1); // -1 = unreachable
        }

        // BFS from target
        const queue = [];

        // Handle target in wall - find nearest walkable
        let actualTarget = { col: targetCol, row: targetRow };
        if (!this.isWalkable(targetCol, targetRow)) {
            actualTarget = this.findNearestWalkable(targetCol, targetRow);
            if (!actualTarget) {
                return directionField; // Can't reach, return empty field
            }
        }

        queue.push({ col: actualTarget.col, row: actualTarget.row, cost: 0 });
        costField[actualTarget.row][actualTarget.col] = 0;
        directionField[actualTarget.row][actualTarget.col] = 0; // At target

        while (queue.length > 0) {
            const current = queue.shift();

            // Check all 8 neighbors
            for (let i = 1; i <= 8; i++) {
                const dir = directions[i];
                const newCol = current.col + dir.dx;
                const newRow = current.row + dir.dy;

                if (!this.isWalkable(newCol, newRow)) continue;

                // Diagonal movement cost is slightly higher
                const moveCost = (Math.abs(dir.dx) + Math.abs(dir.dy) === 2) ? 1.414 : 1;
                const newCost = current.cost + moveCost;

                if (newCost < costField[newRow][newCol]) {
                    costField[newRow][newCol] = newCost;

                    // Direction points TOWARDS the target (opposite of movement from target)
                    // Find direction index that points from newCol,newRow to current.col,current.row
                    const pointDx = current.col - newCol;
                    const pointDy = current.row - newRow;
                    directionField[newRow][newCol] = this.getDirectionIndex(pointDx, pointDy, directions);

                    queue.push({ col: newCol, row: newRow, cost: newCost });
                }
            }
        }

        return directionField;
    }

    /**
     * Get the direction index for a dx, dy pair
     */
    getDirectionIndex(dx, dy, directions) {
        for (let i = 0; i < directions.length; i++) {
            if (directions[i].dx === dx && directions[i].dy === dy) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Get the movement direction at a world position.
     * @returns {Vector2} Normalized direction vector
     */
    getDirection(fieldKey, worldX, worldY, targetX, targetY) {
        const field = this.getOrCreateField(fieldKey, targetX, targetY);

        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);

        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return new Vector2(0, 0);
        }

        const dirIndex = field[row][col];

        if (dirIndex <= 0) {
            // At target (0) or unreachable (-1)
            if (dirIndex === 0) {
                // At target - move directly towards exact position
                const toTarget = new Vector2(targetX - worldX, targetY - worldY);
                return toTarget.magnitude() > 0 ? toTarget.normalize() : new Vector2(0, 0);
            }

            // Unreachable - find a walkable neighbor that IS reachable
            // This helps AI navigate around water/obstacles to find bridges
            const directions = [
                { dx: 1, dy: 0 },   // right
                { dx: -1, dy: 0 },  // left
                { dx: 0, dy: 1 },   // down
                { dx: 0, dy: -1 },  // up
                { dx: 1, dy: 1 },   // down-right
                { dx: -1, dy: 1 },  // down-left
                { dx: 1, dy: -1 },  // up-right
                { dx: -1, dy: -1 }, // up-left
            ];

            let bestDir = null;
            let bestCost = Infinity;

            for (const dir of directions) {
                const neighborCol = col + dir.dx;
                const neighborRow = row + dir.dy;

                if (neighborRow < 0 || neighborRow >= this.rows ||
                    neighborCol < 0 || neighborCol >= this.cols) continue;

                const neighborDirIndex = field[neighborRow][neighborCol];

                // If neighbor is reachable (has a valid direction), go towards it
                if (neighborDirIndex > 0 && this.isWalkable(neighborCol, neighborRow)) {
                    // Estimate cost based on distance to target
                    const neighborCenterX = neighborCol * this.tileSize + this.tileSize / 2;
                    const neighborCenterY = neighborRow * this.tileSize + this.tileSize / 2;
                    const cost = Math.hypot(targetX - neighborCenterX, targetY - neighborCenterY);

                    if (cost < bestCost) {
                        bestCost = cost;
                        bestDir = new Vector2(dir.dx, dir.dy).normalize();
                    }
                }
            }

            if (bestDir) {
                return bestDir;
            }

            // Last resort: move directly (will likely hit obstacle)
            const toTarget = new Vector2(targetX - worldX, targetY - worldY);
            return toTarget.magnitude() > 0 ? toTarget.normalize() : new Vector2(0, 0);
        }

        // Convert direction index to vector
        const dirVectors = [
            new Vector2(0, 0),    // 0
            new Vector2(1, 0),    // 1: right
            new Vector2(-1, 0),   // 2: left
            new Vector2(0, 1),    // 3: down
            new Vector2(0, -1),   // 4: up
            new Vector2(1, 1).normalize(),    // 5: down-right
            new Vector2(-1, 1).normalize(),   // 6: down-left
            new Vector2(1, -1).normalize(),   // 7: up-right
            new Vector2(-1, -1).normalize(),  // 8: up-left
        ];

        return dirVectors[dirIndex] || new Vector2(0, 0);
    }

    isWalkable(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return false;
        }
        const tile = this.map.getTile(col, row);
        // 벽, 파괴 가능 벽, 물은 걸을 수 없음
        return tile !== TILE_TYPES.WALL &&
            tile !== TILE_TYPES.DESTRUCTIBLE &&
            tile !== TILE_TYPES.WATER;
    }

    findNearestWalkable(col, row) {
        for (let r = 1; r <= 5; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) === r || Math.abs(dy) === r) {
                        if (this.isWalkable(col + dx, row + dy)) {
                            return { col: col + dx, row: row + dy };
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Clear the cache (call when map changes, e.g., wall destroyed)
     */
    clearCache() {
        this.fieldCache.clear();
        this.cacheOrder = [];
        // 맵 변경 후 기본 필드 재생성
        this.pregenerate();
    }

    /**
     * Pre-generate common flow fields at map load
     */
    pregenerate() {
        // Generate field for map center (gem area)
        const centerX = this.map.width / 2;
        const centerY = this.map.height / 2;
        this.getOrCreateField('center', centerX, centerY);

        // Generate fields for spawn areas
        if (this.map.spawnPoints) {
            if (this.map.spawnPoints.blue && this.map.spawnPoints.blue.length > 0) {
                const spawn = this.map.spawnPoints.blue[0];
                const spawnX = spawn.x * this.tileSize + this.tileSize / 2;
                const spawnY = spawn.y * this.tileSize + this.tileSize / 2;
                this.getOrCreateField('spawn_blue', spawnX, spawnY);
            }
            if (this.map.spawnPoints.red && this.map.spawnPoints.red.length > 0) {
                const spawn = this.map.spawnPoints.red[0];
                const spawnX = spawn.x * this.tileSize + this.tileSize / 2;
                const spawnY = spawn.y * this.tileSize + this.tileSize / 2;
                this.getOrCreateField('spawn_red', spawnX, spawnY);
            }
        }

        console.log('[FlowField] Pre-generated flow fields for center and spawns');
    }
}
