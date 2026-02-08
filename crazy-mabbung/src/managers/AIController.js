/**
 * AI 컨트롤러 클래스
 * 플레이어를 자동으로 조작하는 AI 로직
 */
export class AIController {
    constructor(player, game, dangerMap) {
        this.player = player;
        this.game = game;
        this.dangerMap = dangerMap;
        this.decisionTimer = 0;
        this.decisionInterval = 200; // 200ms마다 결정
        this.currentDirection = null;
        this.targetPos = null;
        this.lastBombTime = 0;
        this.bombCooldown = 2000; // 폭탄 설치 쿨다운
    }

    update(deltaTime) {
        if (this.player.state !== 'NORMAL') return {};

        this.decisionTimer += deltaTime;

        const input = {};

        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.makeDecision();
        }

        // 현재 결정에 따라 입력 생성
        if (this.currentDirection) {
            input[this.currentDirection] = true;
        }

        // 폭탄 설치 결정
        if (this.shouldPlaceBomb()) {
            input[this.player.controls.bomb] = true;
            this.lastBombTime = Date.now();
        }

        return input;
    }

    makeDecision() {
        const player = this.player;
        const game = this.game;
        const map = game.map;

        const myCol = Math.floor(player.x / player.tileSize);
        const myRow = Math.floor(player.y / player.tileSize);

        // 1. 위험 체크 (폭발 범위에 있는지)
        if (this.isInDanger(myCol, myRow)) {
            this.currentDirection = this.findSafeDirection(myCol, myRow);
            return;
        }

        // 2. 근처에 적이 있는지 체크
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const enemyCol = Math.floor(nearestEnemy.x / player.tileSize);
            const enemyRow = Math.floor(nearestEnemy.y / player.tileSize);

            // 적과 같은 라인에 있으면 폭탄 설치 고려
            if (myCol === enemyCol || myRow === enemyRow) {
                this.targetPos = { col: myCol, row: myRow };
            } else {
                // 적을 향해 이동
                this.currentDirection = this.getDirectionTowards(myCol, myRow, enemyCol, enemyRow);
                return;
            }
        }

        // 3. 파괴 가능 블록을 향해 이동
        const nearestBlock = this.findNearestBreakableBlock(myCol, myRow);
        if (nearestBlock) {
            if (this.isAdjacent(myCol, myRow, nearestBlock.col, nearestBlock.row)) {
                this.targetPos = { col: myCol, row: myRow };
                this.currentDirection = null;
            } else {
                this.currentDirection = this.getDirectionTowards(myCol, myRow, nearestBlock.col, nearestBlock.row);
            }
            return;
        }

        // 4. 랜덤 이동
        this.currentDirection = this.getRandomDirection(myCol, myRow);
    }

    isInDanger(col, row) {
        // 🆕 DangerMap 활용
        return this.dangerMap.isDangerous(col, row);
    }

    isInBombRange(col, row, bomb) {
        if (bomb.col === col && bomb.row === row) return true;

        // 4방향 체크
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        for (const dir of directions) {
            for (let i = 1; i <= bomb.range; i++) {
                const c = bomb.col + dir.dx * i;
                const r = bomb.row + dir.dy * i;

                if (this.game.map.isSolid(c, r)) break;
                if (c === col && r === row) return true;
            }
        }

        return false;
    }

    findSafeDirection(col, row) {
        // 🆕 DangerMap의 BFS 경로 활용
        const path = this.dangerMap.findSafePath(col, row, this.player.speed);

        if (path && path.length > 0) {
            // 방향 키 문자열을 실제 컨트롤 키로 변환
            const directionKey = path[0];
            const keyMap = {
                'up': this.player.controls.up,
                'down': this.player.controls.down,
                'left': this.player.controls.left,
                'right': this.player.controls.right
            };
            return keyMap[directionKey];
        }

        // 폴백: 기존 방식으로 안전한 방향 찾기
        const directions = [
            { key: this.player.controls.up, dx: 0, dy: -1 },
            { key: this.player.controls.down, dx: 0, dy: 1 },
            { key: this.player.controls.left, dx: -1, dy: 0 },
            { key: this.player.controls.right, dx: 1, dy: 0 }
        ];

        for (const dir of directions) {
            const newCol = col + dir.dx;
            const newRow = row + dir.dy;

            if (!this.game.map.isSolid(newCol, newRow) &&
                !this.dangerMap.isDangerous(newCol, newRow)) {
                return dir.key;
            }
        }

        return directions[Math.floor(Math.random() * directions.length)].key;
    }

    findNearestEnemy() {
        const player = this.player;
        let nearest = null;
        let minDist = Infinity;

        for (const p of this.game.players) {
            if (p === player) continue;
            if (p.state === 'DEAD') continue;
            if (p.team === player.team) continue; // 같은 팀 제외

            const dx = p.x - player.x;
            const dy = p.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearest = p;
            }
        }

        return nearest;
    }

    findNearestBreakableBlock(col, row) {
        const map = this.game.map;
        let nearest = null;
        let minDist = Infinity;

        for (let r = 0; r < map.rows; r++) {
            for (let c = 0; c < map.cols; c++) {
                if (map.data[r][c] === 2) {
                    const dist = Math.abs(c - col) + Math.abs(r - row);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = { col: c, row: r };
                    }
                }
            }
        }

        return nearest;
    }

    isAdjacent(col1, row1, col2, row2) {
        return Math.abs(col1 - col2) + Math.abs(row1 - row2) === 1;
    }

    getDirectionTowards(fromCol, fromRow, toCol, toRow) {
        const map = this.game.map;

        // 간단한 방향 선택 (A* 대신 기본적인 접근)
        const possibleMoves = [];

        if (toCol < fromCol && !map.isSolid(fromCol - 1, fromRow)) {
            possibleMoves.push(this.player.controls.left);
        }
        if (toCol > fromCol && !map.isSolid(fromCol + 1, fromRow)) {
            possibleMoves.push(this.player.controls.right);
        }
        if (toRow < fromRow && !map.isSolid(fromCol, fromRow - 1)) {
            possibleMoves.push(this.player.controls.up);
        }
        if (toRow > fromRow && !map.isSolid(fromCol, fromRow + 1)) {
            possibleMoves.push(this.player.controls.down);
        }

        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }

        return this.getRandomDirection(fromCol, fromRow);
    }

    getRandomDirection(col, row) {
        const map = this.game.map;
        const directions = [];

        if (!map.isSolid(col, row - 1)) directions.push(this.player.controls.up);
        if (!map.isSolid(col, row + 1)) directions.push(this.player.controls.down);
        if (!map.isSolid(col - 1, row)) directions.push(this.player.controls.left);
        if (!map.isSolid(col + 1, row)) directions.push(this.player.controls.right);

        if (directions.length > 0) {
            return directions[Math.floor(Math.random() * directions.length)];
        }
        return null;
    }

    shouldPlaceBomb() {
        if (Date.now() - this.lastBombTime < this.bombCooldown) return false;
        if (this.player.activeBombs >= this.player.maxBombs) return false;

        const col = Math.floor(this.player.x / this.player.tileSize);
        const row = Math.floor(this.player.y / this.player.tileSize);

        // 이미 폭탄이 있는지 체크
        for (const bomb of this.game.bombs) {
            if (bomb.col === col && bomb.row === row) return false;
        }

        // 🆕 핵심: 폭탄 설치 후 탈출 가능한지 먼저 확인
        const escapePath = this.dangerMap.simulateBombAndFindEscape(
            col, row, this.player.bombRange, this.player.speed
        );

        if (!escapePath) {
            return false;  // 탈출 불가 → 설치 금지
        }

        // 근처에 적이나 파괴 가능 블록이 있으면 폭탄 설치
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const enemyCol = Math.floor(nearestEnemy.x / this.player.tileSize);
            const enemyRow = Math.floor(nearestEnemy.y / this.player.tileSize);

            // 같은 라인에 있고 범위 내면 폭탄
            if ((col === enemyCol && Math.abs(row - enemyRow) <= this.player.bombRange) ||
                (row === enemyRow && Math.abs(col - enemyCol) <= this.player.bombRange)) {
                return Math.random() < 0.5;
            }
        }

        // 인접 블록이 있으면 폭탄
        const map = this.game.map;
        if (map.data[row - 1]?.[col] === 2 ||
            map.data[row + 1]?.[col] === 2 ||
            map.data[row]?.[col - 1] === 2 ||
            map.data[row]?.[col + 1] === 2) {
            return Math.random() < 0.3;
        }

        return false;
    }
}
