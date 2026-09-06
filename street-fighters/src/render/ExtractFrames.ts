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
