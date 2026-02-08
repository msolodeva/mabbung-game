export class Map {
    constructor(tileSize, cols, rows) {
        this.tileSize = tileSize;
        this.cols = cols;
        this.rows = rows;

        // Generate map data dynamically
        // 0 = Empty, 1 = Wall (Indestructible), 2 = Breakable
        this.data = this.generateMap();
    }

    generateMap() {
        const map = [];

        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                // Outer walls
                if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
                    row.push(1);
                }
                // Inner pillars at even positions (classic Bomberman pattern)
                else if (r % 2 === 0 && c % 2 === 0) {
                    row.push(1);
                }
                // Safe spawn zones (corners) - keep empty
                else if (this.isSpawnZone(c, r)) {
                    row.push(0);
                }
                // Random breakable blocks (40% chance)
                else if (Math.random() < 0.4) {
                    row.push(2);
                }
                // Empty space
                else {
                    row.push(0);
                }
            }
            map.push(row);
        }

        return map;
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
        const sheet = assets ? assets.get('sheet_tiles') : null;
        let sw = 0;
        let sh = 0;
        // sy is not needed here as it's calculated per tile type

        // Define sprite sheet dimensions for map tiles
        const TILE_SHEET_COLS = 4; // Number of columns in the tile sheet
        const TILE_SHEET_ROWS = 4; // Number of rows in the tile sheet (Grass, Wall, Block, etc.)

        if (sheet && (sheet.width || sheet.naturalWidth) > 0) {
            const width = sheet.width || sheet.naturalWidth;
            const height = sheet.height || sheet.naturalHeight;
            sw = width / TILE_SHEET_COLS;
            sh = height / TILE_SHEET_ROWS;
        }

        // Draw a solid background first to hide any seams
        ctx.fillStyle = '#27ae60'; // Darker grass green
        ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.data[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                // Draw Floor (Grass) - Row 0
                if (sw > 0) {
                    const grassSy = 0; // Row 0
                    // Pick a random variant based on position for variety? Or fixed
                    const variant = (c + r) % TILE_SHEET_COLS;
                    const sx = variant * sw;
                    ctx.drawImage(sheet, sx, grassSy, sw, sh, x, y, this.tileSize, this.tileSize);
                }

                if (type === 1) {
                    // Indestructible Wall (Row 1)
                    if (sw > 0) {
                        const wallSy = sh * 1; // Row 1
                        const sx = 0; // First variant
                        ctx.drawImage(sheet, sx, wallSy, sw, sh, x, y - 10, this.tileSize, this.tileSize + 10);
                    } else {
                        ctx.fillStyle = '#7f8c8d';
                        ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    }
                } else if (type === 2) {
                    // Breakable Block (Row 2 - Brick)
                    if (sw > 0) {
                        const blockSy = sh * 2; // Row 2
                        const sx = 0;
                        ctx.drawImage(sheet, sx, blockSy, sw, sh, x, y - 5, this.tileSize, this.tileSize + 5);
                    } else {
                        ctx.fillStyle = '#e67e22'; // Orange
                        ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    }
                } else {
                    // Grid lines for floor (optional, only if no sheet)
                    if (sw === 0) {
                        ctx.strokeStyle = '#bdc3c7'; // Light grey lines
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }

    isSolid(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        return this.data[row][col] !== 0; // 0 is empty
    }

    destroyBlock(col, row) {
        if (this.data[row][col] === 2) {
            this.data[row][col] = 0;
            return true;
        }
        return false;
    }
}
