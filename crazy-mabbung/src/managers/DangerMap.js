/**
 * 위험 지도 시스템
 * 폭탄/폭발의 위험 구역과 타이밍을 추적하여 AI의 안전한 이동을 지원
 */
export class DangerMap {
    constructor(map) {
        this.map = map;
        this.tileSize = map.tileSize;
        this.cols = map.cols;
        this.rows = map.rows;

        // 위험 그리드 초기화
        this.dangerGrid = this.createEmptyGrid();
    }

    /**
     * 빈 위험 그리드 생성
     * @returns {Array} 2D 배열, 각 셀은 위험 정보 객체
     */
    createEmptyGrid() {
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    dangerLevel: 0,        // 0=안전, 1=위험예정, 2=폭발중
                    timeUntilDanger: Infinity,  // 위험까지 남은 ms
                    dangerDuration: 0,     // 위험 지속 시간
                    sourceBombs: []        // 위협하는 폭탄들
                });
            }
            grid.push(row);
        }
        return grid;
    }

    /**
     * 그리드 초기화 (매 업데이트 시 호출)
     */
    resetGrid() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.dangerGrid[r][c];
                cell.dangerLevel = 0;
                cell.timeUntilDanger = Infinity;
                cell.dangerDuration = 0;
                cell.sourceBombs.length = 0;
            }
        }
    }

    /**
     * 단일 폭탄의 위험 범위 계산 및 그리드에 표시
     * @param {Bomb} bomb - 폭탄 객체
     */
    calculateBombDanger(bomb) {
        const directions = [
            { dc: 0, dr: -1 },  // 상
            { dc: 0, dr: 1 },   // 하
            { dc: -1, dr: 0 },  // 좌
            { dc: 1, dr: 0 }    // 우
        ];

        // 폭탄 위치 자체도 위험
        this.markDangerous(bomb.col, bomb.row, bomb);

        // 4방향으로 range만큼 확장
        for (const dir of directions) {
            for (let i = 1; i <= bomb.range; i++) {
                const col = bomb.col + dir.dc * i;
                const row = bomb.row + dir.dr * i;

                // 맵 범위 체크
                if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
                    break;
                }

                const tileType = this.map.data[row][col];

                // 벽이면 폭발 차단
                if (tileType === 1) {
                    break;
                }

                // 파괴 블록이면 이 타일까지만 위험하고 차단
                if (tileType === 2) {
                    this.markDangerous(col, row, bomb);
                    break;
                }

                // 빈 공간은 위험 표시
                this.markDangerous(col, row, bomb);
            }
        }
    }

    /**
     * 타일을 위험으로 표시
     * @param {number} col - 열
     * @param {number} row - 행
     * @param {Bomb} bomb - 원인 폭탄
     */
    markDangerous(col, row, bomb) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return;
        }

        const cell = this.dangerGrid[row][col];
        const timeUntilExplosion = bomb.timer;

        // 이 폭탄이 가장 빠른 위험인 경우 업데이트
        if (timeUntilExplosion < cell.timeUntilDanger) {
            cell.timeUntilDanger = timeUntilExplosion;
        }

        cell.dangerLevel = 1;  // 위험 예정
        cell.dangerDuration = 500;  // 폭발 지속 시간

        // 중복 방지
        if (!cell.sourceBombs.includes(bomb)) {
            cell.sourceBombs.push(bomb);
        }
    }

    /**
     * 현재 폭발 중인 타일 표시
     * @param {Array} explosions - 폭발 배열 [{col, row, timer}]
     */
    markActiveExplosions(explosions) {
        for (const exp of explosions) {
            if (exp.col >= 0 && exp.col < this.cols &&
                exp.row >= 0 && exp.row < this.rows) {
                const cell = this.dangerGrid[exp.row][exp.col];
                cell.dangerLevel = 2;  // 현재 폭발 중
                cell.timeUntilDanger = 0;
                cell.dangerDuration = exp.timer;
            }
        }
    }

    /**
     * 위험 지도 전체 업데이트
     * @param {Array} bombs - 폭탄 배열
     * @param {Array} explosions - 폭발 배열
     */
    update(bombs, explosions) {
        // 그리드 초기화
        this.resetGrid();

        // 모든 폭탄의 위험 범위 계산
        for (const bomb of bombs) {
            if (!bomb.isDead) {
                this.calculateBombDanger(bomb);
            }
        }

        // 현재 폭발 중인 타일 표시 (가장 위험)
        this.markActiveExplosions(explosions);
    }

    /**
     * 특정 타일이 위험한지 확인
     * @param {number} col - 열
     * @param {number} row - 행
     * @returns {boolean} 위험 여부
     */
    isDangerous(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return true;  // 맵 밖은 위험
        }
        return this.dangerGrid[row][col].dangerLevel > 0;
    }

    /**
     * 특정 타일의 위험 시작까지 남은 시간
     * @param {number} col - 열
     * @param {number} row - 행
     * @returns {number} 남은 ms (Infinity면 안전)
     */
    getTimeUntilDanger(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return 0;
        }
        return this.dangerGrid[row][col].timeUntilDanger;
    }

    /**
     * 특정 시점에 특정 타일이 안전한지 확인
     * @param {number} col - 열
     * @param {number} row - 행
     * @param {number} arrivalTime - 도착 예정 시간 (ms)
     * @returns {boolean} 안전 여부
     */
    isSafeAtTime(col, row, arrivalTime) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return false;
        }

        // 벽이나 블록은 이동 불가
        if (this.map.isSolid(col, row)) {
            return false;
        }

        const cell = this.dangerGrid[row][col];

        // 위험하지 않은 타일은 안전
        if (cell.dangerLevel === 0) {
            return true;
        }

        // 현재 폭발 중이면 위험
        if (cell.dangerLevel === 2) {
            return false;
        }

        // 위험 예정 타일: 폭발이 끝난 후에 도착해야 안전
        const explosionTime = cell.timeUntilDanger;
        const explosionEndTime = explosionTime + cell.dangerDuration;

        return arrivalTime > explosionEndTime;
    }

    /**
     * BFS로 안전한 탈출 경로 탐색
     * @param {number} startCol - 시작 열
     * @param {number} startRow - 시작 행
     * @param {number} playerSpeed - 플레이어 속도 (px/s)
     * @returns {Array|null} 방향 키 배열 또는 null (탈출 불가)
     */
    findSafePath(startCol, startRow, playerSpeed) {
        const moveTimePerTile = (this.tileSize / playerSpeed) * 1000;

        const directions = [
            { dc: 0, dr: -1, key: 'up' },
            { dc: 0, dr: 1, key: 'down' },
            { dc: -1, dr: 0, key: 'left' },
            { dc: 1, dr: 0, key: 'right' }
        ];

        // BFS 큐: {col, row, time, path}
        const queue = [{
            col: startCol,
            row: startRow,
            time: 0,
            path: []
        }];

        const visited = new Set();
        const startKey = `${startCol},${startRow},0`;
        visited.add(startKey);

        while (queue.length > 0) {
            const current = queue.shift();

            // 현재 위치가 안전한 목적지인지 확인
            // (시작 위치가 아니고, 해당 시간에 안전한 경우)
            if (current.path.length > 0 && this.isSafeAtTime(current.col, current.row, current.time)) {
                // 이 타일에 머물러도 안전한지 추가 확인
                // (폭발 전에 도착했다면 폭발 시점에도 안전해야 함)
                const cell = this.dangerGrid[current.row][current.col];
                if (cell.dangerLevel === 0) {
                    return current.path;
                }
            }

            // 4방향 탐색
            for (const dir of directions) {
                const newCol = current.col + dir.dc;
                const newRow = current.row + dir.dr;
                const arrivalTime = current.time + moveTimePerTile;
                const timeWindow = Math.floor(arrivalTime / 100);
                const key = `${newCol},${newRow},${timeWindow}`;

                if (visited.has(key)) continue;

                // 벽이나 블록은 이동 불가
                if (this.map.isSolid(newCol, newRow)) continue;

                // 이동 경로가 안전한지 확인 (통과 시점에 폭발하지 않아야 함)
                const midTime = current.time + moveTimePerTile / 2;
                if (!this.canPassThrough(current.col, current.row, newCol, newRow, midTime)) {
                    continue;
                }

                visited.add(key);

                queue.push({
                    col: newCol,
                    row: newRow,
                    time: arrivalTime,
                    path: [...current.path, dir.key]
                });
            }
        }

        return null;  // 탈출 경로 없음
    }

    /**
     * 두 타일 사이를 통과할 수 있는지 확인
     * @param {number} fromCol - 출발 열
     * @param {number} fromRow - 출발 행
     * @param {number} toCol - 도착 열
     * @param {number} toRow - 도착 행
     * @param {number} passTime - 통과 시점 (ms)
     * @returns {boolean} 통과 가능 여부
     */
    canPassThrough(fromCol, fromRow, toCol, toRow, passTime) {
        // 출발지와 도착지 모두 통과 시점에 안전해야 함
        const fromCell = this.dangerGrid[fromRow]?.[fromCol];
        const toCell = this.dangerGrid[toRow]?.[toCol];

        if (!fromCell || !toCell) return false;

        // 현재 폭발 중이면 통과 불가
        if (fromCell.dangerLevel === 2 || toCell.dangerLevel === 2) {
            return false;
        }

        // 통과 시점에 폭발 예정인지 확인
        if (fromCell.dangerLevel === 1) {
            const explosionStart = fromCell.timeUntilDanger;
            const explosionEnd = explosionStart + fromCell.dangerDuration;
            if (passTime >= explosionStart && passTime <= explosionEnd) {
                return false;
            }
        }

        if (toCell.dangerLevel === 1) {
            const explosionStart = toCell.timeUntilDanger;
            const explosionEnd = explosionStart + toCell.dangerDuration;
            if (passTime >= explosionStart && passTime <= explosionEnd) {
                return false;
            }
        }

        return true;
    }

    /**
     * 가상의 폭탄을 추가하고 탈출 가능 여부 확인
     * 실제 dangerGrid는 수정하지 않고 복사본으로 계산
     * @param {number} col - 폭탄 위치 열
     * @param {number} row - 폭탄 위치 행
     * @param {number} range - 폭탄 범위
     * @param {number} playerSpeed - 플레이어 속도
     * @returns {Array|null} 탈출 경로 또는 null
     */
    simulateBombAndFindEscape(col, row, range, playerSpeed) {
        // 가상의 폭탄 객체 생성
        const virtualBomb = {
            col: col,
            row: row,
            range: range,
            timer: 3000,  // 새 폭탄이므로 3초
            isDead: false
        };

        // 현재 그리드 상태 백업
        const backup = this.backupGrid();

        try {
            // 가상 폭탄 위험 계산 추가
            this.calculateBombDanger(virtualBomb);

            // 탈출 경로 탐색
            return this.findSafePath(col, row, playerSpeed);
        } finally {
            // 항상 그리드 복원
            this.restoreGrid(backup);
        }
    }

    /**
     * 현재 그리드 상태 백업
     * @returns {Array} 그리드 복사본
     */
    backupGrid() {
        const backup = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = this.dangerGrid[r][c];
                row.push({
                    dangerLevel: cell.dangerLevel,
                    timeUntilDanger: cell.timeUntilDanger,
                    dangerDuration: cell.dangerDuration,
                    sourceBombs: [...cell.sourceBombs]
                });
            }
            backup.push(row);
        }
        return backup;
    }

    /**
     * 그리드 상태 복원
     * @param {Array} backup - 백업 데이터
     */
    restoreGrid(backup) {
        if (!backup || backup.length !== this.rows ||
            !backup[0] || backup[0].length !== this.cols) {
            console.error('Backup dimensions mismatch');
            return;
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.dangerGrid[r][c];
                const saved = backup[r][c];
                cell.dangerLevel = saved.dangerLevel;
                cell.timeUntilDanger = saved.timeUntilDanger;
                cell.dangerDuration = saved.dangerDuration;
                cell.sourceBombs.length = 0;
                cell.sourceBombs.push(...saved.sourceBombs);
            }
        }
    }
}
