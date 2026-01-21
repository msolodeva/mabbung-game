// ========================================
// NITA - Bear Summoner
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Bear } from '../Bear.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Nita extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.NITA, team, x, y);
        this.bear = null;
    }

    createAttackProjectiles(direction, game) {
        // Shockwave attack
        const projectile = new Projectile(
            this.position.x + direction.x * 25,
            this.position.y + direction.y * 25,
            direction,
            {
                speed: 450,
                damage: this.config.attackDamage,
                size: 25,
                range: this.config.attackRange,
                owner: this,
                team: this.team,
                color: '#e74c3c',
                projectileType: 'wave',
                width: 80,
                piercing: true,
            }
        );
        game.projectiles.push(projectile);

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        // Remove existing bear if any
        if (this.bear && this.bear.isAlive) {
            this.bear.active = false;
        }

        // Summon bear at aimed position
        const spawnDistance = 100;
        const spawnPos = this.position.add(direction.normalize().multiply(spawnDistance));

        this.bear = new Bear(spawnPos.x, spawnPos.y, this);
        this.bear.game = game;
        game.bears.push(this.bear);

        game.audioManager?.play('super');
        game.createEffect('summon', spawnPos.x, spawnPos.y);
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);

        // Update bear reference
        if (this.bear && !this.bear.isAlive) {
            this.bear = null;
        }
    }
}
