import { titleScreen, selectScreen } from './Presentation';
export type GameMode = 'PVP' | 'CPU' | 'TRAINING';
export type CharacterType = 'RYU' | 'CHUN_LI' | 'CAMMY' | 'ZANGIEF' | 'DHALSIM' | 'BLANKA';
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
    type: 'CAMMY', name: 'CAMMY (캐미)', subtitle: '빠른 돌진 · 근접 압박',
    gameOrigin: 'STREET FIGHTER', speed: 10, power: 6,
    specials: ['스파이럴 애로: H / ↓↘→+공격', '캐논 스파이크: ↑+H', '훌리건 킥: ↓+H'],
    superName: '초필살기: 스핀 드라이브 (R)', color: '#66dfb0'
  },
  {
    type: 'ZANGIEF', name: 'ZANGIEF (장기에프)', subtitle: '강력한 잡기 · 묵직한 한 방',
    gameOrigin: 'STREET FIGHTER', speed: 4, power: 10,
    specials: ['스크류 파일드라이버: H / 근접 잡기', '라이징 해머: ↑+H', '더블 래리어트: ↓+H'],
    superName: '초필살기: 파이널 아토믹 버스터 (R)', color: '#ef7562'
  },
  {
    type: 'DHALSIM', name: 'DHALSIM (달심)', subtitle: '늘어나는 팔다리 · 원거리 견제',
    gameOrigin: 'STREET FIGHTER', speed: 3, power: 7,
    specials: ['요가 파이어: H / ↓↘→+공격', '요가 라이즈: ↑+H', '요가 플레임: ↓+H'],
    superName: '초필살기: 요가 인페르노 (R)', color: '#ffbc66'
  },
  {
    type: 'BLANKA', name: 'BLANKA (블랑카)', subtitle: '전기 연속타 · 야성적인 롤링',
    gameOrigin: 'STREET FIGHTER', speed: 8, power: 8,
    specials: ['일렉트릭 썬더: H / 근거리 전기', '버티컬 롤링: ↑+H', '롤링 어택: ↓+H'],
    superName: '초필살기: 그라운드 셰이브 롤 (R)', color: '#c2ee69'
  }
];

export const STAGES: { type: StageType; name: string; subtitle: string }[] = [
  { type: 'SUZAKU', name: '주작성 도장 (Suzaku Castle)', subtitle: '석양 도장 · 바람과 종소리' },
  { type: 'NEO_TOKYO', name: '네오 도쿄 시티 (Neo Tokyo)', subtitle: '네온 거리 · 빗소리와 신스' },
  { type: 'SOUTH_TOWN', name: '사우스타운 하이웨이 (South Town)', subtitle: '해안 고속도로 · 베이스와 드럼' }
];

export class MenuManager {
  public titleSelectedIndex = 0;
  public p1SelectedCharIndex = 0;
  public p2SelectedCharIndex = 1;
  public p1Confirmed = false;
  public p2Confirmed = false;

  public selectedStageIndex = 0;
  public stageAutomatic = true;
  public cpuDifficultyIndex = 1; // 0: Easy, 1: Normal, 2: Hard
  public showGuide = false;
  public isPaused = false;
  public pauseSelectedIndex = 0;

  public readonly titleOptions = [
    { title: '2인 대전 모드 (1P vs 2P)', mode: 'PVP' as GameMode },
    { title: '싱글 플레이 (1P vs CPU)', mode: 'CPU' as GameMode },
    { title: '트레이닝 모드 (연습 모드)', mode: 'TRAINING' as GameMode },
    { title: '조작 방법 & 스킬 가이드', mode: null }
  ];

  public renderTitle(ctx:CanvasRenderingContext2D):void { titleScreen(ctx,this); }
  public renderCharSelect(ctx:CanvasRenderingContext2D,mode:GameMode):void { selectScreen(ctx,this,mode); }

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
      '• 가드 : Space / 뒤로 유지  |  잡기 : F + G',
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
      '• 가드 : Enter / 뒤로 유지  |  잡기 : I + O',
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
      '1. [방어와 잡기]: 뒤로 유지하거나 가드 버튼을 누르세요. 하단은 앉아서, 점프 공격은 서서 방어합니다. 잡기는 가드를 뚫습니다.',
      '2. [가드 브레이크]: 가드 게이지가 바닥나면 방어가 깨집니다. 일반 장풍은 막으면 체력이 줄지 않습니다.',
      '3. [캔슬 콤보]: 약공격이 적중했을 때 강공격·필살기로 연결하세요. 막거나 피한 뒤에는 반격할 틈이 생깁니다.',
      '4. [패드]: 십자키 이동 / A·X 약공격 / B·Y 강공격 / RB 필살기 / RT 초필살기 / LB 가드',
      '5. [연습]: F4 위치 초기화 / F6 더미 행동 / F7 정지 / F8 한 프레임 / F2 판정 표시'
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
