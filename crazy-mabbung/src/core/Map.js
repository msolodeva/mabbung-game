// ===== Layout Generators =====
// Each returns a 2D array: 0=Empty, 1=Wall(Indestructible), 2=Breakable

const DEFAULT_VISUAL = {
    accent: '#ffffff',
    detailColor: 'rgba(255, 255, 255, 0.35)',
    secondaryDetailColor: 'rgba(255, 255, 255, 0.18)',
    floorPattern: 'soft-noise',
    ambient: 'none',
    overlay: 'rgba(255, 255, 255, 0.04)'
};

function generateForestLayout(cols, rows, isSpawnZone) {
    const map = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                row.push(1);
            } else if (r % 2 === 0 && c % 2 === 0) {
                row.push(1);
            } else if (isSpawnZone(c, r)) {
                row.push(0);
            } else if (Math.random() < 0.4) {
                row.push(2);
            } else {
                row.push(0);
            }
        }
        map.push(row);
    }
    return map;
}

function generateIceCaveLayout(cols, rows, isSpawnZone) {
    const map = [];
    const midC = Math.floor(cols / 2);
    const midR = Math.floor(rows / 2);

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                row.push(1);
            } else if (isSpawnZone(c, r)) {
                row.push(0);
            }
            // Open arena in center (7x5 area)
            else if (Math.abs(c - midC) <= 3 && Math.abs(r - midR) <= 2) {
                row.push(0);
            }
            // Ring of walls around the arena
            else if (Math.abs(c - midC) === 4 && Math.abs(r - midR) <= 3) {
                row.push(Math.random() < 0.6 ? 2 : 0);
            } else if (Math.abs(r - midR) === 3 && Math.abs(c - midC) <= 4) {
                row.push(Math.random() < 0.6 ? 2 : 0);
            }
            // Scattered pillars in the outer area (less regular than grid)
            else if ((r % 3 === 0 && c % 4 === 0) || (r % 4 === 0 && c % 3 === 0)) {
                row.push(1);
            }
            // Dense blocks around edges
            else if (c <= 3 || c >= cols - 4 || r <= 3 || r >= rows - 4) {
                row.push(Math.random() < 0.55 ? 2 : 0);
            }
            else {
                row.push(Math.random() < 0.25 ? 2 : 0);
            }
        }
        map.push(row);
    }
    return map;
}

function generateDesertRuinsLayout(cols, rows, isSpawnZone) {
    const map = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                row.push(1);
            } else if (isSpawnZone(c, r)) {
                row.push(0);
            } else {
                row.push(0); // Default empty, we'll fill structures below
            }
        }
        map.push(row);
    }

    // Diagonal walls (top-left to bottom-right)
    for (let i = 0; i < Math.min(rows, cols) - 2; i++) {
        const r = 2 + i;
        const c = 2 + i;
        if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1 && !isSpawnZone(c, r)) {
            map[r][c] = 1;
        }
    }
    // Diagonal walls (top-right to bottom-left)
    for (let i = 0; i < Math.min(rows, cols) - 2; i++) {
        const r = 2 + i;
        const c = cols - 3 - i;
        if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1 && !isSpawnZone(c, r)) {
            map[r][c] = 1;
        }
    }

    // Room structures (3 rooms placed at strategic positions)
    const rooms = [
        { x: 4, y: 2, w: 3, h: 3 },
        { x: cols - 8, y: rows - 6, w: 3, h: 3 },
        { x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2) - 1, w: 3, h: 3 }
    ];

    rooms.forEach(room => {
        for (let ry = room.y; ry < room.y + room.h && ry < rows - 1; ry++) {
            for (let rx = room.x; rx < room.x + room.w && rx < cols - 1; rx++) {
                if (rx > 0 && ry > 0 && !isSpawnZone(rx, ry)) {
                    // Walls on edges, empty inside
                    if (ry === room.y || ry === room.y + room.h - 1 ||
                        rx === room.x || rx === room.x + room.w - 1) {
                        map[ry][rx] = 2;
                    }
                }
            }
        }
        // Door opening on the south side
        const doorX = room.x + Math.floor(room.w / 2);
        const doorY = room.y + room.h - 1;
        if (doorX > 0 && doorX < cols - 1 && doorY > 0 && doorY < rows - 1) {
            map[doorY][doorX] = 0;
        }
    });

    // Random rubble/breakable blocks scattered
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (map[r][c] === 0 && !isSpawnZone(c, r) && Math.random() < 0.25) {
                map[r][c] = 2;
            }
        }
    }

    return map;
}

function generateFactoryLayout(cols, rows, isSpawnZone) {
    const map = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                row.push(1);
            } else if (isSpawnZone(c, r)) {
                row.push(0);
            } else {
                row.push(0);
            }
        }
        map.push(row);
    }

    // Horizontal corridors (walls with gaps)
    const hCorridors = [4, Math.floor(rows / 2), rows - 5];
    hCorridors.forEach(r => {
        if (r <= 0 || r >= rows - 1) return;
        for (let c = 1; c < cols - 1; c++) {
            if (!isSpawnZone(c, r)) {
                // Leave gaps every 4-5 tiles for passage
                if (c % 5 !== 0 && c % 5 !== 1) {
                    map[r][c] = 1;
                }
            }
        }
    });

    // Vertical corridors
    const vCorridors = [5, Math.floor(cols / 2), cols - 6];
    vCorridors.forEach(c => {
        if (c <= 0 || c >= cols - 1) return;
        for (let r = 1; r < rows - 1; r++) {
            if (!isSpawnZone(c, r)) {
                if (r % 4 !== 0 && r % 4 !== 1) {
                    // Only add wall if not already a corridor intersection
                    if (map[r][c] === 0) {
                        map[r][c] = 1;
                    }
                }
            }
        }
    });

    // 2x2 pillar blocks in open areas
    const pillars = [
        { x: 3, y: 2 }, { x: cols - 5, y: 2 },
        { x: 3, y: rows - 4 }, { x: cols - 5, y: rows - 4 },
        { x: Math.floor(cols / 2) - 1, y: 2 },
        { x: Math.floor(cols / 2) - 1, y: rows - 4 }
    ];
    pillars.forEach(p => {
        for (let dr = 0; dr < 2; dr++) {
            for (let dc = 0; dc < 2; dc++) {
                const rr = p.y + dr;
                const cc = p.x + dc;
                if (rr > 0 && rr < rows - 1 && cc > 0 && cc < cols - 1 && !isSpawnZone(cc, rr)) {
                    map[rr][cc] = 1;
                }
            }
        }
    });

    // Fill remaining open areas with sparse breakable blocks
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (map[r][c] === 0 && !isSpawnZone(c, r) && Math.random() < 0.3) {
                map[r][c] = 2;
            }
        }
    }

    return map;
}

function generateVolcanoLayout(cols, rows, isSpawnZone) {
    const map = [];
    const midC = Math.floor(cols / 2);
    const midR = Math.floor(rows / 2);

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                row.push(1);
            } else if (isSpawnZone(c, r)) {
                row.push(0);
            }
            // Central lava pool (3x3 indestructible)
            else if (Math.abs(c - midC) <= 1 && Math.abs(r - midR) <= 1) {
                row.push(1);
            }
            // Radial corridors (4 paths from center outward)
            else if (c === midC && (r > 1 && r < rows - 2)) {
                row.push(0); // North-South corridor
            } else if (r === midR && (c > 1 && c < cols - 2)) {
                row.push(0); // East-West corridor
            }
            // Ring of breakable blocks around the lava
            else if (Math.abs(c - midC) <= 3 && Math.abs(r - midR) <= 3) {
                if (Math.random() < 0.6) {
                    row.push(2);
                } else {
                    row.push(0);
                }
            }
            // Scattered walls forming rocky terrain
            else if ((c + r) % 5 === 0) {
                row.push(1);
            }
            // Dense blocks in corners (filling paths)
            else if (Math.random() < 0.45) {
                row.push(2);
            } else {
                row.push(0);
            }
        }
        map.push(row);
    }
    return map;
}


// ===== Theme Definitions =====
export const MAP_THEMES = {
    FOREST: {
        id: 'FOREST',
        name: '숲',
        tileSheet: 'sheet_tiles',
        filter: 'none',
        colors: { bg: '#4a8c3f', wall: '#7f8c8d', block: '#e67e22' },
        visual: {
            accent: '#78d85f',
            detailColor: 'rgba(255, 241, 137, 0.34)',
            secondaryDetailColor: 'rgba(47, 125, 57, 0.28)',
            floorPattern: 'leaf-speckles',
            ambient: 'leaf-drift',
            overlay: 'rgba(79, 165, 79, 0.1)'
        },
        generateLayout: generateForestLayout
    },
    ICE_CAVE: {
        id: 'ICE_CAVE',
        name: '얼음동굴',
        tileSheet: 'sheet_tiles_ice',
        filter: 'none',
        colors: { bg: '#a8d8ea', wall: '#d6eaf8', block: '#85c1e9' },
        visual: {
            accent: '#d9f7ff',
            detailColor: 'rgba(230, 252, 255, 0.48)',
            secondaryDetailColor: 'rgba(87, 176, 211, 0.22)',
            floorPattern: 'frost-veins',
            ambient: 'cold-haze',
            overlay: 'rgba(202, 243, 255, 0.14)'
        },
        generateLayout: generateIceCaveLayout
    },
    DESERT_RUINS: {
        id: 'DESERT_RUINS',
        name: '사막유적',
        tileSheet: 'sheet_tiles_desert',
        filter: 'none',
        colors: { bg: '#d4a855', wall: '#a0522d', block: '#c4883a' },
        visual: {
            accent: '#f6c56f',
            detailColor: 'rgba(255, 232, 168, 0.42)',
            secondaryDetailColor: 'rgba(145, 82, 34, 0.25)',
            floorPattern: 'sand-runes',
            ambient: 'heat-shimmer',
            overlay: 'rgba(244, 186, 94, 0.1)'
        },
        generateLayout: generateDesertRuinsLayout
    },
    FACTORY: {
        id: 'FACTORY',
        name: '공장',
        tileSheet: 'sheet_tiles_factory',
        filter: 'none',
        colors: { bg: '#4a4a4a', wall: '#2c3e50', block: '#7f8c8d' },
        visual: {
            accent: '#ffd23f',
            detailColor: 'rgba(255, 210, 63, 0.38)',
            secondaryDetailColor: 'rgba(102, 219, 255, 0.2)',
            floorPattern: 'hazard-grid',
            ambient: 'steam-pulse',
            overlay: 'rgba(90, 104, 111, 0.12)'
        },
        generateLayout: generateFactoryLayout
    },
    VOLCANO: {
        id: 'VOLCANO',
        name: '화산',
        tileSheet: 'sheet_tiles_volcano',
        filter: 'none',
        colors: { bg: '#3d1c00', wall: '#1a1a1a', block: '#5c3a1e' },
        visual: {
            accent: '#ff5f2e',
            detailColor: 'rgba(255, 99, 45, 0.5)',
            secondaryDetailColor: 'rgba(255, 196, 87, 0.24)',
            floorPattern: 'ember-cracks',
            ambient: 'heat-glow',
            overlay: 'rgba(153, 40, 24, 0.18)'
        },
        generateLayout: generateVolcanoLayout
    }
};

export class Map {
    constructor(tileSize, cols, rows, theme = MAP_THEMES.FOREST) {
        this.tileSize = tileSize;
        this.cols = cols;
        this.rows = rows;
        this.theme = theme;

        // Generate map data using theme-specific layout
        this.data = this.generateMap();
    }

    generateMap() {
        const isSpawnZone = (c, r) => this.isSpawnZone(c, r);

        if (this.theme.generateLayout) {
            return this.theme.generateLayout(this.cols, this.rows, isSpawnZone);
        }

        // Fallback to classic grid
        return generateForestLayout(this.cols, this.rows, isSpawnZone);
    }

    isSpawnZone(c, r) {
        // Top-left corner (Player 1 spawn - Red Team)
        if ((c >= 1 && c <= 3) && (r >= 1 && r <= 3)) return true;
        // Bottom-right corner (Player 2 spawn - Blue Team)
        if ((c >= this.cols - 4 && c <= this.cols - 2) && (r >= this.rows - 4 && r <= this.rows - 2)) return true;
        // Bottom-left corner (AI Red Team)
        if ((c >= 1 && c <= 3) && (r >= this.rows - 4 && r <= this.rows - 2)) return true;
        // Top-right corner (AI Blue Team)
        if ((c >= this.cols - 4 && c <= this.cols - 2) && (r >= 1 && r <= 3)) return true;

        // Middle areas
        const midRow = Math.floor(this.rows / 2);
        // Left-middle (AI Red Team)
        if ((c >= 1 && c <= 3) && (r >= midRow - 1 && r <= midRow + 1)) return true;
        // Right-middle (AI Blue Team)
        if ((c >= this.cols - 4 && c <= this.cols - 2) && (r >= midRow - 1 && r <= midRow + 1)) return true;

        return false;
    }

    draw(ctx, assets) {
        // Use theme-specific tile sheet key
        const sheetKey = this.theme.tileSheet || 'sheet_tiles';
        const sheet = assets ? assets.get(sheetKey) : null;
        const visual = this.getThemeVisual();
        const now = Date.now();
        let sw = 0;
        let sh = 0;

        const TILE_SHEET_COLS = 4;
        const TILE_SHEET_ROWS = 4;

        if (sheet && (sheet.width || sheet.naturalWidth) > 0) {
            const width = sheet.width || sheet.naturalWidth;
            const height = sheet.height || sheet.naturalHeight;
            sw = width / TILE_SHEET_COLS;
            sh = height / TILE_SHEET_ROWS;
        }

        ctx.save();
        if (this.theme.filter && this.theme.filter !== 'none') {
            ctx.filter = this.theme.filter;
        }

        // Draw a solid background first to hide any seams
        ctx.fillStyle = this.theme.colors.bg;
        ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.data[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                // Draw Floor - Row 0
                if (sw > 0) {
                    const grassSy = 0;
                    const variant = (c + r) % TILE_SHEET_COLS;
                    const sx = variant * sw;
                    ctx.drawImage(sheet, sx, grassSy, sw, sh, x, y, this.tileSize, this.tileSize);
                }

                this.drawThemeFloorDetail(
                    ctx,
                    c,
                    r,
                    x,
                    y,
                    type,
                    this.getTileVisualVariant(c, r, type),
                    now
                );

                if (type === 1) {
                    // Indestructible Wall (Row 1)
                    if (sw > 0) {
                        const wallSy = sh * 1;
                        const sx = 0;
                        ctx.drawImage(sheet, sx, wallSy, sw, sh, x, y - 10, this.tileSize, this.tileSize + 10);
                    } else {
                        ctx.fillStyle = this.theme.colors.wall;
                        ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    }
                    this.drawThemeObjectAccent(ctx, c, r, x, y, type, visual, now);
                } else if (type === 2) {
                    // Breakable Block (Row 2)
                    if (sw > 0) {
                        const blockSy = sh * 2;
                        const sx = 0;
                        ctx.drawImage(sheet, sx, blockSy, sw, sh, x, y - 5, this.tileSize, this.tileSize + 5);
                    } else {
                        ctx.fillStyle = this.theme.colors.block;
                        ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    }
                    this.drawThemeObjectAccent(ctx, c, r, x, y, type, visual, now);
                } else {
                    // Grid lines for floor (only if no sheet)
                    if (sw === 0) {
                        ctx.strokeStyle = '#bdc3c7';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                    }
                }
            }
        }
        this.drawThemeAmbient(ctx, visual, now);
        ctx.restore();
    }

    getThemeVisual() {
        return {
            ...DEFAULT_VISUAL,
            ...(this.theme.visual || {})
        };
    }

    getTileVisualVariant(c, r, type) {
        const visual = this.getThemeVisual();
        const seed = this.hashTile(c, r, type);
        return {
            accent: visual.accent,
            detailColor: visual.detailColor,
            secondaryDetailColor: visual.secondaryDetailColor,
            floorPattern: visual.floorPattern,
            ambient: visual.ambient,
            seed,
            alpha: 0.18 + (seed % 5) * 0.035
        };
    }

    hashTile(c, r, type = 0) {
        let hash = (c + 1) * 73856093;
        hash ^= (r + 1) * 19349663;
        hash ^= (type + 1) * 83492791;
        hash ^= this.theme.id.length * 2654435761;
        return Math.abs(hash >>> 0) % 100;
    }

    drawThemeFloorDetail(ctx, c, r, x, y, type, variant, now) {
        const pad = Math.max(4, this.tileSize * 0.08);
        const centerX = x + this.tileSize / 2;
        const centerY = y + this.tileSize / 2;

        ctx.save();

        if (this.getThemeVisual().overlay) {
            ctx.fillStyle = this.getThemeVisual().overlay;
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }

        if (type !== 0) {
            ctx.globalAlpha *= 0.45;
        }

        if (variant.floorPattern === 'leaf-speckles') {
            ctx.fillStyle = variant.detailColor;
            for (let i = 0; i < 3; i++) {
                const px = x + pad + ((variant.seed * (i + 3) + i * 17) % (this.tileSize - pad * 2));
                const py = y + pad + ((variant.seed * (i + 5) + i * 11) % (this.tileSize - pad * 2));
                ctx.beginPath();
                ctx.ellipse(px, py, 2.5, 1.3, (variant.seed + i) * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            if ((variant.seed + c + r) % 4 === 0) {
                ctx.strokeStyle = variant.secondaryDetailColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(centerX - 8, centerY + 7);
                ctx.quadraticCurveTo(centerX, centerY - 5, centerX + 10, centerY + 4);
                ctx.stroke();
            }
        } else if (variant.floorPattern === 'frost-veins') {
            ctx.strokeStyle = variant.detailColor;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x + pad, y + this.tileSize * 0.35);
            ctx.lineTo(centerX - 2, centerY - 3);
            ctx.lineTo(x + this.tileSize - pad, y + this.tileSize * 0.24);
            ctx.stroke();

            if (variant.seed % 3 === 0) {
                ctx.strokeStyle = variant.secondaryDetailColor;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + 9, centerY + 11);
                ctx.stroke();
            }
        } else if (variant.floorPattern === 'sand-runes') {
            ctx.strokeStyle = variant.detailColor;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 7 + (variant.seed % 3), Math.PI * 0.1, Math.PI * 1.25);
            ctx.stroke();

            ctx.fillStyle = variant.secondaryDetailColor;
            ctx.fillRect(x + pad + (variant.seed % 9), y + this.tileSize - pad - 3, 12, 2);
        } else if (variant.floorPattern === 'hazard-grid') {
            ctx.strokeStyle = variant.secondaryDetailColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + this.tileSize * 0.5, y + 5);
            ctx.lineTo(x + this.tileSize * 0.5, y + this.tileSize - 5);
            ctx.moveTo(x + 5, y + this.tileSize * 0.5);
            ctx.lineTo(x + this.tileSize - 5, y + this.tileSize * 0.5);
            ctx.stroke();

            if (variant.seed % 4 === 0) {
                ctx.strokeStyle = variant.detailColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 9, y + 9);
                ctx.lineTo(x + 19, y + 9);
                ctx.moveTo(x + 9, y + 15);
                ctx.lineTo(x + 19, y + 15);
                ctx.stroke();
            }
        } else if (variant.floorPattern === 'ember-cracks') {
            const pulse = 0.55 + Math.sin(now / 260 + variant.seed) * 0.2;
            ctx.strokeStyle = variant.detailColor;
            ctx.globalAlpha = variant.alpha * pulse;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + pad, y + this.tileSize * 0.7);
            ctx.lineTo(centerX - 4, centerY + 2);
            ctx.lineTo(centerX + 7, centerY + 10);
            ctx.lineTo(x + this.tileSize - pad, y + this.tileSize * 0.38);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawThemeObjectAccent(ctx, c, r, x, y, type, visual, now) {
        const variant = this.getTileVisualVariant(c, r, type);

        ctx.save();
        if (visual.floorPattern === 'frost-veins') {
            ctx.strokeStyle = type === 1 ? 'rgba(255, 255, 255, 0.58)' : visual.detailColor;
            ctx.lineWidth = type === 1 ? 2 : 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 11);
            ctx.lineTo(x + this.tileSize - 12, y + 8 + (variant.seed % 8));
            ctx.stroke();
        } else if (visual.floorPattern === 'sand-runes') {
            ctx.fillStyle = type === 1 ? 'rgba(92, 43, 19, 0.2)' : 'rgba(255, 225, 153, 0.2)';
            ctx.fillRect(x + 7, y + 6, this.tileSize - 14, 4);
            ctx.fillRect(x + 10, y + this.tileSize - 9, this.tileSize - 20, 3);
        } else if (visual.floorPattern === 'hazard-grid') {
            ctx.fillStyle = 'rgba(255, 210, 63, 0.22)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + 8 + i * 15, y + this.tileSize - 9, 8, 3);
            }
        } else if (visual.floorPattern === 'ember-cracks') {
            const glow = 0.22 + Math.sin(now / 180 + variant.seed) * 0.08;
            ctx.strokeStyle = `rgba(255, 95, 46, ${glow})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 13, y + this.tileSize - 11);
            ctx.lineTo(x + 27, y + this.tileSize - 18);
            ctx.lineTo(x + 36, y + this.tileSize - 10);
            ctx.stroke();
        } else if (visual.floorPattern === 'leaf-speckles') {
            ctx.fillStyle = 'rgba(78, 137, 60, 0.22)';
            ctx.beginPath();
            ctx.ellipse(x + 12 + (variant.seed % 9), y + this.tileSize - 8, 11, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawThemeAmbient(ctx, visual, now) {
        const width = this.cols * this.tileSize;
        const height = this.rows * this.tileSize;

        ctx.save();
        if (visual.ambient === 'leaf-drift') {
            ctx.fillStyle = 'rgba(255, 241, 137, 0.18)';
            for (let i = 0; i < 14; i++) {
                const x = (i * 83 + now / 42) % width;
                const y = (i * 47 + Math.sin(now / 600 + i) * 12) % height;
                ctx.beginPath();
                ctx.ellipse(x, y, 3, 1.4, i * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (visual.ambient === 'cold-haze') {
            const band = (Math.sin(now / 900) + 1) / 2;
            ctx.fillStyle = `rgba(220, 250, 255, ${0.06 + band * 0.04})`;
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            for (let y = 18; y < height; y += 72) {
                ctx.beginPath();
                ctx.moveTo(0, y + band * 8);
                ctx.lineTo(width, y - band * 6);
                ctx.stroke();
            }
        } else if (visual.ambient === 'heat-shimmer') {
            ctx.strokeStyle = 'rgba(255, 221, 151, 0.1)';
            ctx.lineWidth = 2;
            for (let y = 20; y < height; y += 48) {
                const offset = Math.sin(now / 330 + y) * 8;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.bezierCurveTo(width * 0.3, y + offset, width * 0.7, y - offset, width, y);
                ctx.stroke();
            }
        } else if (visual.ambient === 'steam-pulse') {
            const alpha = 0.05 + (Math.sin(now / 500) + 1) * 0.025;
            ctx.fillStyle = `rgba(102, 219, 255, ${alpha})`;
            for (let x = 28; x < width; x += 120) {
                ctx.fillRect(x, 0, 2, height);
            }
            ctx.strokeStyle = 'rgba(255, 210, 63, 0.1)';
            ctx.setLineDash([10, 12]);
            ctx.beginPath();
            ctx.moveTo(0, height * 0.5);
            ctx.lineTo(width, height * 0.5);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (visual.ambient === 'heat-glow') {
            const gradient = ctx.createRadialGradient(
                width / 2,
                height / 2,
                this.tileSize,
                width / 2,
                height / 2,
                Math.max(width, height) * 0.48
            );
            gradient.addColorStop(0, 'rgba(255, 95, 46, 0.24)');
            gradient.addColorStop(0.45, 'rgba(255, 95, 46, 0.08)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
    }

    isSolid(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        return this.data[row][col] !== 0;
    }

    destroyBlock(col, row) {
        if (this.data[row][col] === 2) {
            this.data[row][col] = 0;
            return true;
        }
        return false;
    }
}
