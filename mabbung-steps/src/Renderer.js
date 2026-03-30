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
    
    // Move origin so that camera follows player
    const offsetX = centerX - (this.player.visualX * this.STEP_WIDTH);
    const offsetY = baseY + (this.player.cameraY * this.STEP_HEIGHT);
    ctx.translate(offsetX, offsetY);

    // Draw Stairs
    const visibleStairs = 25;
    const startIdx = Math.max(0, Math.floor(this.player.cameraY) - 5);
    const endIdx = startIdx + visibleStairs;

    for (let i = startIdx; i <= endIdx; i++) {
        const step = this.stairs.getStepInfo(i);
        this.drawStair(step.x, -step.y, i === this.player.score);
        if (step.hasCoin && !this.player.isDead) { // Check hasCoin
            this.drawCoin(step.x, -step.y);
        }
    }

    // Draw Player
    this.drawPlayer();

    ctx.restore();
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

  drawCoin(gridX, gridY) {
    const px = gridX * this.STEP_WIDTH;
    const py = gridY * this.STEP_HEIGHT - this.STEP_HEIGHT/2;
    // Hover animation
    const bounce = Math.sin(Date.now() / 150) * 5;

    this.ctx.save();
    this.ctx.translate(px, py + bounce);
    
    // Coin glow
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillStyle = '#ffd700';
    
    // Coin shape
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner rim
    this.ctx.fillStyle = '#ffdf00';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawPlayer() {
    const px = this.player.visualX * this.STEP_WIDTH;
    const py = -this.player.visualY * this.STEP_HEIGHT; 
    
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = this.pColor;
    this.ctx.fillStyle = this.pColor;

    const size = this.STEP_WIDTH * 0.7;
    const dir = this.player.direction; // 1 or -1
    const pType = this.player.characterType || 'BLOCK';
    
    this.ctx.save();
    this.ctx.translate(px, py - size/2);
    
    // Death fall effect spin
    if (this.player.isDead) {
      if (pType !== 'SLIME') { // Slime doesn't spin, just stretches
        this.ctx.rotate((this.player.y - this.player.visualY) * 0.1);
      }
      this.ctx.globalAlpha = Math.max(0, 1 - (this.player.y - this.player.visualY - 1) * 0.5);
    }

    if (pType === 'BLOCK') {
      // BASE BLOCK
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.fillStyle = '#fff';
      this.ctx.shadowColor = '#ffffff';
      const faceOffset = dir * (size/4);
      this.ctx.fillRect(faceOffset - size/4, -size/4, size/2, size/6);

    } else if (pType === 'SLIME') {
      // SLIME
      this.ctx.beginPath();
      let stretchY = size;
      let stretchX = size;
      // Idle bounce or death stretch
      if (this.player.isDead) {
         stretchY = size * 1.5;
         stretchX = size * 0.7;
      }
      this.ctx.ellipse(0, Number(size/2 - stretchY/2), stretchX/2, stretchY/2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      // Eyes
      this.ctx.fillStyle = '#fff';
      this.ctx.shadowColor = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(dir * size/4 - size/8, -size/8, size/10, 0, Math.PI * 2);
      this.ctx.arc(dir * size/4 + size/8, -size/8, size/10, 0, Math.PI * 2);
      this.ctx.fill();

    } else if (pType === 'NINJA') {
      // NINJA
      this.ctx.fillRect(-size/2, -size/2, size, size);
      // Headband
      this.ctx.fillStyle = '#000';
      this.ctx.shadowBlur = 0;
      this.ctx.fillRect(-size/2, -size/4, size, size/4);
      // Eyes inside headband
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect((dir * size/4) - size/5, -size/4 + size/16, size/3, size/12);
      // Headband tails
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(-dir * size/2, -size/6);
      this.ctx.lineTo(-dir * size/1.2, -size/3);
      this.ctx.moveTo(-dir * size/2, -size/6);
      this.ctx.lineTo(-dir * size/1.4, Math.sin(Date.now()/100) * 5);
      this.ctx.stroke();

    } else if (pType === 'ROBOT') {
      // ROBOT
      // Draw Antenna
      this.ctx.strokeStyle = '#ccc';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size/2);
      this.ctx.lineTo(0, -size/1.2);
      this.ctx.stroke();
      // Antenna bulb
      this.ctx.fillStyle = '#ff003c';
      this.ctx.beginPath();
      this.ctx.arc(0, -size/1.2, size/10, 0, Math.PI*2);
      this.ctx.fill();
      // Body
      this.ctx.fillStyle = this.pColor;
      this.ctx.fillRect(-size/2, -size/2, size, size);
      // Screen/Eye
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(dir * size/8 - size/3, -size/6, size/1.5, size/3);
      // Glowing robot eye
      this.ctx.fillStyle = '#00f0ff';
      this.ctx.fillRect(dir * size/4 - size/8, -size/10, size/4, size/6);
    }
    
    this.ctx.restore();
  }
}
