import { Fighter } from './Fighter';
import { Physics } from '../engine/Physics';
import type { PlayerInput } from '../engine/Input';
import type { ParticleManager } from '../engine/Particles';
import type { AudioManager } from '../engine/Audio';
import { Projectile } from './Projectile';
import type { CharacterType } from '../ui/Menu';
import { MOVES, characterMove, type MoveId, type Move } from '../combat/Moves';
import { sprites } from '../render/Sprites';

const profiles = {
  RYU: {name:'RYU',speed:4.6,color:'#6ae4ff',skin:'#f1b77c',outfit:'#ebe9e0'},
  CHUN_LI: {name:'CHUN-LI',speed:5.3,color:'#64dbff',skin:'#edba8d',outfit:'#2369d4'},
  CAMMY: {name:'CAMMY',speed:5.8,color:'#66dfb0',skin:'#edba8d',outfit:'#287b59'},
  ZANGIEF: {name:'ZANGIEF',speed:3.5,color:'#ef7562',skin:'#dba178',outfit:'#be3436'},
  DHALSIM: {name:'DHALSIM',speed:3.2,color:'#ffbc66',skin:'#955d39',outfit:'#e69635'},
  BLANKA: {name:'BLANKA',speed:5.0,color:'#c2ee69',skin:'#79af40',outfit:'#aa6437'},
};
export class ArcadeFighter extends Fighter {
  public moveId: MoveId | null = null;
  public stun = 0;
  public attackConnected = false;
  public hitVictims = new Set<number>();
  public lastInput: PlayerInput | null = null;
  public feedback = '';
  public feedbackTimer = 0;
  public comboDamage = 0;
  public lastDamage = 0;
  public buffer: {move: MoveId; remaining: number} | null = null;
  public animTick = 0;
  public lastMove: MoveId | null = null;
  public legacy: Fighter | null = null;
  private landingLag = 0;
  constructor(public readonly character: CharacterType, id: 1 | 2, x: number, facing: boolean) {
    const p = profiles[character];
    super(id,p.name,x,facing,{skin:p.skin,hair:'#29222a',outfit:p.outfit,outfitTrim:'#cf3038',belt:'#252334',effects:p.color});
    this.height=character==='ZANGIEF'?244:character==='BLANKA'?196:222;
    this.width=character==='ZANGIEF'?108:character==='BLANKA'?100:88;
    this.speed=p.speed; this.jumpPower=character==='DHALSIM'?-12.8:-14.8;
  }
  public get move(): Move | null { return this.moveId ? characterMove(this.character,this.moveId) : null; }
  public get neutral(): boolean { return ['IDLE','WALK_FWD','WALK_BACK','CROUCH','JUMP'].includes(this.state); }
  public get canGuard(): boolean { return !this.isAirborne && (this.neutral || this.state==='BLOCK'); }
  public get phase(): string {
    if (this.stun>0) return `${this.state === 'BLOCK' ? 'BLOCKSTUN' : 'HITSTUN'} ${this.stun}F`;
    const m=this.move; if (!m) return this.state;
    return this.stateTimer<m.startup ? `STARTUP ${m.startup-this.stateTimer}F` : this.stateTimer<m.startup+m.active ? 'ACTIVE' : `RECOVERY ${Math.max(0,m.startup+m.active+m.recovery-this.stateTimer)}F`;
  }
  public resetRound(x:number,facing:boolean): void {
    super.resetRound(x,facing); this.moveId=null; this.stun=0; this.buffer=null; this.hitVictims.clear();
    this.attackConnected=false; this.feedback=''; this.feedbackTimer=0; this.comboDamage=0; this.lastDamage=0; this.landingLag=0;
  }
  public captureInput(input:PlayerInput): void {
    this.lastInput=input;
    const airborne=this.isAirborne;
    let move: MoveId | null=null;
    if ((input.lightAttackPressed && input.heavyAttack) || (input.heavyAttackPressed && input.lightAttack)) move='throw';
    else if (input.superAttackPressed) move='super';
    else if (input.dpPressed || (input.specialPressed && input.up)) move='uppercut';
    else if (input.qcbPressed || (input.specialPressed && input.down)) move='spin';
    else if (input.specialPressed || input.qcfPressed) move='fireball';
    else if (input.heavyAttackPressed) move=airborne?'airKick':input.down?'sweep':'kick';
    else if (input.lightAttackPressed) move=airborne?'airJab':input.down?'low':'jab';
    if (move) this.buffer={move,remaining:7};
  }
  public update(input:PlayerInput,opponent:Fighter,projectiles:Projectile[],particles:ParticleManager,audio:AudioManager): void {
    this.captureInput(input);
    if (this.hitStop>0) { this.hitStop--; return; }
    this.animTick++; this.stateTimer++;
    this.activeHitbox=null;
    if (this.feedbackTimer>0) this.feedbackTimer--;
    if (this.wakeUpInvincibility>0) this.wakeUpInvincibility--;
    this.invincible=this.wakeUpInvincibility>0;
    this.isGuarding=this.canGuard && input.guard;
    if (this.neutral && !this.isAirborne) this.facingRight=this.x<opponent.x;
    if (this.comboTimer>0 && --this.comboTimer===0) {this.comboHits=0;this.comboDamage=0;}
    if (this.state!=='BLOCK' && this.state!=='GUARD_CRUSH') this.guardGauge=Math.min(100,this.guardGauge+.18);
    if (this.state==='KO' || this.state==='VICTORY') { this.vx*=.86; this.integrate(particles,audio); return; }
    if (this.stun>0) {
      this.stun--; this.vx*=.87;
      if (this.stun===0 && this.state!=='KNOCKDOWN') this.setNeutral();
    } else if (this.state==='KNOCKDOWN') {
      this.vx*=.86;
      if (!this.isAirborne && this.stateTimer>42) { this.setNeutral(); this.wakeUpInvincibility=5; }
    } else {
      if (this.landingLag>0) this.landingLag--;
      const requested=this.buffer?.move;
      const cancel=!!requested && !!this.move?.cancel?.includes(requested) && this.attackConnected;
      if (requested && (this.neutral && this.landingLag===0 || cancel)) {
        const allowedAir=requested==='airJab'||requested==='airKick';
        if ((!this.isAirborne || allowedAir) && (requested!=='super'||this.superMeter>=100)) this.beginMove(requested,particles,audio);
      }
      if (this.moveId) this.advanceMove(projectiles,particles,audio);
      else if (this.neutral) {
        const direction=Number(input.right)-Number(input.left);
        if (!this.isAirborne) {
          this.isCrouching=input.down;
          this.vx=input.down||input.guard?0:direction*this.speed*(direction===(this.facingRight?1:-1)?1:.76);
          this.state=input.down?'CROUCH':direction ? (direction===(this.facingRight?1:-1)?'WALK_FWD':'WALK_BACK'):'IDLE';
          if (input.upPressed && this.landingLag===0) {
            this.vy=this.jumpPower;this.vx=direction*this.speed;this.state='JUMP';this.isCrouching=false;
            audio.setPosition(this.x);audio.playJump();particles.createDust(this.x,this.y,6);
          }
        }
      }
    }
    if (this.buffer && --this.buffer.remaining<=0) this.buffer=null;
    this.integrate(particles,audio);
    const m=this.move;
    if (m && !m.projectile && this.stateTimer>=m.startup && this.stateTimer<m.startup+m.active) {
      this.activeHitbox={x:this.facingRight?this.x+10:this.x-10-m.reach,y:this.y-m.top,width:m.reach,height:m.height};
    }
  }
  private beginMove(id:MoveId,particles:ParticleManager,audio:AudioManager): void {
    this.buffer=null;this.moveId=id;this.lastMove=id;this.stateTimer=0;this.attackConnected=false;this.hitVictims.clear();
    this.isCrouching=id==='low'||id==='sweep';this.isGuarding=false;
    this.state=id==='super'?'SUPER':id==='fireball'?'SPECIAL_1':id==='uppercut'?'SPECIAL_2':id==='spin'?'SPECIAL_3':id==='kick'||id==='sweep'||id==='airKick'?'ATTACK_HEAVY':'ATTACK_LIGHT';
    if (!this.isAirborne) this.vx=0;
    audio.setPosition(this.x);
    if (id==='super') {this.consumeSuperMeter(100);particles.triggerSuperFreeze(this.colors.effects,this.move!.name,this.character,this.facingRight);audio.playSuperActivate();}
    else audio.playWhoosh(id==='kick'||id==='sweep'?190:320);
  }
  private advanceMove(projectiles:Projectile[],particles:ParticleManager,audio:AudioManager): void {
    const m=this.move!;
    if(m.hitInterval && this.stateTimer>=m.startup && (this.stateTimer-m.startup)%m.hitInterval===0) this.hitVictims.clear();
    if (this.moveId==='super') this.invincible=this.stateTimer<14;
    if (this.moveId==='uppercut') {
      this.invincible=this.stateTimer<=8;
      if(this.stateTimer===m.startup) {this.vy=-13;this.vx=this.facingRight?3.8:-3.8;}
      if(this.stateTimer>=m.startup+m.active) this.vx*=.94;
    }
    if(m.travel!==undefined || this.moveId==='spin') this.vx=this.stateTimer>=m.startup&&this.stateTimer<m.startup+m.active?(this.facingRight?1:-1)*(m.travel??6):0;
    const active=this.stateTimer>=m.startup&&this.stateTimer<m.startup+m.active;
    if(active&&this.stateTimer%3===0&&(this.moveId==='uppercut'||this.moveId==='spin'||(m.travel??0)>0)) {
      const snapshot=Object.assign(Object.create(Object.getPrototypeOf(this)),this) as ArcadeFighter;
      particles.addGhostTrail({x:this.x,y:this.y,color:this.colors.effects,facingRight:this.facingRight,drawBody:(ctx,alpha)=>{
        ctx.globalAlpha=alpha;ctx.translate(snapshot.x,snapshot.y);if(!snapshot.facingRight)ctx.scale(-1,1);sprites.drawFighter(ctx,snapshot);
      }},10);
      if(!this.isAirborne)particles.createDust(this.x,this.y,2,this.facingRight?1:-1);
    }
    if(active&&this.character==='DHALSIM'&&this.moveId==='spin'&&this.stateTimer%2===0)
      particles.createFireTrail(this.x+(this.facingRight?120:-120),this.y-135,this.colors.effects);
    if(this.stateTimer===m.startup) {
      audio.setPosition(this.x);
      if(['fireball','uppercut','spin','super'].includes(this.moveId!))audio.playSpecial(this.character,this.moveId!);
      if(m.projectile) {
        const p=new Projectile(this.id,this.x+(this.facingRight?125:-125),this.y-148,this.facingRight,this.character==='CHUN_LI'?'kikoken':'fireball',m.damage,this.moveId==='super'?13:9);
        p.color=this.colors.effects;p.width=this.moveId==='super'?100:60;p.height=this.moveId==='super'?90:54;
        p.combatMove=this.moveId!;p.hitsLeft=1;projectiles.push(p);
        particles.impact(p.x,p.y,this.colors.effects,this.moveId==='super'?2:1,this.facingRight?1:-1);
      } else if(this.moveId==='kick'||this.moveId==='airKick'||this.moveId==='spin') {
        particles.addSlashArc({x:this.x+(this.facingRight?45:-45),y:this.y-130,radius:105,startAngle:-.8,endAngle:.65,color:this.colors.effects,lineWidth:this.moveId==='spin'?10:7,facingRight:this.facingRight},7);
      }
    }
    if(this.stateTimer>=m.startup+m.active+m.recovery) this.setNeutral();
  }
  public setNeutral(): void {
    this.moveId=null;this.activeHitbox=null;this.isCrouching=false;this.invincible=this.wakeUpInvincibility>0;
    this.state=this.isAirborne?'JUMP':'IDLE';this.stateTimer=0;
  }
  private integrate(particles:ParticleManager,audio:AudioManager):void {
    const wasAir=this.isAirborne;
    this.x+=this.vx;this.y+=this.vy;
    if(this.y<Physics.GROUND_Y) {this.isAirborne=true;this.vy+=Physics.GRAVITY;}
    else {
      this.y=Physics.GROUND_Y;this.vy=0;this.isAirborne=false;
      if(wasAir) {
        const heavy=this.state==='KNOCKDOWN'||this.state==='KO';
        audio.setPosition(this.x);audio.playLand(heavy);
        particles.createDust(this.x,this.y,heavy?18:7);
        if(heavy)particles.impact(this.x,this.y-8,'#e5c395',2,1);
        this.landingLag=3;
        if(this.state==='JUMP'||this.moveId==='airJab'||this.moveId==='airKick') this.setNeutral();
      }
    }
    this.x=Math.max(Physics.STAGE_LEFT+this.width/2,Math.min(Physics.STAGE_RIGHT-this.width/2,this.x));
  }
  protected handleState():void {}
  protected drawCharacterBody(ctx:CanvasRenderingContext2D):void {
    if(sprites.drawFighter(ctx,this)) return;
    if(this.legacy) {
      this.legacy.state=this.state;this.legacy.stateTimer=this.stateTimer;this.legacy.isCrouching=this.isCrouching;
      this.legacy.isAirborne=this.isAirborne;ctx.save();ctx.scale(1.5,1.58);this.legacy.drawBody(ctx);ctx.restore();
    }
  }
}
