import test from 'node:test';
import assert from 'node:assert/strict';

import { BRAWLER_CLASSES } from '../js/entities/brawlers/index.js';
import { BRAWLERS } from '../js/utils/constants.js';

test('poco, shelly, and gene are replaced with rico and dynamike', () => {
    const brawlerIds = Object.values(BRAWLERS).map(brawler => brawler.id);

    assert.equal(brawlerIds.includes('poco'), false);
    assert.equal(brawlerIds.includes('shelly'), false);
    assert.equal(brawlerIds.includes('gene'), false);
    assert.equal(brawlerIds.includes('dynamike'), true);
    assert.equal(brawlerIds.includes('brock'), true);
    assert.equal(brawlerIds.includes('rico'), true);
    assert.equal(BRAWLER_CLASSES.poco, undefined);
    assert.equal(BRAWLER_CLASSES.shelly, undefined);
    assert.equal(BRAWLER_CLASSES.gene, undefined);
    assert.equal(typeof BRAWLER_CLASSES.dynamike, 'function');
    assert.equal(typeof BRAWLER_CLASSES.brock, 'function');
    assert.equal(typeof BRAWLER_CLASSES.rico, 'function');
});

test('brock has a distinct lobby and in-game icon from bea', () => {
    assert.notEqual(BRAWLERS.BROCK.emoji, BRAWLERS.BEA.emoji);
});

test('brawlers have non-overlapping strategic stat identities', () => {
    const roster = BRAWLERS;
    const roles = Object.values(roster).map(brawler => brawler.role);

    assert.equal(new Set(roles).size, roles.length);

    assert.equal(roster.BROCK.attackRange, Math.max(...Object.values(roster).map(brawler => brawler.attackRange)));
    assert.ok(roster.BROCK.attackDamage > roster.DYNAMIKE.attackDamage);
    assert.ok(roster.BROCK.ammoReloadTime > roster.COLT.ammoReloadTime);

    assert.equal(roster.BEA.ammoMax, 3);
    assert.ok(roster.BEA.attackRange > roster.SPIKE.attackRange);
    assert.ok(roster.BEA.attackDamage < roster.BROCK.attackDamage);

    assert.equal(roster.COLT.speed, Math.max(...Object.values(roster).map(brawler => brawler.speed)));
    assert.ok(roster.COLT.attackProjectiles > roster.BROCK.attackProjectiles);
    assert.ok(roster.COLT.attackDamage < roster.SPIKE.attackDamage);

    assert.ok(roster.DYNAMIKE.explosionRadius > roster.BROCK.rocketExplosionRadius);
    assert.ok(roster.DYNAMIKE.fuseTime > 650);
    assert.ok(roster.BEA.health < roster.BROCK.health);

    assert.ok(roster.SPIKE.superRadius > roster.DYNAMIKE.superRadius);
    assert.ok(roster.SPIKE.superDamagePerSecond < roster.BROCK.attackDamage);
    assert.ok(roster.SPIKE.superBurstSpikes <= 8);

    assert.ok(roster.RICO.attackRange > roster.BEA.attackRange);
    assert.ok(roster.RICO.maxBounces === 2);
    assert.ok(roster.RICO.ammoReloadTime < roster.BROCK.ammoReloadTime);
});

test('brock super burst is capped below three direct rocket hits', () => {
    const brock = BRAWLERS.BROCK;
    const maxSuperBurst = brock.attackDamage * 2.5;

    assert.ok(brock.superRocketCount <= 6);
    assert.ok(brock.superDamage * brock.superRocketCount <= maxSuperBurst);
});

test('colt needs two complete volleys for a fragile target and three for super', () => {
    const colt = BRAWLERS.COLT;

    assert.equal(colt.attackDamage, 260);
    assert.equal(colt.attackRange, 610);
    assert.ok(colt.attackDamage * colt.attackProjectiles < BRAWLERS.BROCK.health);
    assert.ok(colt.attackDamage * colt.attackProjectiles * 2 >= BRAWLERS.BROCK.health);
    assert.equal(colt.superCharge, colt.attackProjectiles * 3);
});

test('brawlers use the tightened attack cadence while preserving their relative pacing', () => {
    assert.deepEqual(
        Object.fromEntries(Object.entries(BRAWLERS).map(([id, brawler]) => [id, brawler.attackSpeed])),
        {
            BROCK: 850,
            BEA: 600,
            COLT: 500,
            DYNAMIKE: 850,
            SPIKE: 730,
            RICO: 700,
            REX: 1000,
        },
    );

    assert.ok(BRAWLERS.RICO.attackSpeed > BRAWLERS.COLT.attackSpeed);
    assert.ok(BRAWLERS.COLT.attackSpeed < BRAWLERS.BEA.attackSpeed);
    assert.ok(BRAWLERS.BEA.attackSpeed < BRAWLERS.SPIKE.attackSpeed);
    assert.ok(BRAWLERS.SPIKE.attackSpeed < BRAWLERS.BROCK.attackSpeed);
    assert.equal(BRAWLERS.BROCK.attackSpeed, BRAWLERS.DYNAMIKE.attackSpeed);
});

test('Rico replaces the melee slot with bank shots and bounded burst damage', () => {
    assert.equal(BRAWLER_CLASSES.mortis, undefined);
    assert.equal(BRAWLERS.MORTIS, undefined);
    assert.ok(BRAWLERS.RICO.attackDamage * BRAWLERS.RICO.attackProjectiles < BRAWLERS.COLT.attackDamage * BRAWLERS.COLT.attackProjectiles);
    assert.ok(BRAWLERS.RICO.superDamage * BRAWLERS.RICO.superProjectiles < BRAWLERS.COLT.health);
});

test('Bea replaces Nita in the playable roster', () => {
    assert.equal(BRAWLER_CLASSES.nita, undefined);
    assert.equal(BRAWLERS.NITA, undefined);
    assert.equal(new BRAWLER_CLASSES.bea('blue', 0, 0).config, BRAWLERS.BEA);
});
