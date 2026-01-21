// ========================================
// GAME - Main Game Controller
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { GAME_CONFIG, TEAMS, GAME_STATES, BRAWLERS } from '../utils/constants.js';
import { GameMap } from '../map/Map.js';
import { GEM_GRAB_MAP } from '../map/mapData.js';
import { InputManager } from '../input/InputManager.js';
import { AIController } from '../ai/AIController.js';
import { GemGrabMode } from '../modes/GemGrab.js';
import { AudioManager } from '../audio/AudioManager.js';
import { EffectsManager } from '../effects/Effects.js';
import { renderSpikeField } from '../entities/brawlers/Spike.js';

// Import brawler classes
import { Shelly } from '../entities/brawlers/Shelly.js';
import { Nita } from '../entities/brawlers/Nita.js';
import { Colt } from '../entities/brawlers/Colt.js';
import { Poco } from '../entities/brawlers/Poco.js';
import { Spike } from '../entities/brawlers/Spike.js';

const BRAWLER_CLASSES = {
    shelly: Shelly,
    nita: Nita,
    colt: Colt,
    poco: Poco,
    spike: Spike,
};

export class Game {
    constructor(canvas, selectedBrawler) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.selectedBrawlerId = selectedBrawler;

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize systems
        this.map = new GameMap(GEM_GRAB_MAP);
        this.inputManager = new InputManager(this);
        this.audioManager = new AudioManager();
        this.effectsManager = new EffectsManager();

        // Game entities
        this.brawlers = [];
        this.projectiles = [];
        this.gems = [];
        this.bears = [];
        this.spikeFields = [];
        this.aiControllers = [];

        // Player info
        this.player = null;
        this.playerTeam = TEAMS.BLUE;

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height,
        };

        // Game state
        this.state = GAME_STATES.PLAYING;
        this.gameMode = null;

        // Timing
        this.lastTime = 0;
        this.running = false;
    }

    resizeCanvas() {
        // Use full window size but maintain aspect ratio
        const maxWidth = Math.min(window.innerWidth, GAME_CONFIG.CANVAS_WIDTH);
        const maxHeight = Math.min(window.innerHeight, GAME_CONFIG.CANVAS_HEIGHT);

        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;

        if (this.camera) {
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        }
    }

    init() {
        // Create game mode
        this.gameMode = new GemGrabMode(this);

        // Create player
        const PlayerClass = BRAWLER_CLASSES[this.selectedBrawlerId];
        const playerSpawn = this.map.getSpawnPosition(TEAMS.BLUE);
        this.player = new PlayerClass(TEAMS.BLUE, playerSpawn.x, playerSpawn.y);
        this.player.isPlayer = true;
        this.brawlers.push(this.player);

        // Create blue team bots (2 more)
        this.createTeamBot(TEAMS.BLUE);
        this.createTeamBot(TEAMS.BLUE);

        // Create red team bots (3)
        this.createTeamBot(TEAMS.RED);
        this.createTeamBot(TEAMS.RED);
        this.createTeamBot(TEAMS.RED);

        // Resume audio context on first interaction
        document.addEventListener('click', () => this.audioManager.resume(), { once: true });
        document.addEventListener('touchstart', () => this.audioManager.resume(), { once: true });
    }

    createTeamBot(team) {
        // Pick a random brawler that's not already in use
        const availableBrawlers = Object.keys(BRAWLER_CLASSES);
        const randomBrawlerId = availableBrawlers[Math.floor(Math.random() * availableBrawlers.length)];

        const BrawlerClass = BRAWLER_CLASSES[randomBrawlerId];
        const spawnPos = this.map.getSpawnPosition(team);

        const bot = new BrawlerClass(team, spawnPos.x, spawnPos.y);
        bot.isPlayer = false;
        this.brawlers.push(bot);

        // Create AI controller
        const aiController = new AIController(bot, this);
        this.aiControllers.push(aiController);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.running = false;
    }

    gameLoop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.state !== GAME_STATES.PLAYING) return;

        // Update player input
        if (this.player && this.player.isAlive) {
            this.player.moveDirection = this.inputManager.getMoveDirection();

            // Auto-attack when mouse is held down or attack joystick is active
            if (this.inputManager.getIsAttacking() && this.player.canAttack()) {
                const attackDir = this.inputManager.getAttackDirection();
                if (attackDir.magnitude() > 0) {
                    this.player.attack(attackDir, this);
                }
            }
        }

        // Update super button state
        if (this.player) {
            this.inputManager.updateSuperButton(this.player.superReady);
        }

        // Update AI controllers
        for (const ai of this.aiControllers) {
            ai.update(deltaTime);
        }

        // Update brawlers
        for (const brawler of this.brawlers) {
            brawler.update(deltaTime, this);
        }

        // Update projectiles
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime, this);
        }
        this.projectiles = this.projectiles.filter(p => p.active);

        // Update bears
        for (const bear of this.bears) {
            bear.update(deltaTime, this);
        }
        this.bears = this.bears.filter(b => b.active);

        // Update spike fields
        this.spikeFields = this.spikeFields.filter(f => f.active);

        // Check brawler deaths
        for (const brawler of this.brawlers) {
            if (!brawler.isAlive && brawler.gems > 0) {
                this.gameMode.onBrawlerDeath(brawler, this);
            }
        }

        // Update game mode
        this.gameMode.update(deltaTime);

        // Update effects
        this.effectsManager.update(deltaTime);

        // Update camera to follow player
        this.updateCamera();
    }

    updateCamera() {
        if (!this.player) return;

        // Center camera on player
        const targetX = this.player.position.x - this.camera.width / 2;
        const targetY = this.player.position.y - this.camera.height / 2;

        // Clamp to map bounds
        this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, targetX));
        this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, targetY));
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render map
        this.map.render(this.ctx, this.camera);

        // Render gems
        for (const gem of this.gems) {
            gem.render(this.ctx, this.camera);
        }

        // Render spike fields
        for (const field of this.spikeFields) {
            renderSpikeField(this.ctx, this.camera, field);
        }

        // Render projectiles
        for (const projectile of this.projectiles) {
            projectile.render(this.ctx, this.camera);
        }

        // Render bears
        for (const bear of this.bears) {
            bear.render(this.ctx, this.camera);
        }

        // Render brawlers (sort by Y for depth)
        const sortedBrawlers = [...this.brawlers].sort((a, b) => a.position.y - b.position.y);
        for (const brawler of sortedBrawlers) {
            const isPlayerTeam = brawler.team === this.playerTeam;
            brawler.render(this.ctx, this.camera, isPlayerTeam);
        }

        // Render effects
        this.effectsManager.render(this.ctx, this.camera);
    }

    onAttackRelease(direction) {
        if (this.player && this.player.isAlive && this.player.canAttack()) {
            this.player.attack(direction, this);
        }
    }

    onSuperButtonPressed() {
        if (this.player && this.player.isAlive && this.player.superReady) {
            const attackDir = this.inputManager.getAttackDirection();
            const dir = attackDir.magnitude() > 0 ? attackDir : new Vector2(1, 0);
            this.player.useSuper(dir, this);
        }
    }

    onGemCollected(brawler) {
        this.audioManager.play('gemCollect');
        this.createEffect('gemCollect', brawler.position.x, brawler.position.y);
    }

    createEffect(type, x, y, options) {
        this.effectsManager.add(type, x, y, options);
    }

    endGame(isVictory) {
        this.state = isVictory ? GAME_STATES.VICTORY : GAME_STATES.DEFEAT;
        this.stop();

        // Show result screen
        const stats = this.gameMode.getMatchStats();
        this.showResultScreen(isVictory, stats);
    }

    showResultScreen(isVictory, stats) {
        const gameScreen = document.getElementById('game-screen');
        const resultScreen = document.getElementById('result-screen');
        const resultTitle = document.getElementById('result-title');
        const starsContainer = document.getElementById('stars-container');
        const resultStats = document.getElementById('result-stats');

        gameScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');

        resultTitle.textContent = isVictory ? 'VICTORY!' : 'DEFEAT';
        resultTitle.className = 'result-title ' + (isVictory ? 'victory' : 'defeat');

        // Calculate stars based on performance
        let starCount = isVictory ? 3 : 1;
        if (isVictory && this.player.gems > 3) starCount = 3;
        else if (isVictory && this.player.gems > 1) starCount = 2;
        else if (isVictory) starCount = 1;

        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('empty', index >= starCount);
        });

        // Show stats
        resultStats.innerHTML = `
            <div class="stat-row">
                <span class="label">Your Gems:</span>
                <span class="value">${this.player.gems}</span>
            </div>
            <div class="stat-row">
                <span class="label">Blue Team:</span>
                <span class="value">💎 ${stats.blueGems}</span>
            </div>
            <div class="stat-row">
                <span class="label">Red Team:</span>
                <span class="value">💎 ${stats.redGems}</span>
            </div>
        `;
    }

    cleanup() {
        this.stop();
        this.brawlers = [];
        this.projectiles = [];
        this.gems = [];
        this.bears = [];
        this.spikeFields = [];
        this.aiControllers = [];
        this.effectsManager.clear();
    }
}
