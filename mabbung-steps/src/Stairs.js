export class Stairs {
  constructor() {
    this.steps = [];
    this.generateInitial(100);
  }

  generateInitial(count) {
    this.steps = [{ x: 0, y: 0 }];
    for (let i = 1; i < count; i++) {
      this.addStep();
    }
  }

  addStep() {
    const last = this.steps[this.steps.length - 1];
    // Random direction: 1 for right, -1 for left
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.steps.push({
      x: last.x + dir,
      y: last.y + 1
    });
  }

  getStepInfo(index) {
    while (index >= this.steps.length) {
      this.addStep();
    }
    return this.steps[index];
  }
}
