# AI Danger Map 시스템 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI가 자폭하지 않도록 위험 지도 시스템을 구현하여 안전한 폭탄 설치와 도망 경로 탐색을 가능하게 한다.

**Architecture:** DangerMap 클래스가 모든 폭탄/폭발의 위험 구역과 타이밍을 추적하고, BFS 알고리즘으로 안전한 탈출 경로를 계산한다. AIController는 DangerMap을 사용하여 폭탄 설치 전 탈출 가능 여부를 확인하고, 위험 시 최적 도망 방향을 결정한다.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Canvas

**Key Constants:**
- 폭탄 타이머: 3000ms
- 폭발 지속시간: 500ms
- 타일 크기: 64px
- 기본 플레이어 속도: 150px/s
- 한 칸 이동 시간: ~427ms (64 / 150 * 1000)

---

## Task 1: DangerMap 클래스 기본 구조 생성

**Files:**
- Create: `src/managers/DangerMap.js`

**Step 1: DangerMap 클래스 생성**

```javascript
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
```

**Step 2: 브라우저에서 게임 로드 확인**

Run: 브라우저에서 `index.html` 열기
Expected: 게임이 정상 로드됨 (DangerMap은 아직 사용 안 함)

**Step 3: 커밋**

```bash
git add src/managers/DangerMap.js
git commit -m "feat(ai): add DangerMap class skeleton"
```

---

## Task 2: 폭탄 위험 계산 로직 구현

**Files:**
- Modify: `src/managers/DangerMap.js`

**Step 1: 폭탄 위험 범위 계산 메서드 추가**

`createEmptyGrid()` 메서드 아래에 추가:

```javascript
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
```

**Step 2: 커밋**

```bash
git add src/managers/DangerMap.js
git commit -m "feat(ai): implement bomb danger calculation"
```

---

## Task 3: 폭발 중인 타일 처리 및 update 메서드

**Files:**
- Modify: `src/managers/DangerMap.js`

**Step 1: 폭발 처리 및 전체 업데이트 메서드 추가**

`markDangerous()` 메서드 아래에 추가:

```javascript
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
```

**Step 2: 커밋**

```bash
git add src/managers/DangerMap.js
git commit -m "feat(ai): add explosion tracking and update method"
```

---

## Task 4: BFS 안전 경로 탐색 구현

**Files:**
- Modify: `src/managers/DangerMap.js`

**Step 1: BFS 안전 경로 탐색 메서드 추가**

`getTimeUntilDanger()` 메서드 아래에 추가:

```javascript
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
            // 폭발이 끝날 때까지 기다려야 함
            return arrivalTime > cell.dangerDuration;
        }

        // 위험 예정 타일: 폭발 전에 도착하고 통과할 수 있거나,
        // 폭발이 끝난 후에 도착해야 안전
        const explosionTime = cell.timeUntilDanger;
        const explosionEndTime = explosionTime + cell.dangerDuration;

        // 폭발 전에 도착해서 지나갈 수 있는 경우 (현재 위치가 목적지일 때만)
        // 또는 폭발이 끝난 후에 도착하는 경우
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
        visited.add(`${startCol},${startRow}`);

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
                const key = `${newCol},${newRow}`;

                if (visited.has(key)) continue;

                // 벽이나 블록은 이동 불가
                if (this.map.isSolid(newCol, newRow)) continue;

                const arrivalTime = current.time + moveTimePerTile;

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
```

**Step 2: 커밋**

```bash
git add src/managers/DangerMap.js
git commit -m "feat(ai): implement BFS safe path finding"
```

---

## Task 5: 가상 폭탄 시뮬레이션 메서드

**Files:**
- Modify: `src/managers/DangerMap.js`

**Step 1: 폭탄 설치 시뮬레이션 메서드 추가**

`canPassThrough()` 메서드 아래에 추가:

```javascript
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

        // 가상 폭탄 위험 계산 추가
        this.calculateBombDanger(virtualBomb);

        // 탈출 경로 탐색
        const escapePath = this.findSafePath(col, row, playerSpeed);

        // 그리드 복원
        this.restoreGrid(backup);

        return escapePath;
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
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.dangerGrid[r][c];
                const saved = backup[r][c];
                cell.dangerLevel = saved.dangerLevel;
                cell.timeUntilDanger = saved.timeUntilDanger;
                cell.dangerDuration = saved.dangerDuration;
                cell.sourceBombs = saved.sourceBombs;
            }
        }
    }
```

**Step 2: 커밋**

```bash
git add src/managers/DangerMap.js
git commit -m "feat(ai): add bomb placement simulation for escape check"
```

---

## Task 6: Game.js에 DangerMap 통합

**Files:**
- Modify: `src/core/Game.js`

**Step 1: DangerMap import 추가**

파일 상단 import 섹션에 추가 (line 6 근처):

```javascript
import { DangerMap } from '../managers/DangerMap.js';
```

**Step 2: DangerMap 인스턴스 생성**

`restart()` 메서드 내에서 `this.map = new Map(...)` 다음에 추가 (line 38 근처):

```javascript
        // DangerMap 생성 (AI들이 공유)
        this.dangerMap = new DangerMap(this.map);
```

**Step 3: AIController 생성 시 dangerMap 전달**

`this.aiControllers` 배열 생성 부분 수정 (lines 97-102):

```javascript
        // AI Controllers (with DangerMap)
        this.aiControllers = [
            new AIController(this.ai1_1, this, this.dangerMap),
            new AIController(this.ai1_2, this, this.dangerMap),
            new AIController(this.ai2_1, this, this.dangerMap),
            new AIController(this.ai2_2, this, this.dangerMap)
        ];
```

**Step 4: update() 메서드에서 DangerMap 업데이트**

`update(deltaTime)` 메서드 시작 부분, `if (this.gameOver) return;` 다음에 추가:

```javascript
        // DangerMap 업데이트
        this.dangerMap.update(this.bombs, this.explosions);
```

**Step 5: 커밋**

```bash
git add src/core/Game.js
git commit -m "feat(ai): integrate DangerMap into Game loop"
```

---

## Task 7: AIController에 DangerMap 활용

**Files:**
- Modify: `src/managers/AIController.js`

**Step 1: 생성자에서 dangerMap 받기**

생성자 수정 (lines 6-15):

```javascript
    constructor(player, game, dangerMap) {
        this.player = player;
        this.game = game;
        this.dangerMap = dangerMap;
        this.decisionTimer = 0;
        this.decisionInterval = 200;
        this.currentDirection = null;
        this.targetPos = null;
        this.lastBombTime = 0;
        this.bombCooldown = 2000;
    }
```

**Step 2: shouldPlaceBomb() 메서드 수정**

기존 `shouldPlaceBomb()` 메서드를 교체 (lines 239-274):

```javascript
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
```

**Step 3: findSafeDirection() 메서드 수정**

기존 `findSafeDirection()` 메서드를 교체 (lines 129-149):

```javascript
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
```

**Step 4: isInDanger() 메서드 수정 (선택적 개선)**

기존 `isInDanger()` 메서드도 DangerMap 활용하도록 수정 (lines 89-103):

```javascript
    isInDanger(col, row) {
        // 🆕 DangerMap 활용
        return this.dangerMap.isDangerous(col, row);
    }
```

**Step 5: 커밋**

```bash
git add src/managers/AIController.js
git commit -m "feat(ai): integrate DangerMap into AIController for safe decisions"
```

---

## Task 8: 테스트 및 튜닝

**Files:**
- None (브라우저 테스트)

**Step 1: 기본 동작 테스트**

Run: 브라우저에서 게임 실행
Expected:
- 게임이 정상 로드됨
- AI가 폭탄을 설치함
- AI가 자폭하는 빈도가 현저히 줄어듦

**Step 2: 엣지 케이스 테스트**

테스트 시나리오:
1. AI가 막다른 길에서 폭탄 설치하지 않는지 확인
2. AI가 위험 지역에서 효과적으로 도망가는지 확인
3. 여러 폭탄이 있을 때 AI가 안전한 경로를 찾는지 확인

**Step 3: 최종 커밋**

```bash
git add -A
git commit -m "feat(ai): complete DangerMap system for AI self-destruct prevention"
```

---

## 파일 변경 요약

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/managers/DangerMap.js` | 생성 | 위험 지도 시스템 클래스 |
| `src/core/Game.js` | 수정 | DangerMap 생성 및 업데이트 통합 |
| `src/managers/AIController.js` | 수정 | DangerMap 활용하여 안전한 결정 |
