export class EffectsManager {
    constructor(options = {}) {
        this.random = options.random || Math.random;
        this.maxParticles = options.maxParticles || 360;
        this.maxTexts = options.maxTexts || 24;
        this.particles = [];
        this.texts = [];
        this.shakeTime = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
    }

    clear() {
        this.particles.length = 0;
        this.texts.length = 0;
        this.shakeTime = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
    }

    spawnSplash(col, row, tileSize, options = {}) {
        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;
        this.spawnBurst(x, y, {
            color: options.color || '#7ed6df',
            count: options.count || 8,
            minSpeed: options.minSpeed || 60,
            maxSpeed: options.maxSpeed || 180,
            minSize: options.minSize || 3,
            maxSize: options.maxSize || 8
        });
    }

    spawnBurst(x, y, options = {}) {
        const count = options.count || 8;
        const minSpeed = options.minSpeed || 40;
        const maxSpeed = options.maxSpeed || 140;
        const minSize = options.minSize || 3;
        const maxSize = options.maxSize || 7;
        const color = options.color || '#ffffff';

        for (let i = 0; i < count; i++) {
            const angle = this.random() * Math.PI * 2;
            const speed = minSpeed + this.random() * (maxSpeed - minSpeed);
            const size = minSize + this.random() * (maxSize - minSize);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                size,
                color,
                life: 700,
                maxLife: 700
            });
        }
        this.trimParticles();
    }

    spawnText(text, x, y, color = '#ffffff') {
        this.texts.push({
            text,
            x,
            y,
            vy: -54,
            color,
            life: 900,
            maxLife: 900
        });
        this.trimTexts();
    }

    triggerShake(duration = 180, magnitude = 6) {
        this.shakeDuration = Math.max(this.shakeDuration, duration);
        this.shakeTime = Math.max(this.shakeTime, duration);
        this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    }

    getShakeOffset() {
        if (this.shakeTime <= 0 || this.shakeDuration <= 0) {
            return { x: 0, y: 0 };
        }

        const strength = this.shakeTime / this.shakeDuration;
        const magnitude = this.shakeMagnitude * strength;
        return {
            x: (this.random() * 2 - 1) * magnitude,
            y: (this.random() * 2 - 1) * magnitude
        };
    }

    update(deltaTime) {
        if (this.shakeTime > 0) {
            this.shakeTime = Math.max(0, this.shakeTime - deltaTime);
            if (this.shakeTime === 0) {
                this.shakeDuration = 0;
                this.shakeMagnitude = 0;
            }
        }

        for (const particle of this.particles) {
            const dt = deltaTime / 1000;
            particle.life -= deltaTime;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 240 * dt;
        }
        this.particles = this.particles.filter(particle => particle.life > 0);
        this.trimParticles();

        for (const text of this.texts) {
            const dt = deltaTime / 1000;
            text.life -= deltaTime;
            text.y += text.vy * dt;
        }
        this.texts = this.texts.filter(text => text.life > 0);
        this.trimTexts();
    }

    draw(ctx) {
        ctx.save();

        for (const particle of this.particles) {
            const alpha = Math.max(0, particle.life / particle.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (0.7 + alpha * 0.4), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px Arial';

        for (const text of this.texts) {
            const alpha = Math.max(0, text.life / text.maxLife);
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillStyle = text.color;
            ctx.strokeText(text.text, text.x, text.y);
            ctx.fillText(text.text, text.x, text.y);
        }

        ctx.restore();
    }

    trimParticles() {
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }
    }

    trimTexts() {
        if (this.texts.length > this.maxTexts) {
            this.texts.splice(0, this.texts.length - this.maxTexts);
        }
    }
}
