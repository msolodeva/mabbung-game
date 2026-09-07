/** Bound each authored grid cell independently, including disconnected hair and effects. */
export function extractGridFrames(image:HTMLImageElement):number[][] {
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
 const {data}=ctx.getImageData(0,0,image.width,image.height),frames:number[][]=[];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++) {
  const left=Math.floor(col*image.width/4),right=Math.floor((col+1)*image.width/4);
  const top=Math.floor(row*image.height/4),bottom=Math.floor((row+1)*image.height/4);
  let x1=right,y1=bottom,x2=left,y2=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*image.width+x)*4+3]>=60) {
   x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);
  }
  if(x1>x2||y1>y2)throw new Error(`Empty sprite cell ${row},${col}`);
  frames.push([x1,y1,x2,y2]);
 }
 return frames;
}

/** Find the 16 disconnected silhouettes, allowing feet and ribbons to cross nominal cell edges. */
export function extractFrames(image:HTMLImageElement):number[][] {
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
 const {data}=ctx.getImageData(0,0,image.width,image.height),w=image.width,h=image.height;
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),parts:number[][]=[];
 for(let start=0;start<w*h;start++) {
  if(seen[start]||data[start*4+3]<60)continue;
  let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0;queue[0]=start;seen[start]=1;
  while(head<tail) {
   const p=queue[head++],x=p%w,y=Math.floor(p/w);
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w])if(n>=0&&n<w*h&&!seen[n]&&data[n*4+3]>=60){seen[n]=1;queue[tail++]=n;}
  }
  if(tail>2000)parts.push([minX,minY,maxX,maxY]);
 }
 if(parts.length!==16)throw new Error(`Expected 16 transparent sprite silhouettes, found ${parts.length}`);
 return parts.sort((a,b)=>Math.floor((a[1]+a[3])/2/(h/4))-Math.floor((b[1]+b[3])/2/(h/4))||a[0]-b[0]);
}
