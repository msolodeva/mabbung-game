# Strategic AI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI 브롤러가 Gem Grab 모드의 전역 상태를 인지하고, 보석 보유량에 따라 팀 내 역할을 유동적으로 분담하며 전략적으로 행동하게 합니다.

**Architecture:** AIController가 GemGrabMode의 데이터를 직접 참조하도록 연결하고, 매 의사결정 시 팀 내 보석 현황을 파악하여 역할(Carrier/Protector)을 할당합니다. 타겟팅 로직에는 보석 보유량 기반 가중치를 추가합니다.

**Tech Stack:** Vanilla JavaScript (ES6 Modules)

---

### Task 1: 데이터 브릿지 및 전역 상태 인지

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: AIController 생성자 및 업데이트 로직 수정**
`GemGrabMode`의 상태를 저장할 변수들을 초기화하고 매 프레임 업데이트합니다.

```javascript
// constructor 내부에 추가 (Line 52 부근)
this.globalStats = {
    teamGems: 0,
    enemyGems: 0,
    isWinning: false,
    isLosing: false,
    isCountdown: false
};

// updateGlobalStats() 메서드 추가
updateGlobalStats() {
    if (!this.game.gameMode) return;
    const mode = this.game.gameMode;
    const myTeam = this.brawler.team;
    const enemyTeam = myTeam === 'blue' ? 'red' : 'blue';

    this.globalStats.teamGems = mode.teamGems[myTeam];
    this.globalStats.enemyGems = mode.teamGems[enemyTeam];
    this.globalStats.isWinning = this.globalStats.teamGems > this.globalStats.enemyGems;
    this.globalStats.isLosing = this.globalStats.enemyGems > this.globalStats.teamGems;
    this.globalStats.isCountdown = mode.countdownActive;
}

// update() 메서드 시작 부분에 호출 추가 (Line 54 부근)
this.updateGlobalStats();
```

**Step 2: 커밋**

```bash
git add js/ai/AIController.js
git commit -m "feat(ai): add global awareness and data bridge to GemGrab mode"
```

---

### Task 2: 동적 역할 할당 (Carrier/Protector)

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: 팀 내 운반자 식별 로직 추가**
팀원 중 누가 보석을 가장 많이 가졌는지 판단합니다.

```javascript
// findTeamCarrier() 메서드 추가
findTeamCarrier() {
    let carrier = null;
    let maxGems = -1;

    for (const brawler of this.game.brawlers) {
        if (brawler.team === this.brawler.team && brawler.isAlive) {
            if (brawler.gems > maxGems) {
                maxGems = brawler.gems;
                carrier = brawler;
            } else if (brawler.gems === maxGems && carrier) {
                // 보석 수가 같으면 체력이 높은 쪽을 우선
                if (brawler.health > carrier.health) {
                    carrier = brawler;
                }
            }
        }
    }
    return carrier;
}
```

**Step 2: 역할 판정 및 상태 변수 추가**
`makeDecision`에서 역할을 결정합니다.

```javascript
// makeDecision() 시작 부분에 추가 (Line 258 부근)
const teamCarrier = this.findTeamCarrier();
this.isCarrier = (teamCarrier === this.brawler && this.brawler.gems > 0);
this.teamCarrier = teamCarrier;
```

**Step 3: 커밋**

```bash
git add js/ai/AIController.js
git commit -m "feat(ai): implement dynamic role assignment (Carrier/Protector)"
```

---

### Task 3: 전략적 타겟팅 가중치 고도화

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: findBestStrategicTarget 가중치 로직 수정**
디자인 문서에 정의된 전략적 점수를 적용합니다.

```javascript
// findBestStrategicTarget() 수정 (Line 398-421 부근)
let score = 1000;
const dist = this.brawler.position.distanceTo(enemy.position);

// 1. 거리 패널티 (기본)
score -= dist * 1.5;

// 2. 고가치 타겟(HVT) 보너스: 보석 1개당 +200
score += enemy.gems * 200;

// 3. 역전 절실도: 상대가 카운트다운 중이면 보석 보유 적 가중치 대폭 상향
if (this.globalStats.isCountdown && this.globalStats.isLosing && enemy.gems > 0) {
    score += 2000;
}

// 4. 처단 찬스: 저체력 적 우선순위
if (enemy.health < enemy.maxHealth * 0.3) {
    score += 500;
}
```

**Step 2: 커밋**

```bash
git add js/ai/AIController.js
git commit -m "feat(ai): enhance strategic targeting weights based on game state"
```

---

### Task 4: 역할별 행동 및 위치 선정 (Carrier/Protector)

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: Carrier(운반자)의 생존 지향 행동 추가**
보석이 많을 때 적을 쫓지 않고 후퇴하도록 `makeDecision` 수정.

```javascript
// makeDecision() 내 retreat 판단 로직 수정 (Line 303 부근)
const hasManyGems = this.brawler.gems >= 5;
if (hasManyGems && (healthPercent < 0.7 || this.globalStats.isWinning)) {
    this.state = 'retreat';
    return;
}
```

**Step 2: Protector(호위병)의 운반자 보호 이동 로직 추가**
운반자 주변에 머무르도록 `patrol` 상태를 개선합니다.

```javascript
// patrol() 메서드 수정 (Line 554 부근)
patrol() {
    if (this.teamCarrier && !this.isCarrier) {
        // 호위병은 운반자 주변으로 이동
        const offset = new Vector2((Math.random()-0.5)*150, (Math.random()-0.5)*150);
        this.moveToTarget(this.teamCarrier.position.add(offset));
        return;
    }
    // 기존 순찰 로직...
}
```

**Step 3: 커밋**

```bash
git add js/ai/AIController.js
git commit -m "feat(ai): add behavior patterns for Carrier and Protector roles"
```
