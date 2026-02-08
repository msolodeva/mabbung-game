export class Bomb {
    constructor(col, row, range, owner, tileSize) {
        this.col = col;
        this.row = row;
        this.range = range;
        this.owner = owner;
        this.tileSize = tileSize;
        this.timer = 3000; // 3 seconds
        this.isDead = false;
    }

    update(deltaTime, game) {
        if (this.isDead) return;

        this.timer -= deltaTime;

        // Animation
        this.animTimer = (this.animTimer || 0) + deltaTime;

        if (this.timer <= 0) {
            this.explode(game);
        }
    }

    explode(game) {
        if (this.isDead) return;
        this.isDead = true;
        // Return validity of explosion (to prevent infinite loops if we chain them)
        game.triggerExplosion(this.col, this.row, this.range, this.owner);
    }

    draw(ctx, assets) {
        const x = this.col * this.tileSize;
        const y = this.row * this.tileSize;

        // Pulse animation
        const pulse = (Math.sin(Date.now() / 150) + 1) / 2; // 0 to 1 fast
        const scale = 1 + pulse * 0.1;

        const sheet = assets ? assets.get('sheet_bomb') : null;

        if (sheet && (sheet.width || sheet.naturalWidth) > 0) {
            const width = sheet.width || sheet.naturalWidth;
            const height = sheet.height || sheet.naturalHeight;
            const frameCount = 3;
            const sw = width / frameCount;
            const sh = height;

            // Pulse animation (Ping-pong or Cycle? Cycle 0,1,2,0,1,2)
            // 3 frames over 500ms?
            const frameIndex = Math.floor(Date.now() / 200) % frameCount;

            const sy = 0;
            const sx = frameIndex * sw;

            // Draw Bomb
            const size = this.tileSize * 1.2; // Slightly larger for pop
            const offset = (size - this.tileSize) / 2;

            ctx.drawImage(sheet, sx, sy, sw, sh, x - offset, y - offset, size, size);
        } else {
            // Draw Bomb Base
            const cx = x + this.tileSize / 2;
            const cy = y + this.tileSize / 2;

            ctx.fillStyle = '#2980b9'; // Blue water balloon
            ctx.beginPath();
            ctx.arc(cx, cy + 2, (this.tileSize / 2 - 4) * scale, 0, Math.PI * 2);
            ctx.fill();

            // Shine/Highlight
            ctx.fillStyle = '#5dade2';
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 5, 5, 0, Math.PI * 2);
            ctx.fill();

            // Fuse animation?
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
            ctx.fillRect(cx - 2, cy - this.tileSize / 2, 4, 6);
        }
    }
}
