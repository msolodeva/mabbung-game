import test from 'node:test';
import assert from 'node:assert/strict';
import {FighterAI,AI_LEVELS} from '../src/ai/FighterAI';
import {ArcadeFighter} from '../src/entities/ArcadeFighter';
import {Projectile} from '../src/entities/Projectile';
import {emptyInput} from '../src/engine/Training';
import {simulate,seeded,roster} from './cpu-simulation';

test('AI respects each difficulty reaction delay and reset clears intentions',()=>{
 for(const difficulty of ['EASY','NORMAL','HARD'] as const) {
  const a=new ArcadeFighter('RYU',2,800,false),b=new ArcadeFighter('RYU',1,690,true);
  b.moveId='kick';b.state='ATTACK_HEAVY';
  const ai=new FighterAI(a,difficulty,()=>0);
  for(let i=0;i<AI_LEVELS[difficulty].reaction;i++)assert.deepEqual(ai.update(b,[]),emptyInput());
  assert.equal(ai.update(b,[]).guard,true);
  ai.reset();assert.deepEqual(ai.update(b,[]),emptyInput());
 }
});
test('AI decisions do not read opponent buttons or buffered commands',()=>{
 const a=new ArcadeFighter('RYU',2,850,false),b=new ArcadeFighter('CHUN_LI',1,600,true);
 const c=new ArcadeFighter('CHUN_LI',1,600,true),one=new FighterAI(a,'NORMAL',seeded(4)),two=new FighterAI(a,'NORMAL',seeded(4));
 for(let i=0;i<100;i++) {
  c.buffer={move:i%2?'super':'uppercut',remaining:7};c.lastInput={...emptyInput(),specialPressed:true};
  assert.deepEqual(one.update(b,[]),two.update(c,[]));
 }
});
test('Zangief approaches at distance and uses a command grab only in range',()=>{
 const a=new ArcadeFighter('ZANGIEF',2,1000,false),b=new ArcadeFighter('RYU',1,500,true),ai=new FighterAI(a,'NORMAL',()=>0);
 for(let i=0;i<80;i++)assert.equal(ai.update(b,[]).specialPressed,false);
 b.x=890;ai.reset();let grabs=0;
 for(let i=0;i<80;i++){const input=ai.update(b,[]);if(input.specialPressed&&!input.up&&!input.down)grabs++;}
 assert.ok(grabs>0);
});
test('Dhalsim chooses a long normal at the range where a short jab would miss',()=>{
 const a=new ArcadeFighter('DHALSIM',2,950,false),b=new ArcadeFighter('RYU',1,680,true),ai=new FighterAI(a,'NORMAL',()=>0);
 for(let i=0;i<12;i++)ai.update(b,[]);
 assert.equal(ai.update(b,[]).heavyAttackPressed,true);
});
test('AI ignores projectiles moving away rather than blindly guarding nearby objects',()=>{
 const a=new ArcadeFighter('RYU',2,950,false),b=new ArcadeFighter('RYU',1,500,true);
 const one=new FighterAI(a,'NORMAL',seeded(10)),two=new FighterAI(a,'NORMAL',seeded(10));
 const p=new Projectile(1,800,430,false,'fireball');
 for(let i=0;i<80;i++)assert.deepEqual(one.update(b,[p]),two.update(b,[]));
});
test('all six normal CPUs can engage and damage an opponent in live combat simulation',()=>{
 for(const character of roster) {
  const results=[13,41,100].map(seed=>simulate(character,'RYU','NORMAL',seed,3600));
  assert.ok(results.some(r=>r.hp[1]<1000),`${character} dealt no damage in three bouts`);
  assert.ok(new Set(results.flatMap(r=>Object.keys(r.attacks[0]))).size>=2,`${character} used fewer than two moves`);
 }
});
