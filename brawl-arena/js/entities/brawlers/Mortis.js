// ========================================
// MORTIS - Dash Assassin
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Mortis extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.MORTIS, team, x, y);

        // Dash state
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = new Vector2(0, 0);
        this.dashHitTargets = new Set();

        // Afterimage trail for visual effect
        this.dashTrail = [];
        this.maxDashTrailLength = 8;
    }

    createAttackProjectiles(direction, game) {
        // Mortis doesn't fire projectiles — he dashes!
        this.startDash(direction, game);
    }

    startDash(direction, game) {
        this.isDashing = true;
        this.dashTimer = this.config.dashDuration;
        this.dashDirection = direction.normalize();
        this.dashHitTargets.clear();
        this.facingAngle = direction.angle();

        game.audioManager?.play('shoot');
    }

    update(deltaTime, game) {
        // Handle dash movement before calling super.update
        if (this.isDashing && this.isAlive) {
            this.dashTimer -= deltaTime * 1000;

            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.dashTrail = [];
            } else {
                // Save trail position for afterimage
                this.dashTrail.unshift({
                    x: this.position.x,
                    y: this.position.y,
                    time: performance.now(),
                });
                if (this.dashTrail.length > this.maxDashTrailLength) {
                    this.dashTrail.pop();
                }

                // Move at dash speed
                const dashMove = this.dashDirection.multiply(this.config.dashSpeed * deltaTime);
                const newX = this.position.x + dashMove.x;
                const newY = this.position.y + dashMove.y;

                // Wall collision check during dash
                if (!game.map.isPositionSolid(newX, this.position.y)) {
                    this.position.x = newX;
                } else {
                    this.isDashing = false; // Stop dash on wall hit
                }
                if (!game.map.isPositionSolid(this.position.x, newY)) {
                    this.position.y = newY;
                } else {
                    this.isDashing = false;
                }

                // Check for enemies in dash damage radius
                for (const brawler of game.brawlers) {
                    if (brawler.team === this.team || !brawler.isAlive) continue;
                    if (this.dashHitTargets.has(brawler)) continue;

                    const distance = this.position.distanceTo(brawler.position);
                    if (distance <= this.config.dashDamageRadius + brawler.radius) {
                        brawler.takeDamage(this.config.attackDamage, this);
                        this.dashHitTargets.add(brawler);
                        game.createEffect('explosion', brawler.position.x, brawler.position.y);
                    }
                }

                // Override movement direction during dash
                this.moveDirection = new Vector2(0, 0);
            }
        }

        super.update(deltaTime, game);

        // Decay dash trail when not dashing
        if (!this.isDashing && this.dashTrail.length > 0) {
            this.dashTrail.pop();
        }
    }

    activateSuper(direction, game) {
        const baseAngle = direction.angle();
        const spreadAngle = 0.3; // Narrow spread for bat swarm

        for (let i = 0; i < this.config.superProjectiles; i++) {
            const angleOffset = spreadAngle * (i / (this.config.superProjectiles - 1) - 0.5);
            const batAngle = baseAngle + angleOffset;
            const batDir = Vector2.fromAngle(batAngle);

            const projectile = new Projectile(
                this.position.x + batDir.x * 30,
                this.position.y + batDir.y * 30,
                batDir,
                {
                    speed: 550,
                    damage: this.config.superDamage,
                    size: 18,
                    range: 500,
                    owner: this,
                    team: this.team,
                    color: '#9b59b6',
                    piercing: true,
                    isSuper: true,
                    lifesteal: true,
                    projectileType: 'bat',
                }
            );

            // Override onHit for lifesteal
            const originalOnHit = projectile.onHit.bind(projectile);
            projectile.onHit = (brawler, g) => {
                originalOnHit(brawler, g);
                // Heal owner for damage dealt
                const healAmount = this.config.superDamage * this.config.superHealPercent;
                this.heal(healAmount);
                g.createEffect('heal', this.position.x, this.position.y);
            };

            game.projectiles.push(projectile);
        }

        game.audioManager?.play('super');
        game.createEffect('superBlast', this.position.x, this.position.y);
    }

    render(ctx, camera, isPlayerTeam) {
        // Render dash afterimage trail
        if (this.dashTrail.length > 0 && this.isAlive && (this.isVisible || isPlayerTeam)) {
            ctx.save();
            for (let i = 0; i < this.dashTrail.length; i++) {
                const trail = this.dashTrail[i];
                const alpha = 0.5 * (1 - i / this.dashTrail.length);
                ctx.globalAlpha = alpha;

                // Purple ghostly afterimage
                const grad = ctx.createRadialGradient(
                    trail.x, trail.y, 0,
                    trail.x, trail.y, this.radius
                );
                grad.addColorStop(0, 'rgba(125, 60, 152, 0.6)');
                grad.addColorStop(1, 'rgba(125, 60, 152, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, this.radius * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Render the brawler body
        super.render(ctx, camera, isPlayerTeam);

        // Extra dash effect: speed lines when dashing
        if (this.isDashing && this.isAlive && (this.isVisible || isPlayerTeam)) {
            const x = this.position.x;
            const y = this.position.y;

            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = '#bb8fce';
            ctx.lineWidth = 3;

            // Draw speed lines behind the brawler
            for (let i = 0; i < 5; i++) {
                const offset = (Math.random() - 0.5) * this.radius * 2;
                const perpX = -this.dashDirection.y * offset;
                const perpY = this.dashDirection.x * offset;
                const lineLen = 20 + Math.random() * 30;

                ctx.beginPath();
                ctx.moveTo(
                    x + perpX - this.dashDirection.x * 20,
                    y + perpY - this.dashDirection.y * 20
                );
                ctx.lineTo(
                    x + perpX - this.dashDirection.x * (20 + lineLen),
                    y + perpY - this.dashDirection.y * (20 + lineLen)
                );
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}
