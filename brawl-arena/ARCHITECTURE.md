# Brawl Arena - 아키텍처 문서

이 문서는 Brawl Arena 게임의 시스템 아키텍처, 설계 패턴, 데이터 흐름을 설명합니다.

## 목차

1. [전체 아키텍처](#전체-아키텍처)
2. [핵심 시스템](#핵심-시스템)
3. [게임 루프](#게임-루프)
4. [엔티티 시스템](#엔티티-시스템)
5. [AI 시스템](#ai-시스템)
6. [렌더링 시스템](#렌더링-시스템)
7. [게임 모드 시스템](#게임-모드-시스템)
8. [데이터 흐름](#데이터-흐름)
9. [설계 패턴](#설계-패턴)
10. [성능 최적화](#성능-최적화)

---

## 전체 아키텍처

Brawl Arena는 **레이어드 아키텍처 (Layered Architecture)**를 따릅니다:

```
┌─────────────────────────────────────────┐
│     Presentation Layer (UI/Canvas)      │
│  - HTML/CSS                             │
│  - RenderSystem (Canvas Rendering)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Application Layer (Game Logic)      │
│  - main.js (초기화)                      │
│  - Game.js (게임 컨트롤러)               │
│  - InputManager (입력 처리)              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Domain Layer (게임 도메인)          │
│  - Entities (Brawler, Projectile, etc.) │
│  - GameMode (GemGrab)                   │
│  - AI (AIController, Pathfinding)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Infrastructure Layer (유틸리티)         │
│  - Vector2 (수학)                        │
│  - constants.js (설정)                   │
│  - AudioManager, Effects                │
└─────────────────────────────────────────┘
```

---

## 핵심 시스템

### 1. Game (게임 컨트롤러)
**위치**: `js/game/Game.js`

**역할**:
- 게임의 중앙 컨트롤러 역할
- 모든 시스템 초기화 및 조율
- 게임 루프 관리
- 게임 상태 관리

**주요 구성 요소**:
```javascript
{
  map: GameMap,              // 맵 데이터 및 충돌 감지
  renderSystem: RenderSystem, // 렌더링 시스템
  inputManager: InputManager, // 입력 처리
  audioManager: AudioManager, // 오디오 재생
  effectsManager: EffectsManager, // 시각 효과
  flowField: FlowField,      // 공유 경로 탐색 필드

  brawlers: [],              // 모든 브롤러
  projectiles: [],           // 모든 발사체
  gems: [],                  // 보석
  bears: [],                 // Nita의 곰
  aiControllers: [],         // AI 컨트롤러

  gameMode: GemGrabMode,     // 게임 모드
  state: GAME_STATES         // PLAYING, VICTORY, DEFEAT
}
```

**생명주기**:
1. `constructor()` - 시스템 초기화
2. `init()` - 엔티티 생성 (플레이어, 봇, 맵)
3. `start()` - 게임 루프 시작
4. `gameLoop()` - 매 프레임 update + render
5. `stop()` / `cleanup()` - 게임 종료

---

### 2. 렌더링 시스템 (RenderSystem)
**위치**: `js/game/RenderSystem.js`

**역할**:
- 게임 로직과 렌더링 분리 (Single Responsibility Principle)
- Canvas 좌표 변환 관리
- 카메라 시스템 (줌, 위치)
- 레이어별 렌더링 순서 제어

**렌더링 순서**:
```
1. 배경 (맵)
2. 바닥 요소 (보석)
3. 효과 (Spike 필드)
4. 발사체
5. 소환물 (Bear)
6. 브롤러 (Y축 정렬로 Depth Sorting)
7. 시각 효과 (파티클)
8. UI 인디케이터
```

**카메라 시스템**:
```javascript
camera: {
  x: 중심 X 좌표,
  y: 중심 Y 좌표,
  width: 뷰포트 너비 (월드 좌표),
  height: 뷰포트 높이 (월드 좌표),
  zoom: 전체 맵을 화면에 맞추는 스케일
}
```

**좌표 변환**:
```javascript
ctx.save();
ctx.scale(camera.zoom, camera.zoom);     // 줌 적용
ctx.translate(-camera.x, -camera.y);     // 카메라 위치 적용
// ... 렌더링 ...
ctx.restore();
```

---

### 3. 입력 시스템 (InputManager)
**위치**: `js/input/InputManager.js`

**역할**:
- 키보드/마우스/터치 입력 처리
- 2플레이어 입력 분리 (WASD vs 방향키)
- 입력을 게임 액션으로 변환

**입력 매핑**:

**플레이어 1 (블루 팀)**:
- 이동: W/A/S/D
- 공격: 마우스 좌클릭 (방향은 마우스 커서)
- 슈퍼: Space 또는 마우스 우클릭

**플레이어 2 (레드 팀)**:
- 이동: 방향키 (↑/←/↓/→)
- 공격: Enter
- 슈퍼: Shift

**입력 흐름**:
```
Input Event → InputManager → Game.update() → Brawler.attack()
```

---

### 4. AI 시스템
**위치**: `js/ai/`

#### 4.1 AIController
**파일**: `js/ai/AIController.js`

**역할**: 봇의 행동 결정 및 실행

**상태 머신 (State Machine)**:
```
States:
- idle: 대기
- patrol: 순찰 (맵 중앙 주변 배회)
- chase: 적 추격
- attack: 공격
- collectGem: 보석 수집
- retreat: 후퇴 (저체력/많은 보석 보유 시)
```

**의사 결정 트리**:
```
1. 후퇴 필요성 평가
   ├─ 체력 < 25% && 보석 보유 → retreat
   ├─ 보석 >= 5개 && 체력 < 45% → retreat
   └─ 탄약 0 && 적 근접 && 체력 < 50% → retreat

2. 일반 행동 우선순위
   ├─ Priority 1: 위험에 처한 아군 지원 (거리 < 500)
   ├─ Priority 2: 보석 수집 (보석이 적보다 가까움)
   └─ Priority 3: 적 공격/추격
```

**전략적 타겟팅**:
- 카운터 관계 고려 (예: Shelly가 Poco를 우선 공격)
- 저체력 적 우선순위
- 보석을 많이 보유한 적 집중 공격
- 아군 지원 (위험한 상황의 팀원 도움)

**슈퍼 스킬 사용 로직**:
- 각 브롤러별 맞춤 로직
- Poco: 체력 < 60% 또는 아군 체력 < 50% 시 힐링
- Nita: 적이 거리 500 이내 시 곰 소환
- 공격형: 적이 공격 범위 내 있을 때 사용

#### 4.2 FlowField (흐름장)
**파일**: `js/ai/FlowField.js`

**역할**:
- 모든 봇이 공유하는 효율적인 경로 탐색 시스템
- 목적지까지의 최적 방향을 사전 계산하여 캐싱
- 매 프레임 A* 경로 탐색 비용 절감

**작동 원리**:
```
1. 맵을 그리드로 분할 (각 타일당 하나의 셀)
2. 목적지에서 시작하여 BFS로 거리 필드 생성
3. 각 셀에서 가장 가까운 이웃으로의 방향 벡터 저장
4. AI는 현재 위치에서 Flow Field를 조회하여 즉시 이동 방향 획득
```

**장점**:
- O(1) 조회 시간 (경로 계산 불필요)
- 여러 유닛이 같은 목적지 공유 가능
- 동적 목표에 대한 캐싱

#### 4.3 Pathfinder (A*)
**파일**: `js/ai/Pathfinder.js`

**역할**: Flow Field 실패 시 대체 경로 탐색

**알고리즘**: A* (A-Star)
- 휴리스틱: 유클리드 거리
- 타일 기반 그리드 탐색
- 경로 캐싱 (같은 목표에 대한 중복 계산 방지)

**사용 시점**:
- Flow Field가 방향을 제공하지 못할 때
- 매우 복잡한 경로가 필요할 때

---

## 엔티티 시스템

### 계층 구조

```
Entity (기본 엔티티)
├─ Brawler (브롤러 기본 클래스)
│  ├─ Shelly
│  ├─ Colt
│  ├─ Nita
│  ├─ Poco
│  ├─ Spike
│  ├─ Brock
│  ├─ Bull
│  └─ ElPrimo
├─ Projectile (발사체)
├─ Gem (보석)
└─ Bear (Nita의 곰)
```

### Entity (기본 클래스)
**위치**: `js/entities/Entity.js`

**공통 속성**:
```javascript
{
  position: Vector2,    // 위치
  velocity: Vector2,    // 속도
  radius: number,       // 충돌 반경
  active: boolean       // 활성화 상태
}
```

**공통 메서드**:
- `update(deltaTime, game)` - 물리 업데이트
- `render(ctx, camera)` - 렌더링
- `checkCollision(other)` - 충돌 감지 (원형 충돌)
- `handleMapCollision(map)` - 맵 경계 및 벽 충돌

### Brawler (브롤러)
**위치**: `js/entities/Brawler.js`

**핵심 메커니즘**:

**1. 공격 시스템**:
```javascript
attack(direction, game) {
  if (!canAttack()) return;

  // 발사체 생성 (브롤러별 구현)
  const projectiles = this.createAttackProjectiles(direction);
  game.projectiles.push(...projectiles);

  // 탄약 소모, 쿨다운 시작
  this.ammo--;
  this.attackCooldown = this.attackDelay;

  // 슈퍼 게이지 충전
  this.chargeSuper();
}
```

**2. 슈퍼 시스템**:
```javascript
useSuper(direction, game) {
  if (!superReady) return;

  // 브롤러별 궁극기 (Override 필요)
  this.activateSuper(direction, game);

  // 슈퍼 초기화
  this.superCharge = 0;
  this.superReady = false;
}
```

**3. 데미지 처리**:
```javascript
takeDamage(amount, attacker) {
  this.health -= amount;

  if (this.health <= 0) {
    this.die();
    this.justDied = true;  // Game.update()에서 처리
  }
}
```

**4. 리스폰 시스템**:
```javascript
die() {
  this.isAlive = false;
  this.respawnTimer = RESPAWN_DELAY; // 5초
}

update(deltaTime, game) {
  if (!isAlive) {
    respawnTimer -= deltaTime * 1000;

    if (respawnTimer <= 0) {
      this.respawn(game);
    }
  }
}
```

### 브롤러별 차별화 포인트

각 브롤러는 `createAttackProjectiles()`와 `activateSuper()`를 오버라이드하여 고유한 능력 구현:

**예시 - Shelly (산탄총)**:
```javascript
createAttackProjectiles(direction) {
  // 5개의 탄환을 부채꼴로 발사
  const projectiles = [];
  const spreadAngle = 0.3;

  for (let i = -2; i <= 2; i++) {
    const angle = direction.angle() + (i * spreadAngle / 4);
    const dir = Vector2.fromAngle(angle);
    projectiles.push(new Projectile(this, dir, damage));
  }

  return projectiles;
}
```

**예시 - Nita (곰 소환)**:
```javascript
activateSuper(direction, game) {
  const spawnPos = this.position.add(direction.multiply(60));
  const bear = new Bear(this.team, spawnPos.x, spawnPos.y);
  game.bears.push(bear);
}
```

---

## 게임 루프

### RequestAnimationFrame 기반 루프

**위치**: `js/game/Game.js:188-199`

```javascript
gameLoop() {
  if (!this.running) return;

  // 1. 델타 타임 계산 (프레임 독립성 보장)
  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 최대 100ms 제한
  this.lastTime = currentTime;

  // 2. 게임 상태 업데이트
  this.update(deltaTime);

  // 3. 렌더링
  this.renderSystem.render(this);

  // 4. 다음 프레임 예약
  requestAnimationFrame(() => this.gameLoop());
}
```

### Update 단계

**순서**:
```
1. InputManager 업데이트
2. 플레이어 입력 처리 (이동, 공격, 슈퍼)
3. AI 컨트롤러 업데이트 (봇 행동)
4. 브롤러 업데이트 (물리, 쿨다운, 리스폰)
5. 발사체 업데이트 (이동, 충돌, 제거)
6. Bear 업데이트 (AI, 체력 감소)
7. Spike Field 업데이트 (지속 시간)
8. 사망 처리 (보석 드롭, 리스폰 시작)
9. 게임 모드 업데이트 (승리 조건 체크)
10. 시각 효과 업데이트 (파티클)
```

---

## 게임 모드 시스템

### GemGrabMode
**위치**: `js/modes/GemGrab.js`

**역할**: Gem Grab 게임 모드의 규칙 관리

**핵심 메커니즘**:

**1. 보석 생성**:
```javascript
// 5초마다 보석 생성 (최대 10개)
if (gems.length < MAX_GEMS && timer >= GEM_SPAWN_INTERVAL) {
  spawnGem();
}
```

**2. 승리 조건**:
```
- 팀이 10개 보석을 수집하고 15초간 유지
- 또는 처치 점수 30점 도달
- 또는 5분 타이머 종료 시 보석 많은 팀
```

**3. 사망 페널티**:
```javascript
onBrawlerDeath(brawler, game) {
  // 처치한 팀에 점수 +1
  // 사망한 브롤러의 보석 전부 드롭
  for (let i = 0; i < brawler.gems; i++) {
    const gem = new Gem(brawler.position);
    game.gems.push(gem);
  }
  brawler.gems = 0;
}
```

**4. 카운트다운 시스템**:
```javascript
// 팀이 10개 보석 보유 시 카운트다운 시작
if (blueGems >= 10) {
  blueCountdown -= deltaTime;
  if (blueCountdown <= 0) {
    game.endGame(true); // 블루 팀 승리
  }
}
```

---

## 데이터 흐름

### 공격 액션 흐름
```
User Input (Click)
  ↓
InputManager.getIsAttacking() = true
  ↓
Game.update() → player.attack(direction, game)
  ↓
Brawler.createAttackProjectiles(direction)
  ↓
Game.projectiles.push(...projectiles)
  ↓
Projectile.update() → 충돌 감지
  ↓
Enemy.takeDamage(damage, attacker)
  ↓
Enemy.health -= damage
  ↓
if (health <= 0) → Enemy.die()
  ↓
Game.gameMode.onBrawlerDeath() → 보석 드롭
```

### AI 의사 결정 흐름
```
AIController.update()
  ↓
decisionTimer >= DECISION_INTERVAL (500ms)
  ↓
makeDecision()
  ├─ 후퇴 필요성 평가
  ├─ 전략적 타겟 찾기 (카운터 관계, 아군 지원)
  ├─ 보석 우선순위 평가
  └─ state 결정 (patrol/chase/attack/collectGem/retreat)
  ↓
executeState()
  ├─ chase → moveToTarget(enemy.position)
  ├─ attack → 조준 + 발사 + 회피 이동
  ├─ collectGem → moveToTarget(gem.position)
  └─ retreat → moveToTarget(spawnPosition)
  ↓
moveToTarget()
  ├─ FlowField.getDirection() (O(1) 조회)
  └─ 또는 Pathfinder.findPath() (A* 경로 탐색)
  ↓
brawler.moveDirection 설정
  ↓
Brawler.update() → 물리 이동
```

---

## 설계 패턴

### 1. **상속 (Inheritance)**
- `Entity` → `Brawler` → `Shelly`, `Colt`, 등
- 공통 기능을 기본 클래스에서 제공
- 브롤러별 차별화는 메서드 오버라이드

### 2. **컴포지션 (Composition)**
- `Game` 클래스가 여러 시스템을 조합
  ```javascript
  {
    renderSystem: RenderSystem,
    inputManager: InputManager,
    audioManager: AudioManager,
    effectsManager: EffectsManager
  }
  ```

### 3. **전략 패턴 (Strategy Pattern)**
- 각 브롤러가 고유한 공격/슈퍼 전략 구현
  ```javascript
  createAttackProjectiles() // 브롤러별 다름
  activateSuper()           // 브롤러별 다름
  ```

### 4. **상태 패턴 (State Pattern)**
- AI 상태 머신
  ```javascript
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'collectGem' | 'retreat'
  executeState() // 상태에 따라 다른 행동
  ```

### 5. **싱글톤 스타일 (Singleton-like)**
- `constants.js` - 전역 설정의 단일 진실 공급원
- `FlowField` - 게임당 하나의 공유 인스턴스

### 6. **옵저버 패턴 (Observer-like)**
- 사망 이벤트: `brawler.justDied` → `gameMode.onBrawlerDeath()`
- 보석 수집: `gem.collect()` → `game.onGemCollected()`

### 7. **팩토리 패턴 (Factory-like)**
- `createTeamBot()` - 팀 구성 분석 후 적절한 브롤러 생성
  ```javascript
  const BrawlerClass = BRAWLER_CLASSES[bestCandidateId];
  const bot = new BrawlerClass(team, x, y);
  ```

---

## 성능 최적화

### 1. **Flow Field 캐싱**
- 같은 목적지에 대한 경로를 재사용
- A* 경로 탐색 호출 최소화
- 동적 목표에 대한 캐시 키 생성

### 2. **엔티티 필터링**
```javascript
// 비활성 엔티티 제거
this.projectiles = this.projectiles.filter(p => p.active);
this.bears = this.bears.filter(b => b.active);
```

### 3. **델타 타임 제한**
```javascript
// 프레임 드롭 시 물리 폭주 방지
const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
```

### 4. **거리 계산 최적화**
```javascript
// 제곱근 계산 회피 (일부 경우)
const distSq = dx * dx + dy * dy;
if (distSq < rangeSq) { ... } // sqrt 불필요
```

### 5. **Y축 정렬 (Depth Sorting)**
```javascript
// 브롤러만 정렬 (다른 엔티티는 레이어로 처리)
const sortedBrawlers = [...brawlers].sort((a, b) => a.position.y - b.position.y);
```

### 6. **Canvas 더블 버퍼링**
- 브라우저가 자동으로 제공
- `ctx.save()` / `ctx.restore()` 로 상태 관리

### 7. **이벤트 리스너 정리**
```javascript
cleanup() {
  window.removeEventListener('resize', this.handleResize);
}
```

---

## 확장 가이드

### 새 브롤러 추가
1. `js/entities/brawlers/` 에 새 클래스 파일 생성
2. `Brawler` 상속
3. `createAttackProjectiles()` 구현
4. `activateSuper()` 구현
5. `js/utils/constants.js` → `BRAWLERS` 에 스탯 추가
6. `js/entities/brawlers/index.js` 에 export 추가

### 새 게임 모드 추가
1. `js/modes/` 에 새 모드 클래스 생성
2. 다음 메서드 구현:
   - `update(deltaTime)` - 규칙 업데이트
   - `onBrawlerDeath(brawler, game)` - 사망 처리
   - `getMatchStats()` - 결과 통계
3. `Game.js` 에서 모드 선택 로직 추가

### 새 AI 행동 추가
1. `AIController.js` 에 새 state 추가
2. `executeState()` 에 case 추가
3. `makeDecision()` 에 전환 조건 추가

---

## 디버깅 팁

### AI 경로 시각화
```javascript
// AIController.js
this.debugMode = true; // 경로 및 상태 표시
```

### Flow Field 시각화
```javascript
// FlowField.js
this.debugRender(ctx, camera); // 방향 벡터 표시
```

### 충돌 박스 표시
```javascript
// Entity.js render()
ctx.strokeStyle = 'red';
ctx.beginPath();
ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
ctx.stroke();
```

### 콘솔 로깅
```javascript
// Game.js update()
console.log('FPS:', Math.round(1 / deltaTime));
console.log('Entities:', {
  brawlers: this.brawlers.length,
  projectiles: this.projectiles.length,
  gems: this.gems.length
});
```

---

## 알려진 제약사항

1. **브라우저 탭 최소화 시 일시정지**
   - `requestAnimationFrame`이 백그라운드에서 중단됨
   - 해결: Visibility API로 감지 후 타이머 조정

2. **많은 발사체 시 성능 저하**
   - 해결: 발사체 풀링 또는 최대 개수 제한

3. **경로 탐색 실패 가능성**
   - 복잡한 맵에서 A* 실패 가능
   - 해결: 더 나은 휴리스틱 또는 NavMesh 도입

---

## 추가 읽을거리

- [README.md](./README.md) - 프로젝트 개요 및 시작 가이드
- `js/utils/constants.js` - 모든 게임 밸런스 값
- `js/map/mapData.js` - 맵 정의 및 타일 구조

---

**이 문서는 Brawl Arena 코드베이스를 이해하고 확장하는데 필요한 핵심 개념을 다룹니다.**
