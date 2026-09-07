import { ArcadeFighter } from '../entities/ArcadeFighter';
import type { PlayerInput } from '../engine/Input';
import type { Projectile } from '../entities/Projectile';
import { emptyInput } from '../engine/Training';
import { characterMove, type MoveId } from '../combat/Moves';
import { Physics } from '../engine/Physics';
import type { CharacterType } from '../ui/Menu';

export type AIDifficulty='EASY'|'NORMAL'|'HARD';
export const AI_LEVELS={
  EASY:{reaction:20,think:15,cooldown:32,defense:.32,antiAir:.15,combo:0,aggression:.58},
  NORMAL:{reaction:12,think:10,cooldown:20,defense:.62,antiAir:.45,combo:.35,aggression:.76},
  HARD:{reaction:8,think:7,cooldown:12,defense:.8,antiAir:.68,combo:.6,aggression:.88}
};
const STYLES:Record<CharacterType,{near:number;far:number;attacks:MoveId[]}>= {
  RYU:{near:145,far:260,attacks:['jab','kick','low','fireball','fireball','spin','throw']},
  CHUN_LI:{near:105,far:175,attacks:['jab','jab','kick','low','spin','spin','fireball','throw']},
  CAMMY:{near:90,far:140,attacks:['jab','jab','kick','low','fireball','fireball','spin','throw']},
  ZANGIEF:{near:80,far:110,attacks:['jab','kick','fireball','fireball','throw','spin']},
  DHALSIM:{near:225,far:320,attacks:['jab','kick','kick','sweep','fireball','fireball','spin']},
  BLANKA:{near:90,far:150,attacks:['jab','kick','low','fireball','fireball','spin','spin','throw']}
};
interface Sight {x:number;y:number;width:number;air:boolean;low:boolean;guard:boolean;attacking:boolean;recovering:boolean;reach:number;stunned:boolean;incoming:boolean;}
type Intent='IDLE'|'APPROACH'|'RETREAT'|'GUARD'|'JUMP'|MoveId;

/** Decisions use delayed visible state, never the opponent's input or input buffer. */
export class FighterAI {
  private history:Sight[]=[];
  private think=0;
  private cooldown=0;
  private intent:Intent='IDLE';
  private lowGuard=false;
  private forwardJump=false;
  private comboAttempted=false;
  constructor(private fighter:ArcadeFighter,private difficulty:AIDifficulty='NORMAL',private random:()=>number=Math.random) {}
  public setDifficulty(value:AIDifficulty):void {this.difficulty=value;this.reset();}
  public getDifficulty():AIDifficulty {return this.difficulty;}
  public reset():void {this.history=[];this.think=0;this.cooldown=0;this.intent='IDLE';this.lowGuard=false;this.comboAttempted=false;}

  private observe(opponent:ArcadeFighter,projectiles:Projectile[]):Sight {
    const m=opponent.move;
    return {x:opponent.x,y:opponent.y,width:opponent.width,air:opponent.isAirborne,low:m?.level==='low'||opponent.isCrouching,
      guard:opponent.isGuarding||opponent.state==='BLOCK',stunned:opponent.stun>0,
      attacking:!!m,recovering:!!m&&opponent.stateTimer>=m.startup+m.active,reach:m?.reach??0,
      incoming:projectiles.some(p=>p.isActive&&p.ownerId!==this.fighter.id&&(this.fighter.x-p.x)*p.vx>0&&
        Math.abs(p.x-this.fighter.x)<330&&Math.abs(p.y-(this.fighter.y-this.fighter.height*.55))<125)};
  }
  private inRange(id:MoveId,sight:Sight,distance:number,ownProjectile:boolean):boolean {
    const m=characterMove(this.fighter.character,id);
    if(id==='super'&&this.fighter.superMeter<100)return false;
    if(m.level==='throw')return !sight.air&&!sight.stunned&&distance<m.reach+sight.width*.35;
    if(m.projectile)return !ownProjectile&&distance>165&&distance<730&&!sight.air;
    const travel=m.travel??(id==='spin'?6:0);
    return distance<m.reach+sight.width*.3+Math.max(0,travel)*Math.min(m.active,12)*.65;
  }
  public update(opponent:ArcadeFighter,projectiles:Projectile[]):PlayerInput {
    const f=this.fighter,level=AI_LEVELS[this.difficulty];
    this.history.push(this.observe(opponent,projectiles));
    if(this.history.length<=level.reaction)return emptyInput();
    const sight=this.history.shift()!,distance=Math.abs(f.x-sight.x);
    this.cooldown=Math.max(0,this.cooldown-1);
    if(!f.moveId)this.comboAttempted=false;
    const ownProjectile=projectiles.some(p=>p.isActive&&p.ownerId===f.id);
    // One deliberate cancel attempt after contact, rather than repeated button presses.
    if(f.move?.cancel&&f.attackConnected&&!this.comboAttempted&&f.stateTimer>=f.move.startup+5) {
      this.comboAttempted=true;
      const options=f.move.cancel.filter(id=>this.inRange(id,sight,distance,ownProjectile));
      if(options.length&&this.random()<level.combo)return this.attack(options[Math.floor(this.random()*options.length)]);
    }
    if(f.moveId||f.stun>0||f.state==='KNOCKDOWN'||f.state==='KO')return this.intent==='GUARD'?this.held(f.facingRight):emptyInput();
    if(--this.think>0)return this.held(f.facingRight);
    this.think=level.think+Math.floor(this.random()*5);
    this.intent='IDLE';
    const style=STYLES[f.character];
    if(f.isAirborne) {
      if(distance<160&&this.cooldown===0)return this.commit('airKick');
      return emptyInput();
    }
    const threatened=(sight.attacking&&!sight.recovering&&distance<Math.max(135,sight.reach+35))||sight.incoming;
    if(threatened&&this.random()<level.defense) {
      this.lowGuard=!sight.air&&sight.low;
      if(sight.incoming&&distance>240&&this.random()<.2){this.forwardJump=true;this.intent='JUMP';return this.held(f.facingRight,true);}
      this.intent='GUARD';return this.held(f.facingRight);
    }
    if(sight.air&&distance<155&&sight.y<f.y-30&&this.cooldown===0&&this.random()<level.antiAir)return this.commit('uppercut');
    // Escape the corner through pressure rather than walking endlessly into the wall.
    const corner=f.x<Physics.STAGE_LEFT+110||f.x>Physics.STAGE_RIGHT-110;
    if(distance<style.near&&!corner&&!sight.guard&&this.random()<.55) {this.intent='RETREAT';return this.held(f.facingRight);}
    if(f.character==='ZANGIEF'&&distance>125&&distance<350&&!sight.attacking&&this.random()<.85){this.intent='APPROACH';return this.held(f.facingRight);}
    if(this.cooldown===0&&this.random()<level.aggression) {
      if(this.inRange('super',sight,distance,ownProjectile)&&this.random()<(sight.recovering?.48:.16))return this.commit('super');
      const grab=f.character==='ZANGIEF'?'fireball':'throw';
      if((sight.guard||f.character==='ZANGIEF')&&this.inRange(grab,sight,distance,ownProjectile)&&this.random()<.6)return this.commit(grab);
      if(f.character==='DHALSIM'&&distance>190&&this.inRange('kick',sight,distance,ownProjectile)&&this.random()<.6)return this.commit('kick');
      const candidates=style.attacks.filter(id=>this.inRange(id,sight,distance,ownProjectile));
      if(candidates.length) {
        // Recovery is a chance to punish, but only after the same perception delay.
        const id=sight.recovering&&this.inRange('kick',sight,distance,ownProjectile)?'kick':candidates[Math.floor(this.random()*candidates.length)];
        return this.commit(id);
      }
    }
    this.intent=distance>style.far?'APPROACH':distance<style.near&&!corner?'RETREAT':this.random()<.3?'GUARD':'IDLE';
    this.lowGuard=false;
    return this.held(f.facingRight);
  }
  private commit(id:MoveId):PlayerInput {this.intent='IDLE';this.cooldown=AI_LEVELS[this.difficulty].cooldown;return this.attack(id);}
  private attack(id:MoveId):PlayerInput {
    const input=emptyInput();
    if(id==='jab'||id==='low'||id==='airJab')input.lightAttack=input.lightAttackPressed=true;
    else if(id==='kick'||id==='sweep'||id==='airKick')input.heavyAttack=input.heavyAttackPressed=true;
    else if(id==='throw'){input.lightAttack=input.lightAttackPressed=true;input.heavyAttack=true;}
    else if(id==='super')input.superAttack=input.superAttackPressed=true;
    else {input.special=input.specialPressed=true;input.up=id==='uppercut';input.down=id==='spin';}
    if(id==='low'||id==='sweep')input.down=true;
    return input;
  }
  private held(facingRight:boolean,jumpPressed=false):PlayerInput {
    const input=emptyInput();
    if(this.intent==='APPROACH'||this.intent==='JUMP'&&this.forwardJump)input[facingRight?'right':'left']=true;
    if(this.intent==='RETREAT')input[facingRight?'left':'right']=true;
    if(this.intent==='GUARD'){input.guard=true;input.down=this.lowGuard;}
    if(this.intent==='JUMP'){input.up=true;input.upPressed=jumpPressed;}
    return input;
  }
}
