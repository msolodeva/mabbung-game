// ========================================
// REX - Heavy Railgun Brawler
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Rex extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.REX, team, x, y);
    }

    fireSlug(direction, game, { damage, range, size, speed, color, isSuper = false }) {
        const spawn = this.config.projectileSpawnDistance;
        const projectile = new Projectile(
            this.position.x + direction.x * spawn,
            this.position.y + direction.y * spawn,
            direction,
            {
                speed,
                damage,
                size,
                range,
                owner: this,
                team: this.team,
                color,
                trailLength: 8,
                piercing: true,
                isSuper,
            }
        );
        game.projectiles.push(projectile);
    }

    createAttackProjectiles(direction, game) {
        this.fireSlug(direction, game, {
            damage: this.config.attackDamage,
            range: this.config.attackRange,
            size: this.config.projectileSize,
            speed: this.config.projectileSpeed,
            color: this.config.color,
        });

        game.audioManager?.play('shoot', this.config.id);
    }

    activateSuper(direction, game) {
        const baseAngle = direction.angle();

        for (let i = 0; i < this.config.superProjectiles; i++) {
            game.scheduleAction(this, i * this.config.superBulletInterval, () => {
                if (!this.isAlive) return;

                this.fireSlug(Vector2.fromAngle(baseAngle), game, {
                    damage: this.config.superDamage,
                    range: this.config.superRange,
                    size: this.config.projectileSize - 2,
                    speed: this.config.projectileSpeed + 100,
                    color: '#d2b4de',
                    isSuper: true,
                });
            });
        }

        game.audioManager?.play('super');
    }
}
