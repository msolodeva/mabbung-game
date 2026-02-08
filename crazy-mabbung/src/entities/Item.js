export class Item {
    constructor(col, row, type, tileSize) {
        this.col = col;
        this.row = row;
        this.type = type; // 'speed', 'range', 'count'
        this.tileSize = tileSize;
        this.isDead = false;
    }

    draw(ctx, assets) {
        const x = this.col * this.tileSize;
        const y = this.row * this.tileSize;

        // Items bounce animation
        const bounce = Math.sin(Date.now() / 200) * 3;

        const sheet = assets ? assets.get('sheet_items') : null;

        if (sheet && (sheet.width || sheet.naturalWidth) > 0) {
            const width = sheet.width || sheet.naturalWidth;
            const height = sheet.height || sheet.naturalHeight;
            const sw = width / 3; // 3 items in row
            const sh = height / 3; // 3 rows
            const sy = 0; // Use first row for now
            let sx = 0;
            if (this.type === 'speed') sx = 0; // Skate (Row 1 Col 1)
            else if (this.type === 'range') sx = sw * 1; // Potion (Row 1 Col 2)
            else if (this.type === 'count') sx = sw * 2; // Bomb Icon (Row 1 Col 3)

            // Spawn animation: Scale up
            if (!this.spawnTime) this.spawnTime = Date.now();
            const elapsed = Date.now() - this.spawnTime;
            const spawnScale = Math.min(1, elapsed / 300); // 300ms scale up

            const drawSize = (this.tileSize - 16) * spawnScale;
            const drawOffset = (this.tileSize - drawSize) / 2;

            ctx.drawImage(sheet, sx, sy, sw, sh, x + drawOffset, y + drawOffset + bounce, drawSize, drawSize);
        } else {
            // Fallback
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(x + 12, y + 12, this.tileSize - 24, this.tileSize - 24);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x + 12, y + 12, this.tileSize - 24, this.tileSize - 24);
        }
    }
}
