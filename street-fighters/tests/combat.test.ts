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
