const W=1600,GROUND=580;
function gradient(ctx:CanvasRenderingContext2D,top:string,bottom:string,y1=-160,y2=580):CanvasGradient {
  const g=ctx.createLinearGradient(0,y1,0,y2);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;
}
function floor(ctx:CanvasRenderingContext2D,color:string,glow:string):void {
  ctx.fillStyle=gradient(ctx,color,'#090e18',580,860);ctx.fillRect(-100,GROUND,1800,400);
  ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-100,GROUND);ctx.lineTo(1700,GROUND);ctx.stroke();
  ctx.strokeStyle='#9ca6bc16';ctx.lineWidth=1;
  for(let x=-900;x<2600;x+=140){ctx.beginPath();ctx.moveTo(800+(x-800)*.35,GROUND);ctx.lineTo(x,920);ctx.stroke();}
  for(const y of [607,650,720,820]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}
function skyline(ctx:CanvasRenderingContext2D,base:number,color:string,scale:number):void {
  for(let i=0;i<19;i++) {
    const x=i*95-70,h=(90+(i*73)%220)*scale,w=62+(i*17)%35;
    ctx.fillStyle=color;ctx.fillRect(x,base-h,w,h);
    ctx.fillRect(x+w*.45,base-h-16,4,20);
    for(let row=0;row<h-12;row+=19)for(let col=0;col<w-10;col+=14)if((i+row+col)%5!==0) {
      ctx.fillStyle=(i+col)%3===0?'#9f9beb32':'#71c3ce25';ctx.fillRect(x+7+col,base-h+10+row,4,7);
    }
  }
}
export function drawNeoTokyo(ctx:CanvasRenderingContext2D,tick:number):void {
  ctx.save();ctx.fillStyle=gradient(ctx,'#050c1b','#263a58');ctx.fillRect(-100,-200,1800,1100);
  const moon=ctx.createRadialGradient(1120,85,5,1120,85,130);moon.addColorStop(0,'#8cadd047');moon.addColorStop(1,'transparent');ctx.fillStyle=moon;ctx.fillRect(980,-60,280,280);
  ctx.fillStyle='#abc8d5';ctx.beginPath();ctx.arc(1120,85,24,0,Math.PI*2);ctx.fill();
  skyline(ctx,430,'#0d192d',.8);skyline(ctx,520,'#101d31',1.1);
  // Elevated rail with moving, softly illuminated windows.
  ctx.fillStyle='#0a1322';ctx.fillRect(0,398,W,22);
  ctx.strokeStyle='#52627b';ctx.lineWidth=2;ctx.strokeRect(0,398,W,22);
  for(let i=0;i<5;i++){const x=((tick*1.8+i*92)%2100)-400;ctx.fillStyle='#345470';ctx.fillRect(x,376,86,22);ctx.fillStyle='#b5d5d0';ctx.fillRect(x+8,382,62,8);}
  ctx.fillStyle='#0b1422';ctx.fillRect(130,185,136,395);ctx.fillRect(1330,145,146,435);
  const signs=[{x:150,y:214,w:88,h:142,color:'#e36fa6',text:'夜市'},{x:1353,y:175,w:90,h:170,color:'#63d5dd',text:'道場'}];
  for(const sign of signs) {
    ctx.save();ctx.shadowColor=sign.color;ctx.shadowBlur=12;ctx.strokeStyle=sign.color;ctx.lineWidth=3;ctx.strokeRect(sign.x,sign.y,sign.w,sign.h);
    ctx.fillStyle=sign.color;ctx.font='bold 40px sans-serif';ctx.textAlign='center';
    [...sign.text].forEach((c,i)=>ctx.fillText(c,sign.x+sign.w/2,sign.y+55+i*57));ctx.restore();
  }
  // Side shopfronts and cables frame the combat area.
  ctx.strokeStyle='#030914';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,165);ctx.quadraticCurveTo(800,345,1600,110);ctx.stroke();
  for(const x of [0,1420]){ctx.fillStyle='#101a2a';ctx.fillRect(x,405,180,175);ctx.fillStyle='#55708c';for(let y=438;y<560;y+=12)ctx.fillRect(x+8,y,160,3);}
  floor(ctx,'#1c2b40','#83c5d380');
  for(const [x,color] of [[190,'#d5619424'],[1380,'#4bcad824']] as const) {
    ctx.fillStyle=color;for(let i=0;i<9;i++)ctx.fillRect(x-55-i*12,590+i*14,110+i*24,4+i%3);
  }
  // Sparse diagonal rain stays behind fighters and never obscures their silhouettes.
  ctx.strokeStyle='#a8cbd22e';ctx.lineWidth=1;
  for(let i=0;i<65;i++){const x=(i*173+tick*1.2)%1700-50,y=(i*97+tick*7)%950-150;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+19);ctx.stroke();}
  ctx.restore();
}
export function drawSouthTown(ctx:CanvasRenderingContext2D,tick:number):void {
  ctx.save();ctx.fillStyle=gradient(ctx,'#101b35','#d08669');ctx.fillRect(-100,-200,1800,1100);
  const sun=ctx.createRadialGradient(1110,215,20,1110,215,270);sun.addColorStop(0,'#ffd39591');sun.addColorStop(1,'transparent');ctx.fillStyle=sun;ctx.fillRect(810,-90,600,600);
  ctx.fillStyle='#f5c696';ctx.beginPath();ctx.arc(1110,215,64,0,Math.PI*2);ctx.fill();
  skyline(ctx,425,'#343d55',.65);
  // Water and a suspension bridge give the stage a distinct open horizon.
  ctx.fillStyle=gradient(ctx,'#536174','#25394c',415,530);ctx.fillRect(0,415,W,135);
  ctx.strokeStyle='#c5ada02b';ctx.lineWidth=2;for(let i=0;i<32;i++){const x=(i*131+tick*.25)%1700;ctx.beginPath();ctx.moveTo(x,428+i%8*12);ctx.lineTo(x+35+i%4*20,428+i%8*12);ctx.stroke();}
  ctx.strokeStyle='#1b2940';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,320);ctx.quadraticCurveTo(250,480,475,240);ctx.quadraticCurveTo(830,475,1160,240);ctx.quadraticCurveTo(1400,445,1650,310);ctx.stroke();
  ctx.fillStyle='#202e44';ctx.fillRect(0,427,W,15);
  for(const x of [465,1150]){ctx.fillRect(x,232,18,250);ctx.fillRect(x-8,263,34,8);}
  ctx.strokeStyle='#253249';ctx.lineWidth=2;
  for(let x=60;x<1600;x+=42){
    const t=x<475?x/475:x<1160?(x-475)/685:(x-1160)/490;
    const y=x<475?(1-t)**2*320+2*(1-t)*t*480+t*t*240:x<1160?240+470*t*(1-t):(1-t)**2*240+2*(1-t)*t*445+t*t*310;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,427);ctx.stroke();
  }
  for(let i=0;i<8;i++){const x=(tick*(i%2?2:-1.4)+i*217+5000)%1700;ctx.fillStyle=i%2?'#fff0cc':'#e98e81';ctx.fillRect(x,420,13,3);}
  ctx.fillStyle='#132037';ctx.fillRect(0,524,W,56);
  ctx.strokeStyle='#8c96a35c';ctx.lineWidth=3;for(const y of [526,548]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(let x=15;x<W;x+=65){ctx.fillStyle='#26364b';ctx.fillRect(x,522,5,58);}
  for(const x of [70,1510]) {
    ctx.fillStyle='#101a2c';ctx.fillRect(x,140,7,440);ctx.fillRect(x-35,140,78,6);ctx.fillStyle='#ffe1ad';ctx.fillRect(x-31,146,68,5);
    const light=ctx.createRadialGradient(x,150,0,x,150,140);light.addColorStop(0,'#ffc57735');light.addColorStop(1,'transparent');ctx.fillStyle=light;ctx.fillRect(x-140,10,280,280);
  }
  floor(ctx,'#34404d','#d3b2948a');
  ctx.fillStyle='#d6b07055';for(let x=0;x<W;x+=175)ctx.fillRect(x,688,94,6);
  ctx.restore();
}
