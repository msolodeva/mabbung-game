# macOS Stockfish 체스 GUI

로컬 macOS용 Stockfish 엔진을 사용해 브라우저에서 플레이할 수 있는 체스 GUI입니다. 프론트엔드는 정적 HTML/CSS/Vanilla JS로 작성되어 있고, 백엔드는 Python으로 UCI 프로토콜을 래핑하여 Stockfish 바이너리를 제어합니다.

## 주요 기능

- 체스.com 스타일을 참고한 반응형 UI
- macOS용 Stockfish 16 (x86-64 modern)과의 대국
- Skill Level / 탐색 깊이 조절, 힌트 요청, 엔진 평가 정보 노출
- 로컬 라이브러리(`chess.js`)만 사용 → 인터넷 없이도 사용 가능

## 실행 방법

1. **필수 조건**: macOS, Python 3.9 이상.
2. 저장소 루트에서 서버 실행
   ```bash
   python chess-stockfish/serve.py --port 8000
   ```
3. 브라우저에서 `http://localhost:8000/chess-stockfish/index.html` 접속.
4. 새 게임, 되돌리기, 보드 뒤집기, 힌트 버튼으로 플레이를 즐깁니다.

서버는 정적 파일을 제공함과 동시에 `/api/best-move` 엔드포인트로 Stockfish 엔진과 통신합니다. `serve.py`를 사용하면 교차-오리진 격리 설정이 필요하지 않습니다.

## 프로젝트 구조

```
chess-stockfish/
├── bin/
│   └── stockfish-mac        # 번들된 Stockfish 16 macOS x86-64 modern 바이너리
├── static/
│   ├── index.html           # 메인 페이지
│   ├── styles.css           # UI 스타일
│   ├── app.js               # 프론트엔드 로직
│   └── lib/
│       └── chess.min.js     # 체스 규칙 엔진 (jhlywa/chess.js)
└── serve.py                 # Python 개발 서버 + Stockfish API
```

## API 참고 (내부)

- `POST /api/best-move`
  - 요청 예시
    ```json
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "skill": 10,
      "depth": 18
    }
    ```
  - 응답 예시
    ```json
    {
      "move": "e2e4",
      "ponder": "c7c5",
      "info": {
        "depth": "18",
        "seldepth": "26",
        "score": "0.23",
        "mate": null,
        "nps": "5234567",
        "pv": "e2e4 c7c5 g1f3"
      }
    }
    ```

## 참고 사항

- 번들된 Stockfish 바이너리는 공식 [Stockfish 16](https://github.com/official-stockfish/Stockfish/releases/tag/sf_16) macOS x86-64 modern 빌드입니다.
- 다른 버전을 사용하고 싶다면 `bin/stockfish-mac`을 원하는 UCI 호환 바이너리로 교체하면 됩니다.
- 서버 종료 시 엔진 프로세스가 자동으로 정리되도록 구현되어 있습니다.
