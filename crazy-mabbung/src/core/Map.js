// ===== Layout Generators =====
// Each returns a 2D array: 0=Empty, 1=Wall(Indestructible), 2=Breakable

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
        generateLayout: generateForestLayout
    },
    ICE_CAVE: {
        id: 'ICE_CAVE',
        name: '얼음동굴',
        tileSheet: 'sheet_tiles_ice',
        filter: 'none',
        colors: { bg: '#a8d8ea', wall: '#d6eaf8', block: '#85c1e9' },
        generateLayout: generateIceCaveLayout
    },
    DESERT_RUINS: {
        id: 'DESERT_RUINS',
        name: '사막유적',
        tileSheet: 'sheet_tiles_desert',
        filter: 'none',
        colors: { bg: '#d4a855', wall: '#a0522d', block: '#c4883a' },
        generateLayout: generateDesertRuinsLayout
    },
    FACTORY: {
        id: 'FACTORY',
        name: '공장',
        tileSheet: 'sheet_tiles_factory',
        filter: 'none',
        colors: { bg: '#4a4a4a', wall: '#2c3e50', block: '#7f8c8d' },
        generateLayout: generateFactoryLayout
    },
    VOLCANO: {
        id: 'VOLCANO',
        name: '화산',
        tileSheet: 'sheet_tiles_volcano',
        filter: 'none',
        colors: { bg: '#3d1c00', wall: '#1a1a1a', block: '#5c3a1e' },
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
