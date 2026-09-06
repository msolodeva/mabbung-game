import { extractFrames } from './ExtractFrames';
import { FRAME_BOUNDS } from './AtlasFrames';
import type { ArcadeFighter } from '../entities/ArcadeFighter';
interface Frame {x:number;y:number;w:number;h:number;anchorX:number;anchorY:number;}
interface Atlas {image:HTMLImageElement;frames:Frame[];scale:number;}
class Sprites {
  private atlases=new Map<string,Atlas>();
  public stage:HTMLImageElement|null=null;
  public loaded=false;
  public async load():Promise<void> {
    const loadImage=async(url:string)=>{const i=new Image();i.src=url;await i.decode();return i;};
    const results=await Promise.allSettled([
      loadImage('/assets/dojo.png').then(i=>{this.stage=i;}),
      ...[['RYU','ryu'],['CHUN_LI','chunli'],['RYU_MOTION','ryu-motion'],['CHUN_LI_MOTION','chunli-motion']].map(async([key,file])=>{
        const image=await loadImage(`/assets/${file}${key.endsWith('_MOTION')?'':'-atlas'}.png`);
        const frames:Frame[]=(FRAME_BOUNDS[key]??extractFrames(image)).map(([x,y,right,bottom],n)=>({
          x,y,w:right-x+1,h:bottom-y+1,anchorX:key.endsWith('_MOTION')?(right-x)/2:(n%4*384+192)-x,anchorY:bottom-y+1
        }));
        this.atlases.set(key,{image,frames,scale:222/frames[0].h});
      })
    ]);
    this.loaded=results.every(r=>r.status==='fulfilled');
    for(const r of results) if(r.status==='rejected') console.error('Asset loading failed',r.reason);
  }
  public drawPose(ctx:CanvasRenderingContext2D,key:string,pose:number,x:number,y:number,height=222,flip=false):boolean {
    const atlas=this.atlases.get(key);if(!atlas)return false;
    const f=atlas.frames[pose],s=height/atlas.frames[0].h;
    ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
    // Raised victory hands and uppercut feet share a narrow atlas row boundary.
    // Clip that empty corner so a neighboring pose never leaks into the frame.
    if((key==='RYU'||key==='CHUN_LI')&&(pose===11||pose===15)) {
      const splitX=(key==='RYU'?1330:1323)-f.x;
      const splitY=(key==='RYU'?(pose===11?760:780):(pose===11?744:776))-f.y;
      const corner=pose===11?[[0,0],[f.w,0],[f.w,f.h],[splitX,f.h],[splitX,splitY],[0,splitY]]:
        [[0,0],[splitX,0],[splitX,splitY],[f.w,splitY],[f.w,f.h],[0,f.h]];
      ctx.beginPath();corner.forEach(([px,py],i)=>{const dx=(px-f.anchorX)*s,dy=(py-f.anchorY)*s;i?ctx.lineTo(dx,dy):ctx.moveTo(dx,dy);});ctx.closePath();ctx.clip();
    }
    ctx.drawImage(atlas.image,f.x,f.y,f.w,f.h,-f.anchorX*s,-f.anchorY*s,f.w*s,f.h*s);ctx.restore();return true;
  }
  public drawFighter(ctx:CanvasRenderingContext2D,f:ArcadeFighter):boolean {
    const atlas=this.atlases.get(f.character);if(!atlas)return false;
    let pose=0,offsetX=0,offsetY=0;let key=f.character as string;
    const hasMotion=this.atlases.has(f.character+'_MOTION');
    const t=f.stateTimer,m=f.move;
    if(f.state==='KO'||f.state==='KNOCKDOWN') pose=t<8?12:14;
    else if(f.state==='VICTORY') pose=15;
    else if(f.state==='HURT'||f.state==='GUARD_CRUSH') {pose=12;offsetX=-Math.max(0,6-t)*1.2;}
    else if(f.state==='BLOCK'||f.isGuarding) pose=f.isCrouching?7:13;
    else if(m) {
      pose=t<m.startup?4:t<m.startup+m.active+3?m.sprite:0;
      if(m.projectile) pose=t<7?7:10;
      if(f.moveId==='uppercut') pose=t<4?7:11;
      if(f.moveId==='spin') pose=t<8?4:6;
      if(f.moveId==='airJab'||f.moveId==='airKick') pose=t<4?8:9;
      offsetX=t>=m.startup&&t<m.startup+m.active?5:0;
    } else if(f.isAirborne) pose=8;
    else if(f.isCrouching) pose=7;
    else if(f.state==='WALK_FWD'||f.state==='WALK_BACK') {
      if(hasMotion) {key+='_MOTION';pose=4+(f.state==='WALK_BACK'?7-Math.floor(f.animTick/5)%8:Math.floor(f.animTick/5)%8);}
      else pose=2+Math.floor(f.animTick/7)%2;
    }
    else if(hasMotion) {key+='_MOTION';pose=Math.floor(f.animTick/10)%4;}
    else offsetY=-Math.sin(f.animTick*.075)*2;
    if(hasMotion && m && f.moveId==='kick') {
      key=f.character+'_MOTION';pose=t<m.startup*.65?12:t<m.startup?13:t<m.startup+m.active+2?14:t<m.startup+m.active+8?15:0;
    }
    ctx.save();
    // The mirror match remains readable without recoloring the player's normal costume.
    if(f.id===2 && f.character==='RYU') ctx.filter='sepia(.25) hue-rotate(320deg)';
    if(f.isCrouching&&m&&!m.projectile) {ctx.translate(0,0);ctx.scale(1,.64);}
    this.drawPose(ctx,key,pose,offsetX,offsetY);ctx.restore();return true;
  }
}
export const sprites=new Sprites();
