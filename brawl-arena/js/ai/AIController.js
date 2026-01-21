// ========================================
// AI CONTROLLER - Bot Behavior
// ========================================

import { Vector2 } from '../utils/Vector2.js';
import { AI_CONFIG, TEAMS } from '../utils/constants.js';

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
        this.currentPath = [];
        this.pathIndex = 0;
    }

    update(deltaTime) {
        if (!this.brawler.isAlive) return;

        this.decisionTimer += deltaTime * 1000;

        if (this.decisionTimer >= AI_CONFIG.DECISION_INTERVAL) {
            this.decisionTimer = 0;
            this.makeDecision();
        }

        this.executeState(deltaTime);
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
        // Random movement towards center or nearby areas
        if (Math.random() < 0.02) {
            const centerX = this.game.map.width / 2;
            const centerY = this.game.map.height / 2;
            const toCenter = new Vector2(centerX - this.brawler.position.x, centerY - this.brawler.position.y);

            // Add some randomness
            const randomOffset = Vector2.random(100);
            this.brawler.moveDirection = toCenter.add(randomOffset).normalize();
        }

        // Avoid walls
        this.avoidWalls();
    }

    chase() {
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            this.state = 'patrol';
            return;
        }

        const toTarget = this.currentTarget.position.subtract(this.brawler.position);
        this.brawler.moveDirection = toTarget.normalize();

        // Try to attack while chasing
        const distance = toTarget.magnitude();
        if (distance <= this.brawler.attackRange && this.brawler.canAttack()) {
            this.brawler.attack(toTarget.normalize(), this.game);
        }

        this.avoidWalls();
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

        // Use super if ready and close enough
        if (this.brawler.superReady && distance < this.brawler.attackRange * 1.5) {
            this.brawler.useSuper(toTarget.normalize(), this.game);
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

        this.avoidWalls();
    }

    collectGem() {
        if (!this.targetGem || !this.targetGem.active) {
            this.targetGem = this.findNearestGem();
            if (!this.targetGem) {
                this.state = 'patrol';
                return;
            }
        }

        const toGem = this.targetGem.position.subtract(this.brawler.position);
        this.brawler.moveDirection = toGem.normalize();

        // Attack enemies in the way
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const distToEnemy = this.brawler.position.distanceTo(nearestEnemy.position);
            if (distToEnemy <= this.brawler.attackRange && this.brawler.canAttack()) {
                const toEnemy = nearestEnemy.position.subtract(this.brawler.position);
                this.brawler.attack(toEnemy.normalize(), this.game);
            }
        }

        this.avoidWalls();
    }

    retreat() {
        // Move back to spawn area
        const spawnPos = this.game.map.getSpawnPosition(this.brawler.team);
        const toSpawn = spawnPos.subtract(this.brawler.position);
        this.brawler.moveDirection = toSpawn.normalize();

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
        if (healthPercent > 0.6 || toSpawn.magnitude() < 100) {
            this.state = 'patrol';
        }

        this.avoidWalls();
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
}
