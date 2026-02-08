# AI 위험 지도(Danger Map) 시스템 설계

## 개요

AI 플레이어의 자폭 문제를 해결하기 위한 위험 지도 시스템 설계 문서입니다.

### 문제점

현재 AI가 다음과 같은 자폭 행동을 함:
- 탈출로 확인 없이 폭탄 설치
- 연쇄 폭발 예측 실패
- 위험 지역으로 도망

### 해결 방향

- **1단계:** DangerMap 시스템으로 자폭 방지 (이 문서)
- **2단계:** 연쇄 폭발 예측, 다중 위험 분석 등 확장

---

## 설계

### 1. DangerMap 클래스 구조

`src/managers/DangerMap.js`에 새 파일로 생성

```
DangerMap
├── dangerGrid[row][col]     // 2D 배열: 각 타일의 위험 정보
│   ├── dangerLevel          // 0 = 안전, 1 = 위험 예정, 2 = 폭발 중
│   ├── timeUntilDanger      // 위험해지기까지 남은 ms
│   └── sourceBombs[]        // 이 타일을 위협하는 폭탄들
│
├── update(bombs, explosions) // 매 프레임 위험 정보 갱신
├── isDangerous(col, row)     // 해당 타일이 위험한가?
├── getTimeUntilSafe(col, row)// 안전해지기까지 남은 시간
└── findSafePath(from, speed) // BFS로 안전한 탈출 경로 탐색
```

Game 루프에서 bombs/explosions 변경 시 갱신. AIController의 200ms 결정 주기보다 자주 업데이트.

---

### 2. 위험 계산 로직

#### 폭탄 위험 범위 계산

각 폭탄에 대해 4방향(상/하/좌/우)으로 `bomb.range`만큼 위험 구역 계산:

```javascript
calculateBombDanger(bomb) {
  const directions = [[0,-1], [0,1], [-1,0], [1,0]]; // 상하좌우

  for (each direction) {
    for (i = 0; i <= bomb.range; i++) {
      const tile = bomb위치 + direction * i;

      if (벽이면) break;           // 폭발이 벽에서 멈춤
      if (파괴블록이면) {
        markDangerous(tile, bomb);
        break;                      // 블록에서도 멈춤
      }
      markDangerous(tile, bomb);
    }
  }
}
```

#### 시간 기반 위험도

| 상태 | dangerLevel | timeUntilDanger |
|------|-------------|-----------------|
| 안전 | 0 | - |
| 3초 후 폭발 예정 | 1 | 3000ms |
| 1초 후 폭발 예정 | 1 | 1000ms |
| 현재 폭발 중 | 2 | 0 |

#### 다중 폭탄 처리

`sourceBombs[]` 배열로 모든 위협 추적, **가장 빠른 위험 시간** 기준 판단.

---

### 3. 안전 경로 탐색 (BFS)

폭탄 설치 전 "폭발 전에 안전한 곳으로 도망칠 수 있는가?" 판단:

```javascript
findSafePath(startCol, startRow, playerSpeed) {
  const queue = [{col, row, time: 0, path: []}];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();

    // 이 타일이 안전한가? (위험 시작 전에 도착 가능)
    if (isSafeAt(current.col, current.row, current.time)) {
      return current.path;  // 탈출 경로 발견!
    }

    // 4방향으로 확장
    for (each neighbor) {
      if (벽이 아니고 && 미방문) {
        const moveTime = tileSize / playerSpeed * 1000;
        queue.push({
          ...neighbor,
          time: current.time + moveTime,
          path: [...current.path, direction]
        });
      }
    }
  }
  return null;  // 탈출 불가
}
```

시간 고려:
- 플레이어 속도에 따라 한 칸 이동 시간 다름 (기본 ~427ms)
- 폭탄 퓨즈 3초 내 위험 구역 탈출 가능 여부 계산
- 이동 중 지나는 타일도 그 시점에 안전해야 함

---

### 4. AIController 통합

#### DangerMap 연결

```javascript
// Game.js에서 DangerMap 생성 (전체 AI가 공유)
this.dangerMap = new DangerMap(this.map);

// 매 프레임 갱신
this.dangerMap.update(this.bombs, this.explosions);

// AIController에 전달
new AIController(player, map, players, dangerMap);
```

#### shouldPlaceBomb() 수정

```javascript
shouldPlaceBomb() {
  // 기존 조건들 (쿨다운, 폭탄 개수 등)
  if (!기본조건충족) return false;

  // 🆕 핵심: 탈출 가능한지 먼저 확인
  const futureDanger = this.dangerMap.simulateBombAt(myCol, myRow, myRange);
  const escapePath = futureDanger.findSafePath(myCol, myRow, this.player.speed);

  if (!escapePath) {
    return false;  // 탈출 불가 → 설치 금지
  }

  // 탈출 가능하면 기존 로직 진행
  return 기존판단로직();
}
```

#### findSafeDirection() 수정

```javascript
findSafeDirection() {
  // DangerMap의 BFS 경로 활용
  const path = this.dangerMap.findSafePath(myCol, myRow, this.player.speed);
  if (path && path.length > 0) {
    return path[0];  // 첫 번째 이동 방향 반환
  }
  return this.getRandomDirection();  // 폴백
}
```

---

### 5. 2단계 확장 가능성

#### 연쇄 폭발 예측

```javascript
// DangerMap.calculateBombDanger() 확장
if (타일에_다른_폭탄_있음) {
  this.calculateChainExplosion(otherBomb, triggerTime);
}
```

#### 다중 위험 분석

```javascript
getCompositeDanger(col, row) {
  const threats = this.dangerGrid[row][col].sourceBombs;
  // 가장 빠른 위험, 가장 긴 위험 지속 시간 등 종합 판단
}
```

#### 적 폭탄 예측

```javascript
markPotentialDanger(enemyPosition, probability);
```

#### 안전도 점수화

```javascript
getSafetyScore(col, row) {
  // 거리, 시간, 탈출 경로 수 등 종합
}
```

---

## 파일 구조

```
src/managers/
├── DangerMap.js      // 🆕 위험 지도 시스템
└── AIController.js   // 수정: DangerMap 활용
```

---

## 구현 순서

1. DangerMap 클래스 생성 (기본 구조, dangerGrid)
2. 위험 계산 로직 구현 (calculateBombDanger)
3. BFS 안전 경로 탐색 구현 (findSafePath)
4. Game.js에서 DangerMap 생성 및 갱신
5. AIController 통합 (shouldPlaceBomb, findSafeDirection 수정)
6. 테스트 및 튜닝
