// ========================================
// DYNAMIKE - Lobbed Explosive Artillery
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { BRAWLERS } from '../../utils/constants.js';

class LobbedBomb extends Projectile {
    constructor(x, y, direction, config) {
        super(x, y, direction, {
            ...config,
            speed: 0,
            size: config.size || 16,
            range: config.range,
        });

        this.startPosition = this.position.clone();
        this.targetPosition = this.startPosition.add(this.direction.multiply(config.range));
        this.fuseTime = config.fuseTime || 650;
        this.explosionRadius = config.explosionRadius || 90;
        this.elapsedTime = 0;
        this.arcHeight = config.arcHeight || 90;
    }

    update(deltaTime, game) {
        if (!this.active) return;

        this.elapsedTime += deltaTime * 1000;
        const progress = Math.min(this.elapsedTime / this.fuseTime, 1);
        this.position = this.startPosition.lerp(this.targetPosition, progress);

        if (progress >= 1) {
            this.explode(game);
        }
    }

    explode(game) {
        if (!this.active) return;

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
        this.destroy();
    }

    damageNearbyWalls(game) {
        const offsets = [
            [0, 0],
            [this.explosionRadius * 0.6, 0],
            [-this.explosionRadius * 0.6, 0],
            [0, this.explosionRadius * 0.6],
            [0, -this.explosionRadius * 0.6],
        ];

        for (const [x, y] of offsets) {
            game.map.damageWallAtPosition(this.position.x + x, this.position.y + y, this.damage);
        }
    }

    render(ctx, camera) {
        if (!this.active) return;

        const progress = Math.min(this.elapsedTime / this.fuseTime, 1);
        const height = Math.sin(progress * Math.PI) * this.arcHeight;
        const visualY = this.position.y - height;
        const pulse = 1 + Math.sin(this.elapsedTime * 0.02) * 0.08;

        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y + 8, this.radius * 1.2, this.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.translate(this.position.x, visualY);
        ctx.rotate(this.elapsedTime * 0.012);

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.rect(-3, -this.radius - 7, 6, 10);
        ctx.fill();

        ctx.strokeStyle = '#f9e79f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius - 7);
        ctx.lineTo(5, -this.radius - 13);
        ctx.stroke();
        ctx.restore();
    }
}

export class Dynamike extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.DYNAMIKE, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        this.throwBomb(direction, game, {
            damage: this.config.attackDamage,
            range: this.config.attackRange,
            radius: this.config.explosionRadius,
            fuseTime: this.config.fuseTime,
            size: 15,
            color: this.config.color,
        });

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        this.throwBomb(direction, game, {
            damage: this.config.superDamage,
            range: this.config.attackRange * 1.15,
            radius: this.config.superRadius,
            fuseTime: this.config.superFuseTime,
            size: 24,
            color: '#e67e22',
            knockback: this.config.superKnockback,
            isSuper: true,
            arcHeight: 130,
        });

        game.audioManager?.play('super');
    }

    throwBomb(direction, game, options) {
        const throwDirection = direction.normalize();
        const bomb = new LobbedBomb(
            this.position.x + throwDirection.x * 18,
            this.position.y + throwDirection.y * 18,
            throwDirection,
            {
                damage: options.damage,
                size: options.size,
                range: options.range,
                owner: this,
                team: this.team,
                color: options.color,
                explosionRadius: options.radius,
                fuseTime: options.fuseTime,
                knockback: options.knockback || 0,
                isSuper: options.isSuper || false,
                arcHeight: options.arcHeight,
                projectileType: 'lobbedBomb',
            }
        );

        game.projectiles.push(bomb);
    }
}
