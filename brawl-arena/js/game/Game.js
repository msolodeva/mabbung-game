// ========================================
// GAME - Main Game Controller (2 Player Mode)
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
import { RenderSystem } from './RenderSystem.js';

import { BRAWLER_CLASSES } from '../entities/brawlers/index.js';

export class Game {
    constructor(canvas, player1Brawler, player2Brawler) {
        this.player1BrawlerId = player1Brawler;
        this.player2BrawlerId = player2Brawler;

        // Initialize systems
        this.map = new GameMap(GEM_GRAB_MAP);
        this.renderSystem = new RenderSystem(canvas, this.map);
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

        // Players (2 player mode)
        this.player1 = null;
        this.player2 = null;
        this.player = null; // For compatibility

        // Game state
        this.state = GAME_STATES.PLAYING;
        this.gameMode = null;

        // Timing
        this.lastTime = 0;
        this.running = false;
    }

    get camera() {
        return this.renderSystem.camera;
    }

    init() {
        // Create game mode
        this.gameMode = new GemGrabMode(this);

        // Create Player 1 (Blue team)
        const Player1Class = BRAWLER_CLASSES[this.player1BrawlerId];
        const player1Spawn = this.map.getSpawnPosition(TEAMS.BLUE);
        this.player1 = new Player1Class(TEAMS.BLUE, player1Spawn.x, player1Spawn.y);
        this.player1.isPlayer = true;
        this.player1.playerNumber = 1;
        this.brawlers.push(this.player1);

        // For compatibility with existing code
        this.player = this.player1;
        this.playerTeam = TEAMS.BLUE;

        // Create Player 2 (Red team)
        const Player2Class = BRAWLER_CLASSES[this.player2BrawlerId];
        const player2Spawn = this.map.getSpawnPosition(TEAMS.RED);
        this.player2 = new Player2Class(TEAMS.RED, player2Spawn.x, player2Spawn.y);
        this.player2.isPlayer = true;
        this.player2.playerNumber = 2;
        this.brawlers.push(this.player2);

        // Create blue team bots (2 more to make 3 total including player 1)
        this.createTeamBot(TEAMS.BLUE);
        this.createTeamBot(TEAMS.BLUE);

        // Create red team bots (2 more to make 3 total including player 2)
        this.createTeamBot(TEAMS.RED);
        this.createTeamBot(TEAMS.RED);

        // Resume audio context on first interaction
        document.addEventListener('click', () => this.audioManager.resume(), { once: true });
        document.addEventListener('keydown', () => this.audioManager.resume(), { once: true });
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
        this.renderSystem.render(this); // Pass game state (this) to render system

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.state !== GAME_STATES.PLAYING) return;

        // Update input manager
        this.inputManager.update();

        // Update Player 1 input
        if (this.player1 && this.player1.isAlive) {
            this.player1.moveDirection = this.inputManager.getMoveDirection();

            // Attack when shoot key is pressed
            if (this.inputManager.getIsAttacking() && this.player1.canAttack()) {
                const attackDir = this.inputManager.getAttackDirection();
                if (attackDir.magnitude() > 0) {
                    this.player1.attack(attackDir, this);
                }
            }

            // Super when super key is pressed
            if (this.inputManager.isSuperPressed() && this.player1.superReady) {
                const attackDir = this.inputManager.getAttackDirection();
                const dir = attackDir.magnitude() > 0 ? attackDir : new Vector2(1, 0);
                this.player1.useSuper(dir, this);
                this.inputManager.consumeSuper();
            }
        }

        // Update Player 2 input
        if (this.player2 && this.player2.isAlive) {
            this.player2.moveDirection = this.inputManager.getPlayer2MoveDirection();

            // Attack when shoot key is pressed
            if (this.inputManager.getPlayer2IsAttacking() && this.player2.canAttack()) {
                const attackDir = this.inputManager.getPlayer2AttackDirection();
                if (attackDir.magnitude() > 0) {
                    this.player2.attack(attackDir, this);
                }
            }

            // Super when super key is pressed
            if (this.inputManager.isPlayer2SuperPressed() && this.player2.superReady) {
                const attackDir = this.inputManager.getPlayer2AttackDirection();
                const dir = attackDir.magnitude() > 0 ? attackDir : new Vector2(1, 0);
                this.player2.useSuper(dir, this);
                this.inputManager.consumePlayer2Super();
            }
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
    }

    onAttackRelease(direction) {
        // Legacy method - no longer used in 2 player mode
    }

    onSuperButtonPressed() {
        // Legacy method - no longer used in 2 player mode
    }

    onGemCollected(brawler) {
        this.audioManager.play('gemCollect');
        this.createEffect('gemCollect', brawler.position.x, brawler.position.y);
    }

    createEffect(type, x, y, options) {
        this.effectsManager.add(type, x, y, options);
    }

    endGame(isVictory) {
        // In 2 player mode, victory is for the winning team
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

        // Determine winner
        const blueWins = stats.blueGems >= 10 || stats.blueGems > stats.redGems;
        resultTitle.textContent = blueWins ? '🔵 BLUE TEAM WINS!' : '🔴 RED TEAM WINS!';
        resultTitle.className = 'result-title ' + (blueWins ? 'victory' : 'defeat');

        // Stars based on margin
        const margin = Math.abs(stats.blueGems - stats.redGems);
        let starCount = margin >= 5 ? 3 : margin >= 3 ? 2 : 1;

        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('empty', index >= starCount);
        });

        // Show stats for both players
        resultStats.innerHTML = `
            <div class="stat-row">
                <span class="label">🔵 Player 1 Gems:</span>
                <span class="value">${this.player1.gems}</span>
            </div>
            <div class="stat-row">
                <span class="label">🔴 Player 2 Gems:</span>
                <span class="value">${this.player2.gems}</span>
            </div>
            <div class="stat-row">
                <span class="label">Blue Team Total:</span>
                <span class="value">💎 ${stats.blueGems}</span>
            </div>
            <div class="stat-row">
                <span class="label">Red Team Total:</span>
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
        this.renderSystem.cleanup();
    }
}
