import { Projectile } from './Projectile.js';
import { PROJECTILE_CONFIG } from '../utils/constants.js';
import { advanceRicochet } from '../utils/ricochet.js';

export class RicochetProjectile extends Projectile {
    constructor(x, y, direction, config) {
        super(x, y, direction, config);
        this.bouncesRemaining = config.maxBounces;
    }

    update(deltaTime, game) {
        if (!this.active) return;
        // A shot spawned inside solid cover cannot escape through it.
        if (game.map.isPositionSolidForProjectile(this.position.x, this.position.y)) {
            this.destroy();
            return;
        }
        this.trail.unshift(this.position.clone());
        if (this.trail.length > this.trailLength) this.trail.pop();
        let travel = Math.min(this.speed * Math.max(0, deltaTime), this.range - this.distanceTraveled);
        while (travel > 0 && this.active) {
            const distance = Math.min(PROJECTILE_CONFIG.COLLISION_STEP, travel);
            const step = advanceRicochet(this.position, this.direction, distance, game.map);
            this.position = step.position;
            this.direction = step.direction;
            this.velocity = this.direction.multiply(this.speed);
            this.distanceTraveled += distance;
            travel -= distance;
            if (step.bounced) {
                if (this.bouncesRemaining <= 0) {
                    this.destroy();
                    break;
                }
                this.bouncesRemaining--;
                this.trail = [];
                game.createEffect('hit', this.position.x, this.position.y);
                game.audioManager?.play('ricochet');
            }
            // Solid cover remains intact; the base method handles only targets here.
            this.checkCollisions(game);
        }
        if (this.distanceTraveled >= this.range) this.destroy();
    }
}
