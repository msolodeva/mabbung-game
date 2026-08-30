import { Fighter, FighterColors } from '../Fighter';
import { PlayerInput } from '../../engine/Input';
import { ParticleManager } from '../../engine/Particles';
import { AudioManager } from '../../engine/Audio';
import { Projectile } from '../Projectile';
import { Rect, Physics } from '../../engine/Physics';

export class BlazeFighter extends Fighter {
  constructor(id: 1 | 2, startX: number, facingRight: boolean, customColors?: Partial<FighterColors>) {
    const defaultColors: FighterColors = id === 1 ? {
      skin: '#ffcc80',
      hair: '#3e2723',
      outfit: '#f5f5f5', // White Gi
      outfitTrim: '#d32f2f', // Red Headband & Gloves
      belt: '#212121', // Black Belt
      effects: '#ff5722'
    } : {
      skin: '#ffe0b2',
      hair: '#b71c1c',
      outfit: '#212121', // Black Gi
      outfitTrim: '#ff9800', // Orange Trim
      belt: '#ffffff',
      effects: '#ff9800'
    };

    super(id, 'RYU', startX, facingRight, { ...defaultColors, ...customColors });
    this.speed = 6.4;
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

    // Super: Shinku Hadouken (진공 파동권)
    if (hasSuper && isGrounded && !['HURT', 'KNOCKDOWN', 'KO', 'SUPER', 'GUARD_CRUSH'].includes(this.state)) {
      this.bufferedSuper = 0;
      this.consumeSuperMeter(100);
      this.changeState('SUPER');
      this.invincible = true;
      audio.playSuperActivate();
      particles.triggerSuperFreeze('#ff5722', 'SHINKU HADOUKEN');
      particles.createHitSparks(this.x, this.y - 70, true, '#ffeb3b');
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'WALK_FWD':
      case 'WALK_BACK':
        this.isGuarding = input.guard;

        if (input.dpPressed || (input.up && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_2'); // Shoryuken
          audio.playDragonPunch();
          return;
        }
        if (input.qcbPressed || (input.down && hasSpecial)) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_3'); // Tatsumaki
          audio.playTatsumaki();
          return;
        }
        if (hasSpecial) {
          this.bufferedSpecial = 0;
          this.changeState('SPECIAL_1'); // Hadouken
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

        // Jump & Crouch
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

        // Movement
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
          audio.playWhoosh(200);
          return;
        }
        if (hasLight) {
          this.bufferedLight = 0;
          this.changeState('ATTACK_LIGHT');
          audio.playWhoosh(330);
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
        // Straight Jab
        if (this.stateTimer >= 2 && this.stateTimer <= 7) {
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
        }

        if (this.stateTimer > 10) {
          this.changeState(this.isAirborne ? 'JUMP' : (this.isCrouching ? 'CROUCH' : 'IDLE'));
        }
        break;

      case 'ATTACK_HEAVY':
        // Roundhouse Kick with Slash Arc
        if (this.stateTimer === 4) {
          particles.addSlashArc({
            x: this.x + (this.facingRight ? 30 : -30),
            y: this.y - 80,
            radius: 50,
            startAngle: -Math.PI * 0.4,
            endAngle: Math.PI * 0.3,
            color: '#ff9800',
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
        // Hadouken (파동권)
        this.vx = 0;
        if (this.stateTimer === 8) {
          const spawnX = this.facingRight ? this.x + 45 : this.x - 45;
          const spawnY = this.y - 75;
          projectiles.push(new Projectile(this.id, spawnX, spawnY, this.facingRight, 'fireball', 90, 12));
          particles.createFireTrail(spawnX, spawnY, '#ff5722');
        }

        if (this.stateTimer > 20) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL_2':
        // Shoryuken (승룡권)
        if (this.stateTimer === 1) {
          this.invincible = true;
          this.vx = this.facingRight ? 5 : -5;
          this.vy = -18;
        }

        if (this.stateTimer >= 2 && this.stateTimer <= 14) {
          particles.createFireTrail(this.x, this.y - 70, '#ff3d00');
          particles.createDust(this.x, Physics.GROUND_Y, 2);

          const hitWidth = 70;
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
        // Tatsumaki Senpukyaku (용권선풍각)
        this.vy = -3;
        this.vx = this.facingRight ? 8 : -8;
        particles.createDust(this.x, Physics.GROUND_Y, 2);

        if (this.stateTimer >= 4 && this.stateTimer <= 22 && this.stateTimer % 6 === 0) {
          const hitWidth = 95;
          const hitHeight = 55;
          const hitX = this.facingRight ? this.x - 20 : this.x - 75;
          const hitY = this.y - 85;
          this.activeHitbox = { x: hitX, y: hitY, width: hitWidth, height: hitHeight };

          if (this.checkHit(opponent)) {
            opponent.takeDamage(32, false, 6, -2, this, particles, audio);
          }
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer > 24) {
          this.changeState('IDLE');
        }
        break;

      case 'SUPER':
        // Shinku Hadouken (진공파동권)
        this.vx = 0;
        if (this.stateTimer <= 15) {
          this.invincible = true;
          particles.createFireTrail(this.x, this.y - 50, '#ffea00');
        } else {
          this.invincible = false;
        }

        if (this.stateTimer === 14) {
          const spawnX = this.facingRight ? this.x + 50 : this.x - 50;
          projectiles.push(new Projectile(this.id, spawnX, this.y - 75, this.facingRight, 'fireball', 90, 16));
          audio.playFireballLaunch();
        }
        if (this.stateTimer === 22) {
          const spawnX = this.facingRight ? this.x + 50 : this.x - 50;
          projectiles.push(new Projectile(this.id, spawnX, this.y - 60, this.facingRight, 'fireball', 90, 16));
          audio.playFireballLaunch();
        }
        if (this.stateTimer === 30) {
          const spawnX = this.facingRight ? this.x + 50 : this.x - 50;
          projectiles.push(new Projectile(this.id, spawnX, this.y - 90, this.facingRight, 'fireball', 120, 18));
          audio.playFireballLaunch();
        }

        if (this.stateTimer > 42) {
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

    // Rhythmic breathing bounce in Idle
    const idleBounce = this.state === 'IDLE' ? Math.sin(this.stateTimer * 0.12) * 3 : 0;

    let headY = -this.height + headRadius + crouchOffset + idleBounce;
    let chestY = headY + headRadius + 4;
    let legY = chestY + bodyHeight;

    if (this.state === 'KNOCKDOWN' || this.state === 'KO') {
      ctx.rotate(-Math.PI / 2.5);
      headY += 40;
      chestY += 40;
      legY += 40;
    }

    if (this.state === 'SPECIAL_3') {
      const rot = (this.stateTimer * 0.85) % (Math.PI * 2);
      ctx.rotate(rot);
    }

    // --- 1. LEGS (Muscular Gi Trousers with cloth folds) ---
    ctx.strokeStyle = c.outfit;
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
    } else if (this.isAirborne) {
      ctx.moveTo(-10, legY);
      ctx.lineTo(-18, -16);
      ctx.moveTo(10, legY);
      ctx.lineTo(22, -10);
    } else {
      ctx.moveTo(-12, legY);
      ctx.lineTo(-16, 0);
      ctx.moveTo(12, legY);
      ctx.lineTo(16, 0);
    }
    ctx.stroke();

    // Gi Leg Shadow Creases
    ctx.strokeStyle = '#d6d6d6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, legY + 12);
    ctx.lineTo(-16, legY + 30);
    ctx.moveTo(12, legY + 12);
    ctx.lineTo(16, legY + 30);
    ctx.stroke();

    // Feet & Ankle Wraps
    ctx.fillStyle = c.skin;
    ctx.fillRect(-22, -6, 14, 6);
    ctx.fillRect(12, -6, 14, 6);

    // --- 2. TORSO (Muscular Chest & Torn Gi Top) ---
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-20, chestY, 40, bodyHeight);

    // Muscular V-neck & Pectorals
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.moveTo(-10, chestY);
    ctx.lineTo(10, chestY);
    ctx.lineTo(0, chestY + 28);
    ctx.closePath();
    ctx.fill();

    // Chest Muscle Lines
    ctx.strokeStyle = 'rgba(180, 100, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, chestY + 16);
    ctx.lineTo(6, chestY + 16);
    ctx.stroke();

    // Torn Sleeves frills on shoulders
    ctx.fillStyle = c.outfit;
    ctx.fillRect(-24, chestY - 2, 8, 12);
    ctx.fillRect(16, chestY - 2, 8, 12);

    // Black Karate Belt & Hanging Tails
    ctx.fillStyle = c.belt;
    ctx.fillRect(-22, legY - 14, 44, 12);

    // Flowing Belt Tails with physics wave
    const beltWave = Math.sin(this.stateTimer * 0.2) * 5;
    ctx.beginPath();
    ctx.moveTo(-5, legY - 2);
    ctx.lineTo(-7 + beltWave, legY + 24);
    ctx.lineTo(-1 + beltWave, legY + 24);
    ctx.lineTo(1, legY - 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(3, legY - 2);
    ctx.lineTo(5 - beltWave, legY + 20);
    ctx.lineTo(9 - beltWave, legY + 20);
    ctx.lineTo(7, legY - 2);
    ctx.fill();

    // --- 3. HEAD, SPIKY HAIR & FLUTTERING RED HEADBAND ---
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Spiky Hair
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(0, headY - 3, headRadius + 1, Math.PI, Math.PI * 2);
    ctx.fill();
    // Spikes
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 3, headY - 12);
      ctx.lineTo(i * 5, headY - 22);
      ctx.lineTo(i * 5 + 3, headY - 12);
      ctx.fill();
    }

    // Red Headband
    ctx.fillStyle = c.outfitTrim;
    ctx.fillRect(-headRadius - 2, headY - 7, (headRadius + 2) * 2, 7);

    // Fluttering Headband Tails (Dual tails with sine wave)
    const tail1 = Math.sin(this.stateTimer * 0.25) * 8;
    const tail2 = Math.sin(this.stateTimer * 0.25 + 0.6) * 8;
    ctx.beginPath();
    ctx.moveTo(-headRadius - 2, headY - 5);
    ctx.lineTo(-headRadius - 28, headY - 12 + tail1);
    ctx.lineTo(-headRadius - 24, headY - 2 + tail1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-headRadius - 2, headY - 3);
    ctx.lineTo(-headRadius - 24, headY + 6 + tail2);
    ctx.lineTo(-headRadius - 20, headY + 14 + tail2);
    ctx.closePath();
    ctx.fill();

    // Determined Eyes & Eyebrows
    ctx.fillStyle = '#000000';
    if (this.state === 'KO' || this.state === 'HURT') {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(3, headY - 1);
      ctx.lineTo(10, headY + 3);
      ctx.moveTo(10, headY - 1);
      ctx.lineTo(3, headY + 3);
      ctx.stroke();
    } else {
      ctx.fillRect(4, headY - 3, 5, 3);
      ctx.fillRect(3, headY - 6, 7, 2); // Stern eyebrow
    }

    // --- 4. ARMS, GLOVES & COMBAT POSES ---
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (this.state === 'ATTACK_LIGHT') {
      // Straight Punch
      ctx.moveTo(-12, chestY + 12);
      ctx.lineTo(38, chestY + 12);
    } else if (this.state === 'ATTACK_HEAVY') {
      // High Roundhouse pose
      ctx.moveTo(-14, chestY + 10);
      ctx.lineTo(-26, chestY + 28);
    } else if (this.state === 'SPECIAL_1' || this.state === 'SUPER') {
      // Hadouken thrust
      ctx.moveTo(-12, chestY + 14);
      ctx.lineTo(34, chestY + 14);
      ctx.moveTo(8, chestY + 14);
      ctx.lineTo(34, chestY + 8);
    } else if (this.state === 'SPECIAL_2') {
      // Shoryuken upward reach
      ctx.moveTo(6, chestY + 10);
      ctx.lineTo(14, headY - 36);
    } else if (this.state === 'BLOCK') {
      ctx.moveTo(0, chestY + 10);
      ctx.lineTo(18, headY);
    } else if (this.state === 'VICTORY') {
      ctx.moveTo(6, chestY + 10);
      ctx.lineTo(16, headY - 36);
    } else {
      // Idle fight stance
      ctx.moveTo(-12, chestY + 10);
      ctx.lineTo(10, chestY + 18);
      ctx.moveTo(10, chestY + 10);
      ctx.lineTo(24, chestY + 14);
    }
    ctx.stroke();

    // Red Fighting Gloves (with white wrist wraps)
    ctx.fillStyle = '#ffffff'; // Wrist tape
    if (this.state === 'ATTACK_LIGHT' || this.state === 'SPECIAL_1' || this.state === 'SUPER') {
      ctx.fillRect(26, chestY + 6, 6, 14);
      ctx.fillStyle = c.outfitTrim; // Red Glove
      ctx.beginPath();
      ctx.arc(38, chestY + 12, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === 'SPECIAL_2' || this.state === 'VICTORY') {
      ctx.fillRect(8, headY - 26, 12, 6);
      ctx.fillStyle = c.outfitTrim;
      ctx.beginPath();
      ctx.arc(14, headY - 36, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = c.outfitTrim;
      ctx.beginPath();
      ctx.arc(10, chestY + 18, 8, 0, Math.PI * 2);
      ctx.arc(24, chestY + 14, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
