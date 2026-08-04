import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('selected brawler description is constrained to one line', () => {
    const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
    const statDescriptionRule = css.match(/\.stat-description\s*\{[^}]+\}/);
    const nameContainerRule = css.match(/\.selected-brawler-name-container\s*\{[^}]+\}/);

    assert.ok(statDescriptionRule, 'expected .stat-description CSS rule');
    assert.ok(nameContainerRule, 'expected .selected-brawler-name-container CSS rule');
    assert.match(nameContainerRule[0], /min-width:\s*0\s*;/);
    assert.match(statDescriptionRule[0], /white-space:\s*nowrap\s*;/);
    assert.match(statDescriptionRule[0], /overflow:\s*hidden\s*;/);
    assert.match(statDescriptionRule[0], /text-overflow:\s*ellipsis\s*;/);
});

test('lobby copy uses clear Korean action labels', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

    assert.equal(html.includes('플레이어 1'), true);
    assert.equal(html.includes('플레이어 2'), true);
    assert.equal(html.includes('전장 선택'), true);
    assert.equal(html.includes('전투 시작'), true);
    assert.equal(html.includes('SELECT BATTLEGROUND'), false);
    assert.equal(html.includes('START BATTLE!'), false);
});

test('lobby keeps brawler stats useful while simplifying AI selection', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const lobbyController = readFileSync(new URL('../js/app/LobbyController.js', import.meta.url), 'utf8');

    assert.equal(html.includes('mode-title'), false);
    assert.equal(lobbyController.includes('stats-container-detailed'), true);
    assert.equal(lobbyController.includes('super-container-detailed'), false);
    assert.equal(html.includes('blue-difficulty-desc'), false);
    assert.equal(html.includes('red-difficulty-desc'), false);
});
