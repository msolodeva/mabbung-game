// ========================================
// BRAWLER - Base Brawler Class
// ========================================

import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { COLORS, TEAMS } from '../utils/constants.js';

export class Brawler extends Entity {
    constructor(config, team, x = 0, y = 0) {
        super(x, y);
        this.type = 'brawler';
        this.config = config;
        this.team = team;
        this.isPlayer = false;
        this.radius = 25;

        // Stats from config
        this.maxHealth = config.health;
        this.health = config.health;
        this.speed = config.speed;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;

        // Ammo system
        this.ammoMax = config.ammoMax;
        this.ammo = config.ammoMax;
        this.ammoReloadTime = config.ammoReloadTime;
        this.reloadTimer = 0;

        // Attack timing
        this.attackSpeed = config.attackSpeed;
        this.attackCooldown = 0;

        // Super charge
        this.superCharge = 0;
        this.superChargeMax = config.superCharge;
        this.superReady = false;

        // Gem grab
        this.gems = 0;

        // State
        this.isAlive = true;
        this.respawnTimer = 0;
        this.isInBush = false;
        this.isVisible = true;
        this.facingAngle = 0;
        this.isAttacking = false;

        // Movement
        this.moveDirection = new Vector2(0, 0);
        this.aimDirection = new Vector2(1, 0);

        // Visual
        this.damageFlashTimer = 0;
        this.color = team === TEAMS.BLUE ? COLORS.BLUE_TEAM : COLORS.RED_TEAM;
    }

    update(deltaTime, game) {
        if (!this.isAlive) {
            this.respawnTimer -= deltaTime * 1000;
            if (this.respawnTimer <= 0) {
                this.respawn(game);
            }
            return;
        }

        // Movement
        if (this.moveDirection.magnitude() > 0) {
            const moveVel = this.moveDirection.normalize().multiply(this.speed);
            this.velocity = moveVel;
            this.facingAngle = this.moveDirection.angle();
        } else {
            this.velocity = new Vector2(0, 0);
        }

        super.update(deltaTime);

        // Clamp to map bounds
        this.position.x = Math.max(this.radius, Math.min(game.map.width - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(game.map.height - this.radius, this.position.y));

        // Wall collision
        this.handleWallCollision(game.map);

        // Ammo reload
        if (this.ammo < this.ammoMax) {
            this.reloadTimer += deltaTime * 1000;
            if (this.reloadTimer >= this.ammoReloadTime) {
                this.ammo = Math.min(this.ammo + 1, this.ammoMax);
                this.reloadTimer = 0;
            }
        }

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 1000;
        }

        // Damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime * 1000;
        }

        // Check if in bush
        this.isInBush = game.map.isPositionInBush(this.position.x, this.position.y);

        // Update visibility
        this.updateVisibility(game);
    }

    handleWallCollision(map) {
        const tile = map.getTileAtPosition(this.position.x, this.position.y);
        if (tile && tile.solid) {
            // Push back from wall
            const tileCenter = map.getTileCenter(
                Math.floor(this.position.x / map.tileSize),
                Math.floor(this.position.y / map.tileSize)
            );
            const pushDir = this.position.subtract(tileCenter).normalize();
            this.position.addInPlace(pushDir.multiply(5));
        }
    }

    updateVisibility(game) {
        // Players on the same team are always visible
        // Enemies in bushes are invisible unless a teammate is nearby
        this.isVisible = true;

        if (this.isInBush) {
            // Check if any enemy is close enough to reveal
            const revealDistance = 60;
            for (const brawler of game.brawlers) {
                if (brawler.team !== this.team && brawler.isAlive) {
                    if (this.distanceTo(brawler) < revealDistance) {
                        this.isVisible = true;
                        return;
                    }
                }
            }
            // Hidden in bush
            if (this.team !== game.playerTeam) {
                this.isVisible = false;
            }
        }
    }

    canAttack() {
        return this.isAlive && this.ammo > 0 && this.attackCooldown <= 0;
    }

    attack(direction, game) {
        if (!this.canAttack()) return false;

        this.ammo--;
        this.attackCooldown = this.attackSpeed;
        this.aimDirection = direction.normalize();
        this.facingAngle = direction.angle();
        this.isAttacking = true;

        // Create projectiles (override in subclass)
        this.createAttackProjectiles(direction, game);

        setTimeout(() => {
            this.isAttacking = false;
        }, 100);

        return true;
    }

    createAttackProjectiles(direction, game) {
        // Override in subclass
    }

    useSuper(direction, game) {
        if (!this.superReady) return false;

        this.superCharge = 0;
        this.superReady = false;
        this.facingAngle = direction.angle();

        // Override in subclass for specific super abilities
        this.activateSuper(direction, game);

        return true;
    }

    activateSuper(direction, game) {
        // Override in subclass
    }

    takeDamage(amount, attacker) {
        if (!this.isAlive) return;

        this.health -= amount;
        this.damageFlashTimer = 100;

        // Charge attacker's super
        if (attacker && attacker.type === 'brawler') {
            attacker.addSuperCharge(1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        if (!this.isAlive) return;
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    addSuperCharge(amount) {
        if (this.superReady) return;
        this.superCharge += amount;
        if (this.superCharge >= this.superChargeMax) {
            this.superCharge = this.superChargeMax;
            this.superReady = true;
        }
    }

    die() {
        this.isAlive = false;
        this.respawnTimer = 3000;
        this.health = 0;

        // Drop gems
        const droppedGems = this.gems;
        this.gems = 0;

        return droppedGems;
    }

    respawn(game) {
        this.isAlive = true;
        this.health = this.maxHealth;
        this.ammo = this.ammoMax;

        // Find spawn position
        const spawnPos = game.map.getSpawnPosition(this.team);
        this.position.set(spawnPos.x, spawnPos.y);
    }

    collectGem() {
        this.gems++;
    }

    render(ctx, camera, isPlayerTeam) {
        if (!this.active) return;

        const screenX = this.position.x - camera.x;
        const screenY = this.position.y - camera.y;

        // Don't render if not visible (enemy in bush)
        if (!this.isVisible && !isPlayerTeam) return;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + this.radius - 5, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!this.isAlive) {
            // Death indicator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💀', screenX, screenY + 8);
            return;
        }

        // Body with team color
        const bodyColor = this.damageFlashTimer > 0 ? '#ffffff' : this.color;

        // Draw body circle
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = this.team === TEAMS.BLUE ? '#2d5a8a' : '#a93226';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Character emoji/icon
        ctx.font = `${this.radius * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, screenX, screenY);

        // Direction indicator
        const dirX = screenX + Math.cos(this.facingAngle) * (this.radius + 10);
        const dirY = screenY + Math.sin(this.facingAngle) * (this.radius + 10);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dirX, dirY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        this.renderHealthBar(ctx, screenX, screenY);

        // Ammo indicators
        this.renderAmmo(ctx, screenX, screenY);

        // Gem count
        if (this.gems > 0) {
            this.renderGems(ctx, screenX, screenY);
        }

        // Super ready indicator
        if (this.superReady) {
            ctx.strokeStyle = COLORS.SUPER_GOLD;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    renderHealthBar(ctx, x, y) {
        const barWidth = 50;
        const barHeight = 6;
        const barY = y - this.radius - 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Health fill
        const healthPercent = this.health / this.maxHealth;
        let healthColor = COLORS.HEALTH_GREEN;
        if (healthPercent < 0.3) healthColor = COLORS.HEALTH_RED;
        else if (healthPercent < 0.6) healthColor = COLORS.HEALTH_YELLOW;

        ctx.fillStyle = healthColor;
        ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }

    renderAmmo(ctx, x, y) {
        const ammoY = y + this.radius + 15;
        const ammoSize = 8;
        const spacing = 12;
        const startX = x - (this.ammoMax * spacing) / 2 + spacing / 2;

        for (let i = 0; i < this.ammoMax; i++) {
            ctx.fillStyle = i < this.ammo ? '#ffd700' : 'rgba(100, 100, 100, 0.5)';
            ctx.beginPath();
            ctx.arc(startX + i * spacing, ammoY, ammoSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Reload progress
        if (this.ammo < this.ammoMax) {
            const reloadProgress = this.reloadTimer / this.ammoReloadTime;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(startX + this.ammo * spacing, ammoY, ammoSize / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * reloadProgress);
            ctx.lineTo(startX + this.ammo * spacing, ammoY);
            ctx.fill();
        }
    }

    renderGems(ctx, x, y) {
        const gemY = y - this.radius - 35;
        ctx.fillStyle = COLORS.GEM;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`💎 ${this.gems}`, x, gemY);
    }
}
