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
};

export const COLORS = {
    GROUND: '#4a7c23',
    GROUND_DARK: '#3d6620',
    WALL: '#5d4e37',
    WALL_TOP: '#7a6548',
    BUSH: '#2d5016',
    BUSH_DARK: '#1f3810',
    DESTRUCTIBLE: '#8b7355',
    WATER: '#3498db',

    BLUE_TEAM: '#4a90d9',
    RED_TEAM: '#e74c3c',

    HEALTH_GREEN: '#2ecc71',
    HEALTH_YELLOW: '#f1c40f',
    HEALTH_RED: '#e74c3c',

    GEM: '#9b59b6',
    GEM_GLOW: '#bb8fce',

    SUPER_GOLD: '#ffd700',
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
        health: 5800,
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
        superKnockback: 350,
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
        health: 8000,          // HIGHEST HP
        speed: 230,            // Slow - but tanky
        attackDamage: 950,
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
        health: 3600,          // LOWEST HP - glass cannon
        speed: 270,            // Fast for kiting
        attackDamage: 420,
        attackProjectiles: 6,
        attackSpread: 0.08,
        attackRange: 550,      // LONGEST range
        attackSpeed: 400,
        ammoMax: 3,
        ammoReloadTime: 1700,
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
        health: 5500,
        speed: 240,
        attackDamage: 800,     // Decent damage for support
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 380,
        attackSpeed: 900,      // Slow attack
        attackWidth: 180,      // WIDE attack - easy to hit
        ammoMax: 3,
        ammoReloadTime: 1000,  // Fast reload
        superCharge: 5,        // Charges FAST for heals
        superHeal: 2800,       // STRONG heal
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
        health: 4000,
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
        superSlowDuration: 4000,
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
