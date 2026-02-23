import Matter from 'matter-js';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = this.canvas.getContext('2d');

        this.isDrawing = false;
        this.points = [];
        this.pathBody = null;

        // Config
        this.minSegmentLength = 15;
        this.lineWidth = 15;

        this.bindEvents();

        // Hook into Matter Render to draw our custom path on top
        Matter.Events.on(this.game.render, 'afterRender', () => {
            this.renderDrawing();
        });
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        window.addEventListener('mouseup', this.stopDrawing.bind(this));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });
        window.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    getPointerPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        if (this.game.state !== 'WAITING') return;

        this.isDrawing = true;
        this.points = [];
        this.points.push(this.getPointerPosition(e));
        this.game.state = 'DRAWING';

        if (this.pathBody) {
            Matter.Composite.remove(this.game.engine.world, this.pathBody);
            this.pathBody = null;
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const pos = this.getPointerPosition(e);
        const lastPos = this.points[this.points.length - 1];

        const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
        if (dist > this.minSegmentLength) {
            this.points.push(pos);
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.points.length > 2) {
            this.createPhysicsBody();
            this.game.startSimulation();
        } else {
            // Line too short, reset state
            this.points = [];
            this.game.state = 'WAITING';
        }

        // Clear drawing points as they are now represented by physics body
        this.points = [];
    }

    createPhysicsBody() {
        const parts = [];

        // Add circles at joints for smoother collision edges
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const circle = Matter.Bodies.circle(p.x, p.y, this.lineWidth / 2, {
                render: { fillStyle: '#333' }
            });
            parts.push(circle);
        }

        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];

            const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            const cx = (p1.x + p2.x) / 2;
            const cy = (p1.y + p2.y) / 2;

            const rect = Matter.Bodies.rectangle(cx, cy, length, this.lineWidth, {
                angle: angle,
                render: { fillStyle: '#333' }
            });

            parts.push(rect);
        }

        if (parts.length > 0) {
            this.pathBody = Matter.Body.create({
                parts: parts,
                friction: 0.8,
                restitution: 0.2,
                density: 0.1
            });

            this.pathBody.label = 'drawnPath';
            Matter.Composite.add(this.game.engine.world, this.pathBody);
        }
    }

    renderDrawing() {
        if (this.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        }
    }
}
