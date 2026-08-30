import { Fighter, FighterColors } from '../Fighter';
import { PlayerInput } from '../../engine/Input';
import { ParticleManager } from '../../engine/Particles';
import { AudioManager } from '../../engine/Audio';
import { Projectile } from '../Projectile';
import { Rect, Physics } from '../../engine/Physics';

export class ChunLiFighter extends Fighter {
  constructor(id: 1 | 2, startX: number, facingRight: boolean, customColors?: Partial<FighterColors>) {
    const defaultColors: FighterColors = id === 1 ? {
      skin: '#ffe0b2',
      hair: '#3e2723',
      outfit: '#1565c0', // Royal Blue Qipao
      outfitTrim: '#ffd700', // Gold Dragon Trim
      belt: '#ffffff', // White Sash
      effects: '#00e5ff'
    } : {
      skin: '#ffcc80',
      hair: '#212121',
      outfit: '#c2185b', // Crimson Pink Qipao
      outfitTrim: '#ffffff',
      belt: '#ffd700',
      effects: '#ff4081'
    };

    super(id, 'CHUN-LI', startX, facingRight, { ...defaultColors, ...customColors });
    this.speed = 7.2;
    this.jumpPower = -17;
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

    // Super (Kikosho - 기공장)
    if (hasSuper && isGrounded && !['HURT', 'KNOCKDOWN', 'KO', 'SUPER', 'GUARD_CRUSH'].includes(this.state)) {
      this.bufferedSuper = 0;
      this.consumeSuperMeter(100);
      this.changeState('SUPER');
      this.invincible = true;
      audio.playSuperActivate();
      particles.triggerSuperFreeze('#00e5ff', 'KIKOSHO');
      particles.createHitSparks(this.x, this.y - 70, true, '#00e5ff');
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'WALK_FWD':
      case 'WALK_BACK':
        this.isGuarding = input.guard;

        if (input.dpPressed || (input.up && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_2'); // Spinning Bird Kick
          audio.playTatsumaki();
          return;
        }
        if (input.qcbPressed || (input.down && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_3'); // Hyakuretsukyaku
          audio.playHyakuretsu();
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1'); // Kikoken
          audio.playFireballLaunch();
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(260);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(380);
          return;
        }

        if (input.upPressed && isGrounded) {
          this.vy = this.jumpPower;
          if (input.left) this.vx = -this.speed * 0.9;
          else if (input.right) this.vx = this.speed * 0.9;
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
          this.changeState('SPECIAL_3');
          audio.playHyakuretsu();
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(240);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(380);
          return;
        }
        break;

      case 'JUMP':
        if (hasLight && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(380);
        } else if (hasHeavy && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(260);
        }
        break;

      case 'ATTACK_LIGHT':
        if (this.stateTimer >= 2 && this.stateTimer <= 6) {
          const hitWidth = 65;
          const hitHeight = 35;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 45 : this.y - 100;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(42, false, 5, 0, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.hasHitInCurrentAttack && this.stateTimer >= 3) {
          if (hasSpecial) {
            this.bufferedSpecial = 0;
            this.changeState('SPECIAL_3');
            audio.playHyakuretsu();
            return;
          }
          if (hasHeavy) {
            this.bufferedHeavy = 0;
            this.changeState('ATTACK_HEAVY');
            audio.playWhoosh(260);
            return;
          }
        }

        if (this.stateTimer > 9) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'ATTACK_HEAVY':
        // High Axe Kick with Slash Arc
        if (this.stateTimer === 3) {
          particles.addSlashArc({
            x: this.x + (this.facingRight ? 25 : -25),
            y: this.y - 80,
            radius: 55,
            startAngle: -Math.PI * 0.5,
            endAngle: Math.PI * 0.2,
            color: '#00e5ff',
            lineWidth: 8,
            facingRight: this.facingRight
          });
        }

        if (this.stateTimer >= 4 && this.stateTimer <= 10) {
          const hitWidth = 85;
          const hitHeight = 55;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 35 : this.y - 115;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(90, true, 9, -5, this, particles, audio);
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

        if (this.stateTimer > 15) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'SPECIAL_1':
        // Kikoken (기공권)
        this.vx = 0;
        if (this.stateTimer === 6) {
          const spawnX = this.facingRight ? this.x + 40 : this.x - 40;
          const spawnY = this.y - 75;
          projectiles.push(new Projectile(this.id, spawnX, spawnY, this.facingRight, 'kikoken', 85, 11));
          particles.createFireTrail(spawnX, spawnY, '#00e5ff');
        }

        if (this.stateTimer > 18) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_2':
        // Spinning Bird Kick (스피닝 버드 킥)
        this.vy = -4;
        this.vx = this.facingRight ? 9 : -9;

        if (this.stateTimer >= 3 && this.stateTimer <= 20 && this.stateTimer % 5 === 0) {
          const hitWidth = 95;
          const hitHeight = 60;
          const hitX = this.facingRight ? this.x - 20 : this.x - 75;
          const hitY = this.y - 85;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (this.checkHit(opponent)) {
            opponent.takeDamage(28, false, 5, -2, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 22) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_3':
        // Hyakuretsukyaku (백열각 - 6-hit rapid kicks)
        this.vx = this.facingRight ? 2 : -2;

        if (this.stateTimer >= 3 && this.stateTimer <= 24 && this.stateTimer % 3 === 0) {
          const hitWidth = 85;
          const hitHeight = 55;
          const hitX = this.facingRight ? this.x + 15 : this.x - 15 - hitWidth;
          const hitY = this.y - 95;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (this.checkHit(opponent)) {
            opponent.takeDamage(20, false, 3, 0, this, particles, audio);
            particles.createHitSparks(this.facingRight ? this.x + 60 : this.x - 60, this.y - 80, false, this.colors.effects);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 26) {
          this.changeState('IDLE');
        }
        break;

      case 'SUPER':
        // Kikosho (기공장)
        this.vx = 0;
        if (this.stateTimer <= 12) {
          this.invincible = true;
          particles.createFireTrail(this.x, this.y - 70, '#00e5ff');
        } else {
          this.invincible = false;
        }

        if (this.stateTimer >= 14 && this.stateTimer <= 38 && this.stateTimer % 4 === 0) {
          const domeX = this.facingRight ? this.x + 20 : this.x - 180;
          this.activeHitbox = { x: domeX, y: this.y - 140, width: 160, height: 140 };
          if (this.checkHit(opponent)) {
            opponent.takeDamage(35, true, 8, -6, this, particles, audio);
            particles.createHitSparks(this.facingRight ? this.x + 80 : this.x - 80, this.y - 70, true, '#00e5ff');
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 42) {
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
        if (this.y >= Physics.GROUND_Y && this.stateTimer > 26) this.changeState('IDLE');
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

    if (this.state === 'SPECIAL_2') {
      const rot = Math.PI + (this.stateTimer * 0.9) % (Math.PI * 2);
      ctx.rotate(rot);
    }

    // --- 1. LEGS & LACED COMBAT BOOTS ---
    ctx.strokeStyle = '#deb887'; // Tights / Skin
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    ctx.beginPath();
    if (this.state === 'SPECIAL_3') {
      // Hyakuretsukyaku (Multi-leg fan barrage)
      for (let k = -2; k <= 2; k++) {
        const kAngle = (k * 0.2) + Math.sin(this.stateTimer * 1.5 + k) * 0.15;
        const kLen = 50 + Math.abs(k) * 5;
        ctx.moveTo(4, legY);
        ctx.lineTo(4 + Math.cos(kAngle) * kLen, legY - 20 + Math.sin(kAngle) * kLen);
      }
      ctx.moveTo(-8, legY);
      ctx.lineTo(-10, 0);
    } else if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      const walkCycle = Math.sin(this.stateTimer * 0.4) * 22;
      ctx.moveTo(-8, legY);
      ctx.lineTo(-10 + walkCycle, 0);
      ctx.moveTo(8, legY);
      ctx.lineTo(10 - walkCycle, 0);
    } else if (this.isCrouching) {
      ctx.moveTo(-10, legY);
      ctx.lineTo(-24, 0);
      ctx.moveTo(10, legY);
      ctx.lineTo(18, 0);
    } else {
      ctx.moveTo(-8, legY);
      ctx.lineTo(-10, 0);
      ctx.moveTo(8, legY);
      ctx.lineTo(10, 0);
    }
    ctx.stroke();

    // White Laced Combat Boots with blue trim
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-16, -20, 14, 20);
    ctx.fillRect(4, -20, 14, 20);

    // Boot Laces
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let ly = -16; ly <= -6; ly += 4) {
      ctx.moveTo(-14, ly);
      ctx.lineTo(-4, ly);
      ctx.moveTo(6, ly);
      ctx.lineTo(16, ly);
    }
    ctx.stroke();

    // --- 2. QIPAO DRESS (Silk Blue with Gold Dragon Trim) ---
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-18, chestY, 36, bodyHeight);

    // Golden Dragon embroidery pattern on chest
    ctx.fillStyle = c.outfitTrim;
    ctx.beginPath();
    ctx.arc(0, chestY + 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.outfit;
    ctx.beginPath();
    ctx.arc(0, chestY + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // White Sash & Golden Waist Trim
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-20, legY - 14, 40, 12);
    ctx.fillStyle = c.outfitTrim;
    ctx.fillRect(-20, legY - 14, 40, 3);
    ctx.fillRect(-20, legY - 5, 40, 3);

    // Qipao Slits & Hem Flaps
    ctx.fillStyle = c.outfit;
    ctx.beginPath();
    ctx.moveTo(-18, legY - 2);
    ctx.lineTo(-24, legY + 22);
    ctx.lineTo(-10, legY + 22);
    ctx.closePath();
    ctx.fill();

    // Spiked Iron Bracelets
    ctx.fillStyle = '#212121';
    ctx.fillRect(-16, chestY + 18, 10, 10);
    ctx.fillRect(8, chestY + 18, 10, 10);
    // Silver spikes
    ctx.fillStyle = '#e0e0e0';
    [-14, -8, 10, 16].forEach(sx => {
      ctx.beginPath();
      ctx.moveTo(sx, chestY + 18);
      ctx.lineTo(sx + 2, chestY + 13);
      ctx.lineTo(sx + 4, chestY + 18);
      ctx.fill();
    });

    // --- 3. HEAD, OX-HORN BUNS & FLOWING RIBBONS ---
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // White Ox-horn Hair Buns
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-15, headY - 6, 9, 0, Math.PI * 2);
    ctx.arc(15, headY - 6, 9, 0, Math.PI * 2);
    ctx.fill();

    // Golden Ribbons trailing from buns with sine wave
    const ribbonWave = Math.sin(this.stateTimer * 0.25) * 6;
    ctx.fillStyle = c.outfitTrim;
    ctx.beginPath();
    ctx.moveTo(-18, headY - 4);
    ctx.lineTo(-30, headY + 12 + ribbonWave);
    ctx.lineTo(-26, headY + 16 + ribbonWave);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, headY - 4);
    ctx.lineTo(30, headY + 12 - ribbonWave);
    ctx.lineTo(26, headY + 16 - ribbonWave);
    ctx.closePath();
    ctx.fill();

    // Fringe Hair
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(0, headY - 2, headRadius + 1, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    if (this.state === 'KO' || this.state === 'HURT') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, headY - 1);
      ctx.lineTo(9, headY + 3);
      ctx.stroke();
    } else {
      ctx.fillRect(4, headY - 2, 4, 3);
      ctx.fillRect(3, headY - 5, 6, 2); // Eyelash
    }

    // --- 4. ARMS & KUNG-FU POSES ---
    ctx.strokeStyle = c.outfit;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (this.state === 'ATTACK_LIGHT' || this.state === 'SPECIAL_1') {
      ctx.moveTo(-8, chestY + 8);
      ctx.lineTo(36, chestY + 8);
    } else if (this.state === 'SUPER') {
      ctx.moveTo(-8, chestY + 8);
      ctx.lineTo(28, chestY + 14);
      ctx.moveTo(8, chestY + 8);
      ctx.lineTo(28, chestY + 4);
    } else {
      ctx.moveTo(-10, chestY + 8);
      ctx.lineTo(12, chestY + 18);
      ctx.moveTo(8, chestY + 8);
      ctx.lineTo(20, chestY + 14);
    }
    ctx.stroke();
  }
}
