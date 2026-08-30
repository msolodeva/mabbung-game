import { Fighter, FighterColors } from '../Fighter';
import { PlayerInput } from '../../engine/Input';
import { ParticleManager } from '../../engine/Particles';
import { AudioManager } from '../../engine/Audio';
import { Projectile } from '../Projectile';
import { Rect, Physics } from '../../engine/Physics';

export class IoriFighter extends Fighter {
  private aoibanaStep = 0;

  constructor(id: 1 | 2, startX: number, facingRight: boolean, customColors?: Partial<FighterColors>) {
    const defaultColors: FighterColors = id === 1 ? {
      skin: '#e8eaf6',
      hair: '#d50000', // Crimson Red
      outfit: '#ffffff', // Long White Shirt
      outfitTrim: '#212121', // Black Jacket
      belt: '#d50000', // Red Strap
      effects: '#d500f9' // Purple Flames
    } : {
      skin: '#e8eaf6',
      hair: '#651fff',
      outfit: '#212121',
      outfitTrim: '#311b92',
      belt: '#e040fb',
      effects: '#e040fb'
    };

    super(id, 'IORI', startX, facingRight, { ...defaultColors, ...customColors });
    this.speed = 7.0;
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

    // Super: Kin 1211 Shiki Yaotome (금 천이백십일식 팔치녀)
    if (hasSuper && isGrounded && !['HURT', 'KNOCKDOWN', 'KO', 'SUPER', 'GUARD_CRUSH'].includes(this.state)) {
      this.bufferedSuper = 0;
      this.consumeSuperMeter(100);
      this.changeState('SUPER');
      this.invincible = true;
      audio.playSuperActivate();
      particles.triggerSuperFreeze('#d500f9', 'YAOTOME');
      particles.createHitSparks(this.x, this.y - 70, true, '#d500f9');
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'WALK_FWD':
      case 'WALK_BACK':
        this.isGuarding = input.guard;

        if (input.dpPressed || (input.up && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_2'); // Oniyaki
          audio.playDragonPunch();
          return;
        }
        if (input.qcbPressed || (input.down && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.aoibanaStep = 1;
          this.changeState('SPECIAL_3'); // Aoibana 1
          audio.playHitHeavy();
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1'); // Yamibarai
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
        // Claw Swipe
        if (this.stateTimer >= 2 && this.stateTimer <= 6) {
          const hitWidth = 65;
          const hitHeight = 35;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.isCrouching ? this.y - 45 : this.y - 100;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(45, false, 5, 0, this, particles, audio);
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
            audio.playWhoosh(240);
            return;
          }
        }

        if (this.stateTimer > 9) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'ATTACK_HEAVY':
        // Overhead Talon Slash with Purple Slash Arc
        if (this.stateTimer === 3) {
          particles.addSlashArc({
            x: this.x + (this.facingRight ? 25 : -25),
            y: this.y - 80,
            radius: 55,
            startAngle: -Math.PI * 0.45,
            endAngle: Math.PI * 0.3,
            color: '#d500f9',
            lineWidth: 8,
            facingRight: this.facingRight
          });
        }

        if (this.stateTimer >= 4 && this.stateTimer <= 11) {
          const hitWidth = 85;
          const hitHeight = 55;
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
        // Yamibarai (백팔식 어둠쫓기 - 지면 보라색 화염)
        this.vx = 0;
        if (this.stateTimer === 8) {
          const spawnX = this.facingRight ? this.x + 40 : this.x - 40;
          projectiles.push(new Projectile(this.id, spawnX, Physics.GROUND_Y - 30, this.facingRight, 'yamibarai', 90, 13));
          particles.createFireTrail(spawnX, Physics.GROUND_Y - 20, '#d500f9');
        }

        if (this.stateTimer > 20) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_2':
        // Oniyaki (백식 귀신태우기 - 보라색 승룡 화염)
        if (this.stateTimer === 1) {
          this.invincible = true;
          this.vx = this.facingRight ? 5 : -5;
          this.vy = -18;
        }

        if (this.stateTimer >= 2 && this.stateTimer <= 14) {
          particles.createFireTrail(this.x, this.y - 70, '#d500f9');
          const hitWidth = 75;
          const hitHeight = 95;
          const hitX = this.facingRight ? this.x : this.x - hitWidth;
          const hitY = this.y - 130;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(125, true, 8, -12, this, particles, audio);
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
        // Aoibana (백이십칠식 규화 - 3연속 돌진격)
        if (this.stateTimer <= 6) {
          this.vx = this.facingRight ? 12 : -12;
        } else {
          this.vx = 0;
        }

        if (this.stateTimer === 3) {
          particles.addSlashArc({
            x: this.x + (this.facingRight ? 30 : -30),
            y: this.y - 85,
            radius: 50,
            startAngle: -Math.PI * 0.3,
            endAngle: Math.PI * 0.4,
            color: '#d500f9',
            lineWidth: 8,
            facingRight: this.facingRight
          });
        }

        if (this.stateTimer >= 3 && this.stateTimer <= 8) {
          const hitWidth = 85;
          const hitHeight = 55;
          const hitX = this.facingRight ? this.x + 10 : this.x - 10 - hitWidth;
          const hitY = this.y - 95;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (!this.hasHitInCurrentAttack && this.checkHit(opponent)) {
            this.hasHitInCurrentAttack = true;
            opponent.takeDamage(45, false, 7, -2, this, particles, audio);
            particles.createHitSparks(this.x + (this.facingRight ? 40 : -40), this.y - 70, false, '#d500f9');
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.hasHitInCurrentAttack && hasSpecial && this.aoibanaStep < 3 && this.stateTimer >= 6) {
          this.aoibanaStep++;
          this.stateTimer = 0;
          this.hasHitInCurrentAttack = false;
          audio.playHitHeavy();
        }

        if (this.stateTimer > 15) {
          this.changeState('IDLE');
        }
        break;

      case 'SUPER':
        // Yaotome (팔치녀 - 8연타 난무 후 폭발)
        if (this.stateTimer <= 10) {
          this.invincible = true;
          this.vx = this.facingRight ? 20 : -20;
          particles.createFireTrail(this.x, this.y - 60, '#d500f9');
        }

        if (this.stateTimer >= 12 && this.stateTimer <= 36 && this.stateTimer % 4 === 0) {
          const hitWidth = 90;
          const hitHeight = 90;
          this.activeHitbox = { x: opponent.x - 45, y: opponent.y - 90, width: hitWidth, height: hitHeight };
          opponent.takeDamage(18, false, 2, 0, this, particles, audio);
          particles.createHitSparks(opponent.x, opponent.y - 60, false, '#d500f9');
        }

        if (this.stateTimer === 38) {
          audio.playBusterWolf();
          opponent.takeDamage(70, true, this.facingRight ? 12 : -12, -8, this, particles, audio);
          particles.createHitSparks(opponent.x, opponent.y - 80, true, '#d500f9');
        }

        if (this.stateTimer > 46) {
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
    const headRadius = 14;
    const bodyHeight = 55;
    const crouchOffset = this.isCrouching ? 35 : 0;
    const idleBounce = this.state === 'IDLE' ? Math.sin(this.stateTimer * 0.12) * 2.5 : 0;

    let headY = -this.height + headRadius + crouchOffset + idleBounce;
    let chestY = headY + headRadius + 5;
    let legY = chestY + bodyHeight;

    if (this.state === 'KNOCKDOWN' || this.state === 'KO') {
      ctx.rotate(-Math.PI / 2.5);
      headY += 40;
      chestY += 40;
      legY += 40;
    }

    // --- 1. BLACK TROUSERS & BONDAGE RED STRAP BETWEEN KNEES ---
    ctx.strokeStyle = '#1a1a1a'; // Deep Black
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    ctx.beginPath();
    if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      const walkCycle = Math.sin(this.stateTimer * 0.35) * 20;
      ctx.moveTo(-10, legY);
      ctx.lineTo(-12 + walkCycle, 0);
      ctx.moveTo(10, legY);
      ctx.lineTo(12 - walkCycle, 0);
    } else if (this.isCrouching) {
      ctx.moveTo(-12, legY);
      ctx.lineTo(-24, 0);
      ctx.moveTo(12, legY);
      ctx.lineTo(18, 0);
    } else {
      ctx.moveTo(-11, legY);
      ctx.lineTo(-13, 0);
      ctx.moveTo(11, legY);
      ctx.lineTo(13, 0);
    }
    ctx.stroke();

    // Red Leather Bondage Strap linking knees
    ctx.strokeStyle = '#d50000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, legY + 22);
    ctx.lineTo(10, legY + 22);
    ctx.stroke();

    // Shiny Black Shoes
    ctx.fillStyle = '#000000';
    ctx.fillRect(-20, -8, 14, 8);
    ctx.fillRect(6, -8, 14, 8);

    // --- 2. WHITE LONG SHIRT & SHORT BLACK JACKET WITH CRESCENT MOON ---
    ctx.fillStyle = '#ffffff'; // Long white tail shirt
    ctx.fillRect(-16, chestY, 32, bodyHeight);

    // Flowing Shirt Tails below waist
    const shirtWave = Math.sin(this.stateTimer * 0.2) * 5;
    ctx.beginPath();
    ctx.moveTo(-16, legY);
    ctx.lineTo(-20 + shirtWave, legY + 22);
    ctx.lineTo(16 + shirtWave, legY + 22);
    ctx.lineTo(16, legY);
    ctx.closePath();
    ctx.fill();

    // Black Tailcoat Jacket
    ctx.fillStyle = '#212121';
    ctx.fillRect(-18, chestY, 36, 26);

    // White Crescent Moon on Back
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, chestY + 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(-2.5, chestY + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    // --- 3. HEAD & LONG SWEEPING CRIMSON BANGS ---
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Crimson Hair
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(0, headY - 2, headRadius + 1, Math.PI, Math.PI * 2);
    ctx.fill();

    // Long Sweeping Bangs covering front of face with wave
    const hairWave = Math.sin(this.stateTimer * 0.2) * 4;
    ctx.beginPath();
    ctx.moveTo(-headRadius, headY - 6);
    ctx.lineTo(14, headY + 16 + hairWave);
    ctx.lineTo(-2, headY + 22 + hairWave);
    ctx.closePath();
    ctx.fill();

    // Sharp Crimson Eye peeking through bangs
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(3, headY - 2, 4, 3);

    // --- 4. CLAW ARMS & PURPLE FLAME HOVER ---
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (this.state === 'ATTACK_LIGHT' || this.state === 'SPECIAL_3') {
      ctx.moveTo(-10, chestY + 10);
      ctx.lineTo(36, chestY + 10);
    } else {
      ctx.moveTo(-10, chestY + 8);
      ctx.lineTo(8, chestY + 20);
      ctx.moveTo(10, chestY + 8);
      ctx.lineTo(22, chestY + 16);
    }
    ctx.stroke();

    // Claw Hands with Purple Flame aura
    ctx.fillStyle = c.skin;
    ctx.fillRect(34, chestY + 6, 8, 8);

    // Purple flame aura sparks hovering around claws
    ctx.fillStyle = '#d500f9';
    ctx.beginPath();
    const fx = Math.sin(this.stateTimer * 0.4) * 4;
    ctx.arc(22 + fx, chestY + 16, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
