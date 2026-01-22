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
            const toBrawler = brawler.position.subtract(this.position);
            const dot = toBrawler.dot(this.direction);
            if (dot < 0 || dot > this.width) return false;

            const perpDist = Math.abs(toBrawler.cross(this.direction));
            return perpDist < this.width / 2 + brawler.radius;
        }

        return this.collidesWith(brawler);
    }

    onHit(brawler, game) {
        brawler.takeDamage(this.damage, this.owner);
        this.hitTargets.add(brawler.id);

        // Apply knockback
        if (this.knockback > 0) {
            const knockbackDir = this.direction.clone();
            brawler.position.addInPlace(knockbackDir.multiply(this.knockback));
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
            // Draw wave shape
            ctx.fillStyle = this.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.direction.angle());
            ctx.fillRect(-10, -this.width / 2, 20, this.width);
            ctx.restore();
        } else {
            // Draw bullet
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(x, y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fill();
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
