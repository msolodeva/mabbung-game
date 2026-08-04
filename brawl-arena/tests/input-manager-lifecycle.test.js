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
