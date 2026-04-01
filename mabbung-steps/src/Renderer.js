function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function lerpColor(c1, c2, t) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

export class Renderer {
  constructor(canvasId, player, stairs, isPlayer1) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.player = player;
    this.stairs = stairs;
    this.isPlayer1 = isPlayer1;

    // Game constants
    this.STEP_WIDTH = 80;
    this.STEP_HEIGHT = 50;
    
    // Resize handler
    window.addEventListener('resize', () => this.resize());
    this.resize();

    // Visual theme
    this.pColor = isPlayer1 ? '#00f0ff' : '#ff007b';
    this.stairColor = '#1f2937'; // Dark grayish-blue

    // Parallax background items
    this.stars = [];
    for(let i=0; i<150; i++) {
       this.stars.push({
          x: Math.random(), 
          y: Math.random(), 
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.4 + 0.1 
       });
    }

    this.buildings = [];
    // Sort buildings by depth (speed) for layering if we wanted, but simple sequence is fine
    for(let i=0; i<12; i++) {
       this.buildings.push({
          x: Math.random(),
          width: Math.random() * 0.15 + 0.05,
          height: Math.random() * 0.4 + 0.1,
          color: `rgb(${20+Math.random()*20}, ${25+Math.random()*20}, ${35+Math.random()*20})` // City silhouettes
       });
    }

    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.bgObjects = [];
    this.lastBgTime = Date.now();
    this.shakeAmount = 0;
    this.cameraBump = 0;
    
    // Spawn initial wacky background objects
    for (let i = 0; i < 10; i++) {
        const types = ['CLOUD', 'SAUSAGE', 'SHOE', 'UFO'];
        this.bgObjects.push({
          x: Math.random() * 800, // roughly screen width
          y: Math.random() * 600, // roughly screen height
          type: types[Math.floor(Math.random() * types.length)],
          speed: 20 + Math.random() * 50,
          vx: (Math.random() > 0.5 ? 1 : -1),
          size: 40 + Math.random() * 60,
          phase: Math.random() * Math.PI * 2
        });
    }
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  getBackgroundColors(y) {
    let t = 0;
    if (y < 0) y = 0;

    if (y < 50) {
      t = y / 50;
      // Ground to Lower Sky
      return {
        top: lerpColor('#4da6ff', '#1a75ff', t),
        bottom: lerpColor('#8B4513', '#4da6ff', t) // ground brown fades out
      };
    } else if (y < 150) {
      t = (y - 50) / 100;
      // Lower Sky to Space
      return {
        top: lerpColor('#1a75ff', '#000018', t),
        bottom: lerpColor('#4da6ff', '#05052a', t)
      };
    } else {
      // Deep Space
      t = Math.min(1, (y - 150) / 100);
      return {
        top: lerpColor('#000018', '#000000', t),
        bottom: lerpColor('#05052a', '#000000', t)
      };
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. Draw Background Gradient
    const bgColors = this.getBackgroundColors(this.player.cameraY);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, bgColors.top);
    grad.addColorStop(1, bgColors.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    
    // 1.5 Draw Wacky Background Objects
    this.drawBackgroundObjects(width, height);

    // Apply Screen Shake
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(sx, sy);
      this.shakeAmount *= 0.9; // Decay
      if (this.shakeAmount < 0.1) this.shakeAmount = 0;
    }

    // 2. Draw Parallax Backgrounds (Stars & Buildings)
    // Draw stars
    if (this.player.cameraY > 60) {
       const alpha = Math.min(1, (this.player.cameraY - 60) / 40);
       ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
       for(let star of this.stars) {
           const px = star.x * width;
           // CameraY goes up -> stars go down (py increases)
           let py = (star.y * height + (this.player.cameraY * star.speed * 15)) % height;
           ctx.beginPath();
           ctx.arc(px, py, star.size, 0, Math.PI*2);
           ctx.fill();
       }
    }

    // Draw buildings
    if (this.player.cameraY < 80) {
       const alpha = Math.max(0, 1 - (this.player.cameraY / 60));
       ctx.globalAlpha = alpha;
       for(let b of this.buildings) {
           const bx = b.x * width;
           const bw = b.width * width;
           const bh = b.height * height;
           
           // Based on cameraY, building moves down.
           const py = height - bh + (this.player.cameraY * 12); 
           ctx.fillStyle = b.color;
           ctx.fillRect(bx, py, bw, bh);
       }
       ctx.globalAlpha = 1.0;
    }

    // Camera calculations for Game World
    const centerX = width / 2;
    const baseY = height * 0.75;

    ctx.save();
    
    // Move origin so that camera follows player (with a little recoil)
    const offsetX = centerX - (this.player.visualX * this.STEP_WIDTH);
    const offsetY = baseY + (this.player.cameraY * this.STEP_HEIGHT) + this.cameraBump;
    ctx.translate(offsetX, offsetY);
    
    // Decay camera bump
    this.cameraBump *= 0.85;

    // Draw Stairs
    const visibleStairs = 25;
    const startIdx = Math.max(0, Math.floor(this.player.cameraY) - 5);
    const endIdx = startIdx + visibleStairs;

    for (let i = startIdx; i <= endIdx; i++) {
        const step = this.stairs.getStepInfo(i);
        this.drawStair(step.x, -step.y, i === this.player.score);
    }

    // Draw Player
    this.drawPlayer();

    this.drawParticles();
    this.drawShockwaves();
    this.drawFloatingTexts();

    // Draw Retired/Finished Overlay if player is dead
    if (this.player.isDead) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-offsetX - width, -offsetY - height, width * 3, height * 3); // Cover everything
      
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for UI text
      ctx.fillStyle = 'white';
      ctx.font = '900 40px Inter';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'black';
      ctx.fillText('FINISHED', width / 2, height / 2);
      ctx.restore();
    }

    ctx.restore();
  }

  spawnJuice(x, y, color) {
    // 1. Shake
    this.shakeAmount = 8;
    this.cameraBump = 15; // Recoil

    // 2. Shockwave
    this.shockwaves.push({ x, y, size: 10, max: 80, life: 1, color: "rgba(255,255,255,0.8)" });

    // 3. Floating Text (35% chance to be less overwhelming)
    if (Math.random() < 0.35) {
      const phrases = ["읏차", "호잇", "앗싸!", "호다닥", "끼익", "??", "우와아", "뿜", "지려따", "가즈아", "떡상", "왉!", "대박", "뭠마"];
      const text = phrases[Math.floor(Math.random() * phrases.length)];
      const colors = ["#fff", "#00f0ff", "#ff007b", "#fbff00", "#00ff11"];
      this.floatingTexts.push({ 
        x, 
        y: y - 60, 
        text: text, 
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1, 
        vy: -250 - Math.random() * 200, 
        rot: (Math.random() - 0.5) * 0.6
      });
    }
    
    // 4. Particles (handled in drawPlayer via landTimer check currently)
  }

  drawShockwaves() {
    const dt = 1/60;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt * 4;
      s.size += (s.max - s.size) * 0.2;
      
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      
      this.ctx.beginPath();
      this.ctx.strokeStyle = s.color.replace('0.8', (s.life * 0.8).toString());
      this.ctx.lineWidth = 4 * s.life;
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawFloatingTexts() {
    const dt = 1/60;
    this.ctx.textAlign = 'center';

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.life -= dt * 1.5; // Slightly slower fade
      f.y += f.vy * dt;
      
      if (f.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      this.ctx.rotate(f.rot);
      this.ctx.font = `900 ${30 + (1 - f.life) * 30}px "Inter", "Apple SD Gothic Neo", sans-serif`; 
      this.ctx.fillStyle = f.color;
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      this.ctx.globalAlpha = f.life;
      this.ctx.strokeText(f.text, 0, 0);
      this.ctx.fillText(f.text, 0, 0);
      this.ctx.restore();
    }
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200 - 100,
        life: 0.5,
        maxLife: 0.5,
        size: Math.random() * 4 + 2,
        color: color
      });
    }
  }

  drawParticles() {
    const dt = 1/60; // Approximate
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt; // Gravity
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawStair(gridX, gridY, isNext) {
    const px = gridX * this.STEP_WIDTH;
    const py = gridY * this.STEP_HEIGHT;
    
    // Base block
    this.ctx.fillStyle = isNext && !this.player.isDead ? "rgba(255, 255, 255, 0.15)" : this.stairColor;
    this.ctx.fillRect(px - this.STEP_WIDTH/2, py, this.STEP_WIDTH, this.STEP_HEIGHT);
    
    // Top highlight rim
    this.ctx.fillStyle = isNext && !this.player.isDead ? "rgba(255, 255, 255, 0.3)" : "#374151";
    this.ctx.fillRect(px - this.STEP_WIDTH/2, py, this.STEP_WIDTH, 5);

    // Dynamic glow for the path player has taken or is standing on
    if (this.player.y >= Math.abs(gridY)) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.pColor;
        this.ctx.fillStyle = this.pColor + '99';
        this.ctx.fillRect(px - this.STEP_WIDTH/2, py + this.STEP_HEIGHT - 6, this.STEP_WIDTH, 6);
        this.ctx.shadowBlur = 0;
    }
  }


  drawPlayer() {
    const px = this.player.visualX * this.STEP_WIDTH;
    const py = -this.player.visualY * this.STEP_HEIGHT; 
    
    // Trigger juice on landing
    if (this.player.didJustLand) {
       this.player.didJustLand = false;
       this.spawnParticles(px, py, this.pColor);
       this.spawnJuice(px, py, this.pColor);
    }

    // Trigger BIG juice on death
    if (this.player.didJustDie) {
       this.player.didJustDie = false;
       this.shakeAmount = 40; // Big shake
       this.spawnParticles(px, py, '#ff003c'); // Red sparks
       this.shockwaves.push({ x: px, y: py, size: 50, max: 300, life: 1, color: "rgba(255, 0, 0, 0.8)" });
    }

    const size = this.STEP_WIDTH * 0.7;
    const pType = this.player.characterType || 'BLOCK';
    const isBlinking = this.player.blinkTimer < 0.15;
    const time = Date.now();
    const dir = this.player.direction; // 1 or -1
    
    // Check if moving or just landed (jumping/stepping)
    const isMoving = this.player.visualX !== this.player.x || this.player.visualY !== this.player.y;

    // Draw wacky flailing arms if moving or jumping
    if (isMoving || this.player.landTimer > 0) {
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      const wave = Math.sin(time / 50) * 25;
      this.ctx.beginPath();
      // Left arm flail
      this.ctx.moveTo(px - size/2, py - size/2); 
      this.ctx.lineTo(px - size/2 - 25, py - size/2 + wave);
      // Right arm flail
      this.ctx.moveTo(px + size/2, py - size/2); 
      this.ctx.lineTo(px + size/2 + 25, py - size/2 - wave);
      this.ctx.stroke();
    }
    
    // Squash & Stretch calcs
    let scaleX = 1;
    let scaleY = 1;
    if (this.player.landTimer > 0) {
       const t = this.player.landTimer / 0.15;
       scaleY = 1 - Math.sin(t * Math.PI) * 0.3;
       scaleX = 1 + Math.sin(t * Math.PI) * 0.3;
    } else if (!this.player.isDead) {
       // Idle breathing
       const idle = Math.sin(Date.now() / 300) * 0.03;
       scaleY = 1 + idle;
       scaleX = 1 - idle;
    }

    this.ctx.save();
    this.ctx.translate(px, py);
    this.ctx.scale(scaleX, scaleY);
    this.ctx.translate(0, -size/2);

    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = this.pColor;
    this.ctx.fillStyle = this.pColor;
    
    // Death fall effect spin
    if (this.player.isDead) {
      if (pType !== 'SLIME') { 
        this.ctx.rotate((this.player.y - this.player.visualY) * 0.1);
      }
      this.ctx.globalAlpha = Math.max(0, 1 - (this.player.y - this.player.visualY - 1) * 0.5);
    } else {
      // Slight tilt while moving
      const tilt = (this.player.x - this.player.visualX) * 0.2;
      this.ctx.rotate(tilt);
    }

    // Derp effect: slightly offset eyes randomly
    this.eyeOffsetL = Math.sin(time / 200) * 4;
    this.eyeOffsetR = Math.cos(time / 250) * 4;

    if (pType === 'BLOCK') {
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.fillStyle = '#fff';
      if (!isBlinking) {
        // Derp eyes
        const faceX = dir * (size/4);
        this.ctx.fillRect(faceX - size/4 + this.eyeOffsetL, -size/4, size/2, size/6);
      }
    } else if (pType === 'SLIME') {
      this.ctx.beginPath();
      let sY = size;
      if (this.player.isDead) sY = size * 1.5;
      this.ctx.ellipse(0, Number(size/2 - sY/2), size/2, sY/2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      if (!isBlinking) {
        this.ctx.fillStyle = '#fff';
        // Face follows direction
        const faceX = dir * (size/4);
        this.ctx.beginPath();
        this.ctx.arc(faceX - size/8 + this.eyeOffsetL, -size/8, size/10, 0, Math.PI * 2);
        this.ctx.arc(faceX + size/8 + this.eyeOffsetR, -size/8, size/10, 0, Math.PI * 2);
        this.ctx.fill();
        // Crazy wide mouth
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(faceX, 0, 8 + Math.sin(time/50)*5, 0, Math.PI);
        this.ctx.stroke();
      }
    } else if (pType === 'NINJA') {
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(-size/2, -size/4, size, size/3);
      if (!isBlinking) {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect((dir * size/4) - size/5 + this.eyeOffsetL, -size/8, size/3, size/12);
      }
      // HELICOPTER 머리띠
      this.ctx.strokeStyle = '#111';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      const rotation = (time / 60);
      const waveX = Math.cos(rotation) * 50;
      const waveY = Math.sin(rotation) * 50;
      this.ctx.moveTo(-dir * size/2, -size/4);
      this.ctx.quadraticCurveTo(-dir * size, -size/2 + waveY, -dir * size - waveX, waveY);
      this.ctx.stroke();
    } else if (pType === 'ROBOT') {
      // Spring head pop
      const headPop = (this.player.landTimer > 0) ? -25 : (Math.sin(time/100) * 8);
      this.ctx.strokeStyle = '#666';
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size/2);
      this.ctx.lineTo(0, -size/2 + headPop);
      this.ctx.stroke();

      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size/2 + headPop);
      this.ctx.lineTo(Math.sin(time/200)*12, -size/1.3 + headPop);
      this.ctx.stroke();
      
      this.ctx.fillStyle = Math.sin(time/100) > 0 ? '#ff003c' : '#550011';
      this.ctx.beginPath();
      this.ctx.arc(Math.sin(time/200)*12, -size/1.3 + headPop, size/12, 0, Math.PI*2);
      this.ctx.fill();

      this.ctx.save();
      this.ctx.translate(0, headPop);
      this.ctx.fillStyle = this.pColor;
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(dir * size/8 - size/3, -size/6, size/1.5, size/3.5);
      if (!isBlinking) {
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        // Wacky emotion face
        const fx = dir * size/4;
        this.ctx.moveTo(fx - 10, -5); this.ctx.lineTo(fx, -20); this.ctx.lineTo(fx + 10, -5);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
    
    this.ctx.restore();
  }

  drawBackgroundObjects(width, height) {
    const dt = (Date.now() - this.lastBgTime) / 1000;
    this.lastBgTime = Date.now();

    // Random spawn new ones
    if (this.bgObjects.length < 15 && Math.random() < 0.01) {
        const types = ['CLOUD', 'SAUSAGE', 'SHOE', 'UFO'];
        this.bgObjects.push({
          x: Math.random() > 0.5 ? -200 : width + 200,
          y: Math.random() * height,
          type: types[Math.floor(Math.random() * types.length)],
          speed: 20 + Math.random() * 50,
          vx: Math.random() > 0.5 ? 1 : -1,
          size: 40 + Math.random() * 80,
          phase: Math.random() * Math.PI * 2
        });
    }

    for (let i = this.bgObjects.length - 1; i >= 0; i--) {
        const obj = this.bgObjects[i];
        obj.x += obj.vx * obj.speed * dt;
        obj.phase += dt;

        // Wrap or remove if far off-screen
        if (obj.x < -300 || obj.x > width + 300) {
            this.bgObjects.splice(i, 1);
            continue;
        }

        const hover = Math.sin(obj.phase) * 15;
        this.ctx.save();
        this.ctx.translate(obj.x, obj.y + hover);
        this.ctx.globalAlpha = 0.35; // Subtle but funny

        if (obj.type === 'CLOUD') {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, obj.size/2, 0, Math.PI*2);
            this.ctx.arc(obj.size/3, -obj.size/10, obj.size/2.5, 0, Math.PI*2);
            this.ctx.arc(-obj.size/3, -obj.size/10, obj.size/2.5, 0, Math.PI*2);
            this.ctx.fill();
            // Derp Face on Cloud
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-obj.size/8, -obj.size/6, 4, 4);
            this.ctx.fillRect(obj.size/8, -obj.size/6, 4, 4);
            this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 2;
            this.ctx.beginPath(); this.ctx.arc(0, 0, 5, 0, Math.PI); this.ctx.stroke();
        } else if (obj.type === 'SAUSAGE') {
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, obj.size/2, obj.size/4, 0, 0, Math.PI*2);
            this.ctx.fill();
            // Tiny wings
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath(); this.ctx.moveTo(-10, -5); this.ctx.lineTo(-25, -20); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.moveTo(10, -5); this.ctx.lineTo(25, -20); this.ctx.stroke();
        } else if (obj.type === 'SHOE') {
            this.ctx.fillStyle = '#6366f1';
            this.ctx.fillRect(-obj.size/3, -obj.size/6, obj.size/1.5, obj.size/3);
            this.ctx.fillRect(-obj.size/3, -obj.size/3, obj.size/3, obj.size/3); 
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath(); this.ctx.moveTo(0, -obj.size/6); this.ctx.lineTo(10, -obj.size/3); this.ctx.stroke(); 
        } else if (obj.type === 'UFO') {
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, obj.size/2, obj.size/5, 0, 0, Math.PI*2); this.ctx.fill();
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.beginPath();
            this.ctx.arc(0, -obj.size/10, obj.size/5, Math.PI, 0); this.ctx.fill();
        }
        this.ctx.restore();
    }
  }
}
