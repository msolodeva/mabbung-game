import type { Fighter } from '../entities/Fighter';
import type { ArcadeFighter } from '../entities/ArcadeFighter';
import { sprites } from '../render/Sprites';
export interface AnnouncerState {text:string;subText?:string;scale:number;alpha:number;life:number;maxLife:number;}
export class HUD {
 public stageName='SUZAKU ROOFTOP';
 private red=[1000,1000];
 public announcer:AnnouncerState|null=null;
 public update(p1:Fighter,p2:Fighter):void {
  [p1,p2].forEach((p,i)=>{this.red[i]=this.red[i]>p.hp?Math.max(p.hp,this.red[i]-(this.red[i]-p.hp)*.06-1):p.hp;});
  if(this.announcer) {
   const a=this.announcer;a.life++;a.scale=1+Math.max(0,10-a.life)*.035;
   a.alpha=Math.min(1,a.life/5,(a.maxLife-a.life)/12);if(a.life>=a.maxLife)this.announcer=null;
  }
 }
 public setAnnouncement(text:string,subText='',duration=80):void {this.announcer={text,subText,scale:1.3,alpha:0,life:0,maxLife:duration};}
 public render(ctx:CanvasRenderingContext2D,p1:Fighter,p2:Fighter,time:number,round:number):void {
  ctx.save();const g=ctx.createLinearGradient(0,0,0,155);g.addColorStop(0,'rgba(8,13,22,.94)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,1280,155);
  [p1,p2].forEach((f,i)=>{
   const x=i===0?106:735,w=439,accent=i===0?'#73cbe5':'#e99681';
   ctx.textAlign=i===0?'left':'right';ctx.font='bold 27px Impact, sans-serif';ctx.fillStyle='#fff0dc';ctx.fillText(f.name,i===0?x:x+w,38);
   ctx.font='10px sans-serif';ctx.fillStyle=accent;ctx.fillText(i===0?'PLAYER 01':'PLAYER 02',i===0?x:x+w,53);
   ctx.fillStyle='#141a24';ctx.fillRect(x,63,w,23);
   const fill=(ratio:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(i===0?x+w*(1-ratio):x,64,w*ratio,21);};
   fill(this.red[i]/f.maxHp,'#af493f');fill(f.hp/f.maxHp,'#ead8a7');
   ctx.fillStyle='#fff0cc';ctx.fillRect(i===0?x+w*(1-f.hp/f.maxHp):x,64,w*f.hp/f.maxHp,3);
   ctx.strokeStyle='#e7cfa288';ctx.lineWidth=1;ctx.strokeRect(x,63,w,23);
   ctx.fillStyle='#212936';ctx.fillRect(x,91,w,4);ctx.fillStyle=accent;ctx.fillRect(i===0?x+w*(1-f.guardGauge/100):x,91,w*f.guardGauge/100,4);
   for(let r=0;r<2;r++) {const dx=i===0?x+7+r*20:x+w-7-r*20;ctx.beginPath();ctx.moveTo(dx,105);ctx.lineTo(dx+5,110);ctx.lineTo(dx,115);ctx.lineTo(dx-5,110);ctx.closePath();ctx.fillStyle=r<f.wins?'#f6d385':'#414752';ctx.fill();}
   const portraitX=i===0?30:1192;ctx.fillStyle='#28313d';ctx.fillRect(portraitX,22,58,74);
   ctx.save();ctx.beginPath();ctx.rect(portraitX,22,58,74);ctx.clip();sprites.drawPose(ctx,(f as ArcadeFighter).character,0,portraitX+30,214,192,i===1);ctx.restore();ctx.strokeStyle=accent;ctx.strokeRect(portraitX,22,58,74);
   const sx=i===0?42:938;ctx.fillStyle='rgba(10,17,26,.86)';ctx.fillRect(sx-10,652,310,44);
   ctx.textAlign='left';ctx.font='bold 10px sans-serif';ctx.fillStyle=accent;ctx.fillText('SUPER ART',sx,667);
   for(let n=0;n<3;n++) {ctx.fillStyle='#34404b';ctx.fillRect(sx+n*97,674,91,10);ctx.fillStyle=f.superMeter>=100?accent:'#7d8995';ctx.fillRect(sx+n*97,674,91*Math.max(0,Math.min(1,(f.superMeter-n*100)/100)),10);}
   ctx.font='italic bold 28px Impact,sans-serif';ctx.textAlign=i===0?'left':'right';
   if(f.comboHits>=2){ctx.fillStyle='#fff0d6';ctx.fillText(`${f.comboHits} HITS`,i===0?42:1238,272);}
   const a=f as ArcadeFighter;if(a.feedbackTimer>0){ctx.font='bold 13px sans-serif';ctx.fillStyle='#eccc8e';ctx.fillText(a.feedback,i===0?42:1238,297);}
  });
  ctx.textAlign='center';ctx.fillStyle='#131b27';ctx.beginPath();ctx.moveTo(600,14);ctx.lineTo(680,14);ctx.lineTo(694,80);ctx.lineTo(640,104);ctx.lineTo(586,80);ctx.closePath();ctx.fill();ctx.strokeStyle='#d8b57e';ctx.stroke();
  ctx.fillStyle=time>=0&&time<=10?'#ef9989':'#fff0d6';ctx.font='52px Impact,sans-serif';ctx.fillText(time<0?'∞':String(time).padStart(2,'0'),640,70);
  ctx.font='10px sans-serif';ctx.fillStyle='#d8b57e';ctx.fillText(`ROUND 0${round}`,640,122);
  ctx.fillStyle='#e0d5c4';ctx.font='10px sans-serif';ctx.fillText(`${this.stageName}   /   2D VERSUS`,640,685);
  if(this.announcer){const a=this.announcer;ctx.save();ctx.globalAlpha=Math.max(0,a.alpha);ctx.translate(640,330);ctx.scale(a.scale,a.scale);
   ctx.fillStyle='rgba(9,13,20,.65)';ctx.fillRect(-640,-73,1280,134);ctx.textAlign='center';ctx.font='italic 82px Impact, sans-serif';ctx.lineWidth=5;ctx.strokeStyle='#151c29';ctx.strokeText(a.text,0,13);ctx.fillStyle='#f2ddb4';ctx.fillText(a.text,0,13);
   ctx.font='bold 14px sans-serif';ctx.fillStyle='#e7c398';ctx.fillText(a.subText??'',0,43);ctx.restore();}
  ctx.restore();
 }
}
