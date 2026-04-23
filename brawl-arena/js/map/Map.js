// ========================================
// MAP - Game Map System
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { TILE_TYPES, COLORS, GAME_CONFIG, TEAMS } from '../utils/constants.js';

export class GameMap {
    constructor(mapData) {
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.tiles = mapData.tiles;
        this.theme = mapData.theme || {};
        this.cols = this.tiles[0].length;
        this.rows = this.tiles.length;
        this.width = this.cols * this.tileSize;
        this.height = this.rows * this.tileSize;

        // 타일 맵에서 스폰 포인트 자동 추출
        this.spawnPoints = this.extractSpawnPoints();
        this.gemSpawnPoints = this.extractGemSpawnPoints();

        // Destructible wall health
        this.destructibleHealth = {};
        this.initDestructibles();
    }

    /**
     * 타일 맵에서 팀별 스폰 포인트 추출
     */
    extractSpawnPoints() {
        const blue = [];
        const red = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile === TILE_TYPES.SPAWN_BLUE) {
                    blue.push({ x: col, y: row });
                } else if (tile === TILE_TYPES.SPAWN_RED) {
                    red.push({ x: col, y: row });
                }
            }
        }

        return { blue, red };
    }

    /**
     * 타일 맵에서 보석 스폰 포인트 추출
     */
    extractGemSpawnPoints() {
        const gemSpawns = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col] === TILE_TYPES.GEM_SPAWN) {
                    gemSpawns.push({ x: col, y: row });
                }
            }
        }

        return gemSpawns;
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
            solid: tileType === TILE_TYPES.WALL || tileType === TILE_TYPES.DESTRUCTIBLE || tileType === TILE_TYPES.WATER,
            bush: tileType === TILE_TYPES.BUSH,
        };
    }

    getThemeColor(key, fallback) {
        return this.theme[key] || fallback;
    }

    hasAdjacentTileType(col, row, tileType) {
        const mask = this.getNeighborMask(col, row, neighbor => neighbor === tileType);
        return mask.top || mask.right || mask.bottom || mask.left;
    }

    getNeighborMask(col, row, predicate) {
        return {
            top: predicate(this.getTile(col, row - 1)),
            right: predicate(this.getTile(col + 1, row)),
            bottom: predicate(this.getTile(col, row + 1)),
            left: predicate(this.getTile(col - 1, row)),
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

    /**
     * 발사체용 충돌 체크 - 물은 통과 가능
     */
    isPositionSolidForProjectile(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        const tileType = this.getTile(col, row);
        // 발사체는 벽과 파괴 가능한 벽에만 막힘, 물은 통과
        return tileType === TILE_TYPES.WALL || tileType === TILE_TYPES.DESTRUCTIBLE;
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
        const tile = this.getTile(col, row);
        const groundColor = this.getThemeColor('ground', COLORS.GROUND);
        const groundDarkColor = this.getThemeColor('groundDark', COLORS.GROUND_DARK);
        const detailColor = this.getThemeColor('detail', COLORS.GROUND_DETAIL);

        // Subtle checkerboard base
        ctx.fillStyle = (col + row) % 2 === 0 ? groundColor : groundDarkColor;
        ctx.fillRect(x, y, size, size);

        // Deterministic noise for grass/props based on coordinates
        const seed = (col * 73 + row * 37);
        const rand = (s) => (Math.sin(s) * 10000) % 1;

        if (Math.abs(rand(seed)) > 0.8) {
            // Grass Tuff
            ctx.fillStyle = detailColor;
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

        this.renderGroundDecoration(ctx, x, y, size, col, row, seed, rand);

        const nearWall = this.getNeighborMask(col, row, neighbor =>
            neighbor === TILE_TYPES.WALL || neighbor === TILE_TYPES.DESTRUCTIBLE
        );
        const nearBush = this.getNeighborMask(col, row, neighbor => neighbor === TILE_TYPES.BUSH);
        const nearWater = this.getNeighborMask(col, row, neighbor => neighbor === TILE_TYPES.WATER);

        ctx.save();
        if (tile === TILE_TYPES.GROUND || tile === TILE_TYPES.SPAWN_BLUE || tile === TILE_TYPES.SPAWN_RED || tile === TILE_TYPES.GEM_SPAWN) {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = this.getThemeColor('wall', '#7b613f');
            this.renderEdgeBand(ctx, x, y, size, nearWall, 5);

            ctx.globalAlpha = 0.18;
            ctx.fillStyle = this.getThemeColor('bushDark', COLORS.BUSH_DARK);
            this.renderEdgeBand(ctx, x, y, size, nearBush, 4);

            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.getThemeColor('waterShallow', COLORS.WATER_SHALLOW);
            this.renderEdgeBand(ctx, x, y, size, nearWater, 4);
        }
        ctx.restore();
    }

    renderGroundDecoration(ctx, x, y, size, col, row, seed, rand) {
        const accent = this.getThemeColor('accent', COLORS.GEM_GLOW);
        const style = this.theme.decorationStyle || 'default';

        ctx.save();
        ctx.strokeStyle = accent;
        ctx.fillStyle = accent;

        if (style === 'dunes') {
            ctx.globalAlpha = 0.08;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 6, y + size * 0.35);
            ctx.quadraticCurveTo(x + size * 0.45, y + size * 0.2, x + size - 6, y + size * 0.32);
            ctx.moveTo(x + 8, y + size * 0.68);
            ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.5, x + size - 8, y + size * 0.72);
            ctx.stroke();
        } else if (style === 'grid') {
            ctx.globalAlpha = 0.1;
            ctx.fillRect(x + size * 0.18, y + size * 0.18, 2, size * 0.64);
            ctx.fillRect(x + size * 0.82, y + size * 0.18, 2, size * 0.64);
            ctx.fillRect(x + size * 0.18, y + size * 0.18, size * 0.64, 2);
            ctx.fillRect(x + size * 0.18, y + size * 0.82, size * 0.64, 2);
        } else if (style === 'canals') {
            ctx.globalAlpha = 0.12;
            const offset = (col % 2 === 0 ? 0.25 : 0.55) * size;
            ctx.fillRect(x + size * 0.12, y + offset, size * 0.2, 2);
            ctx.fillRect(x + size * 0.42, y + offset - 4, size * 0.18, 2);
            ctx.fillRect(x + size * 0.68, y + offset + 2, size * 0.14, 2);
        } else if (style === 'garden') {
            ctx.globalAlpha = 0.09;
            const petals = [
                [0.28, 0.3], [0.62, 0.24], [0.74, 0.58], [0.34, 0.68],
            ];
            petals.forEach(([px, py]) => {
                ctx.beginPath();
                ctx.arc(x + size * px, y + size * py, 2 + Math.abs(rand(seed + px * 100)) * 2, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (style === 'slabs') {
            ctx.globalAlpha = 0.12;
            ctx.fillRect(x + size * 0.1, y + size * 0.12, size * 0.78, 2);
            ctx.fillRect(x + size * 0.16, y + size * 0.5, size * 0.68, 2);
            ctx.fillRect(x + size * 0.2, y + size * 0.8, size * 0.52, 2);
        }

        ctx.restore();
    }

    renderWater(ctx, x, y, col, row) {
        const size = this.tileSize;
        const time = performance.now() * 0.002;
        const shoreMask = this.getNeighborMask(col, row, neighbor => neighbor !== TILE_TYPES.WATER);

        ctx.fillStyle = this.getThemeColor('water', COLORS.WATER);
        ctx.fillRect(x, y, size, size);

        // Water ripples
        ctx.strokeStyle = this.getThemeColor('waterShallow', COLORS.WATER_SHALLOW);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;

        const rippleOffset = (Math.sin(time + col + row) * 5);
        ctx.beginPath();
        ctx.moveTo(x + 5, y + size / 2 + rippleOffset);
        ctx.lineTo(x + size - 5, y + size / 2 - rippleOffset);
        ctx.stroke();

        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.getThemeColor('accent', 'rgba(255, 255, 255, 0.55)');
        this.renderEdgeBand(ctx, x, y, size, shoreMask, 3);

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.getThemeColor('bushGlow', COLORS.BUSH_GLOW);
        if (shoreMask.left) ctx.fillRect(x + 4, y + 10, 2, size - 20);
        if (shoreMask.right) ctx.fillRect(x + size - 6, y + 10, 2, size - 20);
        if (shoreMask.top) ctx.fillRect(x + 10, y + 4, size - 20, 2);
        if (shoreMask.bottom) ctx.fillRect(x + 10, y + size - 6, size - 20, 2);

        ctx.globalAlpha = 1.0;
    }

    renderShadow(ctx, x, y) {
        ctx.fillStyle = this.getThemeColor('shadow', COLORS.SHADOW);
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
                this.renderWall(
                    ctx,
                    x,
                    y,
                    size,
                    this.getThemeColor('wall', COLORS.WALL),
                    this.getThemeColor('wallTop', COLORS.WALL_TOP),
                    col,
                    row
                );
                break;

            case TILE_TYPES.DESTRUCTIBLE:
                const health = this.destructibleHealth[`${col},${row}`] || 2000;
                const healthPercent = health / 2000;
                this.renderWall(
                    ctx,
                    x,
                    y,
                    size,
                    this.getThemeColor('wall', COLORS.DESTRUCTIBLE),
                    this.getThemeColor('wallTop', COLORS.DESTRUCTIBLE_TOP),
                    col,
                    row
                );
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

    renderWall(ctx, x, y, size, color, topColor, col, row) {
        const exposed = this.getNeighborMask(col, row, neighbor =>
            neighbor !== TILE_TYPES.WALL && neighbor !== TILE_TYPES.DESTRUCTIBLE
        );

        // Base Side (Depth)
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // Top Face (Raised)
        ctx.fillStyle = topColor;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 10);

        // Edge Highlights
        ctx.strokeStyle = this.getThemeColor('wallEdge', COLORS.WALL_EDGE);
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

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = this.getThemeColor('bush', COLORS.BUSH);
        this.renderEdgeBand(ctx, x + 2, y + 2, size - 4, exposed, 3);
        ctx.restore();
    }

    renderBush(ctx, x, y, size, col, row) {
        const time = performance.now() * 0.001;
        const sway = Math.sin(time + col) * 2;
        const exposed = this.getNeighborMask(col, row, neighbor => neighbor !== TILE_TYPES.BUSH);

        ctx.save();
        ctx.translate(sway, 0);

        // Large organic leafy look
        ctx.fillStyle = this.getThemeColor('bush', COLORS.BUSH);

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
            ctx.fillStyle = this.getThemeColor('bushGlow', COLORS.BUSH_GLOW);
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(x + size * c.rx - 2, y + size * c.ry - 2, size * c.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = this.getThemeColor('bush', COLORS.BUSH);
        });

        // Small dark details
        ctx.fillStyle = this.getThemeColor('bushDark', COLORS.BUSH_DARK);
        ctx.fillRect(x + size * 0.45, y + size * 0.45, 4, 4);

        ctx.globalAlpha = 0.18;
        ctx.fillStyle = this.getThemeColor('accent', '#9ad46c');
        this.renderEdgeBand(ctx, x + 2, y + 2, size - 4, exposed, 4);

        ctx.restore();
    }

    renderEdgeBand(ctx, x, y, size, mask, thickness) {
        if (mask.top) ctx.fillRect(x, y, size, thickness);
        if (mask.right) ctx.fillRect(x + size - thickness, y, thickness, size);
        if (mask.bottom) ctx.fillRect(x, y + size - thickness, size, thickness);
        if (mask.left) ctx.fillRect(x, y, thickness, size);
    }

    renderSpecialTile(ctx, x, y, tile, size) {
        const time = performance.now() * 0.003;
        const pulse = 0.6 + Math.sin(time) * 0.2;

        if (tile === TILE_TYPES.SPAWN_BLUE) {
            // 배경 글로우
            const gradient = ctx.createRadialGradient(
                x + size/2, y + size/2, 0,
                x + size/2, y + size/2, size * 0.7
            );
            gradient.addColorStop(0, `rgba(74, 144, 217, ${0.5 * pulse})`);
            gradient.addColorStop(1, 'rgba(74, 144, 217, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 10, y - 10, size + 20, size + 20);

            // 메인 영역
            ctx.fillStyle = `rgba(74, 144, 217, ${0.4 * pulse})`;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, size - 6, size - 6, 12);
            ctx.fill();

            // 테두리
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.8 * pulse})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // 팀 아이콘
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔵', x + size/2, y + size/2);

        } else if (tile === TILE_TYPES.SPAWN_RED) {
            // 배경 글로우
            const gradient = ctx.createRadialGradient(
                x + size/2, y + size/2, 0,
                x + size/2, y + size/2, size * 0.7
            );
            gradient.addColorStop(0, `rgba(231, 76, 60, ${0.5 * pulse})`);
            gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 10, y - 10, size + 20, size + 20);

            // 메인 영역
            ctx.fillStyle = `rgba(231, 76, 60, ${0.4 * pulse})`;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, size - 6, size - 6, 12);
            ctx.fill();

            // 테두리
            ctx.strokeStyle = `rgba(255, 120, 100, ${0.8 * pulse})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // 팀 아이콘
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * pulse})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔴', x + size/2, y + size/2);

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
            ctx.strokeStyle = this.getThemeColor('accent', `rgba(155, 89, 182, ${glow})`);
            ctx.lineWidth = 3;
            ctx.stroke();

            // Minimalist indicator instead of gem emoji
            ctx.fillStyle = this.getThemeColor('accent', `rgba(155, 89, 182, ${glow * 0.5})`);
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

}
