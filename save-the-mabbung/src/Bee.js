import Matter from 'matter-js';

export class Bee {
    constructor(game, x, y) {
        this.game = game;
        this.body = Matter.Bodies.circle(x, y, 6, {
            restitution: 0.9,
            friction: 0.05,
            density: 0.005,
            frictionAir: 0.002,
            render: {
                visible: false // Custom rendering
            }
        });
        this.body.label = 'bee';

        // Random drift parameters
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.001 + Math.random() * 0.001;
        this.driftChangeTimer = 0;

        // Wing animation
        this.wingPhase = Math.random() * Math.PI * 2;
        this.wingSpeed = 0.4 + Math.random() * 0.2;

        Matter.Composite.add(game.engine.world, this.body);
    }

    update() {
        if (!this.game.mabbung || this.game.state !== 'SIMULATING') return;

        // Wing animation phase
        this.wingPhase += this.wingSpeed;

        const body = this.body;
        const gravity = this.game.engine.gravity;

        const gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001;

        // Counteract gravity so bees hover/fly (not fall)
        Matter.Body.applyForce(body, body.position, {
            x: -body.mass * gravity.x * gravityScale,
            y: -body.mass * gravity.y * gravityScale
        });

        // Calculate direction to mabbung
        const mx = this.game.mabbung.position.x;
        const my = this.game.mabbung.position.y;
        const bx = body.position.x;
        const by = body.position.y;

        const dx = mx - bx;
        const dy = my - by;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const trackForce = 0.00008;

            this.driftChangeTimer++;
            if (this.driftChangeTimer > 30 + Math.random() * 60) {
                this.driftAngle += (Math.random() - 0.5) * Math.PI;
                this.driftChangeTimer = 0;
            }

            const driftX = Math.cos(this.driftAngle) * this.driftSpeed;
            const driftY = Math.sin(this.driftAngle) * this.driftSpeed;

            Matter.Body.applyForce(body, body.position, {
                x: (dx / dist) * trackForce + driftX,
                y: (dy / dist) * trackForce + driftY
            });
        }

        // Limit speed
        const speed = Matter.Vector.magnitude(body.velocity);
        if (speed > 4) {
            Matter.Body.setVelocity(body, {
                x: (body.velocity.x / speed) * 4,
                y: (body.velocity.y / speed) * 4
            });
        }
    }

    render(ctx) {
        const x = this.body.position.x;
        const y = this.body.position.y;
        const angle = this.body.angle;
        const wingFlap = Math.sin(this.wingPhase) * 0.4;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Wings (translucent white, flapping)
        ctx.fillStyle = 'rgba(220, 240, 255, 0.7)';
        ctx.strokeStyle = 'rgba(180, 210, 240, 0.5)';
        ctx.lineWidth = 0.5;

        // Left wing
        ctx.save();
        ctx.rotate(-0.3 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-4, -5, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.rotate(0.3 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(4, -5, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Body (yellow with black stripes)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        ctx.fillStyle = '#2D2D2D';
        ctx.fillRect(-5, -2, 10, 2);
        ctx.fillRect(-4, 2, 8, 2);

        // Head (yellow circle)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-1.5, -7, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(1.5, -7, 1, 0, Math.PI * 2);
        ctx.fill();

        // Stinger
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-1.5, 7);
        ctx.lineTo(1.5, 7);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
