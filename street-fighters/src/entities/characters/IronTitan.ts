import { Fighter, FighterColors } from '../Fighter';
import { PlayerInput } from '../../engine/Input';
import { ParticleManager } from '../../engine/Particles';
import { AudioManager } from '../../engine/Audio';
import { Projectile } from '../Projectile';
import { Rect, Physics } from '../../engine/Physics';

export class IronTitan extends Fighter {
  constructor(id: 1 | 2, startX: number, facingRight: boolean, customColors?: Partial<FighterColors>) {
    const defaultColors: FighterColors = id === 1 ? {
      skin: '#ffcc80',
      hair: '#ffd54f', // Blonde Flat-top
      outfit: '#33691e', // Camo Green Tank Top
      outfitTrim: '#76ff03', // Green Sonic Glow
      belt: '#263238',
      effects: '#76ff03'
    } : {
      skin: '#ffe0b2',
      hair: '#795548',
      outfit: '#1e88e5',
      outfitTrim: '#00e676',
      belt: '#0d47a1',
      effects: '#00e676'
    };

    super(id, 'GUILE', startX, facingRight, { ...defaultColors, ...customColors });
    this.width = 85;
    this.height = 150;
    this.speed = 5.4;
    this.jumpPower = -16;
  }

  protected handleState(
    input: PlayerInput,
    opponent: Fighter,
    projectiles: Projectile[],
    particles: ParticleManager,
    audio: AudioManager
  ): void {
    const isGrounded = !this.isAirborne;

    const hasLight = input.lightAttackPressed || this.bufferedLight > 0;
    const hasHeavy = input.heavyAttackPressed || this.bufferedHeavy > 0;
    const hasSpecial = input.specialPressed || this.bufferedSpecial > 0 || input.qcfPressed;
    const hasSuper = (input.superAttackPressed || this.bufferedSuper > 0) && this.superMeter >= 100;

    // Super (Somersault Explosion - 서머솔트 익스플로전)
    if (hasSuper && isGrounded && !['HURT', 'KNOCKDOWN', 'KO', 'SUPER', 'GUARD_CRUSH'].includes(this.state)) {
      this.bufferedSuper = 0;
      this.consumeSuperMeter(100);
      this.changeState('SUPER');
      this.invincible = true;
      audio.playSuperActivate();
      particles.triggerSuperFreeze('#76ff03', 'SOMERSAULT EXPLOSION');
      particles.createHitSparks(this.x, this.y - 70, true, '#76ff03');
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'WALK_FWD':
      case 'WALK_BACK':
        this.isGuarding = input.guard;

        if (input.dpPressed || (input.up && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_2'); // Flash Kick / Somersault
          audio.playDragonPunch();
          return;
        }
        if (input.qcbPressed || (input.down && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_3'); // Rocket Tackle
          audio.playHitHeavy();
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1'); // Sonic Boom
          audio.playFireballLaunch();
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(180);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(260);
          return;
        }

        if (input.upPressed && isGrounded) {
          this.vy = this.jumpPower;
          if (input.left) this.vx = -this.speed * 0.85;
          else if (input.right) this.vx = this.speed * 0.85;
          this.changeState('JUMP');
          audio.playJump();
          particles.createDust(this.x, this.y, 6);
          return;
        }
        if (input.down && isGrounded) {
          this.changeState('CROUCH');
          return;
        }

        if (input.left) {
          this.vx = -this.speed;
          this.state = this.facingRight ? 'WALK_BACK' : 'WALK_FWD';
        } else if (input.right) {
          this.vx = this.speed;
          this.state = this.facingRight ? 'WALK_FWD' : 'WALK_BACK';
        } else {
          this.vx = 0;
          this.state = 'IDLE';
        }
        break;

      case 'CROUCH':
        this.vx = 0;
        this.isGuarding = input.guard;

        if (!input.down) {
          this.changeState('IDLE');
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1');
          audio.playFireballLaunch();
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(180);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(260);
          return;
        }
        break;

      case 'JUMP':
        if (hasLight && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(260);
        } else if (hasHeavy && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(180);
        }
        break;

      case 'ATTACK_LIGHT':
        if (this.stateTimer >= 3 && this.stateTimer <= 7) {
          const hitWidth = 70;
          const hitHeight = 40;
          const hitX = this.facingRight ? this.x + 15 : this.x - 15 - hitWidth;
          const hitY = this.isCrouching ? this.y - 45 : this.y - 105;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(55, false, 7, 0, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.hasHitInCurrentAttack && this.stateTimer >= 4) {
          if (hasSpecial) {
            this.bufferedSpecial = 0;
            this.changeState('SPECIAL_1');
            audio.playFireballLaunch();
            return;
          }
          if (hasHeavy) {
            this.bufferedHeavy = 0;
            this.changeState('ATTACK_HEAVY');
            audio.playWhoosh(180);
            return;
          }
        }

        if (this.stateTimer > 12) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'ATTACK_HEAVY':
        // Heavy Bazooka Knee
        if (this.stateTimer <= 10) {
          this.vx = this.facingRight ? 5 : -5;
        }

        if (this.stateTimer >= 5 && this.stateTimer <= 12) {
          const hitWidth = 90;
          const hitHeight = 65;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 40 : this.y - 115;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(110, true, 12, -5, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.hasHitInCurrentAttack && hasSuper) {
          this.bufferedSuper = 0;
          this.consumeSuperMeter(100);
          this.changeState('SUPER');
          this.invincible = true;
          audio.playSuperActivate();
          return;
        }

        if (this.stateTimer > 18) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'SPECIAL_1':
        // Sonic Boom (소닉 붐)
        this.vx = 0;
        if (this.stateTimer === 6) {
          const spawnX = this.facingRight ? this.x + 55 : this.x - 55;
          const spawnY = this.y - 80;
          projectiles.push(new Projectile(this.id, spawnX, spawnY, this.facingRight, 'sonicboom', 95, 14));
        }

        if (this.stateTimer > 20) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_2':
        // Flash Kick / Somersault (서머솔트 킥 with Green Slash Arc)
        if (this.stateTimer === 1) {
          this.invincible = true;
          this.vx = this.facingRight ? 3 : -3;
          this.vy = -18;
          particles.addSlashArc({
            x: this.x,
            y: this.y - 80,
            radius: 65,
            startAngle: -Math.PI * 0.7,
            endAngle: Math.PI * 0.5,
            color: '#76ff03',
            lineWidth: 10,
            facingRight: this.facingRight
          }, 12);
        }

        if (this.stateTimer >= 2 && this.stateTimer <= 14) {
          particles.createFireTrail(this.x, this.y - 70, '#76ff03');
          const hitWidth = 80;
          const hitHeight = 95;
          const hitX = this.facingRight ? this.x - 20 : this.x - 60;
          const hitY = this.y - 130;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(130, true, 8, -12, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
          this.invincible = false;
        }

        if (this.y >= Physics.GROUND_Y && this.stateTimer > 16) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_3':
        // Rocket Tackle
        if (this.stateTimer <= 10) {
          this.vx = this.facingRight ? 14 : -14;
          particles.createDust(this.x, Physics.GROUND_Y, 4);
        } else {
          this.vx = 0;
        }

        if (this.stateTimer >= 3 && this.stateTimer <= 11) {
          const hitWidth = 90;
          const hitHeight = 60;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.y - 105;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(110, true, 11, -4, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 20) {
          this.changeState('IDLE');
        }
        break;

      case 'SUPER':
        // Somersault Explosion (2연속 서머솔트 + 폭발)
        if (this.stateTimer === 1) {
          this.invincible = true;
          this.vx = this.facingRight ? 8 : -8;
          this.vy = -16;
        }

        if (this.stateTimer >= 2 && this.stateTimer <= 20) {
          particles.createFireTrail(this.x, this.y - 70, '#76ff03');
          const hitWidth = 90;
          const hitHeight = 90;
          const hitX = this.facingRight ? this.x - 30 : this.x - 60;
          this.activeHitbox = { x: hitX, y: this.y - 120, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(160, true, 14, -10, this, particles, audio);
            audio.playBusterWolf();
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.y >= Physics.GROUND_Y && this.stateTimer > 24) {
          this.invincible = false;
          this.changeState('IDLE');
        }
        break;

      case 'HURT':
        this.activeHitbox = null;
        if (this.stateTimer > 12) this.changeState('IDLE');
        break;

      case 'BLOCK':
        this.activeHitbox = null;
        if (this.stateTimer > 8) this.changeState('IDLE');
        break;

      case 'KNOCKDOWN':
        this.activeHitbox = null;
        if (this.y >= Physics.GROUND_Y && this.stateTimer > 30) this.changeState('IDLE');
        break;

      case 'KO':
      case 'VICTORY':
        this.vx = 0;
        this.activeHitbox = null;
        break;
    }
  }

  private checkHit(opponent: Fighter): boolean {
    if (!this.activeHitbox) return false;
    const oppHurt = opponent.getHurtbox();
    return (
      this.activeHitbox.x < oppHurt.x + oppHurt.width &&
      this.activeHitbox.x + this.activeHitbox.width > oppHurt.x &&
      this.activeHitbox.y < oppHurt.y + oppHurt.height &&
      this.activeHitbox.y + this.activeHitbox.height > oppHurt.y
    );
  }

  protected drawCharacterBody(ctx: CanvasRenderingContext2D): void {
    const c = this.colors;
    const bodyHeight = 58;
    const crouchOffset = this.isCrouching ? 35 : 0;
    const idleBounce = this.state === 'IDLE' ? Math.sin(this.stateTimer * 0.12) * 2.5 : 0;

    let headY = -this.height + 22 + crouchOffset + idleBounce;
    let chestY = headY + 16;
    let legY = chestY + bodyHeight;

    if (this.state === 'KNOCKDOWN' || this.state === 'KO') {
      ctx.rotate(-Math.PI / 2.5);
      headY += 40;
      chestY += 40;
      legY += 40;
    }

    if (this.state === 'SPECIAL_2' || this.state === 'SUPER') {
      const rot = -(this.stateTimer * 0.75) % (Math.PI * 2);
      ctx.rotate(rot);
    }

    // --- 1. CAMO CARGO TROUSERS & COMBAT BOOTS ---
    ctx.strokeStyle = '#2e7d32'; // Olive Camo
    ctx.lineWidth = 18;
    ctx.lineCap = 'square';

    ctx.beginPath();
    if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      const walkCycle = Math.sin(this.stateTimer * 0.3) * 18;
      ctx.moveTo(-14, legY);
      ctx.lineTo(-16 + walkCycle, 0);
      ctx.moveTo(14, legY);
      ctx.lineTo(16 - walkCycle, 0);
    } else if (this.isCrouching) {
      ctx.moveTo(-16, legY);
      ctx.lineTo(-28, 0);
      ctx.moveTo(16, legY);
      ctx.lineTo(24, 0);
    } else {
      ctx.moveTo(-16, legY);
      ctx.lineTo(-18, 0);
      ctx.moveTo(16, legY);
      ctx.lineTo(18, 0);
    }
    ctx.stroke();

    // Heavy Black Combat Boots
    ctx.fillStyle = '#212121';
    ctx.fillRect(-26, -12, 20, 12);
    ctx.fillRect(8, -12, 20, 12);

    // Boot tread & silver eyelets
    ctx.fillStyle = '#424242';
    ctx.fillRect(-26, -4, 20, 4);
    ctx.fillRect(8, -4, 20, 4);

    // --- 2. TANK TOP & MUSCULAR TORSO WITH TATTOO ---
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-24, chestY, 48, bodyHeight);

    // Muscular Neck & Collarbone
    ctx.fillStyle = c.skin;
    ctx.fillRect(-12, chestY - 8, 24, 10);

    // American Flag / Eagle Tattoo on Deltoid
    ctx.fillStyle = '#d50000';
    ctx.fillRect(-28, chestY + 6, 8, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-28, chestY + 8, 8, 2);

    // Dog Tags necklace
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, chestY + 8, 8, 0, Math.PI);
    ctx.stroke();

    // --- 3. BLONDE FLAT-TOP HAIR & SQUARE JAW ---
    // Iconic Tall Flat-top Hair
    ctx.fillStyle = c.hair;
    ctx.fillRect(-18, headY - 26, 36, 18);

    // Face
    ctx.fillStyle = c.skin;
    ctx.fillRect(-14, headY - 8, 28, 24);

    // Stoic Eyes
    ctx.fillStyle = '#000000';
    if (this.state === 'KO' || this.state === 'HURT') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headY);
      ctx.lineTo(8, headY + 4);
      ctx.stroke();
    } else {
      ctx.fillRect(2, headY, 5, 3);
      ctx.fillRect(0, headY - 3, 8, 2); // Heavy brow
    }

    // --- 4. MUSCULAR ARMS & SONIC BOOM CHOP ---
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (this.state === 'SPECIAL_1') {
      // Sonic Boom Cross-Chop
      ctx.moveTo(-14, chestY + 12);
      ctx.lineTo(40, chestY + 8);
      ctx.moveTo(14, chestY + 12);
      ctx.lineTo(40, chestY + 16);
    } else {
      ctx.moveTo(-14, chestY + 12);
      ctx.lineTo(12, chestY + 24);
      ctx.moveTo(14, chestY + 12);
      ctx.lineTo(24, chestY + 18);
    }
    ctx.stroke();
  }
}
