import test from 'node:test';
import assert from 'node:assert/strict';

import { Map, MAP_THEMES } from '../src/core/Map.js';

test('map themes define distinct visual identities', () => {
    const themes = Object.values(MAP_THEMES);
    const floorPatterns = new Set();
    const ambientEffects = new Set();

    for (const theme of themes) {
        assert.ok(theme.visual);
        assert.match(theme.visual.accent, /^#[0-9a-f]{6}$/i);
        assert.ok(theme.visual.floorPattern.length > 0);
        assert.ok(theme.visual.ambient.length > 0);
        assert.ok(theme.visual.detailColor.length > 0);

        floorPatterns.add(theme.visual.floorPattern);
        ambientEffects.add(theme.visual.ambient);
    }

    assert.equal(floorPatterns.size, themes.length);
    assert.equal(ambientEffects.size, themes.length);
});

test('map exposes deterministic tile visual variants from theme and position', () => {
    const forest = new Map(64, 17, 15, MAP_THEMES.FOREST);
    const volcano = new Map(64, 17, 15, MAP_THEMES.VOLCANO);

    assert.equal(typeof forest.getTileVisualVariant, 'function');

    const forestTile = forest.getTileVisualVariant(4, 5, 0);
    const volcanoTile = volcano.getTileVisualVariant(4, 5, 0);
    const repeatedForestTile = forest.getTileVisualVariant(4, 5, 0);

    assert.deepEqual(forestTile, repeatedForestTile);
    assert.equal(forestTile.floorPattern, 'leaf-speckles');
    assert.equal(volcanoTile.floorPattern, 'ember-cracks');
    assert.notEqual(forestTile.detailColor, volcanoTile.detailColor);
});
