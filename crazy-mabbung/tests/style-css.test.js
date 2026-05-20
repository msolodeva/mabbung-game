import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

test('menu button has a valid pressed state rule', () => {
    const activeRule = css.match(/#menu-btn:active\s*\{(?<body>[^}]+)\}/);

    assert.ok(activeRule);
    assert.match(activeRule.groups.body, /transform\s*:\s*translateY\(2px\)/);
    assert.match(activeRule.groups.body, /box-shadow\s*:\s*0 2px 0 #2472b6/);
});

test('game stage scales to smaller viewports', () => {
    assert.match(css, /--stage-width:\s*1088px/);
    assert.match(css, /--stage-fit-width:\s*min\(var\(--stage-width\), calc\(100vw - 24px\)\)/);
    assert.match(css, /--stage-fit-height:\s*calc\(100vh - 128px\)/);
    assert.match(css, /width:\s*min\(var\(--stage-fit-width\), calc\(var\(--stage-fit-height\) \* 1\.133333\)\)/);
    assert.match(css, /aspect-ratio:\s*1088\s*\/\s*960/);
    assert.match(css, /overflow-x:\s*hidden/);
    assert.doesNotMatch(css, /overflow:\s*hidden/);
});

test('selection screen has compact responsive rules and map thumbnail labels', () => {
    assert.match(css, /\.map-title\s*\{/);
    assert.match(css, /#game-container:has\(#char-select-modal:not\(\.hidden\)\)/);
    assert.match(css, /min-height:\s*min\(var\(--stage-height\), calc\(100vh - 128px\)\)/);
    assert.match(css, /@media\s*\(max-width:\s*720px\)/);
    assert.match(css, /@media\s*\(max-height:\s*760px\)/);
    assert.match(css, /grid-template-columns:\s*repeat\(auto-fit, minmax\(72px, 1fr\)\)/);
    assert.match(css, /grid-template-columns:\s*repeat\(8, minmax\(48px, 1fr\)\)/);
});
