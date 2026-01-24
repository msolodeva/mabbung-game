// ========================================
// BULL - Tank / Charger
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Bull extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.BULL, team, x, y);
        this.isCharging = false;
        this.chargeDir = new Vector2(0, 0);
        this.chargeDistance = 0;
        this.maxChargeDistance = 500;
        this.chargeSpeed = 700;
        this.chargeDamage = 1200;
    }

    createAttackProjectiles(direction, game) {
        const baseAngle = direction.angle();
        const spreadAngle = this.config.attackSpread;

        // Bull's double-barrel shotgun (shorter range, more pellets than Shelly)
        for (let i = 0; i < this.config.attackProjectiles; i++) {
            const angleOffset = spreadAngle * (i / (this.config.attackProjectiles - 1) - 0.5);
            const pelletAngle = baseAngle + angleOffset * (0.8 + Math.random() * 0.4);
            const pelletDir = Vector2.fromAngle(pelletAngle);

            const projectile = new Projectile(
                this.position.x + pelletDir.x * 25,
                this.position.y + pelletDir.y * 25,
                pelletDir,
                {
                    speed: 550 + Math.random() * 100,
                    damage: this.config.attackDamage,
                    size: 8,
                    range: this.config.attackRange + Math.random() * 30,
                    owner: this,
                    team: this.team,
                    color: '#ffffff',
                }
            );
            game.projectiles.push(projectile);
        }

        game.audioManager?.play('shoot');
    }

    activateSuper(direction, game) {
        this.isCharging = true;
        this.chargeDir = direction.normalize();
        this.chargeDistance = 0;
        this.facingAngle = this.chargeDir.angle();

        game.audioManager?.play('super');
        game.createEffect('superBlast', this.position.x, this.position.y);
    }

    update(deltaTime, game) {
        if (this.isCharging) {
            const moveStep = this.chargeSpeed * deltaTime;
            const moveVec = this.chargeDir.multiply(moveStep);

            this.position.addInPlace(moveVec);
            this.chargeDistance += moveStep;

            // Damage enemies while charging
            for (const brawler of game.brawlers) {
                if (brawler.team !== this.team && brawler.isAlive) {
                    if (this.distanceTo(brawler) < this.radius + brawler.radius) {
                        brawler.takeDamage(this.chargeDamage, this);
                        // Knockback smoothly
                        const kbDir = this.chargeDir.clone();
                        brawler.applyKnockback(kbDir, this.config.superKnockback);
                    }
                }
            }

            // Destroy walls while charging
            game.map.damageWallAtPosition(this.position.x, this.position.y, 5000);

            // Check if finished charging
            if (this.chargeDistance >= this.maxChargeDistance ||
                this.position.x <= this.radius ||
                this.position.x >= game.map.width - this.radius ||
                this.position.y <= this.radius ||
                this.position.y >= game.map.height - this.radius) {
                this.isCharging = false;
            }

            // Skip normal Brawler update for movement
            // But still update things like reload and cooldown
            this.updateBasicSystems(deltaTime);
            return;
        }

        super.update(deltaTime, game);
    }

    updateBasicSystems(deltaTime) {
        // Reduced version of Brawler.update for when charging
        if (this.ammo < this.ammoMax) {
            this.reloadTimer += deltaTime * 1000;
            if (this.reloadTimer >= this.ammoReloadTime) {
                this.ammo = Math.min(this.ammo + 1, this.ammoMax);
                this.reloadTimer = 0;
            }
        }
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 1000;
        }
    }
}
