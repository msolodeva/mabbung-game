import Matter from 'matter-js';

export class Bee {
    constructor(game, x, y) {
        this.game = game;
        this.body = Matter.Bodies.polygon(x, y, 6, 12, { // Hexagon for bee
            restitution: 0.8,
            friction: 0.1,
            density: 0.02,
            render: {
                fillStyle: '#FF3333',
                strokeStyle: '#000',
                lineWidth: 2
            }
        });
        this.body.label = 'bee';
        Matter.Composite.add(game.engine.world, this.body);
    }

    update() {
        if (!this.game.mabbung || this.game.state !== 'SIMULATING') return;

        // Calculate direction to mabbung
        const mx = this.game.mabbung.position.x;
        const my = this.game.mabbung.position.y;
        const bx = this.body.position.x;
        const by = this.body.position.y;

        const dx = mx - bx;
        const dy = my - by;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            // Apply continuous force towards Mabbung
            const forceMagnitude = 0.00015;
            Matter.Body.applyForce(this.body, this.body.position, {
                x: (dx / dist) * forceMagnitude,
                y: (dy / dist) * forceMagnitude
            });
        }
    }
}
