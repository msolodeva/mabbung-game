export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean; // Jump
  down: boolean; // Crouch
  lightAttack: boolean; // Light Punch/Kick
  heavyAttack: boolean; // Heavy Attack
  special: boolean; // 1-Button Special Skill
  superAttack: boolean; // 1-Button Super Skill
  guard: boolean; // Guard / Dash
  // Just pressed triggers (1 frame pulse)
  lightAttackPressed: boolean;
  heavyAttackPressed: boolean;
  specialPressed: boolean;
  superAttackPressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  guardPressed: boolean;
  // Motion detected
  qcfPressed: boolean; // Quarter Circle Forward (↓↘→ + Attack)
  dpPressed: boolean;  // Dragon Punch (→↓↘ + Attack)
  qcbPressed: boolean; // Quarter Circle Back (↓↙← + Attack)
}

interface KeyBinding {
  left: string[];
  right: string[];
  up: string[];
  down: string[];
  light: string[];
  heavy: string[];
  special: string[];
  super: string[];
  guard: string[];
}

const DEFAULT_P1_KEYS: KeyBinding = {
  left: ['KeyA', 'a', 'A'],
  right: ['KeyD', 'd', 'D'],
  up: ['KeyW', 'w', 'W'],
  down: ['KeyS', 's', 'S'],
  light: ['KeyF', 'f', 'F', 'KeyJ', 'j', 'J'],
  heavy: ['KeyG', 'g', 'G', 'KeyK', 'k', 'K'],
  special: ['KeyH', 'h', 'H', 'KeyL', 'l', 'L'],
  super: ['KeyR', 'r', 'R', 'KeyT', 't', 'T', 'KeyU', 'u', 'U'],
  guard: ['Space', ' ', 'KeyV', 'v', 'V', 'KeyC', 'c', 'C']
};

const DEFAULT_P2_KEYS: KeyBinding = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  light: ['KeyI', 'i', 'I', 'Digit8', 'Numpad1', 'Digit1'],
  heavy: ['KeyO', 'o', 'O', 'Digit9', 'Numpad2', 'Digit2'],
  special: ['KeyP', 'p', 'P', 'Digit0', 'Numpad3', 'Digit3'],
  super: ['BracketLeft', '[', 'Minus', '-', 'Numpad4', 'Digit4'],
  guard: ['Enter', 'NumpadEnter', 'Quote', "'", 'Backslash', '\\', 'ShiftRight']
};

interface DirectionEntry {
  dir: number; // Numpad notation: 5=neutral, 6=fwd, 4=back, 2=down, 8=up, 3=down-fwd, 1=down-back, 9=up-fwd, 7=up-back
  frame: number;
}

export class InputManager {
  private keyState = new Map<string, boolean>();
  private prevKeyState = new Map<string, boolean>();
  private p1History: DirectionEntry[] = [];
  private p2History: DirectionEntry[] = [];
  private currentFrame = 0;

  constructor() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this.keyState.set(e.code, true);
      this.keyState.set(e.key, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keyState.set(e.code, false);
      this.keyState.set(e.key, false);
    });
  }

  public update(): void {
    this.currentFrame++;
    // Keep history trimmed to last 60 frames (1 second)
    this.p1History = this.p1History.filter(h => this.currentFrame - h.frame < 45);
    this.p2History = this.p2History.filter(h => this.currentFrame - h.frame < 45);
  }

  public endFrame(): void {
    this.prevKeyState = new Map(this.keyState);
  }

  private isDown(keys: string[]): boolean {
    return keys.some(k => this.keyState.get(k) === true);
  }

  private isJustPressed(keys: string[]): boolean {
    return keys.some(k => this.keyState.get(k) === true && !this.prevKeyState.get(k));
  }

  private getNumpadDir(left: boolean, right: boolean, down: boolean, up: boolean, facingRight: boolean): number {
    const fwd = facingRight ? right : left;
    const back = facingRight ? left : right;

    if (down && fwd) return 3;
    if (down && back) return 1;
    if (up && fwd) return 9;
    if (up && back) return 7;
    if (down) return 2;
    if (up) return 8;
    if (fwd) return 6;
    if (back) return 4;
    return 5;
  }

  private checkMotion(history: DirectionEntry[], sequence: number[], maxFrames = 25): boolean {
    let seqIdx = sequence.length - 1;
    let lastFrame = this.currentFrame;

    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (lastFrame - entry.frame > maxFrames) break;

      if (entry.dir === sequence[seqIdx]) {
        seqIdx--;
        lastFrame = entry.frame;
        if (seqIdx < 0) return true;
      }
    }
    return false;
  }

  public getPlayerInput(playerIndex: 1 | 2, facingRight: boolean): PlayerInput {
    const bindings = playerIndex === 1 ? DEFAULT_P1_KEYS : DEFAULT_P2_KEYS;
    const padIndex = playerIndex - 1;
    const gamepad = navigator.getGamepads ? navigator.getGamepads()[padIndex] : null;

    let left = this.isDown(bindings.left);
    let right = this.isDown(bindings.right);
    let up = this.isDown(bindings.up);
    let down = this.isDown(bindings.down);
    let light = this.isDown(bindings.light);
    let heavy = this.isDown(bindings.heavy);
    let special = this.isDown(bindings.special);
    let superAttack = this.isDown(bindings.super);
    let guard = this.isDown(bindings.guard);

    let lightPressed = this.isJustPressed(bindings.light);
    let heavyPressed = this.isJustPressed(bindings.heavy);
    let specialPressed = this.isJustPressed(bindings.special);
    let superPressed = this.isJustPressed(bindings.super);
    let upPressed = this.isJustPressed(bindings.up);
    let downPressed = this.isJustPressed(bindings.down);
    let leftPressed = this.isJustPressed(bindings.left);
    let rightPressed = this.isJustPressed(bindings.right);
    let guardPressed = this.isJustPressed(bindings.guard);

    // Merge Gamepad input if available
    if (gamepad) {
      const axisX = gamepad.axes[0] || 0;
      const axisY = gamepad.axes[1] || 0;
      const dpadUp = gamepad.buttons[12]?.pressed;
      const dpadDown = gamepad.buttons[13]?.pressed;
      const dpadLeft = gamepad.buttons[14]?.pressed;
      const dpadRight = gamepad.buttons[15]?.pressed;

      if (axisX < -0.4 || dpadLeft) left = true;
      if (axisX > 0.4 || dpadRight) right = true;
      if (axisY < -0.4 || dpadUp) up = true;
      if (axisY > 0.4 || dpadDown) down = true;

      // Buttons: 0=A/X, 1=B/Circle, 2=X/Square, 3=Y/Triangle, 4=LB, 5=RB, 6=LT, 7=RT
      if (gamepad.buttons[0]?.pressed || gamepad.buttons[2]?.pressed) light = true;
      if (gamepad.buttons[1]?.pressed || gamepad.buttons[3]?.pressed) heavy = true;
      if (gamepad.buttons[5]?.pressed || gamepad.buttons[4]?.pressed) special = true;
      if (gamepad.buttons[7]?.pressed || gamepad.buttons[6]?.pressed) superAttack = true;
    }

    // Record direction history for motion inputs
    const dir = this.getNumpadDir(left, right, down, up, facingRight);
    const history = playerIndex === 1 ? this.p1History : this.p2History;
    if (history.length === 0 || history[history.length - 1].dir !== dir) {
      history.push({ dir, frame: this.currentFrame });
    }

    // Motion Detection
    // QCF (↓ ↘ →): 2 -> 3 -> 6
    const qcf = this.checkMotion(history, [2, 3, 6], 30);
    // DP (→ ↓ ↘): 6 -> 2 -> 3
    const dp = this.checkMotion(history, [6, 2, 3], 30);
    // QCB (↓ ↙ ←): 2 -> 1 -> 4
    const qcb = this.checkMotion(history, [2, 1, 4], 30);

    return {
      left,
      right,
      up,
      down,
      lightAttack: light,
      heavyAttack: heavy,
      special,
      superAttack,
      guard,
      lightAttackPressed: lightPressed,
      heavyAttackPressed: heavyPressed,
      specialPressed,
      superAttackPressed: superPressed,
      upPressed,
      downPressed,
      leftPressed,
      rightPressed,
      guardPressed,
      qcfPressed: qcf && (lightPressed || heavyPressed || specialPressed),
      dpPressed: dp && (lightPressed || heavyPressed || specialPressed),
      qcbPressed: qcb && (lightPressed || heavyPressed || specialPressed)
    };
  }
}
