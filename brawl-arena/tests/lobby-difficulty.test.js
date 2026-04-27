import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lobby offers exactly two AI difficulty choices', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const difficultyMatches = [...html.matchAll(/data-difficulty="([^"]+)"/g)].map(match => match[1]);

    assert.deepEqual(difficultyMatches, ['easy', 'hard']);
    assert.equal(html.includes('diff-normal'), false);
});
