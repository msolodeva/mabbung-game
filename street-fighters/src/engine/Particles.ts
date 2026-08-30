export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  shape?: 'circle' | 'spark' | 'ring' | 'smoke' | 'fire' | 'lightning' | 'petal';
}

export interface SlashArc {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  lineWidth: number;
  alpha: number;
  life: number;
  maxLife: number;
  facingRight: boolean;
}

export interface GhostTrail {
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  facingRight: boolean;
  drawBody: (ctx: CanvasRenderingContext2D, alpha: number) => void;
}

export interface SuperFreezeEffect {
  active: boolean;
  life: number;
  maxLife: number;
  color: string;
  characterName: string;
}

export class ParticleManager {
  private particles: Particle[] = [];
  private slashArcs: SlashArc[] = [];
  private ghostTrails: GhostTrail[] = [];
  public superFreeze: SuperFreezeEffect | null = null;

  public update(): void {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) {
        p.vy += p.gravity;
      }
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.shape === 'ring') {
        p.size += 4;
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Slash Arcs
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const s = this.slashArcs[i];
      s.life++;
      s.alpha = Math.max(0, 1 - s.life / s.maxLife);
      if (s.life >= s.maxLife) {
        this.slashArcs.splice(i, 1);
      }
    }

    // 3. Update Ghost Trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.life++;
      g.alpha = Math.max(0, 1 - g.life / g.maxLife);
      if (g.life >= g.maxLife) {
        this.ghostTrails.splice(i, 1);
      }
    }

    // 4. Update Super Freeze
    if (this.superFreeze) {
      this.superFreeze.life++;
      if (this.superFreeze.life >= this.superFreeze.maxLife) {
        this.superFreeze = null;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Render Ghost Trails (Colored After-images)
    for (const g of this.ghostTrails) {
      ctx.save();
      g.drawBody(ctx, g.alpha * 0.45);
      ctx.restore();
    }

    // 2. Render Slash Arcs (Kick/Punch/Blade Swings)
    for (const s of this.slashArcs) {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (!s.facingRight) ctx.scale(-1, 1);
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth * s.alpha;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, s.startAngle, s.endAngle);
      ctx.stroke();

      // Inner white highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s.lineWidth * 0.4 * s.alpha;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'ring') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
        ctx.stroke();
      } else if (p.shape === 'petal') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  public renderSuperFreeze(ctx: CanvasRenderingContext2D): void {
    if (!this.superFreeze) return;

    ctx.save();
    // Darken Background
    ctx.fillStyle = 'rgba(0, 0, 15, 0.7)';
    ctx.fillRect(0, 0, 1280, 720);

    // Radial Speed Lines
    ctx.strokeStyle = this.superFreeze.color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(640, 360);
      ctx.lineTo(640 + Math.cos(angle) * 800, 360 + Math.sin(angle) * 800);
      ctx.stroke();
    }

    // Flash Text
    ctx.globalAlpha = 0.9;
    ctx.textAlign = 'center';
    ctx.font = 'italic 900 68px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('★ SUPER MOVE ★', 640, 220);
    ctx.strokeStyle = this.superFreeze.color;
    ctx.lineWidth = 4;
    ctx.strokeText('★ SUPER MOVE ★', 640, 220);

    ctx.restore();
  }

  public triggerSuperFreeze(color = '#00e5ff', characterName = ''): void {
    this.superFreeze = {
      active: true,
      life: 0,
      maxLife: 20, // 20 frames cinematic freeze
      color,
      characterName
    };
  }

  public addSlashArc(arc: Omit<SlashArc, 'life' | 'maxLife' | 'alpha'>, duration = 8): void {
    this.slashArcs.push({
      ...arc,
      life: 0,
      maxLife: duration,
      alpha: 1
    });
  }

  public addGhostTrail(trail: Omit<GhostTrail, 'life' | 'maxLife' | 'alpha'>, duration = 12): void {
    this.ghostTrails.push({
      ...trail,
      life: 0,
      maxLife: duration,
      alpha: 0.9
    });
  }

  public createHitSparks(x: number, y: number, isHeavy = false, color = '#ffea00'): void {
    const count = isHeavy ? 26 : 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isHeavy ? 12 : 7) + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isHeavy ? 7 : 4) + 2,
        color: i % 2 === 0 ? color : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: Math.floor(Math.random() * 12 + 8),
        gravity: 0.2,
        shape: 'spark'
      });
    }

    // Impact Star Burst
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: isHeavy ? 10 : 5,
      color: '#ffffff',
      alpha: 0.95,
      life: 0,
      maxLife: 10,
      shape: 'ring'
    });
  }

  public createBlockSparks(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color: '#00e5ff',
        alpha: 1,
        life: 0,
        maxLife: 10,
        shape: 'spark'
      });
    }
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#00e5ff',
      alpha: 0.8,
      life: 0,
      maxLife: 8,
      shape: 'ring'
    });
  }

  public createDust(x: number, y: number, count = 6, vxMultiplier = 1): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 5,
        vx: (Math.random() * -3 + 1) * vxMultiplier,
        vy: -Math.random() * 2 - 0.5,
        size: Math.random() * 8 + 4,
        color: 'rgba(210, 210, 210, 0.7)',
        alpha: 0.8,
        life: 0,
        maxLife: Math.floor(Math.random() * 14 + 10),
        shape: 'smoke'
      });
    }
  }

  public createFireTrail(x: number, y: number, color = '#ff4500'): void {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 10 + 6,
        color: i === 0 ? '#ffff00' : color,
        alpha: 0.9,
        life: 0,
        maxLife: 12,
        shape: 'fire'
      });
    }
  }

  public clear(): void {
    this.particles = [];
    this.slashArcs = [];
    this.ghostTrails = [];
    this.superFreeze = null;
  }
}
