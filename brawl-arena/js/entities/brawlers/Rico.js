import { Brawler } from '../Brawler.js';
import { RicochetProjectile } from '../RicochetProjectile.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Rico extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.RICO, team, x, y);
    }

    fireBurst(direction, game, isSuper) {
        const aim = direction.clone();
        const count = isSuper ? this.config.superProjectiles : this.config.attackProjectiles;
        for (let i = 0; i < count; i++) {
            game.scheduleAction(this, i * this.config.bulletInterval, () => {
                if (!this.isAlive) return;
                game.projectiles.push(new RicochetProjectile(this.position.x, this.position.y, aim, {
                    speed: this.config.projectileSpeed,
                    damage: isSuper ? this.config.superDamage : this.attackDamage,
                    size: this.config.projectileSize,
                    range: isSuper ? this.config.superRange : this.attackRange,
                    maxBounces: isSuper ? this.config.superBounces : this.config.maxBounces,
                    owner: this,
                    team: this.team,
                    color: isSuper ? '#ffd75e' : '#58eced',
                    piercing: isSuper,
                    isSuper,
                }));
            });
        }
        game.audioManager?.play(isSuper ? 'super' : 'shoot', this.config.id);
    }

    createAttackProjectiles(direction, game) {
        this.fireBurst(direction, game, false);
    }

    activateSuper(direction, game) {
        this.fireBurst(direction, game, true);
    }
}
