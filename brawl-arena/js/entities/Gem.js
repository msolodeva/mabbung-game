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
        this.radius = 15; // Slightly larger
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2;
        this.glowPhase = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.collected = false;
    }

    update(deltaTime, game) {
        if (!this.active) return;

        // Dynamic animations
        this.bobOffset += deltaTime * this.bobSpeed;
        this.glowPhase += deltaTime * 4;
        this.rotation += deltaTime * 2;

        // Check collection
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

        const x = this.position.x;
        const y = this.position.y;
        const bob = Math.sin(this.bobOffset) * 8;
        const pulse = 1 + Math.sin(this.glowPhase) * 0.2;

        ctx.save();

        // 1. Vertical Light Beam (Premium Effect)
        const beamGrad = ctx.createLinearGradient(x, y + bob, x, y + bob - 100);
        beamGrad.addColorStop(0, 'rgba(155, 89, 182, 0.4)');
        beamGrad.addColorStop(1, 'rgba(155, 89, 182, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(x - 15 * pulse, y + bob - 100, 30 * pulse, 100);

        // 2. Large Radial Glow
        const glowSize = 40 * pulse;
        const radialGrad = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, glowSize);
        radialGrad.addColorStop(0, 'rgba(155, 89, 182, 0.7)');
        radialGrad.addColorStop(0.5, 'rgba(155, 89, 182, 0.2)');
        radialGrad.addColorStop(1, 'rgba(155, 89, 182, 0)');
        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(x, y + bob, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // 3. Gem Shape (Rotating Diamond)
        ctx.translate(x, y + bob);
        ctx.rotate(this.rotation);
        ctx.scale(pulse, pulse);

        // Shadow inside
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#9b59b6';

        // Main Diamond
        ctx.fillStyle = COLORS.GEM;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.8, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.8, 0);
        ctx.closePath();
        ctx.fill();

        // Facets for depth
        ctx.fillStyle = COLORS.GEM_GLOW;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.4, -2);
        ctx.lineTo(0, 2);
        ctx.lineTo(-this.radius * 0.4, -2);
        ctx.closePath();
        ctx.fill();

        // Sparkle
        ctx.fillStyle = '#ffffff';
        const sparkleSize = 3 + Math.sin(this.glowPhase * 2) * 1.5;
        ctx.beginPath();
        ctx.arc(-4, -5, sparkleSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
