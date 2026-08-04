# Brawl Arena

Brawl Stars의 Gem Grab에서 영감을 받은 로컬 2인용 탑다운 슈팅 게임입니다. 두 플레이어가 각자 브롤러를 조작하고, 나머지 팀원은 AI가 담당합니다.

## 게임 규칙

- 블루 팀과 레드 팀은 각 3명으로 구성됩니다.
- 중앙에서 생성되는 보석을 5개 모은 뒤 40초 동안 유지하면 승리합니다.
- 5분이 지나면 처치 수가 많은 팀이 승리하며, 처치 수가 같으면 보석 수로 판정합니다.
- 쓰러진 브롤러는 보석을 떨어뜨리고 3초 뒤 부활합니다.
- 대결 모드와 두 플레이어가 블루 팀에서 협력하는 같은 팀 모드를 지원합니다.

## 브롤러

| 브롤러 | 역할 | 특징 |
| --- | --- | --- |
| Brock | Rocketeer | 긴 사거리와 강한 단발 로켓 |
| Nita | Bruiser | 높은 체력과 넓은 관통 충격파 |
| Colt | Marksman | 빠른 이동과 연속 사격 |
| Dynamike | Artillery | 벽 너머 지연 폭발 공격 |
| Spike | Controller | 분열 투사체와 감속 지대 |
| Mortis | Assassin | 짧은 사거리의 연속 돌진 |

각 팀 AI는 낮음, 보통, 높음 중 하나로 설정할 수 있습니다. 난이도에 따라 반응 시간, 조준 오차, 판단 실수, 전투 움직임이 달라집니다.

## 실행

최신 Node.js와 Python 3가 필요합니다.

```bash
npm run serve
```

브라우저에서 [http://localhost:8000](http://localhost:8000)을 엽니다. 브라우저 ES 모듈을 사용하므로 `index.html`을 파일로 직접 열 수 없습니다.

## 조작

| 기능 | 플레이어 1 | 플레이어 2 |
| --- | --- | --- |
| 이동/조준 | `W` `A` `S` `D` | 방향키 |
| 일반 공격 | `F` | 오른쪽 `Shift` |
| 궁극기 | `G` | `Enter` |
| 일시정지 | `Esc` | `Esc` |

로비에서는 같은 이동 키로 브롤러를 선택하고 `Space` 또는 `Enter`로 게임을 시작할 수 있습니다.

## 개발

```bash
npm test
```

별도 빌드 단계나 런타임 의존성은 없습니다. 테스트는 Node 내장 테스트 러너를 사용합니다.

```text
js/
├── app/       # 로비 상태와 게임 세션 조율
├── game/      # 게임 루프, Canvas 렌더링, 게임 UI
├── entities/  # 엔티티와 브롤러
├── ai/        # AI와 경로 탐색
├── modes/     # Gem Grab 규칙
├── map/       # 맵 런타임과 5개 맵 정의
├── input/     # 2인 키보드 입력
├── audio/     # Web Audio 효과음
├── effects/   # 시각 효과
└── utils/     # 벡터와 밸런스 상수
```

### 브롤러 추가

1. `js/entities/brawlers/`에 `Brawler` 하위 클래스를 만듭니다.
2. `js/utils/constants.js`의 `BRAWLERS`에 설정을 추가합니다.
3. `js/entities/brawlers/index.js`에 클래스를 등록합니다.
4. 로스터와 고유 동작을 검증하는 테스트를 추가합니다.

### 맵 추가

1. `js/map/mapData.js`에 타일, 스폰, 테마, 설명을 정의합니다.
2. 같은 파일의 `MAPS` 레지스트리에 등록합니다.
3. 맵 무결성 테스트를 갱신합니다.

자세한 시스템 경계는 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참고하세요.
