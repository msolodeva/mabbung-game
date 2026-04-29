import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lobby offers low, medium, and high AI intelligence choices for each team', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const blueDifficultyMatches = [...html.matchAll(/data-team="blue" data-difficulty="([^"]+)"/g)].map(match => match[1]);
    const redDifficultyMatches = [...html.matchAll(/data-team="red" data-difficulty="([^"]+)"/g)].map(match => match[1]);

    assert.deepEqual(blueDifficultyMatches, ['easy', 'normal', 'hard']);
    assert.deepEqual(redDifficultyMatches, ['easy', 'normal', 'hard']);
    assert.equal(html.includes('difficulty-team-columns'), true);
    assert.equal(html.includes('team-difficulty-panel blue left'), true);
    assert.equal(html.includes('team-difficulty-panel red right'), true);
    assert.equal(html.includes('팀별 AI 지능'), true);
    assert.equal(html.includes('BLUE 팀'), true);
    assert.equal(html.includes('RED 팀'), true);
    assert.equal(html.includes('낮음'), true);
    assert.equal(html.includes('보통'), true);
    assert.equal(html.includes('높음'), true);
    assert.equal(html.includes('blue-difficulty-desc'), false);
    assert.equal(html.includes('red-difficulty-desc'), false);
    assert.equal(html.includes('팀별 AI 난이도'), false);
});
