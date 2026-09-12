import './ai.test';
import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedStep } from '../src/engine/FixedStep';
import { ArcadeFighter } from '../src/entities/ArcadeFighter';
import { resolveCombat } from '../src/combat/Resolve';
import { Physics } from '../src/engine/Physics';
import { MOVES } from '../src/combat/Moves';
import { Projectile } from '../src/entities/Projectile';
import { emptyInput } from '../src/engine/Training';
import { InputManager } from '../src/engine/Input';
import { ParticleManager } from '../src/engine/Particles';
import { Camera } from '../src/engine/Camera';
const effects=new Proxy({}, {get:()=>()=>{}}) as any;
const pair=()=>[new ArcadeFighter('RYU',1,700,true),new ArcadeFighter('CHUN_LI',2,810,false)];
const ready=(f:ArcadeFighter,id:keyof typeof MOVES)=>{f.moveId=id;f.state=id==='jab'?'ATTACK_LIGHT':'ATTACK_HEAVY';f.stateTimer=MOVES[id].startup;f.activeHitbox={x:650,y:350,width:250,height:240};};
const resolve=(fs:ArcadeFighter[],ps:Projectile[]=[])=>resolveCombat(fs,ps,effects,effects,effects);
for(const hz of [30,60,120,144]) test(`60 Hz simulation at ${hz} Hz rendering`,()=>{const c=new FixedStep();let ticks=0;for(let i=0;i<=hz*10;i++)c.advance(i*1000/hz,()=>ticks++);assert.equal(ticks,600);});
test('simultaneous strikes trade regardless of update order',()=>{
 const run=(reverse:boolean)=>{const fs=pair();fs.forEach(f=>ready(f,'jab'));resolve(reverse?[...fs].reverse():fs);return fs.map(f=>f.hp);};
 assert.deepEqual(run(false),run(true));assert.ok(run(false).every(hp=>hp<1000));
});
test('standing guard blocks mid but loses to low attacks',()=>{
 const [a,b]=pair();b.lastInput={...emptyInput(),guard:true};ready(a,'jab');resolve([a,b]);assert.equal(b.hp,1000);assert.equal(b.state,'BLOCK');
 b.setNeutral();b.stun=0;a.hitVictims.clear();ready(a,'low');resolve([a,b]);assert.ok(b.hp<1000);
});
test('crouching guard blocks low and loses to overhead',()=>{
 const [a,b]=pair();b.lastInput={...emptyInput(),guard:true,down:true};b.isCrouching=true;ready(a,'low');resolve([a,b]);assert.equal(b.hp,1000);
 b.stun=0;b.setNeutral();a.hitVictims.clear();ready(a,'airKick');resolve([a,b]);assert.ok(b.hp<1000);
});
test('holding back during attack recovery does not grant guard',()=>{
 const [a,b]=pair();b.lastInput={...emptyInput(),right:true};b.state='ATTACK_HEAVY';b.moveId='kick';ready(a,'jab');resolve([a,b]);assert.equal(b.state,'HURT');assert.ok(b.hp<1000);
});
test('throw beats guard and simultaneous throws escape',()=>{
 let [a,b]=pair();b.lastInput={...emptyInput(),guard:true};ready(a,'throw');resolve([a,b]);assert.equal(b.state,'KNOCKDOWN');
 [a,b]=pair();ready(a,'throw');ready(b,'throw');resolve([a,b]);assert.equal(a.hp,1000);assert.equal(b.hp,1000);assert.equal(a.feedback,'THROW ESCAPE');
});
test('invincible target does not consume projectile; a normal contact hits once',()=>{
 const [a,b]=pair();const p=new Projectile(1,b.x,b.y-100,true,'fireball');b.invincible=true;resolve([a,b],[p]);assert.equal(b.hp,1000);assert.ok(p.isActive);
 b.invincible=false;resolve([a,b],[p]);assert.ok(b.hp<1000);assert.equal(p.isActive,false);const hp=b.hp;resolve([a,b],[p]);assert.equal(b.hp,hp);
});
test('jab whiff cannot cancel but contact can',()=>{
 const [a,b]=pair();ready(a,'jab');const i={...emptyInput(),specialPressed:true};a.update(i,b,[],effects,effects);assert.equal(a.moveId,'jab');
 a.attackConnected=true;a.update(emptyInput(),b,[],effects,effects);assert.equal(a.moveId,'fireball');
});
test('jump lands at the same baseline without tunnelling outside stage',()=>{
 const [a,b]=pair();a.update({...emptyInput(),upPressed:true,up:true},b,[],effects,effects);assert.ok(a.isAirborne);
 for(let i=0;i<90;i++)a.update(emptyInput(),b,[],effects,effects);assert.equal(a.y,Physics.GROUND_Y);assert.equal(a.isAirborne,false);
});
test('corner pushbox transfers full separation and allows airborne cross-over',()=>{
 const [a,b]=pair();a.x=104;b.x=110;Physics.resolvePushbox(a,b);assert.ok(b.x-a.x>=79.1);assert.ok(a.x>=104);
 a.x=b.x;a.y=b.y-250;const x=a.x;Physics.resolvePushbox(a,b);assert.equal(a.x,x);
});
test('inputs retain a tap between ticks and gamepad buttons emit exactly one press',()=>{
 const win=new EventTarget();Object.assign(globalThis,{window:win});
 let pressed=false;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[{axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0&&pressed}))}]}});
 const manager=new InputManager();const key=(name:string)=>{const e=new Event(name);Object.assign(e,{code:'KeyF',key:'f',repeat:false});win.dispatchEvent(e);};
 key('keydown');key('keyup');manager.update();assert.equal(manager.getPlayerInput(1,true).lightAttackPressed,true);manager.endFrame();
 pressed=true;manager.update();assert.equal(manager.getPlayerInput(1,true).lightAttackPressed,true);manager.endFrame();manager.update();assert.equal(manager.getPlayerInput(1,true).lightAttackPressed,false);
});

test('Cammy special advances as a low melee attack without spawning a projectile',()=>{
 const a=new ArcadeFighter('CAMMY',1,500,true),b=new ArcadeFighter('RYU',2,1100,false),ps:Projectile[]=[];
 a.update({...emptyInput(),specialPressed:true},b,ps,effects,effects);
 for(let i=0;i<16;i++)a.update(emptyInput(),b,ps,effects,effects);
 assert.ok(a.x>540);assert.equal(ps.length,0);assert.equal(a.move?.level,'low');assert.ok(a.activeHitbox);
});
test('Zangief command grab beats guard at close range and whiffs at distance',()=>{
 const run=(distance:number)=>{
  const a=new ArcadeFighter('ZANGIEF',1,700,true),b=new ArcadeFighter('RYU',2,700+distance,false);
  b.lastInput={...emptyInput(),guard:true};
  a.update({...emptyInput(),specialPressed:true},b,[],effects,effects);
  for(let i=0;i<12;i++){a.update(emptyInput(),b,[],effects,effects);resolve([a,b]);}
  return b.hp;
 };
 assert.equal(run(110),815);assert.equal(run(240),1000);
});
test('Dhalsim extended punch connects beyond Ryu jab range',()=>{
 const run=(character:'DHALSIM'|'RYU')=>{
  const a=new ArcadeFighter(character,1,600,true),b=new ArcadeFighter('RYU',2,830,false);
  a.update({...emptyInput(),lightAttackPressed:true},b,[],effects,effects);
  for(let i=0;i<15;i++){a.update(emptyInput(),b,[],effects,effects);resolve([a,b]);}
  return b.hp;
 };
 assert.ok(run('DHALSIM')<1000);assert.equal(run('RYU'),1000);
});
test('Blanka electric thunder is a stationary multi-hit contact attack',()=>{
 const a=new ArcadeFighter('BLANKA',1,700,true),b=new ArcadeFighter('RYU',2,800,false),ps:Projectile[]=[];
 a.update({...emptyInput(),specialPressed:true},b,ps,effects,effects);
 for(let i=0;i<55;i++){a.update(emptyInput(),b,ps,effects,effects);resolve([a,b],ps);}
 assert.equal(ps.length,0);assert.equal(a.x,700);assert.ok(a.comboHits>=3);assert.ok(b.hp<950);
});
test('all replacement fighters finish each special and spend one super stock',()=>{
 for(const character of ['CAMMY','ZANGIEF','DHALSIM','BLANKA'] as const) {
  for(const input of [{specialPressed:true},{specialPressed:true,up:true},{specialPressed:true,down:true},{superAttackPressed:true}]) {
   const a=new ArcadeFighter(character,1,500,true),b=new ArcadeFighter('RYU',2,1200,false),ps:Projectile[]=[];
   a.superMeter=300;a.update({...emptyInput(),...input},b,ps,effects,effects);
   for(let i=0;i<120;i++)a.update(emptyInput(),b,ps,effects,effects);
   assert.equal(a.moveId,null,`${character} special remains active`);assert.equal(a.isAirborne,false);
   assert.equal(a.superMeter,'superAttackPressed' in input?200:300);
  }
 }
});

// Effects must expire and remain bounded without changing the combat clock.
test('sustained impact bursts stay bounded and all effects expire',()=>{
 const p=new ParticleManager();
 for(let i=0;i<120;i++) {
  for(let j=0;j<8;j++){p.createHitSparks(800,400,true);p.impact(800,400,'#fff',3);}
  p.update();assert.ok(p.effectCount<=376);
 }
 p.triggerSuperFreeze('#fff','TEST','RYU');
 for(let i=0;i<80;i++)p.update();
 assert.equal(p.effectCount,0);assert.equal(p.superFreeze,null);
 p.impact(800,400,'#fff');p.triggerSuperFreeze();p.clear();
 assert.equal(p.effectCount,0);assert.equal(p.superFreeze,null);
});
test('camera redraws are stable and gentle mode suppresses shake',()=>{
 const camera=new Camera();camera.impact(3);camera.update(700,900);
 const trace:unknown[][]=[];
 const ctx={save(){},translate(...args:number[]){trace.push(args);},scale(...args:number[]){trace.push(args);}} as any;
 camera.applyTransform(ctx);const first=trace.splice(0);camera.applyTransform(ctx);
 assert.deepEqual(trace,first);
 camera.reducedMotion=true;trace.length=0;camera.applyTransform(ctx);assert.deepEqual(trace[0],[0,0]);
 for(let i=0;i<80;i++)camera.update(700,900);
 assert.equal(camera.shakeIntensity,0);assert.equal(camera.shakeDuration,0);
});

test('blocked jab cannot cancel into a special, while a landed jab can',()=>{
 for(const blocked of [true,false]) {
  const [a,b]=pair();b.lastInput={...emptyInput(),guard:blocked};ready(a,'jab');resolve([a,b]);
  assert.equal(a.attackConnected,!blocked);
  a.hitStop=0;
  a.update({...emptyInput(),specialPressed:true},b,[],effects,effects);
  assert.equal(a.moveId,blocked?'jab':'fireball');
 }
});
test('normal projectile guard preserves health and reduces pressure for either player',()=>{
 for(const owner of [1,2] as const) {
  const fs=pair(),a=fs[owner-1],b=fs[2-owner];
  b.lastInput={...emptyInput(),guard:true};
  const p=new Projectile(owner,b.x,b.y-148,owner===1,'fireball');
  resolve(fs,[p]);
  assert.equal(b.hp,b.maxHp);assert.equal(b.guardGauge,95);assert.equal(b.stun,10);
  assert.ok(Math.abs(b.vx)<=2.25);assert.equal(p.isActive,false);assert.equal(a.attackConnected,false);
 }
});
test('super projectile retains chip damage and stronger guard pressure',()=>{
 const [a,b]=pair();b.lastInput={...emptyInput(),guard:true};
 const p=new Projectile(1,b.x,b.y-148,true,'fireball');p.combatMove='super';resolve([a,b],[p]);
 assert.ok(b.hp<b.maxHp);assert.equal(b.stun,24);assert.equal(b.guardGauge,83);
});
test('projectile characters cannot stack normal shots, but can shoot again after removal',()=>{
 for(const character of ['RYU','CHUN_LI','DHALSIM'] as const) {
  const a=new ArcadeFighter(character,1,300,true),b=new ArcadeFighter('RYU',2,1200,false);
  const existing=new Projectile(1,900,b.y-148,true,'fireball'),ps=[existing];
  for(let frame=0;frame<70;frame++) a.update({...emptyInput(),specialPressed:true},b,ps,effects,effects);
  assert.equal(ps.length,1);assert.equal(a.moveId,null);
  existing.isActive=false;
  for(let frame=0;frame<25;frame++) a.update({...emptyInput(),specialPressed:frame===0},b,ps,effects,effects);
  assert.equal(ps.length,2);assert.equal(ps.filter(p=>p.isActive).length,1);
 }
});
test('an opponents projectile does not prevent casting and melee specials remain available',()=>{
 for(const character of ['RYU','CAMMY','BLANKA','ZANGIEF'] as const) {
  const a=new ArcadeFighter(character,1,300,true),b=new ArcadeFighter('RYU',2,1200,false);
  const p=new Projectile(character==='RYU'?2:1,900,b.y-148,false,'fireball');
  a.update({...emptyInput(),specialPressed:true},b,[p],effects,effects);
  assert.equal(a.moveId,'fireball');
 }
});

test('every fighter jumps over a normal projectile and lands within a bounded arc',()=>{
 for(const character of ['RYU','CHUN_LI','CAMMY','ZANGIEF','DHALSIM','BLANKA'] as const) {
  const a=new ArcadeFighter(character,1,400,true),b=new ArcadeFighter('RYU',2,1200,false);
  const startX=a.x;
  a.update({...emptyInput(),up:true,upPressed:true,right:true},b,[],effects,effects);
  let peak=a.y,airFrames=1,clearFrames=0;
  while(a.isAirborne&&airFrames<90) {
   const p=new Projectile(2,a.x,Physics.GROUND_Y-148,false,'fireball');p.width=60;p.height=54;
   if(!Physics.checkOverlap(p.getHitbox(),a.getHurtbox())) clearFrames++;
   a.update(emptyInput(),b,[],effects,effects);peak=Math.min(peak,a.y);airFrames++;
  }
  assert.ok(Physics.GROUND_Y-peak>=185,`${character} jump height`);
  assert.ok(clearFrames>=14,`${character} projectile clearance window`);
  assert.ok(airFrames>=40&&airFrames<=46,`${character} airtime`);
  assert.ok(a.x-startX>=125,`${character} forward travel`);
  assert.equal(a.y,Physics.GROUND_Y);assert.equal(a.isAirborne,false);
 }
});
