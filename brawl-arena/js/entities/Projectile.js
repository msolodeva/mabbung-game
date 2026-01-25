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

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const trailPos = this.trail[i];
            const alpha = 1 - (i / this.trail.length);
            const size = this.radius * (1 - i / this.trail.length * 0.5);

            ctx.fillStyle = this.color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw projectile
        if (this.projectileType === 'wave') {
            // Draw actual sound wave arc (Poco style)
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.direction.angle());

            // Draw a stylish arc that represents the hitbox
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            const arcAngle = Math.PI / 3; // 60 degrees matching the collision logic
            ctx.arc(0, 0, this.radius, -arcAngle / 2, arcAngle / 2);
            ctx.stroke();

            // Inner fill for better visibility
            ctx.globalAlpha = 0.3;
            ctx.lineTo(0, 0);
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.restore();
        } else {
            // Draw bullet / pellet
            ctx.fillStyle = 'white'; // Core for better visibility
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Glow / Outer part
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Flashy glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
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
