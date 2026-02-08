# AI 팀 협동 및 전략 시스템 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI 플레이어들이 아군의 상태와 위치를 인지하고, 구조, 대피 지원, 오인 사격 방지 등 전략적인 팀플레이를 수행하도록 개선한다.

**Architecture:** `AIController`에 팀원 인지 로직을 추가하고, `DangerMap` 시뮬레이션 범위를 아군 전체로 확장한다. 의사결정 트리에 '구조(Rescue)' 단계를 최상위 우선순위로 삽입한다.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Canvas

---

### Task 1: 아군 탐색 및 상태 인지 로직 추가

**Files:**
- Modify: `src/managers/AIController.js`

**Step 1: 아군 관련 헬퍼 메서드 추가**

`findNearestEnemy()` 근처에 다음 메서드들을 추가합니다.

```javascript
    /**
     * 가장 가까운 아군 탐색
     */
    findNearestTeammate() {
        const player = this.player;
        let nearest = null;
        let minDist = Infinity;

        for (const p of this.game.players) {
            if (p === player) continue;
            if (p.state === 'DEAD') continue;
            if (p.team !== player.team) continue;

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

    /**
     * 도움이 필요한(갇힌) 아군 탐색
     */
    findTrappedTeammate() {
        return this.game.players.find(p =>
            p.team === this.player.team &&
            p.state === 'TRAPPED'
        );
    }
```

**Step 2: 커밋**

```bash
git add src/managers/AIController.js
git commit -m "feat(ai): add teammate awareness helpers"
```

---

### Task 2: 아군 구조(Rescue) 우선순위 로직 구현

**Files:**
- Modify: `src/managers/AIController.js`

**Step 1: makeDecision()에 구조 로직 삽입**

위험 체크(1순위) 바로 다음에 구조 로직을 추가합니다.

```javascript
    // ...
    const myCol = Math.floor(player.x / player.tileSize);
    const myRow = Math.floor(player.y / player.tileSize);

    // 1. 위험 체크
    if (this.isInDanger(myCol, myRow)) {
        this.currentDirection = this.findSafeDirection(myCol, myRow);
        return;
    }

    // 🆕 2. 아군 구조 체크 (최우선 전략)
    const trappedTeammate = this.findTrappedTeammate();
    if (trappedTeammate) {
        const tCol = Math.floor(trappedTeammate.x / player.tileSize);
        const tRow = Math.floor(trappedTeammate.y / player.tileSize);

        // 구조하러 이동
        this.currentDirection = this.getDirectionTowards(myCol, myRow, tCol, tRow);
        return;
    }
    // ...
```

**Step 2: 커밋**

```bash
git add src/managers/AIController.js
git commit -m "feat(ai): prioritize rescuing trapped teammates"
```

---

### Task 3: 아군 피해 방지(Friendly Fire Prevention) 시뮬레이션 확장

**Files:**
- Modify: `src/managers/DangerMap.js`
- Modify: `src/managers/AIController.js`

**Step 1: DangerMap에 다중 대상 탈출 체크 메서드 추가**

`src/managers/DangerMap.js`에 추가:

```javascript
    /**
     * 특정 위치에 폭탄 설치 시, 모든 아군이 탈출 가능한지 확인
     */
    simulateBombForTeam(col, row, range, teamPlayers) {
        // 가상의 폭탄 객체 생성
        const virtualBomb = { col, row, range, timer: 3000, isDead: false };
        const backup = this.backupGrid();
        this.calculateBombDanger(virtualBomb);

        let everyoneSafe = true;
        for (const p of teamPlayers) {
            if (p.state !== 'NORMAL') continue;
            const pCol = Math.floor(p.x / this.tileSize);
            const pRow = Math.floor(p.y / this.tileSize);
            const path = this.findSafePath(pCol, pRow, p.speed);

            // 현재 타일이 위험한데 탈출 경로가 없다면 위험한 것으로 판단
            if (!path || (path.length === 0 && this.isDangerous(pCol, pRow))) {
                everyoneSafe = false;
                break;
            }
        }

        this.restoreGrid(backup);
        return everyoneSafe;
    }
```

**Step 2: AIController에서 팀 시뮬레이션 활용**

`src/managers/AIController.js`의 `shouldPlaceBomb()` 내 `simulateBombAndFindEscape` 호출 부분을 `simulateBombForTeam`으로 대체하거나 함께 고려합니다.

**Step 3: 커밋**

```bash
git add src/managers/DangerMap.js src/managers/AIController.js
git commit -m "feat(ai): implement friendly fire prevention for team"
```

---

### Task 4: 팀원 간 거리 유지 및 경로 방해 방지

**Files:**
- Modify: `src/managers/AIController.js`

**Step 1: 이동 시 팀원 위치 고려**

`getDirectionTowards()` 메서드 수정하여 아군이 서 있는 타일은 피하도록 가중치 조절.

**Step 2: 커밋**

```bash
git add src/managers/AIController.js
git commit -m "feat(ai): avoid blocking teammates during movement"
```

---

### Task 5: 목표 분산 및 최종 튜닝

**Files:**
- Modify: `src/managers/AIController.js`

**Step 1: 타겟팅 로직 보완**

**Step 2: 최종 테스트 및 커밋**

```bash
git commit -m "feat(ai): optimize objective distribution and finish team play implementation"
```
