import { Fighter, FighterColors } from '../Fighter';
import { PlayerInput } from '../../engine/Input';
import { ParticleManager } from '../../engine/Particles';
import { AudioManager } from '../../engine/Audio';
import { Projectile } from '../Projectile';
import { Rect, Physics } from '../../engine/Physics';

export class TerryFighter extends Fighter {
  constructor(id: 1 | 2, startX: number, facingRight: boolean, customColors?: Partial<FighterColors>) {
    const defaultColors: FighterColors = id === 1 ? {
      skin: '#ffcc80',
      hair: '#ffd54f', // Blonde
      outfit: '#d32f2f', // Red Vest & Cap
      outfitTrim: '#ffffff', // White Star
      belt: '#1976d2', // Blue Jeans
      effects: '#ff9100'
    } : {
      skin: '#ffe0b2',
      hair: '#795548',
      outfit: '#1a237e', // Blue Vest
      outfitTrim: '#ffd700',
      belt: '#212121',
      effects: '#00e5ff'
    };

    super(id, 'TERRY', startX, facingRight, { ...defaultColors, ...customColors });
    this.speed = 6.6;
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

    // Super (Buster Wolf - "Are you OK? BUSTER WOLF!!")
    if (hasSuper && isGrounded && !['HURT', 'KNOCKDOWN', 'KO', 'SUPER', 'GUARD_CRUSH'].includes(this.state)) {
      this.bufferedSuper = 0;
      this.consumeSuperMeter(100);
      this.changeState('SUPER');
      this.invincible = true;
      audio.playSuperActivate();
      particles.triggerSuperFreeze('#ff9100', 'BUSTER WOLF');
      particles.createHitSparks(this.x, this.y - 70, true, '#ffea00');
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'WALK_FWD':
      case 'WALK_BACK':
        this.isGuarding = input.guard;

        if (input.dpPressed || (input.up && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_3'); // Rising Tackle
          audio.playDragonPunch();
          return;
        }
        if (input.qcbPressed || (input.right && hasSpecial && this.facingRight) || (input.left && hasSpecial && !this.facingRight)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_2'); // Burn Knuckle
          audio.playWhoosh(400);
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1'); // Power Wave
          audio.playFireballLaunch();
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
          audio.playWhoosh(350);
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
          this.changeState('SPECIAL_1');
          audio.playFireballLaunch();
          return;
        }
        if (hasHeavy) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(220);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(350);
          return;
        }
        break;

      case 'JUMP':
        if (hasLight && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(350);
        } else if (hasHeavy && !this.activeHitbox && !this.hasHitInCurrentAttack) {
          this.bufferedHeavy = 0;
          this.changeState('ATTACK_HEAVY');
          audio.playWhoosh(240);
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
            opponent.takeDamage(45, false, 6, 0, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.hasHitInCurrentAttack && this.stateTimer >= 4) {
          if (hasSpecial) {
            this.bufferedSpecial = 0;
            this.changeState('SPECIAL_2');
            audio.playWhoosh(400);
            return;
          }
          if (hasHeavy) {
            this.bufferedHeavy = 0;
            this.changeState('ATTACK_HEAVY');
            audio.playWhoosh(240);
            return;
          }
        }

        if (this.stateTimer > 10) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'ATTACK_HEAVY':
        // Roundhouse Kick with Slash Arc
        if (this.stateTimer === 3) {
          particles.addSlashArc({
            x: this.x + (this.facingRight ? 25 : -25),
            y: this.y - 80,
            radius: 55,
            startAngle: -Math.PI * 0.45,
            endAngle: Math.PI * 0.3,
            color: '#ff9100',
            lineWidth: 8,
            facingRight: this.facingRight
          });
        }

        if (this.stateTimer >= 4 && this.stateTimer <= 11) {
          const hitWidth = 85;
          const hitHeight = 50;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 35 : this.y - 110;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(95, true, 10, -4, this, particles, audio);
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

        if (this.stateTimer > 16) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'SPECIAL_1':
        // Power Wave (파워 웨이브 - 지면 충격파)
        this.vx = 0;
        if (this.stateTimer === 8) {
          const spawnX = this.facingRight ? this.x + 40 : this.x - 40;
          projectiles.push(new Projectile(this.id, spawnX, Physics.GROUND_Y - 35, this.facingRight, 'powerwave', 90, 13));
          particles.createDust(spawnX, Physics.GROUND_Y, 6);
        }

        if (this.stateTimer > 20) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_2':
        // Burn Knuckle (번 너클 - 불꽃 돌진 펀치)
        if (this.stateTimer <= 10) {
          this.vx = this.facingRight ? 16 : -16;
          particles.createFireTrail(this.x + (this.facingRight ? 35 : -35), this.y - 75, '#ff9100');
          particles.createDust(this.x, Physics.GROUND_Y, 2);
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
            opponent.takeDamage(115, true, 11, -5, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 20) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_3':
        // Rising Tackle (라이징 태클)
        if (this.stateTimer === 1) {
          this.invincible = true;
          this.vx = this.facingRight ? 2 : -2;
          this.vy = -18;
        }

        if (this.stateTimer >= 2 && this.stateTimer <= 14) {
          const hitWidth = 75;
          const hitHeight = 95;
          const hitX = this.facingRight ? this.x - 20 : this.x - 55;
          const hitY = this.y - 130;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(120, true, 7, -11, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
          this.invincible = false;
        }

        if (this.y >= Physics.GROUND_Y && this.stateTimer > 16) {
          this.changeState('IDLE');
        }
        break;

      case 'SUPER':
        // Buster Wolf (버스터 울프)
        if (this.stateTimer <= 10) {
          this.invincible = true;
          this.vx = this.facingRight ? 18 : -18;
          particles.createFireTrail(this.x, this.y - 70, '#ffea00');
        } else if (this.stateTimer === 12) {
          this.vx = 0;
          this.invincible = false;
          audio.playBusterWolf();
          const blastX = this.facingRight ? this.x + 30 : this.x - 170;
          this.activeHitbox = { x: blastX, y: this.y - 130, width: 140, height: 110 };

          if (this.checkHit(opponent)) {
            opponent.takeDamage(160, true, 16, -9, this, particles, audio);
            particles.createHitSparks(blastX + 70, this.y - 75, true, '#ff5722');
          }
        } else if (this.stateTimer > 16) {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 44) {
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
        if (this.y >= Physics.GROUND_Y && this.stateTimer > 28) this.changeState('IDLE');
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
    const headRadius = 15;
    const bodyHeight = 56;
    const crouchOffset = this.isCrouching ? 35 : 0;
    const idleBounce = this.state === 'IDLE' ? Math.sin(this.stateTimer * 0.14) * 3 : 0;

    let headY = -this.height + headRadius + crouchOffset + idleBounce;
    let chestY = headY + headRadius + 5;
    let legY = chestY + bodyHeight;

    if (this.state === 'KNOCKDOWN' || this.state === 'KO') {
      ctx.rotate(-Math.PI / 2.5);
      headY += 40;
      chestY += 40;
      legY += 40;
    }

    if (this.state === 'SPECIAL_3') {
      ctx.rotate(Math.PI);
      headY = 20;
      chestY = headY + 20;
      legY = chestY + 30;
    }

    // --- 1. BLUE JEANS LEGS & SNEAKERS ---
    ctx.strokeStyle = '#1565c0'; // Denim Blue
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';

    ctx.beginPath();
    if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      const walkCycle = Math.sin(this.stateTimer * 0.35) * 22;
      ctx.moveTo(-11, legY);
      ctx.lineTo(-14 + walkCycle, 0);
      ctx.moveTo(11, legY);
      ctx.lineTo(14 - walkCycle, 0);
    } else if (this.isCrouching) {
      ctx.moveTo(-12, legY);
      ctx.lineTo(-26, 0);
      ctx.moveTo(12, legY);
      ctx.lineTo(20, 0);
    } else {
      ctx.moveTo(-12, legY);
      ctx.lineTo(-14, 0);
      ctx.moveTo(12, legY);
      ctx.lineTo(14, 0);
    }
    ctx.stroke();

    // Red High-top Sneakers with White Toe Cap
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-22, -12, 16, 12);
    ctx.fillRect(8, -12, 16, 12);

    ctx.fillStyle = '#ffffff'; // White rubber toe & sole
    ctx.fillRect(-22, -4, 16, 4);
    ctx.fillRect(8, -4, 16, 4);
    ctx.fillRect(-22, -12, 6, 8);
    ctx.fillRect(18, -12, 6, 8);

    // --- 2. WHITE TEE & RED LEATHER VEST ---
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-18, chestY, 36, bodyHeight);

    // Red Leather Vest (Open front)
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-20, chestY, 10, bodyHeight);
    ctx.fillRect(10, chestY, 10, bodyHeight);

    // White Star on back/vest
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, chestY + 22, 7, 0, Math.PI * 2);
    ctx.fill();

    // Leather Belt & Silver Buckle
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-20, legY - 12, 40, 10);
    ctx.fillStyle = '#e0e0e0'; // Silver Buckle
    ctx.fillRect(-4, legY - 14, 8, 14);

    // --- 3. HEAD, BLONDE HAIR, FLOWING PONYTAIL & TRUCKER CAP ---
    // Blonde Hair
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius + 1, 0, Math.PI * 2);
    ctx.fill();

    // Long Blonde Ponytail flowing behind with sine wave
    const tailWave = Math.sin(this.stateTimer * 0.25) * 6;
    ctx.beginPath();
    ctx.moveTo(-headRadius, headY - 2);
    ctx.lineTo(-headRadius - 26, headY + 16 + tailWave);
    ctx.lineTo(-headRadius - 18, headY + 24 + tailWave);
    ctx.closePath();
    ctx.fill();

    // Face
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(2, headY + 2, headRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Red Trucker Cap with white front plate ("FATAL FURY")
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-headRadius - 2, headY - 9, (headRadius + 2) * 2, 9);
    // Forward Visor
    ctx.fillRect(4, headY - 5, 16, 5);

    // White front emblem plate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, headY - 8, 14, 6);

    // Determined Eyes
    ctx.fillStyle = '#000000';
    if (this.state === 'KO' || this.state === 'HURT') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, headY - 1);
      ctx.lineTo(9, headY + 3);
      ctx.stroke();
    } else {
      ctx.fillRect(4, headY - 2, 4, 3);
    }

    // --- 4. ARMS & FINGERLESS GLOVES ---
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (this.state === 'SPECIAL_2' || this.state === 'SUPER') {
      ctx.moveTo(-10, chestY + 12);
      ctx.lineTo(42, chestY + 12);
    } else if (this.state === 'ATTACK_LIGHT') {
      ctx.moveTo(-10, chestY + 12);
      ctx.lineTo(34, chestY + 12);
    } else {
      ctx.moveTo(-10, chestY + 10);
      ctx.lineTo(12, chestY + 18);
      ctx.moveTo(10, chestY + 10);
      ctx.lineTo(22, chestY + 14);
    }
    ctx.stroke();

    // Brown Fingerless Gloves
    ctx.fillStyle = '#5d4037';
    if (this.state === 'SPECIAL_2' || this.state === 'SUPER') {
      ctx.beginPath();
      ctx.arc(42, chestY + 12, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(12, chestY + 18, 8, 0, Math.PI * 2);
      ctx.arc(22, chestY + 14, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
