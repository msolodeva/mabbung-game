// ========================================
// GAME - Main Game Controller (2 Player Mode)
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { TEAMS, GAME_STATES, BRAWLERS, AI_DIFFICULTY, EFFECT_CONFIG } from '../utils/constants.js';
import { GameMap } from '../map/Map.js';
import { DEFAULT_MAP } from '../map/mapData.js';
import { InputManager } from '../input/InputManager.js';
import { AIController } from '../ai/AIController.js';
import { scoreTeamCandidate } from '../ai/teamComposition.js';
import { FlowField } from '../ai/FlowField.js';
import { TeamDeathmatchMode } from '../modes/TeamDeathmatch.js';
import { AudioManager } from '../audio/AudioManager.js';
import { EffectsManager } from '../effects/Effects.js';
import { RenderSystem } from './RenderSystem.js';
import { GameUI } from './GameUI.js';

import { BRAWLER_CLASSES } from '../entities/brawlers/index.js';

const BRAWLER_CANDIDATES = Object.entries(BRAWLER_CLASSES)
    .map(([id, BrawlerClass]) => ({
        BrawlerClass,
        config: BRAWLERS[id.toUpperCase()],
    }))
    .filter(({ config }) => Boolean(config));

/**
 * 게임의 중앙 컨트롤러 클래스
 * 모든 시스템을 초기화하고 게임 루프를 관리
 */
export class Game {
    /**
     * @param {object} options
     * @param {HTMLCanvasElement} options.canvas
     * @param {[string, string]} [options.playerBrawlerIds]
     * @param {object} [options.mapData]
     * @param {'vs'|'same'} [options.teamMode]
     * @param {object} [options.aiDifficultiesByTeam]
     */
    constructor({
        canvas,
        playerBrawlerIds = ['brock', 'colt'],
        mapData = DEFAULT_MAP,
        teamMode = 'vs',
        aiDifficultiesByTeam = {},
    }) {
        this.player1BrawlerId = playerBrawlerIds[0];
        this.player2BrawlerId = playerBrawlerIds[1];
        this.teamMode = teamMode;

        // Initialize systems
        this.map = new GameMap(mapData);
        this.renderSystem = new RenderSystem(canvas, this.map);
        this.inputManager = new InputManager(this);
        this.audioManager = new AudioManager();
        this.effectsManager = new EffectsManager();
        this.ui = new GameUI();

        // Game entities
        this.brawlers = [];
        this.projectiles = [];
        this.spikeFields = [];
        this.aiControllers = [];

        // Pre-computed navigation
        this.flowField = new FlowField(this.map);

        // Players (2 player mode)
        this.player1 = null;
        this.player2 = null;

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
        this.scheduledActions = [];
        this.lastTime = 0;
        this.running = false;
        this.animationFrameId = null;
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
        this.gameMode = new TeamDeathmatchMode(this);

        // Pre-generate flow fields for common destinations
        this.flowField.pregenerate();
        this.map.onTilesChanged = () => this.handleTerrainChanged();

        this.player1 = this.createPlayer(this.player1BrawlerId, TEAMS.BLUE, 1);
        this.brawlers.push(this.player1);

        this.playerTeam = TEAMS.BLUE;

        // Create Player 2
        const player2Team = this.teamMode === 'same' ? TEAMS.BLUE : TEAMS.RED;
        this.player2 = this.createPlayer(this.player2BrawlerId, player2Team, 2);
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
    }

    /**
     * 벽이 파괴되면 AI 내비게이션 캐시를 무효화
     */
    handleTerrainChanged() {
        this.flowField.clearCache();
        for (const ai of this.aiControllers) ai.pathfinder.clearCache();
    }

    createPlayer(brawlerId, team, playerNumber) {
        const BrawlerClass = BRAWLER_CLASSES[brawlerId];
        if (!BrawlerClass) throw new Error(`Unknown brawler: ${brawlerId}`);

        const spawn = this.map.getSpawnPosition(team);
        const player = new BrawlerClass(team, spawn.x, spawn.y);
        player.isPlayer = true;
        player.playerNumber = playerNumber;
        return player;
    }

    /**
     * AI 봇 생성 - 팀 구성 분석 후 최적의 브롤러 선택
     * @param {string} team - 팀 식별자 (TEAMS.BLUE 또는 TEAMS.RED)
     */
    createTeamBot(team) {
        // Get current team members
        const teamMembers = this.brawlers.filter(b => b.team === team);

        const candidates = BRAWLER_CANDIDATES.map(({ BrawlerClass, config }) => ({
            BrawlerClass,
            score: scoreTeamCandidate(config, teamMembers),
        }));

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        // Pick the best one (or top 3 random for variety if scores are close)
        // Let's just pick the absolute best for now to ensure balance.
        const BrawlerClass = candidates[0].BrawlerClass;

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
        if (this.running) return;
        this.running = true;
        this.audioManager.resume();
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(timestamp => this.gameLoop(timestamp));
    }

    /**
     * 게임 루프 중지
     */
    stop() {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * 게임 일시정지
     */
    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.ui.showPause(() => this.resume());
        }
    }

    /**
     * 게임 재개
     */
    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.ui.hidePause();
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
     * 메인 게임 루프 - RequestAnimationFrame 기반
     * 60 FPS 목표로 update와 render를 반복 호출
     */
    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = Math.max(0, Math.min((currentTime - this.lastTime) / 1000, 0.1)); // Cap at 100ms
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.renderSystem.render(this); // Pass game state (this) to render system

        if (this.running) {
            this.animationFrameId = requestAnimationFrame(timestamp => this.gameLoop(timestamp));
        }
    }

    /**
     * 게임 상태 업데이트
     * @param {number} deltaTime - 이전 프레임 이후 경과 시간 (초)
     */
    update(deltaTime) {
        if (this.state !== GAME_STATES.PLAYING) return;

        this.updateScheduledActions(deltaTime);

        // Update input manager
        this.inputManager.update();

        this.updateHumanPlayer(this.player1, 1);
        this.updateHumanPlayer(this.player2, 2);

        // Use one shared visibility rule for human rendering and AI targeting.
        for (const brawler of this.brawlers) brawler.updateVisibility(this);

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

        // Update spike fields
        this.spikeFields = this.spikeFields.filter(f => f.active);

        // Emit floating damage popups and check brawler deaths
        for (const brawler of this.brawlers) {
            if (brawler.pendingDamagePopups?.length) {
                for (const popup of brawler.pendingDamagePopups) {
                    this.createEffect('damageText', popup.x, popup.y, popup);
                }
                brawler.pendingDamagePopups.length = 0;
            }
            if (brawler.justDied) {
                this.audioManager?.play('death');
                this.renderSystem?.triggerShake?.(
                    EFFECT_CONFIG.SHAKE_DEATH.intensity,
                    EFFECT_CONFIG.SHAKE_DEATH.duration
                );
                this.gameMode.onBrawlerDeath(brawler);
                brawler.justDied = false;
            }
        }

        for (const brawler of this.brawlers) brawler.updateVisibility(this);

        // Update game mode
        this.gameMode.update(deltaTime);

        // Update effects and camera shake
        this.effectsManager.update(deltaTime);
        this.renderSystem?.updateShake?.(deltaTime);
    }

    updateHumanPlayer(player, playerNumber) {
        if (!player?.isAlive) return;

        player.moveDirection = this.inputManager.getMoveDirection(playerNumber);
        const attackDirection = this.inputManager.getAttackDirection(playerNumber);
        player.aimDirection = attackDirection;
        player.isAimLocked = this.inputManager.getIsAttacking(playerNumber);

        if (this.inputManager.getIsAttacking(playerNumber) && player.canAttack() && attackDirection.magnitude() > 0) {
            player.attack(attackDirection, this);
        }

        if (this.inputManager.isSuperPressed(playerNumber) && player.superReady) {
            const direction = attackDirection.magnitude() > 0 ? attackDirection : new Vector2(1, 0);
            player.useSuper(direction, this);
            this.inputManager.consumeSuper(playerNumber);
        }
    }

    scheduleAction(owner, delay, callback) {
        if (delay <= 0) {
            if (owner.isAlive) callback();
            return;
        }
        this.scheduledActions.push({ owner, remaining: delay, callback });
    }

    updateScheduledActions(deltaTime) {
        const pending = this.scheduledActions;
        this.scheduledActions = [];
        for (const action of pending) {
            if (!action.owner.isAlive) continue;
            action.remaining -= deltaTime * 1000;
            if (action.remaining <= 0) action.callback();
            else this.scheduledActions.push(action);
        }
    }


    createEffect(type, x, y, options) {
        this.effectsManager.add(type, x, y, options);
        if (type === 'hit' || type === 'explosion' || type === 'heal') {
            this.audioManager?.play(type);
        }
        if (type === 'explosion') {
            this.renderSystem?.triggerShake?.(
                EFFECT_CONFIG.SHAKE_EXPLOSION.intensity,
                EFFECT_CONFIG.SHAKE_EXPLOSION.duration
            );
        } else if (type === 'superBlast' || type === 'spikeField') {
            this.renderSystem?.triggerShake?.(
                EFFECT_CONFIG.SHAKE_SUPER.intensity,
                EFFECT_CONFIG.SHAKE_SUPER.duration
            );
        } else if (type === 'damageText' && (options?.amount || 0) >= EFFECT_CONFIG.HEAVY_HIT_THRESHOLD) {
            this.renderSystem?.triggerShake?.(
                EFFECT_CONFIG.SHAKE_HEAVY_HIT.intensity,
                EFFECT_CONFIG.SHAKE_HEAVY_HIT.duration
            );
        }
    }

    endGame(outcome) {
        this.scheduledActions = [];
        this.state = outcome === 'draw'
            ? GAME_STATES.DRAW
            : outcome ? GAME_STATES.VICTORY : GAME_STATES.DEFEAT;
        this.stop();

        const stats = this.gameMode.getMatchStats();
        this.audioManager?.play(outcome === 'draw' ? 'draw' : 'finish');
        this.ui.showResult(outcome, stats);
    }

    cleanup() {
        this.scheduledActions = [];
        this.stop();
        this.brawlers = [];
        this.projectiles = [];
        this.spikeFields = [];
        this.aiControllers = [];
        this.inputManager.cleanup();
        this.audioManager.cleanup();
        this.effectsManager.clear();
        this.renderSystem.cleanup();
        this.ui.cleanup();
    }
}
