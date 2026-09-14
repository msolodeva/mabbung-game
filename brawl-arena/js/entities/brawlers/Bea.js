import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Bea extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.BEA, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        const shot = this.createBee(direction, { damage: this.attackDamage });
        game.projectiles.push(shot);
        game.audioManager?.play('shoot');
    }

    createBee(direction, overrides) {
        const origin = this.position.add(direction.multiply(this.config.projectileSpawnDistance));
        const shot = new Projectile(origin.x, origin.y, direction, {
            speed: this.config.projectileSpeed,
            size: this.config.projectileSize,
            range: this.attackRange,
            owner: this,
            team: this.team,
            color: this.config.color,
            ...overrides,
        });
        const onHit = shot.onHit.bind(shot);
        shot.onHit = (target, world) => {
            onHit(target, world);
            target.applySlow?.(this.config.stingSlowMultiplier, this.config.stingSlowDuration);
        };
        return shot;
    }

    activateSuper(direction, game) {
        for (let i = 0; i < this.config.superProjectileCount; i++) {
            const angle = direction.angle() + (i / (this.config.superProjectileCount - 1) - 0.5) * this.config.superSpread;
            game.projectiles.push(this.createBee(Vector2.fromAngle(angle), {
                speed: this.config.superProjectileSpeed,
                damage: this.config.superDamage,
                range: this.config.superRange,
                knockback: this.config.superKnockback,
                isSuper: true,
            }));
        }
        game.audioManager?.play('super');
    }

}
