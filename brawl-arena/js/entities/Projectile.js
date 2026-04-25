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
        this.isSuper = config.isSuper || false;

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
            // Wide wave attack
            // 1. Distance check: Is the brawler within the wave's actual body?
            const toBrawler = brawler.position.subtract(this.position);
            const dist = toBrawler.magnitude();

            // The 'radius' of the wave acts as its length/thickness in the travel direction
            if (dist > this.radius + brawler.radius) return false;

            // 2. Angle/Width check: Is the brawler within the angular spread of the wave?
            const dot = toBrawler.normalize().dot(this.direction);
            // Convert width (in pixels) to an approximate angular threshold
            // Wave projectiles use a broad forward arc.
            const angleThreshold = 0.5; // Roughly 60 degrees spread

            return dot > angleThreshold;
        }

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

        if (this.projectileType === 'wave') {
            // Enhanced sound wave
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

// ========================================
// HOMING MISSILE - Nita's Super Projectile
// ========================================
// 가장 가까운 적을 자동으로 추적하는 유도 미사일
export class HomingMissile extends Projectile {
    constructor(x, y, direction, config) {
        super(x, y, direction, config);
        this.projectileType = 'missile';

        // Homing properties
        this.trackingRange = config.trackingRange || 600;    // 추적 감지 범위
        this.turnSpeed = config.turnSpeed || 4;              // 방향 전환 속도 (rad/s)
        this.target = null;
        this.lifetime = config.lifetime || 3000;             // 최대 수명 (ms)
        this.elapsedTime = 0;

        // Visual properties
        this.smokeTrail = [];
        this.maxSmokeLength = 15;
        this.glowPulse = 0;
    }

    update(deltaTime, game) {
        if (!this.active) return;

        // Update lifetime
        this.elapsedTime += deltaTime * 1000;
        if (this.elapsedTime >= this.lifetime) {
            this.explodeEffect(game);
            this.destroy();
            return;
        }

        // Update glow animation
        this.glowPulse += deltaTime * 10;

        // Store smoke trail
        this.smokeTrail.unshift({
            x: this.position.x,
            y: this.position.y,
            age: 0
        });

        // Age and remove old smoke particles
        for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
            this.smokeTrail[i].age += deltaTime;
            if (this.smokeTrail[i].age > 0.5) {
                this.smokeTrail.splice(i, 1);
            }
        }

        // Find nearest enemy target
        this.findTarget(game);

        // Adjust direction towards target
        if (this.target && this.target.isAlive) {
            const toTarget = this.target.position.subtract(this.position);
            const targetAngle = Math.atan2(toTarget.y, toTarget.x);
            const currentAngle = Math.atan2(this.direction.y, this.direction.x);

            // Calculate angle difference
            let angleDiff = targetAngle - currentAngle;

            // Normalize angle to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // Apply turn speed limit
            const maxTurn = this.turnSpeed * deltaTime;
            const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

            // Update direction
            const newAngle = currentAngle + turn;
            this.direction = new Vector2(Math.cos(newAngle), Math.sin(newAngle));
        }

        // Update velocity based on direction
        this.velocity = this.direction.multiply(this.speed);

        // Move
        const moveAmount = this.velocity.multiply(deltaTime);
        this.position.addInPlace(moveAmount);
        this.distanceTraveled = this.position.distanceTo(this.startPosition);

        // Check if out of range
        if (this.distanceTraveled >= this.range) {
            this.explodeEffect(game);
            this.destroy();
            return;
        }

        // Check wall collision
        if (game.map.isPositionSolidForProjectile(this.position.x, this.position.y)) {
            this.explodeEffect(game);
            game.map.damageWallAtPosition(this.position.x, this.position.y, this.damage);
            this.destroy();
            return;
        }

        // Check brawler collision
        for (const brawler of game.brawlers) {
            if (!brawler.isAlive) continue;
            if (brawler.team === this.team) continue;
            if (this.hitTargets.has(brawler.id)) continue;

            if (this.collidesWith(brawler)) {
                this.onHit(brawler, game);
                this.explodeEffect(game);
                this.destroy();
                return;
            }
        }

        // Check bear collision
        for (const bear of game.bears) {
            if (!bear.isAlive) continue;
            if (bear.team === this.team) continue;
            if (this.hitTargets.has(bear.id)) continue;

            if (this.collidesWith(bear)) {
                this.onHit(bear, game);
                this.explodeEffect(game);
                this.destroy();
                return;
            }
        }
    }

    findTarget(game) {
        let nearestEnemy = null;
        let nearestDistance = this.trackingRange;

        // Search for enemy brawlers
        for (const brawler of game.brawlers) {
            if (!brawler.isAlive) continue;
            if (brawler.team === this.team) continue;

            const distance = this.position.distanceTo(brawler.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = brawler;
            }
        }

        // Also consider enemy bears
        for (const bear of game.bears) {
            if (!bear.isAlive) continue;
            if (bear.team === this.team) continue;

            const distance = this.position.distanceTo(bear.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = bear;
            }
        }

        this.target = nearestEnemy;
    }

    explodeEffect(game) {
        // Create explosion effect at missile position
        if (game && game.createEffect) {
            game.createEffect('explosion', this.position.x, this.position.y);
        }
    }

    render(ctx, camera) {
        if (!this.active) return;

        const x = this.position.x;
        const y = this.position.y;
        const angle = this.direction.angle();

        // 1. Draw smoke trail
        for (let i = 0; i < this.smokeTrail.length; i++) {
            const smoke = this.smokeTrail[i];
            const alpha = 1 - (smoke.age / 0.5);
            const size = 6 * (1 - smoke.age / 0.5);

            ctx.beginPath();
            ctx.fillStyle = `rgba(150, 150, 150, ${alpha * 0.6})`;
            ctx.arc(smoke.x, smoke.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Draw flame trail
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Flame behind missile
        const flameLength = 20 + Math.sin(this.glowPulse * 2) * 5;
        const flameGradient = ctx.createLinearGradient(-flameLength - 15, 0, -15, 0);
        flameGradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
        flameGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.8)');
        flameGradient.addColorStop(1, 'rgba(255, 200, 50, 1)');

        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-flameLength - 15, -5);
        ctx.lineTo(-flameLength - 20, 0);
        ctx.lineTo(-flameLength - 15, 5);
        ctx.closePath();
        ctx.fillStyle = flameGradient;
        ctx.fill();

        // 3. Draw missile body
        // Glow effect
        const glowSize = 18 + Math.sin(this.glowPulse) * 3;
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = '#e74c3c';

        // Missile body (rocket shape)
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(15, 0);  // Nose
        ctx.lineTo(-10, -8);
        ctx.lineTo(-15, -8);
        ctx.lineTo(-15, 8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();

        // Metallic shine
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 2);
        ctx.closePath();
        ctx.fill();

        // Nose tip
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(10, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Fins
        ctx.fillStyle = '#922b21';
        // Top fin
        ctx.beginPath();
        ctx.moveTo(-12, -8);
        ctx.lineTo(-18, -15);
        ctx.lineTo(-18, -8);
        ctx.closePath();
        ctx.fill();
        // Bottom fin
        ctx.beginPath();
        ctx.moveTo(-12, 8);
        ctx.lineTo(-18, 15);
        ctx.lineTo(-18, 8);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();

        // 4. Draw tracking indicator if target exists
        if (this.target && this.target.isAlive) {
            const toTarget = this.target.position.subtract(this.position);
            const dist = toTarget.magnitude();

            // Draw faint tracking line
            ctx.beginPath();
            ctx.strokeStyle = `rgba(231, 76, 60, ${0.2 + Math.sin(this.glowPulse * 3) * 0.1})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);
            ctx.moveTo(x, y);
            ctx.lineTo(this.target.position.x, this.target.position.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw target reticle
            const targetX = this.target.position.x;
            const targetY = this.target.position.y;
            const reticleSize = 20 + Math.sin(this.glowPulse * 2) * 5;

            ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + Math.sin(this.glowPulse * 3) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(targetX, targetY, reticleSize, 0, Math.PI * 2);
            ctx.stroke();

            // Corner brackets
            const bracketSize = 8;
            ctx.beginPath();
            // Top-left
            ctx.moveTo(targetX - reticleSize, targetY - bracketSize);
            ctx.lineTo(targetX - reticleSize, targetY - reticleSize);
            ctx.lineTo(targetX - bracketSize, targetY - reticleSize);
            // Top-right
            ctx.moveTo(targetX + bracketSize, targetY - reticleSize);
            ctx.lineTo(targetX + reticleSize, targetY - reticleSize);
            ctx.lineTo(targetX + reticleSize, targetY - bracketSize);
            // Bottom-right
            ctx.moveTo(targetX + reticleSize, targetY + bracketSize);
            ctx.lineTo(targetX + reticleSize, targetY + reticleSize);
            ctx.lineTo(targetX + bracketSize, targetY + reticleSize);
            // Bottom-left
            ctx.moveTo(targetX - bracketSize, targetY + reticleSize);
            ctx.lineTo(targetX - reticleSize, targetY + reticleSize);
            ctx.lineTo(targetX - reticleSize, targetY + bracketSize);
            ctx.stroke();
        }
    }
}
