// ========================================
// MAIN - Entry Point (2 Player Mode)
// ========================================

import { Game } from './game/Game.js';
import { BRAWLERS, AI_DIFFICULTY } from './utils/constants.js';
import { MAPS } from './map/mapData.js';

class BrawlArena {
    constructor() {
        this.game = null;
        this.player1Brawler = 'brock';
        this.player2Brawler = 'colt';
        this.brawlerIds = Object.values(BRAWLERS).map(b => b.id);
        this.selectedMapId = 'open'; // Default map
        this.selectedTeamDifficulties = {
            blue: AI_DIFFICULTY.EASY,
            red: AI_DIFFICULTY.HARD,
        };
        this.teamMode = 'vs'; // 'vs' or 'same'

        this.init();
    }

    init() {
        console.log('Brawl Arena Initializing...');
        this.setupLobby();
        this.setupMapSelection();
        this.setupDifficultySelection();
        this.setupTeamModeToggle();
        this.setupEventListeners();
    }

    setupMapSelection() {
        const mapSelector = document.getElementById('map-selector');
        if (!mapSelector) return;

        mapSelector.innerHTML = '';
        Object.values(MAPS).forEach(map => {
            const el = document.createElement('div');
            el.className = `map-option ${map.id === this.selectedMapId ? 'selected' : ''}`;
            el.dataset.mapId = map.id;
            el.onclick = () => this.selectMap(map.id);

            el.innerHTML = `
                <div class="map-preview ${map.id}"></div>
                <div class="map-option-name">${map.name}</div>
            `;
            mapSelector.appendChild(el);
        });

        this.updateMapInfo();
    }

    selectMap(mapId) {
        this.selectedMapId = mapId;

        // Update UI
        document.querySelectorAll('.map-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.mapId === mapId);
        });

        this.updateMapInfo();
    }

    updateMapInfo() {
        const map = MAPS[this.selectedMapId];
        document.getElementById('selected-map-name').textContent = map.name;
        document.getElementById('selected-map-desc').textContent = map.description;
    }

    setupDifficultySelection() {
        const difficulties = {
            easy: AI_DIFFICULTY.EASY,
            hard: AI_DIFFICULTY.HARD,
        };

        const difficultyDescriptions = {
            easy: '느린 반응과 단순한 무빙',
            hard: '전략적 압박과 거리 조절',
        };

        document.querySelectorAll('.difficulty-btn[data-team][data-difficulty]').forEach(btn => {
            const team = btn.dataset.team;
            const difficultyId = btn.dataset.difficulty;
            if (!team || !difficultyId || !difficulties[difficultyId]) return;

            btn.addEventListener('click', () => {
                document.querySelectorAll(`.difficulty-btn[data-team="${team}"]`).forEach(teamBtn => {
                    teamBtn.classList.remove('active');
                });

                btn.classList.add('active');

                const desc = document.getElementById(`${team}-difficulty-desc`);
                if (desc) desc.textContent = difficultyDescriptions[difficultyId];

                this.selectedTeamDifficulties[team] = difficulties[difficultyId];
            });
        });
    }

    setupTeamModeToggle() {
        const vsBtn = document.getElementById('mode-vs');
        const sameBtn = document.getElementById('mode-same');
        if (!vsBtn || !sameBtn) return;

        const updateTeamModeUI = () => {
            const p2Panel = document.querySelector('.player-selection.player2');
            const p2Title = document.querySelector('.player-selection.player2 .player-title');

            if (this.teamMode === 'same') {
                vsBtn.classList.remove('active');
                sameBtn.classList.add('active');
                if (p2Panel) p2Panel.classList.add('same-team');
                if (p2Title) p2Title.textContent = '🔵 PLAYER 2';
            } else {
                sameBtn.classList.remove('active');
                vsBtn.classList.add('active');
                if (p2Panel) p2Panel.classList.remove('same-team');
                if (p2Title) p2Title.textContent = '🔴 PLAYER 2';
            }
        };

        vsBtn.addEventListener('click', () => {
            this.teamMode = 'vs';
            updateTeamModeUI();
        });

        sameBtn.addEventListener('click', () => {
            this.teamMode = 'same';
            updateTeamModeUI();
        });
    }

    startGame() {
        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        const canvas = document.getElementById('game-canvas');
        const mapData = MAPS[this.selectedMapId];
        this.game = new Game(canvas, this.player1Brawler, this.player2Brawler, mapData, this.teamMode, this.selectedTeamDifficulties);
        this.game.init();
        this.game.start();
    }
    setupLobby() {
        const player1Grid = document.getElementById('player1-brawler-grid');
        const player2Grid = document.getElementById('player2-brawler-grid');

        if (!player1Grid || !player2Grid) {
            console.error('Brawler grids not found in DOM! Check index.html ids.');
            return;
        }

        player1Grid.innerHTML = '';
        player2Grid.innerHTML = '';

        // Create brawler selection cards for both players
        Object.values(BRAWLERS).forEach(brawler => {
            const card1 = this.createBrawlerCard(brawler, 1);
            player1Grid.appendChild(card1);

            const card2 = this.createBrawlerCard(brawler, 2);
            player2Grid.appendChild(card2);
        });

        // Select default brawlers
        this.selectBrawler(1, 'brock');
        this.selectBrawler(2, 'colt');
    }

    createBrawlerCard(brawler, playerNum) {
        const card = document.createElement('div');
        card.className = `brawler-card ${brawler.id}`;
        card.dataset.brawlerId = brawler.id;
        card.dataset.player = playerNum;

        card.innerHTML = `
            <div class="brawler-icon">${brawler.emoji}</div>
            <div class="brawler-name">${brawler.name}</div>
        `;

        card.addEventListener('click', () => this.selectBrawler(playerNum, brawler.id));
        return card;
    }

    selectBrawler(playerNum, brawlerId) {
        if (playerNum === 1) {
            this.player1Brawler = brawlerId;
        } else {
            this.player2Brawler = brawlerId;
        }

        const brawler = BRAWLERS[brawlerId.toUpperCase()];
        const gridId = playerNum === 1 ? 'player1-brawler-grid' : 'player2-brawler-grid';
        const statsId = playerNum === 1 ? 'player1-stats' : 'player2-stats';

        // Update card selection
        document.querySelectorAll(`#${gridId} .brawler-card`).forEach(card => {
            card.classList.toggle('selected', card.dataset.brawlerId === brawlerId);
        });

        // Update stats display
        const stats = document.getElementById(statsId);
        if (stats) {
            const healthPercent = (brawler.health / 5000) * 100;
            const damagePercent = (brawler.attackDamage / 1000) * 100;
            const rangePercent = (brawler.attackRange / 600) * 100;

            stats.innerHTML = `
                <div class="selected-brawler-header">
                    <div class="selected-brawler-emoji pulse-animation">${brawler.emoji}</div>
                    <div class="selected-brawler-name-container">
                        <div class="selected-brawler-name">${brawler.name}</div>
                        <div class="stat-description">${brawler.description}</div>
                    </div>
                </div>
                <div class="stats-container-detailed">
                    <div class="stat-row-detailed">
                        <div class="stat-label">❤️ 체력 (Health)</div>
                        <div class="stat-value-container">
                            <div class="stat-bar"><div class="stat-fill health" style="width: ${healthPercent}%"></div></div>
                            <span class="stat-number">${brawler.health}</span>
                        </div>
                    </div>
                    <div class="stat-row-detailed">
                        <div class="stat-label">⚔️ 공격력 (Damage)</div>
                        <div class="stat-value-container">
                            <div class="stat-bar"><div class="stat-fill damage" style="width: ${damagePercent}%"></div></div>
                            <span class="stat-number">${brawler.attackDamage}</span>
                        </div>
                    </div>
                    <div class="stat-row-detailed">
                        <div class="stat-label">🎯 사거리 (Range)</div>
                        <div class="stat-value-container">
                            <div class="stat-bar"><div class="stat-fill range" style="width: ${rangePercent}%"></div></div>
                            <span class="stat-number">${brawler.attackRange}</span>
                        </div>
                    </div>
                    <div class="stat-row-detailed">
                        <div class="stat-label">🏃 이동 속도 (Speed)</div>
                        <div class="stat-value-container">
                            <div class="stat-bar"><div class="stat-fill speed" style="width: ${(brawler.speed / 320) * 100}%"></div></div>
                            <span class="stat-number">${brawler.speed}</span>
                        </div>
                    </div>
                </div>
                <div class="super-container-detailed">
                    <div class="super-label">ULTIMATE (궁극기)</div>
                    <div class="super-description">${brawler.superDescription || ''}</div>
                </div>
            `;
        }
    }

    setupEventListeners() {
        const playBtn = document.getElementById('play-button');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        const playAgainBtn = document.getElementById('play-again-button');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.returnToLobby();
            });
        }

        // Add keyboard navigation for brawler selection
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        // Only handle if lobby screen is visible
        const lobbyScreen = document.getElementById('lobby-screen');
        if (lobbyScreen.classList.contains('hidden')) return;

        // Player 1 (WASD)
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            this.navigateBrawler(1, e.code);
        }

        // Player 2 (Arrows)
        if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
            this.navigateBrawler(2, e.code);
        }

        // Space or Enter to Start
        if (e.code === 'Space' || e.code === 'Enter') {
            this.startGame();
        }
    }

    navigateBrawler(playerNum, keyCode) {
        const currentBrawlerId = playerNum === 1 ? this.player1Brawler : this.player2Brawler;
        const currentIndex = this.brawlerIds.indexOf(currentBrawlerId);
        let newIndex = currentIndex;

        const gridCols = 3; // Number of columns in the grid view (visual)

        switch (keyCode) {
            case 'KeyA':
            case 'ArrowLeft':
                newIndex = (currentIndex - 1 + this.brawlerIds.length) % this.brawlerIds.length;
                break;
            case 'KeyD':
            case 'ArrowRight':
                newIndex = (currentIndex + 1) % this.brawlerIds.length;
                break;
            case 'KeyW':
            case 'ArrowUp':
                newIndex = (currentIndex - gridCols + this.brawlerIds.length) % this.brawlerIds.length;
                break;
            case 'KeyS':
            case 'ArrowDown':
                newIndex = (currentIndex + gridCols) % this.brawlerIds.length;
                break;
        }

        if (newIndex !== currentIndex) {
            this.selectBrawler(playerNum, this.brawlerIds[newIndex]);
        }
    }

    // Old startGame replaced by the one above

    returnToLobby() {
        if (this.game) {
            this.game.cleanup();
            this.game = null;
        }

        document.getElementById('result-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('lobby-screen').classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BrawlArena();
});
