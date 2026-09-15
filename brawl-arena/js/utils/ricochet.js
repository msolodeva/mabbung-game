import { Vector2 } from './Vector2.js';
import { PROJECTILE_CONFIG } from './constants.js';

// Shared by live bullets and the keyboard aim preview.
export function advanceRicochet(position, direction, distance, map) {
    const next = position.add(direction.multiply(distance));
    const solid = (x, y) => map.isPositionSolidForProjectile(x, y);
    if (!solid(next.x, next.y)) return { position: next, direction, bounced: false };
    const hitX = solid(next.x, position.y);
    const hitY = solid(position.x, next.y);
    const corner = !hitX && !hitY;
    return {
        position: position.clone(),
        direction: new Vector2(hitX || corner ? -direction.x : direction.x, hitY || corner ? -direction.y : direction.y),
        bounced: true,
    };
}

export function traceRicochet(position, direction, range, maxBounces, map) {
    const points = [position.clone()];
    let current = position.clone();
    let heading = direction.normalize();
    let bounces = 0;
    for (let traveled = 0; traveled < range; traveled += PROJECTILE_CONFIG.COLLISION_STEP) {
        const step = advanceRicochet(current, heading, Math.min(PROJECTILE_CONFIG.COLLISION_STEP, range - traveled), map);
        current = step.position;
        heading = step.direction;
        if (step.bounced) {
            points.push(current.clone());
            if (++bounces > maxBounces) return points;
        }
    }
    points.push(current);
    return points;
}
