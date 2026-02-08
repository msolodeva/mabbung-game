# Crazy Mabbung

## 1. 프로젝트 개요
**프로젝트명:** Crazy Mabbung  
**설명:** "크레이지 아케이드(BnB)"에서 영감을 받은 웹 기반 게임입니다. Vanilla JavaScript와 HTML5 Canvas를 사용하여 구현되었습니다.

**현재 구현된 기능:**
- 3:3 팀 대전 (레드팀 vs 블루팀)
- 2인 로컬 멀티플레이어 (WASD+F / 방향키+우Shift)
- 4명의 AI 플레이어 (팀당 2명)
- 동적 맵 생성 (17x15 타일, 매 게임마다 랜덤)
- 폭탄 설치 및 폭발 (연쇄 폭발 지원)
- 아이템 시스템 (스피드, 화력, 폭탄 개수)
- 게임 오버 및 재시작 기능
- 팀별 HUD (생존자 수, 타이머)

## 2. 기술 스택
- **코어:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **렌더링:** HTML5 Canvas API
- **상태 관리:** 클래스 내부 커스텀 상태 관리
- **빌드 시스템:** 없음 (브라우저에서 직접 실행)

## 3. 프로젝트 구조
```
crazy-mabbung/
├── index.html              # 메인 HTML (캔버스 1088x960, HUD, 모달)
├── style.css               # 스타일링 (HUD, 모달, 게임 컨테이너)
├── start.sh                # 로컬 서버 실행 스크립트
├── GEMINI.md               # 에이전트 컨텍스트 (이 파일)
│
├── assets/                 # 그래픽 에셋
│   ├── spritesheet_characters.png  # 캐릭터 스프라이트
│   ├── spritesheet_tiles.png       # 타일 스프라이트
│   ├── spritesheet_items.png       # 아이템 스프라이트
│   └── spritesheet_bomb.png        # 폭탄 스프라이트
│
└── src/                    # 소스 코드
    ├── main.js             # 게임 진입점, 게임 루프, 입력 처리
    │
    ├── core/               # 핵심 게임 로직
    │   ├── Game.js         # 게임 메인 클래스 (업데이트, 드로우, 충돌)
    │   └── Map.js          # 맵 생성 및 렌더링 (동적 생성)
    │
    ├── entities/           # 게임 엔티티 클래스
    │   ├── Player.js       # 플레이어 (이동, 애니메이션, 상태)
    │   ├── Bomb.js         # 폭탄 (타이머, 폭발)
    │   └── Item.js         # 아이템 (스피드/화력/폭탄 증가)
    │
    ├── managers/           # 매니저/컨트롤러 클래스
    │   ├── AssetManager.js # 이미지/사운드 로딩 관리
    │   └── AIController.js # AI 플레이어 제어 로직
    │
    └── ui/                 # UI 관련 (현재 미사용, 확장용)
```

## 4. 핵심 클래스 설명

### core/Game.js
- `restart()`: 게임 초기화 (맵, 플레이어 6명, AI 컨트롤러 설정)
- `update(deltaTime)`: 게임 로직 업데이트 (AI, 폭탄, 플레이어)
- `draw()`: 모든 엔티티 렌더링
- `checkTeamWinCondition()`: 팀별 승리 조건 체크
- `triggerExplosion()`: 폭발 처리 및 연쇄 반응

### core/Map.js
- `generateMap()`: 동적 맵 생성 (외곽 벽, 내부 기둥, 랜덤 블록)
- `isSpawnZone()`: 6명의 플레이어 스폰 지역 보호
- `isSolid()`: 충돌 체크
- `destroyBlock()`: 파괴 가능 블록 제거

### entities/Player.js
- 상태: `NORMAL`, `TRAPPED`, `DEAD`
- 애니메이션: 대기(숨쉬기), 이동(바운스), 갇힘(흔들림)
- 능력치: `speed`, `bombRange`, `maxBombs`
- 속성: `team` (1 or 2), `isAI` (boolean)

### managers/AIController.js
- `update(deltaTime)`: AI 결정 및 입력 생성
- `makeDecision()`: 전략적 결정 (위험 회피, 적 추적, 블록 파괴)
- `isInDanger()`: 폭발 범위 내 위험 감지
- `shouldPlaceBomb()`: 폭탄 설치 판단

## 5. 팀 시스템

### 팀 구성
| 팀 | 색상 | 인원 | 스폰 위치 |
|----|------|------|----------|
| 🔴 레드 | #e74c3c | 3명 | 맵 왼쪽 |
| 🔵 블루 | #3498db | 3명 | 맵 오른쪽 |

### 플레이어 배치
| 캐릭터 | 팀 | 타입 | 위치 |
|--------|-----|------|------|
| P1 | 🔴 | Human | 좌상단 |
| AI | 🔴 | AI | 좌하단 |
| AI | 🔴 | AI | 좌중앙 |
| P2 | 🔵 | Human | 우하단 |
| AI | 🔵 | AI | 우상단 |
| AI | 🔵 | AI | 우중앙 |

## 6. 코딩 컨벤션 및 규칙
- **최신 JavaScript:** `const`/`let`, 화살표 함수, 클래스, 모듈(`import`/`export`) 사용
- **OOP 아키텍처:** 주요 엔티티는 각각의 클래스로 캡슐화
- **폴더 구조:** `core/`(핵심), `entities/`(객체), `managers/`(관리자)로 분리
- **Canvas 렌더링:** 단일 `<canvas>` 요소, `requestAnimationFrame` 사용
- **외부 라이브러리 금지:** 순수 JavaScript로 구현
- **한국어 우선:** 사용자와의 대화는 한국어로

## 7. 에이전트 지침
- 코드 수정 시 `main.js`의 게임 루프가 차단되지 않도록 주의
- 새 파일 추가 시 적절한 폴더에 배치 (entities/, managers/, core/)
- import 경로 수정 시 상대 경로 주의 (`../`, `./`)
- 게임 시작: `./start.sh [포트]` 또는 `python3 -m http.server [포트]`
- Browser로 테스트 시: 코드 수정 후에는 반드시 서버를 종료하고 다시 실행(`python3 -m http.server [포트]`)한 뒤, 브라우저에서 새로고침을 해야 함.
- 캔버스 크기: 1088x960 (17x15 타일, 64px/타일)

## 8. 조작법
| 플레이어 | 팀 | 이동 | 폭탄 설치 |
|---------|-----|------|----------|
| P1 | 🔴 레드 | W/A/S/D | F |
| P2 | 🔵 블루 | 방향키 | 우측 Shift |
