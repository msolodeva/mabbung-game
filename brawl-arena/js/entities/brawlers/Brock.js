// ========================================
// BROCK - Rocket Launcher Specialist
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile, ExplosiveProjectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Brock extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.BROCK, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        // Single rocket that explodes on impact
        const projectile = new ExplosiveProjectile(
            this.position.x + direction.x * 30,
            this.position.y + direction.y * 30,
            direction,
            {
                speed: 550,
                damage: this.config.attackDamage,
                size: 15,
                range: this.config.attackRange,
                owner: this,
                team: this.team,
                color: '#e74c3c',
                explodeSpikes: 0, // Just area damage, no spikes
                explodeSpikeDamage: 0,
                isRocket: true, // Special flag for rocket visuals if needed
                areaDamage: true,
                areaRadius: 80
            }
        );

        // Store game reference efficiently on the projectile itself to avoid owner modification issues
        projectile.gameRef = game;

        // Override explode method for simple area damage without spikes
        projectile.explode = function () {
            const game = this.gameRef || this.owner.game;
            if (!game) return;

            // Explosion effect
            game.createEffect('explosion', this.position.x, this.position.y, { radius: 80 });
            game.audioManager?.play('explosion');

            // Area Damage
            for (const brawler of game.brawlers) {
                if (brawler.team !== this.team && brawler.isAlive) {
                    if (this.position.distanceTo(brawler.position) <= 80) {
                        brawler.takeDamage(this.damage, this.owner);
                    }
                }
            }
        };

        game.projectiles.push(projectile);
        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        // Rocket Rain - Barrage of rockets
        const baseAngle = direction.angle();
        const targetPos = this.position.add(direction.normalize().multiply(this.config.attackRange * 0.8));

        for (let i = 0; i < 9; i++) {
            const delay = i * 150;

            setTimeout(() => {
                if (!this.isAlive) return;

                // Random target within area
                const spread = 150;
                const offsetX = (Math.random() - 0.5) * spread;
                const offsetY = (Math.random() - 0.5) * spread;
                const aimPos = targetPos.add(new Vector2(offsetX, offsetY));
                const aimDir = aimPos.subtract(this.position).normalize();

                const projectile = new ExplosiveProjectile(
                    this.position.x + aimDir.x * 20,
                    this.position.y + aimDir.y * 20,
                    aimDir,
                    {
                        speed: 600,
                        damage: this.config.superDamage,
                        size: 18,
                        range: this.position.distanceTo(aimPos), // Stop exactly at target
                        owner: this,
                        team: this.team,
                        color: '#f39c12',
                        explodeSpikes: 0,
                        areaRadius: 100
                    }
                );

                // Store game reference
                projectile.gameRef = game;

                // Same override for area damage
                projectile.explode = function () {
                    const game = this.gameRef || this.owner.game;
                    if (!game) return;

                    game.createEffect('explosion', this.position.x, this.position.y, { radius: 100 });
                    game.audioManager?.play('explosion');

                    for (const brawler of game.brawlers) {
                        if (brawler.team !== this.team && brawler.isAlive) {
                            if (this.position.distanceTo(brawler.position) <= 100) {
                                brawler.takeDamage(this.damage, this.owner);
                            }
                        }
                    }

                    // Also destroy walls
                    game.map.damageWallAtPosition(this.position.x, this.position.y, 5000);
                };

                game.projectiles.push(projectile);
            }, delay);
        }

        game.audioManager?.play('super');
    }

    render(ctx, camera, isPlayerTeam) {
        super.render(ctx, camera, isPlayerTeam);
        // Additional Brock-specific rendering (sunglasses?) if desired
    }
}
