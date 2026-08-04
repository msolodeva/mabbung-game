import { Game } from '../game/Game.js';
import { LobbyController } from './LobbyController.js';

export class BrawlArena {
    constructor({ documentRef = document, windowRef = window } = {}) {
        this.document = documentRef;
        this.window = windowRef;
        this.game = null;
        this.handleRestart = this.restartGame.bind(this);
        this.lobby = new LobbyController({
            documentRef,
            windowRef,
            onStart: () => this.startGame(),
        });
    }

    init() {
        this.lobby.init();
        this.getElement('play-button').addEventListener('click', () => this.startGame());
        this.getElement('play-again-button').addEventListener('click', () => this.returnToLobby());
        this.window.addEventListener('restart-current-game', this.handleRestart);
    }

    startGame() {
        this.showScreen('game-screen');
        this.createGame();
    }

    restartGame() {
        this.showScreen('game-screen');
        this.createGame();
    }

    returnToLobby() {
        this.cleanupGame();
        this.showScreen('lobby-screen');
    }

    createGame() {
        this.cleanupGame();
        this.game = new Game({
            canvas: this.getElement('game-canvas'),
            ...this.lobby.getGameOptions(),
        });
        this.game.init();
        this.game.start();
    }

    cleanupGame() {
        this.game?.cleanup();
        this.game = null;
    }

    showScreen(screenId) {
        this.document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.toggle('hidden', screen.id !== screenId);
        });
    }

    destroy() {
        this.cleanupGame();
        this.lobby.destroy();
        this.window.removeEventListener('restart-current-game', this.handleRestart);
    }

    getElement(id) {
        const element = this.document.getElementById(id);
        if (!element) throw new Error(`Required app element not found: #${id}`);
        return element;
    }
}
