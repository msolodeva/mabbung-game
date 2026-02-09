import { Game } from './core/Game.js';
import { AssetManager } from './managers/AssetManager.js';
import { Map, MAP_THEMES } from './core/Map.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // --- Character Selection Logic ---
    const charSelectModal = document.getElementById('char-select-modal');
    const charGrid = document.getElementById('char-grid');
    const p1Preview = document.getElementById('p1-preview');
    const p2Preview = document.getElementById('p2-preview');
    const startGameBtn = document.getElementById('start-game-btn');
    const menuBtn = document.getElementById('menu-btn'); // From Game Over modal

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

    const modal = {
        element: document.getElementById('game-over-modal'),
        winner: document.getElementById('winner-text'),
        restartBtn: document.getElementById('restart-btn')
    };

    let gameTime = 0;

    // Character Options (Hue Shifts)
    const characters = [
        { name: 'Red', hue: 0, color: '#e74c3c' },
        { name: 'Blue', hue: 0.66, color: '#3498db' },
        { name: 'Green', hue: 0.33, color: '#2ecc71' },
        { name: 'Yellow', hue: 0.15, color: '#f1c40f' },
        { name: 'Purple', hue: 0.75, color: '#9b59b6' },
        { name: 'Orange', hue: 0.08, color: '#e67e22' },
        { name: 'Cyan', hue: 0.5, color: '#1abc9c' },
        { name: 'Pink', hue: 0.85, color: '#e91e63' }
    ];

    // Ensure indices are initialized
    let p1Selected = 0;
    let p2Selected = 1;
    const variants = {}; // Store generated canvases

    // Pre-load assets for selection screen
    const selectionAssets = new AssetManager();
    selectionAssets.load({
        'spritesheet_characters': 'assets/spritesheet_characters.png',
        'sheet_tiles': 'assets/spritesheet_tiles.png'
    });

    selectionAssets.onLoadComplete = () => {
        initSelectionScreen();
        initMapSelection();
    };

    // Map Selection Logic
    let selectedMapTheme = MAP_THEMES.FOREST;
    const mapGrid = document.getElementById('map-grid');
    const mapNameLabel = document.getElementById('selected-map-name');

    function initMapSelection() {
        Object.values(MAP_THEMES).forEach(theme => {
            const el = document.createElement('div');
            el.className = 'map-option';
            if (theme.id === selectedMapTheme.id) el.classList.add('selected');
            el.onclick = () => selectMap(theme);

            // Create Thumbnail
            const startX = 0;
            const startY = 0;
            const thumbW = 80;
            const thumbH = 60;

            const cvs = document.createElement('canvas');
            cvs.width = thumbW;
            cvs.height = thumbH;
            const ctx = cvs.getContext('2d');

            // Draw a mini map preview
            // We can just use the Map class to fill a tiny area
            const miniTileSize = 10;
            const miniCols = Math.ceil(thumbW / miniTileSize);
            const miniRows = Math.ceil(thumbH / miniTileSize);

            const miniMap = new Map(miniTileSize, miniCols, miniRows, theme);
            // Force redraw with assets
            miniMap.draw(ctx, selectionAssets);

            el.appendChild(cvs);
            mapGrid.appendChild(el);
        });
    }

    function selectMap(theme) {
        selectedMapTheme = theme;
        mapNameLabel.textContent = theme.name;

        // Update UI
        document.querySelectorAll('.map-option').forEach(el => el.classList.remove('selected'));
        // Find the element again (a bit inefficient but fine for small list)
        // Or store ref. Let's just rebuild/find by index if we had one.
        // Actually since we iterate Object.values order is preserved in modern JS mostly, but better to check child
        const index = Object.values(MAP_THEMES).findIndex(t => t.id === theme.id);
        if (index >= 0 && mapGrid.children[index]) {
            mapGrid.children[index].classList.add('selected');
        }
    }

    function initSelectionScreen() {
        const sheet = selectionAssets.get('spritesheet_characters');

        // Generate Variants
        characters.forEach((char, index) => {
            // Generate variant canvas
            const variantCanvas = selectionAssets.createColorVariant(sheet, char.hue);
            variants[index] = variantCanvas;

            // Create DOM Element
            const el = document.createElement('div');
            el.className = 'char-option';
            el.dataset.index = index;
            el.onclick = () => selectCharacter(index);

            // Thumbnail (Front facing)
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 64;
            thumbCanvas.height = 64;
            const ctx = thumbCanvas.getContext('2d');

            // Draw generic front frame (assuming standard sprite layout)
            // Width is total width. Standard is 8 frames per row. 
            // Height is 6 rows. 0 is front.
            const sw = variantCanvas.width / 8;
            const sh = variantCanvas.height / 6;

            ctx.drawImage(variantCanvas, 0, 0, sw, sh, 0, 0, 64, 64);
            el.appendChild(thumbCanvas);

            charGrid.appendChild(el);
        });

        // Set defaults (P1 Red, P2 Blue)
        selectCharacter(0, 1); // P1
        selectCharacter(1, 2); // P2
    }

    let p1Turn = true; // Simple toggle for who is selecting if clicking

    function selectCharacter(index, forcedPlayer = null) {
        // Determine which player is selecting
        let player = forcedPlayer;
        if (!player) {
            // Simple logic: If P1 hasn't selected new, P1. If P1 just selected, P2.
            // Or just check which slot was last clicked? 
            // Let's rely on simple turn based or just slots.
            // Actually, usually you use controls. but for web mouse click:
            // Let's say Left Click = P1, Right Click (Context Menu) = P2? No.
            // Let's just alternate or fill empty.

            // Allow re-selection.
            if (p1Turn) player = 1;
            else player = 2;

            p1Turn = !p1Turn;
        }

        const char = characters[index];

        // Prevent same character selection
        if (player === 1 && index === p2Selected) return;
        if (player === 2 && index === p1Selected) return;

        if (player === 1) {
            p1Selected = index;
            updatePreview(1, index);
            // Update Grid UI
            document.querySelectorAll('.char-option').forEach(el => el.classList.remove('p1-active'));
            document.querySelector(`.char-option[data-index="${index}"]`).classList.add('p1-active');
        } else {
            p2Selected = index;
            updatePreview(2, index);
            // Update Grid UI
            document.querySelectorAll('.char-option').forEach(el => el.classList.remove('p2-active'));
            document.querySelector(`.char-option[data-index="${index}"]`).classList.add('p2-active');
        }

        checkReady();
    }

    function updatePreview(player, index) {
        const container = player === 1 ? p1Preview : p2Preview;
        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        const variant = variants[index];

        const sw = variant.width / 8;
        const sh = variant.height / 6;

        // Draw larger preview
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(variant, 0, 0, sw, sh, 0, 0, 100, 100);

        container.appendChild(canvas);

        // Update Slot Border Color
        const slot = document.querySelector(player === 1 ? '.p1-slot' : '.p2-slot');
        slot.style.borderColor = characters[index].color;
    }

    function checkReady() {
        if (p1Selected !== null && p2Selected !== null) {
            startGameBtn.disabled = false;
            document.getElementById('waiting-msg').classList.remove('visible');
        }
    }

    startGameBtn.addEventListener('click', () => {
        // Hide Modal
        charSelectModal.classList.add('hidden');

        // Prepare Config
        const p1Config = { ...characters[p1Selected], texture: variants[p1Selected] };
        const p2Config = { ...characters[p2Selected], texture: variants[p2Selected] };

        // Start Game
        if (!window.currentGame) {
            window.currentGame = new Game(ctx, p1Config, p2Config, selectedMapTheme);
            // Assign to window.game for debug consistency
            window.game = window.currentGame;

            // Initial UI Setup if needed (handled in Game loop)
            requestAnimationFrame(gameLoop);
        } else {
            window.currentGame.restart(p1Config, p2Config, selectedMapTheme);
        }
    });

    // Handle Menu Button
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            modal.element.classList.add('hidden');
            charSelectModal.classList.remove('hidden');
            window.currentGame.gameOver = true; // Ensure stopped
            // Reset game state potentially needed? 
            // The Start Game button will trigger restart() properly.
        });
    }

    modal.restartBtn.addEventListener('click', () => {
        if (window.currentGame && window.currentGame.sounds) window.currentGame.sounds.play('click');
        if (window.currentGame) window.currentGame.restart();
        modal.element.classList.add('hidden');
        gameTime = 0;
        // Clear keys to prevent getting stuck moving
        for (let key in keys) keys[key] = false;
        if (window.currentGame) window.currentGame.handleInput(keys);
    });

    // --- End Character Selection Logic ---

    // Initial loop (Modified to only run update if game exists)
    let lastTime = 0;
    function gameLoop(timestamp) {
        // ... (standard loop logic) ... 
        if (!lastTime) {
            lastTime = timestamp;
            requestAnimationFrame(gameLoop);
            return;
        }
        let deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        if (deltaTime > 100) deltaTime = 16;

        if (window.currentGame) {
            window.currentGame.update(deltaTime);
            window.currentGame.draw();
            updateGameUI(window.currentGame, deltaTime);
        }

        requestAnimationFrame(gameLoop);
    }

    function updateGameUI(game, deltaTime) {
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
    }

    // Input Handling
    const keys = {};

    window.focus(); // Try to focus window

    window.addEventListener('keydown', (e) => {
        // Character Selection Controls
        if (!charSelectModal.classList.contains('hidden')) {
            // P1 Controls (A/D)
            if (e.code === 'KeyA') {
                let next = (p1Selected - 1 + characters.length) % characters.length;
                if (next === p2Selected) next = (next - 1 + characters.length) % characters.length;
                selectCharacter(next, 1);
            } else if (e.code === 'KeyD') {
                let next = (p1Selected + 1) % characters.length;
                if (next === p2Selected) next = (next + 1) % characters.length;
                selectCharacter(next, 1);
            }

            // P2 Controls (Left/Right)
            if (e.code === 'ArrowLeft') {
                let next = (p2Selected - 1 + characters.length) % characters.length;
                if (next === p1Selected) next = (next - 1 + characters.length) % characters.length;
                selectCharacter(next, 2);
            } else if (e.code === 'ArrowRight') {
                let next = (p2Selected + 1) % characters.length;
                if (next === p1Selected) next = (next + 1) % characters.length;
                selectCharacter(next, 2);
            }

            // Start Game (Enter or Space)
            if ((e.code === 'Enter' || e.code === 'Space') && !startGameBtn.disabled) {
                startGameBtn.click();
            }
            return;
        }

        keys[e.code] = true;
        if (window.currentGame) window.currentGame.handleInput(keys);
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (window.currentGame) window.currentGame.handleInput(keys);
    });

    // Handle focus loss
    window.addEventListener('blur', () => {
        for (let key in keys) keys[key] = false;
        if (window.currentGame) window.currentGame.handleInput(keys);
    });

    // Start Animation Loop Immediately (it checks for window.currentGame)
    // requestAnimationFrame(gameLoop); // Called in startGameBtn click or reuse existing
    requestAnimationFrame(gameLoop);
});
