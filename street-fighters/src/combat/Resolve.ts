import { ArcadeFighter } from '../entities/ArcadeFighter';
import { Physics } from '../engine/Physics';
import type { ParticleManager } from '../engine/Particles';
import type { AudioManager } from '../engine/Audio';
import type { Camera } from '../engine/Camera';
import type { Projectile } from '../entities/Projectile';
import { MOVES, characterMove, type Move } from './Moves';
interface Contact { attacker:ArcadeFighter; target:ArcadeFighter; move:Move; blocked:boolean; counter:boolean; combo:boolean; x:number; y:number; direction:number; projectile?:Projectile; }
/** Capture both contacts before changing either fighter: trades are independent of player order. */
export function resolveCombat(fighters:ArcadeFighter[],projectiles:Projectile[],particles:ParticleManager,audio:AudioManager,camera:Camera):void {
  const contacts:Contact[]=[];
  const capture=(attacker:ArcadeFighter,target:ArcadeFighter,move:Move,projectile?:Projectile)=>{
    if (target.invincible||target.state==='KO'||target.state==='KNOCKDOWN') return;
    if (move.level==='throw' && (target.isAirborne||target.stun>0)) return;
    const input=target.lastInput;
    const back=input && (target.facingRight?input.left:input.right);
    const crouching=!!input?.down;
    const blocked=target.canGuard && !!(back||input?.guard) && move.level!=='throw' && (move.level!=='low'||crouching) && (move.level!=='overhead'||!crouching);
    contacts.push({attacker,target,move,blocked,counter:!!target.moveId,combo:target.state==='HURT',x:projectile?.x??target.x+(attacker.x<target.x?-20:20),y:projectile?.y??target.y-(move.level==='low'?42:move.level==='overhead'?165:174),direction:attacker.x<target.x?1:-1,projectile});
  };
  for(const attacker of fighters) {
    const target=fighters.find(f=>f!==attacker)!;
    if(attacker.activeHitbox&&attacker.move&&!attacker.hitVictims.has(target.id)&&Physics.checkOverlap(attacker.activeHitbox,target.getHurtbox())) capture(attacker,target,attacker.move);
  }
  // Projectiles clash before touching a fighter. An inactive projectile cannot hit again.
  for(let i=0;i<projectiles.length;i++) for(let j=i+1;j<projectiles.length;j++) {
    const a=projectiles[i],b=projectiles[j];
    if(a.isActive&&b.isActive&&a.ownerId!==b.ownerId&&Physics.checkOverlap(a.getHitbox(),b.getHitbox())) {
      a.isActive=false;b.isActive=false;particles.createBlockSparks((a.x+b.x)/2,(a.y+b.y)/2);
      particles.impact((a.x+b.x)/2,(a.y+b.y)/2,'#91ddff',2,1,'block');audio.setPosition((a.x+b.x)/2);audio.playBlock();camera.impact(1);
    }
  }
  for(const p of projectiles) {
    if(!p.isActive||p.hitCooldown>0) continue;
    const attacker=fighters.find(f=>f.id===p.ownerId)!;
    const target=fighters.find(f=>f.id!==p.ownerId)!;
    if(Physics.checkOverlap(p.getHitbox(),target.getHurtbox())) capture(attacker,target,characterMove(attacker.character,p.combatMove),p);
  }
  const throws=contacts.filter(c=>c.move.level==='throw');
  if(throws.length===2) {
    for(const c of throws) {c.attacker.setNeutral();c.attacker.stun=12;c.attacker.state='BLOCK';c.attacker.feedback='THROW ESCAPE';c.attacker.feedbackTimer=40;c.attacker.vx=-c.direction*7;}
    particles.createBlockSparks((fighters[0].x+fighters[1].x)/2,fighters[0].y-130);audio.playBlock();
  }
  for(const c of contacts) {
    if(throws.length===2&&c.move.level==='throw') continue;
    const {attacker:a,target:t,move:m,direction:d}=c;
    audio.setPosition(c.x);
    if(c.projectile) {c.projectile.hitCooldown=12;if(--c.projectile.hitsLeft<=0)c.projectile.isActive=false;}
    else a.hitVictims.add(t.id);
    // Only a landed melee hit opens a cancel; a lingering projectile cannot cancel another move.
    if(!c.projectile && !c.blocked) a.attackConnected=true;
    a.hasHitInCurrentAttack=true;
    t.moveId=null;t.activeHitbox=null;t.stateTimer=0;t.invincible=false;
    if(c.blocked) {
      const normalProjectile=!!c.projectile && c.projectile.combatMove==='fireball';
      t.guardGauge=Math.max(0,t.guardGauge-(normalProjectile?5:m.damage>=85?17:9));
      t.hp=Math.max(1,t.hp-(m.projectile&&!normalProjectile?Math.floor(m.damage*.08):0));
      t.state=t.guardGauge===0?'GUARD_CRUSH':'BLOCK';t.stun=t.guardGauge===0?42:normalProjectile?10:m.blockstun;
      if(t.guardGauge===0) {t.feedback='GUARD BREAK';t.feedbackTimer=45;t.guardGauge=50;audio.playGuardCrush();particles.impact(c.x,c.y,'#9de9ff',3,d,'break');camera.impact(2);}
      else audio.playBlock();
      t.vx=d*m.push*(normalProjectile?.25:.65);t.vy=0;t.isCrouching=!!t.lastInput?.down;
      particles.createBlockSparks(c.x,c.y);particles.impact(c.x,c.y,'#85ddff',1,d,'block');
      a.hitStop=Math.max(a.hitStop,4);t.hitStop=Math.max(t.hitStop,4);a.addSuperMeter(4);t.addSuperMeter(7);
    } else {
      if(!c.combo) {a.comboHits=0;a.comboDamage=0;}
      const damage=Math.round(m.damage*Math.max(.45,1-a.comboHits*.1)*(c.counter?1.12:1));
      a.comboHits++;a.comboTimer=65;a.comboDamage+=damage;t.lastDamage=damage;
      t.hp=Math.max(0,t.hp-damage);t.stun=m.hitstun+(c.counter?3:0);t.vx=d*m.push;t.vy=m.launch??0;
      t.state=t.hp<=0?'KO':m.knockdown?'KNOCKDOWN':'HURT';
      if(t.hp<=0) {t.vy=-9;t.vx=d*9;}
      t.isCrouching=false;
      if(c.counter) {a.feedback='COUNTER HIT';a.feedbackTimer=42;}
      a.hitStop=Math.max(a.hitStop,m.hitstop);t.hitStop=Math.max(t.hitStop,m.hitstop);
      const strength=t.hp<=0?4:m.damage>=200?3:m.damage>=80||m.level==='throw'?2:1;
      if(m.damage>=80)audio.playHitHeavy(a.comboHits);else audio.playHitLight(a.comboHits);
      if(t.hp<=0)audio.playKO();
      camera.impact(strength);particles.impact(c.x,c.y,a.colors.effects,strength,d,t.hp<=0?'ko':'hit');
      particles.createHitSparks(c.x,c.y,m.damage>=80,a.colors.effects);
      a.addSuperMeter(13);t.addSuperMeter(9);
    }
    // Recoil on the attacker keeps pressure from pinning a cornered defender inside a pushbox.
    if(t.x<Physics.STAGE_LEFT+70||t.x>Physics.STAGE_RIGHT-70) a.vx=-d*m.push*.6;
  }
}
