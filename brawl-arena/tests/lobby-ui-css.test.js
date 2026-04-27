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
