// ========================================
// BRAWLER - Base Brawler Class
// ========================================

import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { COLORS, TEAMS } from '../utils/constants.js';

/**
 * 브롤러 기본 클래스 - 플레이어블 캐릭터
 * 모든 브롤러(Brock, Colt, Nita 등)의 부모 클래스
 */
export class Brawler extends Entity {
    /**
     * 브롤러 생성
     * @param {Object} config - constants.js의 BRAWLERS 객체에서 가져온 브롤러 설정
     * @param {string} team - 팀 식별자 (TEAMS.BLUE 또는 TEAMS.RED)
     * @param {number} x - 초기 X 좌표
     * @param {number} y - 초기 Y 좌표
     */
    constructor(config, team, x = 0, y = 0) {
        super(x, y);
        this.type = 'brawler';
        this.config = config;
        this.team = team;
        this.isPlayer = false;
        this.radius = 25;

        // Stats from config
        this.maxHealth = config.health;
        this.health = config.health;
        this.speed = config.speed;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;

        // Ammo system
        this.ammoMax = config.ammoMax;
        this.ammo = config.ammoMax;
        this.ammoReloadTime = config.ammoReloadTime;
        this.reloadTimer = 0;

        // Attack timing
        this.attackSpeed = config.attackSpeed;
        this.attackCooldown = 0;

        // Super charge
        this.superCharge = 0;
        this.superChargeMax = config.superCharge;
        this.superReady = false;

        // Gem grab
        this.gems = 0;

        // State
        this.isAlive = true;
        this.justDied = false;
        this.droppedGems = 0;
        this.respawnTimer = 0;
        this.isInBush = false;
        this.isVisible = true;
        this.facingAngle = 0;
        this.isAttacking = false;

        // Movement
        this.moveDirection = new Vector2(0, 0);
        this.aimDirection = new Vector2(1, 0);

        // Knockback system - smooth knockback over multiple frames
        this.knockbackVelocity = new Vector2(0, 0);
        this.knockbackFriction = 0.85; // How quickly knockback slows down (lower = faster decay)

        // Visual
        this.damageFlashTimer = 0;
        this.color = team === TEAMS.BLUE ? COLORS.BLUE_TEAM : COLORS.RED_TEAM;
        this.moveTrail = [];
        this.maxTrailLength = 5;

        // Visual Polish
        this.recoilOffset = 0;
        this.spawnScale = 0; // For pop-in effect
        this.spawnTimer = 0;
    }

    update(deltaTime, game) {
        if (!this.isAlive) {
            this.respawnTimer -= deltaTime * 1000;
            if (this.respawnTimer <= 0) {
                this.respawn(game);
            }
            return;
        }

        // Movement
        if (this.moveDirection.magnitude() > 0) {
            const moveVel = this.moveDirection.normalize().multiply(this.speed);
            this.velocity = moveVel;
            this.facingAngle = this.moveDirection.angle();
        } else {
            this.velocity = new Vector2(0, 0);
        }

        // Apply knockback velocity (smooth over multiple frames)
        if (this.knockbackVelocity.magnitude() > 1) {
            // Apply knockback movement with wall collision check
            const knockbackMove = this.knockbackVelocity.multiply(deltaTime);
            const newPosX = this.position.x + knockbackMove.x;
            const newPosY = this.position.y + knockbackMove.y;

            // Check if new position would be in a wall
            if (!game.map.isPositionSolid(newPosX, this.position.y)) {
                this.position.x = newPosX;
            } else {
                this.knockbackVelocity.x = 0; // Stop horizontal knockback on wall hit
            }
            if (!game.map.isPositionSolid(this.position.x, newPosY)) {
                this.position.y = newPosY;
            } else {
                this.knockbackVelocity.y = 0; // Stop vertical knockback on wall hit
            }

            // Apply friction to slow down knockback
            this.knockbackVelocity = this.knockbackVelocity.multiply(this.knockbackFriction);
        } else {
            this.knockbackVelocity = new Vector2(0, 0);
        }

        super.update(deltaTime);

        // Clamp to map bounds
        this.position.x = Math.max(this.radius, Math.min(game.map.width - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(game.map.height - this.radius, this.position.y));

        // Wall collision
        this.handleWallCollision(game.map);

        // Ammo reload
        if (this.ammo < this.ammoMax) {
            this.reloadTimer += deltaTime * 1000;
            if (this.reloadTimer >= this.ammoReloadTime) {
                this.ammo = Math.min(this.ammo + 1, this.ammoMax);
                this.reloadTimer = 0;
            }
        }

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime * 1000;
        }

        // Damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime * 1000;
        }

        // Check if in bush
        this.isInBush = game.map.isPositionInBush(this.position.x, this.position.y);

        // Update visibility
        this.updateVisibility(game);

        // Update movement trail
        if (this.velocity.magnitude() > 50) {
            this.moveTrail.unshift({ x: this.position.x, y: this.position.y, angle: this.facingAngle });
            if (this.moveTrail.length > this.maxTrailLength) this.moveTrail.pop();
        } else {
            if (this.moveTrail.length > 0) this.moveTrail.pop();
        }

        // Apply visual recoil decay
        if (this.recoilOffset > 0) {
            this.recoilOffset *= 0.8; // Fast snappy recovery
            if (this.recoilOffset < 0.5) this.recoilOffset = 0;
        }

        // Spawn pop-in animation
        if (this.spawnScale < 1) {
            this.spawnTimer += deltaTime * 10;
            // Elastic ease out
            const x = Math.min(this.spawnTimer, 1);
            this.spawnScale = x === 1 ? 1 : 1 - Math.pow(2, -10 * x) * Math.cos((x * 10 - 0.75) * (2 * Math.PI) / 3);
            if (this.spawnTimer > 1) this.spawnScale = 1;
        }
    }

    handleWallCollision(map) {
        // Check multiple points around the brawler's edge for more accurate collision
        const checkRadius = this.radius * 0.9; // Slightly smaller for smoother feel
        const checkPoints = [
            { x: 0, y: -1 },  // top
            { x: 0, y: 1 },   // bottom
            { x: -1, y: 0 },  // left
            { x: 1, y: 0 },   // right
            { x: -0.7, y: -0.7 }, // top-left
            { x: 0.7, y: -0.7 },  // top-right
            { x: -0.7, y: 0.7 },  // bottom-left
            { x: 0.7, y: 0.7 },   // bottom-right
        ];

        for (const point of checkPoints) {
            const checkX = this.position.x + point.x * checkRadius;
            const checkY = this.position.y + point.y * checkRadius;

            const tile = map.getTileAtPosition(checkX, checkY);
            if (tile && tile.solid) {
                // Calculate the tile boundaries
                const tileCol = Math.floor(checkX / map.tileSize);
                const tileRow = Math.floor(checkY / map.tileSize);
                const tileLeft = tileCol * map.tileSize;
                const tileRight = tileLeft + map.tileSize;
                const tileTop = tileRow * map.tileSize;
                const tileBottom = tileTop + map.tileSize;

                // Calculate penetration depth for each axis
                let pushX = 0;
                let pushY = 0;

                // Horizontal push
                if (point.x > 0) {
                    // Colliding from left, push left
                    pushX = tileLeft - (this.position.x + checkRadius) - 1;
                } else if (point.x < 0) {
                    // Colliding from right, push right
                    pushX = tileRight - (this.position.x - checkRadius) + 1;
                }

                // Vertical push
                if (point.y > 0) {
                    // Colliding from top, push up
                    pushY = tileTop - (this.position.y + checkRadius) - 1;
                } else if (point.y < 0) {
                    // Colliding from bottom, push down
                    pushY = tileBottom - (this.position.y - checkRadius) + 1;
                }

                // Apply the smaller push (to slide along walls)
                if (Math.abs(pushX) < Math.abs(pushY) && pushX !== 0) {
                    this.position.x += pushX;
                } else if (pushY !== 0) {
                    this.position.y += pushY;
                } else if (pushX !== 0) {
                    this.position.x += pushX;
                }
            }
        }

        // Final safety check - if center is still in a wall, forcefully push out
        const centerTile = map.getTileAtPosition(this.position.x, this.position.y);
        if (centerTile && centerTile.solid) {
            const tileCenter = map.getTileCenter(
                Math.floor(this.position.x / map.tileSize),
                Math.floor(this.position.y / map.tileSize)
            );
            const pushDir = this.position.subtract(tileCenter);
            if (pushDir.magnitude() > 0) {
                this.position.addInPlace(pushDir.normalize().multiply(map.tileSize * 0.6));
            } else {
                // Edge case: exactly at center, push in a default direction
                this.position.y -= map.tileSize * 0.6;
            }
        }
    }

    updateVisibility(game) {
        // Players on the same team are always visible
        // Enemies in bushes are invisible unless a teammate is nearby
        this.isVisible = true;

        if (this.isInBush) {
            // Check if any enemy is close enough to reveal
            const revealDistance = 60;
            for (const brawler of game.brawlers) {
                if (brawler.team !== this.team && brawler.isAlive) {
                    if (this.distanceTo(brawler) < revealDistance) {
                        this.isVisible = true;
                        return;
                    }
                }
            }
            // Hidden in bush
            if (this.team !== game.playerTeam) {
                this.isVisible = false;
            }
        }
    }

    /**
     * 브롤러가 공격 가능한 상태인지 확인
     * @returns {boolean} 살아있고, 탄약이 있고, 쿨다운이 끝났는지 여부
     */
    canAttack() {
        return this.isAlive && this.ammo > 0 && this.attackCooldown <= 0;
    }

    /**
     * 일반 공격 실행
     * @param {Vector2} direction - 공격 방향 벡터
     * @param {Game} game - 게임 인스턴스 (발사체 생성을 위해 필요)
     * @returns {boolean} 공격 성공 여부
     */
    attack(direction, game) {
        if (!this.canAttack()) return false;

        this.ammo--;
        this.attackCooldown = this.attackSpeed;
        this.aimDirection = direction.normalize();
        this.facingAngle = direction.angle();
        this.isAttacking = true;
        this.recoilOffset = 8; // Visual kickback distance

        // Create projectiles (override in subclass)
        this.createAttackProjectiles(direction, game);

        setTimeout(() => {
            this.isAttacking = false;
        }, 100);

        return true;
    }

    /**
     * 일반 공격 발사체 생성 (하위 클래스에서 오버라이드 필수)
     * @param {Vector2} direction - 공격 방향
     * @param {Game} game - 게임 인스턴스
     */
    createAttackProjectiles(direction, game) {
        // Override in subclass
    }

    /**
     * 슈퍼 스킬 사용
     * @param {Vector2} direction - 슈퍼 방향
     * @param {Game} game - 게임 인스턴스
     * @returns {boolean} 슈퍼 사용 성공 여부
     */
    useSuper(direction, game) {
        if (!this.superReady) return false;

        this.superCharge = 0;
        this.superReady = false;
        this.facingAngle = direction.angle();

        // Override in subclass for specific super abilities
        this.activateSuper(direction, game);

        return true;
    }

    /**
     * 슈퍼 스킬 발동 (하위 클래스에서 오버라이드 필수)
     * @param {Vector2} direction - 슈퍼 방향
     * @param {Game} game - 게임 인스턴스
     */
    activateSuper(direction, game) {
        // Override in subclass
    }

    /**
     * 데미지 받기
     * @param {number} amount - 데미지 양
     * @param {Brawler|Bear|null} attacker - 공격자 (슈퍼 게이지 충전용)
     * @param {Object|null} source - 데미지 원인 (Projectile 등)
     */
    takeDamage(amount, attacker, source = null) {
        if (!this.isAlive) return;

        this.health -= amount;
        this.damageFlashTimer = 100;

        // Charge attacker's super
        if (attacker) {
            let chargeAmount = 1;

            // 궁극기 공격으로 인한 데미지는 궁극기를 충전시키지 않음 (무한 궁극기 방지)
            if (source && source.isSuper) {
                chargeAmount = 0;
            }

            if (attacker.type === 'brawler') {
                attacker.addSuperCharge(chargeAmount);
            } else if (attacker.type === 'bear' && attacker.owner) {
                // 곰 공격은 주인 궁극기 충전 (일반 공격 취급)
                attacker.owner.addSuperCharge(1);
            }
        }

        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * Apply knockback smoothly over multiple frames
     * @param {Vector2} direction - Direction of knockback (normalized)
     * @param {number} force - Knockback force/distance
     */
    applyKnockback(direction, force) {
        if (!this.isAlive) return;
        // Convert instant knockback to velocity (spread over ~0.15 seconds)
        const knockbackSpeed = force / 0.15;
        this.knockbackVelocity = direction.normalize().multiply(knockbackSpeed);
    }

    heal(amount) {
        if (!this.isAlive) return;
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    addSuperCharge(amount) {
        if (this.superReady) return;
        this.superCharge += amount;
        if (this.superCharge >= this.superChargeMax) {
            this.superCharge = this.superChargeMax;
            this.superReady = true;
        }
    }

    die() {
        this.isAlive = false;
        this.justDied = true;
        this.respawnTimer = 3000;
        this.health = 0;

        // Drop gems
        this.droppedGems = this.gems;
        this.gems = 0;

        return this.droppedGems;
    }

    respawn(game) {
        this.isAlive = true;
        this.health = this.maxHealth;
        this.ammo = this.ammoMax;

        // Find spawn position
        const spawnPos = game.map.getSpawnPosition(this.team);
        this.position.set(spawnPos.x, spawnPos.y);

        // Reset spawn animation
        this.spawnScale = 0;
        this.spawnTimer = 0;

        // Add spawn shield/effect
        game.createEffect('heal', spawnPos.x, spawnPos.y, { lifetime: 1000 });
    }

    collectGem() {
        this.gems++;
    }

    render(ctx, camera, isPlayerTeam) {
        if (!this.active) return;

        const x = this.position.x;
        const y = this.position.y;

        // Render Movement Trail
        if (this.moveTrail.length > 0 && this.isAlive && (this.isVisible || isPlayerTeam)) {
            ctx.save();
            for (let i = 0; i < this.moveTrail.length; i++) {
                const p = this.moveTrail[i];
                const alpha = 0.3 * (1 - i / this.moveTrail.length);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, this.radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Don't render if not visible (enemy in bush)
        if (!this.isVisible && !isPlayerTeam) return;

        const time = performance.now() * 0.005;
        const bobOffset = Math.sin(time) * 5; // Balanced bobbing
        const breathingScale = 1 + Math.sin(time * 0.4) * 0.04; // Smooth breathing

        // 1. Enhanced Ground Ring (Aura)
        ctx.save();
        ctx.globalAlpha = 0.8; // Increased from 0.6
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white'; // Glow white for contrast

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 7; // Thicker ring
        ctx.beginPath();
        ctx.arc(x, y + this.radius - 5, this.radius * 1.15, 0, Math.PI * 2);
        ctx.stroke();

        // White outer edge for the ring
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner soft glow
        const innerGlow = ctx.createRadialGradient(x, y + this.radius - 5, 0, x, y + this.radius - 5, this.radius * 1.4);
        innerGlow.addColorStop(0, `${this.color}44`);
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        const shadowW = this.radius * 1.0 * breathingScale;
        const shadowH = this.radius * 0.4 * breathingScale;
        ctx.ellipse(x, y + this.radius - 2, shadowW, shadowH, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!this.isAlive) {
            // Death indicator (Ghostly emoji)
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👻', x, y + bobOffset);
            ctx.restore();
            return;
        }

        // 2.5 Render Hands (Before body so they can be behind if needed, but usually on sides)
        // We render hands relative to the body transform usually, but let's do it here
        // this.renderHands(ctx, x, y + bobOffset, this.radius, this.facingAngle, time);

        // 3. Directional Pointer (Premium Look) - Rounded for cuteness
        ctx.save();
        ctx.translate(x, y + bobOffset);
        ctx.rotate(this.facingAngle);

        // Pointer shadow
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Rounded pointer
        ctx.moveTo(this.radius + 15, 0);
        ctx.arc(this.radius + 15, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Small directional arrow/triangle
        ctx.beginPath();
        ctx.moveTo(this.radius + 22, -4);
        ctx.lineTo(this.radius + 28, 0);
        ctx.lineTo(this.radius + 22, 4);
        ctx.fill();

        ctx.restore();

        // 4. Character Body with Premium Gradients
        ctx.save();

        // Apply recoil visual offset locally to the body/hands/face group
        const recoilX = -Math.cos(this.facingAngle) * this.recoilOffset;
        const recoilY = -Math.sin(this.facingAngle) * this.recoilOffset;

        ctx.translate(x + recoilX, y + bobOffset + recoilY);

        // Apply spawn scale and breathing
        const currentScale = breathingScale * this.spawnScale;
        ctx.scale(currentScale, currentScale);

        const bodyGrad = ctx.createRadialGradient(
            -this.radius * 0.3,
            -this.radius * 0.3,
            this.radius * 0.1,
            0,
            0,
            this.radius
        );

        if (this.damageFlashTimer > 0) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#ff8888');
        } else {
            bodyGrad.addColorStop(0, this.color);
            bodyGrad.addColorStop(0.7, this.color);
            bodyGrad.addColorStop(1, this.team === TEAMS.BLUE ? '#154360' : '#641e16');
        }

        // Body Outer Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Stylish White Outline (Inner Rim Light)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Secondary Outer Black Border for extreme contrast
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Character Emoji / Icon - FILL BODY
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.font = `bold ${this.radius * 1.6}px "Lilita One", Arial`; // Large emoji to fill body
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Render slightly semi-transparent to blend with body color
        ctx.globalAlpha = 0.8;
        ctx.fillText(this.config.emoji, 0, 0);
        ctx.globalAlpha = 1.0;

        ctx.restore();

        // 4.5 Render Face (Eyes) - On top of body and emoji
        this.renderFace(ctx, x, y + bobOffset, this.radius, this.aimDirection, time);

        // 5. Polished HUD (Health/Ammo)
        this.renderPolishedHealthBar(ctx, x, y);
        this.renderPolishedAmmo(ctx, x, y);
        this.renderSuperChargeBar(ctx, x, y);

        if (this.gems > 0) {
            this.renderPremiumGemsIndicator(ctx, x, y);
        }

        if (this.superReady) {
            ctx.save();
            ctx.translate(x, y + bobOffset);
            ctx.rotate(time * 0.5);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    renderSuperChargeBar(ctx, x, y) {
        const barWidth = 50;
        const barHeight = 10;
        const barY = y + this.radius + 40;

        // Black background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 2);
        ctx.fill();

        // Charge Fill
        const chargePercent = this.superReady ? 1.0 : Math.max(0, this.superCharge / this.superChargeMax);

        if (chargePercent > 0) {
            ctx.save();
            // Pulse effect when ready
            if (this.superReady) {
                const time = performance.now() * 0.01;
                const pulse = 0.8 + Math.sin(time) * 0.2;
                ctx.globalAlpha = pulse;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffff00';
            } else {
                ctx.fillStyle = '#f1c40f'; // Yellowish orange for super charge
            }

            ctx.beginPath();
            ctx.roundRect(x - barWidth / 2, barY, barWidth * chargePercent, barHeight, 2);
            ctx.fill();
            ctx.restore();
        }
    }

    renderHands(ctx, x, y, radius, angle, time) {
        const handRadius = radius * 0.3;
        const handDist = radius * 1.1;
        const handBob = Math.sin(time * 2) * 3;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        // Left Hand
        ctx.save();
        ctx.translate(handDist, -radius * 0.8 + handBob);
        ctx.beginPath();
        ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Right Hand
        ctx.save();
        ctx.translate(handDist, radius * 0.8 - handBob);
        ctx.beginPath();
        ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    renderFace(ctx, x, y, radius, aimDir, time) {
        ctx.save();
        ctx.translate(x, y);

        // Face rotation based on aim direction (facingAngle)
        ctx.rotate(this.facingAngle);

        // Blinking logic
        const blinkCycle = (time * 0.5) % 10;
        let eyeScaleY = 1;
        if (blinkCycle > 9.5) {
            eyeScaleY = 0.1;
        }

        // Eyes position (offset to the edge of the body in the facing direction)
        const faceForwardOffset = radius * 0.7; // Closer to the edge
        const eyeSpacing = radius * 0.4;
        const eyeRadius = radius * 0.25;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;

        // Render both eyes
        for (let side of [-1, 1]) {
            ctx.save();
            // Position eyes on the front arc of the brawler
            ctx.translate(faceForwardOffset, side * eyeSpacing);
            ctx.scale(1, eyeScaleY);

            // White of the eye
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeRadius, eyeRadius * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Pupil
            if (eyeScaleY > 0.5) {
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(2, 0, eyeRadius * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Shiny reflection
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(4, -2, eyeRadius * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.restore();
    }

    renderPolishedHealthBar(ctx, x, y) {
        const barWidth = 80;
        const barHeight = 14;
        const barY = y - this.radius - 35;

        // Black Border/Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x - barWidth / 2 - 3, barY - 3, barWidth + 6, barHeight + 6, 5);
        ctx.fill();

        // Health Fill
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        let healthColor = '#2ecc71';
        if (healthPercent < 0.35) healthColor = '#e74c3c';
        else if (healthPercent < 0.65) healthColor = '#f1c40f';

        ctx.fillStyle = healthColor;
        ctx.beginPath();
        ctx.roundRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight, 4);
        ctx.fill();

        // Gloss Effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight / 2);

        // Health Text with outline for contrast
        ctx.font = 'bold 16px "Lilita One", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(Math.ceil(this.health), x, barY + barHeight / 2 + 1);
        ctx.fillStyle = 'white';
        ctx.fillText(Math.ceil(this.health), x, barY + barHeight / 2 + 1);
    }

    renderPolishedAmmo(ctx, x, y) {
        const ammoY = y + this.radius + 25;
        const spacing = 22;
        const width = 16;
        const height = 12;
        const totalWidth = this.ammoMax * spacing;
        const startX = x - totalWidth / 2 + spacing / 2;

        for (let i = 0; i < this.ammoMax; i++) {
            const isLoaded = i < this.ammo;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.roundRect(startX + i * spacing - width / 2, ammoY, width, height, 2);
            ctx.fill();

            if (isLoaded) {
                const grad = ctx.createLinearGradient(0, ammoY, 0, ammoY + height);
                grad.addColorStop(0, '#f1c40f');
                grad.addColorStop(1, '#d68910');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(startX + i * spacing - width / 2, ammoY, width, height, 2);
                ctx.fill();
            } else if (i === this.ammo) {
                const reloadProgress = this.reloadTimer / this.ammoReloadTime;
                ctx.fillStyle = 'rgba(241, 196, 15, 0.4)';
                ctx.beginPath();
                ctx.roundRect(startX + i * spacing - width / 2, ammoY, width * reloadProgress, height, 2);
                ctx.fill();
            }
        }
    }

    renderPremiumGemsIndicator(ctx, x, y) {
        const gemY = y - this.radius - 60;
        ctx.save();

        // Background pill for contrast
        const text = `💎 ${this.gems}`;
        ctx.font = 'bold 22px "Lilita One", Arial';
        ctx.textAlign = 'center';
        const textWidth = ctx.measureText(this.gems.toString()).width + 45;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.roundRect(x - textWidth / 2 - 6, gemY - 18, textWidth + 12, 32, 16);
        ctx.fill();

        // Gem text with glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#9b59b6';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, gemY);
        ctx.restore();
    }
}
