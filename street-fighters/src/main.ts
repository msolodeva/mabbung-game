import './style.css';
import { Game } from './engine/Game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  canvas.width = 1280;
  canvas.height = 720;

  const game = new Game(canvas);
  game.start();

  // Audio enable on first click/keypress
  const enableAudio = () => {
    game.audio.enableAudio();
    window.removeEventListener('click', enableAudio);
    window.removeEventListener('keydown', enableAudio);
  };
  window.addEventListener('click', enableAudio);
  window.addEventListener('keydown', enableAudio);

  // Quick Action Buttons
  document.getElementById('btn-sound')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const s = game.audio.toggleSound();
    (e.target as HTMLElement).innerText = s ? '🔊 효과음 ON' : '🔇 효과음 OFF';
  });

  document.getElementById('btn-music')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const m = game.audio.toggleMusic();
    (e.target as HTMLElement).innerText = m ? '🎵 BGM ON' : '🔇 BGM OFF';
  });

  document.getElementById('btn-guide')?.addEventListener('click', (e) => {
    e.stopPropagation();
    game.menu.showGuide = !game.menu.showGuide;
  });

  document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  document.getElementById('btn-hitbox')?.addEventListener('click', (e) => {
    e.stopPropagation();
    game.debugHitboxes = !game.debugHitboxes;
    (e.target as HTMLElement).innerText = game.debugHitboxes ? '🟩 히트박스 ON' : '⬜ 히트박스 OFF';
  });
});
