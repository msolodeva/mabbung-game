// ========================================
// PROJECTILE - Projectile Entity
// ========================================

import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { PROJECTILE_CONFIG } from '../utils/constants.js';

export class Projectile extends Entity {
    constructor(x, y, direction, config) {
        super(x, y);
        this.type = 'projectile';
        this.direction = direction.normalize();
        this.speed = config.speed || PROJECTILE_CONFIG.BULLET_SPEED;
        this.damage = config.damage ?? 100;
        this.radius = config.size || PROJECTILE_CONFIG.BULLET_SIZE;
        this.range = config.range || 500;
        this.owner = config.owner;
        this.team = config.team;
        this.piercing = config.piercing || false;
        this.knockback = config.knockback || 0;
        this.isSuper = config.isSuper || false;
        this.game = config.game || null;

        this.velocity = this.direction.multiply(this.speed);
        this.distanceTraveled = 0;
        this.startPosition = new Vector2(x, y);

        // Visual
        this.color = config.color || '#ffff00';
        this.trailLength = config.trailLength || 3;
        this.trail = [];

        // Special projectile types
        this.projectileType = config.projectileType || 'bullet';
        this.width = config.width || this.radius * 2;
        this.hitTargets = new Set();
    }

    update(deltaTime, game) {
        if (!this.active) return;

        // Store trail position
        this.trail.unshift(this.position.clone());
        if (this.trail.length > this.trailLength) {
            this.trail.pop();
        }

        // Small spatial steps keep fast shots from skipping targets or wall tiles.
        const travel = Math.min(this.speed * Math.max(0, deltaTime), Math.max(0, this.range - this.distanceTraveled));
        const steps = Math.max(1, Math.ceil(travel / PROJECTILE_CONFIG.COLLISION_STEP));
        const step = this.direction.multiply(travel / steps);
        for (let i = 0; i < steps && this.active; i++) {
            this.position.addInPlace(step);
            this.distanceTraveled += travel / steps;
            this.checkCollisions(game);
        }
        if (this.active && this.distanceTraveled >= this.range) this.destroy();
    }

    checkCollisions(game) {
        // Check wall collision (projectiles can pass over water)
        if (game.map.isPositionSolidForProjectile(this.position.x, this.position.y)) {
            // Check if it's a destructible wall
            const destroyed = game.map.damageWallAtPosition(this.position.x, this.position.y, this.damage);
            this.destroy();
            return;
        }

        // Check brawler collision
        for (const brawler of game.brawlers) {
            if (!brawler.isAlive) continue;
            if (brawler.team === this.team) continue;
            if (this.hitTargets.has(brawler.id)) continue;

            if (this.checkHit(brawler)) {
                this.onHit(brawler, game);
                if (!this.piercing) {
                    this.destroy();
                    return;
                }
            }
        }
    }

    checkHit(brawler) {
        return this.collidesWith(brawler);
    }

    onHit(brawler, game) {
        brawler.takeDamage(this.damage, this.owner, this);
        this.hitTargets.add(brawler.id);

        // Apply knockback smoothly (only if target has applyKnockback method)
        if (this.knockback > 0 && typeof brawler.applyKnockback === 'function') {
            const knockbackDir = this.direction.clone();
            brawler.applyKnockback(knockbackDir, this.knockback);
        }

        // Create hit effect
        game.createEffect('hit', brawler.position.x, brawler.position.y);
    }

    render(ctx, camera) {
        if (!this.active) return;

        const x = this.position.x;
        const y = this.position.y;
        const angle = this.direction.angle();

        // 1. Draw Trail (Tapering)
        if (this.trail.length > 0) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Draw as a continuous line for smoothness
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let i = 0; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }

            // Gradient trail
            const trailGrad = ctx.createLinearGradient(x, y, this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y);
            trailGrad.addColorStop(0, this.color);
            trailGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = this.radius * 1.5;
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // 2. Draw Projectile Body
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        if (this.owner && this.owner.config.id === 'spike') {
            // Spike Thorns
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Thorn shape
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, this.radius * 0.6);
            ctx.lineTo(-this.radius * 0.5, 0);
            ctx.lineTo(-this.radius, -this.radius * 0.6);
            ctx.closePath();
            ctx.fill();

            // Spin animation for spikes
            const time = performance.now() * 0.02;
            ctx.rotate(time); // Add extra spin on top of direction

        } else {
            // Standard Bullet / Plasmoid
            // Elongated Capsule Shape
            ctx.fillStyle = '#ffffff'; // White hot core
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            // Draw a teardrop/capsule shape
            ctx.ellipse(0, 0, this.radius * 1.5, this.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Colored Aura
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(-5, 0, this.radius * 1.8, this.radius, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Specialized projectile for explosive attacks (Spike)
export class ExplosiveProjectile extends Projectile {
    constructor(x, y, direction, config) {
        super(x, y, direction, config);
        this.explodeSpikes = config.explodeSpikes || 6;
        this.explodeSpikeDamage = config.explodeSpikeDamage || 100;
        this.hasExploded = false;
    }

    destroy() {
        if (!this.hasExploded) {
            this.explode();
            this.hasExploded = true;
        }
        super.destroy();
    }

    explode() {
        // Create spike projectiles in all directions
        if (this.game) {
            const game = this.game;
            const angleStep = (Math.PI * 2) / this.explodeSpikes;
            const sharedHitTargets = new Set();

            for (let i = 0; i < this.explodeSpikes; i++) {
                const angle = angleStep * i;
                const dir = Vector2.fromAngle(angle);

                const spike = new Projectile(this.position.x, this.position.y, dir, {
                    speed: 400,
                    damage: this.explodeSpikeDamage,
                    size: 6,
                    range: 100,
                    owner: this.owner,
                    team: this.team,
                    color: '#27ae60',
                });
                // A split burst may damage each target only once, even when
                // several spikes overlap at the center of the explosion.
                spike.hitTargets = sharedHitTargets;

                game.projectiles.push(spike);
            }
        }
    }
}
