import Matter from 'matter-js';
import decomp from 'poly-decomp';
import { InputHandler } from './InputHandler.js';
import { Bee } from './Bee.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.uiLayer = document.getElementById('ui-layer');
        this.timerDisplay = document.getElementById('timer-display');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.gameMessage = document.getElementById('game-message');
        this.resetButton = document.getElementById('reset-button');

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
        this.inputHandler = null;

        // State
        this.state = 'WAITING'; // WAITING -> DRAWING -> SIMULATING -> END
        this.timer = 10;
        this.timerInterval = null;

        this.resetButton.addEventListener('click', () => this.reset());

        // Canvas size
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        // Setup Matter Physics Environment
        this.engine = this.Engine.create();

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

        this.createEnvironment();
        this.createCharacter();

        this.Render.run(this.render);

        // Create runner
        this.runner = this.Runner.create();
        this.Runner.run(this.runner, this.engine);

        // Physics events
        this.Events.on(this.engine, 'beforeUpdate', () => {
            this.bees.forEach(bee => bee.update());
            this.checkBounds();
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
    }

    createEnvironment() {
        const wallOptions = { isStatic: true, render: { fillStyle: '#8B4513' } };
        const thickness = 60;

        // Floor
        const floor = this.Bodies.rectangle(this.width / 2, this.height + thickness / 2 - 20, this.width, thickness, wallOptions);
        // Left wall
        const leftWall = this.Bodies.rectangle(-thickness / 2, this.height / 2, thickness, this.height, wallOptions);
        // Right wall
        const rightWall = this.Bodies.rectangle(this.width + thickness / 2, this.height / 2, thickness, this.height, wallOptions);

        // Platform for Mabbung to stand on initially
        const platform = this.Bodies.rectangle(this.width / 2, this.height - 100, 200, 30, wallOptions);

        this.walls = [floor, leftWall, rightWall, platform];
        this.Composite.add(this.engine.world, this.walls);
    }

    createCharacter() {
        // Mabbung (A doge-like character)
        this.mabbung = this.Bodies.circle(this.width / 2, this.height - 150, 25, {
            restitution: 0.4,
            friction: 0.5,
            density: 0.05,
            render: {
                fillStyle: '#FFCC00',
                strokeStyle: '#000',
                lineWidth: 2
            }
        });
        this.mabbung.label = 'character';
        this.Composite.add(this.engine.world, this.mabbung);
    }

    startSimulation() {
        if (this.state === 'SIMULATING') return;
        this.state = 'SIMULATING';

        // Spawn bees
        this.bees.push(new Bee(this, 100, 100));
        this.bees.push(new Bee(this, this.width - 100, 100));
        this.bees.push(new Bee(this, this.width / 2, 50));

        // Start timer
        this.timer = 10;
        this.timerDisplay.innerText = `Time: ${this.timer}`;
        this.timerInterval = setInterval(() => {
            if (this.state !== 'SIMULATING') return;
            this.timer--;
            this.timerDisplay.innerText = `Time: ${this.timer}`;
            if (this.timer <= 0) {
                this.triggerGameOver(true);
            }
        }, 1000);
    }

    checkBounds() {
        if (this.state !== 'SIMULATING' || !this.mabbung) return;
        if (this.mabbung.position.y > this.height + 100 ||
            this.mabbung.position.x < -100 ||
            this.mabbung.position.x > this.width + 100) {
            this.triggerGameOver(false);
        }
    }

    triggerGameOver(isWin) {
        this.state = 'END';
        clearInterval(this.timerInterval);

        this.gameMessage.innerText = isWin ? 'You Saved Mabbung!' : 'Game Over!';
        this.gameMessage.style.color = isWin ? '#4CAF50' : '#FF5252';
        this.gameOverScreen.classList.remove('hidden');
    }

    reset() {
        this.state = 'WAITING';
        this.gameOverScreen.classList.add('hidden');
        clearInterval(this.timerInterval);
        this.timer = 10;
        this.timerDisplay.innerText = `Time: ${this.timer}`;

        this.Composite.clear(this.engine.world);
        this.Engine.clear(this.engine);
        this.bees = [];
        this.inputHandler.points = [];
        this.inputHandler.pathBody = null;

        this.createEnvironment();
        this.createCharacter();
    }
}
