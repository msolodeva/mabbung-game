// ========================================
// EFFECTS - Visual Effects System
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { EFFECT_CONFIG } from '../utils/constants.js';

export class Effect {
    constructor(type, x, y, options = {}) {
        this.type = type;
        this.position = new Vector2(x, y);
        this.lifetime = options.lifetime || (type === 'damageText' ? EFFECT_CONFIG.DAMAGE_TEXT_LIFETIME : 500);
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
        const screenX = this.position.x;
        const screenY = this.position.y;
        const progress = this.timer / this.lifetime;

        switch (this.type) {
            case 'hit':
                this.renderHit(ctx, screenX, screenY, progress);
                break;
            case 'heal':
                this.renderHeal(ctx, screenX, screenY, progress);
                break;
            case 'superBlast':
                this.renderSuperBlast(ctx, screenX, screenY, progress);
                break;
            case 'spikeField':
                this.renderSpikeField(ctx, screenX, screenY, progress);
                break;
            case 'explosion':
                this.renderExplosion(ctx, screenX, screenY, progress);
                break;
            case 'damageText':
                this.renderDamageText(ctx, screenX, screenY, progress);
                break;
        }
    }

    renderDamageText(ctx, x, y, progress) {
        const amount = Math.round(this.options.amount || 0);
        if (amount <= 0) return;

        const isHeavy = amount >= EFFECT_CONFIG.HEAVY_HIT_THRESHOLD || Boolean(this.options.isSuper);
        const yOffset = -progress * 42;
        const alpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);
        const popScale = progress < 0.18
            ? 0.85 + (progress / 0.18) * 0.35
            : 1.2 - Math.min(progress - 0.18, 0.3) * 0.65;

        ctx.save();
        ctx.translate(x, y + yOffset);
        ctx.scale(popScale, popScale);
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${isHeavy ? 24 : 18}px "Lilita One", Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = isHeavy ? 5 : 4;
        const label = isHeavy ? `-${amount}!` : `-${amount}`;
        ctx.strokeText(label, 0, 0);
        ctx.fillStyle = isHeavy ? '#ffd700' : '#fff3b0';
        ctx.fillText(label, 0, 0);
        ctx.restore();
    }

    renderHit(ctx, x, y, progress) {
        const size = 20 + progress * 25;
        const alpha = 1 - progress;

        // 1. High Impact Flash (Short lived)
        if (progress < 0.2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Expanding Ring
        ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.lineWidth = 4 * (1 - progress);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Debris / Sparks
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.5;
            const dist = size * (0.5 + progress * 1.5);
            const sparkX = x + Math.cos(angle) * dist;
            const sparkY = y + Math.sin(angle) * dist;

            // Randomize spark size slightly
            const sparkSize = (3 - progress * 2) * (0.8 + Math.random() * 0.4);

            ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
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


    renderExplosion(ctx, x, y, progress) {
        const size = (this.options.radius || 100) * (0.5 + progress * 0.5);
        const alpha = 1 - progress;

        // Smoke
        ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y - progress * 20, size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Fire
        const fireColors = ['#e74c3c', '#e67e22', '#f1c40f'];
        const layers = 3;

        for (let i = 0; i < layers; i++) {
            const layerProgress = (progress + i * 0.1) % 1;
            const layerSize = size * (1 - i * 0.2);
            const layerAlpha = alpha * (1 - i * 0.1);

            ctx.fillStyle = fireColors[i].replace(')', `, ${layerAlpha})`).replace('rgb', 'rgba');
            if (!ctx.fillStyle.startsWith('rgba')) {
                ctx.fillStyle = this.hexToRgba(fireColors[i], layerAlpha);
            }

            ctx.beginPath();
            // Star/Explosion shape
            const spikes = 8;
            const outerRadius = layerSize;
            const innerRadius = layerSize * 0.6;

            for (let j = 0; j < spikes * 2; j++) {
                const r = j % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / spikes) * j + progress;
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Debris
        if (progress < 0.5) {
            const debrisCount = 8;
            for (let i = 0; i < debrisCount; i++) {
                const angle = (Math.PI * 2 / debrisCount) * i;
                const dist = size * progress * 2;
                const dx = x + Math.cos(angle) * dist;
                const dy = y + Math.sin(angle) * dist;

                ctx.fillStyle = `rgba(80, 80, 80, ${alpha})`;
                ctx.fillRect(dx - 3, dy - 3, 6, 6);
            }
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
