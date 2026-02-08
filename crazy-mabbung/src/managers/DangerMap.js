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
                cell.sourceBombs = [];
            }
        }
    }
}
