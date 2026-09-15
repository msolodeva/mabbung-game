import test from 'node:test';
import assert from 'node:assert/strict';
import { RenderSystem } from '../js/game/RenderSystem.js';
import { VISIBILITY_CONFIG } from '../js/utils/constants.js';
import { Bea } from '../js/entities/brawlers/Bea.js';

test('concealed characters retain a faint body and icon without changing detection state', () => {
    const draws = [];
    const ctx = { globalAlpha: 1,
        save() { this.savedAlpha = this.globalAlpha; },
        restore() { this.globalAlpha = this.savedAlpha; },
        beginPath() {}, arc() {},
        fill() { draws.push(['body', this.globalAlpha]); },
        stroke() {}, fillText(text) { draws.push([text, this.globalAlpha]); },
    };
    for (const team of ['blue', 'red']) {
        const brawler = new Bea(team, 100, 100);
        brawler.isVisible = false;
        RenderSystem.prototype.renderConcealedBrawler.call({ ctx }, brawler);
        assert.equal(brawler.isVisible, false);
        assert.equal(ctx.globalAlpha, 1);
        assert.deepEqual(draws.slice(-2), [['body', VISIBILITY_CONFIG.CONCEALED_OPACITY], [brawler.config.emoji, VISIBILITY_CONFIG.CONCEALED_OPACITY]]);
    }
    assert.ok(VISIBILITY_CONFIG.CONCEALED_OPACITY > 0 && VISIBILITY_CONFIG.CONCEALED_OPACITY < 0.5);
});
