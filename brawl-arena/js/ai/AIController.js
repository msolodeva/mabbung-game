// ========================================
// AI CONTROLLER - Bot Behavior (Enhanced Pathfinding)
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { AI_CONFIG, AI_DIFFICULTY, TEAMS } from '../utils/constants.js';
import { Pathfinder } from './Pathfinder.js';
import { FlowField } from './FlowField.js';

export class AIController {
    constructor(brawler, game) {
        this.brawler = brawler;
        this.game = game;
        this.decisionTimer = 0;
        this.nextDecisionInterval = 0;
        this.currentTarget = null;
        this.targetGem = null;
        this.state = 'idle';
        this.aggression = AI_CONFIG.AGGRESSION_LEVELS.NORMAL;

        // Pathfinding
        this.pathfinder = new Pathfinder(game.map);
        this.flowField = game.flowField; // Shared flow field from game
        this.currentPath = [];
        this.pathIndex = 0;
        this.lastTargetPos = null;
        this.pathRecalcTimer = 0;

        // Stuck detection
        this.lastPosition = null;
        this.stuckTimer = 0;
        this.stuckThreshold = 500; // ms before considered stuck
        this.stuckDistance = 10; // minimum movement to not be stuck
        this.forceRecalcTimer = 0;

        // Alternative movement
        this.alternativeDir = null;
        this.alternativeTimer = 0;

        // Direction smoothing (방향 스무딩)
        this.smoothedDirection = new Vector2(0, 0);
        // smoothingFactor는 AI 지능 설정에서 가져옴 (applyDirectionSmoothing에서 사용)

        // Reaction delay system (반응 지연)
        this.reactionQueue = [];
        this.lastSeenEnemy = null;

        // Aiming system (조준 시스템)
        this.currentAimAngle = 0;

        // Global game state awareness (전역 게임 상태 인지)
        this.globalStats = {
            myTeamGems: 0,
            enemyTeamGems: 0,
            myTeamScore: 0,
            enemyTeamScore: 0,
            countdownActive: false,
            winningTeam: null,
            timeRemaining: 0
        };

        // Debug mode (set to true to visualize paths)
        this.debugMode = false;

        // Role assignment (역할 할당)
        this.isCarrier = false;
        this.teamCarrier = null;

        // Defend spawn state (기지 방어)
        this.defendPatrolTarget = null;

        // Strafe movement (스트레이프 움직임)
        this.lastStrafeChange = 0;
        this.strafeSide = 1;

        // Patrol wait timer (순찰 대기 타이머)
        this.patrolWaitTimer = 0;
    }

    getDifficulty() {
        if (typeof this.game.getAiDifficultyForTeam === 'function') {
            return this.game.getAiDifficultyForTeam(this.brawler.team);
        }

        return this.game.aiDifficulty || AI_DIFFICULTY.EASY;
    }

    /**
     * 전역 게임 상태 업데이트
     * - GemGrabMode에서 팀 보석 수, 스코어, 승리 카운트다운 상태 등을 읽어옴
     * - AI 의사결정에 활용 가능한 전략적 정보 제공
     */
    updateGlobalStats() {
        if (!this.game.gameMode) return;

        const gameMode = this.game.gameMode;
        const myTeam = this.brawler.team;
        const enemyTeam = myTeam === TEAMS.BLUE ? TEAMS.RED : TEAMS.BLUE;

        // 팀 보석 수 업데이트
        this.globalStats.myTeamGems = gameMode.teamGems?.[myTeam] || 0;
        this.globalStats.enemyTeamGems = gameMode.teamGems?.[enemyTeam] || 0;

        // 팀 스코어 업데이트 (킬 수)
        this.globalStats.myTeamScore = gameMode.teamScores?.[myTeam] || 0;
        this.globalStats.enemyTeamScore = gameMode.teamScores?.[enemyTeam] || 0;

        // 승리 카운트다운 상태
        this.globalStats.countdownActive = gameMode.countdownActive || false;
        this.globalStats.winningTeam = gameMode.winningTeam || null;

        // 남은 매치 시간
        this.globalStats.timeRemaining = gameMode.matchTimer || 0;
    }

    update(deltaTime) {
        if (!this.brawler.isAlive) {
            this.resetPathfinding();
            return;
        }

        // 전역 게임 상태 갱신
        this.updateGlobalStats();

        const deltaMs = deltaTime * 1000;
        const difficulty = this.getDifficulty();

        // Stuck detection
        this.detectStuck(deltaMs);

        // Update timers
        this.decisionTimer += deltaMs;
        this.forceRecalcTimer += deltaMs;

        if (this.alternativeTimer > 0) {
            this.alternativeTimer -= deltaMs;
        }

        // Decrease patrol wait timer
        if (this.patrolWaitTimer > 0) {
            this.patrolWaitTimer -= deltaMs;
        }

            // 지능별 의사결정 간격 (무작위성 적용)
        if (this.decisionTimer >= this.nextDecisionInterval) {
            this.decisionTimer = 0;
            this.makeDecision();
            // 다음 의사결정 간격을 ±20% 범위 내에서 무작위로 설정
            const jitterRange = 0.2;
            const jitterMultiplier = 1.0 + (Math.random() * 2 - 1) * jitterRange; // 0.8 ~ 1.2
            this.nextDecisionInterval = difficulty.decisionInterval * jitterMultiplier;
        }

        // Periodically check if we should use Super
        this.tryUseSuper();

        this.updateAim(deltaTime);
        this.executeState(deltaTime);
    }

    /**
     * 부드러운 조준 회전 처리
     * - 타겟 방향으로 점진적으로 조준을 변경하여 인간적인 움직임 구현
     */
    updateAim(deltaTime) {
        // 타겟이 없거나 죽어있으면 현재 각도 유지
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            return;
        }

        const difficulty = this.getDifficulty();

        // 타겟 방향 계산
        const toTarget = this.currentTarget.position.subtract(this.brawler.position);
        const targetAngle = toTarget.angle();

        // 현재 조준 각도와 타겟 각도 사이의 최단 회전 경로 계산 (범위: -PI ~ PI)
        let angleDiff = targetAngle - this.currentAimAngle;

        // 각도 차이를 -PI ~ PI 범위로 정규화
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 이번 프레임의 최대 회전 각도 계산
        const maxRotation = difficulty.aimRotationSpeed * deltaTime;

        // 조준 각도를 타겟 방향으로 보간
        if (Math.abs(angleDiff) < maxRotation) {
            // 목표에 거의 도달 - 정확히 맞춤
            this.currentAimAngle = targetAngle;
        } else {
            // 점진적으로 회전
            this.currentAimAngle += Math.sign(angleDiff) * maxRotation;
        }

        // 각도를 -PI ~ PI 범위로 정규화
        while (this.currentAimAngle > Math.PI) this.currentAimAngle -= Math.PI * 2;
        while (this.currentAimAngle < -Math.PI) this.currentAimAngle += Math.PI * 2;
    }

    detectStuck(deltaMs) {
        const difficulty = this.getDifficulty();
        const currentPos = this.brawler.position.clone();

        if (this.lastPosition) {
            const moved = currentPos.distanceTo(this.lastPosition);

            if (moved < this.stuckDistance && this.brawler.moveDirection.magnitude() > 0.1) {
                // We're trying to move but not moving much
                this.stuckTimer += deltaMs;

                // 지능별 반응 시간
                if (this.stuckTimer > difficulty.stuckThreshold) {
                    this.onStuck();
                    this.stuckTimer = 0;
                }
            } else {
                // Moving fine
                this.stuckTimer = 0;
                this.alternativeDir = null;
            }
        }

        this.lastPosition = currentPos;
    }

    onStuck() {
        // Force path recalculation
        this.currentPath = [];
        this.pathIndex = 0;
        this.pathfinder.clearCache();

        // 현재 목표 방향으로 가장 가까운 걸을 수 있는 방향 찾기
        const targetPos = this.getTargetPosition();
        if (targetPos) {
            const bestDir = this.findBestUnstuckDirection(targetPos);
            if (bestDir) {
                this.alternativeDir = bestDir;
                this.alternativeTimer = 400;
                return;
            }
        }

        // Fallback: 8방향 중 걸을 수 있는 방향 찾기
        const walkableDir = this.findAnyWalkableDirection();
        if (walkableDir) {
            this.alternativeDir = walkableDir;
            this.alternativeTimer = 300;
        }
    }

    /**
     * 현재 상태에 따른 목표 위치 반환
     */
    getTargetPosition() {
        switch (this.state) {
            case 'collectGem':
                return this.targetGem?.position;
            case 'chase':
            case 'attack':
                return this.currentTarget?.position;
            case 'retreat':
                return this.game.map.getSpawnPosition(this.brawler.team);
            case 'patrol':
                return this.patrolTarget;
            case 'defendSpawn':
                return this.defendPatrolTarget;
            default:
                return null;
        }
    }

    /**
     * 목표 방향으로 최적의 탈출 방향 찾기
     * - FlowField 방향을 우선 확인하여 물/장애물을 피해 다리를 찾음
     * - 더 넓은 범위를 체크하여 다리 발견 확률 증가
     */
    findBestUnstuckDirection(targetPos) {
        const pos = this.brawler.position;
        const toTarget = targetPos.subtract(pos);
        if (toTarget.magnitude() === 0) return null;

        // 1. FlowField 방향 우선 확인 (다리를 통한 경로)
        if (this.flowField && targetPos) {
            const fieldKey = `unstuck_${Math.floor(targetPos.x / 100)}_${Math.floor(targetPos.y / 100)}`;
            const flowDir = this.flowField.getDirection(fieldKey, pos.x, pos.y, targetPos.x, targetPos.y);

            if (flowDir && flowDir.magnitude() > 0.1) {
                // FlowField가 유효한 방향을 제공하면 사용
                const testPos = pos.add(flowDir.multiply(80));
                if (!this.game.map.isPositionSolid(testPos.x, testPos.y)) {
                    return flowDir;
                }
            }
        }

        const baseAngle = toTarget.angle();

        // 2. 더 넓은 범위 체크 (60→150)
        const checkDistances = [60, 100, 150];

        // 목표 방향 근처 각도들을 우선 체크 (45도 간격)
        const angleOffsets = [
            0, Math.PI / 4, -Math.PI / 4,
            Math.PI / 2, -Math.PI / 2,
            3 * Math.PI / 4, -3 * Math.PI / 4,
            Math.PI
        ];

        for (const checkDist of checkDistances) {
            for (const offset of angleOffsets) {
                const testAngle = baseAngle + offset;
                const testDir = Vector2.fromAngle(testAngle);
                const testPos = pos.add(testDir.multiply(checkDist));

                if (!this.game.map.isPositionSolid(testPos.x, testPos.y)) {
                    return testDir;
                }
            }
        }

        return null;
    }

    /**
     * 어느 방향이든 걸을 수 있는 방향 찾기
     */
    findAnyWalkableDirection() {
        const pos = this.brawler.position;
        const checkDist = 50;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const testDir = Vector2.fromAngle(angle);
            const testPos = pos.add(testDir.multiply(checkDist));

            if (!this.game.map.isPositionSolid(testPos.x, testPos.y)) {
                return testDir;
            }
        }

        return null;
    }

    resetPathfinding() {
        this.currentPath = [];
        this.pathIndex = 0;
        this.lastTargetPos = null;
        this.stuckTimer = 0;
        this.alternativeDir = null;
        this.alternativeTimer = 0;
    }

    /**
     * 팀 내 운반자 찾기
     * - 팀원 중 보석을 가장 많이 보유한 브롤러를 반환
     * - 보석 수가 같으면 체력이 높은 쪽을 우선
     *
     * @returns {Brawler|null} 팀 내 운반자 (없으면 null)
     */
    findTeamCarrier() {
        let carrier = null;
        let maxGems = -1;
        let maxHealth = -1;

        for (const brawler of this.game.brawlers) {
            // 같은 팀이고 살아있는 브롤러만 확인
            if (brawler.team !== this.brawler.team || !brawler.isAlive) continue;

            // 보석 수가 더 많으면 운반자로 선택
            if (brawler.gems > maxGems) {
                carrier = brawler;
                maxGems = brawler.gems;
                maxHealth = brawler.health;
            }
            // 보석 수가 같으면 체력이 높은 쪽 선택
            else if (brawler.gems === maxGems && brawler.health > maxHealth) {
                carrier = brawler;
                maxHealth = brawler.health;
            }
        }

        return carrier;
    }

    /**
     * 적 팀 운반자 찾기
     * - 적 팀 중 보석을 가장 많이 보유한 브롤러를 반환
     * - 상대 팀 카운트다운 중 역전을 위한 타겟팅에 사용
     *
     * @returns {Brawler|null} 적 팀 운반자 (없으면 null)
     */
    findEnemyCarrier() {
        let carrier = null;
        let maxGems = -1;

        for (const brawler of this.game.brawlers) {
            // 적 팀이고 살아있는 브롤러만 확인
            if (brawler.team === this.brawler.team || !brawler.isAlive) continue;

            // 보석 수가 더 많으면 운반자로 선택
            if (brawler.gems > maxGems) {
                carrier = brawler;
                maxGems = brawler.gems;
            }
        }

        return carrier;
    }

    /**
     * 상황에 따른 동적 후퇴 임계값 계산
     * - 기본값: 지능별 설정값 사용
     * - 우리 팀 승리 카운트다운 중: 보수적 후퇴 (운반자는 90%, 호위병은 기본값 + 0.2)
     * - 상대 팀 승리 카운트다운 중: 공격적 플레이 (25%까지 버팀)
     *
     * @returns {number} 후퇴 임계값 (0~1 범위의 체력 비율)
     */
    calculateRetreatThreshold() {
        const difficulty = this.getDifficulty();
        const baseThreshold = difficulty.retreatThreshold;

        // 우리 팀이 승리 카운트다운 중
        if (this.globalStats.countdownActive && this.globalStats.winningTeam === this.brawler.team) {
            if (this.isCarrier) {
                // 운반자는 최대한 안전하게 (90% 이하 시 후퇴)
                return 0.9;
            } else {
                // 호위병은 더 보수적으로 (기본값 + 0.2)
                return Math.min(baseThreshold + 0.2, 0.85);
            }
        }

        // 상대 팀이 승리 카운트다운 중 - All-in
        if (this.globalStats.countdownActive && this.globalStats.winningTeam !== this.brawler.team) {
            return 0.25; // 25%까지 버팀
        }

        // 일반 상황에서는 기본값 사용
        return baseThreshold;
    }

    makeDecision() {
        // --- Urgent Comeback: Target Enemy Carrier ---
        // 상대 팀이 승리 카운트다운 중이면 적 운반자를 최우선 타겟팅
        if (this.globalStats.countdownActive && this.globalStats.winningTeam !== this.brawler.team) {
            const enemyCarrier = this.findEnemyCarrier();
            if (enemyCarrier) {
                this.currentTarget = enemyCarrier;
                this.state = 'chase';
                return; // 모든 자원을 역전에 투입
            }
        }

        // --- Role Assignment (역할 할당) ---
        // 팀 내 운반자 식별
        this.teamCarrier = this.findTeamCarrier();

        // 내가 팀 내 운반자이면서 보석을 1개 이상 가졌다면 운반자 역할 활성화
        if (this.teamCarrier === this.brawler && this.brawler.gems > 0) {
            this.isCarrier = true;
        } else {
            this.isCarrier = false;
        }

        // --- Carrier Defend Spawn During Countdown ---
        // 카운트다운 중이고, 우리 팀이 이기고 있으며, 내가 운반자일 때 기지 방어
        if (this.globalStats.countdownActive &&
            this.globalStats.winningTeam === this.brawler.team &&
            this.isCarrier) {

            const spawnPos = this.game.map.getSpawnPosition(this.brawler.team);
            const distToSpawn = this.brawler.position.distanceTo(spawnPos);

            // 이미 기지 근처(200 유닛 이내)에 있으면 즉시 defendSpawn 상태로 전환
            if (distToSpawn <= 200) {
                this.state = 'defendSpawn';
                return;
            }

            // 기지에서 멀리 떨어져 있으면 retreat로 기지까지 이동 후 defendSpawn으로 전환
            const healthPercent = this.brawler.health / this.brawler.maxHealth;
            if (healthPercent > 0.5) {
                // 체력이 충분하면 기지로 이동
                this.state = 'retreat';
            } else {
                // 체력이 낮으면 더 보수적으로 후퇴
                this.state = 'retreat';
            }
            return;
        }

        // --- Enhanced Protector Priority ---
        // 호위병이고 운반자가 보석 5개 이상 보유 시 거리가 멀면 호위 우선
        if (!this.isCarrier && this.teamCarrier && this.teamCarrier.gems >= 5) {
            const distToCarrier = this.brawler.position.distanceTo(this.teamCarrier.position);
            if (distToCarrier > 200) {
                this.state = 'patrol'; // 호위 행동 유도 (patrol이 호위 로직 실행)
                return;
            }
        }

        const difficulty = this.getDifficulty();
        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const ammoPercent = this.brawler.ammo / this.brawler.ammoMax;

        // Find nearest gem
        const nearestGem = this.findNearestGem();

        // Find Best target based on counter relationships and synergy
        const bestTarget = this.findBestStrategicTarget();
        const nearestEnemy = bestTarget.enemy;
        const helpAlly = bestTarget.allyToHelp;

        // --- Reaction Delay System ---
        // 새로운 적 발견 시 반응 지연 (무작위성 적용)
        if (nearestEnemy && nearestEnemy !== this.lastSeenEnemy) {
            this.lastSeenEnemy = nearestEnemy;
            // 반응 지연에 0.75~1.25 사이의 무작위 배율 적용
            const reactionJitter = 0.75 + Math.random() * 0.5; // 0.75 ~ 1.25
            this.reactionQueue.push({
                target: nearestEnemy,
                timestamp: Date.now() + (difficulty.reactionDelay * reactionJitter)
            });
            return; // 지연 동안 기존 행동 유지
        }

        // 지연된 반응 처리
        if (this.reactionQueue.length > 0) {
            const reaction = this.reactionQueue[0];
            if (Date.now() >= reaction.timestamp) {
                this.reactionQueue.shift();
                this.currentTarget = reaction.target;
            } else {
                return; // 아직 반응 시간 안 됨
            }
        }

        // --- 1. Tactical Retreat Evaluation ---
        const retreatThreshold = this.calculateRetreatThreshold();
        const isVeryLowHealth = healthPercent < retreatThreshold;
        const hasGems = this.brawler.gems > 0;
        const hasManyGems = this.brawler.gems >= 5;
        const outOfAmmo = this.brawler.ammo === 0;

        const distToEnemy = nearestEnemy ? this.brawler.position.distanceTo(nearestEnemy.position) : Infinity;
        const enemyTooClose = distToEnemy < 200;

        // --- 1-1. Carrier Survival Behavior ---
        // 운반자(보석 5개 이상)는 더 보수적으로 후퇴
        const isWinning = this.globalStats.myTeamGems > this.globalStats.enemyTeamGems;
        if (hasManyGems && (healthPercent <= 0.7 || isWinning)) {
            this.state = 'retreat';
            return;
        }

        // 동적 후퇴 임계값 적용
        if ((isVeryLowHealth && hasGems) || (hasManyGems && healthPercent < 0.45) || (outOfAmmo && enemyTooClose && healthPercent < 0.5)) {
            this.state = 'retreat';
            return;
        }

        // 동적 후퇴 판단
        if (healthPercent < retreatThreshold && hasGems) {
            this.state = 'retreat';
            return;
        }

        // --- Poor Decision System (판단 실수) ---
        if (Math.random() < difficulty.poorDecisionChance) {
            const randomChoice = Math.random();

            // 패닉 후퇴 (체력 충분한데 도망)
            if (randomChoice < 0.4) {
                this.state = 'retreat';
                return;
            }
            // 무모한 돌진 (체력 낮은데 공격)
            else if (randomChoice < 0.7 && nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.state = 'chase';
                return;
            }
            // 보석 무시하고 배회
            else {
                this.state = 'patrol';
                return;
            }
        }

        // --- 2. Normal Decision logic ---
        // Priority 1: Help teammate in trouble
        if (helpAlly && helpAlly.enemy && helpAlly.dist < 500) {
            this.currentTarget = helpAlly.enemy;
            this.state = 'chase'; // Go help ally
        }
        // Priority 2: Collect Gems
        else if (nearestGem && (!nearestEnemy ||
            this.brawler.position.distanceTo(nearestGem.position) < AI_CONFIG.GEM_PRIORITY_DISTANCE)) {
            this.targetGem = nearestGem;
            this.state = 'collectGem';
        }
        // Priority 3: Attack / Chase best target
        else if (nearestEnemy) {
            this.currentTarget = nearestEnemy;

            const distanceToEnemy = this.brawler.position.distanceTo(nearestEnemy.position);
            const attackRange = this.brawler.attackRange * AI_CONFIG.ATTACK_RANGE_MULTIPLIER;

            if (distanceToEnemy <= attackRange) {
                this.state = 'attack';
            } else if (Math.random() < this.aggression) {
                this.state = 'chase';
            } else {
                this.state = 'patrol';
            }
        } else {
            this.state = 'patrol';
        }
    }

    /**
     * 전략적 타겟 찾기
     * - 카운터 관계 고려 (예: Brock이 Dynamike를 우선 공격)
     * - 위험에 처한 아군 지원
     * - 저체력 적 우선순위
     * - 보석 보유 적 집중 공격
     *
     * @returns {{enemy: Brawler|null, allyToHelp: Object|null}} 최적의 적과 도움이 필요한 아군
     */
    findBestStrategicTarget() {
        let bestEnemy = null;
        let highestScore = -Infinity;
        let allyToHelp = null;

        // Counter relationship map (who beats who)
        const counters = {
            'brock': ['dynamike'],
            'colt': ['brock', 'spike'],
            'nita': ['colt', 'mortis'],
            'dynamike': ['nita', 'spike'],
            'spike': ['nita', 'mortis'],
            'mortis': ['brock', 'colt', 'dynamike']
        };

        const myId = this.brawler.config.id;

        // 1. Evaluate enemies
        for (const enemy of this.game.brawlers) {
            if (enemy.team === this.brawler.team || !enemy.isAlive) continue;

            let score = 1000; // Base score
            const dist = this.brawler.position.distanceTo(enemy.position);

            // Distance penalty (closer = higher score)
            score -= dist * 1.5;

            // Counter bonus (내가 이 적을 카운터하면 보너스)
            if (counters[myId] && counters[myId].includes(enemy.config.id)) {
                score += 500; // I counter this enemy
            }

            // Vulnerability bonus (저체력 적 우선순위) - 30% 이하일 때 +500점
            if (enemy.health < enemy.maxHealth * 0.3) {
                score += 500;
            }

            // High value target (보석 보유 적은 고득점 타겟) - 1개당 +200점
            score += enemy.gems * 200;

            // Comeback urgency (역전 절실도) - 상대가 카운트다운 중이고 우리가 지고 있을 때 보석 보유 적 +2000점
            if (this.globalStats.countdownActive &&
                this.globalStats.winningTeam !== this.brawler.team &&
                enemy.gems > 0) {
                score += 2000;
            }

            if (score > highestScore) {
                highestScore = score;
                bestEnemy = enemy;
            }
        }

        // 2. Evaluate if allies need help (아군이 위험할 때 지원)
        let highestAllyTrouble = -Infinity;
        for (const ally of this.game.brawlers) {
            if (ally.team !== this.brawler.team || ally === this.brawler || !ally.isAlive) continue;

            const allyDist = this.brawler.position.distanceTo(ally.position);
            const allyHealth = ally.health / ally.maxHealth;

            // Find who is attacking this ally (아군을 공격하는 적 찾기)
            let threateningEnemy = null;
            let minDistToAlly = Infinity;
            for (const enemy of this.game.brawlers) {
                if (enemy.team !== this.brawler.team && enemy.isAlive) {
                    const eDist = enemy.position.distanceTo(ally.position);
                    if (eDist < 300 && eDist < minDistToAlly) {
                        minDistToAlly = eDist;
                        threateningEnemy = enemy;
                    }
                }
            }

            // 아군이 저체력이고 적이 근처에 있으면 지원 점수 계산
            if (threateningEnemy && allyHealth < 0.5) {
                let troubleScore = (1 - allyHealth) * 1000 - allyDist;

                // --- Carrier Focused Protection ---
                // 운반자(보석 3개 이상)를 지키는 적을 최우선 타겟팅
                if (ally === this.teamCarrier && ally.gems >= 3) {
                    troubleScore += 1500;
                }

                if (troubleScore > highestAllyTrouble) {
                    highestAllyTrouble = troubleScore;
                    allyToHelp = { ally, enemy: threateningEnemy, dist: allyDist };
                }
            }
        }

        return { enemy: bestEnemy, allyToHelp };
    }
    executeState(deltaTime) {
        switch (this.state) {
            case 'idle':
                this.brawler.moveDirection = new Vector2(0, 0);
                break;

            case 'patrol':
                this.patrol();
                break;

            case 'chase':
                this.chase();
                break;

            case 'attack':
                this.attack();
                break;

            case 'collectGem':
                this.collectGem();
                break;

            case 'retreat':
                this.retreat();
                break;

            case 'defendSpawn':
                this.defendSpawn();
                break;
        }

        // 방향 스무딩 적용 (지그재그 움직임 방지)
        this.applyDirectionSmoothing();
    }

    /**
     * 방향 전환을 부드럽게 하여 지그재그 움직임 방지
     */
    applyDirectionSmoothing() {
        const difficulty = this.getDifficulty();
        const targetDir = this.brawler.moveDirection;

        if (targetDir.magnitude() < 0.1) {
            this.smoothedDirection = new Vector2(0, 0);
            return;
        }

        // 급격한 방향 전환 감지 (90도 이상)
        if (this.smoothedDirection.magnitude() > 0.1) {
            const dot = this.smoothedDirection.dot(targetDir);
            if (dot < 0) {
                // 거의 반대 방향 - 더 빠르게 전환
                this.smoothedDirection = this.smoothedDirection
                    .multiply(1 - difficulty.smoothingFactor * 3)
                    .add(targetDir.multiply(difficulty.smoothingFactor * 3));
            } else {
                // 일반적인 방향 전환 - 부드럽게
                this.smoothedDirection = this.smoothedDirection
                    .multiply(1 - difficulty.smoothingFactor)
                    .add(targetDir.multiply(difficulty.smoothingFactor));
            }
        } else {
            this.smoothedDirection = targetDir.clone();
        }

        if (this.smoothedDirection.magnitude() > 0) {
            this.smoothedDirection.normalizeInPlace();
            this.brawler.moveDirection = this.smoothedDirection.clone();

            // 이동 중일 때 미세한 노이즈 추가 (Wobble)
            if (this.brawler.moveDirection.magnitude() > 0.1) {
                this.brawler.moveDirection.rotate((Math.random() - 0.5) * 0.05);
            }
        }
    }

    findNearestGem() {
        let nearest = null;
        let nearestDist = Infinity;

        for (const gem of this.game.gems) {
            if (!gem.active) continue;
            const dist = this.brawler.position.distanceTo(gem.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = gem;
            }
        }

        return nearest;
    }

    findNearestEnemy() {
        let nearest = null;
        let nearestDist = Infinity;

        for (const brawler of this.game.brawlers) {
            if (brawler.team === this.brawler.team || !brawler.isAlive) continue;

            const dist = this.brawler.position.distanceTo(brawler.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = brawler;
            }
        }

        return nearest;
    }

    patrol() {
        // If waiting at a patrol point, don't move
        if (this.patrolWaitTimer > 0) {
            this.brawler.moveDirection = new Vector2(0, 0);
            return;
        }

        // --- Protector Escort Behavior ---
        // 팀 운반자가 있고, 내가 운반자가 아니면 운반자 주변을 호위
        if (this.teamCarrier && this.teamCarrier !== this.brawler && this.teamCarrier.isAlive) {
            // 카운트다운 상황에 따라 호위 반경 조정
            let escortRadius = 150; // 기본값

            if (this.globalStats.countdownActive) {
                if (this.globalStats.winningTeam === this.brawler.team) {
                    // 우리 팀 승리 카운트다운 중: 밀착 방어
                    escortRadius = 80;
                } else {
                    // 상대 팀 승리 카운트다운 중: 넓은 범위 커버 및 압박
                    escortRadius = 200;
                }
            }

            // Check if we need to pick a new escort position or reached current position
            const needsNewPosition = !this.patrolTarget ||
                this.brawler.position.distanceTo(this.patrolTarget) < 40;

            if (needsNewPosition) {
                // Set wait timer before choosing new position
                this.patrolWaitTimer = 500 + Math.random() * 1000; // 500ms ~ 1500ms
                this.brawler.moveDirection = new Vector2(0, 0);

                // Calculate new escort position
                const randomAngle = Math.random() * Math.PI * 2;
                const offsetX = Math.cos(randomAngle) * escortRadius * (0.5 + Math.random() * 0.5);
                const offsetY = Math.sin(randomAngle) * escortRadius * (0.5 + Math.random() * 0.5);

                this.patrolTarget = new Vector2(
                    this.teamCarrier.position.x + offsetX,
                    this.teamCarrier.position.y + offsetY
                );
                return;
            }

            // Use pathfinding to navigate to escort position
            this.moveToTarget(this.patrolTarget);
            return;
        }

        // --- Default Patrol Behavior (중앙 순찰) ---
        // Check if we reached current patrol target
        if (this.patrolTarget && this.brawler.position.distanceTo(this.patrolTarget) < 40) {
            // Reached patrol point, set wait timer
            this.patrolWaitTimer = 500 + Math.random() * 1000; // 500ms ~ 1500ms
            this.brawler.moveDirection = new Vector2(0, 0);
            this.patrolTarget = null; // Clear target to pick new one after wait
            return;
        }

        // Periodically pick a new patrol target near center
        if (Math.random() < 0.02 || !this.patrolTarget) {
            const centerX = this.game.map.width / 2;
            const centerY = this.game.map.height / 2;

            // Add randomness to patrol target
            const randomX = centerX + (Math.random() - 0.5) * 400;
            const randomY = centerY + (Math.random() - 0.5) * 400;
            this.patrolTarget = new Vector2(randomX, randomY);
        }

        // Use pathfinding to navigate to patrol target
        this.moveToTarget(this.patrolTarget);
    }

    /**
     * 기지 방어 상태
     * - 카운트다운 중 운반자가 기지 내에서 방어적으로 행동
     * - 기지 180 유닛 반경 내에서 순찰하며 적 공격
     * - 적이 너무 가까우면 (200 유닛 미만) 기지 방향으로 후퇴하면서 공격
     */
    defendSpawn() {
        const spawnPos = this.game.map.getSpawnPosition(this.brawler.team);
        const distToSpawn = this.brawler.position.distanceTo(spawnPos);

        // 근처 적 찾기
        const nearestEnemy = this.findNearestEnemy();
        const distToEnemy = nearestEnemy ? this.brawler.position.distanceTo(nearestEnemy.position) : Infinity;

        // --- 1. 적이 매우 가까이 있으면 (200 유닛 미만) 기지 방향으로 후퇴하면서 공격 ---
        if (nearestEnemy && distToEnemy < 200) {
            // 기지 방향으로 후퇴
            const toSpawn = spawnPos.subtract(this.brawler.position);
            if (toSpawn.magnitude() > 0) {
                this.brawler.moveDirection = toSpawn.normalize();
            }
            this.avoidWallsEnhanced();

            // 사거리 내에 있으면 공격
            if (this.brawler.canAttack() && distToEnemy <= this.brawler.attackRange) {
                const toEnemy = nearestEnemy.position.subtract(this.brawler.position);
                this.brawler.attack(toEnemy.normalize(), this.game);
            }
            return;
        }

        // --- 2. 기지 180 유닛 반경 내에서 순찰 ---
        const defendRadius = 180;

        // 새로운 순찰 지점 선택 (2% 확률로 갱신)
        if (Math.random() < 0.02 || !this.defendPatrolTarget ||
            this.brawler.position.distanceTo(this.defendPatrolTarget) < 30) {

            const randomAngle = Math.random() * Math.PI * 2;
            const randomDist = Math.random() * defendRadius;
            const offsetX = Math.cos(randomAngle) * randomDist;
            const offsetY = Math.sin(randomAngle) * randomDist;

            this.defendPatrolTarget = new Vector2(
                spawnPos.x + offsetX,
                spawnPos.y + offsetY
            );
        }

        // 순찰 지점으로 이동
        this.moveToTarget(this.defendPatrolTarget);

        // --- 3. 근처 적 공격 (사거리 내) ---
        if (nearestEnemy && this.brawler.canAttack() && distToEnemy <= this.brawler.attackRange) {
            const toEnemy = nearestEnemy.position.subtract(this.brawler.position);
            this.brawler.attack(toEnemy.normalize(), this.game);
        }

        // --- 4. 카운트다운 종료 시 일반 순찰로 복귀 ---
        if (!this.globalStats.countdownActive) {
            this.state = 'patrol';
            this.defendPatrolTarget = null;
        }
    }

    chase() {
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            this.state = 'patrol';
            return;
        }

        const toTarget = this.currentTarget.position.subtract(this.brawler.position);
        const distance = toTarget.magnitude();

        if (distance <= this.brawler.attackRange * 0.95) {
            this.brawler.moveDirection = this.chooseCombatMovement(toTarget, distance);
            this.avoidWallsEnhanced();
        } else {
            this.moveToTarget(this.currentTarget.position);
        }

        // Try to attack while chasing
        if (distance <= this.brawler.attackRange && this.brawler.canAttack()) {
            this.brawler.attack(toTarget.normalize(), this.game);
        }
    }

    /**
     * 목표 지점으로 이동 (Flow Field 또는 A* 사용)
     * @param {Vector2} targetPos - 목표 위치
     * @param {boolean} useFlowField - Flow Field 사용 여부 (기본값: true)
     *
     * Flow Field: O(1) 조회로 즉시 방향 획득 (사전 계산된 경로)
     * A*: Flow Field 실패 시 대체 경로 탐색 (더 느리지만 정확)
     */
    moveToTarget(targetPos, useFlowField = true) {
        // If using alternative direction due to being stuck (막혔을 때 대체 경로 사용)
        if (this.alternativeTimer > 0 && this.alternativeDir) {
            this.brawler.moveDirection = this.alternativeDir;
            this.avoidWallsEnhanced();
            return;
        }

        const distToTarget = this.brawler.position.distanceTo(targetPos);

        // If very close, just move directly (매우 가까우면 직선 이동)
        if (distToTarget < 40) {
            const toTarget = targetPos.subtract(this.brawler.position);
            if (toTarget.magnitude() > 0) {
                this.brawler.moveDirection = toTarget.normalize();
            }
            return;
        }

        // Use Flow Field for navigation (instant lookup, no pathfinding)
        // Flow Field를 사용한 내비게이션 (즉시 조회, 경로 계산 불필요)
        if (useFlowField && this.flowField) {
            // Generate cache key based on target tile
            const tileSize = this.game.map.tileSize;
            const targetTileX = Math.floor(targetPos.x / tileSize);
            const targetTileY = Math.floor(targetPos.y / tileSize);
            const fieldKey = `dynamic_${targetTileX}_${targetTileY}`;

            // Get pre-computed direction from flow field
            const direction = this.flowField.getDirection(
                fieldKey,
                this.brawler.position.x,
                this.brawler.position.y,
                targetPos.x,
                targetPos.y
            );

            if (direction.magnitude() > 0) {
                this.brawler.moveDirection = direction;
                this.avoidWallsEnhanced();
                return;
            }
        }

        // Fallback to A* if flow field fails
        this.moveToTargetAStar(targetPos);
    }

    /**
     * A* 경로 탐색 (Flow Field 대체용)
     * Flow Field가 실패하거나 복잡한 경로가 필요할 때 사용
     *
     * @param {Vector2} targetPos - 목표 위치
     */
    moveToTargetAStar(targetPos) {
        const distToTarget = this.brawler.position.distanceTo(targetPos);

        // Check if we need to recalculate path
        const needsRecalc =
            this.currentPath.length === 0 ||
            this.pathIndex >= this.currentPath.length ||
            !this.lastTargetPos ||
            this.lastTargetPos.distanceTo(targetPos) > 80 ||
            this.forceRecalcTimer > 2000;

        if (needsRecalc) {
            this.currentPath = this.pathfinder.findPath(this.brawler.position, targetPos);
            this.pathIndex = 0;
            this.lastTargetPos = targetPos.clone();
            this.forceRecalcTimer = 0;
        }

        // Follow path
        if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
            const waypoint = this.currentPath[this.pathIndex];
            const toWaypoint = waypoint.subtract(this.brawler.position);
            const distToWaypoint = toWaypoint.magnitude();

            if (distToWaypoint < 20) {
                this.pathIndex++;
            }

            if (this.pathIndex < this.currentPath.length) {
                const nextWp = this.currentPath[this.pathIndex];
                this.brawler.moveDirection = nextWp.subtract(this.brawler.position).normalize();
                this.avoidWallsEnhanced();
            }
        } else {
            this.handleNoPath(targetPos);
        }
    }

    // Enhanced fallback when no path is found
    handleNoPath(targetPos) {
        const toTarget = targetPos.subtract(this.brawler.position);

        // Try to find the nearest walkable position towards target
        const nearestWalkable = this.findNearestWalkableTowards(targetPos);

        if (nearestWalkable) {
            const toWalkable = nearestWalkable.subtract(this.brawler.position);
            if (toWalkable.magnitude() > 0) {
                this.brawler.moveDirection = toWalkable.normalize();
            }
        } else if (toTarget.magnitude() > 0) {
            // Last resort: move towards target with wall avoidance
            this.brawler.moveDirection = toTarget.normalize();
        }

        this.avoidWallsEnhanced();
    }

    // Find nearest walkable position in the direction of target
    findNearestWalkableTowards(targetPos) {
        const toTarget = targetPos.subtract(this.brawler.position);
        if (toTarget.magnitude() === 0) return null;

        const baseAngle = toTarget.angle();
        const checkDistance = 80;

        // Try multiple angles, preferring the direction to target
        const angleOffsets = [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, Math.PI];

        for (const offset of angleOffsets) {
            const checkAngle = baseAngle + offset;
            const checkPos = this.brawler.position.add(
                Vector2.fromAngle(checkAngle).multiply(checkDistance)
            );

            if (!this.game.map.isPositionSolid(checkPos.x, checkPos.y)) {
                return checkPos;
            }
        }

        return null;
    }

    attack() {
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            this.state = 'patrol';
            return;
        }

        const toTarget = this.currentTarget.position.subtract(this.brawler.position);
        const distance = toTarget.magnitude();
        const difficulty = this.getDifficulty();
        const evasionSkill = typeof difficulty.evasionSkill === 'number' ? difficulty.evasionSkill : 1;

        // Aim and shoot
        if (this.brawler.canAttack()) {
            // 타겟 방향 각도 계산
            const targetAngle = toTarget.angle();

            // 현재 조준 각도와 타겟 각도 사이의 오차 계산 (최단 경로 고려)
            let angleError = targetAngle - this.currentAimAngle;

            // 각도 오차를 -PI ~ PI 범위로 정규화
            while (angleError > Math.PI) angleError -= Math.PI * 2;
            while (angleError < -Math.PI) angleError += Math.PI * 2;

            // 조준이 부정확하고 거리가 먼 경우 사격하지 않음
            if (Math.abs(angleError) > 0.35 && distance >= 100) {
                return;
            }

            if (!this.shouldAttemptCombatShot(distance)) {
                return;
            }

            // 기본 조준 오차 (AI 지능 기반)
            const baseInaccuracy = (Math.random() - 0.5) * difficulty.aimInaccuracy;

            // 조준 떨림 (시간 기반 사인파)
            const wobble = Math.sin(Date.now() / 200) * difficulty.aimWobble;

            // 거리 페널티 (멀수록 부정확)
            const distanceFactor = Math.min(distance / this.brawler.attackRange, 1.5);
            const totalInaccuracy = baseInaccuracy + wobble * distanceFactor;

            // 현재 조준 각도를 기준으로 발사
            const aimDir = Vector2.fromAngle(this.currentAimAngle + totalInaccuracy);
            this.brawler.attack(aimDir, this.game);
        }

        // Strafe movement with human-like variation
        const now = Date.now();
        const timeSinceLastChange = now - this.lastStrafeChange;
        const strafeChangeInterval = 2000 + Math.random() * 1500; // 2000-3500ms

        // Change strafe direction periodically instead of every frame
        if (timeSinceLastChange >= strafeChangeInterval) {
            this.strafeSide = Math.random() < 0.5 ? 1 : -1;
            this.lastStrafeChange = now;
        }

        // Random angle variation (reduced for less sudden dodging)
        const strafeAngle = (Math.PI / 2) + (Math.random() - 0.5) * 0.1;
        const strafeDir = toTarget.rotate(strafeAngle * this.strafeSide).normalize();
        this.brawler.moveDirection = this.chooseCombatMovement(
            toTarget,
            distance,
            Math.random,
            strafeDir,
            evasionSkill
        );

        this.avoidWallsEnhanced();
    }

    shouldAttemptCombatShot(distance, randomValue = Math.random()) {
        const difficulty = this.getDifficulty();
        const rangeMultiplier = difficulty.combatAttackRangeMultiplier ?? 1;
        const attackChance = difficulty.combatAttackChance ?? 1;
        const maxComfortRange = this.brawler.attackRange * rangeMultiplier;

        if (distance > maxComfortRange) {
            return false;
        }

        return randomValue <= attackChance;
    }

    chooseCombatMovement(toTarget, distance, randomFn = Math.random, precomputedStrafeDir = null, evasionSkillOverride = null) {
        const difficulty = this.getDifficulty();
        const normalizedTarget = toTarget.normalize();
        const strafeDir = precomputedStrafeDir ||
            toTarget.rotate(((Math.PI / 2) + (randomFn() - 0.5) * 0.1) * this.strafeSide).normalize();
        const evasionSkill = typeof evasionSkillOverride === 'number'
            ? evasionSkillOverride
            : (typeof difficulty.evasionSkill === 'number' ? difficulty.evasionSkill : 1);
        const strafeChance = difficulty.combatStrafeChance ?? evasionSkill;
        const backoffChance = difficulty.combatBackoffChance ?? evasionSkill;

        if (distance < this.brawler.attackRange * 0.5) {
            return randomFn() < backoffChance
                ? normalizedTarget.multiply(-1)
                : normalizedTarget;
        }

        if (distance > this.brawler.attackRange * 0.9) {
            return normalizedTarget;
        }

        return randomFn() < strafeChance ? strafeDir : normalizedTarget;
    }

    collectGem() {
        if (!this.targetGem || !this.targetGem.active) {
            this.targetGem = this.findNearestGem();
            if (!this.targetGem) {
                this.state = 'patrol';
                return;
            }
        }

        // Use pathfinding to navigate to gem
        this.moveToTarget(this.targetGem.position);

        // Attack enemies in the way
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const distToEnemy = this.brawler.position.distanceTo(nearestEnemy.position);
            if (distToEnemy <= this.brawler.attackRange * 1.2 && this.brawler.canAttack()) {
                const toEnemy = nearestEnemy.position.subtract(this.brawler.position);
                this.brawler.attack(toEnemy.normalize(), this.game);
            }
        }
    }

    tryUseSuper() {
        if (!this.brawler.superReady || !this.brawler.isAlive) return;

        const difficulty = this.getDifficulty();
        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const nearestEnemy = this.findNearestEnemy();
        const distToEnemy = nearestEnemy ? this.brawler.position.distanceTo(nearestEnemy.position) : Infinity;

        // 슈퍼 낭비: 적이 너무 멀거나 없을 때 사용
        if (Math.random() < difficulty.wasteSuperChance) {
            const randomDir = Vector2.fromAngle(Math.random() * Math.PI * 2);
            this.brawler.useSuper(randomDir, this.game);
            return;
        }

        // Brawler specific Super logic
        switch (this.brawler.config.id) {
            case 'brock':
            case 'colt':
                // Damage Supers: Use when enemy is in attack range
                if (nearestEnemy && distToEnemy <= this.brawler.attackRange * 1.3) {
                    const toEnemy = nearestEnemy.position.subtract(this.brawler.position).normalize();
                    this.brawler.useSuper(toEnemy, this.game);
                }
                break;

            case 'nita':
                // Summoning Super: Use as soon as enemy is within reasonable distance
                if (nearestEnemy && distToEnemy <= 500) {
                    const toEnemy = nearestEnemy.position.subtract(this.brawler.position).normalize();
                    this.brawler.useSuper(toEnemy, this.game);
                }
                break;

            case 'dynamike':
                // Artillery Super: lob onto enemies before they reach melee range
                if (nearestEnemy && distToEnemy <= this.brawler.attackRange * 1.15) {
                    const toEnemy = nearestEnemy.position.subtract(this.brawler.position).normalize();
                    this.brawler.useSuper(toEnemy, this.game);
                }
                break;

            case 'spike':
                // Area Control Super: Trap enemies
                if (nearestEnemy && distToEnemy <= this.brawler.attackRange) {
                    const toEnemy = nearestEnemy.position.subtract(this.brawler.position).normalize();
                    this.brawler.useSuper(toEnemy, this.game);
                }
                break;

            default:
                // Generic logic: Use if enemy is close
                if (nearestEnemy && distToEnemy < this.brawler.attackRange) {
                    const toEnemy = nearestEnemy.position.subtract(this.brawler.position).normalize();
                    this.brawler.useSuper(toEnemy, this.game);
                }
                break;
        }
    }

    retreat() {
        // Find nearest enemy to potentially face them while retreating
        const nearestEnemy = this.findNearestEnemy();
        const distToEnemy = nearestEnemy ? this.brawler.position.distanceTo(nearestEnemy.position) : Infinity;

        // Move back to spawn area using pathfinding
        const spawnPos = this.game.map.getSpawnPosition(this.brawler.team);

        // If enemy is too close, prioritize moving away from enemy over moving precisely to spawn
        if (nearestEnemy && distToEnemy < 250) {
            const awayFromEnemy = this.brawler.position.subtract(nearestEnemy.position).normalize();
            this.brawler.moveDirection = awayFromEnemy;
            this.avoidWallsEnhanced();
        } else {
            this.moveToTarget(spawnPos);
        }

        // Shoot at enemies while retreating (Kiting)
        if (nearestEnemy && this.brawler.canAttack()) {
            if (distToEnemy <= this.brawler.attackRange * 1.1) {
                const toEnemy = nearestEnemy.position.subtract(this.brawler.position);
                this.brawler.attack(toEnemy.normalize(), this.game);
            }
        }

        // --- Enhanced Re-entry Logic for Countdown Situations ---
        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const toSpawn = spawnPos.subtract(this.brawler.position);
        const distToSpawn = toSpawn.magnitude();

        // 1. 우리 팀 승리 카운트다운 중: 운반자는 기지 근처 도착 시 defendSpawn으로 전환
        if (this.globalStats.countdownActive &&
            this.globalStats.winningTeam === this.brawler.team) {

            if (this.isCarrier && distToSpawn < 150) {
                // 운반자가 기지에 거의 도착했다면 defendSpawn 상태로 전환
                this.state = 'defendSpawn';
                return;
            }
            // 호위병이나 아직 멀리 있는 운반자는 기본 후퇴 유지 (아래 로직 계속)
        }

        // 2. 상대 팀 승리 카운트다운 중: 체력 40%만 넘어도 즉시 복귀
        if (this.globalStats.countdownActive &&
            this.globalStats.winningTeam !== this.brawler.team &&
            this.globalStats.winningTeam !== null) {

            if (healthPercent > 0.4) {
                this.state = 'patrol';
                return;
            }
        }

        // 3. 기본 상황: 체력 75% 이상이거나 기지 도착 시 patrol로 복귀
        if (healthPercent > 0.75 || distToSpawn < 150) {
            this.state = 'patrol';
        }
    }

    avoidWalls() {
        // Check for nearby walls and adjust direction
        const checkDistance = 50;
        const directions = [
            new Vector2(1, 0),
            new Vector2(-1, 0),
            new Vector2(0, 1),
            new Vector2(0, -1),
        ];

        for (const dir of directions) {
            const checkPos = this.brawler.position.add(dir.multiply(checkDistance));
            if (this.game.map.isPositionSolid(checkPos.x, checkPos.y)) {
                // Wall nearby, adjust movement
                this.brawler.moveDirection.addInPlace(dir.multiply(-0.5));
            }
        }

        if (this.brawler.moveDirection.magnitude() > 0) {
            this.brawler.moveDirection.normalizeInPlace();
        }
    }

    /**
     * 향상된 벽 회피 알고리즘
     * - 이동 방향으로 다중 거리에서 충돌 체크
     * - 막힌 경우 대체 방향 탐색 (45도, 90도 각도)
     * - 좌우 측면 체크로 미세 조정
     */
    avoidWallsEnhanced() {
        const moveDir = this.brawler.moveDirection;
        if (moveDir.magnitude() < 0.1) return;

        const pos = this.brawler.position;

        // 1. Frontal Check (전방 체크)
        // 여러 거리를 체크하여 멀리 있는 장애물도 미리 감지
        const checkDistances = [40, 60, 80];
        for (const dist of checkDistances) {
            const checkPos = pos.add(moveDir.multiply(dist));
            if (this.game.map.isPositionSolid(checkPos.x, checkPos.y)) {
                // Wall ahead! Find best alternative direction
                const alternatives = this.findAlternativeDirections(moveDir);
                if (alternatives.length > 0) {
                    const bestAlt = alternatives[0];
                    // 장애물이 가까울수록 대체 방향 가중치 증가
                    const weight = dist <= 40 ? 0.9 : 0.6;
                    this.brawler.moveDirection = moveDir.multiply(1 - weight).add(bestAlt.multiply(weight));
                    if (this.brawler.moveDirection.magnitude() > 0) {
                        this.brawler.moveDirection.normalizeInPlace();
                    }
                }
                break;
            }
        }

        // 2. Whisker Checks (더듬이 체크 - 코너 감지 강화)
        // 대각선 앞쪽 (45도) 체크로 모서리 미리 감지
        const whiskerDist = 45;
        const whiskerAngle = Math.PI / 4; // 45도

        const leftWhisker = moveDir.rotate(whiskerAngle).multiply(whiskerDist);
        const rightWhisker = moveDir.rotate(-whiskerAngle).multiply(whiskerDist);

        const leftBlocked = this.game.map.isPositionSolid(pos.x + leftWhisker.x, pos.y + leftWhisker.y);
        const rightBlocked = this.game.map.isPositionSolid(pos.x + rightWhisker.x, pos.y + rightWhisker.y);

        // 3. Side Checks (측면 체크 - 90도)
        const sideDist = 35;
        const leftSide = moveDir.rotate(Math.PI / 2).multiply(sideDist);
        const rightSide = moveDir.rotate(-Math.PI / 2).multiply(sideDist);

        const leftSideBlocked = this.game.map.isPositionSolid(pos.x + leftSide.x, pos.y + leftSide.y);
        const rightSideBlocked = this.game.map.isPositionSolid(pos.x + rightSide.x, pos.y + rightSide.y);

        // 회피 로직
        if (leftBlocked || leftSideBlocked) {
            // 왼쪽이 막힘 -> 오른쪽으로 강하게 회전
            // 코너(대각선)가 막혔으면 더 크게 회전
            const rotateAmount = leftBlocked ? -0.6 : -0.3;
            this.brawler.moveDirection = this.brawler.moveDirection.rotate(rotateAmount);
        } else if (rightBlocked || rightSideBlocked) {
            // 오른쪽이 막힘 -> 왼쪽으로 강하게 회전
            const rotateAmount = rightBlocked ? 0.6 : 0.3;
            this.brawler.moveDirection = this.brawler.moveDirection.rotate(rotateAmount);
        }

        if (this.brawler.moveDirection.magnitude() > 0) {
            this.brawler.moveDirection.normalizeInPlace();
        }
    }

    // Find alternative directions when path is blocked
    findAlternativeDirections(blockedDir) {
        const alternatives = [];
        const pos = this.brawler.position;
        const checkDist = 60;

        // Check angles from -90 to +90 degrees relative to blocked direction
        const angleOffsets = [
            Math.PI / 4,   // 45 degrees right
            -Math.PI / 4,  // 45 degrees left
            Math.PI / 2,   // 90 degrees right
            -Math.PI / 2,  // 90 degrees left
            Math.PI / 6,   // 30 degrees right
            -Math.PI / 6,  // 30 degrees left
        ];

        for (const offset of angleOffsets) {
            const testDir = blockedDir.rotate(offset);
            const testPos = pos.add(testDir.multiply(checkDist));

            if (!this.game.map.isPositionSolid(testPos.x, testPos.y)) {
                alternatives.push(testDir);
            }
        }

        return alternatives;
    }

    // Debug rendering for path visualization
    renderDebug(ctx) {
        if (!this.debugMode || !this.brawler.isAlive) return;

        const pos = this.brawler.position;

        // Draw current path
        if (this.currentPath.length > 0) {
            ctx.strokeStyle = this.brawler.team === 'blue' ? '#00aaff' : '#ff6666';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);

            for (let i = this.pathIndex; i < this.currentPath.length; i++) {
                const wp = this.currentPath[i];
                ctx.lineTo(wp.x, wp.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw waypoints
            for (let i = this.pathIndex; i < this.currentPath.length; i++) {
                const wp = this.currentPath[i];
                ctx.fillStyle = i === this.pathIndex ? '#ffff00' : '#ffffff';
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw movement direction
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
            pos.x + this.brawler.moveDirection.x * 40,
            pos.y + this.brawler.moveDirection.y * 40
        );
        ctx.stroke();

        // Draw target angle (if target exists)
        if (this.currentTarget && this.currentTarget.isAlive) {
            const toTarget = this.currentTarget.position.subtract(this.brawler.position);
            const targetAngle = toTarget.angle();
            const targetDir = Vector2.fromAngle(targetAngle);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(
                pos.x + targetDir.x * 60,
                pos.y + targetDir.y * 60
            );
            ctx.stroke();
        }

        // Draw current aim angle
        const aimDir = Vector2.fromAngle(this.currentAimAngle);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
            pos.x + aimDir.x * 60,
            pos.y + aimDir.y * 60
        );
        ctx.stroke();

        // Draw stuck indicator
        if (this.stuckTimer > 200) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px Arial';
            ctx.fillText('STUCK!', pos.x - 20, pos.y - 50);
        }

        // Draw state
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.state, pos.x, pos.y + 50);
    }
}
