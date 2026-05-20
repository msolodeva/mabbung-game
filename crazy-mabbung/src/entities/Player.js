export class Player {
    constructor(startCol, startRow, tileSize, color, controls, customTexture = null) {
        this.tileSize = tileSize;
        this.color = color;
        this.customTexture = customTexture;

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

        // Animation State
        this.facing = 'DOWN'; // UP, DOWN, LEFT, RIGHT
        this.animTimer = 0;
        this.frame = 0;
        this.isMoving = false;
    }

    getVisualState(now = Date.now()) {
        const motion = Math.hypot(this.moveDir.x, this.moveDir.y);
        const motionAmount = Math.min(1, motion / 5);
        const horizontalLean = this.facing === 'LEFT' ? -1 : (this.facing === 'RIGHT' ? 1 : 0);
        const urgency = this.state === 'TRAPPED'
            ? Math.max(0, Math.min(1, 1 - this.trappedTimer / 5000))
            : 0;

        return {
            teamAccent: this.color,
            motionAmount,
            rotation: this.isMoving ? horizontalLean * (0.045 + motionAmount * 0.035) : 0,
            trailOpacity: this.isMoving ? 0.12 + motionAmount * 0.18 : 0,
            shadowScaleX: this.isMoving ? 1.16 + motionAmount * 0.18 : 1,
            shadowScaleY: this.isMoving ? 0.82 : 1,
            dustPhase: (Math.sin(now / 80) + 1) / 2,
            bubbleVisible: this.state === 'TRAPPED',
            bubblePulse: this.state === 'TRAPPED' ? (Math.sin(now / 120) + 1) / 2 : 0,
            urgency
        };
    }

    update(deltaTime, map, input, game) {
        if (this.state === 'DEAD') return;

        if (this.state === 'TRAPPED') {
            this.trappedTimer -= deltaTime;
            if (this.trappedTimer <= 0) {
                this.state = 'DEAD';
                console.log("Player Died!");
            }
            return; // Cannot move while trapped
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
        this.moveDir.x = dx;
        this.moveDir.y = dy;

        // Update Facing Direction
        if (dx < 0) this.facing = 'LEFT';
        else if (dx > 0) this.facing = 'RIGHT';
        else if (dy < 0) this.facing = 'UP';
        else if (dy > 0) this.facing = 'DOWN';

        // Animation Timer
        if (this.isMoving) {
            this.animTimer += deltaTime;
            const msPerFrame = 120; // 120ms per frame for walking
            if (this.animTimer > msPerFrame) {
                this.frame++;
                this.animTimer = 0;
            }
        } else {
            this.frame = 0;
            this.animTimer = 0;
        }

        // Move X
        if (dx !== 0) {
            const newX = this.x + dx;
            const collision = this.checkCollision(newX, this.y, map);
            if (!collision) {
                this.x = newX;
            } else {
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

        let sheet = this.customTexture;
        if (!sheet) sheet = assets.get('spritesheet_characters');
        const visual = this.getVisualState();

        this.drawGroundEffects(ctx, visual);

        if (sheet && (sheet.width || sheet.naturalWidth) > 0) {
            // Calculate Row
            let baseRow = 0; // Default (Red position)
            // Only use built-in color logic if no custom texture
            if (!this.customTexture && this.color === '#3498db') baseRow = 3; // Blue

            let rowOffset = 0; // Offset from baseRow (0: Front/Back, 1: Side, 2: Trapped)
            let col = 0;
            let scaleX = 1;
            let scaleY = 1;
            let offsetY = 0;

            if (this.state === 'TRAPPED') {
                rowOffset = 2; // Trapped Row
                const trapFrame = Math.floor(Date.now() / 150) % 6;
                col = trapFrame;
                offsetY = Math.sin(Date.now() / 400) * 3 - 3; // Floating effect
            }
            else if (this.isMoving) {
                // WALKING ANIMATION
                // Dynamic Bounce
                offsetY = Math.abs(Math.sin(Date.now() / 100)) * -3;

                if (this.facing === 'LEFT' || this.facing === 'RIGHT') {
                    rowOffset = 1; // Side Row
                    col = this.frame % 8; // 8 frames for side walk
                    if (this.facing === 'LEFT') scaleX = -1; // Flip for Left
                } else if (this.facing === 'UP') {
                    rowOffset = 0; // Front/Back Row
                    col = 4 + (this.frame % 4); // Back walk frames are 4-7
                } else { // DOWN
                    rowOffset = 0; // Front/Back Row
                    col = this.frame % 4; // Front walk frames are 0-3
                }
            }
            else {
                // IDLE ANIMATION
                // Breathing Effect
                scaleY = 1 + Math.sin(Date.now() / 800) * 0.02;

                if (this.facing === 'LEFT' || this.facing === 'RIGHT') {
                    rowOffset = 1; // Side Row
                    col = 0; // Standing frame for side
                    if (this.facing === 'LEFT') scaleX = -1;
                } else if (this.facing === 'UP') {
                    rowOffset = 0; // Front/Back Row
                    col = 4; // Standing frame for back
                } else { // DOWN
                    rowOffset = 0; // Front/Back Row
                    col = 0; // Standing frame for front
                }
            }

            const frameRow = baseRow + rowOffset;
            const width = sheet.width || sheet.naturalWidth;
            const height = sheet.height || sheet.naturalHeight;
            const frameCount = 8;
            const rowCount = 6;

            const sw = width / frameCount;
            const sh = height / rowCount;
            const sx = col * sw;
            const sy = frameRow * sh;

            const x = this.x;
            const y = this.y - 14 + offsetY; // Lifted slightly
            const size = this.tileSize * 1.4; // Slightly larger sprite

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(visual.rotation);
            ctx.scale(scaleX, scaleY); // Apply flip and breathing

            // Draw Character
            ctx.shadowColor = visual.teamAccent;
            ctx.shadowBlur = this.state === 'TRAPPED' ? 10 : 3;
            ctx.drawImage(sheet, sx, sy, sw, sh, -size / 2, -size / 2, size, size);

            ctx.restore();
        } else {
            // Fallback Rendering
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();

            // Direction Indicator
            const dirX = (this.facing === 'RIGHT') ? 1 : (this.facing === 'LEFT' ? -1 : 0);
            const dirY = (this.facing === 'DOWN') ? 1 : (this.facing === 'UP' ? -1 : 0);

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + dirX * 10, this.y + dirY * 10);
            ctx.stroke();
        }

        this.drawStatusEffects(ctx, visual);
    }

    drawGroundEffects(ctx, visual) {
        const footY = this.y + this.tileSize * 0.3;
        const shadowWidth = this.tileSize * 0.45 * visual.shadowScaleX;
        const shadowHeight = this.tileSize * 0.14 * visual.shadowScaleY;

        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(this.x, footY, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = visual.teamAccent;
        ctx.globalAlpha = this.state === 'TRAPPED' ? 0.55 : 0.34;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(this.x, footY - 2, this.tileSize * 0.31, this.tileSize * 0.1, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (visual.trailOpacity > 0) {
            const dx = this.moveDir.x;
            const dy = this.moveDir.y;
            const mag = Math.max(1, Math.hypot(dx, dy));
            const ux = dx / mag;
            const uy = dy / mag;

            ctx.lineCap = 'round';
            ctx.strokeStyle = visual.teamAccent;
            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = visual.trailOpacity / i;
                ctx.lineWidth = Math.max(2, 7 - i * 1.4);
                ctx.beginPath();
                ctx.moveTo(this.x - ux * (12 + i * 7), footY - uy * (8 + i * 5));
                ctx.lineTo(this.x - ux * (24 + i * 10), footY - uy * (14 + i * 7));
                ctx.stroke();
            }

            ctx.globalAlpha = 0.22 + visual.dustPhase * 0.16;
            ctx.fillStyle = '#f8f1d8';
            for (let i = 0; i < 2; i++) {
                const side = i === 0 ? -1 : 1;
                ctx.beginPath();
                ctx.arc(
                    this.x - ux * 18 + side * uy * 8,
                    footY - uy * 12 - side * ux * 5,
                    2.2 + visual.dustPhase * 1.5,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawStatusEffects(ctx, visual) {
        if (!visual.bubbleVisible) return;

        const radius = this.tileSize * (0.46 + visual.bubblePulse * 0.05);
        const urgencyAlpha = 0.18 + visual.urgency * 0.26;

        ctx.save();
        ctx.strokeStyle = `rgba(126, 214, 223, ${0.52 + visual.urgency * 0.28})`;
        ctx.fillStyle = `rgba(126, 214, 223, ${urgencyAlpha})`;
        ctx.lineWidth = 3 + visual.bubblePulse * 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 12, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 + visual.bubblePulse * 0.25})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x - radius * 0.22, this.y - 22, radius * 0.32, Math.PI * 1.05, Math.PI * 1.72);
        ctx.stroke();
        ctx.restore();
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
