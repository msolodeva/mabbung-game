// ========================================
// POCO - Healing Support Brawler
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS, TEAMS } from '../../utils/constants.js';

export class Poco extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.POCO, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        // Wide sound wave attack
        const projectile = new Projectile(
            this.position.x + direction.x * 25,
            this.position.y + direction.y * 25,
            direction,
            {
                speed: 400,
                damage: this.config.attackDamage,
                size: 30,
                range: this.config.attackRange,
                owner: this,
                team: this.team,
                color: '#2ecc71',
                projectileType: 'wave',
                width: this.config.attackWidth,
                piercing: true,
            }
        );
        game.projectiles.push(projectile);

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        // Healing wave - heal all nearby teammates
        const healRadius = this.config.superRadius;
        const healAmount = this.config.superHeal;

        for (const brawler of game.brawlers) {
            if (brawler.team !== this.team || !brawler.isAlive) continue;

            const distance = this.distanceTo(brawler);
            if (distance <= healRadius) {
                brawler.heal(healAmount);
                game.createEffect('heal', brawler.position.x, brawler.position.y);
            }
        }

        // Heal self
        this.heal(healAmount);
        game.createEffect('heal', this.position.x, this.position.y);

        // Visual healing wave
        game.createEffect('healWave', this.position.x, this.position.y, { radius: healRadius });

        game.audioManager?.play('super');
    }

    render(ctx, camera, isPlayerTeam) {
        super.render(ctx, camera, isPlayerTeam);

        // Draw healing aura when super is ready
        if (this.superReady && this.isAlive) {
            // No need to subtract camera coordinates as the context is already translated globally
            ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.config.superRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
