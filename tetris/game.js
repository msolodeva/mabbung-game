// 게임 상수
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const LINES_PER_LEVEL = 5;
const INITIAL_DROP_INTERVAL = 1000;
const LEVEL_DROP_DECREMENT = 70;
const RUN_DROP_DECREMENT = 30;
const MIN_DROP_INTERVAL = 150;
const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];
const GAME_DURATION_MS = 90 * 1000;
const TIMER_UPDATE_INTERVAL = 200;
const GAME_OVER_TITLES = {
  default: 'Game Over',
  time: '시간 종료'
};
const GAME_OVER_STATUS = {
  default: '게임 오버',
  time: '시간 종료'
};

// 테트로미노 형태 정의 (4가지 회전 상태 - 시계방향)
const BASE_TETROMINOS = {
  'I': {
    shape: [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#00f0f0'
  },
  'O': {
    shape: [
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#f0f000'
  },
  'T': {
    shape: [
      [0,1,0,0],
      [1,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#a000f0'
  },
  'S': {
    shape: [
      [0,1,1,0],
      [1,1,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#00f000'
  },
  'Z': {
    shape: [
      [1,1,0,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#f00000'
  },
  'J': {
    shape: [
      [1,0,0,0],
      [1,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#0000f0'
  },
  'L': {
    shape: [
      [0,0,1,0],
      [1,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    color: '#f0a000'
  }
};

function cloneMatrix(matrix) {
  return matrix.map(row => [...row]);
}

function rotateMatrixCW(matrix) {
  const size = matrix.length;
  const rotated = Array.from({ length: size }, () => Array(size).fill(0));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      rotated[x][size - 1 - y] = matrix[y][x];
    }
  }

  return rotated;
}

function buildRotations(baseShape) {
  const rotations = [];
  let current = cloneMatrix(baseShape);

  for (let i = 0; i < 4; i++) {
    rotations.push(current);
    current = rotateMatrixCW(current);
  }

  return rotations;
}

const TETROMINOS = {};
for (const [type, data] of Object.entries(BASE_TETROMINOS)) {
  TETROMINOS[type] = {
    shape: buildRotations(data.shape),
    color: data.color
  };
}

const WALL_KICKS = {
  default: {
    '0->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '1->2': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    '2->3': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    '3->0': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]]
  },
  I: {
    '0->1': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
    '1->2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
    '2->3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    '3->0': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]]
  }
};

const ROTATION_PIVOTS = {
  default: { x: 1, y: 1 },
  I: { x: 1.5, y: 1.5 }
};

function getWallKickOffsets(type, fromRotation, toRotation) {
  if (type === 'O') {
    return [[0,0]];
  }
  const key = `${fromRotation}->${toRotation}`;
  const data = type === 'I' ? WALL_KICKS.I : WALL_KICKS.default;
  return data[key] || [[0,0]];
}

const TETROMINO_TYPES = Object.keys(TETROMINOS);

// 게임 상태
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let gameRunning = false;
let gamePaused = false;
let lastDropTime = 0;
let level = 1;
let linesClearedSinceLevel = 0;
let sessionDifficultyOffset = 0;
let audioContext = null;
let dropInterval = INITIAL_DROP_INTERVAL; // 1초마다 기본 자동 낙하
let runEndTime = 0;
let timerIntervalId = null;
let pausedTimeRemaining = GAME_DURATION_MS;
let gameOverTitleEl = null;

// Canvas 엘리먼트
let canvas, ctx, nextCanvas, nextCtx;

// 게임 초기화
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  nextCanvas = document.getElementById('next-canvas');
  nextCtx = nextCanvas.getContext('2d');
  
  // 이벤트 리스너 설정
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('restart-btn').addEventListener('click', restartGame);
  document.getElementById('restart-game-btn').addEventListener('click', restartGame);
  
  document.addEventListener('keydown', handleKeyPress);
  
  // 초기 보드 그리기
  drawBoard();
  drawNextPiece();
  updateLevelInfo();
  updateTimerDisplay(GAME_DURATION_MS);
}

// 게임 시작
function startGame() {
  if (gameRunning) return;
  
  // 보드 초기화
  board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
  score = 0;
  updateScore();
  resetLevelState();
  
  // 첫 블록 생성
  nextPiece = createRandomPiece();
  spawnNewPiece();
  
  gameRunning = true;
  gamePaused = false;
  startRunTimer();
  lastDropTime = Date.now();
  
  document.getElementById('start-btn').disabled = true;
  document.getElementById('pause-btn').disabled = false;
  document.getElementById('game-over-overlay').classList.add('hidden');
  document.getElementById('status-text').textContent = '게임 진행 중';
  playSound('start');
  
  gameLoop();
}

// 게임 재시작
function restartGame() {
  gameRunning = false;
  gamePaused = false;
  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
  startGame();
}

// 일시정지 토글
function togglePause() {
  if (!gameRunning) return;
  
  gamePaused = !gamePaused;
  document.getElementById('pause-btn').textContent = gamePaused ? '계속하기' : '일시정지';
  document.getElementById('status-text').textContent = gamePaused ? '일시정지됨' : '게임 진행 중';
  playSound(gamePaused ? 'pause' : 'resume');
  
  if (gamePaused) {
    pauseRunTimer();
  } else {
    resumeRunTimer();
    lastDropTime = Date.now();
    gameLoop();
  }
}

// 랜덤 테트로미노 생성
function createRandomPiece() {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  return {
    type: type,
    rotation: 0,
    x: Math.floor(BOARD_WIDTH / 2) - 2,
    y: 0,
    color: TETROMINOS[type].color
  };
}

// 새 블록 생성
function spawnNewPiece() {
  currentPiece = nextPiece;
  nextPiece = createRandomPiece();
  
  // 생성 위치에서 충돌 확인 (게임 오버)
  if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.rotation)) {
    gameOver();
    return;
  }
  
  drawNextPiece();
}

// 현재 블록의 형태 가져오기
function getCurrentShape() {
  return TETROMINOS[currentPiece.type].shape[currentPiece.rotation];
}

// 충돌 감지
function checkCollision(newX, newY, newRotation) {
  const shape = TETROMINOS[currentPiece.type].shape[newRotation];
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardX = newX + x;
        const boardY = newY + y;
        
        // 벽 충돌
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return true;
        }
        
        // 다른 블록과 충돌
        if (boardY >= 0 && board[boardY][boardX]) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 블록 이동
function movePiece(dx, dy, options = {}) {
  if (!gameRunning || gamePaused) return false;
  const { effect = null, silent = false } = options;
  
  const newX = currentPiece.x + dx;
  const newY = currentPiece.y + dy;
  
  if (!checkCollision(newX, newY, currentPiece.rotation)) {
    currentPiece.x = newX;
    currentPiece.y = newY;
    draw();
    if (effect && !silent) {
      playSound(effect);
    }
    return true;
  } else if (dy > 0) {
    // 아래로 이동할 수 없으면 블록 고정
    lockPiece();
    return false;
  }
  return false;
}

// 블록 회전
function rotatePiece() {
  if (!gameRunning || gamePaused) return;
  
  const fromRotation = currentPiece.rotation;
  const newRotation = (fromRotation + 1) % 4;
  const offsets = getWallKickOffsets(currentPiece.type, fromRotation, newRotation);
  const pivot = ROTATION_PIVOTS[currentPiece.type] || ROTATION_PIVOTS.default;
  const pivotX = currentPiece.x + pivot.x;
  const pivotY = currentPiece.y + pivot.y;

  for (const [dx, dy] of offsets) {
    const newX = pivotX - pivot.x + dx;
    const newY = pivotY - pivot.y + dy;
    if (!checkCollision(newX, newY, newRotation)) {
      currentPiece.x = newX;
      currentPiece.y = newY;
      currentPiece.rotation = newRotation;
      draw();
      playSound('rotate');
      return;
    }
  }
}

// 블록 고정
function lockPiece() {
  const shape = getCurrentShape();
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardY = currentPiece.y + y;
        const boardX = currentPiece.x + x;
        
        if (boardY >= 0) {
          board[boardY][boardX] = currentPiece.color;
        }
      }
    }
  }
  
  // 줄 제거
  clearLines();
  
  // 새 블록 생성
  spawnNewPiece();
}

// 줄 제거
function clearLines() {
  let linesCleared = 0;
  
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      // 줄 제거
      board.splice(y, 1);
      board.unshift(Array(BOARD_WIDTH).fill(0));
      linesCleared++;
      y++; // 같은 줄 다시 확인
    }
  }
  
  // 점수 계산
  if (linesCleared > 0) {
    score += LINE_CLEAR_POINTS[linesCleared];
    updateScore();
    handleLineClearAudio(linesCleared);
    linesClearedSinceLevel += linesCleared;
    while (linesClearedSinceLevel >= LINES_PER_LEVEL) {
      linesClearedSinceLevel -= LINES_PER_LEVEL;
      levelUp();
    }
  }
}

function updateLevelInfo() {
  const levelEl = document.getElementById('level');
  const runEl = document.getElementById('run-count');
  if (levelEl) {
    levelEl.textContent = level;
  }
  if (runEl) {
    runEl.textContent = sessionDifficultyOffset + 1;
  }
}

function calculateDropInterval() {
  return Math.max(
    MIN_DROP_INTERVAL,
    INITIAL_DROP_INTERVAL - (level - 1) * LEVEL_DROP_DECREMENT - sessionDifficultyOffset * RUN_DROP_DECREMENT
  );
}

function updateDropInterval() {
  dropInterval = calculateDropInterval();
}

function resetLevelState() {
  level = 1;
  linesClearedSinceLevel = 0;
  updateDropInterval();
  updateLevelInfo();
}

function levelUp() {
  level++;
  updateDropInterval();
  updateLevelInfo();
  playSound('level-up');
}

function formatTime(ms) {
  const safeMs = Math.max(0, Math.round(ms));
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerDisplay(milliseconds = Math.max(0, runEndTime - Date.now())) {
  const timerEl = document.getElementById('timer');
  if (timerEl) {
    timerEl.textContent = formatTime(milliseconds);
  }
}

function startRunTimer(durationMs = GAME_DURATION_MS) {
  stopRunTimer();
  runEndTime = Date.now() + durationMs;
  pausedTimeRemaining = durationMs;
  updateTimerDisplay(durationMs);

  timerIntervalId = setInterval(() => {
    const remaining = runEndTime - Date.now();
    const safeRemaining = Math.max(0, remaining);
    pausedTimeRemaining = safeRemaining;

    if (safeRemaining <= 0) {
      updateTimerDisplay(0);
      stopRunTimer();
      handleTimeUp();
    } else {
      updateTimerDisplay(safeRemaining);
    }
  }, TIMER_UPDATE_INTERVAL);
}

function stopRunTimer() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function pauseRunTimer() {
  pausedTimeRemaining = Math.max(0, runEndTime - Date.now());
  stopRunTimer();
}

function resumeRunTimer() {
  const remaining = Math.max(0, pausedTimeRemaining || GAME_DURATION_MS);
  startRunTimer(remaining);
}

function handleTimeUp() {
  if (!gameRunning) return;
  gameOver('time');
}

function setGameOverTitle(text) {
  if (!gameOverTitleEl) {
    gameOverTitleEl = document.querySelector('#game-over-overlay h2');
  }
  if (gameOverTitleEl) {
    gameOverTitleEl.textContent = text;
  }
}

function handleLineClearAudio(linesCleared) {
  if (linesCleared >= 4) {
    playSound('tetris');
  } else {
    playSound('line-clear');
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  return audioContext;
}

function playTone(frequency, duration = 0.1, volume = 0.2, type = 'triangle') {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const currentTime = ctx.currentTime;
  gainNode.gain.setValueAtTime(volume, currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

  oscillator.start(currentTime);
  oscillator.stop(currentTime + duration);
}

function playSound(effect) {
  switch (effect) {
    case 'move':
      playTone(520, 0.05, 0.22);
      break;
    case 'soft-drop':
      playTone(460, 0.07, 0.2);
      break;
    case 'line-clear':
      playTone(440, 0.08, 0.22);
      break;
    case 'tetris':
      playTone(520, 0.12, 0.25);
      setTimeout(() => playTone(660, 0.1, 0.2), 80);
      break;
    case 'level-up':
      playTone(660, 0.18, 0.25);
      break;
    case 'hard-drop':
      playTone(340, 0.16, 0.35, 'square');
      break;
    case 'start':
      playTone(720, 0.15, 0.3);
      setTimeout(() => playTone(560, 0.12, 0.25), 90);
      break;
    case 'pause':
      playTone(260, 0.15, 0.22, 'triangle');
      break;
    case 'resume':
      playTone(620, 0.18, 0.26, 'sawtooth');
      break;
    case 'time-up':
      playTone(300, 0.25, 0.3, 'sawtooth');
      setTimeout(() => playTone(400, 0.2, 0.25), 90);
      break;
    case 'game-over':
      playTone(250, 0.35, 0.3, 'sawtooth');
      break;
    default:
      break;
  }
}

// 하드 드롭 - 블록을 한 번에 바닥까지 내려옴
function hardDrop() {
  if (!gameRunning || gamePaused) return;
  
  // 바닥까지 가장 낮은 위치 찾기
  while (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.rotation)) {
    currentPiece.y++;
  }
  
  // 블록 고정
  lockPiece();
  playSound('hard-drop');
  draw();
}

// 점수 업데이트
function updateScore() {
  document.getElementById('score').textContent = score;
}

// 키보드 이벤트 처리
function handleKeyPress(e) {
  if (!gameRunning) return;
  
  switch(e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      movePiece(-1, 0, { effect: 'move' });
      break;
    case 'ArrowRight':
      e.preventDefault();
      movePiece(1, 0, { effect: 'move' });
      break;
    case 'ArrowDown':
      e.preventDefault();
      movePiece(0, 1, { effect: 'soft-drop' });
      break;
    case 'ArrowUp':
      e.preventDefault();
      rotatePiece();
      break;
    case ' ':
      e.preventDefault();
      hardDrop();
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      togglePause();
      break;
  }
}

// 게임 루프
function gameLoop() {
  if (!gameRunning || gamePaused) return;
  
  const currentTime = Date.now();
  
  // 자동 낙하
  if (currentTime - lastDropTime > dropInterval) {
    movePiece(0, 1, { silent: true });
    lastDropTime = currentTime;
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

// 보드 그리기
function drawBoard() {
  // 배경
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 그리드 라인
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  
  for (let y = 0; y <= BOARD_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
    ctx.stroke();
  }
  
  for (let x = 0; x <= BOARD_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
    ctx.stroke();
  }
  
  // 고정된 블록 그리기
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (board[y][x]) {
        drawBlock(ctx, x, y, board[y][x]);
      }
    }
  }
}

// 블록 그리기
function drawBlock(context, x, y, color) {
  const px = x * BLOCK_SIZE;
  const py = y * BLOCK_SIZE;
  
  // 블록 색상
  context.fillStyle = color;
  context.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  
  // 하이라이트 (3D 효과)
  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.fillRect(px + 2, py + 2, BLOCK_SIZE - 4, 4);
  context.fillRect(px + 2, py + 2, 4, BLOCK_SIZE - 4);
  
  // 그림자
  context.fillStyle = 'rgba(0, 0, 0, 0.3)';
  context.fillRect(px + BLOCK_SIZE - 6, py + 2, 4, BLOCK_SIZE - 4);
  context.fillRect(px + 2, py + BLOCK_SIZE - 6, BLOCK_SIZE - 4, 4);
}

// 현재 블록 그리기
function drawCurrentPiece() {
  if (!currentPiece) return;
  
  const shape = getCurrentShape();
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
      }
    }
  }
}

// 다음 블록 그리기
function drawNextPiece() {
  // 배경
  nextCtx.fillStyle = '#000';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  
  if (!nextPiece) return;
  
  const shape = TETROMINOS[nextPiece.type].shape[0];
  const blockSize = 25;
  
  // 중앙 정렬
  const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
  const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const px = offsetX + x * blockSize;
        const py = offsetY + y * blockSize;
        
        // 블록 그리기
        nextCtx.fillStyle = nextPiece.color;
        nextCtx.fillRect(px + 1, py + 1, blockSize - 2, blockSize - 2);
        
        // 하이라이트
        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        nextCtx.fillRect(px + 2, py + 2, blockSize - 4, 3);
        nextCtx.fillRect(px + 2, py + 2, 3, blockSize - 4);
      }
    }
  }
}

// 전체 화면 그리기
function draw() {
  drawBoard();
  drawCurrentPiece();
}

// 게임 오버
function gameOver(reason = 'default') {
  if (!gameRunning && !gamePaused) {
    return;
  }

  stopRunTimer();
  gameRunning = false;
  gamePaused = false;
  sessionDifficultyOffset++;
  updateLevelInfo();
  
  const title = GAME_OVER_TITLES[reason] || GAME_OVER_TITLES.default;
  const status = GAME_OVER_STATUS[reason] || GAME_OVER_STATUS.default;
  setGameOverTitle(title);
  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
  document.getElementById('game-over-overlay').classList.remove('hidden');
  document.getElementById('final-score').textContent = score;
  document.getElementById('status-text').textContent = status;
  playSound(reason === 'time' ? 'time-up' : 'game-over');
}

// 페이지 로드시 초기화
window.addEventListener('load', init);
