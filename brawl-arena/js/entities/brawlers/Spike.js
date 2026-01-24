// ========================================
// SPIKE - Area Control Cactus
// ========================================

import { Brawler } from '../Brawler.js';
import { Projectile, ExplosiveProjectile } from '../Projectile.js';
import { Vector2 } from '../../utils/Vector2.js';
import { BRAWLERS } from '../../utils/constants.js';

export class Spike extends Brawler {
    constructor(team, x, y) {
        super(BRAWLERS.SPIKE, team, x, y);
        this.spikeField = null;
    }

    createAttackProjectiles(direction, game) {
        // Explosive spike bomb
        const projectile = new ExplosiveProjectile(
            this.position.x + direction.x * 25,
            this.position.y + direction.y * 25,
            direction,
            {
                speed: 500,
                damage: this.config.attackDamage,
                size: 15,
                range: this.config.attackRange,
                owner: this,
                team: this.team,
                color: '#27ae60',
                explodeSpikes: this.config.explodeSpikes,
                explodeSpikeDamage: this.config.explodeSpikeDamage,
            }
        );
        projectile.owner.game = game;
        game.projectiles.push(projectile);

        game.audioManager?.play('shoot');
    }

    // Create spike field at current position
    const fieldPos = this.position.clone();
        console.log(`Spike activateSuper - Spike Pos: ${this.position.x}, ${ this.position.y }, Field Pos: ${ fieldPos.x }, ${ fieldPos.y } `);

        // Remove existing spike field
        if (this.spikeField) {
            this.spikeField.active = false;
        }

        this.spikeField = {
            position: fieldPos,
            radius: this.config.superRadius,
            duration: this.config.superSlowDuration,
            damagePerSecond: this.config.superDamagePerSecond,
            team: this.team,
            owner: this,
            active: true,
            timer: 0,
            damageTimer: 0,
        };

        game.spikeFields.push(this.spikeField);
        console.log(`Spike Field added to game.spikeFields.Count: ${ game.spikeFields.length } `);

        // Radial spike attack - fired from current position
        const spikeCount = 8;
        const angleStep = (Math.PI * 2) / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
            const angle = angleStep * i;
            const dir = Vector2.fromAngle(angle);
            const spike = new Projectile(this.position.x, this.position.y, dir, {
                speed: 400,
                damage: this.config.explodeSpikeDamage || 300,
                size: 8,
                range: 300,
                owner: this,
                team: this.team,
                color: '#27ae60',
            });
            game.projectiles.push(spike);
        }

        game.audioManager?.play('super');
        game.createEffect('spikeField', fieldPos.x, fieldPos.y, { radius: this.config.superRadius });
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);

        // Update spike field
        if (this.spikeField && this.spikeField.active) {
            this.spikeField.timer += deltaTime * 1000;
            this.spikeField.damageTimer += deltaTime * 1000;

            // Check duration
            if (this.spikeField.timer >= this.spikeField.duration) {
                this.spikeField.active = false;
                this.spikeField = null;
                return;
            }

            // Apply damage every 0.5 seconds
            if (this.spikeField.damageTimer >= 500) {
                this.spikeField.damageTimer = 0;

                for (const brawler of game.brawlers) {
                    if (brawler.team === this.team || !brawler.isAlive) continue;

                    const distance = brawler.position.distanceTo(this.spikeField.position);
                    if (distance <= this.spikeField.radius) {
                        brawler.takeDamage(this.spikeField.damagePerSecond / 2, this);
                    }
                }
            }
        }
    }
}

// Spike Field effect renderer
export function renderSpikeField(ctx, camera, field) {
    if (!field.active) return;

    const screenX = field.position.x - camera.x;
    const screenY = field.position.y - camera.y;
    const progress = field.timer / field.duration;

    // Fading effect as it expires
    const alpha = 1 - progress * 0.5;

    // Ground effect
    ctx.fillStyle = `rgba(39, 174, 96, ${ alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, field.radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = `rgba(39, 174, 96, ${ alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spike decorations
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
        const angle = (Math.PI * 2 / spikeCount) * i + field.timer * 0.001;
        const spikeX = screenX + Math.cos(angle) * field.radius * 0.6;
        const spikeY = screenY + Math.sin(angle) * field.radius * 0.6;

        ctx.fillStyle = `rgba(39, 174, 96, ${ alpha })`;
        ctx.beginPath();
        ctx.moveTo(spikeX, spikeY - 10);
        ctx.lineTo(spikeX + 5, spikeY + 5);
        ctx.lineTo(spikeX - 5, spikeY + 5);
        ctx.closePath();
        ctx.fill();
    }
}
