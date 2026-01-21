// ========================================
// COLT - Dual Pistol Sharpshooter
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Colt extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.COLT, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        const baseAngle = direction.angle();

        // Fire 6 bullets in a line with slight spread
        for (let i = 0; i < this.config.attackProjectiles; i++) {
            const delay = i * 50; // Stagger bullets slightly

            setTimeout(() => {
                if (!this.isAlive) return;

                const angleOffset = (Math.random() - 0.5) * this.config.attackSpread;
                const bulletAngle = baseAngle + angleOffset;
                const bulletDir = Vector2.fromAngle(bulletAngle);

                const projectile = new Projectile(
                    this.position.x + bulletDir.x * 25,
                    this.position.y + bulletDir.y * 25,
                    bulletDir,
                    {
                        speed: 700,
                        damage: this.config.attackDamage,
                        size: 6,
                        range: this.config.attackRange,
                        owner: this,
                        team: this.team,
                        color: '#4a90d9',
                        trailLength: 5,
                    }
                );
                game.projectiles.push(projectile);
            }, delay);
        }

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        const baseAngle = direction.angle();

        // Bullet storm - rapid fire in a line
        for (let i = 0; i < 12; i++) {
            const delay = i * 40;

            setTimeout(() => {
                if (!this.isAlive) return;

                const angleOffset = (Math.random() - 0.5) * 0.1;
                const bulletAngle = baseAngle + angleOffset;
                const bulletDir = Vector2.fromAngle(bulletAngle);

                const projectile = new Projectile(
                    this.position.x + bulletDir.x * 25,
                    this.position.y + bulletDir.y * 25,
                    bulletDir,
                    {
                        speed: 800,
                        damage: this.config.superDamage,
                        size: 8,
                        range: this.config.attackRange * 1.5,
                        owner: this,
                        team: this.team,
                        color: '#ffd700',
                        trailLength: 6,
                        piercing: true, // Super bullets pierce through enemies
                    }
                );
                game.projectiles.push(projectile);
            }, delay);
        }

        game.audioManager?.play('super');
    }
}
