import { Map } from './Map.js';
import { Player } from '../entities/Player.js';
import { Bomb } from '../entities/Bomb.js';
import { Item } from '../entities/Item.js';
import { AssetManager } from '../managers/AssetManager.js';
import { AIController } from '../managers/AIController.js';
import { DangerMap } from '../managers/DangerMap.js';

export class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.debug = true;
        this.assets = new AssetManager();
        this.tileSize = 64;

        // Load Assets
        this.assets.load({
            // Characters
            'spritesheet_characters': 'assets/spritesheet_characters.png',

            // Sprite Sheets
            'sheet_tiles': 'assets/spritesheet_tiles.png',
            'sheet_items': 'assets/spritesheet_items.png',
            'sheet_bomb': 'assets/spritesheet_bomb.png'
        });

        this.restart();
        this.lastInput = {};
    }

    restart() {
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;

        const cols = Math.floor(this.width / this.tileSize);
        const rows = Math.floor(this.height / this.tileSize);

        this.map = new Map(this.tileSize, cols, rows);

        // DangerMap 생성 (AI들이 공유)
        this.dangerMap = new DangerMap(this.map);

        // Team 1 (Red Team) - 왼쪽 스폰
        const team1Color = '#e74c3c';
        // Team 2 (Blue Team) - 오른쪽 스폰  
        const team2Color = '#3498db';

        // Player 1 (Human - Top Left)
        this.player1 = new Player(1, 1, this.tileSize, team1Color, {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            bomb: 'KeyF'
        });
        this.player1.team = 1;
        this.player1.isAI = false;

        // Player 2 (Human - Bottom Right)
        this.player2 = new Player(cols - 2, rows - 2, this.tileSize, team2Color, {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            bomb: 'ShiftRight'
        });
        this.player2.team = 2;
        this.player2.isAI = false;

        // AI Players - Team 1 (Red)
        this.ai1_1 = new Player(1, rows - 2, this.tileSize, team1Color, {
            up: 'AI', down: 'AI', left: 'AI', right: 'AI', bomb: 'AI'
        });
        this.ai1_1.team = 1;
        this.ai1_1.isAI = true;

        this.ai1_2 = new Player(1, Math.floor(rows / 2), this.tileSize, team1Color, {
            up: 'AI', down: 'AI', left: 'AI', right: 'AI', bomb: 'AI'
        });
        this.ai1_2.team = 1;
        this.ai1_2.isAI = true;

        // AI Players - Team 2 (Blue)
        this.ai2_1 = new Player(cols - 2, 1, this.tileSize, team2Color, {
            up: 'AI', down: 'AI', left: 'AI', right: 'AI', bomb: 'AI'
        });
        this.ai2_1.team = 2;
        this.ai2_1.isAI = true;

        this.ai2_2 = new Player(cols - 2, Math.floor(rows / 2), this.tileSize, team2Color, {
            up: 'AI', down: 'AI', left: 'AI', right: 'AI', bomb: 'AI'
        });
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

        this.gameOver = false;
        this.winner = null;

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
        if (this.gameOver) return;

        // DangerMap 업데이트
        this.dangerMap.update(this.bombs, this.explosions);

        // Update AI Controllers
        for (const ai of this.aiControllers) {
            if (ai.player.state === 'NORMAL') {
                const aiInput = ai.update(deltaTime);
                ai.player.update(deltaTime, this.map, aiInput, this);
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
    }

    draw() {
        // Clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Map
        this.map.draw(this.ctx, this.assets);

        // Draw Items
        this.items.forEach(item => item.draw(this.ctx, this.assets));

        // Draw Bombs
        this.bombs.forEach(bomb => bomb.draw(this.ctx, this.assets));

        // Draw Explosions
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        this.explosions.forEach(exp => {
            const x = exp.col * this.tileSize;
            const y = exp.row * this.tileSize;
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
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
    }

    checkPlayerCollision(p1, p2) {
        if (p1.state === 'DEAD' || p2.state === 'DEAD') return false;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (p1.radius + p2.radius);
    }

    handlePlayerContact(p1, p2) {
        // Only opposite teams can kill each other
        if (p1.team === p2.team) return;

        if (p1.state === 'TRAPPED' && p2.state === 'NORMAL') {
            p1.state = 'DEAD';
        } else if (p2.state === 'TRAPPED' && p1.state === 'NORMAL') {
            p2.state = 'DEAD';
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
    }

    triggerExplosion(col, row, range, owner) {
        this.addExplosion(col, row);

        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        directions.forEach(dir => {
            for (let i = 1; i <= range; i++) {
                const c = col + dir.dx * i;
                const r = row + dir.dy * i;

                if (c < 0 || c >= this.map.cols || r < 0 || r >= this.map.rows) break;

                if (this.map.data[r][c] === 1) break;

                if (this.map.data[r][c] === 2) {
                    this.map.destroyBlock(c, r);
                    this.addExplosion(c, r);

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

                this.addExplosion(c, r);
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

    addExplosion(col, row) {
        if (this.explosions.some(e => e.col === col && e.row === row)) return;

        this.explosions.push({
            col: col,
            row: row,
            timer: 500
        });

        this.players.forEach(player => {
            if (this.checkEntityOnTile(player, col, row)) {
                if (player.state === 'NORMAL') {
                    player.trap();
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
