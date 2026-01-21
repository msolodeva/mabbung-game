// ========================================
// INPUT MANAGER - Keyboard & Mouse Controls
// ========================================

import { Vector2 } from '../utils/Vector2.js';

export class InputManager {
    constructor(game) {
        this.game = game;

        // Keyboard state (WASD/Arrow keys)
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        // Mouse state
        this.mouse = {
            position: new Vector2(0, 0),
            worldPosition: new Vector2(0, 0),
            isDown: false,
            button: 0,
        };

        // Attack state
        this.isAttacking = false;
        this.attackDirection = new Vector2(1, 0);

        // Super button
        this.superButton = {
            element: null,
            pressed: false,
        };

        // Touch joysticks (for mobile fallback)
        this.moveJoystick = {
            active: false,
            touchId: null,
            startPos: new Vector2(0, 0),
            currentPos: new Vector2(0, 0),
            direction: new Vector2(0, 0),
            element: null,
            thumb: null,
        };

        this.init();
    }

    init() {
        // Get DOM elements
        this.moveJoystick.element = document.getElementById('move-joystick');
        this.moveJoystick.thumb = this.moveJoystick.element?.querySelector('.joystick-thumb');
        this.superButton.element = document.getElementById('super-button');

        // Get canvas for mouse position calculations
        this.canvas = document.getElementById('game-canvas');

        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // Mouse events
        this.canvas?.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas?.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas?.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas?.addEventListener('mouseleave', this.onMouseUp.bind(this));

        // Prevent context menu on right click
        this.canvas?.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch events (for mobile)
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });

        // Super button
        if (this.superButton.element) {
            this.superButton.element.addEventListener('click', () => {
                if (!this.superButton.element.disabled) {
                    this.game.onSuperButtonPressed();
                }
            });
        }

        // Space bar for super
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                if (this.game.player?.superReady) {
                    this.game.onSuperButtonPressed();
                }
            }
        });

        // Hide mobile joystick on desktop
        this.detectInputMode();
    }

    detectInputMode() {
        // Check if touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Hide/show appropriate controls
        const attackJoystick = document.getElementById('attack-joystick');
        if (attackJoystick) {
            // Always hide attack joystick on desktop - use mouse instead
            if (!isTouchDevice) {
                attackJoystick.style.display = 'none';
            }
        }

        // Show keyboard hint on desktop
        if (!isTouchDevice && this.moveJoystick.element) {
            this.moveJoystick.element.innerHTML = `
                <div style="text-align: center; color: white; font-size: 12px; opacity: 0.8;">
                    <div style="margin-bottom: 5px;">⌨️ WASD</div>
                    <div>🖱️ Click to shoot</div>
                    <div>SPACE for Super</div>
                </div>
            `;
        }
    }

    // ========================================
    // KEYBOARD HANDLING
    // ========================================

    onKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
        }
    }

    // ========================================
    // MOUSE HANDLING
    // ========================================

    onMouseDown(e) {
        this.mouse.isDown = true;
        this.mouse.button = e.button;
        this.updateMousePosition(e);

        // Start attacking on left click
        if (e.button === 0) {
            this.isAttacking = true;
            this.calculateAttackDirection();

            // Fire immediately on click
            if (this.game.player?.isAlive && this.game.player?.canAttack()) {
                this.game.onAttackRelease(this.attackDirection);
            }
        }
    }

    onMouseMove(e) {
        this.updateMousePosition(e);

        // Update attack direction while mouse is down
        if (this.mouse.isDown && this.mouse.button === 0) {
            this.calculateAttackDirection();
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.isAttacking = false;
        }
        this.mouse.isDown = false;
    }

    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.position.set(
            e.clientX - rect.left,
            e.clientY - rect.top
        );

        // Calculate world position
        if (this.game.camera) {
            this.mouse.worldPosition.set(
                this.mouse.position.x + this.game.camera.x,
                this.mouse.position.y + this.game.camera.y
            );
        }
    }

    calculateAttackDirection() {
        if (!this.game.player) return;

        // Direction from player to mouse world position
        const playerPos = this.game.player.position;
        this.attackDirection = this.mouse.worldPosition.subtract(playerPos).normalize();
    }

    // ========================================
    // TOUCH HANDLING (Mobile Fallback)
    // ========================================

    onTouchStart(e) {
        // Only handle touch on game screen
        if (!this.game || this.game.state !== 'playing') return;

        e.preventDefault();

        for (const touch of e.changedTouches) {
            const touchPos = new Vector2(touch.clientX, touch.clientY);

            // Check if touch is on left side (movement) or right side (attack)
            if (touchPos.x < window.innerWidth / 2) {
                // Movement joystick
                if (!this.moveJoystick.active) {
                    this.activateJoystick(this.moveJoystick, touchPos, touch.identifier);
                }
            } else {
                // Attack - treat like mouse click
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.position.set(touch.clientX - rect.left, touch.clientY - rect.top);
                if (this.game.camera) {
                    this.mouse.worldPosition.set(
                        this.mouse.position.x + this.game.camera.x,
                        this.mouse.position.y + this.game.camera.y
                    );
                }
                this.calculateAttackDirection();
                this.isAttacking = true;

                if (this.game.player?.isAlive && this.game.player?.canAttack()) {
                    this.game.onAttackRelease(this.attackDirection);
                }
            }
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const touchPos = new Vector2(touch.clientX, touch.clientY);

            if (this.moveJoystick.touchId === touch.identifier) {
                this.updateJoystick(this.moveJoystick, touchPos);
            }
        }
    }

    onTouchEnd(e) {
        for (const touch of e.changedTouches) {
            if (this.moveJoystick.touchId === touch.identifier) {
                this.deactivateJoystick(this.moveJoystick);
            }
        }
        this.isAttacking = false;
    }

    // ========================================
    // JOYSTICK HELPERS (for mobile)
    // ========================================

    isInsideElement(pos, element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return pos.x >= rect.left && pos.x <= rect.right &&
            pos.y >= rect.top && pos.y <= rect.bottom;
    }

    activateJoystick(joystick, pos, touchId) {
        joystick.active = true;
        joystick.touchId = touchId;
        joystick.startPos = pos.clone();
        joystick.currentPos = pos.clone();
    }

    updateJoystick(joystick, pos) {
        joystick.currentPos = pos.clone();

        const delta = pos.subtract(joystick.startPos);
        const maxDistance = 50;
        const distance = Math.min(delta.magnitude(), maxDistance);

        if (distance > 5) {
            joystick.direction = delta.normalize();
        } else {
            joystick.direction = new Vector2(0, 0);
        }
    }

    deactivateJoystick(joystick) {
        joystick.active = false;
        joystick.touchId = null;
        joystick.direction = new Vector2(0, 0);
    }

    // ========================================
    // PUBLIC METHODS
    // ========================================

    getMoveDirection() {
        // Check keyboard first
        let x = 0;
        let y = 0;

        if (this.keys.left) x -= 1;
        if (this.keys.right) x += 1;
        if (this.keys.up) y -= 1;
        if (this.keys.down) y += 1;

        if (x !== 0 || y !== 0) {
            return new Vector2(x, y).normalize();
        }

        // Fall back to touch joystick
        if (this.moveJoystick.active) {
            return this.moveJoystick.direction.clone();
        }

        return new Vector2(0, 0);
    }

    getAttackDirection() {
        return this.attackDirection.clone();
    }

    getIsAttacking() {
        return this.isAttacking;
    }

    updateSuperButton(isReady) {
        if (this.superButton.element) {
            this.superButton.element.disabled = !isReady;
        }

        // Update super charge fill
        const fillElement = document.getElementById('super-fill');
        if (fillElement && this.game.player) {
            const chargePercent = (this.game.player.superCharge / this.game.player.superChargeMax) * 100;
            fillElement.style.height = `${chargePercent}%`;
        }
    }
}
