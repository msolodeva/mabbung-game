export class Player {
    constructor(startCol, startRow, tileSize, color, controls) {
        this.tileSize = tileSize;
        this.color = color;

        // Default controls if not provided
        this.controls = controls || {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            bomb: 'Space'
        };

        // Logical position (center of tile)
        this.x = startCol * tileSize + tileSize / 2;
        this.y = startRow * tileSize + tileSize / 2;

        this.speed = 150; // pixels per second
        this.radius = tileSize / 3; // Collision radius

        // Internal movement flags
        this.moveDir = { x: 0, y: 0 };

        this.state = 'NORMAL'; // NORMAL, TRAPPED, DEAD
        this.trappedTimer = 0;

        // Stats / Limitations
        this.baseSpeed = 150;
        this.maxSpeed = 300;
        this.bombRange = 2; // Initial Explosion Range
        this.maxBombs = 1;  // Max concurrent bombs
        this.activeBombs = 0; // Currently placed bombs

        // Animation
        this.direction = 1; // 1 = Right, -1 = Left
        this.animTimer = 0;
        this.frame = 0;
        this.isMoving = false;
    }

    update(deltaTime, map, input, game) {
        if (this.state === 'DEAD') return;

        if (this.state === 'TRAPPED') {
            this.trappedTimer -= deltaTime;
            if (this.trappedTimer <= 0) {
                this.state = 'DEAD';
                console.log("Player Died!");
            }
            return; // Cannot move while trapped (or maybe wiggle?)
        }

        // 1. Handle Bomb Placement
        if (input[this.controls.bomb] && !this.lastSpace) {
            game.placeBomb(this);
        }
        this.lastSpace = !!input[this.controls.bomb];

        // 2. Calculate Movement Intent
        let dx = 0;
        let dy = 0;
        const speed = this.speed * (deltaTime / 1000);

        if (input[this.controls.left]) dx = -speed;
        if (input[this.controls.right]) dx = speed;
        if (input[this.controls.up]) dy = -speed;
        if (input[this.controls.down]) dy = speed;

        this.isMoving = dx !== 0 || dy !== 0;

        if (dx !== 0) {
            this.direction = Math.sign(dx);
        }

        if (this.isMoving) {
            this.animTimer += deltaTime;
            if (this.animTimer > 150) { // 150ms per frame
                this.frame = (this.frame + 1) % 4; // Assume 4 frames
                this.animTimer = 0;
            }
        } else {
            this.frame = 0;
            this.animTimer = 0;
        }

        // Normalize diagonal? Crazy Arcade usually prioritizes one axis or allows both.
        // Let's strict to axis-aligned movement for standard gameplay feel, 
        // or allow diagonal but collide separately.

        // Move X
        if (dx !== 0) {
            const newX = this.x + dx;
            const collision = this.checkCollision(newX, this.y, map);
            if (!collision) {
                this.x = newX;
            } else {
                // Corner Sliding / Correction for X axis
                // If we hit a wall moving horizontally, check if we can slide up or down
                this.applyCornerCorrection(newX, this.y, 0, map, speed);
            }
        }

        // Move Y
        if (dy !== 0) {
            const newY = this.y + dy;
            const collision = this.checkCollision(this.x, newY, map);
            if (!collision) {
                this.y = newY;
            } else {
                // Corner Sliding / Correction for Y axis
                this.applyCornerCorrection(this.x, newY, 1, map, speed);
            }
        }
    }

    trap() {
        if (this.state === 'NORMAL') {
            this.state = 'TRAPPED';
            this.trappedTimer = 5000; // 5 seconds to be saved
            console.log("Player is Trapped!");
        }
    }

    draw(ctx, assets) {
        if (this.state === 'DEAD') return;

        const sheet = assets.get('spritesheet_characters');

        if (sheet && (sheet.width || sheet.naturalWidth) > 0) {
            // Calculate Row
            let baseRow = 0; // Red
            if (this.color === '#3498db') baseRow = 3; // Blue

            let rowOffset = 0;
            let col = this.frame;

            // Animation Params
            let scaleX = 1;
            let scaleY = 1;
            let rotation = 0;
            let offsetY = 0;

            if (this.state === 'TRAPPED') {
                rowOffset = 2;
                // Trapped animation: Wiggle and Bubble float
                col = Math.floor(Date.now() / 200) % 4;
                rotation = Math.sin(Date.now() / 100) * 0.1; // Wiggle
                offsetY = Math.sin(Date.now() / 300) * 2; // Float
            } else if (this.isMoving) {
                rowOffset = 1;
                // Bounce while moving
                offsetY = Math.abs(Math.sin(Date.now() / 100)) * -4; // Jump up slightly
            } else {
                rowOffset = 0;
                // Idle Breathing
                scaleY = 1 + Math.sin(Date.now() / 500) * 0.02;
                scaleX = 1 + Math.cos(Date.now() / 500) * 0.02;
                // Blink
                if (Math.floor(Date.now() / 1000) % 3 === 0 && Math.floor(Date.now() / 100) % 10 === 0) {
                    // A simple blink frame hack if we had one, otherwise just normal
                }
                col = Math.floor(Date.now() / 500) % 4;
            }

            const frameRow = baseRow + rowOffset;

            const width = sheet.width || sheet.naturalWidth;
            const height = sheet.height || sheet.naturalHeight;
            const frameCount = 8;
            const rowCount = 6;

            const sw = width / frameCount;
            const sh = height / rowCount;
            const sx = (col % frameCount) * sw;
            const sy = frameRow * sh;

            const x = this.x;
            const y = this.y - 12 + offsetY;
            const size = this.tileSize * 1.5;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.scale(this.direction === -1 ? -scaleX : scaleX, scaleY);

            // Draw Character
            ctx.drawImage(sheet, sx, sy, sw, sh, -size / 2, -size / 2, size, size);

            // Draw Trapped Bubble Overlay if trapped (double check visual)
            if (this.state === 'TRAPPED') {
                // Optional extra bubble effect
            }

            ctx.restore();
        } else {
            // Fallback Rendering
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }
    }

    getBounds(x, y) {
        // Hitbox is slightly smaller than tile to allow passing through tight spaces
        const size = this.tileSize * 0.7;
        return {
            left: x - size / 2,
            right: x + size / 2,
            top: y - size / 2,
            bottom: y + size / 2
        };
    }

    checkCollision(x, y, map) {
        const bounds = this.getBounds(x, y);

        // Check all 4 corners of the AABB
        const points = [
            { c: Math.floor(bounds.left / this.tileSize), r: Math.floor(bounds.top / this.tileSize) },
            { c: Math.floor(bounds.right / this.tileSize), r: Math.floor(bounds.top / this.tileSize) },
            { c: Math.floor(bounds.left / this.tileSize), r: Math.floor(bounds.bottom / this.tileSize) },
            { c: Math.floor(bounds.right / this.tileSize), r: Math.floor(bounds.bottom / this.tileSize) }
        ];

        for (let p of points) {
            if (map.isSolid(p.c, p.r)) return true;
        }
        return false;
    }

    applyCornerCorrection(x, y, axis, map, moveAmount) {
        // axis: 0 for X movement blocked, 1 for Y movement blocked
        // We want to see if we can "slide" the player to center them on a tile 
        // if they are hitting a corner.

        const bounds = this.getBounds(x, y);
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);

        // Threshold for correction (e.g. 1/3 of tile)
        const threshold = this.tileSize * 0.4;

        // Center of the current tile
        const centerX = gridX * this.tileSize + this.tileSize / 2;
        const centerY = gridY * this.tileSize + this.tileSize / 2;

        const correctionSpeed = moveAmount; // Slide speed

        if (axis === 0) { // Blocked moving Horizontally
            // Check vertical offset
            const distY = y - centerY;
            if (Math.abs(distY) < threshold && Math.abs(distY) > 2) {
                // We are slightly offset vertically. 
                // Determine if the adjacent tile in the direction of the offset is free?
                // Actually, just push towards center.
                this.y -= Math.sign(distY) * correctionSpeed;
            }
        } else { // Blocked moving Vertically
            // Check horizontal offset
            const distX = x - centerX;
            if (Math.abs(distX) < threshold && Math.abs(distX) > 2) {
                this.x -= Math.sign(distX) * correctionSpeed;
            }
        }
    }
}
