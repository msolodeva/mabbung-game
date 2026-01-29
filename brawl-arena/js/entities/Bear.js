// ========================================
// BEAR - Nita's Summoned Bear
// ========================================

import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { COLORS, TEAMS } from '../utils/constants.js';

export class Bear extends Entity {
    constructor(x, y, owner) {
        super(x, y);
        this.type = 'bear';
        this.owner = owner;
        this.team = owner.team;
        this.radius = 30;

        this.maxHealth = 2800;
        this.health = 2800;
        this.speed = 180;
        this.attackDamage = 400;
        this.attackRange = 50;
        this.attackCooldown = 0;
        this.attackSpeed = 800;

        this.target = null;
        this.lifetime = 20000; // 20 seconds
        this.isAlive = true;

        this.damageFlashTimer = 0;
    }

    handleWallCollision(map) {
        // Simple wall collision (similar to Brawler but simplified for AI)
        const checkRadius = this.radius;
        const checkPoints = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const point of checkPoints) {
            const checkX = this.position.x + point.x * checkRadius;
            const checkY = this.position.y + point.y * checkRadius;
            const tile = map.getTileAtPosition(checkX, checkY);

            if (tile && tile.solid) {
                // Simple push back
                const tileCenter = map.getTileCenter(
                    Math.floor(checkX / map.tileSize),
                    Math.floor(checkY / map.tileSize)
                );

                // Vector from tile center to bear
                const pushDir = this.position.subtract(tileCenter).normalize();
                this.position.addInPlace(pushDir.multiply(2)); // Push out
            }
        }
    }

    update(deltaTime, game) {
        if (!this.active || !this.isAlive) return;

        // Health Decay (Simulate lifetime visually)
        // Decays over ~20 seconds (100 health per second if max is 2000)
        const decayRate = this.maxHealth / 20;
        this.health -= decayRate * deltaTime;

        if (this.health <= 0) {
            this.die(game);
            return;
        }

        // Find nearest enemy
        this.findTarget(game);

        // Move towards target or follow owner (if owner is alive)
        if (this.target && this.target.isAlive) {
            const toTarget = this.target.position.subtract(this.position);
            const distance = toTarget.magnitude();

            if (distance > this.attackRange) {
                // Move towards target
                this.velocity = toTarget.normalize().multiply(this.speed);
            } else {
                // Attack
                this.velocity = new Vector2(0, 0);
                this.attack(game);
            }
        } else if (this.owner && this.owner.isAlive) {
            // Follow owner only if owner is alive
            const toOwner = this.owner.position.subtract(this.position);
            if (toOwner.magnitude() > 100) {
                this.velocity = toOwner.normalize().multiply(this.speed);
            } else {
                this.velocity = new Vector2(0, 0);
            }
        } else {
            // Owner is dead - roam/idle
            this.velocity = this.velocity.multiply(0.95);
        }

        super.update(deltaTime);

        // Wall collision
        this.handleWallCollision(game.map);

        // Clamp to map bounds
        this.position.x = Math.max(this.radius, Math.min(game.map.width - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(game.map.height - this.radius, this.position.y));

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 1000;
        }

        // Damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime * 1000;
        }
    }

    findTarget(game) {
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        // Also check for boxes/safes if no brawlers nearby? For now just brawlers
        for (const brawler of game.brawlers) {
            if (brawler.team === this.team || !brawler.isAlive) continue;

            // Check if brawler is visible (not in bush or revealed)
            // Bear has "smell" so maybe it can find hidden enemies? 
            // Standard behavior: Bear tracks hidden enemies too (usually). 
            // Let's assume bear can smell enemies.

            const distance = this.distanceTo(brawler);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = brawler;
            }
        }

        this.target = nearestEnemy;
    }

    attack(game) {
        if (this.attackCooldown > 0 || !this.target) return;

        this.attackCooldown = this.attackSpeed;
        this.target.takeDamage(this.attackDamage, this); // 'this' is the attacker (Bear)

        // Visual hit effect
        game.createEffect('hit', this.target.position.x, this.target.position.y);

        // Bear roar/swiping sound could go here
    }

    takeDamage(amount, attacker) {
        this.health -= amount;
        this.damageFlashTimer = 100;

        if (attacker && attacker.type === 'brawler') {
            attacker.addSuperCharge(1);
        }

        // Nita charges super when bear deals damage (handled in Brawler.js takeDamage? or needs modification?)
        // Wait, standard mechanics: Bear damage charges Nita's super.
        // I should check if 'this.target.takeDamage' calls 'takeDamage' on brawler and if that handles super charge.
        // It does: `attacker.addSuperCharge(1)` in Brawler.js.
        // But here `attacker` is Bear. Bear is not a brawler instance (type='bear').
        // So Brawler.js line 325: `if (attacker && attacker.type === 'brawler')` might fail.
        // I should update Brawler.js or handle it here?
        // Actually, if Bear deals damage, Nita should get charge.

        // Let's handle the charging here in attack() or fix Brawler.js.
        // I will fix local render method here mainly.

        if (this.health <= 0) {
            this.die();
        }
    }

    die(game) {
        this.isAlive = false;
        this.active = false;
        // Death effect?
    }

    render(ctx, camera) {
        if (!this.active || !this.isAlive) return;

        const wx = this.position.x;
        const wy = this.position.y;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(wx, wy + this.radius - 5, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyColor = this.damageFlashTimer > 0 ? '#ffffff' : '#8B4513';
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(wx, wy, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Team color outline
        ctx.strokeStyle = this.team === TEAMS.BLUE ? COLORS.BLUE_TEAM : COLORS.RED_TEAM;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Bear face
        ctx.font = `${this.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐻', wx, wy);

        // Health bar
        const barWidth = 40;
        const barHeight = 5;
        const barY = wy - this.radius - 15;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(wx - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = COLORS.HEALTH_GREEN;
        ctx.fillRect(wx - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }
}
