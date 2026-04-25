import test from 'node:test';
import assert from 'node:assert/strict';

import { BRAWLER_CLASSES } from '../js/entities/brawlers/index.js';
import { BRAWLERS } from '../js/utils/constants.js';

test('poco, shelly, and gene are replaced without changing mortis or dynamike', () => {
    const brawlerIds = Object.values(BRAWLERS).map(brawler => brawler.id);

    assert.equal(brawlerIds.includes('poco'), false);
    assert.equal(brawlerIds.includes('shelly'), false);
    assert.equal(brawlerIds.includes('gene'), false);
    assert.equal(brawlerIds.includes('dynamike'), true);
    assert.equal(brawlerIds.includes('brock'), true);
    assert.equal(brawlerIds.includes('mortis'), true);
    assert.equal(BRAWLER_CLASSES.poco, undefined);
    assert.equal(BRAWLER_CLASSES.shelly, undefined);
    assert.equal(BRAWLER_CLASSES.gene, undefined);
    assert.equal(typeof BRAWLER_CLASSES.dynamike, 'function');
    assert.equal(typeof BRAWLER_CLASSES.brock, 'function');
    assert.equal(typeof BRAWLER_CLASSES.mortis, 'function');
});

test('brock has a distinct lobby and in-game icon from nita', () => {
    assert.notEqual(BRAWLERS.BROCK.emoji, BRAWLERS.NITA.emoji);
});
