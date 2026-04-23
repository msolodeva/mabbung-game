// ========================================
// BRAWL ARENA - GAME CONSTANTS
// ========================================

export const GAME_CONFIG = {
    CANVAS_WIDTH: 1400,
    CANVAS_HEIGHT: 900,
    TILE_SIZE: 50, // Increased tile size for better detail
    FPS: 60,
    MATCH_DURATION: 300, // 5 minutes
    WIN_GEM_COUNT: 5, // Now only 3 gems needed!
    WIN_COUNTDOWN: 40,
    RESPAWN_TIME: 3000,
};

export const TEAMS = {
    BLUE: 'blue',
    RED: 'red',
};

export const GAME_STATES = {
    LOBBY: 'lobby',
    PLAYING: 'playing',
    PAUSED: 'paused',
    COUNTDOWN: 'countdown',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
};

export const TILE_TYPES = {
    GROUND: 0,
    WALL: 1,
    BUSH: 2,
    DESTRUCTIBLE: 3,
    SPAWN_BLUE: 4,
    SPAWN_RED: 5,
    GEM_SPAWN: 6,
    WATER: 7,
};

export const COLORS = {
    GROUND: '#5c8a2e',
    GROUND_DARK: '#4e7a24',
    GROUND_DETAIL: '#6ead36',
    FLOWER_YELLOW: '#f1c40f',
    FLOWER_RED: '#e74c3c',

    WALL: '#6d5545',
    WALL_TOP: '#8d735b',
    WALL_EDGE: '#a68a71',
    WALL_SHADOW: 'rgba(0, 0, 0, 0.3)',

    BUSH: '#2d5016',
    BUSH_DARK: '#1a320d',
    BUSH_GLOW: '#3d6b1e',

    DESTRUCTIBLE: '#a68b6d',
    DESTRUCTIBLE_TOP: '#c5ae95',

    WATER: '#3498db',
    WATER_DARK: '#2980b9',
    WATER_SHALLOW: '#5dade2',

    BLUE_TEAM: '#4a90d9',
    RED_TEAM: '#e74c3c',

    HEALTH_GREEN: '#2ecc71',
    HEALTH_YELLOW: '#f1c40f',
    HEALTH_RED: '#e74c3c',

    GEM: '#9b59b6',
    GEM_GLOW: '#bb8fce',

    SUPER_GOLD: '#ffd700',
    SHADOW: 'rgba(0, 0, 0, 0.25)',
};

// ========================================
// BRAWLER BALANCE SYSTEM
// ========================================
// 5 Brawlers with Rock-Paper-Scissors style counters:
//
//   Counter Chain:
//   Shelly → Poco → Nita → Colt → Shelly
//           ↘     ↙
//            Spike (Area Control - situational)
//
// Detailed Counter Relationships:
// - Shelly beats Poco & Spike (burst damage > sustain/control)
// - Colt beats Shelly & Spike (range advantage)
// - Nita beats Colt (tanks damage, closes gap with bear)
// - Poco beats Nita (outsustains with heals)
// - Spike is situational (good vs grouped, weak vs burst)
// ========================================

export const BRAWLERS = {
    // =====================================
    // SHELLY - Close Range Fighter (Burst DPS)
    // =====================================
    // ✅ STRONG vs: Poco (bursts before heal), Spike (closes gap fast)
    // ❌ WEAK vs: Colt (can't reach him)
    // =====================================
    SHELLY: {
        id: 'shelly',
        name: 'Shelly',
        role: 'FIGHTER',
        emoji: '🔫',
        color: '#9b59b6',
        health: 3800,
        speed: 280,
        attackDamage: 300,
        attackProjectiles: 5,
        attackSpread: 0.5,
        attackRange: 260,
        attackSpeed: 600,
        ammoMax: 3,
        ammoReloadTime: 1500,
        superCharge: 6,        // 6 히트로 충전
        superDamage: 320,
        superKnockback: 400,
        description: '근접 버스트 딜러 - 다가가면 끝장낸다',
        superDescription: '💥 슈퍼 셸: 강력한 산탄으로 적을 밀어냄',
    },

    // =====================================
    // NITA - Tank (High HP + Homing Missile)
    // =====================================
    // ✅ STRONG vs: Colt (absorbs damage, missile tracks)
    // ❌ WEAK vs: Poco (can't kill through heals)
    // =====================================
    NITA: {
        id: 'nita',
        name: 'Nita',
        role: 'TANK',
        emoji: '🚀',
        color: '#e74c3c',
        health: 5000,
        speed: 250,
        attackDamage: 1000,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 350,
        attackSpeed: 900,
        ammoMax: 3,
        ammoReloadTime: 1200,
        superCharge: 6,        // 6 히트로 충전
        superDamage: 1200,
        description: '불굴의 탱커 - 유도 미사일로 도망치는 적을 추적한다',
        superDescription: '🚀 유도 미사일: 가장 가까운 적을 자동으로 추적하는 미사일 발사',
    },

    // =====================================
    // COLT - Marksman (Long Range DPS)
    // =====================================
    // ✅ STRONG vs: Shelly (kites easily), Spike (outranges)
    // ❌ WEAK vs: Nita (can't kill fast enough, gets overrun)
    // =====================================
    COLT: {
        id: 'colt',
        name: 'Colt',
        role: 'MARKSMAN',
        emoji: '🤠',
        color: '#4a90d9',
        health: 2600,
        speed: 290,
        attackDamage: 360,
        attackProjectiles: 6,
        attackSpread: 0.05,
        attackRange: 550,
        attackSpeed: 500,
        ammoMax: 3,
        ammoReloadTime: 1600,
        superCharge: 12,       // 12 히트로 충전 (느림)
        superDamage: 320,
        description: '장거리 저격수 - 거리를 유지하라',
        superDescription: '🔥 불릿 스톰: 관통하는 12발의 총알을 연사',
    },

    // =====================================
    // POCO - Support (Healer)
    // =====================================
    // ✅ STRONG vs: Nita (outheals damage, bear included)
    // ❌ WEAK vs: Shelly (burst > heal), Colt (DPS > heal rate)
    // =====================================
    POCO: {
        id: 'poco',
        name: 'Poco',
        role: 'SUPPORT',
        emoji: '🎸',
        color: '#2ecc71',
        health: 3600,
        speed: 260,
        attackDamage: 700,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 420,
        attackSpeed: 1000,
        attackWidth: 200,
        ammoMax: 3,
        ammoReloadTime: 1300,
        superCharge: 5,        // 5 히트로 빠른 충전 (힐러)
        superHeal: 2400,
        superRadius: 400,
        description: '치유의 음악가 - 팀을 살린다',
        superDescription: '💚 치유의 멜로디: 주변 모든 아군을 대량 회복',
    },

    // =====================================
    // SPIKE - Controller (Area Denial)
    // =====================================
    // ✅ STRONG vs: Grouped enemies, slow brawlers (Nita, Poco)
    // ❌ WEAK vs: Shelly (burst), Colt (outranges and kites)
    // =====================================
    SPIKE: {
        id: 'spike',
        name: 'Spike',
        role: 'CONTROLLER',
        emoji: '🌵',
        color: '#27ae60',
        health: 2600,
        speed: 250,
        attackDamage: 560,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 450,
        attackSpeed: 800,
        explodeSpikes: 6,
        explodeSpikeDamage: 280,
        ammoMax: 3,
        ammoReloadTime: 1800,
        superCharge: 10,       // 10 히트로 충전
        superRadius: 250,
        superSlowDuration: 4000,
        superDamagePerSecond: 400,
        description: '지역 장악 전문가 - 발 밑을 조심해',
        superDescription: '🌵 가시 덫: 지속 피해와 슬로우를 주는 가시밭 생성',
    },

    // =====================================
    // MORTIS - Assassin (Dash Melee)
    // =====================================
    // ✅ STRONG vs: Poco (burst kills before heal), Colt (closes gap instantly)
    // ❌ WEAK vs: Shelly (burst at close range), Nita (tanks too much)
    // =====================================
    MORTIS: {
        id: 'mortis',
        name: 'Mortis',
        role: 'ASSASSIN',
        emoji: '⚰️',
        color: '#7d3c98',
        health: 3200,
        speed: 320,
        attackDamage: 900,
        attackProjectiles: 0,
        attackSpread: 0,
        attackRange: 180,
        attackSpeed: 400,
        dashSpeed: 1200,
        dashDuration: 150,
        dashDamageRadius: 60,
        ammoMax: 3,
        ammoReloadTime: 2000,
        superCharge: 5,
        superDamage: 1000,
        superHealPercent: 1.0,
        superProjectiles: 3,
        description: '어둠의 암살자 - 돌진으로 적을 베어낸다',
        superDescription: '🦇 박쥐 소환: 관통하는 박쥐로 적에게 데미지를 주고 회복',
    },
};

export const PROJECTILE_CONFIG = {
    BULLET_SPEED: 600,
    BULLET_SIZE: 8,
    SHOCKWAVE_SPEED: 500,
    SHOCKWAVE_WIDTH: 60,
};

export const GEM_CONFIG = {
    SPAWN_INTERVAL: 5000, // 5 seconds - faster spawning
    MAX_GEMS_ON_FIELD: 15,
    COLLECT_RADIUS: 40,
    DROP_SPREAD: 60,
};

export const AI_CONFIG = {
    DECISION_INTERVAL: 200, // ms
    ATTACK_RANGE_MULTIPLIER: 0.8,
    RETREAT_HEALTH_THRESHOLD: 0.3,
    GEM_PRIORITY_DISTANCE: 300,
    AGGRESSION_LEVELS: {
        PASSIVE: 0.3,
        NORMAL: 0.6,
        AGGRESSIVE: 0.9,
    },
};

// ========================================
// AI DIFFICULTY SYSTEM
// ========================================
// 3단계 난이도: 조준 실수, 반응 지연, 판단 실수
// ========================================
export const AI_DIFFICULTY = {
    EASY: {
        id: 'easy',
        name: '쉬움',

        // 조준 실수
        aimInaccuracy: 1.5,           // ±1.5 라디안 (약 85도) - 대폭 증가
        aimWobble: 0.6,                // 조준 떨림 진폭 - 대폭 증가
        aimRotationSpeed: Math.PI * 0.5, // 90도/s - 매우 느린 조준 회전

        // 반응 속도
        reactionDelay: 400,            // 적 발견 후 400ms 딜레이
        decisionInterval: 800,         // 느린 의사결정 (800ms)

        // 판단 실수
        poorDecisionChance: 0.4,       // 40% 확률로 잘못된 판단
        retreatThreshold: 0.5,         // 체력 50% 이하면 후퇴 (겁많음)
        wasteSuperChance: 0.3,         // 30% 확률로 슈퍼 낭비

        // 전투 회피/무빙 숙련도 (낮을수록 단순한 움직임)
        evasionSkill: 0.1,             // 매우 낮은 회피율 (거의 피하지 않음)
        combatAttackChance: 0.45,      // 공격 기회를 자주 놓침
        combatAttackRangeMultiplier: 0.8, // 멀어지면 공격 시도 급감
        combatStrafeChance: 0.2,       // 전투 중 옆무빙 빈도 낮음
        combatBackoffChance: 0.15,     // 근거리 백스텝 실패가 잦음

        // 움직임
        pathUpdateFrequency: 1000,     // 경로 업데이트 느림
        stuckThreshold: 1000,          // 막혔을 때 반응 느림
        smoothingFactor: 0.3,          // 방향 전환 스무딩 (높을수록 더 부드러움)
    },

    NORMAL: {
        id: 'normal',
        name: '보통',

        aimInaccuracy: 1.0,            // ±1.0 라디안 (약 57도)
        aimWobble: 0.4,
        aimRotationSpeed: Math.PI * 0.8, // 144도/s - 느린 조준 회전

        reactionDelay: 260,
        decisionInterval: 620,

        poorDecisionChance: 0.2,       // 20% 확률로 실수
        retreatThreshold: 0.25,
        wasteSuperChance: 0.1,

        // 전투 회피/무빙 숙련도 (낮을수록 단순한 움직임)
        evasionSkill: 0.2,             // 낮은 회피율
        combatAttackChance: 0.72,
        combatAttackRangeMultiplier: 0.95,
        combatStrafeChance: 0.55,
        combatBackoffChance: 0.75,

        pathUpdateFrequency: 500,
        stuckThreshold: 500,
        smoothingFactor: 0.2,          // 방향 전환 스무딩 (중간)
    },

    HARD: {
        id: 'hard',
        name: '어려움',

        aimInaccuracy: 0.5,            // ±0.5 라디안 (약 28도)
        aimWobble: 0.2,
        aimRotationSpeed: Math.PI * 1.5, // 270도/s - 보통 조준 속도

        reactionDelay: 50,
        decisionInterval: 200,

        poorDecisionChance: 0.05,      // 5% 확률로 실수
        retreatThreshold: 0.2,
        wasteSuperChance: 0.02,

        // 전투 회피/무빙 숙련도 (낮을수록 단순한 움직임)
        evasionSkill: 0.3,             // 소폭 낮은 회피율 (이전보다 피하기 쉬움)
        combatAttackChance: 0.92,
        combatAttackRangeMultiplier: 1.05,
        combatStrafeChance: 0.8,
        combatBackoffChance: 0.9,

        pathUpdateFrequency: 300,
        stuckThreshold: 300,
        smoothingFactor: 0.15,         // 방향 전환 스무딩 (낮음 - 더 기계적)
    },
};
