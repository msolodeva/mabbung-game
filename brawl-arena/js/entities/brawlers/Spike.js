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
    activateSuper(direction, game) {
        // Throw a "Seed" projectile that triggers the field on impact
        const projectile = new ExplosiveProjectile(
            this.position.x + direction.x * 25,
            this.position.y + direction.y * 25,
            direction,
            {
                speed: 700, // Fast throw
                damage: 0, // The seed itself does no contact damage
                size: 15,
                range: this.config.attackRange * 1.2, // Throws slightly further than normal attack
                owner: this,
                team: this.team,
                color: '#2ecc71', // Distinct color
                explodeSpikes: 0, // Custom handle
                isSuper: true,    // 궁극기 투사체
            }
        );

        // Override explode method to trigger the super effect
        projectile.explode = () => {
            this.createSuperEffect(projectile.position, game);
        };

        game.projectiles.push(projectile);
        game.audioManager?.play('shoot'); // Play throw sound
    }

    createSuperEffect(position, game) {
        console.log(`Spike Super Effect at: ${position.x}, ${position.y}`);

        // Remove existing spike field
        if (this.spikeField) {
            this.spikeField.active = false;
        }

        // Create new field
        this.spikeField = {
            position: position.clone(),
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

        // Powerful Radial Spikes
        const spikeCount = 12; // More spikes (was 8)
        const angleStep = (Math.PI * 2) / spikeCount;

        for (let i = 0; i < spikeCount; i++) {
            const angle = angleStep * i;
            const dir = Vector2.fromAngle(angle);
            const spike = new Projectile(position.x, position.y, dir, {
                speed: 550, // Faster spikes (was 400)
                damage: (this.config.explodeSpikeDamage || 300) * 1.5, // More damage (1.5x)
                size: 10, // Larger (was 8)
                range: 450, // Further range (was 300)
                owner: this,
                team: this.team,
                color: '#1e8449', // Darker/Stronger green
                piercing: true, // Powerful spikes pierce enemies
                isSuper: true   // 궁극기 투사체
            });
            game.projectiles.push(spike);
        }

        game.audioManager?.play('super');
        game.createEffect('spikeField', position.x, position.y, { radius: this.config.superRadius });
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

                    const distance = this.spikeField.position.distanceTo(brawler.position);
                    if (distance <= this.spikeField.radius) {
                        // Pass mock source object with isSuper: true
                        brawler.takeDamage(this.spikeField.damagePerSecond / 2, this, { isSuper: true });
                    }
                }
            }
        }
    }
}

// Spike Field effect renderer
export function renderSpikeField(ctx, camera, field) {
    if (!field.active) return;

    const screenX = field.position.x;
    const screenY = field.position.y;
    const progress = field.timer / field.duration;

    // Fading effect as it expires
    const alpha = 1 - progress * 0.5;

    // Ground effect
    ctx.fillStyle = `rgba(39, 174, 96, ${alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, field.radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = `rgba(39, 174, 96, ${alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spike decorations
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
        const angle = (Math.PI * 2 / spikeCount) * i + field.timer * 0.001;
        const spikeX = screenX + Math.cos(angle) * field.radius * 0.6;
        const spikeY = screenY + Math.sin(angle) * field.radius * 0.6;

        ctx.fillStyle = `rgba(39, 174, 96, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(spikeX, spikeY - 10);
        ctx.lineTo(spikeX + 5, spikeY + 5);
        ctx.lineTo(spikeX - 5, spikeY + 5);
        ctx.closePath();
        ctx.fill();
    }
}
