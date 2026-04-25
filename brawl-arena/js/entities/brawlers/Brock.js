// ========================================
// BROCK - Long Range Rocket Brawler
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

class RocketProjectile extends Projectile {
    constructor(x, y, direction, config) {
        super(x, y, direction, config);
        this.explosionRadius = config.explosionRadius || 80;
        this.hasExploded = false;
    }

    onHit(target, game) {
        this.explode(game);
    }

    destroy() {
        if (!this.hasExploded && this.owner?.game) {
            this.explode(this.owner.game);
        }

        super.destroy();
    }

    explode(game) {
        if (this.hasExploded) return;
        this.hasExploded = true;

        const targets = [...game.brawlers, ...game.bears];
        for (const target of targets) {
            if (!target.isAlive || target.team === this.team) continue;

            const distance = this.position.distanceTo(target.position);
            if (distance > this.explosionRadius + target.radius) continue;

            target.takeDamage(this.damage, this.owner, this);

            if (this.knockback > 0 && typeof target.applyKnockback === 'function') {
                const knockbackDir = target.position.subtract(this.position).normalize();
                target.applyKnockback(knockbackDir, this.knockback);
            }
        }

        this.damageNearbyWalls(game);
        game.createEffect('explosion', this.position.x, this.position.y);
        super.destroy();
    }

    damageNearbyWalls(game) {
        const offsets = [
            [0, 0],
            [this.explosionRadius * 0.5, 0],
            [-this.explosionRadius * 0.5, 0],
            [0, this.explosionRadius * 0.5],
            [0, -this.explosionRadius * 0.5],
        ];

        for (const [x, y] of offsets) {
            game.map.damageWallAtPosition(this.position.x + x, this.position.y + y, this.damage);
        }
    }

    render(ctx, camera) {
        if (!this.active) return;

        const x = this.position.x;
        const y = this.position.y;
        const angle = this.direction.angle();

        for (let i = 0; i < this.trail.length; i++) {
            const trail = this.trail[i];
            const alpha = 1 - i / Math.max(this.trail.length, 1);
            ctx.fillStyle = `rgba(230, 126, 34, ${alpha * 0.45})`;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#f5b041';
        ctx.beginPath();
        ctx.moveTo(this.radius * 1.4, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.65);
        ctx.lineTo(-this.radius * 0.55, 0);
        ctx.lineTo(-this.radius, this.radius * 0.65);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-this.radius * 1.2, -this.radius * 0.45, this.radius * 0.5, this.radius * 0.9);
        ctx.restore();
    }
}

export class Brock extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.BROCK, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        this.fireRocket(direction, game, {
            damage: this.config.attackDamage,
            range: this.config.attackRange,
            explosionRadius: this.config.rocketExplosionRadius,
            knockback: this.config.rocketKnockback,
            speed: 520,
            size: 13,
            color: this.config.color,
        });

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        const baseAngle = direction.angle();
        const spread = 0.28;

        for (let i = 0; i < this.config.superRocketCount; i++) {
            const angleOffset = spread * (i / Math.max(this.config.superRocketCount - 1, 1) - 0.5);
            const rocketDir = Vector2.fromAngle(baseAngle + angleOffset);
            const spawnOffset = (i - (this.config.superRocketCount - 1) / 2) * 8;
            const side = new Vector2(-rocketDir.y, rocketDir.x).multiply(spawnOffset);

            this.fireRocket(rocketDir, game, {
                damage: this.config.superDamage,
                range: this.config.superRange + i * 18,
                explosionRadius: this.config.superExplosionRadius,
                knockback: this.config.superKnockback,
                speed: 610,
                size: 12,
                color: '#e67e22',
                isSuper: true,
                offset: side,
            });
        }

        game.audioManager?.play('super');
        game.createEffect('superBlast', this.position.x, this.position.y);
    }

    fireRocket(direction, game, options) {
        const rocketDirection = direction.normalize();
        const offset = options.offset || new Vector2(0, 0);
        const rocket = new RocketProjectile(
            this.position.x + rocketDirection.x * 30 + offset.x,
            this.position.y + rocketDirection.y * 30 + offset.y,
            rocketDirection,
            {
                speed: options.speed,
                damage: options.damage,
                size: options.size,
                range: options.range,
                owner: this,
                team: this.team,
                color: options.color,
                knockback: options.knockback,
                isSuper: options.isSuper || false,
                explosionRadius: options.explosionRadius,
                projectileType: 'rocket',
                trailLength: 8,
            }
        );

        rocket.owner.game = game;
        game.projectiles.push(rocket);
    }
}
