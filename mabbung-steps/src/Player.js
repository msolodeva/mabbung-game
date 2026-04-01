export class Player {
  constructor(id, startDirection, stairs, characterType, soundManager) {
    this.id = id;
    this.stairs = stairs;
    this.characterType = characterType || 'BLOCK';
    this.soundManager = soundManager;
    this.reset(startDirection);
  }

  reset(startDirection) {
    this.y = 0; 
    this.x = 0; 
    this.direction = startDirection; 
    this.score = 0;
    this.isDead = false;
    this.didJustDie = false;
    this.didJustLand = false;
    this.timer = 100;
    this.maxTimer = 100;
    
    // Visual state for animations
    this.landTimer = 0;
    this.blinkTimer = Math.random() * 3 + 2; // Random blink every 2-5s
    
    // For smooth visual rendering
    this.visualX = 0;
    this.visualY = 0;
    this.cameraY = 0;
    this.fallVelocity = 0;
  }

  update(dt) {
    if (this.isDead) {
      if (this.visualY > -((this.y || 0) + 10)) { // limit fall distance roughly
        this.fallVelocity += 50 * dt; 
        this.visualY -= this.fallVelocity * dt;
      }
      return;
    }

    const depleteRate = 5 + (this.score * 0.15); 
    if (this.score > 0) { 
      this.timer -= depleteRate * dt;
    }

    if (this.timer <= 0) {
        this.timer = 0;
        this.failStep(); 
    }

    if (this.landTimer > 0) {
        this.landTimer -= dt;
    }
    
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
        this.blinkTimer = Math.random() * 3 + 2; 
    }

    const targetCameraY = this.y;
    this.cameraY += (targetCameraY - this.cameraY) * 15 * dt;
    this.visualX += (this.x - this.visualX) * 25 * dt;
    this.visualY += (this.y - this.visualY) * 25 * dt;
  }

  step(action) {
    if (this.isDead) return;

    const currentStep = this.stairs.getStepInfo(this.y);
    const nextStep = this.stairs.getStepInfo(this.y + 1);
    
    const stairDirection = nextStep.x - currentStep.x; 

    if (action === 'climb') {
      if (this.direction === stairDirection) {
        if (this.soundManager) this.soundManager.playStep();
        this.successStep(nextStep);
      } else {
        this.failStep();
      }
    } else if (action === 'turn') {
      this.direction *= -1;
      if (this.direction === stairDirection) {
        if (this.soundManager) this.soundManager.playTurn();
        this.successStep(nextStep);
      } else {
        this.failStep();
      }
    }
  }

  successStep(stairParam) {
    this.y += 1;
    this.x += this.direction;
    this.score += 1;
    this.landTimer = 0.15; // Trigger Squash & Stretch
    this.didJustLand = true; 
    
    const refill = 15 - Math.min(10, this.score * 0.05); 
    this.timer = Math.min(this.maxTimer, this.timer + refill);
  }

  failStep() {
    if (this.soundManager) this.soundManager.playDeath();
    this.isDead = true;
    this.didJustDie = true;
    this.fallVelocity = 5; 
  }
}
