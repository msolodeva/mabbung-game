# AI 난이도 시스템 설계

**날짜:** 2026-01-27
**목적:** AI 브롤러의 인간적인 행동 패턴 구현 및 난이도 선택 기능 추가

## 개요

현재 AI는 기계적이고 예측 가능한 패턴을 보입니다. 이 설계는 AI가 사람처럼 실수하고, 자연스러운 행동을 하도록 개선합니다.

## 핵심 목표

1. **조준 실수** - 총알이 빗나가고, 거리에 따라 정확도 변화
2. **반응 지연** - 적 발견 시 즉시 반응하지 않음
3. **판단 실수** - 잘못된 타이밍에 후퇴/공격 결정
4. **난이도 선택** - 로비에서 쉬움/보통/어려움 선택

## 아키텍처

### 1. 난이도 파라미터 (constants.js)

```javascript
export const AI_DIFFICULTY = {
    EASY: {
        aimInaccuracy: 0.8,           // 조준 오차 (라디안)
        aimWobble: 0.3,                // 조준 떨림
        reactionDelay: 400,            // 반응 지연 (ms)
        decisionInterval: 800,         // 의사결정 간격
        poorDecisionChance: 0.4,       // 잘못된 판단 확률
        retreatThreshold: 0.5,         // 후퇴 체력 임계값
        wasteSuperChance: 0.3,         // 슈퍼 낭비 확률
        pathUpdateFrequency: 1000,
        stuckThreshold: 1000,
    },
    NORMAL: { /* 중간 값 */ },
    HARD: { /* 낮은 오차, 빠른 반응 */ },
};
```

### 2. 게임 상태 (Game.js)

- `this.aiDifficulty` 속성 추가 (기본값: NORMAL)
- 모든 AI가 이 설정을 참조

### 3. AI 행동 변경 (AIController.js)

#### 조준 실수
- 기본 inaccuracy + 조준 떨림 (사인파)
- 거리 페널티 (멀수록 부정확)
- 어려움: 예측 사격 활성화

#### 반응 지연
- `reactionQueue` 도입
- 새 적 발견 시 `reactionDelay` 만큼 대기
- 큐 처리 후 반응

#### 판단 실수
- `poorDecisionChance` 확률로:
  - 패닉 후퇴 (40%)
  - 무모한 돌진 (30%)
  - 보석 무시 (30%)

#### 슈퍼 낭비
- `wasteSuperChance` 확률로 허공에 발사

### 4. UI (index.html + main.js)

- 로비에 난이도 선택 버튼 3개
- 클릭 시 `game.aiDifficulty` 업데이트
- 설명 텍스트 동적 변경

## 구현 순서

1. constants.js - AI_DIFFICULTY 추가
2. Game.js - aiDifficulty 저장
3. AIController.js - 조준/반응/판단 로직
4. index.html - UI 마크업
5. styles.css - 스타일링
6. main.js - 이벤트 핸들러

## 난이도별 특성

### 쉬움
- 조준: ±45도 흔들림
- 반응: 400ms 지연
- 판단: 40% 실수율
- 슈퍼: 30% 낭비

### 보통
- 조준: ±17도
- 반응: 200ms
- 판단: 15% 실수
- 슈퍼: 10% 낭비

### 어려움
- 조준: ±6도, 예측 사격
- 반응: 50ms
- 판단: 5% 실수
- 슈퍼: 2% 낭비

## 확장성

- 개별 AI 난이도로 확장 가능
- 커스텀 프리셋 추가 용이
- 난이도별 통계 수집 가능
