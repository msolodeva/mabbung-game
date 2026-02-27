import Matter from 'matter-js';
import decomp from 'poly-decomp';
import { InputHandler } from './InputHandler.js';
import { Beehive } from './Beehive.js';
import { levels } from './levels.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.uiLayer = document.getElementById('ui-layer');
        this.timerDisplay = document.getElementById('timer-display');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.gameMessage = document.getElementById('game-message');
        this.resetButton = document.getElementById('reset-button');
        this.nextButton = document.getElementById('next-button');
        this.startScreen = document.getElementById('start-screen');
        this.playButton = document.getElementById('play-button');
        this.levelTitle = document.getElementById('level-title');
        this.starsDisplay = document.getElementById('stars-display');
        this.levelSelectScreen = document.getElementById('level-select-screen');
        this.levelSelectBackBtn = document.getElementById('level-select-back');

        // Provide decomp directly to Matter.js
        window.decomp = decomp;
        Matter.Common.setDecomp(decomp);

        // Matter aliases
        this.Engine = Matter.Engine;
        this.Render = Matter.Render;
        this.Runner = Matter.Runner;
        this.Bodies = Matter.Bodies;
        this.Composite = Matter.Composite;
        this.World = Matter.World;
        this.Events = Matter.Events;

        this.engine = null;
        this.render = null;
        this.runner = null;

        // Game Objects
        this.mabbung = null;
        this.walls = [];
        this.bees = [];
        this.beehives = [];
        this.inputHandler = null;

        // Character Image
        this.mabbungImage = new Image();
        this.mabbungImage.src = '/mabbung_face.png?v=3';

        // State
        this.state = 'MENU'; // MENU -> LEVEL_SELECT -> WAITING -> DRAWING -> GO -> SIMULATING -> END
        this.timer = 10;
        this.timerInterval = null;
        this.currentLevel = 0;

        // Level stars tracking (persistent in session)
        this.levelStars = new Array(levels.length).fill(0);
        this.unlockedLevels = 1; // Only level 1 unlocked initially

        // Background decoration
        this.clouds = [];
        this.flowers = [];
        this.initDecorations();

        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        // GO animation
        this.goAlpha = 0;
        this.goScale = 0;

        // Canvas size
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Event listeners
        this.resetButton.addEventListener('click', () => this.restartLevel());
        this.nextButton.addEventListener('click', () => this.nextLevel());
        this.playButton.addEventListener('click', () => this.showLevelSelect());
        if (this.levelSelectBackBtn) {
            this.levelSelectBackBtn.addEventListener('click', () => {
                this.levelSelectScreen.classList.add('hidden');
                this.startScreen.classList.remove('hidden');
            });
        }
    }

    initDecorations() {
        // Generate random clouds
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * 900 - 50,
                y: 30 + Math.random() * 120,
                w: 60 + Math.random() * 80,
                speed: 0.15 + Math.random() * 0.2,
                opacity: 0.4 + Math.random() * 0.4
            });
        }
        // Generate random flowers
        for (let i = 0; i < 12; i++) {
            this.flowers.push({
                x: 30 + Math.random() * 740,
                y: 550 + Math.random() * 20,
                size: 3 + Math.random() * 4,
                color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF78C4'][Math.floor(Math.random() * 5)]
            });
        }
    }

    init() {
        this.engine = this.Engine.create({
            enableSleeping: true
        });
        // positionIterations: 높으면 경계 정밀 but 진동 위험, 15가 균형점
        this.engine.positionIterations = 15;
        this.engine.velocityIterations = 10;
        this.engine.constraintIterations = 4;

        // restingThreshold: 너무 높으면 경계 관통 허용 증가
        Matter.Resolver._restingThreshold = 0.5;

        this.render = this.Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                wireframes: false,
                background: 'transparent',
                hasBounds: true
            }
        });

        this.inputHandler = new InputHandler(this);

        this.Render.run(this.render);

        // fixed delta Runner: 프레임이 늦어도 큰 타임스텝으로 tunneling이 생기지 않도록
        this.runner = this.Runner.create({ isFixed: true, delta: 1000 / 60 });
        this.Runner.run(this.runner, this.engine);

        // Physics events
        this.Events.on(this.engine, 'beforeUpdate', () => {
            this.bees.forEach(bee => bee.update());
        });


        this.Events.on(this.engine, 'collisionStart', (event) => {
            if (this.state !== 'SIMULATING') return;
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;
                if ((bodyA.label === 'character' && bodyB.label === 'bee') ||
                    (bodyB.label === 'character' && bodyA.label === 'bee')) {
                    this.triggerGameOver(false);
                }
            }
        });

        // Custom rendering
        this.Events.on(this.render, 'afterRender', () => {
            const ctx = this.canvas.getContext('2d');

            // Apply screen shake
            if (this.shakeIntensity > 0.5) {
                ctx.save();
                const dx = (Math.random() - 0.5) * this.shakeIntensity;
                const dy = (Math.random() - 0.5) * this.shakeIntensity;
                ctx.translate(dx, dy);
                this.shakeIntensity *= this.shakeDecay;
            }

            this.renderBackground(ctx);
            this.renderObstacles(ctx);
            this.renderBeehives(ctx);
            this.renderBees(ctx);
            this.renderCharacterFace(ctx);
            this.renderTimerCircle(ctx);
            this.renderGoAnimation(ctx);

            // Draw the player's line and ink bar last (on top of everything)
            if (this.inputHandler) {
                this.inputHandler.renderDrawing();
                this.inputHandler.renderInkBar();
            }

            if (this.shakeIntensity > 0.5) {
                ctx.restore();
            }
        });

        // Show start screen
        this.startScreen.classList.remove('hidden');
    }

    // =========================
    // Level Select
    // =========================
    showLevelSelect() {
        this.startScreen.classList.add('hidden');
        this.renderLevelSelectButtons();
        this.levelSelectScreen.classList.remove('hidden');
    }

    renderLevelSelectButtons() {
        const grid = document.getElementById('level-grid');
        if (!grid) return;
        grid.innerHTML = '';

        levels.forEach((level, index) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            const isUnlocked = index < this.unlockedLevels;

            if (isUnlocked) {
                btn.classList.add('unlocked');
                const stars = this.levelStars[index];
                btn.innerHTML = `
                    <span class="level-num">${index + 1}</span>
                    <span class="level-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                `;
                btn.addEventListener('click', () => {
                    this.currentLevel = index;
                    this.levelSelectScreen.classList.add('hidden');
                    this.loadLevel(index);
                });
            } else {
                btn.classList.add('locked');
                btn.innerHTML = `<span class="level-lock">🔒</span>`;
            }

            grid.appendChild(btn);
        });
    }

    selectLevel(index) {
        this.currentLevel = index;
        this.levelSelectScreen.classList.add('hidden');
        this.loadLevel(index);
    }

    // =========================
    // Game Flow
    // =========================
    startGame() {
        this.startScreen.classList.add('hidden');
        this.currentLevel = 0;
        this.loadLevel(this.currentLevel);
    }

    loadLevel(index) {
        if (index >= levels.length) {
            this.gameMessage.innerText = '🎉 All Levels Complete!';
            this.gameMessage.style.color = '#FFD700';
            this.starsDisplay.innerText = '';
            this.nextButton.classList.add('hidden');
            this.gameOverScreen.classList.remove('hidden');
            this.state = 'END';
            return;
        }

        const level = levels[index];
        this.state = 'WAITING';
        this.gameOverScreen.classList.add('hidden');
        clearInterval(this.timerInterval);
        this.timer = level.timer || 10;
        this.timerDisplay.innerText = this.timer;
        this.levelTitle.innerText = level.name;
        this.levelTitle.classList.remove('hidden');

        // Clear world
        this.Composite.clear(this.engine.world);
        this.Engine.clear(this.engine);
        this.bees = [];
        this.beehives.forEach(bh => bh.stopSpawning());
        this.beehives = [];

        if (this.inputHandler) {
            this.inputHandler.points = [];
            this.inputHandler.pathBody = null;
            this.inputHandler.setMaxInk(level.inkAmount);
        }

        // Reset decorations
        this.shakeIntensity = 0;
        this.goAlpha = 0;
        this.goScale = 0;

        // Create obstacles from level data
        level.obstacles.forEach(obs => {
            if (obs.type === 'rect') {
                const body = this.Bodies.rectangle(obs.x, obs.y, obs.w, obs.h, {
                    isStatic: true,
                    render: { visible: false } // Custom rendering
                });
                body.label = obs.isGround ? 'ground' : 'obstacle';
                body.gameData = { ...obs };
                this.Composite.add(this.engine.world, body);
            }
        });

        // Create walls (두꺼운 경계 — tunneling 방지)
        const wallOpts = { isStatic: true, render: { visible: false }, friction: 0.3 };
        this.Composite.add(this.engine.world, [
            this.Bodies.rectangle(-50, this.height / 2, 100, this.height * 2, wallOpts),   // left
            this.Bodies.rectangle(this.width + 50, this.height / 2, 100, this.height * 2, wallOpts), // right
            this.Bodies.rectangle(this.width / 2, -50, this.width * 2, 100, wallOpts),    // top
            this.Bodies.rectangle(this.width / 2, this.height + 50, this.width * 2, 100, wallOpts)  // bottom safety
        ]);

        // Create character (invisible in Matter, custom rendered)
        this.mabbung = this.Bodies.circle(level.character.x, level.character.y, 22, {
            isStatic: false,
            restitution: 0,
            friction: 0.8,
            density: 0.005,
            frictionAir: 0.15,
            slop: 0.1,
            render: { visible: false }
        });
        this.mabbung.label = 'character';
        // Keep character completely perfectly still until the simulation starts
        Matter.Body.setStatic(this.mabbung, true);
        this.Composite.add(this.engine.world, this.mabbung);

        // Create beehives
        level.beehives.forEach(bh => {
            const beehive = new Beehive(this, bh.x, bh.y);
            beehive.setMaxBees(Math.ceil(level.maxBees / level.beehives.length));
            this.beehives.push(beehive);
        });

        // Auto-hide level title after 1.5s
        setTimeout(() => {
            this.levelTitle.classList.add('hidden');
        }, 1500);
    }

    startSimulation() {
        if (this.state === 'SIMULATING' || this.state === 'GO') return;

        // Show "GO!" animation first
        this.state = 'GO';
        this.goAlpha = 1;
        this.goScale = 0.3;

        // Animate GO and start after delay
        setTimeout(() => {
            this.state = 'SIMULATING';
            this.goAlpha = 0;

            // Make Mabbung dynamic so gravity affects it
            Matter.Body.setStatic(this.mabbung, false);
            Matter.Sleeping.set(this.mabbung, false); // Wake up from sleep

            // Allow drawn path to drop too
            if (this.inputHandler && this.inputHandler.pathBody) {
                Matter.Body.setStatic(this.inputHandler.pathBody, false);
                Matter.Sleeping.set(this.inputHandler.pathBody, false); // Wake up from sleep
            }

            // Start bee spawning from all beehives
            this.beehives.forEach(bh => bh.startSpawning());

            // Start timer
            const level = levels[this.currentLevel];
            this.timer = level ? level.timer || 10 : 10;
            this.timerDisplay.innerText = this.timer;
            this.timerInterval = setInterval(() => {
                if (this.state !== 'SIMULATING') return;
                this.timer--;
                this.timerDisplay.innerText = this.timer;
                if (this.timer <= 0) {
                    this.triggerGameOver(true);
                }
            }, 1000);
        }, 800);
    }

    triggerGameOver(isWin) {
        this.state = 'END';
        clearInterval(this.timerInterval);
        this.beehives.forEach(bh => bh.stopSpawning());

        if (isWin) {
            const inkRatio = this.inputHandler.usedInk / this.inputHandler.maxInk;
            let stars = 1;
            if (inkRatio <= 0.33) stars = 3;
            else if (inkRatio <= 0.66) stars = 2;

            // Record best stars
            if (stars > this.levelStars[this.currentLevel]) {
                this.levelStars[this.currentLevel] = stars;
            }

            // Unlock next level
            if (this.currentLevel + 1 < levels.length && this.currentLevel + 1 >= this.unlockedLevels) {
                this.unlockedLevels = this.currentLevel + 2;
            }

            this.gameMessage.innerText = 'Mabbung is Safe! 🎉';
            this.gameMessage.style.color = '#4CAF50';
            this.starsDisplay.innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

            if (this.currentLevel < levels.length - 1) {
                this.nextButton.classList.remove('hidden');
            } else {
                this.nextButton.classList.add('hidden');
            }
        } else {
            // Screen shake on game over
            this.shakeIntensity = 15;

            this.gameMessage.innerText = '😱 Game Over!';
            this.gameMessage.style.color = '#FF5252';
            this.starsDisplay.innerText = '';
            this.nextButton.classList.add('hidden');
        }

        // Delay showing result overlay for dramatic effect
        setTimeout(() => {
            this.gameOverScreen.classList.remove('hidden');
        }, isWin ? 200 : 600);
    }

    restartLevel() {
        this.loadLevel(this.currentLevel);
    }

    nextLevel() {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
    }

    // =========================
    // Custom Rendering
    // =========================

    renderBackground(ctx) {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(0.5, '#B0E0E6');
        skyGrad.addColorStop(0.85, '#C8E6C9');
        skyGrad.addColorStop(1, '#81C784');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Sun
        ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
        ctx.beginPath();
        ctx.arc(680, 60, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 235, 59, 0.6)';
        ctx.beginPath();
        ctx.arc(680, 60, 30, 0, Math.PI * 2);
        ctx.fill();

        // Clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.width + 100) cloud.x = -cloud.w - 20;

            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            const cx = cloud.x;
            const cy = cloud.y;
            const w = cloud.w;

            ctx.beginPath();
            ctx.arc(cx, cy, w * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + w * 0.2, cy - w * 0.1, w * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + w * 0.45, cy, w * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + w * 0.22, cy + w * 0.05, w * 0.22, 0, Math.PI * 2);
            ctx.fill();
        });

        // Grass hills at bottom
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, this.height - 30);
        ctx.quadraticCurveTo(200, this.height - 60, 400, this.height - 25);
        ctx.quadraticCurveTo(600, this.height - 55, 800, this.height - 30);
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();

        // Grass blades
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 20) {
            const baseY = this.height - 20 - Math.sin(i * 0.01) * 15;
            ctx.beginPath();
            ctx.moveTo(i, baseY + 10);
            ctx.quadraticCurveTo(i - 3, baseY, i + 2, baseY - 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i + 8, baseY + 10);
            ctx.quadraticCurveTo(i + 11, baseY + 2, i + 6, baseY - 5);
            ctx.stroke();
        }

        // Flowers
        this.flowers.forEach(f => {
            // Stem
            ctx.strokeStyle = '#388E3C';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x, f.y - f.size * 2);
            ctx.stroke();

            // Petals
            ctx.fillStyle = f.color;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                ctx.beginPath();
                ctx.arc(
                    f.x + Math.cos(angle) * f.size * 0.6,
                    f.y - f.size * 2 + Math.sin(angle) * f.size * 0.6,
                    f.size * 0.4, 0, Math.PI * 2
                );
                ctx.fill();
            }
            // Center
            ctx.fillStyle = '#FFF176';
            ctx.beginPath();
            ctx.arc(f.x, f.y - f.size * 2, f.size * 0.25, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderObstacles(ctx) {
        const bodies = this.Composite.allBodies(this.engine.world);

        bodies.forEach(body => {
            if (!body.gameData) return;
            const obs = body.gameData;

            if (obs.isGround || obs.y > 580) {
                // Ground: grass + dirt layers
                const x = obs.x - obs.w / 2;
                const y = obs.y - obs.h / 2;

                // Dirt
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(x, y + 4, obs.w, obs.h - 4);

                // Grass top
                const grassGrad = ctx.createLinearGradient(x, y, x, y + 8);
                grassGrad.addColorStop(0, '#66BB6A');
                grassGrad.addColorStop(1, '#4CAF50');
                ctx.fillStyle = grassGrad;
                ctx.fillRect(x, y, obs.w, 8);
            } else {
                // Platform / wall: wooden plank look
                const x = obs.x - obs.w / 2;
                const y = obs.y - obs.h / 2;

                // Wood body
                ctx.fillStyle = '#A1887F';
                ctx.beginPath();
                ctx.roundRect(x, y, obs.w, obs.h, 4);
                ctx.fill();

                // Wood grain lines
                ctx.strokeStyle = '#8D6E63';
                ctx.lineWidth = 1;
                const grainStep = obs.h > obs.w ? obs.w / 4 : obs.h / 4;
                if (obs.w > obs.h) {
                    // Horizontal plank
                    for (let gy = y + grainStep; gy < y + obs.h; gy += grainStep) {
                        ctx.beginPath();
                        ctx.moveTo(x + 2, gy);
                        ctx.lineTo(x + obs.w - 2, gy);
                        ctx.stroke();
                    }
                } else {
                    // Vertical plank
                    for (let gx = x + grainStep; gx < x + obs.w; gx += grainStep) {
                        ctx.beginPath();
                        ctx.moveTo(gx, y + 2);
                        ctx.lineTo(gx, y + obs.h - 2);
                        ctx.stroke();
                    }
                }

                // Border
                ctx.strokeStyle = '#795548';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x, y, obs.w, obs.h, 4);
                ctx.stroke();
            }
        });
    }

    renderBeehives(ctx) {
        this.beehives.forEach(bh => bh.render(ctx));
    }

    renderBees(ctx) {
        this.bees.forEach(bee => bee.render(ctx));
    }

    renderTimerCircle(ctx) {
        if (this.state !== 'SIMULATING') return;

        const cx = this.width / 2;
        const cy = 45;
        const radius = 28;
        const level = levels[this.currentLevel];
        const totalTime = level ? level.timer || 10 : 10;
        const progress = this.timer / totalTime;

        // Background circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Progress arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        const color = progress > 0.3 ? '#4CAF50' : '#FF5252';
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Timer number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.timer, cx, cy);
        ctx.textBaseline = 'alphabetic';
    }

    renderGoAnimation(ctx) {
        if (this.state !== 'GO') return;

        // Animate
        this.goScale += (1.2 - this.goScale) * 0.15;
        if (this.goScale > 1.1) {
            this.goScale += (1.0 - this.goScale) * 0.1;
        }

        const cx = this.width / 2;
        const cy = this.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.goScale, this.goScale);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = 'bold 80px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO!', 3, 3);

        // Main text
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#E65100';
        ctx.lineWidth = 4;
        ctx.strokeText('GO!', 0, 0);
        ctx.fillText('GO!', 0, 0);

        ctx.restore();
    }

    renderCharacterFace(ctx) {
        if (!this.mabbung || this.state === 'END') return;

        const mx = this.mabbung.position.x;
        const my = this.mabbung.position.y;

        // Check if any bee is close
        let closestBee = Infinity;
        this.bees.forEach(bee => {
            const dist = Math.hypot(
                bee.body.position.x - mx,
                bee.body.position.y - my
            );
            if (dist < closestBee) closestBee = dist;
        });

        const isScared = closestBee < 100 && this.state === 'SIMULATING';

        ctx.save();
        ctx.translate(mx, my);

        // 물리 회전과 시각 일치
        ctx.rotate(this.mabbung.angle);

        // Trembling when scared
        if (isScared) {
            ctx.translate(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
        }

        // ===== SHIBA DOG FACE =====
        if (this.mabbungImage.complete) {
            ctx.drawImage(this.mabbungImage, -22, -22, 44, 44);
        }

        ctx.restore();
    }

    reset() {
        this.state = 'MENU';
        this.gameOverScreen.classList.add('hidden');
        clearInterval(this.timerInterval);
        this.beehives.forEach(bh => bh.stopSpawning());
        this.Composite.clear(this.engine.world);
        this.Engine.clear(this.engine);
        this.bees = [];
        this.beehives = [];
        this.startScreen.classList.remove('hidden');
    }
}
