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
        health: 7000,          // 5800 → 7000 (근접 교전 생존력 강화)
        speed: 260,            // Fast - can close gaps
        attackDamage: 480,     // High burst damage per pellet
        attackProjectiles: 5,
        attackSpread: 0.6,
        attackRange: 220,      // SHORT - main weakness
        attackSpeed: 500,
        ammoMax: 3,
        ammoReloadTime: 1200,  // Fast reload
        superCharge: 8,
        superDamage: 520,
        superKnockback: 450,   // 350 → 450 (방어적 유틸리티 강화)
        description: '근접 버스트 딜러 - 다가가면 끝장낸다',
        superDescription: '💥 슈퍼 셸: 강력한 산탄으로 적을 밀어냄',
    },

    // =====================================
    // NITA - Tank (High HP + Bear Summon)
    // =====================================
    // ✅ STRONG vs: Colt (absorbs damage, bear flanks)
    // ❌ WEAK vs: Poco (can't kill through heals)
    // =====================================
    NITA: {
        id: 'nita',
        name: 'Nita',
        role: 'TANK',
        emoji: '🐻',
        color: '#e74c3c',
        health: 9500,          // 8000 → 9500 (최고 체력으로 확실한 탱킹)
        speed: 230,            // Slow - but tanky
        attackDamage: 1050,    // 950 → 1050 (관통 공격의 가치 상승)
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 300,      // Medium range
        attackSpeed: 850,
        ammoMax: 3,
        ammoReloadTime: 1500,
        superCharge: 10,
        description: '불굴의 탱커 - 곰과 함께 압박한다',
        superDescription: '🐻 곰 소환: 적을 추적하는 곰 동료를 소환',
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
        health: 4500,          // 3600 → 4500 (원거리에서도 생존)
        speed: 270,            // Fast for kiting
        attackDamage: 420,
        attackProjectiles: 6,
        attackSpread: 0.08,
        attackRange: 550,      // LONGEST range
        attackSpeed: 400,
        ammoMax: 3,
        ammoReloadTime: 1500,  // 1700 → 1500 (지속적인 탄막 형성)
        superCharge: 12,
        superDamage: 420,
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
        health: 6600,          // 5500 → 6600 (힐러 생존력 강화)
        speed: 240,
        attackDamage: 800,     // Decent damage for support
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 380,
        attackSpeed: 900,      // Slow attack
        attackWidth: 180,      // WIDE attack - easy to hit
        ammoMax: 3,
        ammoReloadTime: 900,   // 1000 → 900 (더 빠른 궁극기 충전)
        superCharge: 5,        // Charges FAST for heals
        superHeal: 3500,       // 2800 → 3500 (전세 역전 가능한 힐)
        superRadius: 380,
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
        health: 5000,          // 4000 → 5000 (생존력 강화)
        speed: 235,
        attackDamage: 600,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 400,
        attackSpeed: 700,
        explodeSpikes: 6,
        explodeSpikeDamage: 280, // High potential if all spikes hit
        ammoMax: 3,
        ammoReloadTime: 1800,  // Slow reload
        superCharge: 10,
        superRadius: 220,
        superSlowDuration: 5000, // 4000 → 5000 (더 강력한 지역 장악)
        superDamagePerSecond: 600,
        description: '지역 장악 전문가 - 발 밑을 조심해',
        superDescription: '🌵 가시 덫: 지속 피해와 슬로우를 주는 가시밭 생성',
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
        aimInaccuracy: 0.8,           // ±0.8 라디안 (약 45도)
        aimWobble: 0.3,                // 조준 떨림 진폭
        aimRotationSpeed: Math.PI,     // 180도/s - 느린 조준 회전

        // 반응 속도
        reactionDelay: 400,            // 적 발견 후 400ms 딜레이
        decisionInterval: 800,         // 느린 의사결정 (800ms)

        // 판단 실수
        poorDecisionChance: 0.4,       // 40% 확률로 잘못된 판단
        retreatThreshold: 0.5,         // 체력 50% 이하면 후퇴 (겁많음)
        wasteSuperChance: 0.3,         // 30% 확률로 슈퍼 낭비

        // 움직임
        pathUpdateFrequency: 1000,     // 경로 업데이트 느림
        stuckThreshold: 1000,          // 막혔을 때 반응 느림
    },

    NORMAL: {
        id: 'normal',
        name: '보통',

        aimInaccuracy: 0.3,            // ±0.3 라디안 (약 17도)
        aimWobble: 0.1,
        aimRotationSpeed: Math.PI * 2, // 360도/s - 보통 조준 회전

        reactionDelay: 200,
        decisionInterval: 500,

        poorDecisionChance: 0.15,      // 15% 확률로 실수
        retreatThreshold: 0.3,
        wasteSuperChance: 0.1,

        pathUpdateFrequency: 500,
        stuckThreshold: 500,
    },

    HARD: {
        id: 'hard',
        name: '어려움',

        aimInaccuracy: 0.1,            // ±0.1 라디안 (약 6도)
        aimWobble: 0.02,
        aimRotationSpeed: Math.PI * 4, // 720도/s - 빠른 조준 회전

        reactionDelay: 50,
        decisionInterval: 200,

        poorDecisionChance: 0.05,      // 5% 확률로 실수
        retreatThreshold: 0.2,
        wasteSuperChance: 0.02,

        pathUpdateFrequency: 300,
        stuckThreshold: 300,
    },
};
