# Humanizing AI Brawlers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI 브롤러가 너무 기계적으로 완벽하게 움직이는 현상을 개선하여, 더 인간적이고 예측 불가능한 움직임을 갖도록 합니다.

**Architecture:** AI의 물리적 이동(Strafe), 의사결정 타이밍(Interval), 그리고 조준 유지 방식에 무작위성(Randomness)과 지연(Hesitation)을 도입합니다. 완벽한 90도 회전이나 고정된 반응 시간을 깨뜨리는 것이 핵심입니다.

**Tech Stack:** Vanilla JavaScript (ES6)

---

### Task 1: Strafe 움직임 무작위화 및 불규칙성 추가

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: Strafe 각도 및 방향 전환 로직 수정**
- 기존의 고정된 90도 스트레이프를 70~110도 사이의 랜덤 각도로 수정.
- 방향 전환 빈도(Oscillation)를 제한하여 기계적인 좌우 흔들기 방지.

**Step 2: Commit**

---

### Task 2: 의사결정 및 반응 시간의 무작위 지연 도입

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: 의사결정 간격에 지터(Jitter) 추가**
- `difficulty.decisionInterval`에 ±20%의 무작위성을 부여하여 매번 다른 타이밍에 판단하도록 수정.

**Step 2: 반응 지연 시간 무작위화**
- `reactionDelay`에도 무작위 배율(75%~125%)을 적용.

**Step 3: Commit**

---

### Task 3: 이동 방향 스무딩 조정 및 미세한 떨림 추가

**Files:**
- Modify: `js/ai/AIController.js`
- Modify: `js/utils/constants.js`

**Step 1: 난이도별 Smoothing Factor 차등화**
- `constants.js`에 난이도별 `smoothingFactor` 추가.

**Step 2: 이동 방향에 미세한 노이즈 추가**
- 직선 이동 시에도 아주 미세하게 각도가 변하도록 하여 기계적인 느낌 제거.

**Step 3: Commit**

---

### Task 4: 순찰 및 호위 경로의 "인간적" 불완전성 강화

**Files:**
- Modify: `js/ai/AIController.js`

**Step 1: 호위 및 순찰 지점 체류 시간 추가**
- 목표 도달 시 즉시 다음 행동을 하는 대신 짧은 대기 시간을 추가.

**Step 2: Commit**
