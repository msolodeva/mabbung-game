import type { MenuManager, GameMode } from './Menu';
import { CHARACTERS, STAGES } from './Menu';
import { sprites } from '../render/Sprites';
import { BlazeFighter } from '../entities/characters/BlazeFighter';
import { ChunLiFighter } from '../entities/characters/ChunLiFighter';
const previews=[new BlazeFighter(1,0,true),new ChunLiFighter(1,0,true)];
const ink='#eee5d6',muted='#a3acb7',gold='#d8b57e';
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size:number,color=ink,align:CanvasTextAlign='left',weight='600') {
 ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${size>30?'Impact, "Arial Black"':'"Arial", sans-serif'}`;ctx.textAlign=align;ctx.fillText(value,x,y);
}
function backdrop(ctx:CanvasRenderingContext2D):void {
 ctx.fillStyle='#10151e';ctx.fillRect(0,0,1280,720);
 if(sprites.stage) {ctx.globalAlpha=.36;ctx.drawImage(sprites.stage,0,0,1280,720);ctx.globalAlpha=1;}
 const g=ctx.createLinearGradient(0,0,1280,0);g.addColorStop(0,'rgba(10,14,22,.98)');g.addColorStop(.5,'rgba(10,14,22,.65)');g.addColorStop(1,'rgba(10,14,22,.2)');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);
 ctx.fillStyle='rgba(225,184,119,.08)';for(let i=0;i<1280;i+=7) ctx.fillRect(i,0,1,720);
 ctx.strokeStyle='rgba(217,185,132,.25)';ctx.strokeRect(24,24,1232,672);
}
function portrait(ctx:CanvasRenderingContext2D,index:number,x:number,y:number,height:number,flip=false):void {
 if(sprites.drawPose(ctx,CHARACTERS[index].type,0,x,y,height,flip))return;
 ctx.save();ctx.translate(x,y);ctx.scale((flip?-1:1)*height/140,height/140);previews[index]?.drawBody(ctx);ctx.restore();
}
export function titleScreen(ctx:CanvasRenderingContext2D,menu:MenuManager):void {
 ctx.save();backdrop(ctx);
 ctx.save();ctx.beginPath();ctx.rect(585,32,660,638);ctx.clip();
 ctx.fillStyle='rgba(150,42,41,.33)';ctx.beginPath();ctx.moveTo(940,30);ctx.lineTo(1130,30);ctx.lineTo(815,690);ctx.lineTo(625,690);ctx.fill();
 portrait(ctx,1,1090,655,472,true);portrait(ctx,0,810,671,540);ctx.restore();
 text(ctx,'THE ARCADE COLLECTION',62,74,12,gold);
 text(ctx,'STREET',58,190,94);text(ctx,'FIGHTERS',58,282,94);
 text(ctx,'2D  /  VERSUS EDITION',64,321,15,gold);
 const labels=['LOCAL VERSUS','ARCADE BATTLE','TRAINING ROOM','HOW TO PLAY'];
 const subs=['두 사람이 함께하는 대전','CPU와 한 판 승부','기술과 콤보 연습','조작 방법'];
 labels.forEach((label,i)=>{
  const y=365+i*60,selected=menu.titleSelectedIndex===i;
  ctx.fillStyle=selected?'#d8b57e':'rgba(16,22,31,.78)';ctx.fillRect(62,y,465,50);
  if(!selected){ctx.strokeStyle='#36404c';ctx.strokeRect(62,y,465,50);}
  text(ctx,`0${i+1}`,78,y+31,12,selected?'#34302a':gold);
  text(ctx,label,119,y+30,20,selected?'#151a22':ink);
  text(ctx,subs[i],510,y+30,11,selected?'#393a39':muted,'right','400');
 });
 text(ctx,'W / S  선택     J / ENTER  결정',64,654,12,muted);
 text(ctx,'READY FOR THE NEXT ROUND',1212,663,11,gold,'right');ctx.restore();
}
export function selectScreen(ctx:CanvasRenderingContext2D,menu:MenuManager,mode:GameMode):void {
 const names=CHARACTERS.map(c=>c.name.split(' (')[0]);
 ctx.save();backdrop(ctx);
 text(ctx,'FIGHTER SELECT',640,73,44,ink,'center');
 text(ctx,mode==='PVP'?'LOCAL VERSUS':mode==='CPU'?'ARCADE BATTLE':'TRAINING ROOM',640,100,11,gold,'center');
 const a=menu.p1SelectedCharIndex,b=menu.p2SelectedCharIndex;
 for(const [index,x,flip] of [[a,260,false],[b,1020,true]] as const) {
  ctx.save();ctx.beginPath();ctx.rect(x-230,120,460,357);ctx.clip();
  const glow=ctx.createRadialGradient(x,350,0,x,350,250);glow.addColorStop(0,flip?'rgba(223,86,65,.2)':'rgba(76,156,213,.2)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(x-240,110,480,380);
  portrait(ctx,index,x,485,340,flip);ctx.restore();
 }
 text(ctx,'VS',640,295,80,gold,'center');
 text(ctx,'01',70,178,14,'#72c5ef');text(ctx,menu.p1Confirmed?'READY':'PLAYER ONE',70,199,12,'#72c5ef');
 text(ctx,'02',1210,178,14,'#ee9682','right');text(ctx,mode==='PVP'?(menu.p2Confirmed?'READY':'PLAYER TWO'):'CPU / DUMMY',1210,199,12,'#ee9682','right');
 text(ctx,names[a],70,449,44);text(ctx,names[b],1210,449,44,ink,'right');
 text(ctx,CHARACTERS[a].subtitle,70,473,12,muted);text(ctx,CHARACTERS[b].subtitle,1210,473,12,muted,'right');
 text(ctx,CHARACTERS[a].specials[0],70,616,11,CHARACTERS[a].color);
 text(ctx,CHARACTERS[b].specials[0],1210,616,11,CHARACTERS[b].color,'right');
 names.forEach((name,i)=>{
  const x=170+i*158,p1=a===i,p2=b===i;
  ctx.fillStyle=p1?'#233c4e':p2?'#4c2b2c':'#19222d';ctx.fillRect(x,490,148,106);
  ctx.save();ctx.beginPath();ctx.rect(x,490,148,106);ctx.clip();portrait(ctx,i,x+78,670,174,i===b);ctx.restore();
  const g=ctx.createLinearGradient(0,548,0,597);g.addColorStop(0,'transparent');g.addColorStop(1,'#0c131d');ctx.fillStyle=g;ctx.fillRect(x,548,148,49);
  ctx.strokeStyle=p1?'#72c5ef':p2?'#ee9682':'#38414b';ctx.lineWidth=p1||p2?3:1;ctx.strokeRect(x,490,148,106);
  text(ctx,name,x+74,582,17,ink,'center');
  if(i>1)text(ctx,'NEW',x+139,508,8,muted,'right');
  if(p1||p2)text(ctx,p1&&p2?'1P / 2P':p1?'1P':'2P',x+9,508,10,p1?'#9cdcf6':'#ffc7b1');
 });
 ctx.fillStyle='#d8b57e';ctx.fillRect(455,621,370,46);
 text(ctx,mode==='PVP'?(menu.p1Confirmed?'2P 선택 확정':'1P 선택 확정'):'대전 시작',640,651,17,'#17202b','center');
 text(ctx,'1P WASD · CPU/2P 방향키  /  F·ENTER 확정  /  F3 배경 · H 난이도',640,688,12,muted,'center');
 text(ctx,`F3  ${menu.stageAutomatic?'AUTO · ':''}${STAGES[menu.selectedStageIndex].name.split(' (')[0]}`,63,648,11,gold);
 if(mode==='CPU')text(ctx,`H  난이도: ${['EASY','NORMAL','HARD'][menu.cpuDifficultyIndex]}`,1210,648,11,gold,'right');
 ctx.restore();
}
