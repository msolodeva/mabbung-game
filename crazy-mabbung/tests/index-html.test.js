import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('page declares a favicon so browsers do not request missing favicon.ico', () => {
    assert.match(html, /<link\s+rel="icon"\s+href="data:,[^"]*"\s*\/?>/);
});
