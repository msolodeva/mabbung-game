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

        this.maxHealth = 2000;
        this.health = 2000;
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

    update(deltaTime, game) {
        if (!this.active || !this.isAlive) return;

        // Lifetime countdown
        this.lifetime -= deltaTime * 1000;
        if (this.lifetime <= 0) {
            this.die(game);
            return;
        }

        // Find nearest enemy
        this.findTarget(game);

        // Move towards target or follow owner
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
        } else {
            // Follow owner
            const toOwner = this.owner.position.subtract(this.position);
            if (toOwner.magnitude() > 100) {
                this.velocity = toOwner.normalize().multiply(this.speed);
            } else {
                this.velocity = new Vector2(0, 0);
            }
        }

        super.update(deltaTime);

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

        for (const brawler of game.brawlers) {
            if (brawler.team === this.team || !brawler.isAlive) continue;

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
        this.target.takeDamage(this.attackDamage, this);
        game.createEffect('hit', this.target.position.x, this.target.position.y);
    }

    takeDamage(amount, attacker) {
        this.health -= amount;
        this.damageFlashTimer = 100;

        if (attacker && attacker.type === 'brawler') {
            attacker.addSuperCharge(1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die(game) {
        this.isAlive = false;
        this.active = false;
    }

    render(ctx, camera) {
        if (!this.active || !this.isAlive) return;

        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + this.radius - 5, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyColor = this.damageFlashTimer > 0 ? '#ffffff' : '#8B4513';
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Team color outline
        ctx.strokeStyle = this.team === TEAMS.BLUE ? COLORS.BLUE_TEAM : COLORS.RED_TEAM;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Bear face
        ctx.font = `${this.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐻', screenX, screenY);

        // Health bar
        const barWidth = 40;
        const barHeight = 5;
        const barY = screenY - this.radius - 15;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = COLORS.HEALTH_GREEN;
        ctx.fillRect(screenX - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }
}
