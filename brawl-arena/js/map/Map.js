// ========================================
// MAP - Game Map System
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { TILE_TYPES, COLORS, GAME_CONFIG, TEAMS } from '../utils/constants.js';
import { Gem } from '../entities/Gem.js';

export class GameMap {
    constructor(mapData) {
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.tiles = mapData.tiles;
        this.cols = this.tiles[0].length;
        this.rows = this.tiles.length;
        this.width = this.cols * this.tileSize;
        this.height = this.rows * this.tileSize;

        this.spawnPoints = {
            blue: mapData.spawnBlue || [],
            red: mapData.spawnRed || [],
        };
        this.gemSpawnPoints = mapData.gemSpawns || [];

        // Destructible wall health
        this.destructibleHealth = {};
        this.initDestructibles();
    }

    initDestructibles() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col] === TILE_TYPES.DESTRUCTIBLE) {
                    this.destructibleHealth[`${col},${row}`] = 2000;
                }
            }
        }
    }

    getTile(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return TILE_TYPES.WALL;
        }
        return this.tiles[row][col];
    }

    getTileAtPosition(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        const tileType = this.getTile(col, row);
        return {
            type: tileType,
            solid: tileType === TILE_TYPES.WALL || tileType === TILE_TYPES.DESTRUCTIBLE,
            bush: tileType === TILE_TYPES.BUSH,
        };
    }

    getTileCenter(col, row) {
        return new Vector2(
            col * this.tileSize + this.tileSize / 2,
            row * this.tileSize + this.tileSize / 2
        );
    }

    isPositionSolid(x, y) {
        const tile = this.getTileAtPosition(x, y);
        return tile.solid;
    }

    isPositionInBush(x, y) {
        const tile = this.getTileAtPosition(x, y);
        return tile.bush;
    }

    damageWallAtPosition(x, y, damage) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return false;
        }

        const key = `${col},${row}`;
        const tile = this.tiles[row][col];

        // Break regular walls if damage is high enough (Super ability)
        if (tile === TILE_TYPES.WALL && damage >= 4000) {
            this.tiles[row][col] = TILE_TYPES.GROUND;
            return true;
        }

        if (tile === TILE_TYPES.DESTRUCTIBLE) {
            this.destructibleHealth[key] -= damage;
            if (this.destructibleHealth[key] <= 0) {
                this.tiles[row][col] = TILE_TYPES.GROUND;
                delete this.destructibleHealth[key];
                return true;
            }
        }
        return false;
    }

    getSpawnPosition(team) {
        const spawns = team === TEAMS.BLUE ? this.spawnPoints.blue : this.spawnPoints.red;
        const spawn = spawns[Math.floor(Math.random() * spawns.length)];
        return this.getTileCenter(spawn.x, spawn.y);
    }

    getGemSpawnPosition() {
        if (this.gemSpawnPoints.length === 0) {
            return new Vector2(this.width / 2, this.height / 2);
        }
        const spawn = this.gemSpawnPoints[Math.floor(Math.random() * this.gemSpawnPoints.length)];
        return this.getTileCenter(spawn.x, spawn.y);
    }

    render(ctx, camera) {
        const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
        const endCol = Math.min(this.cols, Math.ceil((camera.x + camera.width) / this.tileSize));
        const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
        const endRow = Math.min(this.rows, Math.ceil((camera.y + camera.height) / this.tileSize));

        // 1. Draw ground first (background layer)
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const x = col * this.tileSize;
                const y = row * this.tileSize;
                const tile = this.getTile(col, row);

                // Always draw ground as base
                this.renderGround(ctx, x, y, col, row);

                if (tile === TILE_TYPES.WATER) {
                    this.renderWater(ctx, x, y, col, row);
                }
            }
        }

        // 2. Shadows Layer
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tile = this.getTile(col, row);
                if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.DESTRUCTIBLE) {
                    this.renderShadow(ctx, col * this.tileSize, row * this.tileSize);
                }
            }
        }

        // 3. Objects Layer (Walls, Bushes, Spawns)
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const x = col * this.tileSize;
                const y = row * this.tileSize;
                const tile = this.getTile(col, row);

                if (tile !== TILE_TYPES.GROUND && tile !== TILE_TYPES.WATER) {
                    this.renderTileObject(ctx, x, y, tile, col, row);
                }
            }
        }
    }

    renderGround(ctx, x, y, col, row) {
        const size = this.tileSize;
        // Subtle checkerboard base
        ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.GROUND : COLORS.GROUND_DARK;
        ctx.fillRect(x, y, size, size);

        // Deterministic noise for grass/props based on coordinates
        const seed = (col * 73 + row * 37);
        const rand = (s) => (Math.sin(s) * 10000) % 1;

        if (Math.abs(rand(seed)) > 0.8) {
            // Grass Tuff
            ctx.fillStyle = COLORS.GROUND_DETAIL;
            const tx = x + size * 0.2 + rand(seed + 1) * size * 0.5;
            const ty = y + size * 0.2 + rand(seed + 2) * size * 0.5;
            ctx.fillRect(tx, ty, 3, 6);
            ctx.fillRect(tx - 3, ty + 2, 3, 4);
        }

        if (Math.abs(rand(seed + 10)) > 0.96) {
            // Small Flower
            ctx.fillStyle = rand(seed) > 0 ? COLORS.FLOWER_YELLOW : COLORS.FLOWER_RED;
            const fx = x + size * 0.3 + rand(seed + 3) * size * 0.4;
            const fy = y + size * 0.3 + rand(seed + 4) * size * 0.4;
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderWater(ctx, x, y, col, row) {
        const size = this.tileSize;
        const time = performance.now() * 0.002;

        ctx.fillStyle = COLORS.WATER;
        ctx.fillRect(x, y, size, size);

        // Water ripples
        ctx.strokeStyle = COLORS.WATER_SHALLOW;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;

        const rippleOffset = (Math.sin(time + col + row) * 5);
        ctx.beginPath();
        ctx.moveTo(x + 5, y + size / 2 + rippleOffset);
        ctx.lineTo(x + size - 5, y + size / 2 - rippleOffset);
        ctx.stroke();

        ctx.globalAlpha = 1.0;
    }

    renderShadow(ctx, x, y) {
        ctx.fillStyle = COLORS.SHADOW;
        // Offset shadow for depth
        ctx.fillRect(x + 6, y + 6, this.tileSize, this.tileSize);
    }

    renderTileObject(ctx, x, y, tile, col, row) {
        const size = this.tileSize;

        switch (tile) {
            case TILE_TYPES.SPAWN_BLUE:
            case TILE_TYPES.SPAWN_RED:
            case TILE_TYPES.GEM_SPAWN:
                this.renderSpecialTile(ctx, x, y, tile, size);
                break;

            case TILE_TYPES.WALL:
                this.renderWall(ctx, x, y, size, COLORS.WALL, COLORS.WALL_TOP);
                break;

            case TILE_TYPES.DESTRUCTIBLE:
                const health = this.destructibleHealth[`${col},${row}`] || 2000;
                const healthPercent = health / 2000;
                this.renderWall(ctx, x, y, size, COLORS.DESTRUCTIBLE, COLORS.DESTRUCTIBLE_TOP);
                // Cracks if damaged
                if (healthPercent < 0.7) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y + 10);
                    ctx.lineTo(x + size - 10, y + size - 10);
                    if (healthPercent < 0.4) {
                        ctx.moveTo(x + size - 10, y + 10);
                        ctx.lineTo(x + 10, y + size - 10);
                    }
                    ctx.stroke();
                }
                break;

            case TILE_TYPES.BUSH:
                this.renderBush(ctx, x, y, size, col, row);
                break;
        }
    }

    renderWall(ctx, x, y, size, color, topColor) {
        // Base Side (Depth)
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // Top Face (Raised)
        ctx.fillStyle = topColor;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 10);

        // Edge Highlights
        ctx.strokeStyle = COLORS.WALL_EDGE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + size - 8);
        ctx.lineTo(x + 2, y + 2);
        ctx.lineTo(x + size - 2, y + 2);
        ctx.stroke();

        // Darker bottom edge
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + size - 8);
        ctx.lineTo(x + size - 2, y + size - 8);
        ctx.lineTo(x + size - 2, y + 2);
        ctx.stroke();
    }

    renderBush(ctx, x, y, size, col, row) {
        const time = performance.now() * 0.001;
        const sway = Math.sin(time + col) * 2;

        ctx.save();
        ctx.translate(sway, 0);

        // Large organic leafy look
        ctx.fillStyle = COLORS.BUSH;

        // Multiple overlapping circles for a "bushy" look
        const centers = [
            { rx: 0.3, ry: 0.3, r: 0.35 },
            { rx: 0.7, ry: 0.3, r: 0.35 },
            { rx: 0.5, ry: 0.6, r: 0.4 },
            { rx: 0.3, ry: 0.8, r: 0.3 },
            { rx: 0.7, ry: 0.8, r: 0.3 }
        ];

        centers.forEach(c => {
            ctx.beginPath();
            ctx.arc(x + size * c.rx, y + size * c.ry, size * c.r, 0, Math.PI * 2);
            ctx.fill();

            // Subtle highlight on each leaf bundle
            ctx.fillStyle = COLORS.BUSH_GLOW;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(x + size * c.rx - 2, y + size * c.ry - 2, size * c.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = COLORS.BUSH;
        });

        // Small dark details
        ctx.fillStyle = COLORS.BUSH_DARK;
        ctx.fillRect(x + size * 0.45, y + size * 0.45, 4, 4);

        ctx.restore();
    }

    renderSpecialTile(ctx, x, y, tile, size) {
        if (tile === TILE_TYPES.SPAWN_BLUE) {
            ctx.fillStyle = 'rgba(74, 144, 217, 0.3)';
            ctx.beginPath();
            ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 10);
            ctx.fill();
        } else if (tile === TILE_TYPES.SPAWN_RED) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.beginPath();
            ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 10);
            ctx.fill();
        } else if (tile === TILE_TYPES.GEM_SPAWN) {
            // Premium Gem Mine (Hole-style to avoid confusion with actual gem items)
            ctx.fillStyle = '#1a1a1a'; // Deep dark hole
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, size - 8, size - 8, 12);
            ctx.fill();

            // Inner crater look
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.roundRect(x + 10, y + 10, size - 20, size - 20, 8);
            ctx.fill();

            const glow = 0.6 + Math.sin(performance.now() * 0.004) * 0.4;
            ctx.strokeStyle = `rgba(155, 89, 182, ${glow})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Minimalist indicator instead of gem emoji
            ctx.fillStyle = `rgba(155, 89, 182, ${glow * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

}
