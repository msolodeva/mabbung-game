export class Camera {
  public x = 0;
  public y = 0;
  public zoom = 1.0;
  public shakeIntensity = 0;
  public shakeDuration = 0;

  private targetX = 0;
  private targetZoom = 1.0;
  private readonly viewportWidth = 1280;
  private readonly viewportHeight = 720;
  private readonly stageWidth = 1600;

  public update(p1X: number, p2X: number): void {
    const midX = (p1X + p2X) / 2;
    const distance = Math.abs(p1X - p2X);

    // Calculate dynamic zoom (closer when fighting close, wider when far apart)
    // 0.85 to 1.15
    this.targetZoom = Math.max(0.85, Math.min(1.15, 1.15 - (distance / 1200) * 0.3));

    // Smooth zoom interpolation
    this.zoom += (this.targetZoom - this.zoom) * 0.1;

    // Center camera on midX
    this.targetX = midX - (this.viewportWidth / 2) / this.zoom;

    // Clamp camera within stage bounds
    const minX = 0;
    const maxX = this.stageWidth - this.viewportWidth / this.zoom;
    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));

    // Smooth position interpolation
    this.x += (this.targetX - this.x) * 0.12;

    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  public shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    let offsetX = 0;
    let offsetY = 0;

    if (this.shakeIntensity > 0) {
      offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    ctx.translate(offsetX, offsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, 0);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
