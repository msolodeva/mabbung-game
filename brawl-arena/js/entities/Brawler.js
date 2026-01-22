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
        this.moveTrail = [];
        this.maxTrailLength = 5;
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

        // Update movement trail
        if (this.velocity.magnitude() > 50) {
            this.moveTrail.unshift({ x: this.position.x, y: this.position.y, angle: this.facingAngle });
            if (this.moveTrail.length > this.maxTrailLength) this.moveTrail.pop();
        } else {
            if (this.moveTrail.length > 0) this.moveTrail.pop();
        }
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

        const x = this.position.x;
        const y = this.position.y;

        // Render Movement Trail
        if (this.moveTrail.length > 0 && this.isAlive && (this.isVisible || isPlayerTeam)) {
            ctx.save();
            for (let i = 0; i < this.moveTrail.length; i++) {
                const p = this.moveTrail[i];
                const alpha = 0.3 * (1 - i / this.moveTrail.length);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, this.radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Don't render if not visible (enemy in bush)
        if (!this.isVisible && !isPlayerTeam) return;

        const time = performance.now() * 0.005;
        const bobOffset = Math.sin(time) * 5; // Balanced bobbing
        const breathingScale = 1 + Math.sin(time * 0.4) * 0.04; // Smooth breathing

        // 1. Enhanced Ground Ring (Aura)
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y + this.radius - 5, this.radius * 1.1, 0, Math.PI * 2);
        ctx.stroke();

        // Inner soft glow
        const innerGlow = ctx.createRadialGradient(x, y + this.radius - 5, 0, x, y + this.radius - 5, this.radius * 1.4);
        innerGlow.addColorStop(0, `${this.color}44`);
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        const shadowW = this.radius * 1.0 * breathingScale;
        const shadowH = this.radius * 0.4 * breathingScale;
        ctx.ellipse(x, y + this.radius - 2, shadowW, shadowH, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!this.isAlive) {
            // Death indicator (Ghostly emoji)
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👻', x, y + bobOffset);
            ctx.restore();
            return;
        }

        // 3. Directional Pointer (Premium Look)
        ctx.save();
        ctx.translate(x, y + bobOffset);
        ctx.rotate(this.facingAngle);

        // Pointer shadow
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.radius + 18, 0);
        ctx.lineTo(this.radius + 4, -10);
        ctx.lineTo(this.radius + 4, 10);
        ctx.fill();
        ctx.restore();

        // 4. Character Body with Premium Gradients
        ctx.save();
        ctx.translate(x, y + bobOffset);
        ctx.scale(breathingScale, breathingScale);

        const bodyGrad = ctx.createRadialGradient(
            -this.radius * 0.3,
            -this.radius * 0.3,
            this.radius * 0.1,
            0,
            0,
            this.radius
        );

        if (this.damageFlashTimer > 0) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#ff8888');
        } else {
            bodyGrad.addColorStop(0, this.color);
            bodyGrad.addColorStop(0.7, this.color);
            bodyGrad.addColorStop(1, this.team === TEAMS.BLUE ? '#154360' : '#641e16');
        }

        // Body Outer Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Stylish White Outline
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Character Emoji / Icon
        ctx.shadowBlur = 0; // Clear for text
        ctx.font = `bold ${this.radius * 1.4}px "Lilita One", Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, 0, 2);

        ctx.restore();

        // 5. Polished HUD (Health/Ammo)
        this.renderPolishedHealthBar(ctx, x, y);
        this.renderPolishedAmmo(ctx, x, y);

        if (this.gems > 0) {
            this.renderPremiumGemsIndicator(ctx, x, y);
        }

        // 6. Super Ready Pulse
        if (this.superReady) {
            ctx.save();
            ctx.translate(x, y + bobOffset);
            ctx.rotate(time * 0.5);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    renderPolishedHealthBar(ctx, x, y) {
        const barWidth = 70;
        const barHeight = 10;
        const barY = y - this.radius - 30;

        // Black Border/Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x - barWidth / 2 - 3, barY - 3, barWidth + 6, barHeight + 6, 5);
        ctx.fill();

        // Health Fill
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        let healthColor = '#2ecc71';
        if (healthPercent < 0.35) healthColor = '#e74c3c';
        else if (healthPercent < 0.65) healthColor = '#f1c40f';

        ctx.fillStyle = healthColor;
        ctx.beginPath();
        ctx.roundRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight, 4);
        ctx.fill();

        // Gloss Effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight / 2);

        // Health Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(this.health), x, barY + barHeight - 1);
    }

    renderPolishedAmmo(ctx, x, y) {
        const ammoY = y + this.radius + 25;
        const spacing = 16;
        const width = 12;
        const height = 5;
        const totalWidth = this.ammoMax * spacing;
        const startX = x - totalWidth / 2 + spacing / 2;

        for (let i = 0; i < this.ammoMax; i++) {
            const isLoaded = i < this.ammo;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.roundRect(startX + i * spacing - width / 2, ammoY, width, height, 2);
            ctx.fill();

            if (isLoaded) {
                const grad = ctx.createLinearGradient(0, ammoY, 0, ammoY + height);
                grad.addColorStop(0, '#f1c40f');
                grad.addColorStop(1, '#d68910');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(startX + i * spacing - width / 2, ammoY, width, height, 2);
                ctx.fill();
            } else if (i === this.ammo) {
                const reloadProgress = this.reloadTimer / this.ammoReloadTime;
                ctx.fillStyle = 'rgba(241, 196, 15, 0.4)';
                ctx.beginPath();
                ctx.roundRect(startX + i * spacing - width / 2, ammoY, width * reloadProgress, height, 2);
                ctx.fill();
            }
        }
    }

    renderPremiumGemsIndicator(ctx, x, y) {
        const gemY = y - this.radius - 50;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#9b59b6';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Lilita One", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`💎 ${this.gems}`, x, gemY);
        ctx.restore();
    }
}
