// ========================================
// ENTITY - Base Entity Class
// ========================================

import { Vector2 } from '../utils/Vector2.js';

export class Entity {
    constructor(x = 0, y = 0) {
        this.id = Entity.nextId++;
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.radius = 20;
        this.active = true;
        this.type = 'entity';
    }

    update(deltaTime) {
        this.position.addInPlace(this.velocity.multiply(deltaTime));
    }

    render(ctx, camera) {
        // Override in subclass
    }

    getBounds() {
        return {
            x: this.position.x - this.radius,
            y: this.position.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
        };
    }

    collidesWith(other) {
        const distance = this.position.distanceTo(other.position);
        return distance < this.radius + other.radius;
    }

    distanceTo(other) {
        return this.position.distanceTo(other.position);
    }

    destroy() {
        this.active = false;
    }
}

Entity.nextId = 0;
