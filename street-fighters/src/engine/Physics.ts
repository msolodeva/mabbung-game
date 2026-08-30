export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Physics {
  public static readonly STAGE_LEFT = 60;
  public static readonly STAGE_RIGHT = 1540;
  public static readonly STAGE_WIDTH = 1600;
  public static readonly STAGE_HEIGHT = 720;
  public static readonly GROUND_Y = 580;
  public static readonly GRAVITY = 0.85;

  public static checkOverlap(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  public static resolvePushbox(
    p1: { x: number; width: number; isAirborne: boolean },
    p2: { x: number; width: number; isAirborne: boolean }
  ): void {
    const minDistance = (p1.width + p2.width) * 0.45;
    const diff = p2.x - p1.x;

    if (Math.abs(diff) < minDistance) {
      const overlap = (minDistance - Math.abs(diff)) * 0.5;
      if (diff >= 0) {
        p1.x -= overlap;
        p2.x += overlap;
      } else {
        p1.x += overlap;
        p2.x -= overlap;
      }
    }

    // Clamp to stage bounds
    const p1Min = Physics.STAGE_LEFT + p1.width / 2;
    const p1Max = Physics.STAGE_RIGHT - p1.width / 2;
    const p2Min = Physics.STAGE_LEFT + p2.width / 2;
    const p2Max = Physics.STAGE_RIGHT - p2.width / 2;

    p1.x = Math.max(p1Min, Math.min(p1Max, p1.x));
    p2.x = Math.max(p2Min, Math.min(p2Max, p2.x));
  }
}
