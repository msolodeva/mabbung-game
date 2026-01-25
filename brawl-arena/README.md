# Brawl Arena

실시간 탑다운 슈팅 게임으로, Brawl Stars의 Gem Grab 모드에서 영감을 받아 제작되었습니다. AI 팀 간의 자동 전투를 관전하거나, 플레이어가 직접 참여할 수 있습니다.

## 게임 개요

- **장르**: 탑다운 멀티플레이어 배틀 아레나
- **게임 모드**: Gem Grab - 보석을 수집하고 유지하여 승리
- **팀 구성**: 블루 팀 vs 레드 팀 (각 3명)
- **승리 조건**:
  - 팀이 10개의 보석을 수집하고 15초간 유지
  - 또는 처치 점수 30점 도달
  - 또는 5분 타이머 종료 시 더 많은 보석을 보유한 팀

## 주요 기능

### 플레이 가능한 브롤러 (8명)
각 브롤러는 고유한 능력과 슈퍼 스킬을 보유:
- **Shelly**: 산탄총 (근거리 고화력)
- **Colt**: 연사 권총 (중거리 DPS)
- **Nita**: 곰 소환 (탱커 서포터)
- **Poco**: 힐링 음파 (팀 지원)
- **Spike**: 폭발하는 가시 (범위 공격)
- **Brock**: 로켓 런처 (장거리 포격)
- **Bull**: 샷건 + 돌진 (탱커)
- **El Primo**: 근접 펀치 + 점프 (브롤러)

### 게임 메커니즘
- **보석 시스템**: 맵 중앙에서 주기적으로 생성
- **사망 페널티**: 보석 전부 드롭 + 5초 리스폰
- **슈퍼 스킬**: 공격 시 게이지 충전, 강력한 궁극기 발동
- **팀 플레이**: AI가 역할 분담 (공격수/수집가/지원)

### AI 시스템
- **Flow Field**: 효율적인 경로 탐색
- **팀 전략**: 상황에 따른 역할 동적 할당
- **타겟팅**: 위협도 기반 적 우선순위 결정
- **보석 관리**: 보석 수집 및 보호 전략

### 다양한 맵
- **Open**: 개방된 전투 공간
- **Maze**: 복잡한 미로 구조
- **Corridors**: 좁은 복도 전투
- **Center**: 중앙 집중형
- **Symmetric**: 대칭 구조
- **Arena**: 아레나 스타일

## 기술 스택

- **언어**: Vanilla JavaScript (ES6+)
- **렌더링**: HTML5 Canvas API
- **아키텍처**: 객체 지향 프로그래밍
- **모듈 시스템**: ES6 Modules
- **게임 루프**: RequestAnimationFrame

## 프로젝트 구조

```
brawl-arena/
├── index.html              # 게임 진입점
├── css/
│   ├── styles.css          # 게임 스타일
│   └── map-selection.css   # 맵 선택 UI
└── js/
    ├── main.js             # 애플리케이션 초기화
    ├── ai/                 # AI 시스템
    │   ├── AIController.js # AI 행동 제어
    │   ├── FlowField.js    # Flow field 경로 탐색
    │   └── Pathfinder.js   # A* 경로 찾기
    ├── audio/              # 오디오 관리
    │   └── AudioManager.js
    ├── effects/            # 시각 효과
    │   └── Effects.js
    ├── entities/           # 게임 엔티티
    │   ├── Entity.js       # 기본 엔티티 클래스
    │   ├── Brawler.js      # 브롤러 기본 클래스
    │   ├── Projectile.js   # 발사체
    │   ├── Gem.js          # 보석
    │   ├── Bear.js         # Nita의 곰
    │   └── brawlers/       # 개별 브롤러 구현
    │       ├── index.js
    │       ├── Shelly.js
    │       ├── Colt.js
    │       ├── Nita.js
    │       ├── Poco.js
    │       ├── Spike.js
    │       ├── Brock.js
    │       ├── Bull.js
    │       └── ElPrimo.js
    ├── game/               # 코어 게임 로직
    │   ├── Game.js         # 게임 컨트롤러
    │   └── RenderSystem.js # 렌더링 시스템
    ├── input/              # 입력 처리
    │   └── InputManager.js
    ├── map/                # 맵 시스템
    │   ├── Map.js          # 맵 클래스
    │   └── mapData.js      # 맵 정의
    ├── modes/              # 게임 모드
    │   └── GemGrab.js      # Gem Grab 모드
    └── utils/              # 유틸리티
        ├── constants.js    # 게임 설정 및 밸런스
        └── Vector2.js      # 2D 벡터 수학
```

## 시작하기

### 필수 요구사항
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- 로컬 웹 서버 (CORS 제약 때문)

### 실행 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd brawl-arena
```

2. 로컬 서버 시작
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (npx)
npx http-server -p 8000

# VS Code Live Server 익스텐션 사용
```

3. 브라우저에서 열기
```
http://localhost:8000
```

### 게임 조작법

#### 메뉴
- **맵 선택**: 원하는 맵 클릭
- **Start Auto Battle**: AI vs AI 자동 전투
- **Play as Player**: 플레이어로 직접 참여 (블루 팀)

#### 게임 중
- **마우스 이동**: 브롤러 이동 방향 지정 (플레이어 모드)
- **클릭**: 일반 공격 발사
- **우클릭/Space**: 슈퍼 스킬 발동
- **ESC**: 메뉴로 돌아가기

## 개발 가이드

### 새 브롤러 추가하기

1. `js/entities/brawlers/` 디렉토리에 새 파일 생성
2. `Brawler` 클래스를 상속
3. `createAttackProjectiles()` 구현 (일반 공격)
4. `activateSuper()` 구현 (슈퍼 스킬)
5. `js/utils/constants.js`의 `BRAWLERS` 객체에 스탯 추가
6. `js/entities/brawlers/index.js`에 export 추가

예시:
```javascript
import Brawler from '../Brawler.js';

export default class NewBrawler extends Brawler {
  constructor(team, x = 0, y = 0) {
    const config = BRAWLERS.NEWBRAWLER;
    super(config, team, x, y);
  }

  createAttackProjectiles() {
    // 일반 공격 로직
  }

  activateSuper() {
    // 슈퍼 스킬 로직
  }
}
```

### 게임 밸런스 조정

모든 밸런스 값은 `js/utils/constants.js`에 중앙화되어 있습니다:
- `BRAWLERS`: 브롤러 스탯 (체력, 속도, 데미지 등)
- `PROJECTILE_CONFIG`: 발사체 물리
- `GEM_CONFIG`: 보석 생성 규칙
- `AI_CONFIG`: AI 행동 파라미터
- `GAME_CONFIG`: 전체 게임 설정

### 새 맵 추가하기

1. `js/map/mapData.js`에 새 맵 데이터 추가
2. 타일 그리드 배열 정의 (0=빈공간, 1=벽, 2=물)
3. 팀 스폰 포인트 설정
4. 보석 스폰 위치 지정
5. 맵 이름과 설명 추가

### 아키텍처 이해하기

상세한 아키텍처 정보는 [ARCHITECTURE.md](./ARCHITECTURE.md) 참조

주요 시스템:
- **게임 루프**: 60 FPS 업데이트/렌더링
- **엔티티 시스템**: 상속 기반 계층 구조
- **AI 시스템**: Flow field + 팀 전략
- **렌더링**: 레이어 기반 Canvas 렌더링
- **이벤트 시스템**: 커스텀 이벤트 기반 통신

## 코드 컨벤션

- **파일명**: PascalCase for classes, camelCase for utilities
- **클래스명**: PascalCase
- **변수/함수**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **Import 순서**: 외부 의존성 → 내부 모듈 → 상수

## 성능 최적화

- Flow Field 캐싱 (경로 재사용)
- 엔티티 풀링 (발사체)
- Canvas 더블 버퍼링
- 오프스크린 렌더링 (미니맵)
- 거리 계산 최적화 (제곱근 제거)

## 알려진 이슈

- 브라우저 최소화 시 게임 일시 정지됨 (requestAnimationFrame 특성)
- 많은 발사체 동시 생성 시 프레임 드롭 가능

## 라이선스

MIT License

## 기여하기

이슈와 풀 리퀘스트를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 크레딧

Brawl Stars의 게임 메커니즘에서 영감을 받았습니다.

---

**Made with ❤️ for game development learning**
