import { Fighter } from '../entities/Fighter';

export interface AnnouncerState {
  text: string;
  subText?: string;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class HUD {
  private p1RedHp = 1000;
  private p2RedHp = 1000;
  public announcer: AnnouncerState | null = null;

  public update(p1: Fighter, p2: Fighter): void {
    // Red HP drain animation
    if (this.p1RedHp > p1.hp) {
      this.p1RedHp -= Math.max(1.5, (this.p1RedHp - p1.hp) * 0.08);
    } else {
      this.p1RedHp = p1.hp;
    }

    if (this.p2RedHp > p2.hp) {
      this.p2RedHp -= Math.max(1.5, (this.p2RedHp - p2.hp) * 0.08);
    } else {
      this.p2RedHp = p2.hp;
    }

    // Announcer animation
    if (this.announcer) {
      this.announcer.life++;
      if (this.announcer.life < 12) {
        this.announcer.scale = 1.6 - (this.announcer.life / 12) * 0.6;
        this.announcer.alpha = Math.min(1, this.announcer.life / 6);
      } else if (this.announcer.life > this.announcer.maxLife - 15) {
        this.announcer.alpha = (this.announcer.maxLife - this.announcer.life) / 15;
      } else {
        this.announcer.scale = 1.0;
        this.announcer.alpha = 1.0;
      }

      if (this.announcer.life >= this.announcer.maxLife) {
        this.announcer = null;
      }
    }
  }

  public setAnnouncement(text: string, subText = '', duration = 80): void {
    this.announcer = {
      text,
      subText,
      scale: 1.8,
      alpha: 0,
      life: 0,
      maxLife: duration
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    p1: Fighter,
    p2: Fighter,
    roundTimer: number,
    currentRound: number
  ): void {
    ctx.save();

    const barWidth = 460;
    const barHeight = 28;
    const topY = 35;

    // --- 1P HEALTH BAR ---
    const p1HpRatio = Math.max(0, p1.hp / p1.maxHp);
    const p1RedRatio = Math.max(0, this.p1RedHp / p1.maxHp);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(80, topY, barWidth, barHeight);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, topY, barWidth, barHeight);

    // Red trailing damage
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(80 + (1 - p1RedRatio) * barWidth, topY, p1RedRatio * barWidth, barHeight);

    // Green/Yellow main health
    const p1Grad = ctx.createLinearGradient(80, topY, 80 + barWidth, topY);
    p1Grad.addColorStop(0, '#76ff03');
    p1Grad.addColorStop(0.7, '#ffea00');
    p1Grad.addColorStop(1, '#ff9100');
    ctx.fillStyle = p1Grad;
    ctx.fillRect(80 + (1 - p1HpRatio) * barWidth, topY, p1HpRatio * barWidth, barHeight);

    // 1P Guard Gauge Bar (Under HP bar)
    const p1GuardRatio = p1.guardGauge / p1.maxGuardGauge;
    const guardBarHeight = 8;
    const guardY = topY + barHeight + 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(80, guardY, barWidth, guardBarHeight);
    ctx.fillStyle = p1GuardRatio < 0.25 && Math.floor(Date.now() / 150) % 2 === 0 ? '#ff1744' : '#00e5ff';
    ctx.fillRect(80 + (1 - p1GuardRatio) * barWidth, guardY, p1GuardRatio * barWidth, guardBarHeight);

    // P1 Portrait & Name
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(30, topY - 8, 48, 48);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, topY - 8, 48, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1P', 54, topY + 24);

    ctx.textAlign = 'left';
    ctx.font = 'bold 24px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(p1.name, 85, topY - 8);

    // 1P Round Wins (Golden V Stars)
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < p1.wins ? '#ffd700' : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(85 + i * 26, guardY + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // --- 2P HEALTH BAR ---
    const p2HpRatio = Math.max(0, p2.hp / p2.maxHp);
    const p2RedRatio = Math.max(0, this.p2RedHp / p2.maxHp);
    const p2StartX = 1280 - 80 - barWidth;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(p2StartX, topY, barWidth, barHeight);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.strokeRect(p2StartX, topY, barWidth, barHeight);

    // Red trailing damage
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(p2StartX, topY, p2RedRatio * barWidth, barHeight);

    // Green/Yellow main health
    const p2Grad = ctx.createLinearGradient(p2StartX, topY, p2StartX + barWidth, topY);
    p2Grad.addColorStop(0, '#ff9100');
    p2Grad.addColorStop(0.3, '#ffea00');
    p2Grad.addColorStop(1, '#76ff03');
    ctx.fillStyle = p2Grad;
    ctx.fillRect(p2StartX, topY, p2HpRatio * barWidth, barHeight);

    // 2P Guard Gauge Bar
    const p2GuardRatio = p2.guardGauge / p2.maxGuardGauge;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(p2StartX, guardY, barWidth, guardBarHeight);
    ctx.fillStyle = p2GuardRatio < 0.25 && Math.floor(Date.now() / 150) % 2 === 0 ? '#ff1744' : '#00e5ff';
    ctx.fillRect(p2StartX, guardY, p2GuardRatio * barWidth, guardBarHeight);

    // 2P Portrait & Name
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(1280 - 78, topY - 8, 48, 48);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(1280 - 78, topY - 8, 48, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2P', 1280 - 54, topY + 24);

    ctx.textAlign = 'right';
    ctx.font = 'bold 24px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(p2.name, 1280 - 85, topY - 8);

    // 2P Round Wins
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < p2.wins ? '#ffd700' : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(1280 - 85 - i * 26, guardY + 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // --- CENTER TIMER ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.arc(640, topY + 14, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = roundTimer <= 15 && Math.floor(Date.now() / 200) % 2 === 0 ? '#ff1744' : '#ffffff';
    ctx.fillText(roundTimer.toString().padStart(2, '0'), 640, topY + 16);

    // --- SUPER GAUGES (Bottom Left & Right) ---
    const superY = 675;
    const superWidth = 320;
    const superHeight = 22;

    // 1P Super Meter
    const p1SuperRatio = p1.superMeter / p1.maxSuperMeter;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(80, superY, superWidth, superHeight);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, superY, superWidth, superHeight);

    const p1MeterGrad = ctx.createLinearGradient(80, superY, 80 + superWidth, superY);
    p1MeterGrad.addColorStop(0, '#00b0ff');
    p1MeterGrad.addColorStop(0.6, '#00e5ff');
    p1MeterGrad.addColorStop(1, '#ffea00');
    ctx.fillStyle = p1MeterGrad;
    ctx.fillRect(80, superY, p1SuperRatio * superWidth, superHeight);

    // Segment lines (3 bars)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80 + superWidth / 3, superY);
    ctx.lineTo(80 + superWidth / 3, superY + superHeight);
    ctx.moveTo(80 + (superWidth * 2) / 3, superY);
    ctx.lineTo(80 + (superWidth * 2) / 3, superY + superHeight);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    const p1Level = Math.floor(p1.superMeter / 100);
    ctx.fillText(p1.superMeter >= 300 ? 'SUPER MAX!' : `POWER Lv.${p1Level}`, 80, superY - 6);

    // 2P Super Meter
    const p2SuperRatio = p2.superMeter / p2.maxSuperMeter;
    const p2SuperX = 1280 - 80 - superWidth;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(p2SuperX, superY, superWidth, superHeight);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(p2SuperX, superY, superWidth, superHeight);

    const p2MeterGrad = ctx.createLinearGradient(p2SuperX, superY, p2SuperX + superWidth, superY);
    p2MeterGrad.addColorStop(0, '#ffea00');
    p2MeterGrad.addColorStop(0.4, '#00e5ff');
    p2MeterGrad.addColorStop(1, '#00b0ff');
    ctx.fillStyle = p2MeterGrad;
    ctx.fillRect(p2SuperX + (1 - p2SuperRatio) * superWidth, superY, p2SuperRatio * superWidth, superHeight);

    ctx.beginPath();
    ctx.moveTo(p2SuperX + superWidth / 3, superY);
    ctx.lineTo(p2SuperX + superWidth / 3, superY + superHeight);
    ctx.moveTo(p2SuperX + (superWidth * 2) / 3, superY);
    ctx.lineTo(p2SuperX + (superWidth * 2) / 3, superY + superHeight);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    const p2Level = Math.floor(p2.superMeter / 100);
    ctx.fillText(p2.superMeter >= 300 ? 'SUPER MAX!' : `POWER Lv.${p2Level}`, 1280 - 80, superY - 6);

    // --- COMBO COUNTERS ---
    if (p1.comboHits >= 2) {
      ctx.save();
      ctx.textAlign = 'left';
      ctx.font = 'italic bold 46px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#ff1744';
      ctx.fillText(`${p1.comboHits} HITS!`, 80, 185);
      ctx.font = 'bold 20px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(p1.comboHits >= 5 ? 'AWESOME COMBO!!' : 'GREAT!', 80, 215);
      ctx.restore();
    }

    if (p2.comboHits >= 2) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = 'italic bold 46px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#ff1744';
      ctx.fillText(`${p2.comboHits} HITS!`, 1200, 185);
      ctx.font = 'bold 20px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(p2.comboHits >= 5 ? 'AWESOME COMBO!!' : 'GREAT!', 1200, 215);
      ctx.restore();
    }

    // --- ANNOUNCER OVERLAY ---
    if (this.announcer) {
      ctx.save();
      ctx.translate(640, 360);
      ctx.scale(this.announcer.scale, this.announcer.scale);
      ctx.globalAlpha = this.announcer.alpha;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = 'italic 900 84px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(this.announcer.text, 5, 5);

      const textGrad = ctx.createLinearGradient(0, -40, 0, 40);
      textGrad.addColorStop(0, '#fff176');
      textGrad.addColorStop(0.5, '#ff9800');
      textGrad.addColorStop(1, '#d50000');

      ctx.fillStyle = textGrad;
      ctx.fillText(this.announcer.text, 0, 0);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeText(this.announcer.text, 0, 0);

      if (this.announcer.subText) {
        ctx.font = 'bold 36px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.announcer.subText, 0, 65);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
