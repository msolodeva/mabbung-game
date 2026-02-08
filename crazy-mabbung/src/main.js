import { Game } from './core/Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Create Game instance
    const game = new Game(ctx);

    // UI Elements
    const ui = {
        team1: {
            alive: document.getElementById('team1-alive'),
            p1Status: document.getElementById('p1-status')
        },
        team2: {
            alive: document.getElementById('team2-alive'),
            p2Status: document.getElementById('p2-status')
        },
        timer: document.getElementById('game-timer')
    };

    let gameTime = 0;

    const modal = {
        element: document.getElementById('game-over-modal'),
        winner: document.getElementById('winner-text'),
        restartBtn: document.getElementById('restart-btn')
    };

    modal.restartBtn.addEventListener('click', () => {
        game.restart();
        modal.element.classList.add('hidden');
        gameTime = 0;
        // Clear keys to prevent getting stuck moving
        for (let key in keys) keys[key] = false;
        game.handleInput(keys);
    });

    // Initial loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        if (!lastTime) {
            lastTime = timestamp;
            requestAnimationFrame(gameLoop);
            return;
        }
        let deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // Cap deltaTime to avoid huge jumps
        if (deltaTime > 100) deltaTime = 16;

        game.update(deltaTime);
        game.draw();

        if (game.gameOver) {
            if (modal.element.classList.contains('hidden')) {
                modal.winner.textContent = game.winner;
                modal.element.classList.remove('hidden');
            }
        } else {
            // Update UI
            gameTime += deltaTime;
            ui.timer.textContent = Math.floor(gameTime / 1000);

            // Update team alive counts
            const team1Alive = game.players.filter(p => p.team === 1 && p.state !== 'DEAD').length;
            const team2Alive = game.players.filter(p => p.team === 2 && p.state !== 'DEAD').length;

            ui.team1.alive.textContent = team1Alive;
            ui.team2.alive.textContent = team2Alive;

            // Update player status indicators
            ui.team1.p1Status.style.color = game.player1.state === 'DEAD' ? '#666' : '#2ecc71';
            ui.team2.p2Status.style.color = game.player2.state === 'DEAD' ? '#666' : '#2ecc71';
        }

        requestAnimationFrame(gameLoop);
    }

    // Input Handling
    const keys = {};

    window.focus(); // Try to focus window

    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        game.handleInput(keys);
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        game.handleInput(keys);
    });

    // Handle focus loss
    window.addEventListener('blur', () => {
        for (let key in keys) keys[key] = false;
        game.handleInput(keys);
    });

    requestAnimationFrame(gameLoop);
});
