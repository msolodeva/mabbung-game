import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lobby offers low and high AI intelligence choices for each team', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const blueDifficultyMatches = [...html.matchAll(/data-team="blue" data-difficulty="([^"]+)"/g)].map(match => match[1]);
    const redDifficultyMatches = [...html.matchAll(/data-team="red" data-difficulty="([^"]+)"/g)].map(match => match[1]);

    assert.deepEqual(blueDifficultyMatches, ['easy', 'hard']);
    assert.deepEqual(redDifficultyMatches, ['easy', 'hard']);
    assert.equal(html.includes('difficulty-team-columns'), true);
    assert.equal(html.includes('team-difficulty-panel blue left'), true);
    assert.equal(html.includes('team-difficulty-panel red right'), true);
    assert.equal(html.includes('팀별 AI 지능'), true);
    assert.equal(html.includes('낮은 지능'), true);
    assert.equal(html.includes('높은 지능'), true);
    assert.equal(html.includes('blue-difficulty-desc'), true);
    assert.equal(html.includes('red-difficulty-desc'), true);
    assert.equal(html.includes('팀별 AI 난이도'), false);
    assert.equal(html.includes('diff-normal'), false);
});
