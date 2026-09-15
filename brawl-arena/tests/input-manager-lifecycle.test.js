import test from 'node:test';
import assert from 'node:assert/strict';

import { InputManager } from '../js/input/InputManager.js';

function createDocumentStub() {
    const listeners = new Map();
    const controls = {
        innerHTML: '',
        cleared: false,
        replaceChildren() {
            this.innerHTML = '';
            this.cleared = true;
        },
    };

    return {
        listeners,
        controls,
        addEventListener(type, listener) {
            const registered = listeners.get(type) ?? new Set();
            registered.add(listener);
            listeners.set(type, registered);
        },
        removeEventListener(type, listener) {
            listeners.get(type)?.delete(listener);
        },
        getElementById(id) {
            return id === 'controls' ? controls : null;
        },
    };
}

test('input manager releases document listeners and generated controls', () => {
    const originalDocument = globalThis.document;
    const documentStub = createDocumentStub();
    globalThis.document = documentStub;

    try {
        const manager = new InputManager({ teamMode: 'vs', togglePause() {} });

        assert.equal(documentStub.listeners.get('keydown').size, 2);
        assert.equal(documentStub.listeners.get('keyup').size, 1);
        assert.match(documentStub.controls.innerHTML, /P1 \(Blue Team\)/);

        manager.cleanup();

        assert.equal(documentStub.listeners.get('keydown').size, 0);
        assert.equal(documentStub.listeners.get('keyup').size, 0);
        assert.equal(documentStub.controls.cleared, true);
    } finally {
        globalThis.document = originalDocument;
    }
});

test('input manager exposes one indexed API for both players', () => {
    const originalDocument = globalThis.document;
    globalThis.document = createDocumentStub();

    try {
        const manager = new InputManager({ teamMode: 'same', togglePause() {} });
        manager.player2Input.handleKeyDown('ArrowRight');
        manager.update();

        assert.equal(manager.getMoveDirection(2).x, 1);
        assert.match(globalThis.document.controls.innerHTML, /P2 \(Blue Team\)/);
        assert.throws(() => manager.getMoveDirection(3), RangeError);
        manager.cleanup();
    } finally {
        globalThis.document = originalDocument;
    }
});

test('blur and hidden tab release both players and detach on cleanup', () => {
    const originalDocument = globalThis.document;
    const doc = createDocumentStub();
    const win = createDocumentStub();
    doc.defaultView = win;
    globalThis.document = doc;
    try {
        const manager = new InputManager({ teamMode: 'vs' });
        for (const event of ['blur', 'visibilitychange']) {
            for (const code of ['KeyW', 'KeyF', 'KeyG', 'ArrowRight', 'ShiftRight', 'Enter']) manager.onKeyDown({ code });
            manager.update();
            doc.hidden = true;
            const source = event === 'blur' ? win : doc;
            for (const listener of source.listeners.get(event)) listener();
            manager.update();
            for (const player of [1, 2]) {
                assert.equal(manager.getMoveDirection(player).magnitude(), 0);
                assert.equal(manager.getIsAttacking(player), false);
                assert.equal(manager.isSuperPressed(player), false);
            }
        }
        manager.cleanup();
        assert.equal(win.listeners.get('blur').size, 0);
        assert.equal(doc.listeners.get('visibilitychange').size, 0);
    } finally { globalThis.document = originalDocument; }
});

test('both keyboard players lock aim on attack press and can retreat while firing', () => {
    const original = globalThis.document;
    globalThis.document = createDocumentStub();
    try {
        const manager = new InputManager({ teamMode: 'vs' });
        for (const [number, forward, back, shoot] of [
            [1, 'KeyW', 'KeyS', 'KeyF'], [2, 'ArrowUp', 'ArrowDown', 'ShiftRight'],
        ]) {
            const input = manager.getPlayerInput(number);
            // No frame between direction and attack: lock still captures the new direction.
            input.handleKeyDown(forward);
            input.handleKeyDown(shoot);
            input.handleKeyUp(forward);
            input.handleKeyDown(back);
            input.update();
            assert.equal(input.getMoveDirection().y, 1);
            assert.equal(input.getAimDirection().y, -1);
            input.update();
            assert.equal(input.getAimDirection().y, -1);
            input.handleKeyUp(shoot);
            input.update();
            assert.equal(input.getAimDirection().y, 1);
            input.reset();
            assert.equal(input.isShootPressed(), false);
        }
        manager.cleanup();
    } finally { globalThis.document = original; }
});
