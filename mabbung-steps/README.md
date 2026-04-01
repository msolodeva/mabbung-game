# MABBUNG STEPS 🧗‍♂️

2인용 경쟁 액션 게임, '무한의 계단' 클론 프로젝트입니다. 계단을 오르며 코인을 수집하고 새로운 캐릭터를 잠금 해제하세요!

## 🚀 시작하기 (How to Run)

프로젝트를 로컬에서 실행하려면 아래 명령어를 순서대로 입력하세요.

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```

3. **브라우저 접속**
   터미널에 표시된 로컬 주소(기본: `http://localhost:5173`)로 접속합니다.

---

## 🎮 게임 조작법 (Controls)

이 게임은 **2인용 경쟁 모드**를 지원하며, 두 플레이어 모두 **Ready** 상태가 되어야 게임이 시작됩니다.

### 1단계: 캐릭터 선택 화면 (Character Select)
| 기능 | 플레이어 1 (좌측) | 플레이어 2 (우측) |
| :--- | :--- | :--- |
| 캐릭터 변경 | `W` (이전), `S` (다음) | `↑` (이전), `↓` (다음) |
| **선택 / 준비(Ready)** | **`D`** | **`→`** |
| 캐릭터 구매 | `D` (코인 부족 시 불가능) | `→` (코인 부족 시 불가능) |

### 2단계: 인게임 플레이 (Gameplay)
| 기능 | 플레이어 1 | 플레이어 2 |
| :--- | :--- | :--- |
| **계단 오르기 (Climb)** | **`W`** | **`↑`** |
| **방향 전환 (Turn)** | **`D`** | **`→`** |

---

## 💎 주요 기능 (Key Features)

- **2-Player Mode**: 동시에 두 명의 플레이어가 경쟁하며, 누가 더 높이 올라가는지 겨룹니다.
- **Character System**: 수집한 코인으로 총 4종의 캐릭터(`BLOCK`, `SLIME`, `NINJA`, `ROBOT`)를 잠금 해제할 수 있습니다.
- **Global Wallet**: 수집한 코인과 잠금 해제된 캐릭터 정보는 브라우저의 `localStorage`에 자동 저장되어 유지됩니다.
- **Coin Spawning**: 계단을 오를 때 일정 확률로 코인이 생성되며, 획득 시 보너스를 얻습니다.

---

## 🛠 기술 스택 (Tech Stack)

- **Engine**: Pure Javascript (Vanilla JS)
- **Rendering**: HTML5 Canvas API
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Modern Premium Design)

---

Enjoy the game! 🎮✨
