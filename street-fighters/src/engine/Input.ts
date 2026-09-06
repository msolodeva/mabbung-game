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
  private pressedKeys = new Set<string>();
  private cached = new Map<number, PlayerInput>();
  private previousPads: boolean[][] = [[], []];
  public history: string[][] = [[], []];
  public clear(): void {
    this.keyState.clear(); this.prevKeyState.clear(); this.pressedKeys.clear(); this.cached.clear();
    this.previousPads=[[],[]]; this.p1History=[]; this.p2History=[];
  }

  constructor() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) { this.pressedKeys.add(e.code); this.pressedKeys.add(e.key); }
      this.keyState.set(e.code, true);
      this.keyState.set(e.key, true);
    });

    window.addEventListener('blur', () => this.clear());
    window.addEventListener('keyup', (e) => {
      this.keyState.set(e.code, false);
      this.keyState.set(e.key, false);
    });
  }

  public update(): void {
    this.currentFrame++;
    this.cached.clear();
    // Keep history trimmed to last 60 frames (1 second)
    this.p1History = this.p1History.filter(h => this.currentFrame - h.frame < 45);
    this.p2History = this.p2History.filter(h => this.currentFrame - h.frame < 45);
  }

  public endFrame(): void {
    this.prevKeyState = new Map(this.keyState);
    this.pressedKeys.clear();
    const pads = navigator.getGamepads?.() ?? [];
    this.previousPads = [0, 1].map(i => pads[i] ? this.padActions(pads[i]!) : []);
  }

  private isDown(keys: string[]): boolean {
    return keys.some(k => this.keyState.get(k) === true);
  }

  private isJustPressed(keys: string[]): boolean {
    return keys.some(k => this.pressedKeys.has(k));
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
      if (this.currentFrame - entry.frame > maxFrames) break;

      if (entry.dir === sequence[seqIdx]) {
        seqIdx--;
        lastFrame = entry.frame;
        if (seqIdx < 0) return true;
      }
    }
    return false;
  }

  private padActions(pad: Gamepad): boolean[] {
    const b=(i:number)=>!!pad.buttons[i]?.pressed;
    return [(pad.axes[0]||0)<-.4||b(14),(pad.axes[0]||0)>.4||b(15),(pad.axes[1]||0)<-.4||b(12),(pad.axes[1]||0)>.4||b(13),b(0)||b(2),b(1)||b(3),b(5),b(7)||b(6),b(4)];
  }
  public getPlayerInput(playerIndex: 1 | 2, facingRight: boolean): PlayerInput {
    const cached=this.cached.get(playerIndex); if(cached) return cached;
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

    if (gamepad) {
      const a=this.padActions(gamepad), old=this.previousPads[padIndex];
      const pressed=(i:number)=>a[i]&&!old[i];
      left ||= a[0]; right ||= a[1]; up ||= a[2]; down ||= a[3];
      light ||= a[4]; heavy ||= a[5]; special ||= a[6]; superAttack ||= a[7]; guard ||= a[8];
      leftPressed ||= pressed(0); rightPressed ||= pressed(1); upPressed ||= pressed(2); downPressed ||= pressed(3);
      lightPressed ||= pressed(4); heavyPressed ||= pressed(5); specialPressed ||= pressed(6); superPressed ||= pressed(7); guardPressed ||= pressed(8);
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

    const result: PlayerInput = {
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
    this.cached.set(playerIndex,result);
    if(lightPressed||heavyPressed||specialPressed||superPressed||upPressed||downPressed||leftPressed||rightPressed) {
      const arrows=['','↙','↓','↘','←','·','→','↖','↑','↗'];
      const label=arrows[dir]+(lightPressed?' P':'')+(heavyPressed?' K':'')+(specialPressed?' S':'')+(superPressed?' EX':'');
      this.history[padIndex].unshift(label);this.history[padIndex].length=Math.min(9,this.history[padIndex].length);
    }
    if(result.qcfPressed||result.dpPressed||result.qcbPressed) history.length=0;
    return result;
  }
}
