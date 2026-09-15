import test from 'node:test';
import assert from 'node:assert/strict';
import { LobbyController } from '../js/app/LobbyController.js';
import { MAPS } from '../js/map/mapData.js';
import { AI_DIFFICULTY } from '../js/utils/constants.js';

test('lobby defaults to cooperative teams and normal AI for both teams', () => {
    const lobby = new LobbyController({ documentRef: {}, windowRef: {} });
    const options = lobby.getGameOptions();
    assert.equal(options.teamMode, 'same');
    assert.equal(options.aiDifficultiesByTeam.blue, AI_DIFFICULTY.NORMAL);
    assert.equal(options.aiDifficultiesByTeam.red, AI_DIFFICULTY.NORMAL);
    assert.equal(lobby.selection.mapId, 'random');
});

test('random selection can choose every arena and rerolls for each start', () => {
    const maps = Object.values(MAPS);
    let sample = 0;
    const lobby = new LobbyController({ documentRef: {}, windowRef: {}, randomFn: () => sample });
    for (let i = 0; i < maps.length; i++) {
        sample = (i + 0.5) / maps.length;
        assert.equal(lobby.getGameOptions().mapData, maps[i]);
        assert.equal(lobby.selection.mapId, 'random');
    }
    lobby.selection.mapId = 'open';
    assert.equal(lobby.getGameOptions().mapData, MAPS.open);
});
