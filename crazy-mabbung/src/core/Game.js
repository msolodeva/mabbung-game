import { Map } from './Map.js';
import { Player } from '../entities/Player.js';
import { Bomb } from '../entities/Bomb.js';
import { Item } from '../entities/Item.js';
import { AssetManager } from '../managers/AssetManager.js';
import { AIController } from '../managers/AIController.js';
import { DangerMap } from '../managers/DangerMap.js';
import { SoundManager } from '../managers/SoundManager.js';
import { EffectsManager } from '../managers/EffectsManager.js';

export class Game {
    constructor(ctx, p1Config = null, p2Config = null, mapTheme = null) {
        this.ctx = ctx;
        this.p1Config = p1Config;
        this.p2Config = p2Config;
        this.mapTheme = mapTheme;

        this.debug = true;
        this.assets = new AssetManager();
        this.sounds = new SoundManager();
        this.effects = new EffectsManager();
        this.tileSize = 64;

        // Load Assets
        this.assets.load({
            // Characters
            'spritesheet_characters': 'assets/spritesheet_characters.png',

            // Sprite Sheets
            'sheet_tiles': 'assets/spritesheet_tiles.png',
            'sheet_tiles_ice': 'assets/spritesheet_tiles_ice.png',
            'sheet_tiles_desert': 'assets/spritesheet_tiles_desert.png',
            'sheet_tiles_factory': 'assets/spritesheet_tiles_factory.png',
            'sheet_tiles_volcano': 'assets/spritesheet_tiles_volcano.png',
            'sheet_items': 'assets/spritesheet_items.png',
            'sheet_bomb': 'assets/spritesheet_bomb.png'
        });

        this.restart(this.p1Config, this.p2Config, this.mapTheme);
        this.lastInput = {};
    }

    restart(p1Config = null, p2Config = null, mapTheme = null) {
        // Save configs if provided, else keep existing
        if (p1Config) this.p1Config = p1Config;
        if (p2Config) this.p2Config = p2Config;
        if (mapTheme) this.mapTheme = mapTheme;

        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;

        const cols = Math.floor(this.width / this.tileSize);
        const rows = Math.floor(this.height / this.tileSize);

        this.map = new Map(this.tileSize, cols, rows, this.mapTheme);

        // DangerMap 생성 (AI들이 공유)
        this.dangerMap = new DangerMap(this.map);

        // Team 1 (Red Team) - 왼쪽 스폰
        const team1Color = this.p1Config ? this.p1Config.color : '#e74c3c';
        const team1Texture = this.p1Config ? this.p1Config.texture : null;

        // Team 2 (Blue Team) - 오른쪽 스폰  
        const team2Color = this.p2Config ? this.p2Config.color : '#3498db';
        const team2Texture = this.p2Config ? this.p2Config.texture : null;

        // Player 1 (Human - Top Left)
        this.player1 = new Player(1, 1, this.tileSize, team1Color, {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            bomb: 'KeyF'
        }, team1Texture);
        this.player1.team = 1;
        this.player1.isAI = false;

        // Player 2 (Human - Bottom Right)
        this.player2 = new Player(cols - 2, rows - 2, this.tileSize, team2Color, {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            bomb: 'ShiftRight'
        }, team2Texture);
        this.player2.team = 2;
        this.player2.isAI = false;

        // AI Players - Team 1 (Red)
        // Ensure AIs use default Red skin (no texture override, rely on color fallback which is Red by default for unknown colors, 
        // but we want them to look like Team 1 color if possible. 
        // Player.js currently defaults baseRow=0 (Red) unless color is Blue.
        // If team1Color is Green, AI will look Red unless we give them a Green texture.
        // For now, let's just let AIs be Red/Blue standard to differentiate "Hero" vs "Minion" or just keeps code simple.
        // If we want AI to match P1's color, we need to pass P1's texture.
        // Let's pass the texture to AI teammates too!

        this.ai1_1 = new Player(1, rows - 2, this.tileSize, team1Color, {
            up: 'ai1_up', down: 'ai1_down', left: 'ai1_left', right: 'ai1_right', bomb: 'ai1_bomb'
        }, team1Texture);
        this.ai1_1.team = 1;
        this.ai1_1.isAI = true;

        this.ai1_2 = new Player(1, Math.floor(rows / 2), this.tileSize, team1Color, {
            up: 'ai2_up', down: 'ai2_down', left: 'ai2_left', right: 'ai2_right', bomb: 'ai2_bomb'
        }, team1Texture);
        this.ai1_2.team = 1;
        this.ai1_2.isAI = true;

        // AI Players - Team 2 (Blue)
        // AI Players - Team 2 (Blue)
        this.ai2_1 = new Player(cols - 2, 1, this.tileSize, team2Color, {
            up: 'ai3_up', down: 'ai3_down', left: 'ai3_left', right: 'ai3_right', bomb: 'ai3_bomb'
        }, team2Texture);
        this.ai2_1.team = 2;
        this.ai2_1.isAI = true;

        this.ai2_2 = new Player(cols - 2, Math.floor(rows / 2), this.tileSize, team2Color, {
            up: 'ai4_up', down: 'ai4_down', left: 'ai4_left', right: 'ai4_right', bomb: 'ai4_bomb'
        }, team2Texture);
        this.ai2_2.team = 2;
        this.ai2_2.isAI = true;

        // All players
        this.players = [this.player1, this.player2, this.ai1_1, this.ai1_2, this.ai2_1, this.ai2_2];
        this.entities = [...this.players];

        // AI Controllers (with DangerMap)
        this.aiControllers = [
            new AIController(this.ai1_1, this, this.dangerMap),
            new AIController(this.ai1_2, this, this.dangerMap),
            new AIController(this.ai2_1, this, this.dangerMap),
            new AIController(this.ai2_2, this, this.dangerMap)
        ];

        this.bombs = [];
        this.explosions = [];
        this.items = [];
        this.effects.clear();

        this.gameOver = false;
        this.winner = null;
        this.gameOverSoundPlayed = false;

        // Start Sound
        this.sounds.play('start');

        // Clear spawn zones for AI players
        this.clearSpawnZone(1, rows - 2);
        this.clearSpawnZone(1, Math.floor(rows / 2));
        this.clearSpawnZone(cols - 2, 1);
        this.clearSpawnZone(cols - 2, Math.floor(rows / 2));
    }

    clearSpawnZone(col, row) {
        // Clear 2x2 area around spawn point
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r > 0 && r < this.map.rows - 1 && c > 0 && c < this.map.cols - 1) {
                    if (this.map.data[r][c] === 2) {
                        this.map.data[r][c] = 0;
                    }
                }
            }
        }
    }

    update(deltaTime) {
        this.effects.update(deltaTime);

        if (this.gameOver) return;

        // DangerMap 업데이트
        this.dangerMap.update(this.bombs, this.explosions);

        // Update AI Controllers
        for (const ai of this.aiControllers) {
            // Always update player (for animations and timers like trappedTimer)
            // But only make decisions if NORMAL
            if (ai.player.state === 'NORMAL') {
                const aiInput = ai.update(deltaTime);
                ai.player.update(deltaTime, this.map, aiInput, this);
            } else {
                ai.player.update(deltaTime, this.map, {}, this);
            }
        }

        // Update Bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.update(deltaTime, this);
            if (bomb.isDead) {
                this.bombs.splice(i, 1);
                if (bomb.owner) bomb.owner.activeBombs--;
            }
        }

        // Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.timer -= deltaTime;
            if (exp.timer <= 0) {
                this.explosions.splice(i, 1);
            }
        }

        // Update Human Players
        this.players.forEach(player => {
            if (!player.isAI) {
                player.update(deltaTime, this.map, this.lastInput, this);
            }
            this.checkItemCollection(player);
        });

        // Check All Player Collisions (for killing trapped players)
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                if (this.checkPlayerCollision(this.players[i], this.players[j])) {
                    this.handlePlayerContact(this.players[i], this.players[j]);
                }
            }
        }

        // Check Win Condition (Team based)
        this.checkTeamWinCondition();
    }

    checkTeamWinCondition() {
        const team1Alive = this.players.filter(p => p.team === 1 && p.state !== 'DEAD').length;
        const team2Alive = this.players.filter(p => p.team === 2 && p.state !== 'DEAD').length;

        if (team1Alive === 0 && team2Alive === 0) {
            this.gameOver = true;
            this.winner = '무승부!';
        } else if (team1Alive === 0) {
            this.gameOver = true;
            this.winner = '블루팀 승리! 🔵';
        } else if (team2Alive === 0) {
            this.gameOver = true;
            this.winner = '레드팀 승리! 🔴';
        }

        if (this.gameOver && !this.gameOverSoundPlayed) {
            this.gameOverSoundPlayed = true;
            if (this.winner === '무승부!') {
                this.sounds.play('lose'); // Draw is kind of a loss?
            } else {
                // Determine if human player won (Assuming Player 1 is Red, Player 2 is Blue)
                // Actually, just play a generic Win sound for now, or check which team won.
                // Since this is local multiplayer or AI bot match, let's just play 'win'.
                this.sounds.play('win');
            }
        }
    }

    draw() {
        // Clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        const shake = this.effects.getShakeOffset();
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        // Draw Map
        this.map.draw(this.ctx, this.assets);

        // Draw Items
        this.items.forEach(item => item.draw(this.ctx, this.assets));

        // Draw Bombs
        this.bombs.forEach(bomb => bomb.draw(this.ctx, this.assets));

        // Draw Explosions with Crazy Arcade Aesthetics (Bubble Stream)
        this.explosions.forEach(exp => {
            const progress = exp.timer / exp.maxTimer; // 1.0 -> 0.0
            const opacity = Math.min(1, progress * 4); // Fade out last

            // Pop / Elastic Scale
            let scale = 1;
            const popP = 1 - progress;
            if (popP < 0.2) scale = popP * 5;
            else if (popP < 0.4) scale = 1 + (0.4 - popP) * 1;
            else scale = 1.0;

            const x = exp.col * this.tileSize;
            const y = exp.row * this.tileSize;
            const midX = x + this.tileSize / 2;
            const midY = y + this.tileSize / 2;
            const size = this.tileSize;

            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.translate(midX, midY);
            this.ctx.scale(scale, scale);

            const waterBlue = '#00a8ff';

            // Draw Helper
            const drawBlob = (bx, by, br) => {
                this.ctx.beginPath();
                this.ctx.arc(bx, by, br, 0, Math.PI * 2);
                this.ctx.fillStyle = waterBlue;
                this.ctx.fill();
                // Shine
                this.ctx.beginPath();
                this.ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.25, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
                this.ctx.fill();
            };

            if (exp.type === 'CENTER') {
                drawBlob(0, 0, size * 0.55);
                // Rim
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#7ed6df';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();

                // Extra inner
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
                this.ctx.fillStyle = '#48dbfb';
                this.ctx.fill();

                // Particles
                for (let i = 0; i < 6; i++) {
                    const ang = (i / 6) * Math.PI * 2 + Date.now() / 150;
                    const rDist = size * 0.65;
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(ang) * rDist, Math.sin(ang) * rDist, 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#dff9fb';
                    this.ctx.fill();
                }
            } else {
                let rotation = 0;
                if (exp.type === 'VERTICAL' || exp.type === 'END_UP' || exp.type === 'END_DOWN') rotation = Math.PI / 2;

                this.ctx.rotate(rotation);

                // Draw Horizontal Stream logic relative to rotation
                if (exp.type === 'HORIZONTAL' || exp.type === 'VERTICAL') {
                    drawBlob(-18, 0, size * 0.42);
                    drawBlob(0, 0, size * 0.42);
                    drawBlob(18, 0, size * 0.42);
                }
                else {
                    // Start from center and go to one side
                    // Reset rotation to handle absolute End Caps if needed, but local space is easier
                    // Actually, for END_UP/DOWN, we rotated PI/2.
                    // END_UP means the top end. Rotation PI/2 means "Right" is "Down". "Left" is "Up".
                    // So END_UP -> LEFT in local space.

                    // Let's reset rotation to use absolute coordinates to match types exactly
                    this.ctx.rotate(-rotation);

                    if (exp.type === 'END_LEFT') {
                        drawBlob(10, 0, size * 0.4);
                        drawBlob(-5, 0, size * 0.5); // End Bulb
                        // Droplets
                        this.ctx.fillStyle = 'white'; this.ctx.beginPath(); this.ctx.arc(-24, 0, 4, 0, Math.PI * 2); this.ctx.fill();
                    } else if (exp.type === 'END_RIGHT') {
                        drawBlob(-10, 0, size * 0.4);
                        drawBlob(5, 0, size * 0.5);
                        this.ctx.fillStyle = 'white'; this.ctx.beginPath(); this.ctx.arc(24, 0, 4, 0, Math.PI * 2); this.ctx.fill();
                    } else if (exp.type === 'END_UP') {
                        drawBlob(0, 10, size * 0.4);
                        drawBlob(0, -5, size * 0.5);
                        this.ctx.fillStyle = 'white'; this.ctx.beginPath(); this.ctx.arc(0, -24, 4, 0, Math.PI * 2); this.ctx.fill();
                    } else if (exp.type === 'END_DOWN') {
                        drawBlob(0, -10, size * 0.4);
                        drawBlob(0, 5, size * 0.5);
                        this.ctx.fillStyle = 'white'; this.ctx.beginPath(); this.ctx.arc(0, 24, 4, 0, Math.PI * 2); this.ctx.fill();
                    }
                }
            }

            this.ctx.restore();
        });

        // Draw Players
        this.players.forEach(player => player.draw(this.ctx, this.assets));

        // Draw team indicators for AI players
        this.players.forEach(player => {
            if (player.isAI && player.state !== 'DEAD') {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('AI', player.x, player.y - 45);
            }
        });

        this.effects.draw(this.ctx);
        this.ctx.restore();
    }

    checkItemCollection(player) {
        const pCol = Math.floor(player.x / this.tileSize);
        const pRow = Math.floor(player.y / this.tileSize);

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (item.col === pCol && item.row === pRow) {
                this.applyItemEffect(player, item.type);
                this.items.splice(i, 1);
            }
        }
    }

    applyItemEffect(player, type) {
        if (type === 'speed') {
            player.speed = Math.min(player.speed + 20, player.maxSpeed);
        } else if (type === 'range') {
            player.bombRange++;
        } else if (type === 'count') {
            player.maxBombs++;
        }
        const label = {
            speed: '+SPEED',
            range: '+RANGE',
            count: '+BOMB'
        }[type] || '+ITEM';
        this.effects.spawnText(label, player.x, player.y - 36, '#f9e79f');
        this.effects.spawnBurst(player.x, player.y, {
            color: '#f1c40f',
            count: 10,
            minSpeed: 45,
            maxSpeed: 130,
            minSize: 3,
            maxSize: 6
        });
        this.sounds.play('item_get');
    }

    checkPlayerCollision(p1, p2) {
        if (p1.state === 'DEAD' || p2.state === 'DEAD') return false;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (p1.radius + p2.radius);
    }

    handlePlayerContact(p1, p2) {
        if (p1.state === 'TRAPPED' && p2.state === 'NORMAL') {
            if (p1.team === p2.team) {
                p1.state = 'NORMAL';
                this.effects.spawnText('RESCUE!', p1.x, p1.y - 38, '#2ecc71');
                console.log("Player Rescued!");
                this.sounds.play('item_get'); // Reuse positive sound
            } else {
                p1.state = 'DEAD';
                this.effects.spawnText('KO!', p1.x, p1.y - 38, '#ff5e57');
                this.effects.triggerShake(160, 5);
                console.log("Player Killed!");
                this.sounds.play('die');
            }
        } else if (p2.state === 'TRAPPED' && p1.state === 'NORMAL') {
            if (p1.team === p2.team) {
                p2.state = 'NORMAL';
                this.effects.spawnText('RESCUE!', p2.x, p2.y - 38, '#2ecc71');
                console.log("Player Rescued!");
                this.sounds.play('item_get');
            } else {
                p2.state = 'DEAD';
                this.effects.spawnText('KO!', p2.x, p2.y - 38, '#ff5e57');
                this.effects.triggerShake(160, 5);
                console.log("Player Killed!");
                this.sounds.play('die');
            }
        }
    }

    handleInput(keys) {
        this.lastInput = keys;
    }

    placeBomb(player) {
        if (player.state !== 'NORMAL') return;
        if (player.activeBombs >= player.maxBombs) return;

        const col = Math.floor(player.x / this.tileSize);
        const row = Math.floor(player.y / this.tileSize);

        const existingBomb = this.bombs.find(b => b.col === col && b.row === row);
        if (existingBomb) return;

        const bomb = new Bomb(col, row, player.bombRange, player, this.tileSize);
        this.bombs.push(bomb);
        player.activeBombs++;
        this.sounds.play('place_bomb');
    }

    triggerExplosion(col, row, range, owner) {
        this.addExplosion(col, row, 'CENTER');
        this.effects.triggerShake(180 + range * 25, Math.min(10, 4 + range));
        this.effects.spawnText('SPLASH!', col * this.tileSize + this.tileSize / 2, row * this.tileSize + 18, '#dff9fb');
        this.sounds.play('explode');

        const directions = [
            { dx: 0, dy: -1, type: 'VERTICAL', end: 'END_UP' },
            { dx: 0, dy: 1, type: 'VERTICAL', end: 'END_DOWN' },
            { dx: -1, dy: 0, type: 'HORIZONTAL', end: 'END_LEFT' },
            { dx: 1, dy: 0, type: 'HORIZONTAL', end: 'END_RIGHT' }
        ];

        directions.forEach(dir => {
            for (let i = 1; i <= range; i++) {
                const c = col + dir.dx * i;
                const r = row + dir.dy * i;

                if (c < 0 || c >= this.map.cols || r < 0 || r >= this.map.rows) break;

                if (this.map.data[r][c] === 1) break;

                if (this.map.data[r][c] === 2) {
                    this.map.destroyBlock(c, r);
                    this.addExplosion(c, r, i === range ? dir.end : dir.type); // Treat blocked as potential end

                    if (Math.random() < 0.3) {
                        this.spawnItem(c, r);
                    }

                    break;
                }

                const chainBomb = this.bombs.find(b => b.col === c && b.row === r);
                if (chainBomb && !chainBomb.isDead) {
                    chainBomb.explode(this);
                    break;
                }

                const isEnd = (i === range);
                this.addExplosion(c, r, isEnd ? dir.end : dir.type);
            }
        });
    }

    spawnItem(col, row) {
        const types = ['speed', 'range', 'count'];
        const type = types[Math.floor(Math.random() * types.length)];
        if (!this.items.some(i => i.col === col && i.row === row)) {
            this.items.push(new Item(col, row, type, this.tileSize));
        }
    }

    addExplosion(col, row, type = 'CENTER') {
        // Reuse existing if same type, or update type if center
        const existing = this.explosions.find(e => e.col === col && e.row === row);
        if (existing) {
            if (type === 'CENTER') existing.type = 'CENTER';
            return;
        }

        this.explosions.push({
            col: col,
            row: row,
            type: type,
            timer: 600, // Slightly longer for better visibility
            maxTimer: 600
        });
        this.effects.spawnSplash(col, row, this.tileSize, {
            count: type === 'CENTER' ? 14 : 7,
            color: type === 'CENTER' ? '#48dbfb' : '#7ed6df'
        });

        this.players.forEach(player => {
            if (this.checkEntityOnTile(player, col, row)) {
                if (player.state === 'NORMAL') {
                    player.trap();
                    this.effects.spawnText('TRAP!', player.x, player.y - 38, '#7ed6df');
                    this.sounds.play('trap');
                }
            }
        });

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (item.col === col && item.row === row) {
                this.items.splice(i, 1);
            }
        }
    }

    checkEntityOnTile(entity, col, row) {
        const eCol = Math.floor(entity.x / this.tileSize);
        const eRow = Math.floor(entity.y / this.tileSize);
        return eCol === col && eRow === row;
    }
}
