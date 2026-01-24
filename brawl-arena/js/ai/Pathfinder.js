// ========================================
// PATHFINDER - A* Algorithm for AI Navigation
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { TILE_TYPES, GAME_CONFIG } from '../utils/constants.js';

class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(item, priority) {
        this.elements.push({ item, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift()?.item;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

export class Pathfinder {
    constructor(map) {
        this.map = map;
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.pathCache = new Map();
        this.cacheTimeout = 500; // ms
    }

    // Convert world position to grid coordinates
    worldToGrid(pos) {
        return {
            x: Math.floor(pos.x / this.tileSize),
            y: Math.floor(pos.y / this.tileSize)
        };
    }

    // Convert grid coordinates to world position (center of tile)
    gridToWorld(gridX, gridY) {
        return new Vector2(
            gridX * this.tileSize + this.tileSize / 2,
            gridY * this.tileSize + this.tileSize / 2
        );
    }

    // Check if a grid cell is walkable
    isWalkable(x, y) {
        if (x < 0 || x >= this.map.cols || y < 0 || y >= this.map.rows) {
            return false;
        }
        const tile = this.map.getTile(x, y);
        return tile !== TILE_TYPES.WALL && tile !== TILE_TYPES.DESTRUCTIBLE;
    }

    // Get neighbors for A*
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 },  // Up
            { dx: 0, dy: 1 },   // Down
            { dx: -1, dy: 0 },  // Left
            { dx: 1, dy: 0 },   // Right
            // Diagonals (with corner check)
            { dx: -1, dy: -1 }, // Up-Left
            { dx: 1, dy: -1 },  // Up-Right
            { dx: -1, dy: 1 },  // Down-Left
            { dx: 1, dy: 1 },   // Down-Right
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (this.isWalkable(nx, ny)) {
                // For diagonals, check that both adjacent tiles are walkable
                if (Math.abs(dir.dx) + Math.abs(dir.dy) === 2) {
                    if (!this.isWalkable(x + dir.dx, y) || !this.isWalkable(x, y + dir.dy)) {
                        continue; // Can't cut corners
                    }
                }
                neighbors.push({ x: nx, y: ny });
            }
        }

        return neighbors;
    }

    // Heuristic: Octile distance (better for 8-directional movement)
    heuristic(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    }

    // A* pathfinding algorithm (Enhanced)
    findPath(startPos, endPos) {
        let startGrid = this.worldToGrid(startPos);
        const endGrid = this.worldToGrid(endPos);

        // Check cache
        const cacheKey = `${startGrid.x},${startGrid.y}-${endGrid.x},${endGrid.y}`;
        const cached = this.pathCache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.path;
        }

        // If start is not walkable, find nearest walkable position
        if (!this.isWalkable(startGrid.x, startGrid.y)) {
            const nearestStart = this.findNearestWalkable(startGrid.x, startGrid.y);
            if (nearestStart) {
                startGrid = nearestStart;
            } else {
                return []; // Completely stuck
            }
        }

        // If end is not walkable, find nearest walkable
        let adjustedEnd = { x: endGrid.x, y: endGrid.y };
        if (!this.isWalkable(endGrid.x, endGrid.y)) {
            const nearestEnd = this.findNearestWalkable(endGrid.x, endGrid.y);
            if (nearestEnd) {
                adjustedEnd = nearestEnd;
            } else {
                // Try to get as close as possible to end
                adjustedEnd = this.findClosestWalkableTowards(startGrid, endGrid);
                if (!adjustedEnd) {
                    return [];
                }
            }
        }

        const openSet = new PriorityQueue();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${startGrid.x},${startGrid.y}`;
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startGrid.x, startGrid.y, adjustedEnd.x, adjustedEnd.y));
        openSet.enqueue(startGrid, fScore.get(startKey));

        const closedSet = new Set();
        let iterations = 0;
        const maxIterations = 1000; // Prevent infinite loops

        while (!openSet.isEmpty() && iterations < maxIterations) {
            iterations++;
            const current = openSet.dequeue();
            const currentKey = `${current.x},${current.y}`;

            if (current.x === adjustedEnd.x && current.y === adjustedEnd.y) {
                // Reconstruct path
                const path = this.reconstructPath(cameFrom, current);
                const smoothedPath = this.smoothPath(path);
                this.pathCache.set(cacheKey, { path: smoothedPath, time: Date.now() });
                return smoothedPath;
            }

            closedSet.add(currentKey);

            for (const neighbor of this.getNeighbors(current.x, current.y)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (closedSet.has(neighborKey)) continue;

                // Calculate tentative gScore
                const moveCost = (neighbor.x !== current.x && neighbor.y !== current.y) ? Math.SQRT2 : 1;
                const tentativeG = (gScore.get(currentKey) || Infinity) + moveCost;

                if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor.x, neighbor.y, adjustedEnd.x, adjustedEnd.y));
                    openSet.enqueue(neighbor, fScore.get(neighborKey));
                }
            }
        }

        // No path found
        return [];
    }

    // Optimize path by removing unnecessary nodes
    smoothPath(path) {
        if (path.length <= 2) return path;

        const smoothedPath = [path[0]];
        let currentIdx = 0;

        while (currentIdx < path.length - 1) {
            let nextIdx = currentIdx + 1;

            // Look ahead as far as possible
            for (let i = path.length - 1; i > currentIdx + 1; i--) {
                if (this.lineOfSight(path[currentIdx], path[i])) {
                    nextIdx = i;
                    break;
                }
            }

            smoothedPath.push(path[nextIdx]);
            currentIdx = nextIdx;
        }

        return smoothedPath;
    }

    // Check if there is a clear line of sight between two points
    // Takes wall collision and brawler radius into account
    lineOfSight(start, end) {
        const x0 = start.x;
        const y0 = start.y;
        const x1 = end.x;
        const y1 = end.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        // Check every tile along the line
        while (true) {
            if (!this.isWalkable(x, y)) return false;

            // Also check adjacent tiles for clearance (simple radius check)
            // If moving diagonally, check both adjacent cardinal tiles
            if (x !== x0 || y !== y0) {
                // Expanded check for "fat" line of sight to prevent clipping corners
                // We simply check safely around the current tile
                if (!this.isWalkable(x + 1, y) && x < this.map.cols - 1) return false;
                if (!this.isWalkable(x - 1, y) && x > 0) return false;
                if (!this.isWalkable(x, y + 1) && y < this.map.rows - 1) return false;
                if (!this.isWalkable(x, y - 1) && y > 0) return false;
            }

            if (x === x1 && y === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return true;
    }

    findNearestWalkable(x, y) {
        const maxRadius = 8; // Increased search radius
        for (let r = 1; r <= maxRadius; r++) {
            // Spiral outward to find nearest walkable
            const candidates = [];
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) === r || Math.abs(dy) === r) {
                        if (this.isWalkable(x + dx, y + dy)) {
                            candidates.push({ x: x + dx, y: y + dy, dist: Math.sqrt(dx * dx + dy * dy) });
                        }
                    }
                }
            }
            // Return the closest one
            if (candidates.length > 0) {
                candidates.sort((a, b) => a.dist - b.dist);
                return { x: candidates[0].x, y: candidates[0].y };
            }
        }
        return null;
    }

    // Find walkable tile closest to end, moving from start direction
    findClosestWalkableTowards(startGrid, endGrid) {
        const dx = endGrid.x - startGrid.x;
        const dy = endGrid.y - startGrid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return startGrid;

        // Normalize direction
        const ndx = dx / dist;
        const ndy = dy / dist;

        // Walk towards end until we hit a non-walkable tile, then back up
        let lastWalkable = startGrid;

        for (let step = 1; step < dist; step++) {
            const checkX = Math.round(startGrid.x + ndx * step);
            const checkY = Math.round(startGrid.y + ndy * step);

            if (this.isWalkable(checkX, checkY)) {
                lastWalkable = { x: checkX, y: checkY };
            } else {
                break;
            }
        }

        return lastWalkable;
    }

    reconstructPath(cameFrom, current) {
        const path = [];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            path.unshift(this.gridToWorld(current.x, current.y));
            current = cameFrom.get(currentKey);
            currentKey = `${current.x},${current.y}`;
        }

        // Smooth the path to reduce waypoints
        return this.smoothPath(path);
    }

    smoothPath(path) {
        if (path.length <= 2) return path;

        const smoothed = [path[0]];
        let i = 0;

        while (i < path.length - 1) {
            // Try to skip ahead as far as possible with line-of-sight
            let furthest = i + 1;
            for (let j = i + 2; j < path.length; j++) {
                if (this.hasLineOfSight(path[i], path[j])) {
                    furthest = j;
                }
            }
            smoothed.push(path[furthest]);
            i = furthest;
        }

        return smoothed;
    }

    hasLineOfSight(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / (this.tileSize / 2));

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = from.x + dx * t;
            const y = from.y + dy * t;
            if (this.map.isPositionSolid(x, y)) {
                return false;
            }
        }
        return true;
    }

    clearCache() {
        this.pathCache.clear();
    }
}
