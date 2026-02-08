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
}
