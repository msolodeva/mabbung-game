import { sprites } from './Sprites';
export function drawDojo(ctx:CanvasRenderingContext2D,tick:number):boolean {
  if(!sprites.stage)return false;
  // The painted platform begins at y=510; feet meet the wood at y=580.
  ctx.drawImage(sprites.stage,0,-68,1600,900);
  const shade=ctx.createLinearGradient(0,0,0,720);shade.addColorStop(0,'rgba(15,20,35,.24)');shade.addColorStop(.7,'rgba(15,20,35,0)');shade.addColorStop(1,'rgba(12,16,24,.3)');
  ctx.fillStyle=shade;ctx.fillRect(0,-100,1600,1000);
  for(let i=0;i<18;i++) {
    const x=(i*137+tick*(.35+i%3*.12))%1700-50,y=80+(i*83+tick*.3)%475;
    ctx.save();ctx.translate(x,y);ctx.rotate(tick*.018+i);ctx.globalAlpha=.22+(i%4)*.1;ctx.fillStyle=i%2?'#db894b':'#cf604d';
    ctx.beginPath();ctx.ellipse(0,0,3+i%3,1.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  return true;
}
