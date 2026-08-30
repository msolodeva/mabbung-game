import { InputManager } from './Input';
import { AudioManager } from './Audio';
import { ParticleManager } from './Particles';
import { Camera } from './Camera';
import { Physics } from './Physics';
import { HUD } from '../ui/HUD';
import { MenuManager, GameMode, CharacterType, StageType, CHARACTERS, STAGES } from '../ui/Menu';
import { Fighter } from '../entities/Fighter';
import { BlazeFighter } from '../entities/characters/BlazeFighter';
import { ChunLiFighter } from '../entities/characters/ChunLiFighter';
import { TerryFighter } from '../entities/characters/TerryFighter';
import { IoriFighter } from '../entities/characters/IoriFighter';
import { IronTitan } from '../entities/characters/IronTitan';
import { ShadowNinja } from '../entities/characters/ShadowNinja';
import { Projectile } from '../entities/Projectile';
import { FighterAI, AIDifficulty } from '../ai/FighterAI';

export type SceneState = 'TITLE' | 'SELECT' | 'FIGHT_INTRO' | 'FIGHTING' | 'ROUND_END' | 'MATCH_END';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public input = new InputManager();
  public audio = new AudioManager();
  public particles = new ParticleManager();
  public camera = new Camera();
  public hud = new HUD();
  public menu = new MenuManager();

  public scene: SceneState = 'TITLE';
  public gameMode: GameMode = 'PVP';

  public p1!: Fighter;
  public p2!: Fighter;
  public ai: FighterAI | null = null;
  public projectiles: Projectile[] = [];

  public currentRound = 1;
  public roundTimer = 99;
  public roundTimerFrames = 0;
  public stateTimer = 0;
  public matchWinner: 1 | 2 | null = null;

  public debugHitboxes = false;
  public infiniteHpInTraining = false;

  private isRunning = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.initFighters('RYU', 'TERRY');

    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') this.audio.toggleMusic();
      if (e.key === 'n' || e.key === 'N') this.audio.toggleSound();
      if (e.key === 'g' || e.key === 'G') this.menu.showGuide = !this.menu.showGuide;
      if (e.key === 'F2' || e.key === 'h' || e.key === 'H') this.debugHitboxes = !this.debugHitboxes;
      if (e.key === 't' || e.key === 'T') {
        this.menu.selectedStageIndex = (this.menu.selectedStageIndex + 1) % STAGES.length;
      }
      if (e.key === 'Escape') {
        if (this.menu.showGuide) {
          this.menu.showGuide = false;
        } else if (this.scene === 'FIGHTING' || this.scene === 'FIGHT_INTRO') {
          this.menu.isPaused = !this.menu.isPaused;
        } else if (this.scene === 'SELECT') {
          this.scene = 'TITLE';
        }
      }
    });
  }

  public initFighters(p1Type: CharacterType, p2Type: CharacterType): void {
    const p1StartX = 500;
    const p2StartX = 1100;

    this.p1 = this.createFighter(p1Type, 1, p1StartX, true);
    this.p2 = this.createFighter(p2Type, 2, p2StartX, false);

    if (this.gameMode === 'CPU') {
      const diffs: AIDifficulty[] = ['EASY', 'NORMAL', 'HARD'];
      this.ai = new FighterAI(this.p2, diffs[this.menu.cpuDifficultyIndex]);
    } else {
      this.ai = null;
    }
  }

  private createFighter(type: CharacterType, id: 1 | 2, x: number, facingRight: boolean): Fighter {
    switch (type) {
      case 'RYU':
        return new BlazeFighter(id, x, facingRight);
      case 'CHUN_LI':
        return new ChunLiFighter(id, x, facingRight);
      case 'TERRY':
        return new TerryFighter(id, x, facingRight);
      case 'IORI':
        return new IoriFighter(id, x, facingRight);
      case 'GUILE':
        return new IronTitan(id, x, facingRight);
      case 'MAI':
      default:
        return new ShadowNinja(id, x, facingRight);
    }
  }

  public start(): void {
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    this.input.update();

    if (this.menu.isPaused) {
      this.updatePaused();
    } else {
      this.update();
    }

    this.render();

    this.input.endFrame();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private updatePaused(): void {
    const p1In = this.input.getPlayerInput(1, true);
    const p2In = this.input.getPlayerInput(2, false);

    const pauseOptionsCount = 4;

    if (p1In.upPressed || p2In.upPressed) {
      this.menu.pauseSelectedIndex = (this.menu.pauseSelectedIndex - 1 + pauseOptionsCount) % pauseOptionsCount;
      this.audio.playWhoosh(400);
    }
    if (p1In.downPressed || p2In.downPressed) {
      this.menu.pauseSelectedIndex = (this.menu.pauseSelectedIndex + 1) % pauseOptionsCount;
      this.audio.playWhoosh(350);
    }

    if (p1In.lightAttackPressed || p2In.lightAttackPressed || p1In.guardPressed || p2In.guardPressed) {
      this.audio.playHitHeavy();
      switch (this.menu.pauseSelectedIndex) {
        case 0: // Resume
          this.menu.isPaused = false;
          break;
        case 1: // Restart Round
          this.menu.isPaused = false;
          this.startRound();
          break;
        case 2: // Character Select
          this.menu.isPaused = false;
          this.menu.p1Confirmed = false;
          this.menu.p2Confirmed = false;
          this.scene = 'SELECT';
          break;
        case 3: // Title
          this.menu.isPaused = false;
          this.menu.p1Confirmed = false;
          this.menu.p2Confirmed = false;
          this.scene = 'TITLE';
          break;
      }
    }
  }

  private update(): void {
    this.stateTimer++;

    if (this.menu.showGuide) {
      const p1In = this.input.getPlayerInput(1, true);
      const p2In = this.input.getPlayerInput(2, false);
      if (p1In.lightAttackPressed || p2In.lightAttackPressed || p1In.guardPressed || p2In.guardPressed) {
        this.menu.showGuide = false;
      }
      return;
    }

    switch (this.scene) {
      case 'TITLE':
        this.updateTitle();
        break;
      case 'SELECT':
        this.updateSelect();
        break;
      case 'FIGHT_INTRO':
        this.updateFightIntro();
        break;
      case 'FIGHTING':
        this.updateFighting();
        break;
      case 'ROUND_END':
        this.updateRoundEnd();
        break;
      case 'MATCH_END':
        this.updateMatchEnd();
        break;
    }
  }

  private updateTitle(): void {
    const p1In = this.input.getPlayerInput(1, true);
    const p2In = this.input.getPlayerInput(2, false);

    if (p1In.upPressed || p2In.upPressed) {
      this.menu.titleSelectedIndex = (this.menu.titleSelectedIndex - 1 + this.menu.titleOptions.length) % this.menu.titleOptions.length;
      this.audio.playWhoosh(400);
    }
    if (p1In.downPressed || p2In.downPressed) {
      this.menu.titleSelectedIndex = (this.menu.titleSelectedIndex + 1) % this.menu.titleOptions.length;
      this.audio.playWhoosh(350);
    }

    if (p1In.lightAttackPressed || p2In.lightAttackPressed || p1In.guardPressed || p2In.guardPressed) {
      this.audio.enableAudio();
      const selected = this.menu.titleOptions[this.menu.titleSelectedIndex];
      if (selected.mode !== null) {
        this.gameMode = selected.mode;
        this.menu.p1Confirmed = false;
        this.menu.p2Confirmed = false;
        this.scene = 'SELECT';
        this.audio.playHitLight();
      } else {
        this.menu.showGuide = true;
      }
    }
  }

  private updateSelect(): void {
    const p1In = this.input.getPlayerInput(1, true);
    const p2In = this.input.getPlayerInput(2, false);

    const cols = 3;
    const total = CHARACTERS.length;

    // 1P Grid Navigation (2x3)
    if (!this.menu.p1Confirmed) {
      let p1Idx = this.menu.p1SelectedCharIndex;
      if (p1In.leftPressed) {
        p1Idx = p1Idx % cols === 0 ? p1Idx + (cols - 1) : p1Idx - 1;
        this.audio.playWhoosh(400);
      }
      if (p1In.rightPressed) {
        p1Idx = p1Idx % cols === cols - 1 ? p1Idx - (cols - 1) : p1Idx + 1;
        this.audio.playWhoosh(450);
      }
      if (p1In.upPressed) {
        p1Idx = (p1Idx - cols + total) % total;
        this.audio.playWhoosh(400);
      }
      if (p1In.downPressed) {
        p1Idx = (p1Idx + cols) % total;
        this.audio.playWhoosh(350);
      }
      this.menu.p1SelectedCharIndex = p1Idx;

      if (p1In.lightAttackPressed || p1In.guardPressed) {
        this.menu.p1Confirmed = true;
        this.audio.playHitHeavy();
      }
    }

    // 2P Grid Navigation
    if (this.gameMode === 'PVP') {
      if (!this.menu.p2Confirmed) {
        let p2Idx = this.menu.p2SelectedCharIndex;
        if (p2In.leftPressed) {
          p2Idx = p2Idx % cols === 0 ? p2Idx + (cols - 1) : p2Idx - 1;
          this.audio.playWhoosh(400);
        }
        if (p2In.rightPressed) {
          p2Idx = p2Idx % cols === cols - 1 ? p2Idx - (cols - 1) : p2Idx + 1;
          this.audio.playWhoosh(450);
        }
        if (p2In.upPressed) {
          p2Idx = (p2Idx - cols + total) % total;
          this.audio.playWhoosh(400);
        }
        if (p2In.downPressed) {
          p2Idx = (p2Idx + cols) % total;
          this.audio.playWhoosh(350);
        }
        this.menu.p2SelectedCharIndex = p2Idx;

        if (p2In.lightAttackPressed || p2In.guardPressed) {
          this.menu.p2Confirmed = true;
          this.audio.playHitHeavy();
        }
      }
    } else {
      // In CPU or Training mode
      this.menu.p2Confirmed = true;
      if (this.gameMode === 'CPU' && p1In.specialPressed) {
        this.menu.cpuDifficultyIndex = (this.menu.cpuDifficultyIndex + 1) % 3;
      }
    }

    // Both confirmed -> Start Match!
    if (this.menu.p1Confirmed && this.menu.p2Confirmed) {
      const p1Type = CHARACTERS[this.menu.p1SelectedCharIndex].type;
      const p2Type = CHARACTERS[this.menu.p2SelectedCharIndex].type;

      this.initFighters(p1Type, p2Type);
      this.currentRound = 1;
      this.p1.wins = 0;
      this.p2.wins = 0;
      this.startRound();
    }
  }

  private startRound(): void {
    this.projectiles = [];
    this.particles.clear();
    this.roundTimer = 99;
    this.roundTimerFrames = 0;
    this.stateTimer = 0;

    this.p1.resetRound(500, true);
    this.p2.resetRound(1100, false);

    const roundText = this.currentRound === 3 ? 'FINAL ROUND' : `ROUND ${this.currentRound}`;
    this.hud.setAnnouncement(roundText, 'READY...', 70);
    this.audio.playAnnounce('round');
    this.scene = 'FIGHT_INTRO';
  }

  private updateFightIntro(): void {
    this.camera.update(this.p1.x, this.p2.x);
    this.particles.update();

    if (this.stateTimer === 70) {
      this.hud.setAnnouncement('FIGHT!', '', 50);
      this.audio.playAnnounce('fight');
      this.scene = 'FIGHTING';
    }
  }

  private updateFighting(): void {
    const p1Input = this.input.getPlayerInput(1, this.p1.facingRight);
    let p2Input: ReturnType<typeof this.input.getPlayerInput>;

    if (this.gameMode === 'CPU' && this.ai) {
      p2Input = this.ai.update(this.p1, this.projectiles);
    } else {
      p2Input = this.input.getPlayerInput(2, this.p2.facingRight);
    }

    if (this.gameMode === 'TRAINING' && this.infiniteHpInTraining) {
      this.p1.hp = this.p1.maxHp;
      this.p2.hp = this.p2.maxHp;
    }

    // Update Fighters
    this.p1.update(p1Input, this.p2, this.projectiles, this.particles, this.audio);
    this.p2.update(p2Input, this.p1, this.projectiles, this.particles, this.audio);

    // Pushbox (characters don't overlap unless rolling)
    if (
      this.p1.state !== 'ROLL_FWD' && this.p1.state !== 'ROLL_BACK' &&
      this.p2.state !== 'ROLL_FWD' && this.p2.state !== 'ROLL_BACK'
    ) {
      Physics.resolvePushbox(this.p1, this.p2);
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(this.particles);

      if (!proj.isActive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const target = proj.ownerId === 1 ? this.p2 : this.p1;
      const attacker = proj.ownerId === 1 ? this.p1 : this.p2;

      if (Physics.checkOverlap(proj.getHitbox(), target.getHurtbox())) {
        proj.hitsLeft--;
        if (proj.hitsLeft <= 0) {
          proj.isActive = false;
        }

        const isHeavy = proj.damage > 80;
        const targetInput = target.id === 1 ? p1Input : p2Input;
        target.takeDamage(proj.damage, isHeavy, 7, isHeavy ? -4 : 0, attacker, this.particles, this.audio, targetInput);
        this.particles.createHitSparks(proj.x, proj.y, true, proj.color);
      }

      // Projectile clashes
      for (let j = i - 1; j >= 0; j--) {
        const otherProj = this.projectiles[j];
        if (otherProj.isActive && proj.ownerId !== otherProj.ownerId) {
          if (Physics.checkOverlap(proj.getHitbox(), otherProj.getHitbox())) {
            proj.isActive = false;
            otherProj.isActive = false;
            this.particles.createHitSparks((proj.x + otherProj.x) / 2, (proj.y + otherProj.y) / 2, true, '#ffffff');
            this.audio.playBlock();
            break;
          }
        }
      }
    }

    // Update Systems
    this.particles.update();
    this.camera.update(this.p1.x, this.p2.x);
    this.hud.update(this.p1, this.p2);

    // Timer
    if (this.gameMode !== 'TRAINING') {
      this.roundTimerFrames++;
      if (this.roundTimerFrames >= 60) {
        this.roundTimerFrames = 0;
        if (this.roundTimer > 0) {
          this.roundTimer--;
        }
      }
    }

    // Round Finish
    if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.roundTimer <= 0) {
      this.scene = 'ROUND_END';
      this.stateTimer = 0;
      this.camera.shake(12, 20);

      if (this.p1.hp <= 0 && this.p2.hp <= 0) {
        this.hud.setAnnouncement('DOUBLE K.O.!', 'DRAW GAME', 100);
      } else if (this.p2.hp <= 0) {
        const isPerfect = this.p1.hp === this.p1.maxHp;
        this.p1.wins++;
        this.p1.changeState('VICTORY');
        this.hud.setAnnouncement('K.O.!', isPerfect ? '★ PERFECT ★' : `${this.p1.name} WINS!`, 100);
      } else if (this.p1.hp <= 0) {
        const isPerfect = this.p2.hp === this.p2.maxHp;
        this.p2.wins++;
        this.p2.changeState('VICTORY');
        this.hud.setAnnouncement('K.O.!', isPerfect ? '★ PERFECT ★' : `${this.p2.name} WINS!`, 100);
      } else if (this.roundTimer <= 0) {
        if (this.p1.hp > this.p2.hp) {
          this.p1.wins++;
          this.p1.changeState('VICTORY');
          this.hud.setAnnouncement('TIME OVER!', `${this.p1.name} WINS!`, 100);
        } else if (this.p2.hp > this.p1.hp) {
          this.p2.wins++;
          this.p2.changeState('VICTORY');
          this.hud.setAnnouncement('TIME OVER!', `${this.p2.name} WINS!`, 100);
        } else {
          this.hud.setAnnouncement('TIME OVER!', 'DRAW GAME', 100);
        }
      }
    }
  }

  private updateRoundEnd(): void {
    this.particles.update();
    this.camera.update(this.p1.x, this.p2.x);
    this.hud.update(this.p1, this.p2);

    if (this.stateTimer >= 110) {
      if (this.p1.wins >= 2 || this.p2.wins >= 2) {
        this.matchWinner = this.p1.wins >= 2 ? 1 : 2;
        this.scene = 'MATCH_END';
        this.stateTimer = 0;
      } else {
        this.currentRound++;
        this.startRound();
      }
    }
  }

  private updateMatchEnd(): void {
    const p1In = this.input.getPlayerInput(1, true);
    const p2In = this.input.getPlayerInput(2, false);

    if (this.stateTimer > 40 && (p1In.lightAttackPressed || p2In.lightAttackPressed || p1In.guardPressed || p2In.guardPressed)) {
      this.scene = 'TITLE';
      this.menu.p1Confirmed = false;
      this.menu.p2Confirmed = false;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1280, 720);

    if (this.scene === 'TITLE') {
      this.menu.renderTitle(ctx);
    } else if (this.scene === 'SELECT') {
      this.menu.renderCharSelect(ctx, this.gameMode);
    } else {
      this.camera.applyTransform(ctx);

      // Render Chosen Stage
      const curStage = STAGES[this.menu.selectedStageIndex].type;
      if (curStage === 'NEO_TOKYO') {
        this.drawNeoTokyoStage(ctx);
      } else if (curStage === 'SOUTH_TOWN') {
        this.drawSouthTownStage(ctx);
      } else {
        this.drawSuzakuStage(ctx);
      }

      // Draw Projectiles
      for (const proj of this.projectiles) {
        proj.render(ctx);
      }

      // Draw Fighters
      this.p1.render(ctx, this.debugHitboxes);
      this.p2.render(ctx, this.debugHitboxes);

      // Draw Particles
      this.particles.render(ctx);

      this.camera.restoreTransform(ctx);

      // Draw Screen-space Super Freeze
      this.particles.renderSuperFreeze(ctx);

      // Draw HUD
      this.hud.render(ctx, this.p1, this.p2, this.roundTimer, this.currentRound);

      // Match End Screen
      if (this.scene === 'MATCH_END' && this.matchWinner !== null) {
        const winner = this.matchWinner === 1 ? this.p1 : this.p2;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, 1280, 720);

        ctx.textAlign = 'center';
        ctx.font = 'italic 900 72px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`👑 ${winner.name} WINS THE MATCH! 👑`, 640, 320);

        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('축하합니다! 대전이 종료되었습니다.', 640, 390);

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#80deea';
        ctx.fillText('아무 버튼(J / 1번 / Enter)을 누르면 타이틀로 이동합니다', 640, 480);
        ctx.restore();
      }

      if (this.menu.isPaused) {
        this.menu.renderPause(ctx);
      }
    }

    if (this.menu.showGuide) {
      this.menu.renderGuideModal(ctx);
    }
  }

  // --- STAGE 1: 주작성 도장 (Suzaku Castle - SF Ryu Stage) ---
  private drawSuzakuStage(ctx: CanvasRenderingContext2D): void {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 580);
    skyGrad.addColorStop(0, '#1a0826');
    skyGrad.addColorStop(0.4, '#b71c1c');
    skyGrad.addColorStop(0.7, '#ff6f00');
    skyGrad.addColorStop(1, '#ffeb3b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, Physics.STAGE_WIDTH, 580);

    // Giant Sunset Sun
    ctx.fillStyle = 'rgba(255, 235, 59, 0.85)';
    ctx.beginPath();
    ctx.arc(800, 340, 120, 0, Math.PI * 2);
    ctx.fill();

    // Distant Mountain Silhouettes
    ctx.fillStyle = '#311b92';
    ctx.beginPath();
    ctx.moveTo(0, 580);
    ctx.lineTo(240, 380);
    ctx.lineTo(500, 480);
    ctx.lineTo(820, 350);
    ctx.lineTo(1150, 490);
    ctx.lineTo(1420, 390);
    ctx.lineTo(1600, 580);
    ctx.closePath();
    ctx.fill();

    // Traditional Dojo Pagoda
    ctx.fillStyle = '#10061e';
    ctx.fillRect(200, 360, 320, 220);
    ctx.fillRect(1100, 360, 320, 220);

    ctx.beginPath();
    ctx.moveTo(160, 360);
    ctx.lineTo(360, 290);
    ctx.lineTo(560, 360);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(1060, 360);
    ctx.lineTo(1260, 290);
    ctx.lineTo(1460, 360);
    ctx.closePath();
    ctx.fill();

    // Floating Cherry Blossoms
    ctx.fillStyle = '#ff80ab';
    for (let i = 0; i < 15; i++) {
      const petalX = ((this.stateTimer * 2 + i * 110) % Physics.STAGE_WIDTH);
      const petalY = (200 + Math.sin(this.stateTimer * 0.05 + i) * 80 + i * 20) % 560;
      ctx.beginPath();
      ctx.ellipse(petalX, petalY, 6, 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floor
    const floorGrad = ctx.createLinearGradient(0, Physics.GROUND_Y, 0, 720);
    floorGrad.addColorStop(0, '#5d4037');
    floorGrad.addColorStop(0.3, '#3e2723');
    floorGrad.addColorStop(1, '#1b0000');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, Physics.GROUND_Y, Physics.STAGE_WIDTH, 720 - Physics.GROUND_Y);

    ctx.fillStyle = '#d50000';
    ctx.fillRect(0, Physics.GROUND_Y - 4, Physics.STAGE_WIDTH, 8);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    for (let x = 0; x < Physics.STAGE_WIDTH; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, Physics.GROUND_Y);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
  }

  // --- STAGE 2: 네오 도쿄 (Neo Tokyo - KOF '98 Stage) ---
  private drawNeoTokyoStage(ctx: CanvasRenderingContext2D): void {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 580);
    skyGrad.addColorStop(0, '#050014');
    skyGrad.addColorStop(0.5, '#12002f');
    skyGrad.addColorStop(1, '#2c004d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, Physics.STAGE_WIDTH, 580);

    // Skyscrapers with lit windows
    for (let i = 0; i < 12; i++) {
      const bx = i * 140;
      const bw = 110;
      const bh = 220 + (i % 4) * 80;
      ctx.fillStyle = '#0a0a1e';
      ctx.fillRect(bx, 580 - bh, bw, bh);

      // Random lit windows
      ctx.fillStyle = i % 2 === 0 ? '#00e5ff' : '#ffd700';
      for (let wy = 580 - bh + 20; wy < 560; wy += 25) {
        for (let wx = bx + 15; wx < bx + bw - 15; wx += 25) {
          if ((wx + wy) % 3 === 0) {
            ctx.fillRect(wx, wy, 12, 14);
          }
        }
      }
    }

    // Huge Neon Signs (KOF '98 Tribute, SNK, CAPCOM Neon)
    ctx.save();
    ctx.font = 'bold 36px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';

    // Sign 1: SNK NEON
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.fillText('⚡ S N K ⚡', 400, 240);

    // Sign 2: KOF '98 NEON
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.fillText('★ KOF 2026 ★', 800, 180);

    // Sign 3: CAPCOM NEON
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.fillText('◆ CAPCOM ◆', 1200, 240);
    ctx.restore();

    // Asphalt Ground with Neon Road lines
    const roadGrad = ctx.createLinearGradient(0, Physics.GROUND_Y, 0, 720);
    roadGrad.addColorStop(0, '#1c1c28');
    roadGrad.addColorStop(1, '#0c0c14');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, Physics.GROUND_Y, Physics.STAGE_WIDTH, 720 - Physics.GROUND_Y);

    // Neon Road curb
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, Physics.GROUND_Y - 3, Physics.STAGE_WIDTH, 6);
  }

  // --- STAGE 3: 사우스타운 (South Town - Fatal Fury Terry Stage) ---
  private drawSouthTownStage(ctx: CanvasRenderingContext2D): void {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 580);
    skyGrad.addColorStop(0, '#1a0933');
    skyGrad.addColorStop(0.3, '#7b1fa2');
    skyGrad.addColorStop(0.6, '#e65100');
    skyGrad.addColorStop(1, '#ffd54f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, Physics.STAGE_WIDTH, 580);

    // Distant Suspension Bridge (Golden Gate style)
    ctx.strokeStyle = '#c62828';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.bezierCurveTo(400, 490, 1200, 490, 1600, 420);
    ctx.stroke();

    // Bridge Towers
    ctx.fillStyle = '#c62828';
    ctx.fillRect(450, 240, 30, 260);
    ctx.fillRect(1150, 240, 30, 260);

    // Palm Tree Silhouettes
    [100, 250, 1350, 1500].forEach(tx => {
      ctx.fillStyle = '#1b0020';
      ctx.fillRect(tx, 380, 14, 200);
      ctx.beginPath();
      ctx.arc(tx + 7, 370, 45, 0, Math.PI * 2);
      ctx.fill();
    });

    // Highway Floor
    const floorGrad = ctx.createLinearGradient(0, Physics.GROUND_Y, 0, 720);
    floorGrad.addColorStop(0, '#37474f');
    floorGrad.addColorStop(1, '#212121');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, Physics.GROUND_Y, Physics.STAGE_WIDTH, 720 - Physics.GROUND_Y);

    // Yellow Highway Dashed Line
    ctx.fillStyle = '#ffd600';
    for (let x = 0; x < Physics.STAGE_WIDTH; x += 100) {
      ctx.fillRect(x, Physics.GROUND_Y + 50, 55, 8);
    }
  }
}
