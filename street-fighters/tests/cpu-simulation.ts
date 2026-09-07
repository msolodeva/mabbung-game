import { ArcadeFighter } from '../src/entities/ArcadeFighter';
import { FighterAI, type AIDifficulty } from '../src/ai/FighterAI';
import { Physics } from '../src/engine/Physics';
import { resolveCombat } from '../src/combat/Resolve';
import type { Projectile } from '../src/entities/Projectile';
import type { CharacterType } from '../src/ui/Menu';
export const roster:CharacterType[]=['RYU','CHUN_LI','CAMMY','ZANGIEF','DHALSIM','BLANKA'];
export function seeded(seed:number):()=>number {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const effects=new Proxy({}, {get:()=>()=>{}}) as any;
export function simulate(a:CharacterType,b:CharacterType,difficulty:AIDifficulty,seed=1,frames=3600) {
 const fighters=[new ArcadeFighter(a,1,570,true),new ArcadeFighter(b,2,1030,false)];
 const agents=fighters.map((f,i)=>new FighterAI(f,difficulty,seeded(seed+i*901)));
 const attacks:[Record<string,number>,Record<string,number>]=[{},{}];
 let projectiles:Projectile[]=[],ticks=0;
 for(;ticks<frames&&fighters.every(f=>f.hp>0);ticks++) {
  const [left,right]=fighters;
  if(left.hitStop>0||right.hitStop>0){left.hitStop=Math.max(0,left.hitStop-1);right.hitStop=Math.max(0,right.hitStop-1);continue;}
  const inputs=agents.map((ai,i)=>ai.update(fighters[1-i],projectiles));
  fighters.forEach((f,i)=>{
   f.update(inputs[i],fighters[1-i],projectiles,effects,effects);
   if(f.moveId&&f.stateTimer===0)attacks[i][f.moveId]=(attacks[i][f.moveId]??0)+1;
  });
  Physics.resolvePushbox(left,right);projectiles.forEach(p=>p.update(effects));
  resolveCombat(fighters,projectiles,effects,effects,effects);projectiles=projectiles.filter(p=>p.isActive);
 }
 return {a,b,difficulty,ticks,hp:fighters.map(f=>f.hp),attacks};
}
