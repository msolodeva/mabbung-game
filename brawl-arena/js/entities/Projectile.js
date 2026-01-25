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
        this.damage = config.damage || 100;
        this.radius = config.size || PROJECTILE_CONFIG.BULLET_SIZE;
        this.range = config.range || 500;
        this.owner = config.owner;
        this.team = config.team;
        this.piercing = config.piercing || false;
        this.knockback = config.knockback || 0;

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

        // Move
        const moveAmount = this.velocity.multiply(deltaTime);
        this.position.addInPlace(moveAmount);
        this.distanceTraveled = this.position.distanceTo(this.startPosition);

        // Check if out of range
        if (this.distanceTraveled >= this.range) {
            this.destroy();
            return;
        }

        // Check wall collision
        if (game.map.isPositionSolid(this.position.x, this.position.y)) {
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

        // Check bear collision
        for (const bear of game.bears) {
            if (!bear.isAlive) continue;
            if (bear.team === this.team) continue;
            // Bears use Entity IDs which are unique
            if (this.hitTargets.has(bear.id)) continue;

            if (this.collidesWith(bear)) {
                this.onHit(bear, game);
                if (!this.piercing) {
                    this.destroy();
                    return;
                }
            }
        }
    }

    checkHit(brawler) {
        if (this.projectileType === 'wave') {
            // Wide wave attack (like Poco)
            // 1. Distance check: Is the brawler within the wave's actual body?
            const toBrawler = brawler.position.subtract(this.position);
            const dist = toBrawler.magnitude();

            // The 'radius' of the wave acts as its length/thickness in the travel direction
            if (dist > this.radius + brawler.radius) return false;

            // 2. Angle/Width check: Is the brawler within the angular spread of the wave?
            const dot = toBrawler.normalize().dot(this.direction);
            // Convert width (in pixels) to an approximate angular threshold
            // Poco's wave is more of an arc.
            const angleThreshold = 0.5; // Roughly 60 degrees spread

            return dot > angleThreshold;
        }

        return this.collidesWith(brawler);
    }

    onHit(brawler, game) {
        brawler.takeDamage(this.damage, this.owner);
        this.hitTargets.add(brawler.id);

        // Apply knockback smoothly
        if (this.knockback > 0) {
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

        if (this.projectileType === 'wave') {
            // Enhanced Sound Wave (Poco/Nita Style)
            const arcAngle = Math.PI / 3; // 60 degrees

            // Multiple arcs for "echo" effect
            for (let i = 0; i < 3; i++) {
                const offset = i * 10;
                const alpha = 1 - (i * 0.3);

                ctx.beginPath();
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = 4 - i;
                ctx.arc(-offset, 0, this.radius, -arcAngle / 2, arcAngle / 2);
                ctx.stroke();
            }

            // Energy Field Fan
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, -arcAngle / 2, arcAngle / 2);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.2;
            ctx.fill();

        } else if (this.owner && this.owner.config.id === 'spike') {
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
        if (this.owner && this.owner.game) {
            const game = this.owner.game;
            const angleStep = (Math.PI * 2) / this.explodeSpikes;

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

                game.projectiles.push(spike);
            }
        }
    }
}
