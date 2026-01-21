// ========================================
// GEM - Collectible Gem Entity
// ========================================

import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { COLORS, GEM_CONFIG } from '../utils/constants.js';

export class Gem extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'gem';
        this.radius = 12;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 3;
        this.glowPhase = 0;
        this.collected = false;
    }

    update(deltaTime, game) {
        if (!this.active) return;

        // Bobbing animation
        this.bobOffset += deltaTime * this.bobSpeed;
        this.glowPhase += deltaTime * 5;

        // Check if any brawler can collect
        for (const brawler of game.brawlers) {
            if (!brawler.isAlive) continue;
            if (this.distanceTo(brawler) < GEM_CONFIG.COLLECT_RADIUS) {
                this.collect(brawler, game);
                return;
            }
        }
    }

    collect(brawler, game) {
        this.collected = true;
        this.active = false;
        brawler.collectGem();
        game.onGemCollected(brawler);
    }

    render(ctx, camera) {
        if (!this.active) return;

        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y + Math.sin(this.bobOffset) * 5;

        // Glow effect
        const glowSize = 20 + Math.sin(this.glowPhase) * 5;
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
        gradient.addColorStop(0, 'rgba(155, 89, 182, 0.6)');
        gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Gem shape (diamond)
        ctx.fillStyle = COLORS.GEM;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - this.radius);
        ctx.lineTo(screenX + this.radius * 0.7, screenY);
        ctx.lineTo(screenX, screenY + this.radius);
        ctx.lineTo(screenX - this.radius * 0.7, screenY);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = COLORS.GEM_GLOW;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - this.radius);
        ctx.lineTo(screenX + this.radius * 0.3, screenY - 2);
        ctx.lineTo(screenX, screenY + 2);
        ctx.lineTo(screenX - this.radius * 0.3, screenY - 2);
        ctx.closePath();
        ctx.fill();

        // Sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
