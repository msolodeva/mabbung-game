// ========================================
// EL PRIMO - Luchador Tank
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class ElPrimo extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.ELPRIMO, team, x, y);
        this.isJumping = false;
        this.jumpProgress = 0;
        this.jumpStart = new Vector2(0, 0);
        this.jumpEnd = new Vector2(0, 0);
        this.jumpDuration = 800; // ms
    }

    createAttackProjectiles(direction, game) {
        const baseAngle = direction.angle();

        // Fire 4 quick punches
        for (let i = 0; i < this.config.attackProjectiles; i++) {
            const delay = i * 80;

            setTimeout(() => {
                if (!this.isAlive || this.isJumping) return;

                const angleOffset = (Math.random() - 0.5) * 0.1;
                const punchAngle = baseAngle + angleOffset;
                const punchDir = Vector2.fromAngle(punchAngle);

                const projectile = new Projectile(
                    this.position.x + punchDir.x * 20,
                    this.position.y + punchDir.y * 20,
                    punchDir,
                    {
                        speed: 400,
                        damage: this.config.attackDamage,
                        size: 15,
                        range: this.config.attackRange,
                        owner: this,
                        team: this.team,
                        color: '#ffcc00',
                        isMelee: true,
                    }
                );
                game.projectiles.push(projectile);
            }, delay);
        }

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        // Leap to target
        const leapDistance = 350;
        this.jumpStart = new Vector2(this.position.x, this.position.y);
        this.jumpEnd = this.position.add(direction.normalize().multiply(leapDistance));

        // Clamp jump destination to map bounds
        this.jumpEnd.x = Math.max(this.radius, Math.min(game.map.width - this.radius, this.jumpEnd.x));
        this.jumpEnd.y = Math.max(this.radius, Math.min(game.map.height - this.radius, this.jumpEnd.y));

        this.isJumping = true;
        this.jumpProgress = 0;

        game.audioManager?.play('super');
        game.createEffect('superBlast', this.position.x, this.position.y);
    }

    update(deltaTime, game) {
        if (this.isJumping) {
            this.jumpProgress += (deltaTime * 1000) / this.jumpDuration;

            if (this.jumpProgress >= 1) {
                this.jumpProgress = 1;
                this.isJumping = false;
                this.position.set(this.jumpEnd.x, this.jumpEnd.y);
                this.onLanding(game);
            } else {
                // Ease out quad for smoother jumping movement
                const t = this.jumpProgress;
                const easedT = t * (2 - t);
                this.position.x = this.jumpStart.x + (this.jumpEnd.x - this.jumpStart.x) * easedT;
                this.position.y = this.jumpStart.y + (this.jumpEnd.y - this.jumpStart.y) * easedT;
            }

            // Skip normal update while jumping (invincible/immobile)
            this.velocity = new Vector2(0, 0);
            return;
        }

        super.update(deltaTime, game);
    }

    onLanding(game) {
        // Landing impact: big AOE damage and knockback
        const impactRadius = 150;
        const impactDamage = this.config.superDamage;

        for (const brawler of game.brawlers) {
            if (brawler.team !== this.team && brawler.isAlive) {
                const dist = this.position.distanceTo(brawler.position);
                if (dist < impactRadius) {
                    brawler.takeDamage(impactDamage, this);

                    // Add knockback
                    const kbDir = brawler.position.subtract(this.position).normalize();
                    brawler.position.addInPlace(kbDir.multiply(this.config.superKnockback));
                }
            }
        }

        game.createEffect('explosion', this.position.x, this.position.y, { radius: impactRadius });
        game.audioManager?.play('explosion');
    }

    render(ctx, camera, isPlayerTeam) {
        if (this.isJumping) {
            // Calculate height for visual effect (parabola)
            const height = Math.sin(this.jumpProgress * Math.PI) * 100;

            const screenX = this.position.x - camera.x;
            const screenY = this.position.y - camera.y;

            // Render shadow on ground
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Render brawler with offset
            ctx.save();
            ctx.translate(0, -height);
            super.render(ctx, camera, isPlayerTeam);
            ctx.restore();
            return;
        }

        super.render(ctx, camera, isPlayerTeam);
    }
}
