import { Stairs } from './Stairs.js';
import { Player } from './Player.js';
import { Renderer } from './Renderer.js';
import './style.css';

const STATE_SELECT = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;
let gameState = STATE_SELECT;

const CHARACTERS = [
  { id: 'BLOCK', price: 0 },
  { id: 'SLIME', price: 50 },
  { id: 'NINJA', price: 150 },
  { id: 'ROBOT', price: 300 }
];

let totalCoins = parseInt(localStorage.getItem('totalCoins') || '0', 10);
let unlockedChars = JSON.parse(localStorage.getItem('unlockedChars') || '["BLOCK"]');

function saveData() {
  localStorage.setItem('totalCoins', totalCoins.toString());
  localStorage.setItem('unlockedChars', JSON.stringify(unlockedChars));
}

let p1CharIdx = 0;
let p2CharIdx = 0;
let p1Ready = false;
let p2Ready = false;

let stairs;
let p1, p2;
let r1, r2;
let lastTime = 0;

// UI Elements
const totalCoinsEl = document.getElementById('total-coins');
const selectOverlay = document.getElementById('character-select-overlay');

const p1CharNameEl = document.getElementById('p1-char-name');
const p1CharPriceEl = document.getElementById('p1-char-price');
const p1ReadyBadge = document.getElementById('p1-ready-status');
const p1PreviewCtx = document.getElementById('p1-preview-canvas').getContext('2d');

const p2CharNameEl = document.getElementById('p2-char-name');
const p2CharPriceEl = document.getElementById('p2-char-price');
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

  ctx.save();
  const bounce = Math.sin(time / 300) * 5;
  ctx.translate(width / 2, height / 2 + bounce);

  ctx.fillStyle = color;

  if (type === 'BLOCK') {
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ffffff';
    const faceOffset = dir * (size/4);
    ctx.fillRect(faceOffset - size/4, -size/4, size/2, size/6);

  } else if (type === 'SLIME') {
    ctx.beginPath();
    const stretchY = size + Math.sin(time / 200) * 5;
    ctx.ellipse(0, Number(size/2 - stretchY/2), size/2, stretchY/2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(dir * size/4 - size/8, -size/8, size/10, 0, Math.PI * 2);
    ctx.arc(dir * size/4 + size/8, -size/8, size/10, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'NINJA') {
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.fillRect(-size/2, -size/4, size, size/4);
    ctx.fillStyle = '#fff';
    ctx.fillRect((dir * size/4) - size/5, -size/4 + size/16, size/3, size/12);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-dir * size/2, -size/6);
    ctx.lineTo(-dir * size/1.2, -size/3);
    ctx.moveTo(-dir * size/2, -size/6);
    ctx.lineTo(-dir * size/1.4, Math.sin(time/100) * 5); 
    ctx.stroke();

  } else if (type === 'ROBOT') {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -size/2);
    ctx.lineTo(0, -size/1.2);
    ctx.stroke();
    ctx.fillStyle = Math.sin(time/150) > 0 ? '#ff003c' : '#550011';
    ctx.beginPath();
    ctx.arc(0, -size/1.2, size/10, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.fillStyle = '#111';
    ctx.fillRect(dir * size/8 - size/3, -size/6, size/1.5, size/3);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(dir * size/4 - size/8, -size/10, size/4, size/6);
  }

  ctx.restore();
}

function updateGlobalWallet() {
  totalCoinsEl.innerText = totalCoins;
}

function showSelectScreen() {
  gameState = STATE_SELECT;
  p1Ready = false;
  p2Ready = false;
  updateGlobalWallet();
  selectOverlay.classList.remove('hidden');
  overlay.classList.add('hidden');
  updateSelectText();
}

function updateSelectText() {
  const c1 = CHARACTERS[p1CharIdx];
  const c2 = CHARACTERS[p2CharIdx];

  p1CharNameEl.innerText = c1.id;
  if (!unlockedChars.includes(c1.id)) {
    p1CharPriceEl.innerText = `🔒 ${c1.price}`;
    p1CharPriceEl.classList.remove('hidden');
  } else {
    p1CharPriceEl.classList.add('hidden');
  }

  p2CharNameEl.innerText = c2.id;
  if (!unlockedChars.includes(c2.id)) {
    p2CharPriceEl.innerText = `🔒 ${c2.price}`;
    p2CharPriceEl.classList.remove('hidden');
  } else {
    p2CharPriceEl.classList.add('hidden');
  }
  
  if (p1Ready) p1ReadyBadge.classList.remove('hidden');
  else p1ReadyBadge.classList.add('hidden');
  
  if (p2Ready) p2ReadyBadge.classList.remove('hidden');
  else p2ReadyBadge.classList.add('hidden');

  if (p1Ready && p2Ready) {
    setTimeout(initGame, 500);
  }
}

function handleReadyAction(playerNum) {
  const charIdx = playerNum === 1 ? p1CharIdx : p2CharIdx;
  const charData = CHARACTERS[charIdx];

  if (unlockedChars.includes(charData.id)) {
    if (playerNum === 1) p1Ready = true;
    else p2Ready = true;
    updateSelectText();
    return;
  }

  // Not unlocked. Try to buy.
  if (totalCoins >= charData.price) {
    totalCoins -= charData.price;
    unlockedChars.push(charData.id);
    saveData();
    updateGlobalWallet();
    updateSelectText();
  } else {
    // Insufficient coins. Visual blink
    const priceEl = playerNum === 1 ? p1CharPriceEl : p2CharPriceEl;
    priceEl.style.color = '#fff';
    priceEl.style.background = '#ff003c';
    setTimeout(() => {
      priceEl.style.color = '#ff4444';
      priceEl.style.background = 'rgba(0,0,0,0.8)';
    }, 200);
  }
}

function initGame() {
  gameState = STATE_PLAYING;
  selectOverlay.classList.add('hidden');
  overlay.classList.add('hidden');
  
  stairs = new Stairs();
  p1 = new Player(1, 1, stairs, CHARACTERS[p1CharIdx].id);
  p2 = new Player(2, 1, stairs, CHARACTERS[p2CharIdx].id);
  
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
  
  document.getElementById('p1-current-coins').innerText = p1.sessionCoins || 0;
  document.getElementById('p2-current-coins').innerText = p2.sessionCoins || 0;

  p1TimerEl.style.width = `${p1.timer}%`;
  p2TimerEl.style.width = `${p2.timer}%`;

  p1TimerEl.style.backgroundColor = p1.timer < 30 ? '#ff003c' : '#00f0ff';
  p1TimerEl.style.boxShadow = `0 0 12px ${p1TimerEl.style.backgroundColor}`;
  
  p2TimerEl.style.backgroundColor = p2.timer < 30 ? '#ff003c' : '#ff007b';
  p2TimerEl.style.boxShadow = `0 0 12px ${p2TimerEl.style.backgroundColor}`;
}

function checkGameOver() {
  if (p1.isDead || p2.isDead) {
    if (gameState === STATE_PLAYING) {
      gameState = STATE_GAMEOVER;
      
      // Collect coins
      const earnedCoins = (p1.sessionCoins || 0) + (p2.sessionCoins || 0);
      totalCoins += earnedCoins;
      saveData();
      updateGlobalWallet();

      setTimeout(showGameOver, 1500);
    }
  }
}

function showGameOver() {
  overlay.classList.remove('hidden');
  const earnedCoins = (p1.sessionCoins || 0) + (p2.sessionCoins || 0);

  if (p1.isDead && p2.isDead) {
    if (p1.score > p2.score) winnerText.innerHTML = `Player 1 Wins!<br><span style="font-size: 2rem; color: #ffd700;">+${earnedCoins} Coins</span>`;
    else if (p2.score > p1.score) winnerText.innerHTML = `Player 2 Wins!<br><span style="font-size: 2rem; color: #ffd700;">+${earnedCoins} Coins</span>`;
    else winnerText.innerHTML = `Draw!<br><span style="font-size: 2rem; color: #ffd700;">+${earnedCoins} Coins</span>`;
  } else if (p2.isDead) {
    winnerText.innerHTML = `Player 1 Wins!<br><span style="font-size: 2rem; color: #ffd700;">+${earnedCoins} Coins</span>`;
  } else if (p1.isDead) {
    winnerText.innerHTML = `Player 2 Wins!<br><span style="font-size: 2rem; color: #ffd700;">+${earnedCoins} Coins</span>`;
  }
}

function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (gameState === STATE_SELECT) {
    // Draw animated previews using ID
    drawCharacterPreview(p1PreviewCtx, CHARACTERS[p1CharIdx].id, '#00f0ff', time);
    // Darken preview if locked
    if (!unlockedChars.includes(CHARACTERS[p1CharIdx].id)) {
      p1PreviewCtx.fillStyle = 'rgba(0,0,0,0.6)';
      p1PreviewCtx.fillRect(0,0,160,160);
    }

    drawCharacterPreview(p2PreviewCtx, CHARACTERS[p2CharIdx].id, '#ff007b', time);
    if (!unlockedChars.includes(CHARACTERS[p2CharIdx].id)) {
      p2PreviewCtx.fillStyle = 'rgba(0,0,0,0.6)';
      p2PreviewCtx.fillRect(0,0,160,160);
    }

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
  if (gameState === STATE_SELECT) {
    if (!p1Ready) {
      if (e.key === 'w' || e.key === 'W') {
        p1CharIdx = (p1CharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
        updateSelectText();
      } else if (e.key === 's' || e.key === 'S') {
        p1CharIdx = (p1CharIdx + 1) % CHARACTERS.length;
        updateSelectText();
      } else if (e.key === 'd' || e.key === 'D') {
        handleReadyAction(1);
      }
    }

    if (!p2Ready) {
      if (e.key === 'ArrowUp') {
        p2CharIdx = (p2CharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
        updateSelectText();
      } else if (e.key === 'ArrowDown') {
        p2CharIdx = (p2CharIdx + 1) % CHARACTERS.length;
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
  showSelectScreen();
});

showSelectScreen();
requestAnimationFrame(loop);
