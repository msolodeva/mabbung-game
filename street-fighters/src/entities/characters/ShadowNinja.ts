import { Fighter, FighterColors } from '../Fighter';
import { PlayerInput } from '../../engine/Input';
import { ParticleManager } from '../../engine/Particles';
import { AudioManager } from '../../engine/Audio';
import { Projectile } from '../Projectile';
import { Physics } from '../../engine/Physics';

export class ShadowNinja extends Fighter {
  constructor(id: 1 | 2, startX: number, facingRight: boolean, customColors?: Partial<FighterColors>) {
    const defaultColors: FighterColors = id === 1 ? {
      skin: '#ffe0b2',
      hair: '#3e2723',
      outfit: '#d50000', // Crimson Kunoichi Kimono
      outfitTrim: '#ffffff', // White Ribbons
      belt: '#ffffff',
      effects: '#ff4081'
    } : {
      skin: '#ffe0b2',
      hair: '#311b92',
      outfit: '#4a148c',
      outfitTrim: '#e040fb',
      belt: '#ea80fc',
      effects: '#e040fb'
    };

    super(id, 'MAI', startX, facingRight, { ...defaultColors, ...customColors });
    this.speed = 8.0;
    this.jumpPower = -16;
    this.canDoubleJump = true;
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

    // Super (Chou Hissatsu Shinobi-Bachi - 초필살 인봉 분신 난무)
    if (hasSuper && isGrounded && !['HURT', 'KNOCKDOWN', 'KO', 'SUPER', 'GUARD_CRUSH'].includes(this.state)) {
      this.bufferedSuper = 0;
      this.consumeSuperMeter(100);
      this.changeState('SUPER');
      this.invincible = true;
      audio.playSuperActivate();
      particles.triggerSuperFreeze('#ff4081', 'SHINOBI-BACHI');
      particles.createHitSparks(this.x, this.y - 70, true, '#ff4081');
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'WALK_FWD':
      case 'WALK_BACK':
        this.isGuarding = input.guard;

        if (input.dpPressed || (input.up && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_3'); // Flying Dive Kick
          audio.playWhoosh(550);
          return;
        }
        if (input.qcbPressed || (input.right && hasSpecial && this.facingRight) || (input.left && hasSpecial && !this.facingRight)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_2'); // Shadow Dash Strike
          audio.playWhoosh(500);
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1'); // Shuriken/Fan Toss
          audio.playWhoosh(600);
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(280);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(400);
          return;
        }

        if (input.upPressed && isGrounded) {
          this.vy = this.jumpPower;
          if (input.left) this.vx = -this.speed * 0.95;
          else if (input.right) this.vx = this.speed * 0.95;
          this.changeState('JUMP');
          audio.playJump();
          particles.createDust(this.x, this.y, 4);
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
          audio.playWhoosh(600);
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(280);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(400);
          return;
        }
        break;

      case 'JUMP':
        if (input.upPressed && !this.hasDoubleJumped) {
          this.hasDoubleJumped = true;
          this.vy = this.jumpPower * 0.9;
          audio.playJump();
          particles.createDust(this.x, this.y, 6);
        }

        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_3'); // Air dive
          audio.playWhoosh(550);
        } else if (hasLight && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(450);
        } else if (hasHeavy && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(300);
        }
        break;

      case 'ATTACK_LIGHT':
        if (this.stateTimer >= 2 && this.stateTimer <= 6) {
          const hitWidth = 65;
          const hitHeight = 35;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 40 : this.y - 95;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(40, false, 5, 0, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.hasHitInCurrentAttack && this.stateTimer >= 3) {
          if (hasSpecial) {
            this.bufferedSpecial = 0;
            this.changeState('SPECIAL_2');
            audio.playWhoosh(500);
            return;
          }
          if (hasHeavy) {
            this.bufferedHeavy = 0;
            this.changeState('ATTACK_HEAVY');
            audio.playWhoosh(280);
            return;
          }
        }

        if (this.stateTimer > 9) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'ATTACK_HEAVY':
        // Fan Swipe with Slash Arc
        if (this.stateTimer === 3) {
          particles.addSlashArc({
            x: this.x + (this.facingRight ? 25 : -25),
            y: this.y - 80,
            radius: 50,
            startAngle: -Math.PI * 0.45,
            endAngle: Math.PI * 0.3,
            color: '#ff4081',
            lineWidth: 8,
            facingRight: this.facingRight
          });
        }

        if (this.stateTimer >= 4 && this.stateTimer <= 10) {
          const hitWidth = 85;
          const hitHeight = 55;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 30 : this.y - 110;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(85, true, 9, -5, this, particles, audio);
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

        if (this.stateTimer > 14) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'SPECIAL_1':
        // Fan Toss (화접선)
        this.vx = 0;
        if (this.stateTimer === 5) {
          const spawnX = this.facingRight ? this.x + 40 : this.x - 40;
          const spawnY = this.y - 75;
          projectiles.push(new Projectile(this.id, spawnX, spawnY, this.facingRight, 'shuriken', 75, 16));
        }

        if (this.stateTimer > 16) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_2':
        // Flame Dash Strike (필살인봉)
        if (this.stateTimer <= 8) {
          this.invincible = true;
          this.vx = this.facingRight ? 18 : -18;
          particles.createFireTrail(this.x, this.y - 60, '#ff4081');
        } else {
          this.vx = 0;
          this.invincible = false;
        }

        if (this.stateTimer >= 3 && this.stateTimer <= 9) {
          const hitWidth = 95;
          const hitHeight = 65;
          const hitX = this.facingRight ? this.x - 20 : this.x - 75;
          const hitY = this.y - 90;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(110, true, 10, -6, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 18) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_3':
        // Flying Dive Kick (비상용염진)
        this.vy = 16;
        this.vx = this.facingRight ? 12 : -12;
        particles.createFireTrail(this.x, this.y - 50, '#ff4081');

        const diveHitWidth = 80;
        const diveHitHeight = 60;
        this.activeHitbox = {
          x: this.facingRight ? this.x : this.x - diveHitWidth,
          y: this.y - 60,
          width: diveHitWidth,
          height: diveHitHeight
        };

        if (this.checkHit(opponent)) {
          opponent.takeDamage(95, true, 9, -5, this, particles, audio);
          this.activeHitbox = null;
          this.changeState('IDLE');
        }

        if (this.y >= Physics.GROUND_Y) {
          this.changeState('IDLE');
        }
        break;

      case 'SUPER':
        // Multi-Clone Tempest Strike
        if (this.stateTimer <= 12) {
          this.invincible = true;
          particles.createFireTrail(this.x, this.y - 50, '#ff4081');
        }

        if (this.stateTimer >= 14 && this.stateTimer <= 42 && this.stateTimer % 4 === 0) {
          this.x = opponent.x + (Math.random() - 0.5) * 80;
          this.y = Physics.GROUND_Y - Math.random() * 40;
          const hitWidth = 90;
          const hitHeight = 90;
          this.activeHitbox = { x: opponent.x - 45, y: opponent.y - 90, width: hitWidth, height: hitHeight };
          opponent.takeDamage(22, true, (Math.random() - 0.5) * 6, -2, this, particles, audio);
          particles.createHitSparks(opponent.x, opponent.y - 60, false, '#ff4081');
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 46) {
          this.invincible = false;
          this.changeState('IDLE');
        }
        break;

      case 'HURT':
        this.activeHitbox = null;
        if (this.stateTimer > 10) this.changeState('IDLE');
        break;

      case 'BLOCK':
        this.activeHitbox = null;
        if (this.stateTimer > 7) this.changeState('IDLE');
        break;

      case 'KNOCKDOWN':
        this.activeHitbox = null;
        if (this.y >= Physics.GROUND_Y && this.stateTimer > 25) this.changeState('IDLE');
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
    const headRadius = 14;
    const bodyHeight = 52;
    const crouchOffset = this.isCrouching ? 32 : 0;
    const idleBounce = this.state === 'IDLE' ? Math.sin(this.stateTimer * 0.15) * 3 : 0;

    let headY = -this.height + headRadius + crouchOffset + 5 + idleBounce;
    let chestY = headY + headRadius + 4;
    let legY = chestY + bodyHeight;

    if (this.state === 'KNOCKDOWN' || this.state === 'KO') {
      ctx.rotate(-Math.PI / 2.5);
      headY += 40;
      chestY += 40;
      legY += 40;
    }

    // --- 1. SLENDER LEGS & RED TABI BOOTS ---
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';

    ctx.beginPath();
    if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      const walkCycle = Math.sin(this.stateTimer * 0.45) * 22;
      ctx.moveTo(-8, legY);
      ctx.lineTo(-10 + walkCycle, 0);
      ctx.moveTo(8, legY);
      ctx.lineTo(10 - walkCycle, 0);
    } else if (this.isCrouching) {
      ctx.moveTo(-10, legY);
      ctx.lineTo(-22, 0);
      ctx.moveTo(10, legY);
      ctx.lineTo(16, 0);
    } else if (this.isAirborne) {
      ctx.moveTo(-8, legY);
      ctx.lineTo(-18, -12);
      ctx.moveTo(8, legY);
      ctx.lineTo(18, -18);
    } else {
      ctx.moveTo(-9, legY);
      ctx.lineTo(-11, 0);
      ctx.moveTo(9, legY);
      ctx.lineTo(11, 0);
    }
    ctx.stroke();

    // Red Tabi Boots with White Straps
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-18, -8, 12, 8);
    ctx.fillRect(6, -8, 12, 8);

    // --- 2. CRIMSON KUNOICHI KIMONO & WHITE WAIST SASH ---
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-16, chestY, 32, bodyHeight);

    // White Waist Sash with giant ribbon knot on back
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-18, legY - 14, 36, 12);

    // Giant White Ribbon Tails fluttering behind
    const sashWave = Math.sin(this.stateTimer * 0.25) * 6;
    ctx.beginPath();
    ctx.moveTo(-18, legY - 8);
    ctx.lineTo(-32, legY + 16 + sashWave);
    ctx.lineTo(-26, legY + 20 + sashWave);
    ctx.closePath();
    ctx.fill();

    // Red Kimono Tails
    ctx.fillStyle = c.outfit;
    ctx.beginPath();
    ctx.moveTo(-14, legY - 2);
    ctx.lineTo(-18 + sashWave, legY + 26);
    ctx.lineTo(14 + sashWave, legY + 26);
    ctx.lineTo(14, legY - 2);
    ctx.closePath();
    ctx.fill();

    // --- 3. HEAD, LONG PONYTAIL & KUNOICHI HEADBAND ---
    // Dark Brown Hair
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius + 1, 0, Math.PI * 2);
    ctx.fill();

    // Long Ponytail tied up with white ribbon
    const ponyWave = Math.sin(this.stateTimer * 0.2) * 6;
    ctx.beginPath();
    ctx.moveTo(-headRadius + 2, headY - 4);
    ctx.lineTo(-headRadius - 28, headY + 18 + ponyWave);
    ctx.lineTo(-headRadius - 20, headY + 24 + ponyWave);
    ctx.closePath();
    ctx.fill();

    // White Hair Ribbon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-headRadius + 2, headY - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(2, headY + 2, headRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    if (this.state === 'KO' || this.state === 'HURT') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, headY - 1);
      ctx.lineTo(9, headY + 3);
      ctx.stroke();
    } else {
      ctx.fillRect(4, headY - 2, 4, 3);
      ctx.fillRect(3, headY - 5, 5, 2);
    }

    // --- 4. ARMS & GOLDEN FOLDING FANS (화접선) ---
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (this.state === 'ATTACK_LIGHT' || this.state === 'SPECIAL_2') {
      ctx.moveTo(-8, chestY + 10);
      ctx.lineTo(34, chestY + 10);
    } else if (this.state === 'SPECIAL_1') {
      ctx.moveTo(-10, chestY + 8);
      ctx.lineTo(30, chestY + 8);
    } else {
      ctx.moveTo(-8, chestY + 8);
      ctx.lineTo(12, chestY + 18);
      ctx.moveTo(8, chestY + 8);
      ctx.lineTo(20, chestY + 14);
    }
    ctx.stroke();

    // Golden Folding Fans (화접선)
    ctx.fillStyle = '#ffd700';
    if (this.state === 'ATTACK_LIGHT' || this.state === 'SPECIAL_2' || this.state === 'SPECIAL_1') {
      // Fan Open
      ctx.beginPath();
      ctx.moveTo(34, chestY + 10);
      ctx.arc(34, chestY + 10, 16, -Math.PI * 0.4, Math.PI * 0.2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Fan in hand
      ctx.beginPath();
      ctx.moveTo(20, chestY + 14);
      ctx.arc(20, chestY + 14, 12, -Math.PI * 0.3, Math.PI * 0.2);
      ctx.closePath();
      ctx.fill();
    }
  }
}
