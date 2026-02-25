import Matter from 'matter-js';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = this.canvas.getContext('2d');

        this.isDrawing = false;
        this.points = [];       // active drawing points
        this.pathBody = null;

        // Config
        this.minSegmentLength = 8;
        this.lineWidth = 12;

        // Ink system
        this.maxInk = 500;
        this.usedInk = 0;

        // Drawing style
        this.lineColor = '#3E2723';
        this.lineAlpha = 0.85;

        this.bindEvents();
    }

    setMaxInk(amount) {
        this.maxInk = amount;
        this.usedInk = 0;
    }

    getInkRatio() {
        return Math.max(0, 1 - this.usedInk / this.maxInk);
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
        this.usedInk = 0;
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
            // Check ink limit
            if (this.usedInk + dist > this.maxInk) {
                const remaining = this.maxInk - this.usedInk;
                if (remaining > 2) {
                    const ratio = remaining / dist;
                    const clampedPos = {
                        x: lastPos.x + (pos.x - lastPos.x) * ratio,
                        y: lastPos.y + (pos.y - lastPos.y) * ratio
                    };
                    this.points.push(clampedPos);
                    this.usedInk = this.maxInk;
                }
                this.stopDrawing();
                return;
            }

            this.usedInk += dist;
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
            this.game.state = 'WAITING';
        }

        this.points = [];
    }

    createPhysicsBody() {
        const parts = [];

        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const circle = Matter.Bodies.circle(p.x, p.y, this.lineWidth / 2, {
                render: {
                    fillStyle: this.lineColor,
                    opacity: this.lineAlpha
                }
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
                render: {
                    fillStyle: this.lineColor,
                    opacity: this.lineAlpha
                }
            });

            parts.push(rect);
        }

        if (parts.length > 0) {
            this.pathBody = Matter.Body.create({
                parts: parts,
                isStatic: false,   // initialize as dynamic to compute properties
                friction: 0.8,
                restitution: 0.1,
                density: 0.005,
                frictionAir: 0.02
            });

            this.pathBody.label = 'drawnPath';
            // Keep completely static until startSimulation changes it to dynamic
            Matter.Body.setStatic(this.pathBody, true);

            // Save relative points for smooth rendering
            this.pathBody.renderPoints = this.points.map(p => ({
                x: p.x - this.pathBody.position.x,
                y: p.y - this.pathBody.position.y
            }));

            Matter.Composite.add(this.game.engine.world, this.pathBody);
        }
    }

    renderDrawing() {
        const ctx = this.ctx;

        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        if (this.pathBody && this.pathBody.renderPoints) {
            ctx.save();
            ctx.translate(this.pathBody.position.x, this.pathBody.position.y);
            ctx.rotate(this.pathBody.angle);

            ctx.beginPath();
            const pts = this.pathBody.renderPoints;
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.strokeStyle = this.lineColor;
            ctx.globalAlpha = this.lineAlpha;
            ctx.lineWidth = this.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.restore();
        } else if (this.isDrawing && this.points.length > 0) {
            const pts = this.points;

            if (pts.length >= 2) {
                // Main line
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i].x, pts[i].y);
                }
                ctx.strokeStyle = this.lineColor;
                ctx.globalAlpha = this.lineAlpha;
                ctx.lineWidth = this.lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }

            // Pencil tip cursor only while actively drawing
            const lastPt = pts[pts.length - 1];
            ctx.fillStyle = '#5D4037';
            ctx.beginPath();
            ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath();
            ctx.arc(lastPt.x, lastPt.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;
    }

    renderInkBar() {
        if (this.game.state === 'END' || this.game.state === 'MENU') return;

        const ctx = this.ctx;
        const barWidth = 180;
        const barHeight = 20;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height - 42;
        const ratio = this.getInkRatio();

        // Pen icon
        ctx.font = '16px sans-serif';
        ctx.fillText('✏️', barX - 22, barY + 15);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 10);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 10);
        ctx.stroke();

        // Fill
        if (ratio > 0) {
            const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * ratio, barY);
            if (ratio > 0.5) {
                gradient.addColorStop(0, '#66BB6A');
                gradient.addColorStop(1, '#43A047');
            } else if (ratio > 0.25) {
                gradient.addColorStop(0, '#FFA726');
                gradient.addColorStop(1, '#FB8C00');
            } else {
                gradient.addColorStop(0, '#EF5350');
                gradient.addColorStop(1, '#E53935');
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth * ratio, barHeight, 10);
            ctx.fill();
        }

        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(ratio * 100)}%`, barX + barWidth / 2, barY + barHeight / 2);
        ctx.textBaseline = 'alphabetic';
    }
}
