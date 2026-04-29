// ========================================
// NITA - Homing Missile Launcher
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile, HomingMissile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Nita extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.NITA, team, x, y);
    }

    createAttackProjectiles(direction, game) {
        // Shockwave attack
        const projectile = new Projectile(
            this.position.x + direction.x * 25,
            this.position.y + direction.y * 25,
            direction,
            {
                speed: 550,
                damage: this.config.attackDamage,
                size: 28,
                range: this.config.attackRange,
                owner: this,
                team: this.team,
                color: '#e74c3c',
                projectileType: 'wave',
                width: 100,
                piercing: true,
            }
        );
        game.projectiles.push(projectile);

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        // Launch a homing missile that tracks the nearest enemy
        const spawnDistance = 30;
        const spawnPos = this.position.add(direction.normalize().multiply(spawnDistance));

        // Create homing missile
        const missile = new HomingMissile(
            spawnPos.x,
            spawnPos.y,
            direction,
            {
                speed: 420,                    // 미사일 속도
                damage: this.config.superDamage, // 설정된 데미지 사용
                size: 15,                      // 미사일 크기
                range: 800,                    // 최대 비행 거리
                owner: this,
                team: this.team,
                color: '#e74c3c',
                trackingRange: 600,            // 적 감지 범위
                turnSpeed: 5,                  // 방향 전환 속도 (rad/s)
                lifetime: 4000,                // 최대 수명 4초
                isSuper: true,
            }
        );

        game.projectiles.push(missile);

        game.audioManager?.play('super');
        game.createEffect('explosion', spawnPos.x, spawnPos.y);
    }
}
