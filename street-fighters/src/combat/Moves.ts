export type MoveId = 'jab' | 'kick' | 'low' | 'sweep' | 'airJab' | 'airKick' | 'fireball' | 'uppercut' | 'spin' | 'super' | 'throw';
export interface Move {
  name: string; startup: number; active: number; recovery: number;
  damage: number; hitstun: number; blockstun: number; hitstop: number;
  reach: number; top: number; height: number; push: number;
  level: 'mid' | 'low' | 'overhead' | 'throw';
  knockdown?: boolean; launch?: number; projectile?: boolean;
  cancel?: MoveId[]; sprite: number; hitInterval?: number; travel?: number;
}
export const MOVES: Record<MoveId, Move> = {
  jab: {name:'STANDING JAB',startup:4,active:3,recovery:9,damage:42,hitstun:15,blockstun:9,hitstop:5,reach:116,top:179,height:38,push:6,level:'mid',cancel:['kick','fireball','uppercut','super'],sprite:5},
  kick: {name:'ROUNDHOUSE',startup:10,active:4,recovery:21,damage:95,hitstun:23,blockstun:14,hitstop:9,reach:164,top:170,height:48,push:12,level:'mid',cancel:['super'],sprite:6},
  low: {name:'LOW STRIKE',startup:5,active:3,recovery:10,damage:35,hitstun:17,blockstun:10,hitstop:5,reach:110,top:57,height:38,push:5,level:'low',cancel:['fireball','uppercut','super'],sprite:5},
  sweep: {name:'SWEEP',startup:9,active:4,recovery:24,damage:85,hitstun:25,blockstun:14,hitstop:9,reach:160,top:48,height:40,push:10,level:'low',knockdown:true,sprite:6},
  airJab: {name:'JUMP STRIKE',startup:5,active:5,recovery:12,damage:48,hitstun:20,blockstun:13,hitstop:6,reach:110,top:128,height:55,push:5,level:'overhead',sprite:9},
  airKick: {name:'JUMP KICK',startup:7,active:7,recovery:15,damage:70,hitstun:23,blockstun:16,hitstop:8,reach:152,top:125,height:65,push:7,level:'overhead',sprite:9},
  fireball: {name:'ENERGY WAVE',startup:14,active:1,recovery:28,damage:75,hitstun:23,blockstun:15,hitstop:7,reach:0,top:150,height:52,push:9,level:'mid',projectile:true,sprite:10},
  uppercut: {name:'RISING STRIKE',startup:5,active:13,recovery:29,damage:120,hitstun:27,blockstun:15,hitstop:10,reach:98,top:235,height:165,push:8,level:'mid',knockdown:true,launch:-11,sprite:11},
  spin: {name:'SPINNING KICK',startup:9,active:16,recovery:23,damage:100,hitstun:25,blockstun:15,hitstop:8,reach:150,top:150,height:80,push:12,level:'mid',knockdown:true,sprite:6},
  super: {name:'SUPER ART',startup:12,active:1,recovery:36,damage:230,hitstun:30,blockstun:24,hitstop:13,reach:0,top:150,height:85,push:15,level:'mid',projectile:true,knockdown:true,launch:-8,sprite:10},
  throw: {name:'SHOULDER THROW',startup:5,active:2,recovery:26,damage:110,hitstun:25,blockstun:0,hitstop:9,reach:82,top:200,height:195,push:12,level:'throw',knockdown:true,launch:-8,sprite:5},
};

// Per-character timing and reach are authored separately from animation frames.
const overrides:Record<string,Partial<Record<MoveId,Partial<Move>>>>={
 CHUN_LI:{jab:{startup:3,damage:35,name:'QUICK PALM'},kick:{startup:8,damage:82,reach:176,name:'HIGH KICK'},low:{startup:4,damage:30},uppercut:{damage:105,name:'RISING KICK'},spin:{name:'LIGHTNING KICKS',damage:24,active:20,recovery:18,hitInterval:5,knockdown:false,push:3},fireball:{name:'KIKOKEN',startup:16,recovery:24,damage:65},super:{name:'KIKOSHO',damage:215}},
 RYU:{fireball:{name:'HADOUKEN'},uppercut:{name:'SHORYUKEN'},spin:{name:'TATSUMAKI'},super:{name:'SHINKU HADOUKEN'}},
 CAMMY:{
  jab:{name:'QUICK STRIKE',startup:3,damage:30},kick:{startup:7,damage:76,recovery:17},
  fireball:{name:'SPIRAL ARROW',projectile:false,startup:9,active:15,recovery:23,reach:135,top:85,height:65,damage:90,travel:9,level:'low',knockdown:true,sprite:10},
  uppercut:{name:'CANNON SPIKE',damage:105},spin:{name:'HOOLIGAN KICK',startup:12,damage:85,travel:7},
  super:{name:'SPIN DRIVE',projectile:false,active:23,reach:145,top:140,height:115,damage:230,travel:10,sprite:10}
 },
 ZANGIEF:{
  jab:{startup:6,damage:58},kick:{startup:14,damage:120,recovery:26},
  throw:{name:'POWER SLAM',damage:150,reach:95},
  fireball:{name:'SCREW PILEDRIVER',projectile:false,startup:7,active:3,recovery:38,reach:100,top:220,height:215,damage:185,level:'throw',knockdown:true,launch:-13,sprite:5},
  uppercut:{name:'RISING HAMMER',startup:8,damage:140},
  spin:{name:'DOUBLE LARIAT',startup:10,active:20,damage:125,reach:170,travel:1.5,sprite:10},
  super:{name:'FINAL ATOMIC BUSTER',projectile:false,startup:8,active:3,recovery:44,reach:115,top:220,height:215,damage:330,level:'throw',launch:-16,sprite:5}
 },
 DHALSIM:{
  jab:{name:'YOGA STRETCH',startup:10,recovery:18,reach:235,damage:45},
  kick:{name:'YOGA LANCE',startup:15,recovery:27,reach:295,damage:88},low:{reach:205,startup:9},sweep:{reach:255,startup:14},
  fireball:{name:'YOGA FIRE',startup:20,recovery:28,damage:85},uppercut:{name:'YOGA RISE',startup:9,damage:95},
  spin:{name:'YOGA FLAME',startup:16,active:18,recovery:27,reach:225,damage:115,travel:0,sprite:10},
  super:{name:'YOGA INFERNO',startup:18,damage:250}
 },
 BLANKA:{
  jab:{name:'WILD CLAW',damage:44},kick:{name:'BEAST KICK',damage:90,reach:145},
  fireball:{name:'ELECTRIC THUNDER',projectile:false,startup:8,active:24,recovery:24,reach:115,top:190,height:175,damage:24,hitInterval:6,push:2,sprite:10},
  uppercut:{name:'VERTICAL ROLL',damage:115},spin:{name:'ROLLING ATTACK',startup:11,active:17,recovery:29,travel:11,damage:110,sprite:11},
  super:{name:'GROUND SHAVE ROLL',projectile:false,active:24,reach:145,top:140,height:125,damage:245,travel:11,sprite:11}
 }
};
export function characterMove(character:string,id:MoveId):Move {return {...MOVES[id],...overrides[character]?.[id]};}
