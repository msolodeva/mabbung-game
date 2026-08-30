import { Rect, Physics } from '../engine/Physics';
import { PlayerInput } from '../engine/Input';
import { ParticleManager } from '../engine/Particles';
import { AudioManager } from '../engine/Audio';
import { Projectile } from './Projectile';

export type FighterState =
  | 'IDLE'
  | 'WALK_FWD'
  | 'WALK_BACK'
  | 'JUMP'
  | 'CROUCH'
  | 'ROLL_FWD'
  | 'ROLL_BACK'
  | 'ATTACK_LIGHT'
  | 'ATTACK_HEAVY'
  | 'SPECIAL_1'
  | 'SPECIAL_2'
  | 'SPECIAL_3'
  | 'SUPER'
  | 'HURT'
  | 'BLOCK'
  | 'GUARD_CRUSH'
  | 'KNOCKDOWN'
  | 'KO'
  | 'VICTORY';

export interface FighterColors {
  skin: string;
  hair: string;
  outfit: string;
  outfitTrim: string;
  belt: string;
  effects: string;
}

export abstract class Fighter {
  public id: 1 | 2;
  public name: string;
  public x: number;
  public y: number;
  public vx = 0;
  public vy = 0;
  public width = 70;
  public height = 140;
  public facingRight: boolean;

  public maxHp = 1000;
  public hp = 1000;

  // Guard Gauge (KOF Guard Crush system)
  public maxGuardGauge = 100;
  public guardGauge = 100;

  // Super Gauge
  public superMeter = 0; // 0 to 300
  public maxSuperMeter = 300;

  public state: FighterState = 'IDLE';
  public stateTimer = 0;
  public hitStop = 0;

  public isGuarding = false;
  public isCrouching = false;
  public isAirborne = false;
  public canDoubleJump = false;
  public hasDoubleJumped = false;

  // Input Buffering for butter-smooth controls
  public bufferedLight = 0;
  public bufferedHeavy = 0;
  public bufferedSpecial = 0;
  public bufferedSuper = 0;
  public wakeUpInvincibility = 0;

  public comboHits = 0;
  public comboTimer = 0;
  public wins = 0;

  public activeHitbox: Rect | null = null;
  public hasHitInCurrentAttack = false;
  public invincible = false;

  public colors: FighterColors;
  public speed = 6.0;
  public jumpPower = -17;

  constructor(id: 1 | 2, name: string, startX: number, facingRight: boolean, colors: FighterColors) {
    this.id = id;
    this.name = name;
    this.x = startX;
    this.y = Physics.GROUND_Y;
    this.facingRight = facingRight;
    this.colors = colors;
  }

  public resetRound(startX: number, facingRight: boolean): void {
    this.x = startX;
    this.y = Physics.GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.guardGauge = this.maxGuardGauge;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.hitStop = 0;
    this.isAirborne = false;
    this.isCrouching = false;
    this.isGuarding = false;
    this.facingRight = facingRight;
    this.activeHitbox = null;
    this.hasHitInCurrentAttack = false;
    this.invincible = false;
    this.wakeUpInvincibility = 0;
    this.bufferedLight = 0;
    this.bufferedHeavy = 0;
    this.bufferedSpecial = 0;
    this.bufferedSuper = 0;
    this.comboHits = 0;
    this.comboTimer = 0;
  }

  public update(
    input: PlayerInput,
    opponent: Fighter,
    projectiles: Projectile[],
    particles: ParticleManager,
    audio: AudioManager
  ): void {
    // 1. Buffer Inputs (Up to 10 frames memory)
    if (input.lightAttackPressed) this.bufferedLight = 10;
    else if (this.bufferedLight > 0) this.bufferedLight--;

    if (input.heavyAttackPressed) this.bufferedHeavy = 10;
    else if (this.bufferedHeavy > 0) this.bufferedHeavy--;

    if (input.specialPressed || input.qcfPressed || input.dpPressed || input.qcbPressed) this.bufferedSpecial = 10;
    else if (this.bufferedSpecial > 0) this.bufferedSpecial--;

    if (input.superAttackPressed) this.bufferedSuper = 10;
    else if (this.bufferedSuper > 0) this.bufferedSuper--;

    // 2. Wake-up invincibility timer
    if (this.wakeUpInvincibility > 0) {
      this.wakeUpInvincibility--;
      this.invincible = this.wakeUpInvincibility > 0;
    }

    // 3. Guard Gauge passive recovery (when not actively guarding or in blockstun)
    if (this.state !== 'BLOCK' && !this.isGuarding && this.state !== 'GUARD_CRUSH') {
      if (this.guardGauge < this.maxGuardGauge) {
        this.guardGauge = Math.min(this.maxGuardGauge, this.guardGauge + 0.15);
      }
    }

    // 4. Hit-stop frame freeze
    if (this.hitStop > 0) {
      this.hitStop--;
      return;
    }

    this.stateTimer++;

    // 5. Combo counter timeout
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboHits = 0;
      }
    }

    // 6. Auto-face opponent when idle, walking, or crouching
    if (['IDLE', 'WALK_FWD', 'WALK_BACK', 'CROUCH'].includes(this.state)) {
      this.facingRight = this.x < opponent.x;
    }

    // 7. Check Emergency Roll (KOF 구르기: Guard + Left/Right)
    const isGrounded = !this.isAirborne;
    if (isGrounded && ['IDLE', 'WALK_FWD', 'WALK_BACK'].includes(this.state)) {
      const isFwd = (this.facingRight && input.right) || (!this.facingRight && input.left);
      const isBack = (this.facingRight && input.left) || (!this.facingRight && input.right);

      if (input.guardPressed && isFwd) {
        this.changeState('ROLL_FWD');
        audio.playRoll();
        particles.createDust(this.x, Physics.GROUND_Y, 6, this.facingRight ? 1 : -1);
        return;
      } else if (input.guardPressed && isBack) {
        this.changeState('ROLL_BACK');
        audio.playRoll();
        particles.createDust(this.x, Physics.GROUND_Y, 6, this.facingRight ? -1 : 1);
        return;
      }
    }

    // 8. Handle Roll States
    if (this.state === 'ROLL_FWD') {
      const rollSpeed = 10.5;
      this.vx = this.facingRight ? rollSpeed : -rollSpeed;
      if (this.stateTimer <= 16) {
        this.invincible = true; // Invincible during main roll
      } else {
        this.invincible = false; // Recovery vulnerability
      }
      if (this.stateTimer % 3 === 0) {
        particles.createDust(this.x, Physics.GROUND_Y, 2);
      }
      if (this.stateTimer > 22) {
        this.changeState('IDLE');
      }
      this.applyPhysics(particles);
      return;
    } else if (this.state === 'ROLL_BACK') {
      const rollSpeed = 9.0;
      this.vx = this.facingRight ? -rollSpeed : rollSpeed;
      if (this.stateTimer <= 14) {
        this.invincible = true;
      } else {
        this.invincible = false;
      }
      if (this.stateTimer % 3 === 0) {
        particles.createDust(this.x, Physics.GROUND_Y, 2);
      }
      if (this.stateTimer > 20) {
        this.changeState('IDLE');
      }
      this.applyPhysics(particles);
      return;
    }

    // 9. Guard Crush Stagger state
    if (this.state === 'GUARD_CRUSH') {
      this.vx *= 0.8;
      this.activeHitbox = null;
      if (this.stateTimer > 45) {
        this.guardGauge = this.maxGuardGauge * 0.5;
        this.changeState('IDLE');
      }
      this.applyPhysics(particles);
      return;
    }

    // 10. Process Character State
    this.handleState(input, opponent, projectiles, particles, audio);

    // 11. Apply physics
    this.applyPhysics(particles);
  }

  protected abstract handleState(
    input: PlayerInput,
    opponent: Fighter,
    projectiles: Projectile[],
    particles: ParticleManager,
    audio: AudioManager
  ): void;

  private applyPhysics(particles: ParticleManager): void {
    this.x += this.vx;
    this.y += this.vy;

    // Apply Gravity if airborne
    if (this.y < Physics.GROUND_Y) {
      this.isAirborne = true;
      this.vy += Physics.GRAVITY;
    } else {
      if (this.isAirborne && this.vy > 0) {
        particles.createDust(this.x, Physics.GROUND_Y, 5);
      }
      this.y = Physics.GROUND_Y;
      this.vy = 0;
      this.isAirborne = false;
      this.hasDoubleJumped = false;

      if (['JUMP'].includes(this.state)) {
        this.changeState('IDLE');
      }
    }

    // Friction
    if (!this.isAirborne) {
      if (['IDLE', 'CROUCH', 'BLOCK', 'HURT', 'GUARD_CRUSH'].includes(this.state)) {
        this.vx *= 0.82;
      }
    }

    // Stage boundary limits
    const minX = Physics.STAGE_LEFT + this.width / 2;
    const maxX = Physics.STAGE_RIGHT - this.width / 2;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  public changeState(newState: FighterState): void {
    if (this.state === 'KNOCKDOWN' && newState === 'IDLE') {
      this.wakeUpInvincibility = 22;
      this.invincible = true;
    }

    this.state = newState;
    this.stateTimer = 0;
    this.activeHitbox = null;
    this.hasHitInCurrentAttack = false;

    if (newState === 'CROUCH') {
      this.isCrouching = true;
    } else if (newState !== 'HURT' && newState !== 'BLOCK') {
      this.isCrouching = false;
    }
  }

  public getHurtbox(): Rect {
    const height = this.isCrouching || this.state === 'ROLL_FWD' || this.state === 'ROLL_BACK'
      ? this.height * 0.6
      : this.height;
    return {
      x: this.x - this.width / 2,
      y: this.y - height,
      width: this.width,
      height: height
    };
  }

  public takeDamage(
    amount: number,
    isHeavy: boolean,
    knockbackX: number,
    knockbackY: number,
    attacker: Fighter,
    particles: ParticleManager,
    audio: AudioManager,
    input?: PlayerInput
  ): boolean {
    if (this.state === 'KO' || this.invincible) return false;

    const hurtPointX = this.x;
    const hurtPointY = this.y - this.height * 0.6;

    // Check if defending (holding away from opponent or guard key)
    const isWalkingBack = this.state === 'WALK_BACK';
    const isHoldingBack = input ? ((this.facingRight && input.left) || (!this.facingRight && input.right)) : false;
    const isBlocking = (this.isGuarding || isWalkingBack || isHoldingBack) &&
                       this.state !== 'HURT' &&
                       this.state !== 'KNOCKDOWN' &&
                       this.state !== 'GUARD_CRUSH' &&
                       this.state !== 'ROLL_FWD' &&
                       this.state !== 'ROLL_BACK';

    if (isBlocking) {
      // Guard Gauge Damage
      const guardDmg = isHeavy ? 20 : 12;
      this.guardGauge = Math.max(0, this.guardGauge - guardDmg);

      if (this.guardGauge <= 0) {
        // GUARD CRUSH!
        this.changeState('GUARD_CRUSH');
        this.vx = this.facingRight ? -8 : 8;
        this.hitStop = 8;
        attacker.hitStop = 8;
        audio.playGuardCrush();
        particles.createHitSparks(hurtPointX, hurtPointY, true, '#ff1744');
        return true;
      }

      // Guard success! Chip damage only
      const chipDamage = Math.floor(amount * 0.12);
      this.hp = Math.max(1, this.hp - chipDamage);
      this.changeState('BLOCK');
      this.vx = this.facingRight ? -knockbackX * 0.8 : knockbackX * 0.8;
      this.hitStop = 4;
      attacker.hitStop = 4;
      this.addSuperMeter(8);
      attacker.addSuperMeter(6);

      particles.createBlockSparks(hurtPointX, hurtPointY);
      audio.playBlock();
      return false;
    }

    // Clean Hit
    this.hp = Math.max(0, this.hp - amount);
    this.addSuperMeter(15);
    attacker.addSuperMeter(25);

    attacker.comboHits++;
    attacker.comboTimer = 65;

    this.hitStop = isHeavy ? 7 : 4;
    attacker.hitStop = isHeavy ? 7 : 4;

    const scaledKnockback = knockbackX + Math.min(6, attacker.comboHits * 1.2);
    this.vx = this.facingRight ? -scaledKnockback : scaledKnockback;
    this.vy = knockbackY;

    particles.createHitSparks(hurtPointX, hurtPointY, isHeavy, attacker.colors.effects);

    if (isHeavy) {
      audio.playHitHeavy();
    } else {
      audio.playHitLight();
    }

    if (this.hp <= 0) {
      this.changeState('KO');
      this.vy = -10;
      this.vx = this.facingRight ? -8 : 8;
      audio.playKO();
    } else if (knockbackY < -3 || isHeavy) {
      this.changeState('KNOCKDOWN');
    } else {
      this.changeState('HURT');
    }

    return true;
  }

  public addSuperMeter(amount: number): void {
    this.superMeter = Math.min(this.maxSuperMeter, this.superMeter + amount);
  }

  public consumeSuperMeter(amount: number): boolean {
    if (this.superMeter >= amount) {
      this.superMeter -= amount;
      return true;
    }
    return false;
  }

  public render(ctx: CanvasRenderingContext2D, debug = false): void {
    if (this.wakeUpInvincibility > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    if (!this.facingRight) ctx.scale(-1, 1);

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    const shadowScale = Math.max(0.4, 1 - (Physics.GROUND_Y - this.y) / 400);
    ctx.ellipse(0, 0, (this.width / 2 + 10) * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Super Aura glow
    if (this.superMeter >= 300) {
      ctx.save();
      const auraPulse = Math.sin(Date.now() * 0.008) * 8 + 12;
      const auraGrad = ctx.createRadialGradient(0, -this.height * 0.5, 20, 0, -this.height * 0.5, this.height * 0.8 + auraPulse);
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      auraGrad.addColorStop(0.7, 'rgba(255, 87, 34, 0.2)');
      auraGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -this.height * 0.5, this.height * 0.8 + auraPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Roll spin effect
    if (this.state === 'ROLL_FWD' || this.state === 'ROLL_BACK') {
      const rot = (this.stateTimer / 22) * Math.PI * 2 * (this.state === 'ROLL_FWD' ? 1 : -1);
      ctx.rotate(rot);
      ctx.translate(0, 30);
    }

    // Draw Character Sprites procedurally
    this.drawCharacterBody(ctx);

    ctx.restore();
    ctx.globalAlpha = 1.0;

    // Debug Hitbox / Hurtbox display
    if (debug) {
      ctx.save();
      const hurt = this.getHurtbox();
      ctx.strokeStyle = this.invincible ? 'rgba(255, 255, 0, 0.85)' : 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hurt.x, hurt.y, hurt.width, hurt.height);

      if (this.activeHitbox) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.85)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
        ctx.lineWidth = 2;
        ctx.fillRect(this.activeHitbox.x, this.activeHitbox.y, this.activeHitbox.width, this.activeHitbox.height);
        ctx.strokeRect(this.activeHitbox.x, this.activeHitbox.y, this.activeHitbox.width, this.activeHitbox.height);
      }
      ctx.restore();
    }
  }

  protected abstract drawCharacterBody(ctx: CanvasRenderingContext2D): void;
}
