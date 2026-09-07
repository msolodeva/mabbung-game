export class Camera {
  public x=0;
  public y=0;
  public zoom=1;
  public shakeIntensity=0;
  public shakeDuration=0;
  public reducedMotion=false;
  private shakeLength=1;
  private shakeX=0;
  private shakeY=0;
  private tick=0;
  private punch=0;

  public update(p1X:number,p2X:number):void {
    this.tick++;
    const target=Math.max(.94,Math.min(1.16,1.2-Math.abs(p1X-p2X)/3000));
    this.punch*=.82;
    this.zoom+=(target+(this.reducedMotion?0:this.punch)-this.zoom)*.15;
    const targetX=Math.max(0,Math.min(1600-1280/this.zoom,(p1X+p2X)/2-640/this.zoom));
    this.x+=(targetX-this.x)*.12;
    this.y=580-608/this.zoom;
    if(this.shakeDuration>0)this.shakeDuration--;
    if(!this.shakeDuration)this.shakeIntensity=0;
    const amplitude=this.reducedMotion?0:this.shakeIntensity*(this.shakeDuration/this.shakeLength)**1.5;
    // Sample once per simulation frame, so redraws never alter the camera.
    this.shakeX=Math.sin(this.tick*2.4)*amplitude;
    this.shakeY=Math.cos(this.tick*2.9)*amplitude*.45;
  }
  public shake(intensity:number,duration:number):void {
    this.shakeIntensity=Math.max(this.shakeIntensity,Math.min(14,intensity));
    this.shakeDuration=Math.max(this.shakeDuration,duration);
    this.shakeLength=this.shakeDuration;
  }
  public impact(strength:number):void {
    this.shake(2+strength*3,8+strength*3);
    this.punch=Math.max(this.punch,Math.min(.065,strength*.018));
  }
  public clearEffects():void {this.punch=0;this.shakeDuration=0;this.shakeIntensity=0;this.shakeX=0;this.shakeY=0;}
  public applyTransform(ctx:CanvasRenderingContext2D):void {
    ctx.save();ctx.translate(this.reducedMotion?0:this.shakeX,this.reducedMotion?0:this.shakeY);
    ctx.scale(this.zoom,this.zoom);ctx.translate(-this.x,-this.y);
  }
  public restoreTransform(ctx:CanvasRenderingContext2D):void {ctx.restore();}
}
