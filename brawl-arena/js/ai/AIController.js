// ========================================
// AI CONTROLLER - Bot Behavior (Enhanced Pathfinding)
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { AI_CONFIG, TEAMS } from '../utils/constants.js';
import { Pathfinder } from './Pathfinder.js';
import { FlowField } from './FlowField.js';

export class AIController {
    constructor(brawler, game) {
        this.brawler = brawler;
        this.game = game;
        this.decisionTimer = 0;
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
        this.smoothingFactor = 0.15; // 낮을수록 더 부드러움

        // Debug mode (set to true to visualize paths)
        this.debugMode = false;
    }

    update(deltaTime) {
        if (!this.brawler.isAlive) {
            this.resetPathfinding();
            return;
        }

        const deltaMs = deltaTime * 1000;

        // Stuck detection
        this.detectStuck(deltaMs);

        // Update timers
        this.decisionTimer += deltaMs;
        this.forceRecalcTimer += deltaMs;

        if (this.alternativeTimer > 0) {
            this.alternativeTimer -= deltaMs;
        }

        if (this.decisionTimer >= AI_CONFIG.DECISION_INTERVAL) {
            this.decisionTimer = 0;
            this.makeDecision();
        }

        // Periodically check if we should use Super
        this.tryUseSuper();

        this.executeState(deltaTime);
    }

    detectStuck(deltaMs) {
        const currentPos = this.brawler.position.clone();

        if (this.lastPosition) {
            const moved = currentPos.distanceTo(this.lastPosition);

            if (moved < this.stuckDistance && this.brawler.moveDirection.magnitude() > 0.1) {
                // We're trying to move but not moving much
                this.stuckTimer += deltaMs;

                if (this.stuckTimer > this.stuckThreshold) {
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
            default:
                return null;
        }
    }

    /**
     * 목표 방향으로 최적의 탈출 방향 찾기
     */
    findBestUnstuckDirection(targetPos) {
        const pos = this.brawler.position;
        const toTarget = targetPos.subtract(pos);
        if (toTarget.magnitude() === 0) return null;

        const baseAngle = toTarget.angle();
        const checkDist = 60;

        // 목표 방향 근처 각도들을 우선 체크 (45도 간격)
        const angleOffsets = [
            0, Math.PI/4, -Math.PI/4,
            Math.PI/2, -Math.PI/2,
            3*Math.PI/4, -3*Math.PI/4,
            Math.PI
        ];

        for (const offset of angleOffsets) {
            const testAngle = baseAngle + offset;
            const testDir = Vector2.fromAngle(testAngle);
            const testPos = pos.add(testDir.multiply(checkDist));

            if (!this.game.map.isPositionSolid(testPos.x, testPos.y)) {
                return testDir;
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

    makeDecision() {
        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const ammoPercent = this.brawler.ammo / this.brawler.ammoMax;

        // Find nearest gem
        const nearestGem = this.findNearestGem();

        // Find Best target based on counter relationships and synergy
        const bestTarget = this.findBestStrategicTarget();
        const nearestEnemy = bestTarget.enemy;
        const helpAlly = bestTarget.allyToHelp;

        // --- 1. Tactical Retreat Evaluation ---
        // ... (same as before)
        const isVeryLowHealth = healthPercent < 0.25;
        const hasGems = this.brawler.gems > 0;
        const hasManyGems = this.brawler.gems >= 5;
        const outOfAmmo = this.brawler.ammo === 0;

        const distToEnemy = nearestEnemy ? this.brawler.position.distanceTo(nearestEnemy.position) : Infinity;
        const enemyTooClose = distToEnemy < 200;

        if ((isVeryLowHealth && hasGems) || (hasManyGems && healthPercent < 0.45) || (outOfAmmo && enemyTooClose && healthPercent < 0.5)) {
            this.state = 'retreat';
            return;
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
     * - 카운터 관계 고려 (예: Shelly가 Poco를 우선 공격)
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
            'shelly': ['poco', 'spike', 'nita'],
            'colt': ['shelly', 'spike'],
            'nita': ['colt'],
            'poco': ['nita'],
            'spike': ['nita', 'poco'],
            'bull': ['poco', 'spike', 'colt'],
            'elprimo': ['colt', 'spike']
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

            // Vulnerability bonus (저체력 적 우선순위)
            if (enemy.health < enemy.maxHealth * 0.4) {
                score += 300;
            }

            // High value target (보석 보유 적은 고득점 타겟)
            score += enemy.gems * 100;

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
                const troubleScore = (1 - allyHealth) * 1000 - allyDist;
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
        }

        // 방향 스무딩 적용 (지그재그 움직임 방지)
        this.applyDirectionSmoothing();
    }

    /**
     * 방향 전환을 부드럽게 하여 지그재그 움직임 방지
     */
    applyDirectionSmoothing() {
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
                    .multiply(1 - this.smoothingFactor * 3)
                    .add(targetDir.multiply(this.smoothingFactor * 3));
            } else {
                // 일반적인 방향 전환 - 부드럽게
                this.smoothedDirection = this.smoothedDirection
                    .multiply(1 - this.smoothingFactor)
                    .add(targetDir.multiply(this.smoothingFactor));
            }
        } else {
            this.smoothedDirection = targetDir.clone();
        }

        if (this.smoothedDirection.magnitude() > 0) {
            this.smoothedDirection.normalizeInPlace();
            this.brawler.moveDirection = this.smoothedDirection.clone();
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

    chase() {
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            this.state = 'patrol';
            return;
        }

        // Use pathfinding to navigate to target
        this.moveToTarget(this.currentTarget.position);

        // Try to attack while chasing
        const toTarget = this.currentTarget.position.subtract(this.brawler.position);
        const distance = toTarget.magnitude();
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

        // Aim and shoot
        if (this.brawler.canAttack()) {
            // Add some inaccuracy
            const inaccuracy = (Math.random() - 0.5) * 0.3;
            const aimDir = Vector2.fromAngle(toTarget.angle() + inaccuracy);
            this.brawler.attack(aimDir, this.game);
        }

        // Strafe movement
        const strafeDir = toTarget.rotate(Math.PI / 2).normalize();
        if (Math.random() < 0.5) strafeDir.multiplyInPlace(-1);

        // Keep optimal distance
        if (distance < this.brawler.attackRange * 0.5) {
            // Too close, back up
            this.brawler.moveDirection = toTarget.normalize().multiply(-1);
        } else if (distance > this.brawler.attackRange * 0.9) {
            // Too far, move closer
            this.brawler.moveDirection = toTarget.normalize();
        } else {
            // Strafe
            this.brawler.moveDirection = strafeDir;
        }

        this.avoidWallsEnhanced();
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

        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const nearestEnemy = this.findNearestEnemy();
        const distToEnemy = nearestEnemy ? this.brawler.position.distanceTo(nearestEnemy.position) : Infinity;

        // Brawler specific Super logic
        switch (this.brawler.config.id) {
            case 'shelly':
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

            case 'poco':
                // Healing Super: Use when health is low or allies are low
                if (healthPercent < 0.6) {
                    this.brawler.useSuper(new Vector2(0, 0), this.game);
                } else {
                    // Check nearby allies
                    for (const teammate of this.game.brawlers) {
                        if (teammate.team === this.brawler.team && teammate !== this.brawler && teammate.isAlive) {
                            const distToTeammate = this.brawler.position.distanceTo(teammate.position);
                            const teammateHealthPercent = teammate.health / teammate.maxHealth;
                            if (distToTeammate < 350 && teammateHealthPercent < 0.5) {
                                this.brawler.useSuper(new Vector2(0, 0), this.game);
                                break;
                            }
                        }
                    }
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

        // --- Faster recovery back to battle ---
        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const toSpawn = spawnPos.subtract(this.brawler.position);

        // Return to battle if health is > 75% (was 60%) or arrived at safe zone
        if (healthPercent > 0.75 || toSpawn.magnitude() < 150) {
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

        const checkDistances = [40, 60, 80];
        const pos = this.brawler.position;

        // Check in the direction of movement (이동 방향으로 충돌 체크)
        for (const dist of checkDistances) {
            const checkPos = pos.add(moveDir.multiply(dist));
            if (this.game.map.isPositionSolid(checkPos.x, checkPos.y)) {
                // Wall ahead! Find best alternative direction
                // 앞에 벽 발견! 대체 방향 찾기
                const alternatives = this.findAlternativeDirections(moveDir);
                if (alternatives.length > 0) {
                    // Blend with best alternative (최적 대체 방향과 혼합)
                    const bestAlt = alternatives[0];
                    this.brawler.moveDirection = moveDir.multiply(0.3).add(bestAlt.multiply(0.7));
                    if (this.brawler.moveDirection.magnitude() > 0) {
                        this.brawler.moveDirection.normalizeInPlace();
                    }
                }
                break;
            }
        }

        // Additional side checks (좌우 측면 체크)
        const sideCheckDist = 35;
        const perpLeft = moveDir.rotate(Math.PI / 2).multiply(sideCheckDist);
        const perpRight = moveDir.rotate(-Math.PI / 2).multiply(sideCheckDist);

        const leftBlocked = this.game.map.isPositionSolid(pos.x + perpLeft.x, pos.y + perpLeft.y);
        const rightBlocked = this.game.map.isPositionSolid(pos.x + perpRight.x, pos.y + perpRight.y);

        if (leftBlocked && !rightBlocked) {
            // Nudge right (오른쪽으로 미세 조정)
            this.brawler.moveDirection = moveDir.rotate(-0.2);
        } else if (rightBlocked && !leftBlocked) {
            // Nudge left (왼쪽으로 미세 조정)
            this.brawler.moveDirection = moveDir.rotate(0.2);
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
