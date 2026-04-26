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

test('brawlers have non-overlapping strategic stat identities', () => {
    const roster = BRAWLERS;
    const roles = Object.values(roster).map(brawler => brawler.role);

    assert.equal(new Set(roles).size, roles.length);

    assert.equal(roster.BROCK.attackRange, Math.max(...Object.values(roster).map(brawler => brawler.attackRange)));
    assert.ok(roster.BROCK.attackDamage > roster.DYNAMIKE.attackDamage);
    assert.ok(roster.BROCK.ammoReloadTime > roster.COLT.ammoReloadTime);

    assert.equal(roster.NITA.health, Math.max(...Object.values(roster).map(brawler => brawler.health)));
    assert.ok(roster.NITA.attackRange < roster.SPIKE.attackRange);
    assert.ok(roster.NITA.attackDamage < roster.BROCK.attackDamage);

    assert.equal(roster.COLT.speed, Math.max(...Object.values(roster).map(brawler => brawler.speed)));
    assert.ok(roster.COLT.attackProjectiles > roster.BROCK.attackProjectiles);
    assert.ok(roster.COLT.attackDamage < roster.SPIKE.attackDamage);

    assert.ok(roster.DYNAMIKE.explosionRadius > roster.BROCK.rocketExplosionRadius);
    assert.ok(roster.DYNAMIKE.fuseTime > 650);
    assert.ok(roster.DYNAMIKE.health < roster.NITA.health);

    assert.ok(roster.SPIKE.superRadius > roster.DYNAMIKE.superRadius);
    assert.ok(roster.SPIKE.superDamagePerSecond < roster.BROCK.attackDamage);
    assert.ok(roster.SPIKE.superBurstSpikes <= 8);

    assert.ok(roster.MORTIS.attackRange < roster.NITA.attackRange);
    assert.ok(roster.MORTIS.dashSpeed > 1200);
    assert.ok(roster.MORTIS.ammoReloadTime > roster.BROCK.ammoReloadTime);
});
