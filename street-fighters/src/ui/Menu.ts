export type GameMode = 'PVP' | 'CPU' | 'TRAINING';
export type CharacterType = 'RYU' | 'CHUN_LI' | 'TERRY' | 'IORI' | 'GUILE' | 'MAI';
export type StageType = 'SUZAKU' | 'NEO_TOKYO' | 'SOUTH_TOWN';

export interface CharacterInfo {
  type: CharacterType;
  name: string;
  subtitle: string;
  gameOrigin: string;
  speed: number;
  power: number;
  specials: string[];
  superName: string;
  color: string;
}

export const CHARACTERS: CharacterInfo[] = [
  {
    type: 'RYU',
    name: 'RYU (류)',
    subtitle: '풍림화산 정통 무도가',
    gameOrigin: 'STREET FIGHTER',
    speed: 7,
    power: 8,
    specials: ['파동권: L / ↓↘→+공격', '승룡권: ↑+L / →↓↘+공격', '용권선풍각: ↓+L / ↓↙←+공격'],
    superName: '초필살기: 진공 파동권 (U 키)',
    color: '#ff5722'
  },
  {
    type: 'CHUN_LI',
    name: 'CHUN-LI (춘리)',
    subtitle: '화려한 격투 여제',
    gameOrigin: 'STREET FIGHTER',
    speed: 9,
    power: 7,
    specials: ['기공권: L / ↓↘→+공격', '스피닝 버드 킥: ↑+L', '백열각: ↓+L (연타 킥)'],
    superName: '초필살기: 기공장 (U 키)',
    color: '#00e5ff'
  },
  {
    type: 'TERRY',
    name: 'TERRY (테리)',
    subtitle: '전설의 늑대',
    gameOrigin: 'FATAL FURY / KOF',
    speed: 7,
    power: 9,
    specials: ['파워 웨이브: L / ↓↘→+공격', '번 너클: →+L / 돌진', '라이징 태클: ↑+L / 대공'],
    superName: '초필살기: 버스터 울프 (U 키)',
    color: '#ff9800'
  },
  {
    type: 'IORI',
    name: 'IORI (이오리)',
    subtitle: '보라색 불꽃의 야가미',
    gameOrigin: 'KOF',
    speed: 8,
    power: 8,
    specials: ['어둠쫓기: L / 지면 화염', '귀신태우기: ↑+L / 대공', '규화 (3연타): ↓+L'],
    superName: '초필살기: 금 1211식 팔치녀 (U 키)',
    color: '#d500f9'
  },
  {
    type: 'GUILE',
    name: 'GUILE (가일)',
    subtitle: '철벽의 군인',
    gameOrigin: 'STREET FIGHTER',
    speed: 6,
    power: 9,
    specials: ['소닉 붐: L / 진공파', '서머솔트 킥: ↑+L / 제비돌기', '로켓 태클: ↓+L'],
    superName: '초필살기: 서머솔트 익스플로전 (U 키)',
    color: '#76ff03'
  },
  {
    type: 'MAI',
    name: 'MAI (마이 / 닌자)',
    subtitle: '질풍의 쿠노이치',
    gameOrigin: 'KOF / FATAL FURY',
    speed: 10,
    power: 6,
    specials: ['화접선/표창: L / 원거리', '필살인봉: →+L / 불꽃 돌진', '비상용염진: ↑+L / 강하'],
    superName: '초필살기: 초필살 인봉 분신 난무 (U 키)',
    color: '#ff4081'
  }
];

export const STAGES: { type: StageType; name: string; subtitle: string }[] = [
  { type: 'SUZAKU', name: '주작성 도장 (Suzaku Castle)', subtitle: 'SF2 Ryu Stage - 풍림화산 & 석양' },
  { type: 'NEO_TOKYO', name: '네오 도쿄 시티 (Neo Tokyo)', subtitle: 'KOF \'98 Stage - 네온 스트리트' },
  { type: 'SOUTH_TOWN', name: '사우스타운 하이웨이 (South Town)', subtitle: 'Fatal Fury Stage - 야경 고속도로' }
];

export class MenuManager {
  public titleSelectedIndex = 0;
  public p1SelectedCharIndex = 0;
  public p2SelectedCharIndex = 1;
  public p1Confirmed = false;
  public p2Confirmed = false;

  public selectedStageIndex = 0;
  public cpuDifficultyIndex = 0; // 0: Easy, 1: Normal, 2: Hard
  public showGuide = false;
  public isPaused = false;
  public pauseSelectedIndex = 0;

  public readonly titleOptions = [
    { title: '2인 대전 모드 (1P vs 2P)', mode: 'PVP' as GameMode },
    { title: '싱글 플레이 (1P vs CPU)', mode: 'CPU' as GameMode },
    { title: '트레이닝 모드 (연습 모드)', mode: 'TRAINING' as GameMode },
    { title: '조작 방법 & 스킬 가이드', mode: null }
  ];

  public renderTitle(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Background Retro Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(0.4, '#1b003a');
    bgGrad.addColorStop(1, '#380026');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Neon Grid Perspective
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const y = 460 + i * 18;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Title Logo
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 24px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('⚡ CAPCOM vs SNK TRIBUTE ⚡', 640, 120);

    ctx.font = 'italic 900 82px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('STREET FIGHTERS', 644, 204);

    const titleGrad = ctx.createLinearGradient(0, 150, 0, 230);
    titleGrad.addColorStop(0, '#fff59d');
    titleGrad.addColorStop(0.3, '#ff9800');
    titleGrad.addColorStop(0.65, '#f44336');
    titleGrad.addColorStop(1, '#d500f9');

    ctx.fillStyle = titleGrad;
    ctx.fillText('STREET FIGHTERS', 640, 200);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeText('STREET FIGHTERS', 640, 200);

    ctx.font = 'bold 26px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('★ THE KING OF CLASH ★', 640, 260);

    // Menu Options
    const startY = 360;
    this.titleOptions.forEach((opt, idx) => {
      const isSelected = idx === this.titleSelectedIndex;
      const y = startY + idx * 64;

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(400, y - 26, 480, 52, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px "Impact", "Arial Black", sans-serif';
        ctx.fillText(`▶  ${opt.title}  ◀`, 640, y);
      } else {
        ctx.fillStyle = '#b0bec5';
        ctx.font = 'bold 24px "Impact", "Arial Black", sans-serif';
        ctx.fillText(opt.title, 640, y);
      }
    });

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#90a4ae';
    ctx.fillText('선택: W/S 또는 ↑/↓ | 결정: J / Enter / Space | 가이드: G', 640, 670);

    ctx.restore();
  }

  public renderCharSelect(ctx: CanvasRenderingContext2D, mode: GameMode): void {
    ctx.save();

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#0e0e1e');
    bgGrad.addColorStop(1, '#05050f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Header Title
    ctx.textAlign = 'center';
    ctx.font = 'italic 900 44px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('SELECT YOUR FIGHTER', 640, 50);

    // 2x3 Character Grid (6 Fighters)
    const cols = 3;
    const cardWidth = 350;
    const cardHeight = 240;
    const startX = 95;
    const startY = 85;

    CHARACTERS.forEach((char, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cardX = startX + col * (cardWidth + 25);
      const cardY = startY + row * (cardHeight + 18);

      const isP1Selected = this.p1SelectedCharIndex === idx;
      const isP2Selected = this.p2SelectedCharIndex === idx;

      // Background Card
      ctx.fillStyle = 'rgba(22, 22, 40, 0.9)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
      ctx.fill();

      // Border highlight
      if (isP1Selected && isP2Selected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5;
      } else if (isP1Selected) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 4;
      } else if (isP2Selected) {
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
      }
      ctx.stroke();

      // Player badges
      if (isP1Selected) {
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.roundRect(cardX + 10, cardY + 10, 55, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.p1Confirmed ? '1P OK' : '1P', cardX + 37, cardY + 27);
      }

      if (isP2Selected && mode === 'PVP') {
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.roundRect(cardX + cardWidth - 65, cardY + 10, 55, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.p2Confirmed ? '2P OK' : '2P', cardX + cardWidth - 37, cardY + 27);
      } else if (isP2Selected && mode === 'CPU') {
        ctx.fillStyle = '#ab47bc';
        ctx.beginPath();
        ctx.roundRect(cardX + cardWidth - 65, cardY + 10, 55, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CPU', cardX + cardWidth - 37, cardY + 27);
      }

      // Origin Tag & Name
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#80deea';
      ctx.fillText(char.gameOrigin, cardX + 75, cardY + 25);

      ctx.font = 'italic 900 24px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = char.color;
      ctx.fillText(char.name, cardX + 15, cardY + 58);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#b0bec5';
      ctx.fillText(char.subtitle, cardX + 15, cardY + 80);

      // Specials list
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('기술:', cardX + 15, cardY + 106);

      ctx.fillStyle = '#eceff1';
      ctx.font = '12px sans-serif';
      char.specials.forEach((sp, sIdx) => {
        ctx.fillText(`• ${sp}`, cardX + 15, cardY + 126 + sIdx * 18);
      });

      // Super
      ctx.fillStyle = '#ff4081';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`★ ${char.superName}`, cardX + 15, cardY + 215);
    });

    // Stage & CPU Settings footer bar
    const footY = 620;
    ctx.textAlign = 'center';

    if (mode === 'CPU') {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#ffd700';
      const diffs = ['쉬움 (Easy - 아들 추천)', '보통 (Normal - 표준)', '어려움 (Hard - 아빠 도전)'];
      ctx.fillText(`CPU 난이도: [ ${diffs[this.cpuDifficultyIndex]} ] (↑/↓ 키로 변경)`, 420, footY);
    }

    // Stage Selector
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#00e5ff';
    const curStage = STAGES[this.selectedStageIndex];
    ctx.fillText(`스테이지: [ ${curStage.name} ] (스테이지 변경: T 키)`, mode === 'CPU' ? 880 : 640, footY);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#b0bec5';
    ctx.fillText('1P 선택: W/A/S/D + F (또는 J)  ||  2P 선택: 방향키 + I (또는 Enter)  ||  뒤로가기: ESC', 640, 680);

    ctx.restore();
  }

  public renderGuideModal(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 1280, 720);

    const boxX = 120;
    const boxY = 45;
    const boxW = 1040;
    const boxH = 630;

    ctx.fillStyle = '#161628';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'italic 900 34px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('🎮 STREET FIGHTER & KOF 격투 완벽 가이드', 640, 95);

    const col1X = boxX + 50;
    const col2X = boxX + 540;
    const contentY = 140;

    // --- 1P Section ---
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('1P 조작키 (키보드 좌측 / 패드 1)', col1X, contentY);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffffff';
    const p1Controls = [
      '• 이동 / 점프 / 앉기 :  W / A / S / D',
      '• 약공격 (Punch) :  F  (보조: J)',
      '• 강공격 (Kick) :  G  (보조: K)',
      '• 필살기 1 (장풍/스킬) :  H  (보조: L)',
      '• 필살기 2 (대공/승룡) :  ↑ + H  (또는 ↑+L)',
      '• 필살기 3 (돌진/특수) :  ↓ + H  (또는 ↓+L)',
      '• KOF 구르기 회피 :  Space + A(뒤) 또는 D(앞)',
      '• 초필살기 (게이지 1칸↑) :  R  (보조: U)'
    ];
    p1Controls.forEach((c, i) => {
      ctx.fillText(c, col1X, contentY + 28 + i * 23);
    });

    // --- 2P Section ---
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('2P 조작키 (키보드 우측 / 텐키리스 완벽 대응)', col2X, contentY);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffffff';
    const p2Controls = [
      '• 이동 / 점프 / 앉기 :  방향키 (↑ / ← / ↓ / →)',
      '• 약공격 (Punch) :  I  (보조: 8 / 1번)',
      '• 강공격 (Kick) :  O  (보조: 9 / 2번)',
      '• 필살기 1 (장풍/스킬) :  P  (보조: 0 / 3번)',
      '• 필살기 2 (대공/승룡) :  ↑ + P',
      '• 필살기 3 (돌진/특수) :  ↓ + P',
      '• KOF 구르기 회피 :  Enter + ←(뒤) 또는 →(앞)',
      '• 초필살기 (게이지 1칸↑) :  [  (보조: - / 4번)'
    ];
    p2Controls.forEach((c, i) => {
      ctx.fillText(c, col2X, contentY + 28 + i * 23);
    });

    // --- SF / KOF Special Mechanics ---
    const tipsY = contentY + 230;
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('⚡ 핵심 격투 시스템 (KOF & Street Fighter)', col1X, tipsY);

    ctx.fillStyle = '#cfd8dc';
    ctx.font = '13.5px sans-serif';
    const tips = [
      '1. [KOF 긴급회피/구르기]: 가드 버튼과 앞/뒤 방향키를 누르면 무적으로 상대 공격/장풍을 뚫고 지나가 배후를 잡습니다!',
      '2. [가드 크래시]: 계속 가드만 올리면 가드 게이지가 닳아 방어가 깨지고 무방비 상태가 됩니다.',
      '3. [캔슬 체인 콤보]: 약공격 적중 즉시 강공격이나 필살기, 초필살기(U)를 누르면 부드럽게 연속기가 들어갑니다.',
      '4. [정통 아케이드 커맨드]: ↓↘→ + 공격 (파동권/장풍), →↓↘ + 공격 (승룡권), ↓↙← + 공격 (용권선풍각/규화) 완벽 지원!'
    ];
    tips.forEach((t, i) => {
      ctx.fillText(t, col1X, tipsY + 26 + i * 22);
    });

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('닫기: ESC 또는 Space / Enter 키를 누르세요', 640, boxY + boxH - 22);

    ctx.restore();
  }

  public renderPause(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.textAlign = 'center';
    ctx.font = 'italic 900 64px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('PAUSED', 640, 240);

    const pauseOptions = ['계속하기 (Resume)', '라운드 다시 시작 (Restart)', '캐릭터 선택으로 (Select Character)', '타이틀로 돌아가기 (Title)'];
    pauseOptions.forEach((opt, idx) => {
      const isSelected = idx === this.pauseSelectedIndex;
      const y = 340 + idx * 55;

      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(380, y - 28, 520, 50, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 26px "Impact", "Arial Black", sans-serif';
        ctx.fillText(`▶  ${opt}  ◀`, 640, y);
      } else {
        ctx.fillStyle = '#b0bec5';
        ctx.font = 'bold 22px "Impact", "Arial Black", sans-serif';
        ctx.fillText(opt, 640, y);
      }
    });

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#80deea';
    ctx.fillText('선택: W/S 또는 ↑/↓ | 결정: F / J / I / Space / Enter | 재개: ESC', 640, 585);

    ctx.restore();
  }
}
