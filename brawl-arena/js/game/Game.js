// ========================================
// GAME - Main Game Controller (2 Player Mode)
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { GAME_CONFIG, TEAMS, GAME_STATES, BRAWLERS, AI_DIFFICULTY } from '../utils/constants.js';
import { GameMap } from '../map/Map.js';
import { GEM_GRAB_MAP } from '../map/mapData.js';
import { InputManager } from '../input/InputManager.js';
import { AIController } from '../ai/AIController.js';
import { FlowField } from '../ai/FlowField.js';
import { GemGrabMode } from '../modes/GemGrab.js';
import { AudioManager } from '../audio/AudioManager.js';
import { EffectsManager } from '../effects/Effects.js';
import { RenderSystem } from './RenderSystem.js';

import { BRAWLER_CLASSES } from '../entities/brawlers/index.js';

/**
 * 게임의 중앙 컨트롤러 클래스
 * 모든 시스템을 초기화하고 게임 루프를 관리
 */
export class Game {
    /**
     * 게임 인스턴스 생성
     * @param {HTMLCanvasElement} canvas - 렌더링할 Canvas 엘리먼트
     * @param {string} player1Brawler - 플레이어 1의 브롤러 ID (예: 'BROCK')
     * @param {string} player2Brawler - 플레이어 2의 브롤러 ID (예: 'COLT')
     * @param {Object} mapData - 맵 데이터 (mapData.js에서 가져옴)
     */
    constructor(canvas, player1Brawler, player2Brawler, mapData = GEM_GRAB_MAP, teamMode = 'vs', aiDifficultiesByTeam = {}) {
        this.player1BrawlerId = player1Brawler;
        this.player2BrawlerId = player2Brawler;
        this.teamMode = teamMode;

        // Initialize systems
        this.map = new GameMap(mapData);
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

        // Pre-computed navigation
        this.flowField = new FlowField(this.map);

        // Players (2 player mode)
        this.player1 = null;
        this.player2 = null;
        this.player = null; // For compatibility

        // Game state
        this.state = GAME_STATES.PLAYING;
        this.gameMode = null;

        // AI Difficulty
        this.aiDifficultiesByTeam = {
            [TEAMS.BLUE]: aiDifficultiesByTeam[TEAMS.BLUE] || AI_DIFFICULTY.EASY,
            [TEAMS.RED]: aiDifficultiesByTeam[TEAMS.RED] || AI_DIFFICULTY.EASY,
        };
        this.aiDifficulty = AI_DIFFICULTY.EASY;

        // Timing
        this.lastTime = 0;
        this.running = false;
    }

    /**
     * 카메라 객체 반환 (RenderSystem의 카메라)
     * @returns {Object} 카메라 정보 {x, y, zoom, width, height}
     */
    get camera() {
        return this.renderSystem.camera;
    }

    getAiDifficultyForTeam(team) {
        return this.aiDifficultiesByTeam[team] || this.aiDifficulty || AI_DIFFICULTY.EASY;
    }

    /**
     * 게임 초기화 - 브롤러 생성, Flow Field 사전 계산 등
     */
    init() {
        // Create game mode
        this.gameMode = new GemGrabMode(this);

        // Pre-generate flow fields for common destinations
        this.flowField.pregenerate();

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

        // Create Player 2
        const player2Team = this.teamMode === 'same' ? TEAMS.BLUE : TEAMS.RED;
        const Player2Class = BRAWLER_CLASSES[this.player2BrawlerId];
        const player2Spawn = this.map.getSpawnPosition(player2Team);
        this.player2 = new Player2Class(player2Team, player2Spawn.x, player2Spawn.y);
        this.player2.isPlayer = true;
        this.player2.playerNumber = 2;
        this.brawlers.push(this.player2);

        if (this.teamMode === 'same') {
            // Same team: P1 + P2 + 1 bot = 3 blue, 3 red bots
            this.createTeamBot(TEAMS.BLUE);
            this.createTeamBot(TEAMS.RED);
            this.createTeamBot(TEAMS.RED);
            this.createTeamBot(TEAMS.RED);
        } else {
            // VS mode: P1 + 2 blue bots = 3, P2 + 2 red bots = 3
            this.createTeamBot(TEAMS.BLUE);
            this.createTeamBot(TEAMS.BLUE);
            this.createTeamBot(TEAMS.RED);
            this.createTeamBot(TEAMS.RED);
        }

        // Resume audio context on first interaction
        document.addEventListener('click', () => this.audioManager.resume(), { once: true });
        document.addEventListener('keydown', () => this.audioManager.resume(), { once: true });
    }

    /**
     * AI 봇 생성 - 팀 구성 분석 후 최적의 브롤러 선택
     * @param {string} team - 팀 식별자 (TEAMS.BLUE 또는 TEAMS.RED)
     */
    createTeamBot(team) {
        // Get current team members
        const teamMembers = this.brawlers.filter(b => b.team === team);

        // Analyze current team composition
        const hasTank = teamMembers.some(b => ['TANK', 'FIGHTER'].includes(b.config.role));
        const hasDamage = teamMembers.some(b => ['MARKSMAN', 'CONTROLLER', 'FIGHTER'].includes(b.config.role));
        const hasSupport = teamMembers.some(b => b.config.role === 'SUPPORT');

        // Count roles for diversity
        const roleCounts = {};
        teamMembers.forEach(b => {
            const r = b.config.role;
            roleCounts[r] = (roleCounts[r] || 0) + 1;
        });

        // Calculate scores for each available brawler
        const candidates = Object.values(BRAWLER_CLASSES).map(BrawlerClass => {
            // Find the config for this class
            const brawlerId = Object.keys(BRAWLER_CLASSES).find(key => BRAWLER_CLASSES[key] === BrawlerClass);
            const config = BRAWLERS[brawlerId.toUpperCase()]; // Config keys are BRAWLER_ID (uppercase)

            if (!config) return { id: 'unknown', score: -999, Class: BrawlerClass };

            let score = 0;

            // 1. Avoid Duplicates (Strong negative)
            if (teamMembers.some(m => m.config.id === config.id)) {
                score -= 1000;
            }

            // 2. Role Needs
            if (!hasTank && ['TANK', 'FIGHTER'].includes(config.role)) {
                score += 50; // Strong need for frontline
            }
            if (!hasDamage && ['MARKSMAN', 'CONTROLLER', 'FIGHTER'].includes(config.role)) {
                score += 50; // Strong need for damage
            }
            if (!hasSupport && config.role === 'SUPPORT') {
                score += 30; // Moderate need for support
            }

            // 3. Balance Factors
            // If we have a tank, we probably want ranged damage
            if (hasTank && config.role === 'MARKSMAN') {
                score += 20;
            }

            // 4. Role Diversity (Penalty for too many of same role)
            if ((roleCounts[config.role] || 0) > 0) {
                score -= 20;
            }

            // 5. Randomness
            score += Math.random() * 10;

            return { id: config.id, score, Class: BrawlerClass };
        });

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        // Pick the best one (or top 3 random for variety if scores are close)
        // Let's just pick the absolute best for now to ensure balance.
        const bestCandidate = candidates[0];
        const BrawlerClass = bestCandidate.Class;

        const spawnPos = this.map.getSpawnPosition(team);

        const bot = new BrawlerClass(team, spawnPos.x, spawnPos.y);
        bot.isPlayer = false;
        this.brawlers.push(bot);

        // Create AI controller
        const aiController = new AIController(bot, this);
        this.aiControllers.push(aiController);
    }

    /**
     * 게임 루프 시작
     */
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    /**
     * 게임 루프 중지
     */
    stop() {
        this.running = false;
    }

    /**
     * 게임 일시정지
     */
    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.showPauseOverlay();
        }
    }

    /**
     * 게임 재개
     */
    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.hidePauseOverlay();
            this.lastTime = performance.now(); // Reset time to avoid big delta
        }
    }

    /**
     * 일시정지 토글
     */
    togglePause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.pause();
        } else if (this.state === GAME_STATES.PAUSED) {
            this.resume();
        }
    }

    /**
     * 일시정지 오버레이 표시
     */
    showPauseOverlay() {
        let overlay = document.getElementById('pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pause-overlay';
            overlay.innerHTML = `
                <div class="pause-content">
                    <h1>⏸️ 일시정지</h1>
                    <p>ESC 키를 눌러 게임을 재개하세요</p>
                    <div class="pause-actions">
                        <button id="resume-btn" class="pause-btn">▶️ 게임 재개</button>
                        <button id="restart-btn" class="pause-btn restart">↻ 처음부터 다시</button>
                    </div>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            const content = overlay.querySelector('.pause-content');
            content.style.cssText = `
                background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
                padding: 50px 80px;
                border-radius: 24px;
                text-align: center;
                color: white;
                box-shadow: 0 15px 50px rgba(0,0,0,0.7);
                border: 4px solid #3498db;
            `;
            const h1 = overlay.querySelector('h1');
            h1.style.cssText = `
                font-size: 64px;
                margin-bottom: 30px;
                text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
                font-family: 'Lilita One', cursive;
            `;
            const p = overlay.querySelector('p');
            p.style.cssText = `
                font-size: 24px;
                margin-bottom: 40px;
                color: #ecf0f1;
                font-weight: bold;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
            `;
            const actions = overlay.querySelector('.pause-actions');
            actions.style.cssText = `
                display: flex;
                gap: 14px;
                justify-content: center;
                flex-wrap: wrap;
            `;
            const buttons = overlay.querySelectorAll('.pause-btn');
            buttons.forEach(btn => {
                btn.style.cssText = `
                padding: 20px 50px;
                font-size: 26px;
                font-family: 'Lilita One', cursive;
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                border: none;
                border-radius: 10px;
                color: white;
                cursor: pointer;
                font-weight: bold;
                transition: transform 0.2s, box-shadow 0.2s;
            `;
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 5px 20px rgba(46, 204, 113, 0.5)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                });
            });
            const resumeBtn = overlay.querySelector('#resume-btn');
            const restartBtn = overlay.querySelector('#restart-btn');
            restartBtn.style.background = 'linear-gradient(135deg, #d35400 0%, #f39c12 100%)';
            resumeBtn.addEventListener('click', () => this.resume());
            restartBtn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('restart-current-game'));
            });
            document.body.appendChild(overlay);
        } else {
            overlay.style.display = 'flex';
        }
    }

    /**
     * 일시정지 오버레이 숨기기
     */
    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * 메인 게임 루프 - RequestAnimationFrame 기반
     * 60 FPS 목표로 update와 render를 반복 호출
     */
    gameLoop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.renderSystem.render(this); // Pass game state (this) to render system

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 게임 상태 업데이트
     * @param {number} deltaTime - 이전 프레임 이후 경과 시간 (초)
     */
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
            if (brawler.justDied) {
                this.gameMode.onBrawlerDeath(brawler, this);
                brawler.justDied = false;
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
        if (isVictory === 'draw') {
            resultTitle.textContent = '🤝 DRAW!';
            resultTitle.className = 'result-title draw';
        } else if (isVictory) {
            resultTitle.textContent = '🔵 BLUE TEAM WINS!';
            resultTitle.className = 'result-title victory';
        } else {
            resultTitle.textContent = '🔴 RED TEAM WINS!';
            resultTitle.className = 'result-title defeat';
        }

        // Stars based on margin
        const margin = Math.abs(stats.blueGems - stats.redGems);
        let starCount = margin >= 5 ? 3 : margin >= 3 ? 2 : 1;

        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('empty', index >= starCount);
        });

        // Show stats for both players
        // Show stats for both players with team coloring
        resultStats.innerHTML = `
            <div class="result-teams-container">
                <div class="result-team blue">
                    <h3 class="team-title">BLUE TEAM</h3>
                    <div class="team-score-display">
                        <div class="gem-icon">💎</div>
                        <div class="gem-count">${stats.blueGems}</div>
                    </div>
                </div>
                
                <div class="matches-divider">VS</div>

                <div class="result-team red">
                    <h3 class="team-title">RED TEAM</h3>
                    <div class="team-score-display">
                        <div class="gem-icon">💎</div>
                        <div class="gem-count">${stats.redGems}</div>
                    </div>
                </div>
            </div>
            <div class="score-summary">
                <div class="score-item blue">
                    <span class="score-label">KILLS:</span>
                    <span class="score-value">${stats.blueScore}</span>
                </div>
                <div class="score-item red">
                    <span class="score-label">KILLS:</span>
                    <span class="score-value">${stats.redScore}</span>
                </div>
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
