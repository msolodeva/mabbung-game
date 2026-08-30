import { Rect, Physics } from '../engine/Physics';
import { ParticleManager } from '../engine/Particles';

export type ProjectileType =
  | 'fireball'
  | 'shuriken'
  | 'rocket'
  | 'beam'
  | 'powerwave'
  | 'yamibarai'
  | 'sonicboom'
  | 'kikoken';

export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public width: number;
  public height: number;
  public type: ProjectileType;
  public ownerId: 1 | 2;
  public damage: number;
  public meterGain: number;
  public isActive = true;
  public life = 0;
  public maxLife: number;
  public facingRight: boolean;
  public color: string;
  public hitsLeft: number;

  constructor(
    ownerId: 1 | 2,
    x: number,
    y: number,
    facingRight: boolean,
    type: ProjectileType,
    damage = 90,
    speed = 12
  ) {
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;
    this.facingRight = facingRight;
    this.vx = facingRight ? speed : -speed;
    this.vy = 0;
    this.type = type;
    this.damage = damage;
    this.meterGain = 15;
    this.hitsLeft = type === 'beam' ? 5 : 1;

    switch (type) {
      case 'fireball':
        this.width = 52;
        this.height = 40;
        this.maxLife = 90;
        this.color = '#ff5722';
        break;
      case 'shuriken':
        this.width = 32;
        this.height = 32;
        this.maxLife = 75;
        this.vx *= 1.25;
        this.color = '#00e5ff';
        break;
      case 'rocket':
        this.width = 56;
        this.height = 32;
        this.maxLife = 85;
        this.color = '#ff9800';
        break;
      case 'powerwave':
        // Terry's ground wave
        this.width = 46;
        this.height = 70;
        this.y = Physics.GROUND_Y - 35;
        this.maxLife = 80;
        this.color = '#ffd700';
        break;
      case 'yamibarai':
        // Iori's purple ground flame
        this.width = 50;
        this.height = 60;
        this.y = Physics.GROUND_Y - 30;
        this.maxLife = 80;
        this.color = '#d500f9';
        break;
      case 'sonicboom':
        // Guile's sonic boom crescent
        this.width = 65;
        this.height = 50;
        this.maxLife = 95;
        this.color = '#76ff03';
        break;
      case 'kikoken':
        // Chun-Li's kikoken
        this.width = 44;
        this.height = 44;
        this.maxLife = 70;
        this.color = '#00e5ff';
        break;
      case 'beam':
      default:
        this.width = 340;
        this.height = 65;
        this.maxLife = 40;
        this.color = '#e040fb';
        break;
    }
  }

  public update(particles: ParticleManager): void {
    if (!this.isActive) return;

    this.x += this.vx;
    this.y += this.vy;
    this.life++;

    // Ground wave clamp
    if (this.type === 'powerwave' || this.type === 'yamibarai') {
      this.y = Physics.GROUND_Y - this.height / 2;
    }

    // Spawn trail particles
    if (this.type === 'fireball') {
      particles.createFireTrail(this.x, this.y, '#ff3d00');
    } else if (this.type === 'powerwave') {
      particles.createFireTrail(this.x, this.y + 10, '#ffeb3b');
      if (this.life % 2 === 0) particles.createDust(this.x, Physics.GROUND_Y, 2);
    } else if (this.type === 'yamibarai') {
      particles.createFireTrail(this.x, this.y + 10, '#d500f9');
      if (this.life % 2 === 0) particles.createFireTrail(this.x, this.y - 10, '#651fff');
    } else if (this.type === 'sonicboom') {
      if (this.life % 2 === 0) particles.createFireTrail(this.x, this.y, '#76ff03');
    } else if (this.type === 'kikoken') {
      particles.createFireTrail(this.x, this.y, '#00e5ff');
    } else if (this.type === 'shuriken') {
      if (this.life % 2 === 0) particles.createFireTrail(this.x, this.y, '#00e5ff');
    } else if (this.type === 'rocket') {
      const exhaustX = this.facingRight ? this.x - this.width / 2 : this.x + this.width / 2;
      particles.createDust(exhaustX, this.y, 2, this.facingRight ? -1 : 1);
      particles.createFireTrail(exhaustX, this.y, '#ff9100');
    }

    // Check stage boundaries
    if (
      this.x < Physics.STAGE_LEFT - 100 ||
      this.x > Physics.STAGE_RIGHT + 100 ||
      this.life >= this.maxLife
    ) {
      this.isActive = false;
    }
  }

  public getHitbox(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (!this.facingRight) ctx.scale(-1, 1);

    if (this.type === 'fireball') {
      // Hadouken fiery energy sphere
      const pulse = Math.sin(this.life * 0.4) * 4;
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.width / 2 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffeb3b');
      grad.addColorStop(0.7, '#ff5722');
      grad.addColorStop(1, 'rgba(255, 30, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Flame streaks
      ctx.fillStyle = '#ff7043';
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(-38 - Math.random() * 10, 0);
      ctx.lineTo(-10, 14);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'powerwave') {
      // Terry's Rising Geyser Flame
      const waveGrad = ctx.createLinearGradient(0, this.height / 2, 0, -this.height / 2);
      waveGrad.addColorStop(0, '#ffea00');
      waveGrad.addColorStop(0.5, '#ff9100');
      waveGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');

      ctx.fillStyle = waveGrad;
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, this.height / 2);
      ctx.lineTo(-10, -this.height / 2 + Math.random() * 10);
      ctx.lineTo(this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.type === 'yamibarai') {
      // Iori's Purple ground flame
      const flameGrad = ctx.createLinearGradient(0, this.height / 2, 0, -this.height / 2);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#ea80fc');
      flameGrad.addColorStop(0.8, '#d500f9');
      flameGrad.addColorStop(1, 'rgba(101, 31, 255, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, this.height / 2);
      ctx.lineTo(-5, -this.height / 2 + Math.sin(this.life * 0.8) * 8);
      ctx.lineTo(this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'sonicboom') {
      // Guile's spinning sonic crescent blade
      const spin = this.life * 0.5;
      ctx.rotate(spin);

      const boomGrad = ctx.createLinearGradient(-30, 0, 30, 0);
      boomGrad.addColorStop(0, '#76ff03');
      boomGrad.addColorStop(0.5, '#ffffff');
      boomGrad.addColorStop(1, '#00e676');

      ctx.fillStyle = boomGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.type === 'kikoken') {
      // Chun-Li's blue ki palm burst
      const pulse = Math.sin(this.life * 0.45) * 3;
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 22 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#80d8ff');
      grad.addColorStop(0.8, '#00b0ff');
      grad.addColorStop(1, 'rgba(0, 176, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + pulse, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'shuriken') {
      const spin = this.life * 0.45;
      ctx.rotate(spin);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;

      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -4);
        ctx.lineTo(18, 0);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'rocket') {
      ctx.fillStyle = '#37474f';
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 2;
      ctx.fillRect(-18, -12, 28, 24);
      ctx.strokeRect(-18, -12, 28, 24);

      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(10, -10, 8, 20);

      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.lineTo(-30 - Math.random() * 8, 0);
      ctx.lineTo(-18, 8);
      ctx.fill();
    } else if (this.type === 'beam') {
      const beamGrad = ctx.createLinearGradient(-10, -this.height / 2, -10, this.height / 2);
      beamGrad.addColorStop(0, 'rgba(224, 64, 251, 0.2)');
      beamGrad.addColorStop(0.3, '#ea80fc');
      beamGrad.addColorStop(0.5, '#ffffff');
      beamGrad.addColorStop(0.7, '#ea80fc');
      beamGrad.addColorStop(1, 'rgba(224, 64, 251, 0.2)');

      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, -this.height / 2, this.width, this.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, -this.height / 2, this.width, this.height);
    }

    ctx.restore();
  }
}
