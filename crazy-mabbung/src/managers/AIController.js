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
        this.decisionInterval = 150; // 반응 속도 약간 상향 (200 -> 150)
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
        const myCol = Math.floor(player.x / player.tileSize);
        const myRow = Math.floor(player.y / player.tileSize);

        // 1. 위험 회피 (가장 최우선)
        if (this.isInDanger(myCol, myRow)) {
            // console.log(`AI ${player.team} Danger! Evading...`);
            this.currentDirection = this.findSafeDirection(myCol, myRow);
            return;
        }

        // 2. 갇힌 아군 구출 (높은 우선순위)
        const trappedTeammate = this.findTrappedTeammate();
        if (trappedTeammate) {
            const tCol = Math.floor(trappedTeammate.x / player.tileSize);
            const tRow = Math.floor(trappedTeammate.y / player.tileSize);

            // console.log(`AI ${player.team} Rescuing teammate at ${tCol},${tRow}`);
            const move = this.findNextMove(myCol, myRow, tCol, tRow);
            if (move) {
                this.currentDirection = move;
                return;
            }
        }

        // 3. 아이템 획득 (안전한 경우)
        const nearestItem = this.findNearestItem(myCol, myRow);
        if (nearestItem) {
            const move = this.findNextMove(myCol, myRow, nearestItem.col, nearestItem.row);
            if (move) {
                this.currentDirection = move;
                return;
            }
        }

        // 4. 적 공격 (추적)
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const enemyCol = Math.floor(nearestEnemy.x / player.tileSize);
            const enemyRow = Math.floor(nearestEnemy.y / player.tileSize);

            // 적이 너무 멀면 블록 파밍도 고려 (랜덤성)
            const dist = Math.abs(myCol - enemyCol) + Math.abs(myRow - enemyRow);

            if (dist < 10 || Math.random() < 0.6) {
                const move = this.findNextMove(myCol, myRow, enemyCol, enemyRow);
                if (move) {
                    this.currentDirection = move;
                    return;
                }
            }
        }

        // 5. 파밍 (블록 파괴)
        const nearestBlock = this.findNearestBreakableBlock(myCol, myRow);
        if (nearestBlock) {
            // 인접하면 멈춰서 폭탄 설치 각을 봄
            if (this.isAdjacent(myCol, myRow, nearestBlock.col, nearestBlock.row)) {
                this.currentDirection = null;
            } else {
                const move = this.findNextMove(myCol, myRow, nearestBlock.col, nearestBlock.row);
                if (move) {
                    this.currentDirection = move;
                    return;
                }
            }
            return;
        }

        // 6. 아무것도 할 게 없으면 랜덤 배회 (제자리 멈춤 방지)
        if (!this.currentDirection || Math.random() < 0.05) {
            this.currentDirection = this.getRandomDirection(myCol, myRow);
        }
    }

    /**
     * BFS 길찾기 알고리즘
     * 위험한 곳과 벽을 피해서 목표까지 가는 다음 이동 방향 반환
     */
    findNextMove(startCol, startRow, targetCol, targetRow) {
        // 이미 도착했으면 null
        if (startCol === targetCol && startRow === targetRow) return null;

        const queue = [{ col: startCol, row: startRow, path: [] }];
        const visited = new Set();
        visited.add(`${startCol},${startRow}`);

        // 최대 탐색 깊이 제한 (성능 고려)
        const MAX_DEPTH = 25;

        const directions = [
            { key: this.player.controls.up, dc: 0, dr: -1 },
            { key: this.player.controls.down, dc: 0, dr: 1 },
            { key: this.player.controls.left, dc: -1, dr: 0 },
            { key: this.player.controls.right, dc: 1, dr: 0 }
        ];

        // 랜덤하게 섞어서 자연스러운 움직임 유도
        directions.sort(() => Math.random() - 0.5);

        while (queue.length > 0) {
            const current = queue.shift();

            // 목표 도달
            if (current.col === targetCol && current.row === targetRow) {
                return current.path[0]; // 첫 번째 이동 방향 반환
            }

            if (current.path.length >= MAX_DEPTH) continue;

            for (const dir of directions) {
                const nc = current.col + dir.dc;
                const nr = current.row + dir.dr;
                const key = `${nc},${nr}`;

                if (visited.has(key)) continue;

                // 맵 밖 체크
                if (nc < 0 || nc >= this.game.map.cols || nr < 0 || nr >= this.game.map.rows) continue;

                const isTarget = (nc === targetCol && nr === targetRow);

                // 벽 체크 (목표 지점은 예외)
                if (!isTarget && this.game.map.isSolid(nc, nr)) continue;

                // 위험 지역 체크 (폭발 예정지) - 안전 제일 (타겟이어도 위험하면 안감)
                if (this.dangerMap.isDangerous(nc, nr)) continue;

                // 다른 플레이어(아군/적)와 겹치는 것 방지 (길막) - 목표 지점은 예외 (적 추적)
                if (!isTarget && this.isBlockedByPlayer(nc, nr)) continue;

                visited.add(key);
                queue.push({
                    col: nc,
                    row: nr,
                    path: [...current.path, dir.key]
                });
            }
        }

        return null; // 경로 없음
    }

    isBlockedByPlayer(col, row) {
        for (const p of this.game.players) {
            if (p === this.player || p.state === 'DEAD') continue;

            // 플레이어의 현재 위치 타일 계산
            const pc = Math.floor((p.x + p.tileSize / 2) / p.tileSize);
            const pr = Math.floor((p.y + p.tileSize / 2) / p.tileSize);

            if (pc === col && pr === row) {
                // 갇힌 아군은 블로킹하지 않음 (구조 가능)
                if (p.state === 'TRAPPED' && p.team === this.player.team) return false;
                return true;
            }
        }
        return false;
    }

    findNearestItem(col, row) {
        let nearest = null;
        let minDist = Infinity;

        for (const item of this.game.items) {
            // 위험한 곳에 있는 아이템은 무시
            if (this.dangerMap.isDangerous(item.col, item.row)) continue;

            const dist = Math.abs(col - item.col) + Math.abs(row - item.row);
            if (dist < minDist) {
                minDist = dist;
                nearest = item;
            }
        }
        return nearest;
    }

    isInDanger(col, row) {
        return this.dangerMap.isDangerous(col, row);
    }

    findSafeDirection(col, row) {
        // DangerMap의 BFS 경로 활용 (탈출 전문)
        const path = this.dangerMap.findSafePath(col, row, this.player.speed);

        if (path && path.length > 0) {
            const directionKey = path[0];
            const keyMap = {
                'up': this.player.controls.up,
                'down': this.player.controls.down,
                'left': this.player.controls.left,
                'right': this.player.controls.right
            };
            return keyMap[directionKey];
        }

        // 2차 수단: 즉시 안전한 인접 타일 찾기 (Fallback)
        const directions = [
            { key: this.player.controls.up, dc: 0, dr: -1 },
            { key: this.player.controls.down, dc: 0, dr: 1 },
            { key: this.player.controls.left, dc: -1, dr: 0 },
            { key: this.player.controls.right, dc: 1, dr: 0 }
        ];

        directions.sort(() => Math.random() - 0.5);

        for (const dir of directions) {
            const nc = col + dir.dc;
            const nr = row + dir.dr;

            if (!this.game.map.isSolid(nc, nr) && !this.dangerMap.isDangerous(nc, nr)) {
                return dir.key;
            }
        }

        return null;
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

    findTrappedTeammate() {
        const player = this.player;
        // 가장 가까운 갇힌 아군 찾기
        const teammates = this.game.players.filter(p =>
            p !== player &&
            p.team === player.team &&
            p.state === 'TRAPPED'
        );

        if (teammates.length === 0) return null;

        return teammates.sort((a, b) => {
            const distA = Math.hypot(a.x - player.x, a.y - player.y);
            const distB = Math.hypot(b.x - player.x, b.y - player.y);
            return distA - distB;
        })[0];
    }

    findNearestBreakableBlock(col, row) {
        const map = this.game.map;
        let nearest = null;
        let minDist = Infinity;

        // 가장 가까운 안전한 블록 탐색
        for (let r = 0; r < map.rows; r++) {
            for (let c = 0; c < map.cols; c++) {
                if (map.data[r][c] === 2) {
                    // 이미 위험 지역(폭탄 설치됨)이면 제외
                    if (this.dangerMap.isDangerous(c, r)) continue;

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

    getRandomDirection(col, row) {
        const map = this.game.map;
        const directions = [];

        const checkMove = (c, r) => {
            if (map.isSolid(c, r)) return false;
            if (this.dangerMap.isDangerous(c, r)) return false;
            return !this.isBlockedByPlayer(c, r);
        };

        if (checkMove(col, row - 1)) directions.push(this.player.controls.up);
        if (checkMove(col, row + 1)) directions.push(this.player.controls.down);
        if (checkMove(col - 1, row)) directions.push(this.player.controls.left);
        if (checkMove(col + 1, row)) directions.push(this.player.controls.right);

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

        // 이미 내 위치에 폭탄이 있는지 체크
        for (const bomb of this.game.bombs) {
            if (bomb.col === col && bomb.row === row) return false;
        }

        // 1. 아군 안전 시뮬레이션 (필수)
        const teamPlayers = this.game.players.filter(p => p.team === this.player.team && p.state !== 'DEAD');
        const isSafeForTeam = this.dangerMap.simulateBombForTeam(
            col, row, this.player.bombRange, teamPlayers
        );

        if (!isSafeForTeam) {
            return false; // 설치 시 아군/본인이 위험해지면 취소
        }

        // 2. 적 공격 (우선순위 높음)
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const enemyCol = Math.floor(nearestEnemy.x / this.player.tileSize);
            const enemyRow = Math.floor(nearestEnemy.y / this.player.tileSize);
            const dist = Math.abs(col - enemyCol) + Math.abs(row - enemyRow);

            // 적과 일직선상이고 사거리 내에 있음
            const inLine = (col === enemyCol || row === enemyRow);
            const inRange = dist <= this.player.bombRange;

            if (inLine && inRange) return true;
        }

        // 3. 파괴 가능한 블록 파밍
        const map = this.game.map;
        const directions = [
            { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
        ];

        for (const dir of directions) {
            const nc = col + dir.c;
            const nr = row + dir.r;
            // 바로 옆에 벽돌이 있으면 설치
            if (map.data[nr]?.[nc] === 2) {
                return true;
            }
        }

        return false;
    }
}
