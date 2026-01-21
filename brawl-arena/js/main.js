// ========================================
// MAIN - Entry Point
// ========================================

import { Game } from './game/Game.js';
import { BRAWLERS } from './utils/constants.js';

class BrawlArena {
    constructor() {
        this.game = null;
        this.selectedBrawler = 'shelly';

        this.init();
    }

    init() {
        this.setupLobby();
        this.setupEventListeners();
    }

    setupLobby() {
        const brawlerGrid = document.getElementById('brawler-grid');

        // Create brawler selection cards
        Object.values(BRAWLERS).forEach(brawler => {
            const card = document.createElement('div');
            card.className = `brawler-card ${brawler.id}`;
            card.dataset.brawlerId = brawler.id;

            card.innerHTML = `
                <div class="brawler-icon">${brawler.emoji}</div>
                <div class="brawler-name">${brawler.name}</div>
            `;

            card.addEventListener('click', () => this.selectBrawler(brawler.id));
            brawlerGrid.appendChild(card);
        });

        // Select first brawler by default
        this.selectBrawler('shelly');
    }

    selectBrawler(brawlerId) {
        this.selectedBrawler = brawlerId;
        const brawler = BRAWLERS[brawlerId.toUpperCase()];

        // Update card selection
        document.querySelectorAll('.brawler-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.brawlerId === brawlerId);
        });

        // Update info display
        const portrait = document.getElementById('brawler-portrait');
        const stats = document.getElementById('brawler-stats');

        portrait.textContent = brawler.emoji;

        // Calculate stat percentages for bars
        const healthPercent = (brawler.health / 4000) * 100;
        const damagePercent = (brawler.attackDamage / 800) * 100;
        const rangePercent = (brawler.attackRange / 500) * 100;

        stats.innerHTML = `
            <div class="brawler-name-large" style="font-size: 1.3rem; font-weight: bold; margin-bottom: 8px;">${brawler.name}</div>
            <div class="stat">
                <span style="width: 60px;">❤️ HP</span>
                <div class="stat-bar">
                    <div class="stat-fill health" style="width: ${healthPercent}%"></div>
                </div>
            </div>
            <div class="stat">
                <span style="width: 60px;">⚔️ ATK</span>
                <div class="stat-bar">
                    <div class="stat-fill damage" style="width: ${damagePercent}%"></div>
                </div>
            </div>
            <div class="stat">
                <span style="width: 60px;">🎯 RNG</span>
                <div class="stat-bar">
                    <div class="stat-fill range" style="width: ${rangePercent}%"></div>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7); margin-top: 8px;">${brawler.description}</div>
        `;
    }

    setupEventListeners() {
        // Play button
        document.getElementById('play-button').addEventListener('click', () => {
            this.startGame();
        });

        // Play again button
        document.getElementById('play-again-button').addEventListener('click', () => {
            this.returnToLobby();
        });
    }

    startGame() {
        // Hide lobby, show game
        document.getElementById('lobby-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Create and start game
        const canvas = document.getElementById('game-canvas');
        this.game = new Game(canvas, this.selectedBrawler);
        this.game.init();
        this.game.start();
    }

    returnToLobby() {
        // Cleanup game
        if (this.game) {
            this.game.cleanup();
            this.game = null;
        }

        // Show lobby, hide others
        document.getElementById('result-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('lobby-screen').classList.remove('hidden');
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BrawlArena();
});
