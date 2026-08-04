# Brawl Arena Architecture

## 개요

프로젝트는 빌드 과정 없이 브라우저가 직접 불러오는 ES 모듈로 구성됩니다. 의존성 방향은 앱 조율 → 게임 시스템 → 도메인 객체 → 공용 유틸리티 순서이며, DOM과 Canvas 책임을 게임 규칙에서 분리합니다.

```text
index.html
  └─ js/main.js
      └─ app/BrawlArena          화면 전환과 게임 세션 생명주기
          ├─ app/LobbyController 로비 상태와 DOM
          └─ game/Game           게임 상태와 프레임 루프
              ├─ game/RenderSystem
              ├─ game/GameUI
              ├─ input/InputManager
              ├─ modes/GemGrabMode
              ├─ ai/*
              └─ entities/*
```

## 애플리케이션 계층

### `BrawlArena`

- 로비, 게임, 결과 화면을 전환합니다.
- 로비 선택값으로 `Game` 인스턴스를 생성합니다.
- 재시작하거나 로비로 돌아갈 때 기존 게임을 먼저 정리합니다.

### `LobbyController`

- 브롤러, 맵, 팀 모드, 팀별 AI 난이도를 하나의 선택 상태로 관리합니다.
- 로비 DOM 생성과 키보드 탐색을 담당합니다.
- 게임에는 DOM이 아닌 정규화된 옵션 객체만 전달합니다.

## 게임 계층

### `Game`

`Game`은 엔티티 컬렉션과 시스템을 소유하는 런타임 조율자입니다. 한 프레임은 다음 순서로 처리됩니다.

1. 두 플레이어 입력 반영
2. AI 의사 결정
3. 브롤러, 발사체, 소환물 갱신
4. 사망과 모드 규칙 처리
5. 효과 갱신
6. Canvas 렌더링

`requestAnimationFrame` 식별자를 보관하고 정리 시 취소하므로 재시작해도 루프가 누적되지 않습니다.

### `RenderSystem`

맵 전체가 뷰포트에 맞도록 카메라 배율을 계산합니다. 렌더 순서는 맵, 보석, 지역 효과, 발사체, 소환물, Y축 정렬 브롤러, 파티클, 플레이어 표식입니다.

### `GameUI`

일시정지와 결과 화면의 DOM만 담당합니다. 게임 규칙은 UI 마크업을 알지 못하며 결과 값과 통계만 전달합니다.

### `InputManager`

각 플레이어 입력을 동일한 번호 기반 API로 제공합니다. 생성 시 등록한 문서 이벤트 리스너는 `cleanup()`에서 모두 해제합니다.

## 도메인 계층

- `Entity`: 위치, 속도, 활성 상태를 갖는 기본 객체
- `Brawler`: 체력, 탄약, 공격, 궁극기, 사망과 부활의 공통 구현
- `entities/brawlers/*`: 브롤러별 공격과 궁극기 구현
- `Projectile`, `Gem`, `Bear`: 전투와 모드에서 사용하는 독립 엔티티
- `GemGrabMode`: 보석 생성, 점수, 카운트다운, 승패 판정

게임 밸런스는 `js/utils/constants.js`의 `BRAWLERS`, `AI_DIFFICULTY`, `GAME_CONFIG` 등에 집중합니다.

## AI와 길 찾기

`AIController`는 상태 기반으로 수집, 추격, 공격, 후퇴를 선택합니다. 공통 목적지는 `FlowField`로 빠르게 조회하고, 복잡하거나 막힌 경로는 `Pathfinder`의 A* 탐색으로 보완합니다. 난이도 프리셋은 반응 속도뿐 아니라 조준과 판단의 불완전성도 조절합니다.

## 생명주기

```text
로비 선택 → Game 생성 → init → start
                              ↓
                    pause ↔ resume
                              ↓
             결과 / 재시작 / 로비 복귀
                              ↓
cleanup: RAF, 입력, resize, UI, 엔티티 정리
```

## 테스트

`npm test`는 Node 내장 테스트 러너로 밸런스 규칙, 브롤러 공격, 맵, AI 난이도, UI 계약, 입력 생명주기를 검증합니다. 실제 DOM과 Canvas 연결은 로컬 서버에서 브라우저 스모크 테스트로 확인합니다.
