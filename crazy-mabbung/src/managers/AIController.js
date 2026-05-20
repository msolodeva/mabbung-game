const CARDINAL_DIRECTIONS = [
    { name: 'up', dc: 0, dr: -1 },
    { name: 'down', dc: 0, dr: 1 },
    { name: 'left', dc: -1, dr: 0 },
    { name: 'right', dc: 1, dr: 0 }
];

const ITEM_PRIORITY = {
    count: 3,
    speed: 2,
    range: 1
};

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
        this.decisionInterval = 120;
        this.currentDirection = null;
        this.targetPos = null;
        this.lastBombTime = 0;
        this.bombCooldown = 1600;
        this.tacticalRange = 14;

        this.lastTileKey = null;
        this.stuckTimer = 0;
        this.avoidDirection = null;
    }

    update(deltaTime) {
        if (this.player.state !== 'NORMAL') return {};

        this.decisionTimer += deltaTime;
        this.updateStuckState(deltaTime);

        const input = {};

        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.makeDecision();
        }

        if (this.currentDirection) {
            input[this.currentDirection] = true;
        }

        if (this.shouldPlaceBomb()) {
            input[this.player.controls.bomb] = true;
            this.lastBombTime = Date.now();
            this.currentDirection = null;
        }

        return input;
    }

    updateStuckState(deltaTime) {
        const { col, row } = this.getTile(this.player);
        const tileKey = this.tileKey(col, row);

        if (this.currentDirection && tileKey === this.lastTileKey) {
            this.stuckTimer += deltaTime;
        } else {
            this.stuckTimer = 0;
            this.avoidDirection = null;
        }

        if (this.stuckTimer > 900) {
            this.avoidDirection = this.currentDirection;
            this.currentDirection = null;
            this.stuckTimer = 0;
        }

        this.lastTileKey = tileKey;
    }

    makeDecision() {
        const { col: myCol, row: myRow } = this.getTile(this.player);

        // 1. 위험 회피: 폭탄게임에서는 생존이 최우선이다.
        if (this.isInDanger(myCol, myRow)) {
            this.currentDirection = this.findSafeDirection(myCol, myRow);
            return;
        }

        // 2. 갇힌 아군 구출
        const trappedTeammate = this.findTrappedTeammate();
        if (trappedTeammate) {
            const { col: tCol, row: tRow } = this.getTile(trappedTeammate);
            const move = this.findRescuePath(myCol, myRow, tCol, tRow);
            if (move) {
                this.currentDirection = move;
                return;
            }
        }

        // 3. 갇힌 적 처치
        const trappedEnemy = this.findTrappedEnemy();
        if (trappedEnemy) {
            const { col: eCol, row: eRow } = this.getTile(trappedEnemy);
            const move = this.findRescuePath(myCol, myRow, eCol, eRow);
            if (move) {
                this.currentDirection = move;
                return;
            }
        }

        // 4. 일반 적을 향해 몸으로 들이받지 않고, 폭탄 라인을 먼저 만든다.
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const attackPlan = this.findBestAttackPlan(myCol, myRow, nearestEnemy);
            if (attackPlan && attackPlan.distance <= this.tacticalRange) {
                this.targetPos = { col: attackPlan.targetCol, row: attackPlan.targetRow, type: 'attack' };
                this.currentDirection = attackPlan.nextMove;
                return;
            }
        }

        // 5. 안전하고 실제로 도달 가능한 아이템 획득
        const itemTarget = this.findBestItemTarget(myCol, myRow);
        if (itemTarget && (!nearestEnemy || itemTarget.distance <= 8)) {
            this.targetPos = { col: itemTarget.item.col, row: itemTarget.item.row, type: 'item' };
            this.currentDirection = itemTarget.nextMove;
            return;
        }

        // 6. 블록 파밍: 블록 자체가 아니라 폭탄을 놓을 수 있는 타일로 이동
        const farmingPlan = this.findBestFarmingPlan(myCol, myRow);
        if (farmingPlan) {
            this.targetPos = { col: farmingPlan.targetCol, row: farmingPlan.targetRow, type: 'farm' };
            this.currentDirection = farmingPlan.nextMove;
            return;
        }

        // 7. 적 압박: 공격 각이 아직 없으면 적 주변 안전 지점으로 거리를 좁힌다.
        if (nearestEnemy) {
            const pressureMove = this.findEnemyPressureMove(myCol, myRow, nearestEnemy);
            if (pressureMove) {
                this.currentDirection = pressureMove;
                return;
            }
        }

        // 8. 아무것도 할 게 없으면 안전한 방향으로 배회
        if (!this.currentDirection || Math.random() < 0.05) {
            this.currentDirection = this.getRandomDirection(myCol, myRow);
        }
    }

    /**
     * BFS 길찾기 알고리즘
     * 위험한 곳과 벽을 피해서 목표까지 가는 다음 이동 방향 반환
     */
    findNextMove(startCol, startRow, targetCol, targetRow) {
        const path = this.findPath(startCol, startRow, targetCol, targetRow, {
            maxDepth: 30,
            allowTargetOccupied: true
        });

        return path?.nextMove ?? null;
    }

    findPath(startCol, startRow, targetCol, targetRow, options = {}) {
        if (startCol === targetCol && startRow === targetRow) {
            return {
                nextMove: null,
                distance: 0,
                targetCol,
                targetRow
            };
        }

        const maxDepth = options.maxDepth ?? 30;
        const queue = [{
            col: startCol,
            row: startRow,
            distance: 0,
            firstMove: null
        }];
        const visited = new Set([this.tileKey(startCol, startRow)]);

        while (queue.length > 0) {
            const current = queue.shift();
            const directions = this.getOrderedDirections(current.col, current.row, targetCol, targetRow);

            if (current.distance >= maxDepth) continue;

            for (const dir of directions) {
                const nc = current.col + dir.dc;
                const nr = current.row + dir.dr;
                const key = this.tileKey(nc, nr);

                if (visited.has(key)) continue;
                if (!this.isInsideMap(nc, nr)) continue;

                const isTarget = nc === targetCol && nr === targetRow;
                if (!this.canTraverse(nc, nr, {
                    allowDanger: options.allowDanger,
                    allowTargetSolid: options.allowTargetSolid && isTarget,
                    allowTargetOccupied: options.allowTargetOccupied && isTarget
                })) {
                    continue;
                }

                const nextMove = current.firstMove ?? this.player.controls[dir.name];
                const nextDistance = current.distance + 1;

                if (isTarget) {
                    return {
                        nextMove,
                        distance: nextDistance,
                        targetCol,
                        targetRow
                    };
                }

                visited.add(key);
                queue.push({
                    col: nc,
                    row: nr,
                    distance: nextDistance,
                    firstMove: nextMove
                });
            }
        }

        return null;
    }

    getOrderedDirections(fromCol, fromRow, targetCol, targetRow) {
        return [...CARDINAL_DIRECTIONS].sort((a, b) => {
            const aDist = Math.abs(targetCol - (fromCol + a.dc)) + Math.abs(targetRow - (fromRow + a.dr));
            const bDist = Math.abs(targetCol - (fromCol + b.dc)) + Math.abs(targetRow - (fromRow + b.dr));
            if (aDist !== bDist) return aDist - bDist;

            const aAvoid = this.player.controls[a.name] === this.avoidDirection ? 1 : 0;
            const bAvoid = this.player.controls[b.name] === this.avoidDirection ? 1 : 0;
            if (aAvoid !== bAvoid) return aAvoid - bAvoid;

            return CARDINAL_DIRECTIONS.indexOf(a) - CARDINAL_DIRECTIONS.indexOf(b);
        });
    }

    canTraverse(col, row, options = {}) {
        if (!this.isInsideMap(col, row)) return false;

        if (!options.allowTargetSolid && this.game.map.isSolid(col, row)) {
            return false;
        }

        if (this.hasBombAt(col, row)) {
            return false;
        }

        if (!options.allowDanger && this.dangerMap.isDangerous(col, row)) {
            return false;
        }

        if (!options.allowTargetOccupied && this.isBlockedByPlayer(col, row)) {
            return false;
        }

        return true;
    }

    isBlockedByPlayer(col, row) {
        for (const p of this.game.players) {
            if (p === this.player || p.state === 'DEAD') continue;

            const { col: pc, row: pr } = this.getTile(p);

            if (pc === col && pr === row) {
                if (p.state === 'TRAPPED' && p.team === this.player.team) return false;
                return true;
            }
        }
        return false;
    }

    findBestItemTarget(col, row) {
        const candidates = [];

        for (const item of this.game.items) {
            if (this.dangerMap.isDangerous(item.col, item.row)) continue;
            if (this.isBlockedByPlayer(item.col, item.row)) continue;

            const path = this.findPath(col, row, item.col, item.row, { maxDepth: 30 });
            if (!path) continue;

            const priority = ITEM_PRIORITY[item.type] ?? 0;
            candidates.push({
                item,
                nextMove: path.nextMove,
                distance: path.distance,
                score: path.distance * 10 - priority
            });
        }

        candidates.sort((a, b) => a.score - b.score || a.distance - b.distance);
        return candidates[0] ?? null;
    }

    findNearestItem(col, row) {
        return this.findBestItemTarget(col, row)?.item ?? null;
    }

    isInDanger(col, row) {
        return this.dangerMap.isDangerous(col, row);
    }

    findSafeDirection(col, row) {
        const path = this.dangerMap.findSafePath(col, row, this.player.speed);

        if (path && path.length > 0) {
            const directionKey = path[0];
            const keyMap = {
                up: this.player.controls.up,
                down: this.player.controls.down,
                left: this.player.controls.left,
                right: this.player.controls.right
            };
            return keyMap[directionKey];
        }

        const safeMoves = CARDINAL_DIRECTIONS
            .map(dir => ({
                key: this.player.controls[dir.name],
                col: col + dir.dc,
                row: row + dir.dr
            }))
            .filter(move => this.canTraverse(move.col, move.row));

        return safeMoves[0]?.key ?? null;
    }

    findNearestEnemy() {
        const player = this.player;
        let nearest = null;
        let minDist = Infinity;

        for (const p of this.game.players) {
            if (p === player) continue;
            if (p.state === 'DEAD') continue;
            if (p.team === player.team) continue;

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
        const maxRescueDist = 7;
        const { col: myCol, row: myRow } = this.getTile(player);

        const teammates = this.game.players.filter(p => {
            if (p === player || p.team !== player.team || p.state !== 'TRAPPED') return false;
            const { col: tCol, row: tRow } = this.getTile(p);
            return this.manhattan(myCol, myRow, tCol, tRow) <= maxRescueDist;
        });

        if (teammates.length === 0) return null;

        return teammates.sort((a, b) => {
            const distA = Math.hypot(a.x - player.x, a.y - player.y);
            const distB = Math.hypot(b.x - player.x, b.y - player.y);
            return distA - distB;
        })[0];
    }

    /**
     * 근처에서 갇힌 적 찾기 (터치로 처치 대상)
     * 맨해튼 거리 8타일 이내
     */
    findTrappedEnemy() {
        const player = this.player;
        const maxKillDist = 8;
        const { col: myCol, row: myRow } = this.getTile(player);

        const enemies = this.game.players.filter(p => {
            if (p === player || p.team === player.team || p.state !== 'TRAPPED') return false;
            const { col: eCol, row: eRow } = this.getTile(p);
            return this.manhattan(myCol, myRow, eCol, eRow) <= maxKillDist;
        });

        if (enemies.length === 0) return null;

        return enemies.sort((a, b) => {
            const distA = Math.hypot(a.x - player.x, a.y - player.y);
            const distB = Math.hypot(b.x - player.x, b.y - player.y);
            return distA - distB;
        })[0];
    }

    /**
     * 구출 전용 BFS 길찾기
     * 활성 폭발(dangerLevel===2)만 회피하고, 폭발 예정(dangerLevel===1)은 통과 허용
     * 갇힌 동료에게 효과적으로 접근 가능
     */
    findRescuePath(startCol, startRow, targetCol, targetRow) {
        if (startCol === targetCol && startRow === targetRow) return null;

        const queue = [{ col: startCol, row: startRow, path: [] }];
        const visited = new Set([this.tileKey(startCol, startRow)]);
        const maxDepth = 15;

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.col === targetCol && current.row === targetRow) {
                return current.path[0];
            }

            if (current.path.length >= maxDepth) continue;

            for (const dir of this.getOrderedDirections(current.col, current.row, targetCol, targetRow)) {
                const nc = current.col + dir.dc;
                const nr = current.row + dir.dr;
                const key = this.tileKey(nc, nr);

                if (visited.has(key)) continue;
                if (!this.isInsideMap(nc, nr)) continue;

                const isTarget = nc === targetCol && nr === targetRow;
                if (!isTarget && this.game.map.isSolid(nc, nr)) continue;

                const cell = this.dangerMap.dangerGrid[nr]?.[nc];
                if (cell && cell.dangerLevel === 2) continue;

                if (!isTarget && this.isBlockedByPlayer(nc, nr)) continue;

                visited.add(key);
                queue.push({
                    col: nc,
                    row: nr,
                    path: [...current.path, this.player.controls[dir.name]]
                });
            }
        }

        return null;
    }

    findBestAttackPlan(startCol, startRow, enemy) {
        const { col: enemyCol, row: enemyRow } = this.getTile(enemy);
        const candidates = [];

        for (const dir of CARDINAL_DIRECTIONS) {
            for (let dist = 1; dist <= this.player.bombRange; dist++) {
                const col = enemyCol - dir.dc * dist;
                const row = enemyRow - dir.dr * dist;

                if (!this.canUseBombTile(col, row)) continue;
                if (!this.hasClearBlastLine(col, row, enemyCol, enemyRow, this.player.bombRange)) continue;
                if (!this.canEscapeAfterBomb(col, row)) continue;

                const path = this.findPath(startCol, startRow, col, row, { maxDepth: this.tacticalRange });
                if (!path) continue;

                candidates.push({
                    targetCol: col,
                    targetRow: row,
                    nextMove: path.nextMove,
                    distance: path.distance,
                    score: path.distance * 10 + dist
                });
            }
        }

        candidates.sort((a, b) => a.score - b.score || a.distance - b.distance);
        return candidates[0] ?? null;
    }

    findEnemyPressureMove(startCol, startRow, enemy) {
        const { col: enemyCol, row: enemyRow } = this.getTile(enemy);
        const candidates = [];

        for (const dir of CARDINAL_DIRECTIONS) {
            const col = enemyCol + dir.dc;
            const row = enemyRow + dir.dr;

            if (!this.canTraverse(col, row)) continue;

            const path = this.findPath(startCol, startRow, col, row, { maxDepth: this.tacticalRange });
            if (!path) continue;

            candidates.push({
                nextMove: path.nextMove,
                distance: path.distance
            });
        }

        candidates.sort((a, b) => a.distance - b.distance);
        return candidates[0]?.nextMove ?? null;
    }

    findBestFarmingPlan(startCol, startRow) {
        const candidates = [];
        const map = this.game.map;

        for (let row = 1; row < map.rows - 1; row++) {
            for (let col = 1; col < map.cols - 1; col++) {
                if (!this.canUseBombTile(col, row)) continue;

                const breakableCount = this.countBreakablesInBlast(col, row, this.player.bombRange);
                if (breakableCount === 0) continue;
                if (!this.canEscapeAfterBomb(col, row)) continue;

                const path = this.findPath(startCol, startRow, col, row, { maxDepth: 30 });
                if (!path) continue;

                candidates.push({
                    targetCol: col,
                    targetRow: row,
                    nextMove: path.nextMove,
                    distance: path.distance,
                    breakableCount,
                    score: path.distance * 8 - breakableCount * 6
                });
            }
        }

        candidates.sort((a, b) => a.score - b.score || b.breakableCount - a.breakableCount);
        return candidates[0] ?? null;
    }

    findNearestBreakableBlock(col, row) {
        const map = this.game.map;
        let nearest = null;
        let minDist = Infinity;

        for (let r = 0; r < map.rows; r++) {
            for (let c = 0; c < map.cols; c++) {
                if (map.data[r][c] !== 2) continue;
                if (this.dangerMap.isDangerous(c, r)) continue;

                const dist = this.manhattan(c, r, col, row);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = { col: c, row: r };
                }
            }
        }

        return nearest;
    }

    isAdjacent(col1, row1, col2, row2) {
        return this.manhattan(col1, row1, col2, row2) === 1;
    }

    getRandomDirection(col, row) {
        const directions = CARDINAL_DIRECTIONS
            .map(dir => ({
                key: this.player.controls[dir.name],
                col: col + dir.dc,
                row: row + dir.dr
            }))
            .filter(move => move.key !== this.avoidDirection)
            .filter(move => this.canTraverse(move.col, move.row));

        if (directions.length > 0) {
            return directions[Math.floor(Math.random() * directions.length)].key;
        }
        return null;
    }

    shouldPlaceBomb() {
        if (Date.now() - this.lastBombTime < this.bombCooldown) return false;
        if (this.player.activeBombs >= this.player.maxBombs) return false;

        const { col, row } = this.getTile(this.player);

        if (this.hasBombAt(col, row)) return false;
        if (this.dangerMap.isDangerous(col, row)) return false;

        if (!this.canTeamSurviveBomb(col, row)) {
            return false;
        }

        if (this.countEnemiesInBlast(col, row, this.player.bombRange) > 0) {
            return true;
        }

        return this.countBreakablesInBlast(col, row, this.player.bombRange) > 0;
    }

    hasClearBlastLine(fromCol, fromRow, targetCol, targetRow, range) {
        const sameCol = fromCol === targetCol;
        const sameRow = fromRow === targetRow;
        if (!sameCol && !sameRow) return false;

        const distance = this.manhattan(fromCol, fromRow, targetCol, targetRow);
        if (distance === 0 || distance > range) return false;

        const dc = Math.sign(targetCol - fromCol);
        const dr = Math.sign(targetRow - fromRow);

        for (let step = 1; step <= distance; step++) {
            const col = fromCol + dc * step;
            const row = fromRow + dr * step;
            const tile = this.game.map.data[row]?.[col];

            if (tile === 1) return false;
            if (tile === 2) return false;
        }

        return true;
    }

    countEnemiesInBlast(col, row, range) {
        let count = 0;

        for (const p of this.game.players) {
            if (p === this.player || p.state === 'DEAD' || p.team === this.player.team) continue;

            const { col: enemyCol, row: enemyRow } = this.getTile(p);
            if (this.hasClearBlastLine(col, row, enemyCol, enemyRow, range)) {
                count++;
            }
        }

        return count;
    }

    countBreakablesInBlast(col, row, range) {
        let count = 0;

        for (const dir of CARDINAL_DIRECTIONS) {
            for (let dist = 1; dist <= range; dist++) {
                const nc = col + dir.dc * dist;
                const nr = row + dir.dr * dist;
                const tile = this.game.map.data[nr]?.[nc];

                if (tile === undefined || tile === 1) break;
                if (tile === 2) {
                    count++;
                    break;
                }
            }
        }

        return count;
    }

    canUseBombTile(col, row) {
        if (!this.canTraverse(col, row)) return false;
        return !this.hasBombAt(col, row);
    }

    canEscapeAfterBomb(col, row) {
        if (typeof this.dangerMap.simulateBombAndFindEscape === 'function') {
            const escapePath = this.dangerMap.simulateBombAndFindEscape(
                col,
                row,
                this.player.bombRange,
                this.player.speed
            );
            return Array.isArray(escapePath) && escapePath.length > 0;
        }

        return this.canTeamSurviveBomb(col, row);
    }

    canTeamSurviveBomb(col, row) {
        const teamPlayers = this.game.players.filter(p => p.team === this.player.team && p.state !== 'DEAD');
        return this.dangerMap.simulateBombForTeam(
            col,
            row,
            this.player.bombRange,
            teamPlayers
        );
    }

    hasBombAt(col, row) {
        return this.game.bombs.some(bomb => !bomb.isDead && bomb.col === col && bomb.row === row);
    }

    getTile(entity) {
        const tileSize = entity.tileSize ?? this.player.tileSize;
        return {
            col: Math.floor(entity.x / tileSize),
            row: Math.floor(entity.y / tileSize)
        };
    }

    isInsideMap(col, row) {
        return col >= 0 && col < this.game.map.cols && row >= 0 && row < this.game.map.rows;
    }

    tileKey(col, row) {
        return `${col},${row}`;
    }

    manhattan(col1, row1, col2, row2) {
        return Math.abs(col1 - col2) + Math.abs(row1 - row2);
    }
}
