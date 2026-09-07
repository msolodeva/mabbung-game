import './style.css';
import { Game } from './engine/Game';
import { sprites } from './render/Sprites';
async function boot():Promise<void> {
const canvas=document.getElementById('game-canvas') as HTMLCanvasElement;
canvas.width=1280;canvas.height=720;
await sprites.load();
document.getElementById('loading')!.hidden=true;
const game=new Game(canvas);
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
game.particles.reducedMotion=game.camera.reducedMotion=motionPreference.matches;
game.start();
if(import.meta.env.DEV) (window as unknown as {game:Game}).game=game;
const focus=()=>canvas.focus({preventScroll:true});
const bind=(id:string,action:()=>void)=>document.getElementById(id)?.addEventListener('click',()=>{action();focus();});
bind('btn-cpu',()=>game.quickStart('CPU'));bind('btn-versus',()=>game.quickStart('PVP'));bind('btn-training',()=>game.quickStart('TRAINING'));
bind('btn-guide',()=>{game.menu.showGuide=!game.menu.showGuide;});
bind('btn-sound',()=>{game.audio.toggleSound();syncButtons();});bind('btn-music',()=>{game.audio.toggleMusic();syncButtons();});
bind('btn-effects',()=>{game.particles.reducedMotion=!game.particles.reducedMotion;game.camera.reducedMotion=game.particles.reducedMotion;game.camera.clearEffects();syncButtons();});
bind('btn-hitbox',()=>{game.debugHitboxes=!game.debugHitboxes;syncButtons();});
bind('btn-fullscreen',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.querySelector('.game-wrapper')?.requestFullscreen();});
function syncButtons():void {
 const effects=document.getElementById('btn-effects')!;effects.textContent=game.particles.reducedMotion?'연출 부드럽게':'연출 강하게';effects.setAttribute('aria-pressed',String(!game.particles.reducedMotion));
 document.getElementById('btn-sound')!.textContent=`효과음 ${game.audio.soundEnabled?'ON':'OFF'}`;
 document.getElementById('btn-music')!.textContent=`BGM ${game.audio.musicEnabled?'ON':'OFF'}`;
 document.getElementById('btn-hitbox')!.textContent=`판정 ${game.debugHitboxes?'ON':'OFF'} · F2`;
}
syncButtons();
window.addEventListener('keydown',()=>{game.audio.enableAudio();queueMicrotask(syncButtons);});
canvas.addEventListener('pointerdown',focus);

}
void boot();
