import { Stairs } from './Stairs.js';
import { Player } from './Player.js';
import { Renderer } from './Renderer.js';
import { SoundManager } from './SoundManager.js';
import './style.css';

const STATE_SELECT = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;
let gameState = STATE_SELECT;
const soundManager = new SoundManager();

const CHARACTERS = [
  { id: 'BLOCK' },
  { id: 'SLIME' },
  { id: 'NINJA' },
  { id: 'ROBOT' }
];


let p1CharIdx = 0;
let p2CharIdx = 0;
let p1Ready = false;
let p2Ready = false;

let stairs;
let p1, p2;
let r1, r2;
let lastTime = 0;

// UI Elements
const selectOverlay = document.getElementById('character-select-overlay');

const p1CharNameEl = document.getElementById('p1-char-name');
const p1ReadyBadge = document.getElementById('p1-ready-status');
const p1PreviewCtx = document.getElementById('p1-preview-canvas').getContext('2d');

const p2CharNameEl = document.getElementById('p2-char-name');
const p2ReadyBadge = document.getElementById('p2-ready-status');
const p2PreviewCtx = document.getElementById('p2-preview-canvas').getContext('2d');

const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const p1TimerEl = document.getElementById('p1-timer');
const p2TimerEl = document.getElementById('p2-timer');
const overlay = document.getElementById('game-over-overlay');
const winnerText = document.getElementById('winner-text');
const restartBtn = document.getElementById('restart-btn');

function drawCharacterPreview(ctx, type, color, time) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);

  const size = 60;
  const dir = 1;
  const isBlinking = (Math.floor(time / 2000) % 2 === 0) && (time % 2000 < 150);

  ctx.save();
  const idle = Math.sin(time / 300) * 0.05;
  ctx.translate(width / 2, height / 2 + (size/2));
  ctx.scale(1 - idle, 1 + idle);
  ctx.translate(0, -size/2);

  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;

  const eyeOffsetL = Math.sin(time / 200) * 4;
  const eyeOffsetR = Math.cos(time / 250) * 4;

  if (type === 'BLOCK') {
    ctx.fillRect(-size/2, -size/2, size, size);
    if (!isBlinking) {
      ctx.fillStyle = '#fff';
      const faceX = dir * (size/4);
      ctx.fillRect(faceX - size/4 + eyeOffsetL, -size/4, size/2, size/6);
    }

  } else if (type === 'SLIME') {
    ctx.beginPath();
    ctx.ellipse(0, 0, size/2, size/2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!isBlinking) {
      ctx.fillStyle = '#fff';
      const faceX = dir * (size/4);
      ctx.beginPath();
      ctx.arc(faceX - size/8 + eyeOffsetL, -size/8, size/10, 0, Math.PI * 2);
      ctx.arc(faceX + size/8 + eyeOffsetR, -size/8, size/10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(faceX, 0, 10, 0, Math.PI); ctx.stroke();
    }

  } else if (type === 'NINJA') {
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.fillStyle = '#111';
    ctx.fillRect(-size/2, -size/4, size, size/3);
    if (!isBlinking) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(size/4 - size/5 + eyeOffsetL, -size/8, size/3, size/12);
    }
    // Propeller headbands
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const rotation = (time / 60);
    const waveX = Math.cos(rotation) * 50;
    const waveY = Math.sin(rotation) * 50;
    ctx.moveTo(-size/2, -size/4);
    ctx.quadraticCurveTo(-size, -size/2 + waveY, -size - waveX, waveY);
    ctx.stroke();

  } else if (type === 'ROBOT') {
    const headPop = Math.sin(time/100) * 8;
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -size/2);
    ctx.lineTo(0, -size/2 + headPop);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, headPop);
    ctx.fillStyle = color;
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.fillStyle = '#111';
    ctx.fillRect(size/8 - size/3, -size/6, size/1.5, size/3.5);
    if (!isBlinking) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size/4 - 10, -5); ctx.lineTo(size/4, -20); ctx.lineTo(size/4 + 10, -5);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}


function showSelectScreen() {
  gameState = STATE_SELECT;
  p1Ready = false;
  p2Ready = false;
  selectOverlay.classList.remove('hidden');
  overlay.classList.add('hidden');
  updateSelectText();
}

function updateSelectText() {
  const c1 = CHARACTERS[p1CharIdx];
  const c2 = CHARACTERS[p2CharIdx];

  p1CharNameEl.innerText = c1.id;
  p2CharNameEl.innerText = c2.id;
  
  if (p1Ready) p1ReadyBadge.classList.remove('hidden');
  else p1ReadyBadge.classList.add('hidden');
  
  if (p2Ready) p2ReadyBadge.classList.remove('hidden');
  else p2ReadyBadge.classList.add('hidden');

  if (p1Ready && p2Ready) {
    setTimeout(initGame, 500);
  }
}

function handleReadyAction(playerNum) {
  if (playerNum === 1) p1Ready = true;
  else p2Ready = true;
  soundManager.playUISelect();
  updateSelectText();
}

function initGame() {
  gameState = STATE_PLAYING;
  selectOverlay.classList.add('hidden');
  overlay.classList.add('hidden');
  
  stairs = new Stairs();
  const firstStep = stairs.getStepInfo(1);
  const startDir = firstStep.x; // Since step 0 is at (0,0)

  p1 = new Player(1, startDir, stairs, CHARACTERS[p1CharIdx].id, soundManager);
  p2 = new Player(2, startDir, stairs, CHARACTERS[p2CharIdx].id, soundManager);
  
  if (!r1) r1 = new Renderer('p1-canvas', p1, stairs, true);
  if (!r2) r2 = new Renderer('p2-canvas', p2, stairs, false);

  r1.player = p1;
  r1.stairs = stairs;
  r2.player = p2;
  r2.stairs = stairs;

  lastTime = performance.now();
  updateHUD();
}

function updateHUD() {
  p1ScoreEl.innerText = p1.score;
  p2ScoreEl.innerText = p2.score;

  p1TimerEl.style.width = `${p1.timer}%`;
  p2TimerEl.style.width = `${p2.timer}%`;

  p1TimerEl.style.backgroundColor = p1.timer < 30 ? '#ff003c' : '#00f0ff';
  p1TimerEl.style.boxShadow = `0 0 12px ${p1TimerEl.style.backgroundColor}`;
  
  p2TimerEl.style.backgroundColor = p2.timer < 30 ? '#ff003c' : '#ff007b';
  p2TimerEl.style.boxShadow = `0 0 12px ${p2TimerEl.style.backgroundColor}`;
}

function checkGameOver() {
  if (p1.isDead && p2.isDead) {
    if (gameState === STATE_PLAYING) {
      gameState = STATE_GAMEOVER;
      setTimeout(showGameOver, 1500);
    }
  }
}

function showGameOver() {
  overlay.classList.remove('hidden');
  if (p1.score > p2.score) {
    winnerText.innerHTML = `Player 1 Wins!<br><span style="font-size: 1.5rem; color: #00f0ff;">${p1.score} vs ${p2.score}</span>`;
  } else if (p2.score > p1.score) {
    winnerText.innerHTML = `Player 2 Wins!<br><span style="font-size: 1.5rem; color: #ff007b;">${p1.score} vs ${p2.score}</span>`;
  } else {
    winnerText.innerHTML = `Draw!<br><span style="font-size: 1.5rem; color: #ffffff;">${p1.score} vs ${p2.score}</span>`;
  }
}

function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (gameState === STATE_SELECT) {
    // Draw animated previews using ID
    drawCharacterPreview(p1PreviewCtx, CHARACTERS[p1CharIdx].id, '#00f0ff', time);
    drawCharacterPreview(p2PreviewCtx, CHARACTERS[p2CharIdx].id, '#ff007b', time);

  } else if (dt < 0.1 && dt > 0) {
    if (gameState === STATE_PLAYING || gameState === STATE_GAMEOVER) {
      p1.update(dt);
      p2.update(dt);
      
      r1.render();
      r2.render();
      
      if (gameState === STATE_PLAYING) {
        updateHUD();
        checkGameOver();
      }
    }
  }
  
  requestAnimationFrame(loop);
}

// Input Handling
window.addEventListener('keydown', (e) => {
  soundManager.init(); // Initialize on first keypress to satisfy browser policies
  
  if (gameState === STATE_SELECT) {
    if (!p1Ready) {
      if (e.key === 'w' || e.key === 'W') {
        p1CharIdx = (p1CharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
        soundManager.playUIHover();
        updateSelectText();
      } else if (e.key === 's' || e.key === 'S') {
        p1CharIdx = (p1CharIdx + 1) % CHARACTERS.length;
        soundManager.playUIHover();
        updateSelectText();
      } else if (e.key === 'd' || e.key === 'D') {
        handleReadyAction(1);
      }
    }

    if (!p2Ready) {
      if (e.key === 'ArrowUp') {
        p2CharIdx = (p2CharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
        soundManager.playUIHover();
        updateSelectText();
      } else if (e.key === 'ArrowDown') {
        p2CharIdx = (p2CharIdx + 1) % CHARACTERS.length;
        soundManager.playUIHover();
        updateSelectText();
      } else if (e.key === 'ArrowRight') {
        handleReadyAction(2);
      }
    }
    return;
  }

  if (gameState !== STATE_PLAYING) return;

  if (e.key === 'w' || e.key === 'W') {
    p1.step('climb');
  } else if (e.key === 'd' || e.key === 'D') {
    p1.step('turn');
  }
  
  if (e.key === 'ArrowUp') {
    p2.step('climb');
  } else if (e.key === 'ArrowRight') {
    p2.step('turn');
  }
});

restartBtn.addEventListener('click', () => {
  soundManager.playUISelect();
  showSelectScreen();
});

showSelectScreen();
requestAnimationFrame(loop);
