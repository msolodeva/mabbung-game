// ========================================
// SHELLY - Shotgun Brawler
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Shelly extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.SHELLY, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        const baseAngle = direction.angle();
        const spreadAngle = this.config.attackSpread;

        for (let i = 0; i < this.config.attackProjectiles; i++) {
            // Calculate spread angle for this pellet
            const angleOffset = spreadAngle * (i / (this.config.attackProjectiles - 1) - 0.5);
            const pelletAngle = baseAngle + angleOffset * (0.8 + Math.random() * 0.4);
            const pelletDir = Vector2.fromAngle(pelletAngle);

            const projectile = new Projectile(
                this.position.x + pelletDir.x * 30,
                this.position.y + pelletDir.y * 30,
                pelletDir,
                {
                    speed: 500 + Math.random() * 100,
                    damage: this.config.attackDamage,
                    size: 10,
                    range: this.config.attackRange + Math.random() * 50,
                    owner: this,
                    team: this.team,
                    color: '#ffcc00',
                }
            );
            game.projectiles.push(projectile);
        }

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        const baseAngle = direction.angle();
        const spreadAngle = this.config.attackSpread * 1.2;

        // Super shell - more pellets, more damage, knockback
        for (let i = 0; i < 9; i++) {
            const angleOffset = spreadAngle * (i / 8 - 0.5);
            const pelletAngle = baseAngle + angleOffset;
            const pelletDir = Vector2.fromAngle(pelletAngle);

            const projectile = new Projectile(
                this.position.x + pelletDir.x * 30,
                this.position.y + pelletDir.y * 30,
                pelletDir,
                {
                    speed: 600,
                    damage: this.config.superDamage,
                    size: 14,
                    range: this.config.attackRange * 1.3,
                    owner: this,
                    team: this.team,
                    color: '#ff9900',
                    knockback: this.config.superKnockback,
                }
            );
            game.projectiles.push(projectile);
        }

        game.audioManager?.play('super');
        game.createEffect('superBlast', this.position.x, this.position.y);
    }
}
