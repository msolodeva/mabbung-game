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

        // Try alternative direction - random perpendicular movement
        const randomAngle = Math.random() * Math.PI * 2;
        this.alternativeDir = Vector2.fromAngle(randomAngle);
        this.alternativeTimer = 300; // Use alternative for 300ms
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

        // Check if should retreat
        if (healthPercent < AI_CONFIG.RETREAT_HEALTH_THRESHOLD && this.brawler.gems > 0) {
            this.state = 'retreat';
            return;
        }

        // Find nearest gem
        const nearestGem = this.findNearestGem();

        // Find nearest enemy
        const nearestEnemy = this.findNearestEnemy();

        // Decision logic
        if (nearestGem && (!nearestEnemy ||
            this.brawler.position.distanceTo(nearestGem.position) < AI_CONFIG.GEM_PRIORITY_DISTANCE)) {
            this.targetGem = nearestGem;
            this.state = 'collectGem';
        } else if (nearestEnemy) {
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

    // Helper: Move towards a target position using Flow Field (pre-computed navigation)
    moveToTarget(targetPos, useFlowField = true) {
        // If using alternative direction due to being stuck
        if (this.alternativeTimer > 0 && this.alternativeDir) {
            this.brawler.moveDirection = this.alternativeDir;
            this.avoidWallsEnhanced();
            return;
        }

        const distToTarget = this.brawler.position.distanceTo(targetPos);

        // If very close, just move directly
        if (distToTarget < 40) {
            const toTarget = targetPos.subtract(this.brawler.position);
            if (toTarget.magnitude() > 0) {
                this.brawler.moveDirection = toTarget.normalize();
            }
            return;
        }

        // Use Flow Field for navigation (instant lookup, no pathfinding)
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

    // A* fallback for when Flow Field doesn't work
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
        // Move back to spawn area using pathfinding
        const spawnPos = this.game.map.getSpawnPosition(this.brawler.team);
        this.moveToTarget(spawnPos);

        // Shoot at enemies while retreating
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy && this.brawler.canAttack()) {
            const distToEnemy = this.brawler.position.distanceTo(nearestEnemy.position);
            if (distToEnemy <= this.brawler.attackRange) {
                const toEnemy = nearestEnemy.position.subtract(this.brawler.position);
                this.brawler.attack(toEnemy.normalize(), this.game);
            }
        }

        // Check if safe
        const healthPercent = this.brawler.health / this.brawler.maxHealth;
        const toSpawn = spawnPos.subtract(this.brawler.position);
        if (healthPercent > 0.6 || toSpawn.magnitude() < 100) {
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

    // Enhanced wall avoidance with diagonal checks and raycast-style detection
    avoidWallsEnhanced() {
        const moveDir = this.brawler.moveDirection;
        if (moveDir.magnitude() < 0.1) return;

        const checkDistances = [40, 60, 80];
        const pos = this.brawler.position;

        // Check in the direction of movement
        for (const dist of checkDistances) {
            const checkPos = pos.add(moveDir.multiply(dist));
            if (this.game.map.isPositionSolid(checkPos.x, checkPos.y)) {
                // Wall ahead! Find best alternative direction
                const alternatives = this.findAlternativeDirections(moveDir);
                if (alternatives.length > 0) {
                    // Blend with best alternative
                    const bestAlt = alternatives[0];
                    this.brawler.moveDirection = moveDir.multiply(0.3).add(bestAlt.multiply(0.7));
                    if (this.brawler.moveDirection.magnitude() > 0) {
                        this.brawler.moveDirection.normalizeInPlace();
                    }
                }
                break;
            }
        }

        // Additional side checks
        const sideCheckDist = 35;
        const perpLeft = moveDir.rotate(Math.PI / 2).multiply(sideCheckDist);
        const perpRight = moveDir.rotate(-Math.PI / 2).multiply(sideCheckDist);

        const leftBlocked = this.game.map.isPositionSolid(pos.x + perpLeft.x, pos.y + perpLeft.y);
        const rightBlocked = this.game.map.isPositionSolid(pos.x + perpRight.x, pos.y + perpRight.y);

        if (leftBlocked && !rightBlocked) {
            // Nudge right
            this.brawler.moveDirection = moveDir.rotate(-0.2);
        } else if (rightBlocked && !leftBlocked) {
            // Nudge left
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
