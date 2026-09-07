import { sprites } from '../render/Sprites';
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
  character?: string;
  facingRight?: boolean;
}

type Impact = {x:number;y:number;color:string;strength:number;direction:number;life:number;kind:'hit'|'block'|'break'|'ko'};
export class ParticleManager {
  public reducedMotion=false;
  public get superStarting():boolean {return this.superFreeze?.life===0;}
  private impacts:Impact[]=[];
  public get effectCount():number {return this.particles.length+this.slashArcs.length+this.ghostTrails.length+this.impacts.length;}
  private particles: Particle[] = [];
  private slashArcs: SlashArc[] = [];
  private ghostTrails: GhostTrail[] = [];
  public superFreeze: SuperFreezeEffect | null = null;

  public update(): void {
    this.impacts=this.impacts.filter(p=>++p.life<18);
    // Bound bursts during sustained multi-hit moves.
    if(this.particles.length>360)this.particles.splice(0,this.particles.length-360);
    if(this.ghostTrails.length>18)this.ghostTrails.splice(0,this.ghostTrails.length-18);
    if(this.slashArcs.length>32)this.slashArcs.splice(0,this.slashArcs.length-32);
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

    for(const p of this.impacts) {
      const progress=p.life/18, radius=(22+p.strength*14)*(1+progress*1.8);
      ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=(1-progress)**2;
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle=p.color;ctx.lineWidth=3*(1-progress)+1;
      ctx.beginPath();ctx.ellipse(0,0,radius,radius*.65,0,0,Math.PI*2);ctx.stroke();
      if(p.kind==='block') {
        ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,radius*.75,p.direction>0?Math.PI*.55:-Math.PI*.45,p.direction>0?Math.PI*1.45:Math.PI*.45);ctx.stroke();
      } else {
        ctx.fillStyle=p.life<3?'#fff8df':p.color;
        ctx.beginPath();
        for(let i=0;i<16;i++) {const angle=i*Math.PI/8,r=(i%2?.16:1)*radius*(1-progress*.7);const x=Math.cos(angle)*r*1.35,y=Math.sin(angle)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.closePath();ctx.fill();
      }
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
      } else if(p.shape==='smoke'||p.shape==='fire') {
        const radius=p.size*(p.shape==='smoke'?1+p.life/p.maxLife:1.4);
        const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
        glow.addColorStop(0,p.color);glow.addColorStop(1,'transparent');
        ctx.fillStyle=glow;
        if(p.shape==='fire')ctx.globalCompositeOperation='lighter';
        ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
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

  public renderTrails(ctx:CanvasRenderingContext2D):void {
    if(this.reducedMotion)return;
    for(const g of this.ghostTrails) {
      ctx.save();ctx.globalCompositeOperation='screen';g.drawBody(ctx,g.alpha*.28);ctx.restore();
    }
  }

  public impact(x:number,y:number,color:string,strength=1,direction=1,kind:Impact['kind']='hit'):void {
    this.impacts.push({x,y,color,strength,direction,kind,life:0});
    if(this.impacts.length>16)this.impacts.shift();
    if(kind==='ko'||kind==='break')this.createHitSparks(x,y,true,color);
  }

  public renderScreenEffects(ctx:CanvasRenderingContext2D):void {
    const strongest=this.impacts.find(p=>p.strength>=2&&p.life<10);
    if(!strongest||this.reducedMotion)return;
    const fade=(1-strongest.life/10)*.2;
    ctx.save();
    const glow=ctx.createRadialGradient(640,360,250,640,360,740);
    glow.addColorStop(0,'transparent');glow.addColorStop(1,strongest.color);
    ctx.globalAlpha=fade;ctx.fillStyle=glow;ctx.fillRect(0,0,1280,720);ctx.restore();
  }

  public renderSuperFreeze(ctx:CanvasRenderingContext2D):void {
    const effect=this.superFreeze;if(!effect)return;
    const t=effect.life/effect.maxLife,enter=Math.min(1,t*5),exit=Math.min(1,(1-t)*5);
    ctx.save();ctx.fillStyle='rgba(6,10,22,.48)';ctx.fillRect(0,0,1280,720);
    if(!this.reducedMotion) {
      ctx.save();ctx.strokeStyle=effect.color;ctx.globalAlpha=.28*exit;
      for(let i=0;i<32;i++) {
        const angle=i*Math.PI/16+.04,inner=180+(i%5)*32+t*170;
        ctx.lineWidth=i%3===0?3:1;ctx.beginPath();
        ctx.moveTo(640+Math.cos(angle)*inner,380+Math.sin(angle)*inner);
        ctx.lineTo(640+Math.cos(angle)*1100,380+Math.sin(angle)*1100);ctx.stroke();
      }
      ctx.restore();
    }
    // A sliding portrait ribbon leaves the lower arena and HUD visible.
    const slide=this.reducedMotion?0:(1-enter)**3*420*(effect.facingRight===false?-1:1);
    ctx.translate(slide,0);ctx.globalAlpha=exit;
    ctx.fillStyle='#0b1422';ctx.fillRect(0,135,1280,174);
    ctx.fillStyle=effect.color;ctx.fillRect(0,135,1280,3);ctx.fillRect(0,306,1280,3);
    ctx.save();ctx.beginPath();ctx.rect(20,138,350,168);ctx.clip();
    const portraitGlow=ctx.createLinearGradient(20,0,370,0);portraitGlow.addColorStop(0,effect.color);portraitGlow.addColorStop(1,'#0b1422');
    ctx.globalAlpha=exit*.35;ctx.fillStyle=portraitGlow;ctx.fillRect(20,138,350,168);ctx.globalAlpha=exit;
    if(effect.character)sprites.drawPose(ctx,effect.character,0,170,590,440,false);
    ctx.restore();
    ctx.textAlign='left';ctx.fillStyle=effect.color;ctx.font='bold 13px Arial';ctx.fillText('LIMIT BREAK  /  SUPER ART',395,183);
    ctx.font='italic 900 43px Impact, sans-serif';ctx.fillStyle='#fff0d6';ctx.fillText(effect.characterName,393,241,845);
    ctx.fillStyle='#758aa4';ctx.fillRect(395,266,740,2);ctx.fillStyle=effect.color;ctx.fillRect(395,266,740*enter,2);
    ctx.restore();
  }

  public triggerSuperFreeze(color='#00e5ff',characterName='',character?:string,facingRight=true):void {
    this.superFreeze={active:true,life:0,maxLife:20,color,characterName,character,facingRight};
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
    const count = isHeavy ? 20 : 11;
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
    this.impacts = [];
    this.particles = [];
    this.slashArcs = [];
    this.ghostTrails = [];
    this.superFreeze = null;
  }
}
