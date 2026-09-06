/** Simulation advances at 60 Hz regardless of display refresh rate. */
export class FixedStep {
  private previous: number | null = null;
  private accumulator = 0;
  public readonly step = 1000 / 60;
  public advance(now: number, tick: () => void): number {
    if (this.previous === null) { this.previous = now; return 0; }
    this.accumulator += Math.min(100, Math.max(0, now - this.previous));
    this.previous = now;
    let count = 0;
    while (this.accumulator + 0.00001 >= this.step) {
      tick(); this.accumulator -= this.step; count++;
    }
    return count;
  }
  public reset(): void { this.previous = null; this.accumulator = 0; }
}
