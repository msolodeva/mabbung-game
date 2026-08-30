import { Fighter } from '../entities/Fighter';
import { PlayerInput } from '../engine/Input';
import { Projectile } from '../entities/Projectile';

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export class FighterAI {
  private fighter: Fighter;
  private difficulty: AIDifficulty;
  private thinkTimer = 0;
  private actionCooldown = 0;
  private currentAction: 'IDLE' | 'APPROACH' | 'RETREAT' | 'ATTACK_LIGHT' | 'ATTACK_HEAVY' | 'SPECIAL' | 'SUPER' | 'GUARD' | 'JUMP' = 'IDLE';
  private actionDuration = 0;

  constructor(fighter: Fighter, difficulty: AIDifficulty = 'NORMAL') {
    this.fighter = fighter;
    this.difficulty = difficulty;
  }

  public setDifficulty(diff: AIDifficulty): void {
    this.difficulty = diff;
  }

  public getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  public update(opponent: Fighter, projectiles: Projectile[]): PlayerInput {
    this.thinkTimer++;
    if (this.actionCooldown > 0) {
      this.actionCooldown--;
    }

    const distance = Math.abs(this.fighter.x - opponent.x);
    const facingRight = this.fighter.facingRight;
    const opponentIsAttacking = opponent.state.startsWith('ATTACK') || opponent.state.startsWith('SPECIAL') || opponent.state === 'SUPER';
    const hasIncomingProjectile = projectiles.some(
      p => p.isActive && p.ownerId !== this.fighter.id && Math.abs(p.x - this.fighter.x) < 280
    );

    // If currently performing a committed action, tick it down
    if (this.thinkTimer >= this.actionDuration) {
      this.thinkTimer = 0;

      // 1. Reactive defense against projectiles & super attacks
      if (hasIncomingProjectile || opponent.state === 'SUPER') {
        const guardChance = this.difficulty === 'EASY' ? 0.2 : this.difficulty === 'NORMAL' ? 0.65 : 0.9;
        if (Math.random() < guardChance) {
          this.currentAction = Math.random() < 0.5 ? 'JUMP' : 'GUARD';
          this.actionDuration = 20;
          return this.createInput(facingRight);
        }
      }

      // 2. Anti-Air against airborne opponent
      if (opponent.isAirborne && distance < 160 && this.difficulty !== 'EASY') {
        const antiAirChance = this.difficulty === 'NORMAL' ? 0.45 : 0.85;
        if (Math.random() < antiAirChance && this.actionCooldown <= 0) {
          this.currentAction = 'SPECIAL';
          this.actionDuration = 8;
          this.actionCooldown = 30;
          return this.createInput(facingRight);
        }
      }

      // 3. Close Range (< 130px)
      if (distance < 130) {
        if (this.actionCooldown > 0) {
          // In cooldown: back off or idle
          this.currentAction = Math.random() < 0.6 ? 'RETREAT' : 'IDLE';
          this.actionDuration = this.difficulty === 'EASY' ? 30 : 15;
        } else {
          // Ready to attack
          if (opponentIsAttacking && Math.random() < (this.difficulty === 'EASY' ? 0.15 : this.difficulty === 'NORMAL' ? 0.55 : 0.85)) {
            this.currentAction = 'GUARD';
            this.actionDuration = 18;
          } else {
            // Decide attack
            if (this.fighter.superMeter >= 100 && Math.random() < (this.difficulty === 'EASY' ? 0.2 : 0.65)) {
              this.currentAction = 'SUPER';
              this.actionDuration = 10;
              this.actionCooldown = 40;
            } else {
              const roll = Math.random();
              if (roll < 0.45) {
                this.currentAction = 'ATTACK_LIGHT';
              } else if (roll < 0.8) {
                this.currentAction = 'ATTACK_HEAVY';
              } else {
                this.currentAction = 'SPECIAL';
              }
              this.actionDuration = 6;
              // Add rest period after attack based on difficulty
              this.actionCooldown = this.difficulty === 'EASY' ? 50 : this.difficulty === 'NORMAL' ? 26 : 14;
            }
          }
        }
      }
      // 4. Mid Range (130px ~ 360px)
      else if (distance < 360) {
        if (this.actionCooldown > 0) {
          this.currentAction = Math.random() < 0.5 ? 'APPROACH' : 'IDLE';
          this.actionDuration = 20;
        } else {
          const roll = Math.random();
          if (roll < (this.difficulty === 'EASY' ? 0.55 : 0.4)) {
            this.currentAction = 'APPROACH';
            this.actionDuration = 25;
          } else if (roll < (this.difficulty === 'EASY' ? 0.75 : 0.75)) {
            this.currentAction = 'SPECIAL';
            this.actionDuration = 8;
            this.actionCooldown = this.difficulty === 'EASY' ? 45 : 25;
          } else {
            this.currentAction = 'IDLE';
            this.actionDuration = 20;
          }
        }
      }
      // 5. Far Range (> 360px)
      else {
        const roll = Math.random();
        if (roll < 0.65) {
          this.currentAction = 'APPROACH';
          this.actionDuration = 35;
        } else if (roll < 0.9) {
          this.currentAction = 'SPECIAL';
          this.actionDuration = 8;
          this.actionCooldown = this.difficulty === 'EASY' ? 40 : 20;
        } else {
          this.currentAction = 'IDLE';
          this.actionDuration = 20;
        }
      }
    }

    return this.createInput(facingRight);
  }

  private createInput(facingRight: boolean): PlayerInput {
    const input: PlayerInput = {
      left: false,
      right: false,
      up: false,
      down: false,
      lightAttack: false,
      heavyAttack: false,
      special: false,
      superAttack: false,
      guard: false,
      lightAttackPressed: false,
      heavyAttackPressed: false,
      specialPressed: false,
      superAttackPressed: false,
      upPressed: false,
      downPressed: false,
      leftPressed: false,
      rightPressed: false,
      guardPressed: false,
      qcfPressed: false,
      dpPressed: false,
      qcbPressed: false
    };

    switch (this.currentAction) {
      case 'APPROACH':
        if (facingRight) input.right = true;
        else input.left = true;
        break;

      case 'RETREAT':
        if (facingRight) input.left = true;
        else input.right = true;
        break;

      case 'GUARD':
        input.guard = true;
        input.guardPressed = this.thinkTimer === 1;
        if (facingRight) input.left = true;
        else input.right = true;
        break;

      case 'JUMP':
        input.up = true;
        input.upPressed = this.thinkTimer === 1;
        if (Math.random() < 0.5) {
          if (facingRight) input.right = true;
          else input.left = true;
        }
        break;

      case 'ATTACK_LIGHT':
        input.lightAttack = true;
        input.lightAttackPressed = this.thinkTimer === 1;
        break;

      case 'ATTACK_HEAVY':
        input.heavyAttack = true;
        input.heavyAttackPressed = this.thinkTimer === 1;
        break;

      case 'SPECIAL':
        input.special = true;
        input.specialPressed = this.thinkTimer === 1;
        if (Math.random() < 0.4) {
          input.up = true; // Up + Special = Dragon Punch
        }
        break;

      case 'SUPER':
        input.superAttack = true;
        input.superAttackPressed = this.thinkTimer === 1;
        break;

      case 'IDLE':
      default:
        break;
    }

    return input;
  }
}
