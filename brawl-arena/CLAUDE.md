# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Brawl Stars의 Gem Grab 모드에서 영감을 받은 실시간 탑다운 2D 슈팅 게임. 순수 Vanilla JavaScript와 HTML5 Canvas로 구현되어 있으며, 빌드 시스템 없이 ES6 모듈을 직접 사용한다.

## 실행 방법

```bash
# 로컬 서버 필수 (ES6 모듈 CORS 제약)
python -m http.server 8000
# 또는
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

**테스트/린트/빌드**: 없음 - 순수 HTML/JS 프로젝트

## 아키텍처

레이어드 아키텍처를 따르며, 모든 게임 로직은 `js/` 디렉토리에 위치:

- **game/Game.js**: 중앙 게임 컨트롤러. 게임 루프, 엔티티 관리, 시스템 조율
- **game/RenderSystem.js**: 렌더링 전담. 레이어 기반 Canvas 렌더링, 카메라 시스템
- **entities/Brawler.js**: 브롤러 기본 클래스. 공격/슈퍼/데미지/리스폰 시스템
- **entities/brawlers/**: 개별 브롤러 구현 (Shelly, Colt, Nita 등)
- **ai/AIController.js**: 봇 AI 상태 머신 (patrol, chase, attack, collectGem, retreat)
- **ai/FlowField.js**: 효율적 경로 탐색 (O(1) 조회)
- **modes/GemGrab.js**: 게임 모드 규칙 (승리 조건, 보석 시스템)
- **utils/constants.js**: **모든 게임 밸런스 값 중앙 집중화** - 스탯 조정은 이 파일만 수정

## 핵심 패턴

- **엔티티 계층**: `Entity` → `Brawler` → 개별 브롤러 (상속 기반)
- **게임 루프**: `requestAnimationFrame` + 델타 타임 (최대 0.1초 제한)
- **AI 상태 머신**: 500ms 간격 의사 결정, Flow Field 우선 경로 탐색
- **렌더링 순서**: 배경 → 보석 → 효과 → 발사체 → 소환물 → 브롤러(Y정렬) → 파티클 → UI

## 확장 가이드

### 새 브롤러 추가

1. `js/entities/brawlers/NewBrawler.js` 생성
2. `Brawler` 상속 후 `createAttackProjectiles()`와 `activateSuper()` 구현
3. `js/utils/constants.js`의 `BRAWLERS` 객체에 스탯 추가
4. `js/entities/brawlers/index.js`에 export 추가

### 새 맵 추가

1. `js/map/mapData.js`에 맵 데이터 추가
2. 타일 배열 정의 (0=빈공간, 1=벽, 2=물)
3. 스폰 포인트와 보석 위치 설정

## 코드 컨벤션

- 파일명/클래스: PascalCase
- 변수/함수: camelCase
- 상수: UPPER_SNAKE_CASE

## 2플레이어 입력

- **P1 (블루)**: WASD 이동, F 공격, G 슈퍼
- **P2 (레드)**: 방향키 이동, Right Shift 공격, Enter 슈퍼
