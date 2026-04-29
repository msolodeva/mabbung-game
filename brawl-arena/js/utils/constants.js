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
// Brawlers with Rock-Paper-Scissors style counters:
//
//   Counter Chain:
//   Brock → Dynamike → Nita → Mortis → Colt → Brock
//            ↘       ↙
//             Spike (Area Control - objective denial)
//
// Detailed Counter Relationships:
// - Brock beats Dynamike (longest threat range and burst punishes artillery)
// - Colt beats Brock & Spike (fastest base speed and sustained ranged pressure)
// - Nita beats Colt & Mortis (highest health and wide close-range shockwave)
// - Dynamike beats Nita & Spike (delayed AoE punishes slow/objective play)
// - Spike beats grouped enemies and gem zones, but loses direct duels to burst
// - Mortis beats fragile ranged brawlers by spending ammo on committed dives
// ========================================

export const BRAWLERS = {
    // =====================================
    // BROCK - Rocket Artillery (Long Range Burst)
    // =====================================
    // ✅ STRONG vs: Dynamike (outranges setup), Spike (long-range burst)
    // ❌ WEAK vs: Colt (faster ranged pressure), Mortis (dash dive)
    // =====================================
    BROCK: {
        id: 'brock',
        name: 'Brock',
        role: 'ROCKETEER',
        emoji: '🎯',
        color: '#d35400',
        health: 2700,
        speed: 255,
        attackDamage: 1250,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 640,
        attackSpeed: 1050,
        rocketExplosionRadius: 70,
        rocketKnockback: 90,
        ammoMax: 3,
        ammoReloadTime: 2100,
        superCharge: 6,
        superDamage: 520,
        superRocketCount: 6,
        superRange: 680,
        superExplosionRadius: 78,
        superKnockback: 140,
        description: '초장거리 로켓 딜러 - 느린 재장전 대신 강한 한 방으로 압박한다',
        superDescription: '🚀 로켓 레인: 여러 발의 로켓을 연속 발사해 지역을 폭격',
    },

    // =====================================
    // NITA - Tank (High HP + Homing Missile)
    // =====================================
    // ✅ STRONG vs: Colt (absorbs damage, missile tracks)
    // ❌ WEAK vs: Dynamike (slow target punished by lobbed bombs)
    // =====================================
    NITA: {
        id: 'nita',
        name: 'Nita',
        role: 'BRUISER',
        emoji: '🚀',
        color: '#e74c3c',
        health: 5600,
        speed: 245,
        attackDamage: 900,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 360,
        attackSpeed: 740,
        ammoMax: 3,
        ammoReloadTime: 1250,
        superCharge: 7,
        superDamage: 1100,
        description: '근접 브루저 - 높은 체력과 넓은 충격파로 진입을 받아친다',
        superDescription: '🚀 유도 미사일: 가장 가까운 적을 자동으로 추적하는 미사일 발사',
    },

    // =====================================
    // COLT - Marksman (Long Range DPS)
    // =====================================
    // ✅ STRONG vs: Brock (faster ranged pressure), Spike (outranges)
    // ❌ WEAK vs: Nita (can't kill fast enough, gets overrun)
    // =====================================
    COLT: {
        id: 'colt',
        name: 'Colt',
        role: 'MARKSMAN',
        emoji: '🤠',
        color: '#4a90d9',
        health: 2400,
        speed: 330,
        attackDamage: 290,
        attackProjectiles: 6,
        attackSpread: 0.035,
        attackRange: 610,
        attackSpeed: 620,
        ammoMax: 3,
        ammoReloadTime: 1550,
        superCharge: 12,       // 12 히트로 충전 (느림)
        superDamage: 260,
        description: '고기동 연사수 - 빠른 발과 지속 화력으로 거리를 흔든다',
        superDescription: '🔥 불릿 스톰: 관통하는 12발의 총알을 연사',
    },

    // =====================================
    // DYNAMIKE - Artillery (Lobbed AoE)
    // =====================================
    // ✅ STRONG vs: Nita (punishes slow tanks over cover), grouped enemies
    // ❌ WEAK vs: Brock (long-range burst), Colt (long-range pressure)
    // =====================================
    DYNAMIKE: {
        id: 'dynamike',
        name: 'Dynamike',
        role: 'ARTILLERY',
        emoji: '💣',
        color: '#f39c12',
        health: 2500,
        speed: 260,
        attackDamage: 1150,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 480,
        attackSpeed: 1050,
        explosionRadius: 105,
        fuseTime: 740,
        ammoMax: 3,
        ammoReloadTime: 1850,
        superCharge: 7,
        superDamage: 1700,
        superRadius: 145,
        superKnockback: 460,
        superFuseTime: 900,
        description: '지연 폭파 포병 - 벽 너머와 좁은 길을 예측 폭발로 장악한다',
        superDescription: '💥 빅 배럴: 거대한 폭탄으로 넓은 피해와 넉백',
    },

    // =====================================
    // SPIKE - Controller (Area Denial)
    // =====================================
    // ✅ STRONG vs: Grouped enemies, slow brawlers (Nita, Dynamike)
    // ❌ WEAK vs: Brock (long-range burst), Colt (outranges and kites)
    // =====================================
    SPIKE: {
        id: 'spike',
        name: 'Spike',
        role: 'CONTROLLER',
        emoji: '🌵',
        color: '#27ae60',
        health: 2500,
        speed: 265,
        attackDamage: 480,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 470,
        attackSpeed: 900,
        explodeSpikes: 6,
        explodeSpikeDamage: 240,
        ammoMax: 3,
        ammoReloadTime: 1750,
        superCharge: 10,       // 10 히트로 충전
        superRadius: 220,
        superSlowDuration: 3500,
        superDamagePerSecond: 320,
        superBurstSpikes: 8,
        superBurstRange: 280,
        superBurstDamageMultiplier: 1.0,
        description: '지역 장악 전문가 - 순간 폭딜보다 이동 제한과 보석 구역 통제에 강하다',
        superDescription: '🌵 가시 덫: 지속 피해와 슬로우를 주는 가시밭 생성',
    },

    // =====================================
    // MORTIS - Assassin (Dash Melee)
    // =====================================
    // ✅ STRONG vs: Dynamike (dives artillery), Colt (closes gap instantly), Brock (dodges slow rockets)
    // ❌ WEAK vs: Nita (tanks too much)
    // =====================================
    MORTIS: {
        id: 'mortis',
        name: 'Mortis',
        role: 'ASSASSIN',
        emoji: '⚰️',
        color: '#7d3c98',
        health: 3400,
        speed: 315,
        attackDamage: 760,
        attackProjectiles: 0,
        attackSpread: 0,
        attackRange: 180,
        attackSpeed: 520,
        dashSpeed: 1320,
        dashDuration: 140,
        dashDamageRadius: 55,
        ammoMax: 3,
        ammoReloadTime: 2300,
        superCharge: 6,
        superDamage: 850,
        superHealPercent: 0.8,
        superProjectiles: 3,
        description: '돌진 암살자 - 긴 재장전 때문에 진입 각을 신중히 골라야 한다',
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
// 3단계 AI 지능: 연습용 낮음, 균형 잡힌 보통, 완벽하지 않은 높음
// ========================================
export const AI_DIFFICULTY = {
    EASY: {
        id: 'easy',
        name: '낮은 지능',

        // 조준 실수
        aimInaccuracy: 1.75,          // 조준 오차 큼
        aimWobble: 0.72,              // 조준 떨림 큼
        aimRotationSpeed: Math.PI * 0.42,

        // 반응 속도
        reactionDelay: 560,
        decisionInterval: 980,

        // 판단 실수
        poorDecisionChance: 0.5,
        retreatThreshold: 0.5,         // 체력 50% 이하면 후퇴 (겁많음)
        wasteSuperChance: 0.38,

        // 전투 회피/무빙 숙련도 (낮을수록 단순한 움직임)
        evasionSkill: 0.06,
        combatAttackChance: 0.32,
        combatAttackRangeMultiplier: 0.72,
        combatStrafeChance: 0.1,
        combatBackoffChance: 0.1,

        // 움직임
        pathUpdateFrequency: 1200,
        stuckThreshold: 1200,
        smoothingFactor: 0.36,
    },

    NORMAL: {
        id: 'normal',
        name: '보통 지능',

        aimInaccuracy: 1.16,
        aimWobble: 0.42,
        aimRotationSpeed: Math.PI * 0.72,

        reactionDelay: 330,
        decisionInterval: 660,

        poorDecisionChance: 0.27,
        retreatThreshold: 0.37,
        wasteSuperChance: 0.16,

        evasionSkill: 0.2,
        combatAttackChance: 0.54,
        combatAttackRangeMultiplier: 0.85,
        combatStrafeChance: 0.32,
        combatBackoffChance: 0.42,

        pathUpdateFrequency: 740,
        stuckThreshold: 740,
        smoothingFactor: 0.3,
    },

    HARD: {
        id: 'hard',
        name: '높은 지능',

        aimInaccuracy: 0.82,
        aimWobble: 0.28,
        aimRotationSpeed: Math.PI * 1.0,

        reactionDelay: 225,
        decisionInterval: 470,

        poorDecisionChance: 0.13,
        retreatThreshold: 0.28,
        wasteSuperChance: 0.05,

        // 전투 회피/무빙 숙련도
        evasionSkill: 0.34,
        combatAttackChance: 0.7,
        combatAttackRangeMultiplier: 0.94,
        combatStrafeChance: 0.54,
        combatBackoffChance: 0.62,

        pathUpdateFrequency: 500,
        stuckThreshold: 500,
        smoothingFactor: 0.26,
    },
};
