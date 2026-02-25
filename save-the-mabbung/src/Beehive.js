import Matter from 'matter-js';
import { Bee } from './Bee.js';

export class Beehive {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.bees = [];
        this.maxBees = 20;
        this.spawnInterval = null;
        this.spawnedCount = 0;

        // Create static beehive body (collision only, custom render)
        this.body = Matter.Bodies.trapezoid(x, y, 40, 35, 0.3, {
            isStatic: true,
            render: {
                visible: false // Custom rendering
            }
        });
        this.body.label = 'beehive';
        Matter.Composite.add(game.engine.world, this.body);
    }

    startSpawning() {
        this.spawnedCount = 0;
        this.spawnInterval = setInterval(() => {
            if (this.game.state !== 'SIMULATING') {
                this.stopSpawning();
                return;
            }
            if (this.spawnedCount >= this.maxBees) {
                this.stopSpawning();
                return;
            }

            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            const bee = new Bee(this.game, this.x + offsetX, this.y + offsetY);
            this.bees.push(bee);
            this.game.bees.push(bee);
            this.spawnedCount++;
        }, 300);
    }

    stopSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    setMaxBees(count) {
        this.maxBees = count;
    }

    render(ctx) {
        const bx = this.x;
        const by = this.y;

        // Branch at top
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 35, by - 30);
        ctx.lineTo(bx + 35, by - 30);
        ctx.stroke();

        // Hanging strings
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 12, by - 30);
        ctx.lineTo(bx - 12, by - 22);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 12, by - 30);
        ctx.lineTo(bx + 12, by - 22);
        ctx.stroke();

        // Main hive body (rounded dome shape)
        ctx.fillStyle = '#D4A017';
        ctx.beginPath();
        ctx.moveTo(bx - 22, by - 22);
        ctx.quadraticCurveTo(bx - 28, by, bx - 18, by + 20);
        ctx.quadraticCurveTo(bx, by + 28, bx + 18, by + 20);
        ctx.quadraticCurveTo(bx + 28, by, bx + 22, by - 22);
        ctx.quadraticCurveTo(bx, by - 26, bx - 22, by - 22);
        ctx.fill();

        // Hive outline
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 22, by - 22);
        ctx.quadraticCurveTo(bx - 28, by, bx - 18, by + 20);
        ctx.quadraticCurveTo(bx, by + 28, bx + 18, by + 20);
        ctx.quadraticCurveTo(bx + 28, by, bx + 22, by - 22);
        ctx.quadraticCurveTo(bx, by - 26, bx - 22, by - 22);
        ctx.stroke();

        // Horizontal stripe lines on hive
        ctx.strokeStyle = '#C8930A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const yy = by - 15 + i * 10;
            const halfW = 18 - Math.abs(i - 1.5) * 3;
            ctx.beginPath();
            ctx.moveTo(bx - halfW, yy);
            ctx.lineTo(bx + halfW, yy);
            ctx.stroke();
        }

        // Hexagonal pattern (honeycomb)
        ctx.fillStyle = '#C8930A';
        const hexSize = 4;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const hx = bx - 8 + col * 8 + (row % 2) * 4;
                const hy = by - 8 + row * 9;
                this.drawHexagon(ctx, hx, hy, hexSize);
            }
        }

        // Entrance hole
        ctx.fillStyle = '#4A3000';
        ctx.beginPath();
        ctx.ellipse(bx, by + 15, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHexagon(ctx, cx, cy, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + size * Math.cos(angle);
            const py = cy + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#A07800';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
}
