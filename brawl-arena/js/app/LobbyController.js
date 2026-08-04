import { MAPS } from '../map/mapData.js';
import { AI_DIFFICULTY, BRAWLERS } from '../utils/constants.js';

const DIFFICULTIES_BY_ID = Object.freeze({
    easy: AI_DIFFICULTY.EASY,
    normal: AI_DIFFICULTY.NORMAL,
    hard: AI_DIFFICULTY.HARD,
});

const PLAYER_DEFAULTS = Object.freeze({
    1: 'brock',
    2: 'colt',
});

const STAT_MAXIMUMS = Object.freeze({
    health: 6000,
    attackDamage: 1300,
    attackRange: 650,
});

export class LobbyController {
    constructor({ documentRef = document, windowRef = window, onStart }) {
        this.document = documentRef;
        this.window = windowRef;
        this.onStart = onStart;
        this.brawlers = Object.values(BRAWLERS);
        this.brawlerIds = this.brawlers.map(({ id }) => id);
        this.selection = {
            brawlers: { ...PLAYER_DEFAULTS },
            mapId: 'open',
            teamMode: 'vs',
            difficulties: {
                blue: AI_DIFFICULTY.NORMAL,
                red: AI_DIFFICULTY.HARD,
            },
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    init() {
        this.renderBrawlerGrids();
        this.renderMapOptions();
        this.bindDifficultyButtons();
        this.bindTeamModeButtons();
        this.window.addEventListener('keydown', this.handleKeyDown);
    }

    destroy() {
        this.window.removeEventListener('keydown', this.handleKeyDown);
    }

    getGameOptions() {
        return {
            playerBrawlerIds: [this.selection.brawlers[1], this.selection.brawlers[2]],
            mapData: MAPS[this.selection.mapId],
            teamMode: this.selection.teamMode,
            aiDifficultiesByTeam: { ...this.selection.difficulties },
        };
    }

    renderBrawlerGrids() {
        for (const playerNumber of [1, 2]) {
            const grid = this.getElement(`player${playerNumber}-brawler-grid`);
            grid.replaceChildren(...this.brawlers.map(brawler => (
                this.createBrawlerCard(brawler, playerNumber)
            )));
            this.selectBrawler(playerNumber, PLAYER_DEFAULTS[playerNumber]);
        }
    }

    createBrawlerCard(brawler, playerNumber) {
        const card = this.document.createElement('button');
        card.type = 'button';
        card.className = `brawler-card ${brawler.id}`;
        card.dataset.brawlerId = brawler.id;
        card.dataset.player = String(playerNumber);
        card.setAttribute('aria-label', `${brawler.name} 선택`);
        card.innerHTML = `
            <span class="brawler-icon" aria-hidden="true">${brawler.emoji}</span>
            <span class="brawler-name">${brawler.name}</span>
        `;
        card.addEventListener('click', () => this.selectBrawler(playerNumber, brawler.id));
        return card;
    }

    selectBrawler(playerNumber, brawlerId) {
        const brawler = this.brawlers.find(({ id }) => id === brawlerId);
        if (!brawler) return;

        this.selection.brawlers[playerNumber] = brawlerId;
        const grid = this.getElement(`player${playerNumber}-brawler-grid`);
        grid.querySelectorAll('.brawler-card').forEach(card => {
            const selected = card.dataset.brawlerId === brawlerId;
            card.classList.toggle('selected', selected);
            card.setAttribute('aria-pressed', String(selected));
        });

        this.renderBrawlerStats(playerNumber, brawler);
    }

    renderBrawlerStats(playerNumber, brawler) {
        const percentage = stat => Math.min((brawler[stat] / STAT_MAXIMUMS[stat]) * 100, 100);
        this.getElement(`player${playerNumber}-stats`).innerHTML = `
            <div class="selected-brawler-header">
                <div class="selected-brawler-emoji" aria-hidden="true">${brawler.emoji}</div>
                <div class="selected-brawler-name-container">
                    <div class="selected-brawler-name">${brawler.name}</div>
                    <div class="stat-description">${brawler.description}</div>
                </div>
            </div>
            <div class="stats-container-detailed">
                ${this.createStatRow('체력', 'health', brawler.health, percentage('health'))}
                ${this.createStatRow('공격', 'damage', brawler.attackDamage, percentage('attackDamage'))}
                ${this.createStatRow('사거리', 'range', brawler.attackRange, percentage('attackRange'))}
            </div>
        `;
    }

    createStatRow(label, className, value, percentage) {
        return `
            <div class="stat-row-detailed">
                <div class="stat-label">${label}</div>
                <div class="stat-value-container">
                    <div class="stat-bar"><div class="stat-fill ${className}" style="width: ${percentage}%"></div></div>
                    <span class="stat-number">${value}</span>
                </div>
            </div>
        `;
    }

    renderMapOptions() {
        const mapSelector = this.getElement('map-selector');
        const options = Object.values(MAPS).map(map => {
            const option = this.document.createElement('button');
            option.type = 'button';
            option.className = 'map-option';
            option.dataset.mapId = map.id;
            option.innerHTML = `
                <span class="map-preview ${map.id}" aria-hidden="true"></span>
                <span class="map-option-name">${map.name}</span>
            `;
            option.addEventListener('click', () => this.selectMap(map.id));
            return option;
        });

        mapSelector.replaceChildren(...options);
        this.selectMap(this.selection.mapId);
    }

    selectMap(mapId) {
        const map = MAPS[mapId];
        if (!map) return;

        this.selection.mapId = mapId;
        this.document.querySelectorAll('.map-option').forEach(option => {
            const selected = option.dataset.mapId === mapId;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', String(selected));
        });
        this.getElement('selected-map-name').textContent = map.name;
        this.getElement('selected-map-desc').textContent = map.description;
    }

    bindDifficultyButtons() {
        this.document.querySelectorAll('.difficulty-btn[data-team][data-difficulty]').forEach(button => {
            const { team, difficulty } = button.dataset;
            const selected = DIFFICULTIES_BY_ID[difficulty] === this.selection.difficulties[team];
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));

            button.addEventListener('click', () => {
                const { team, difficulty } = button.dataset;
                const preset = DIFFICULTIES_BY_ID[difficulty];
                if (!preset || !(team in this.selection.difficulties)) return;

                this.selection.difficulties[team] = preset;
                this.document.querySelectorAll(`.difficulty-btn[data-team="${team}"]`).forEach(teamButton => {
                    const selected = teamButton === button;
                    teamButton.classList.toggle('active', selected);
                    teamButton.setAttribute('aria-pressed', String(selected));
                });
            });
        });
    }

    bindTeamModeButtons() {
        this.document.querySelectorAll('[data-mode]').forEach(button => {
            button.addEventListener('click', () => this.selectTeamMode(button.dataset.mode));
        });
        this.selectTeamMode(this.selection.teamMode);
    }

    selectTeamMode(teamMode) {
        if (!['vs', 'same'].includes(teamMode)) return;

        this.selection.teamMode = teamMode;
        this.document.querySelectorAll('[data-mode]').forEach(button => {
            const selected = button.dataset.mode === teamMode;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });

        const sameTeam = teamMode === 'same';
        this.document.querySelector('.player-selection.player2')?.classList.toggle('same-team', sameTeam);
        const player2Title = this.document.querySelector('.player-selection.player2 .player-title');
        if (player2Title) player2Title.textContent = sameTeam ? '🔵 플레이어 2' : '🔴 플레이어 2';
    }

    handleKeyDown(event) {
        if (event.repeat || this.getElement('lobby-screen').classList.contains('hidden')) return;

        const playerNumber = event.code.startsWith('Arrow') ? 2 : 1;
        const navigationCodes = playerNumber === 1
            ? ['KeyW', 'KeyA', 'KeyS', 'KeyD']
            : ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];

        if (navigationCodes.includes(event.code)) {
            event.preventDefault();
            this.navigateBrawler(playerNumber, event.code);
        } else if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            this.onStart?.();
        }
    }

    navigateBrawler(playerNumber, keyCode) {
        const currentIndex = this.brawlerIds.indexOf(this.selection.brawlers[playerNumber]);
        const gridColumns = 3;
        const offsets = {
            KeyA: -1,
            ArrowLeft: -1,
            KeyD: 1,
            ArrowRight: 1,
            KeyW: -gridColumns,
            ArrowUp: -gridColumns,
            KeyS: gridColumns,
            ArrowDown: gridColumns,
        };
        const offset = offsets[keyCode];
        if (!offset) return;

        const nextIndex = (currentIndex + offset + this.brawlerIds.length) % this.brawlerIds.length;
        this.selectBrawler(playerNumber, this.brawlerIds[nextIndex]);
    }

    getElement(id) {
        const element = this.document.getElementById(id);
        if (!element) throw new Error(`Required lobby element not found: #${id}`);
        return element;
    }
}
