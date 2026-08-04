// ========================================
// INPUT MANAGER - Simple 2 Player Keyboard Controls
// ========================================

import { Vector2 } from '../utils/Vector2.js';

// Key mappings for each player
const PLAYER1_KEYS = {
    up: ['KeyW'],
    down: ['KeyS'],
    left: ['KeyA'],
    right: ['KeyD'],
    shoot: ['KeyF'],
    super: ['KeyG'],
};

const PLAYER2_KEYS = {
    up: ['ArrowUp'],
    down: ['ArrowDown'],
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    shoot: ['ShiftRight'],
    super: ['Enter'],
};

const PREVENTED_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space', 'ShiftRight', 'Enter',
]);

class PlayerInput {
    constructor(keyConfig) {
        this.keyConfig = keyConfig;

        // Movement state
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        // Action state
        this.shootPressed = false;
        this.superPressed = false;

        // Direction vectors
        this.moveDirection = new Vector2(0, 0);
        this.aimDirection = new Vector2(1, 0); // Current aiming direction
        this.lastMoveDirection = new Vector2(1, 0); // Remembers last non-zero movement
    }

    handleKeyDown(code) {
        // Movement
        if (this.keyConfig.up.includes(code)) this.keys.up = true;
        if (this.keyConfig.down.includes(code)) this.keys.down = true;
        if (this.keyConfig.left.includes(code)) this.keys.left = true;
        if (this.keyConfig.right.includes(code)) this.keys.right = true;

        // Shoot
        if (this.keyConfig.shoot.includes(code)) this.shootPressed = true;

        // Super
        if (this.keyConfig.super.includes(code)) this.superPressed = true;
    }

    handleKeyUp(code) {
        // Movement
        if (this.keyConfig.up.includes(code)) this.keys.up = false;
        if (this.keyConfig.down.includes(code)) this.keys.down = false;
        if (this.keyConfig.left.includes(code)) this.keys.left = false;
        if (this.keyConfig.right.includes(code)) this.keys.right = false;

        // Shoot
        if (this.keyConfig.shoot.includes(code)) this.shootPressed = false;

        // Super
        if (this.keyConfig.super.includes(code)) this.superPressed = false;
    }

    update() {
        // Calculate move direction
        let x = 0;
        let y = 0;

        if (this.keys.left) x -= 1;
        if (this.keys.right) x += 1;
        if (this.keys.up) y -= 1;
        if (this.keys.down) y += 1;

        if (x !== 0 || y !== 0) {
            this.moveDirection = new Vector2(x, y).normalize();
            this.lastMoveDirection = this.moveDirection.clone();
            // In simplified controls, movement direction is also the aiming direction
            this.aimDirection = this.moveDirection.clone();
        } else {
            this.moveDirection = new Vector2(0, 0);
            // If not moving, stay aiming in the last moved direction
            this.aimDirection = this.lastMoveDirection.clone();
        }
    }

    getMoveDirection() {
        return this.moveDirection.clone();
    }

    getAimDirection() {
        return this.aimDirection.clone();
    }

    isShootPressed() {
        return this.shootPressed;
    }

    isSuperPressed() {
        return this.superPressed;
    }

    consumeSuper() {
        this.superPressed = false;
    }
}

export class InputManager {
    constructor(game) {
        this.game = game;

        // Create input handlers for each player
        this.player1Input = new PlayerInput(PLAYER1_KEYS);
        this.player2Input = new PlayerInput(PLAYER2_KEYS);

        this.handleKeyDown = this.onKeyDown.bind(this);
        this.handleKeyUp = this.onKeyUp.bind(this);
        this.preventGameKeyDefaults = this.preventGameKeyDefaults.bind(this);

        this.init();
    }

    init() {
        // Hide mobile controls
        const moveJoystick = document.getElementById('move-joystick');
        const attackJoystick = document.getElementById('attack-joystick');
        const superBtn = document.getElementById('super-button');

        if (moveJoystick) moveJoystick.style.display = 'none';
        if (attackJoystick) attackJoystick.style.display = 'none';
        if (superBtn) superBtn.style.display = 'none';

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('keydown', this.preventGameKeyDefaults);

        // Show control hints
        this.showControlHints();
    }

    showControlHints() {
        const controlsContainer = document.getElementById('controls');
        if (controlsContainer) {
            controlsContainer.innerHTML = `
                <div class="control-hints">
                    <div class="player-controls p1">
                        <div class="player-label">🔵 P1 (Blue Team)</div>
                        <div class="keys"><b>WASD</b> 이동/조준</div>
                        <div class="keys"><b>F</b> 슈팅 | <b>G</b> 궁극기</div>
                    </div>
                    <div class="pause-hint">
                        <div class="keys"><b>ESC</b> 일시정지</div>
                    </div>
                    <div class="player-controls p2 ${this.game.teamMode === 'same' ? 'same-team' : ''}">
                        <div class="player-label">${this.game.teamMode === 'same' ? '🔵' : '🔴'} P2 (${this.game.teamMode === 'same' ? 'Blue' : 'Red'} Team)</div>
                        <div class="keys"><b>방향키</b> 이동/조준</div>
                        <div class="keys"><b>R-Shift</b> 슈팅 | <b>Enter</b> 궁극기</div>
                    </div>
                </div>
            `;
        }
    }

    onKeyDown(e) {
        if (e.repeat) return;

        // ESC 키로 일시정지 토글
        if (e.code === 'Escape') {
            this.game.togglePause();
            return;
        }

        this.player1Input.handleKeyDown(e.code);
        this.player2Input.handleKeyDown(e.code);
    }

    onKeyUp(e) {
        this.player1Input.handleKeyUp(e.code);
        this.player2Input.handleKeyUp(e.code);
    }

    preventGameKeyDefaults(event) {
        if (PREVENTED_KEYS.has(event.code)) event.preventDefault();
    }

    update() {
        this.player1Input.update();
        this.player2Input.update();
    }

    getPlayerInput(playerNumber) {
        if (playerNumber === 1) return this.player1Input;
        if (playerNumber === 2) return this.player2Input;
        throw new RangeError(`Unsupported player number: ${playerNumber}`);
    }

    getMoveDirection(playerNumber) {
        return this.getPlayerInput(playerNumber).getMoveDirection();
    }

    getAttackDirection(playerNumber) {
        return this.getPlayerInput(playerNumber).getAimDirection();
    }

    getIsAttacking(playerNumber) {
        return this.getPlayerInput(playerNumber).isShootPressed();
    }

    isSuperPressed(playerNumber) {
        return this.getPlayerInput(playerNumber).isSuperPressed();
    }

    consumeSuper(playerNumber) {
        this.getPlayerInput(playerNumber).consumeSuper();
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('keydown', this.preventGameKeyDefaults);
        document.getElementById('controls')?.replaceChildren();
    }
}
