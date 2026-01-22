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

        // Draw ground first
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const x = col * this.tileSize;
                const y = row * this.tileSize;
                const tile = this.getTile(col, row);

                this.renderTile(ctx, x, y, tile, col, row);
            }
        }
    }

    renderTile(ctx, x, y, tile, col, row) {
        const size = this.tileSize;

        switch (tile) {
            case TILE_TYPES.GROUND:
            case TILE_TYPES.SPAWN_BLUE:
            case TILE_TYPES.SPAWN_RED:
            case TILE_TYPES.GEM_SPAWN:
                // Grass pattern
                ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.GROUND : COLORS.GROUND_DARK;
                ctx.fillRect(x, y, size, size);

                // Grass detail
                if (Math.random() > 0.7) {
                    ctx.fillStyle = '#5c8a2e';
                    ctx.fillRect(x + size * 0.3, y + size * 0.3, 3, 3);
                }

                // Spawn zone indicator
                if (tile === TILE_TYPES.SPAWN_BLUE) {
                    ctx.fillStyle = 'rgba(74, 144, 217, 0.2)';
                    ctx.fillRect(x, y, size, size);
                } else if (tile === TILE_TYPES.SPAWN_RED) {
                    ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
                    ctx.fillRect(x, y, size, size);
                } else if (tile === TILE_TYPES.GEM_SPAWN) {
                    // Modern Gem Mine Look
                    ctx.fillStyle = '#2c3e50';
                    ctx.beginPath();
                    ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 8);
                    ctx.fill();

                    // Pulsing Glow for Spawn point
                    const glowPulse = 0.5 + Math.sin(performance.now() * 0.003) * 0.5;
                    ctx.strokeStyle = `rgba(155, 89, 182, ${0.4 + glowPulse * 0.4})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                    ctx.fill();
                }
                break;

            case TILE_TYPES.WALL:
                // Solid wall base
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(x, y, size, size);
                // Top highlight
                ctx.fillStyle = COLORS.WALL_TOP;
                ctx.fillRect(x, y, size, size * 0.4);
                // Border
                ctx.strokeStyle = '#4a3c2a';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
                break;

            case TILE_TYPES.BUSH:
                // Ground underneath
                ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.GROUND : COLORS.GROUND_DARK;
                ctx.fillRect(x, y, size, size);
                // Bush overlay
                ctx.fillStyle = COLORS.BUSH;
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size * 0.45, 0, Math.PI * 2);
                ctx.fill();
                // Bush detail
                ctx.fillStyle = COLORS.BUSH_DARK;
                ctx.beginPath();
                ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + size * 0.65, y + size * 0.55, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;

            case TILE_TYPES.DESTRUCTIBLE:
                // Destructible wall
                const health = this.destructibleHealth[`${col},${row}`] || 2000;
                const healthPercent = health / 2000;

                ctx.fillStyle = COLORS.DESTRUCTIBLE;
                ctx.fillRect(x, y, size, size);
                // Damage cracks
                if (healthPercent < 0.5) {
                    ctx.strokeStyle = '#5d4037';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 5, y + 5);
                    ctx.lineTo(x + size - 10, y + size - 10);
                    ctx.stroke();
                }
                // Border
                ctx.strokeStyle = '#6d5545';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
                break;
        }
    }
}
