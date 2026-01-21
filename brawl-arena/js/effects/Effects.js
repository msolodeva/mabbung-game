// ========================================
// EFFECTS - Visual Effects System
// ========================================

import { Vector2 } from '../utils/Vector2.js';

export class Effect {
    constructor(type, x, y, options = {}) {
        this.type = type;
        this.position = new Vector2(x, y);
        this.lifetime = options.lifetime || 500;
        this.timer = 0;
        this.active = true;
        this.options = options;
    }

    update(deltaTime) {
        this.timer += deltaTime * 1000;
        if (this.timer >= this.lifetime) {
            this.active = false;
        }
    }

    render(ctx, camera) {
        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;
        const progress = this.timer / this.lifetime;

        switch (this.type) {
            case 'hit':
                this.renderHit(ctx, screenX, screenY, progress);
                break;
            case 'heal':
                this.renderHeal(ctx, screenX, screenY, progress);
                break;
            case 'healWave':
                this.renderHealWave(ctx, screenX, screenY, progress);
                break;
            case 'superBlast':
                this.renderSuperBlast(ctx, screenX, screenY, progress);
                break;
            case 'summon':
                this.renderSummon(ctx, screenX, screenY, progress);
                break;
            case 'spikeField':
                this.renderSpikeField(ctx, screenX, screenY, progress);
                break;
            case 'gemCollect':
                this.renderGemCollect(ctx, screenX, screenY, progress);
                break;
        }
    }

    renderHit(ctx, x, y, progress) {
        const size = 20 + progress * 20;
        const alpha = 1 - progress;

        ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();

        // Sparks
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + progress * 2;
            const sparkX = x + Math.cos(angle) * size;
            const sparkY = y + Math.sin(angle) * size;

            ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHeal(ctx, x, y, progress) {
        const size = 15 + progress * 30;
        const alpha = 1 - progress;
        const yOffset = -progress * 40;

        // Plus sign
        ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
        ctx.fillRect(x - 3, y + yOffset - 12, 6, 24);
        ctx.fillRect(x - 12, y + yOffset - 3, 24, 6);

        // Glow
        const gradient = ctx.createRadialGradient(x, y + yOffset, 0, x, y + yOffset, size);
        gradient.addColorStop(0, `rgba(46, 204, 113, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y + yOffset, size, 0, Math.PI * 2);
        ctx.fill();
    }

    renderHealWave(ctx, x, y, progress) {
        const radius = this.options.radius || 200;
        const currentRadius = radius * progress;
        const alpha = 1 - progress;

        ctx.strokeStyle = `rgba(46, 204, 113, ${alpha})`;
        ctx.lineWidth = 5 - progress * 4;
        ctx.beginPath();
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderSuperBlast(ctx, x, y, progress) {
        const size = 30 + progress * 50;
        const alpha = 1 - progress;

        // Shockwave rings
        for (let i = 0; i < 3; i++) {
            const ringProgress = (progress + i * 0.1) % 1;
            const ringSize = size * (0.5 + ringProgress * 0.5);
            const ringAlpha = alpha * (1 - ringProgress);

            ctx.strokeStyle = `rgba(255, 200, 50, ${ringAlpha})`;
            ctx.lineWidth = 4 - ringProgress * 3;
            ctx.beginPath();
            ctx.arc(x, y, ringSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Flash
        if (progress < 0.2) {
            const flashAlpha = (0.2 - progress) * 5;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, `rgba(255, 255, 200, ${flashAlpha})`);
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderSummon(ctx, x, y, progress) {
        const size = 40;
        const alpha = 1 - progress;

        // Summoning circle
        ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size * (1 - progress * 0.3), 0, Math.PI * 2);
        ctx.stroke();

        // Spinning runes
        const runeCount = 6;
        for (let i = 0; i < runeCount; i++) {
            const angle = (Math.PI * 2 / runeCount) * i + progress * 5;
            const runeX = x + Math.cos(angle) * size * 0.6;
            const runeY = y + Math.sin(angle) * size * 0.6;

            ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rising energy
        if (progress < 0.5) {
            const energyAlpha = (0.5 - progress) * 2;
            ctx.fillStyle = `rgba(231, 76, 60, ${energyAlpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, size * (1 + progress), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderSpikeField(ctx, x, y, progress) {
        // Initial flash
        if (progress < 0.1) {
            const flashAlpha = (0.1 - progress) * 10;
            const radius = this.options.radius || 150;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(39, 174, 96, ${flashAlpha * 0.8})`);
            gradient.addColorStop(1, 'rgba(39, 174, 96, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderGemCollect(ctx, x, y, progress) {
        const size = 10 + progress * 20;
        const alpha = 1 - progress;
        const yOffset = -progress * 30;

        // Sparkles
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i + progress * 3;
            const dist = size * 0.8;
            const sparkX = x + Math.cos(angle) * dist;
            const sparkY = y + yOffset + Math.sin(angle) * dist;

            ctx.fillStyle = `rgba(155, 89, 182, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center glow
        ctx.fillStyle = `rgba(155, 89, 182, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y + yOffset, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class EffectsManager {
    constructor() {
        this.effects = [];
    }

    add(type, x, y, options) {
        this.effects.push(new Effect(type, x, y, options));
    }

    update(deltaTime) {
        for (const effect of this.effects) {
            effect.update(deltaTime);
        }
        this.effects = this.effects.filter(e => e.active);
    }

    render(ctx, camera) {
        for (const effect of this.effects) {
            effect.render(ctx, camera);
        }
    }

    clear() {
        this.effects = [];
    }
}
