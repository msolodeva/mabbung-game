// ========================================
// BRAWL ARENA - GAME CONSTANTS
// ========================================

export const GAME_CONFIG = {
    CANVAS_WIDTH: 1400,
    CANVAS_HEIGHT: 900,
    TILE_SIZE: 50, // Increased tile size for better detail
    FPS: 60,
    MATCH_DURATION: 180, // 3 minutes
    WIN_GEM_COUNT: 3, // Now only 3 gems needed!
    WIN_COUNTDOWN: 25,
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

// Brawler Stats and Configurations
// Balance Philosophy:
// - Tank: High HP, Low Range, Medium Damage
// - Assassin: Low HP, Medium Range, High Burst
// - Sniper: Low HP, High Range, Medium Damage
// - Support: High HP, Medium Range, Low Damage + Utility
// - Control: Medium HP, Medium Range, Area Denial

export const BRAWLERS = {
    // =====================================
    // SHELLY - Close Range Fighter
    // Strength: Devastating close-range burst
    // Weakness: Very short range, useless at distance
    // Counters: Poco, Spike (bursts them down)
    // Countered by: Colt (outranges her completely)
    // =====================================
    SHELLY: {
        id: 'shelly',
        name: 'Shelly',
        role: 'FIGHTER',
        emoji: '🔫',
        color: '#9b59b6',
        health: 6000,          // Buffed HP (was 4400)
        speed: 250,            // Increased speed (from 200)
        attackDamage: 450,     // Buffed damage
        attackProjectiles: 5,
        attackSpread: 0.7,     // Wide spread
        attackRange: 200,      // VERY SHORT - her main weakness
        attackSpeed: 500,
        ammoMax: 3,
        ammoReloadTime: 1300,  // Fast reload for aggression
        superCharge: 8,
        superDamage: 500,
        superKnockback: 350,
        description: '근접전의 왕 - 다가가면 끝장',
        superDescription: '💥 슈퍼 셸: 9발의 강력한 산탄을 발사하여 적을 밀어냄',
    },

    // =====================================
    // NITA - Tank / Bruiser
    // Strength: Highest HP, Bear companion, Sustained damage
    // Weakness: Slow speed, Short range, No burst
    // Counters: Colt (tanks damage, closes in)
    // Countered by: Poco (outsustains with heals)
    // =====================================
    NITA: {
        id: 'nita',
        name: 'Nita',
        role: 'TANK',
        emoji: '🐻',
        color: '#e74c3c',
        health: 7500,          // Buffed tankiness (was 5500)
        speed: 240,            // Buffed speed (was 220)
        attackDamage: 900,     // Buffed damage
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 280,      // Short-medium
        attackSpeed: 800,      // Slow attack
        ammoMax: 3,
        ammoReloadTime: 1600,  // Slow reload
        superCharge: 10,
        description: '불굴의 탱커 - 곰과 함께 진격',
        superDescription: '🐻 곰 소환: 적을 추적하고 공격하는 곰을 소환',
    },

    // =====================================
    // COLT - Sharpshooter / Glass Cannon
    // Strength: Longest range, Highest sustained DPS, Fast
    // Weakness: LOWEST HP - dies instantly if caught
    // Counters: Shelly (keeps distance), Poco (DPS > healing)
    // Countered by: Nita (tanks and closes gap)
    // =====================================
    COLT: {
        id: 'colt',
        name: 'Colt',
        role: 'MARKSMAN',
        emoji: '🤠',
        color: '#4a90d9',
        health: 3800,          // Buffed HP (was 2800)
        speed: 280,            // Buffed speed (from 240)
        attackDamage: 400,     // Buffed damage
        attackProjectiles: 6,
        attackSpread: 0.08,    // Very precise
        attackRange: 600,      // Longer range
        attackSpeed: 400,      // Fast fire rate
        ammoMax: 3,
        ammoReloadTime: 1800,  // Slow reload - punishes misses
        superCharge: 14,       // Hard to charge
        superDamage: 400,
        description: '원거리 저격수 - 잡히면 죽는다',
        superDescription: '🔥 불릿 스톰: 12발의 관통 총알을 연사',
    },

    // =====================================
    // POCO - Support / Healer
    // Strength: Team healing, Wide attacks, High HP for support
    // Weakness: LOW individual damage, Slow attacks
    // Counters: Nita (outsustains with heals)
    // Countered by: Shelly, Colt (burst > healing)
    // =====================================
    POCO: {
        id: 'poco',
        name: 'Poco',
        role: 'SUPPORT',
        emoji: '🎸',
        color: '#2ecc71',
        health: 6000,
        speed: 230,
        attackDamage: 700,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 400,      // Good range
        attackSpeed: 1000,     // SLOW attack - main weakness
        attackWidth: 160,      // WIDEST attack - easy to hit
        ammoMax: 3,
        ammoReloadTime: 1100,  // Fast reload
        superCharge: 6,        // Charges fast for healing
        superHeal: 2500,       // STRONG heal
        superRadius: 350,      // Big heal radius
        description: '치유의 음악가 - 팀을 살린다',
        superDescription: '💚 치유의 멜로디: 주변 아군 모두를 대량 회복',
    },

    // =====================================
    // SPIKE - Controller / Zone Denial
    // Strength: Area control, Spike explosion burst, Slowing super
    // Weakness: Low HP, Slow reload, Hard to hit
    // Counters: Grouped/slow enemies
    // Countered by: Shelly (bursts down), fast brawlers
    // =====================================
    SPIKE: {
        id: 'spike',
        name: 'Spike',
        role: 'CONTROLLER',
        emoji: '🌵',
        color: '#27ae60',
        health: 4200,
        speed: 240,
        attackDamage: 560,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 420,      // Medium-long
        attackSpeed: 750,
        explodeSpikes: 6,
        explodeSpikeDamage: 240, // 480+240×6=1920 MAX if all spikes hit
        ammoMax: 3,
        ammoReloadTime: 2000,  // SLOWEST reload - main weakness
        superCharge: 12,
        superRadius: 200,
        superSlowDuration: 4000, // Long slow
        superDamagePerSecond: 500,
        description: '지역 장악 - 함정에 걸리면 끝',
        superDescription: '🌵 가시 덫: 지속 피해와 슬로우를 주는 가시밭 생성',
    },

    // =====================================
    // EL PRIMO - Melee Tank
    // Strength: Highest individual HP, Fast, Melee damage
    // Weakness: Needs to be right on top of enemies
    // Counters: Low health brawlers (if he catches them)
    // Countered by: Shelly (bursts him if he gets close), Colt (kites him)
    // =====================================
    ELPRIMO: {
        id: 'elprimo',
        name: 'El Primo',
        role: 'TANK',
        emoji: '👊',
        color: '#e67e22',
        health: 9500,
        speed: 265,
        attackDamage: 360,     // Per punch (4 punches total)
        attackProjectiles: 4,
        attackRange: 150,      // Very short melee range
        attackSpeed: 600,
        ammoMax: 3,
        ammoReloadTime: 1200,
        superCharge: 12,
        superDamage: 800,
        superKnockback: 400,
        description: '강력한 루차도르 - 근접전의 패왕',
        superDescription: '🚀 플라잉 엘보 드롭: 도약하여 착지 지점의 적에게 피해를 입히고 밀어냄',
    },

    // =====================================
    // BULL - Heavyweight Tank
    // Strength: Massive close-range damage, Bull Charge
    // Weakness: Short range, simple movement
    // Counters: Low health brawlers (if he catches them)
    // Countered by: Colt (kites him), Shelly (bursts him)
    // =====================================
    BULL: {
        id: 'bull',
        name: 'Bull',
        role: 'TANK',
        emoji: '🐂',
        color: '#2c3e50',
        health: 8000,
        speed: 260,
        attackDamage: 400,     // Per pellet (5 pellets total)
        attackProjectiles: 5,
        attackSpread: 0.8,
        attackRange: 180,      // Short range
        attackSpeed: 600,
        ammoMax: 3,
        ammoReloadTime: 1400,
        superCharge: 10,
        superKnockback: 400,
        description: '폭주하는 탱크 - 돌진하면 막을 수 없다',
        superDescription: '🐂 불도저: 앞을 가로막는 모든 것을 파괴하며 돌진',
    },

    // =====================================
    // BROCK - Rocket Sniper
    // Strength: Long range, Area Damage, Wall break (Super)
    // Weakness: Slow reload, Slow projectile
    // Counters: Grouped enemies, Static Snipers
    // Countered by: Mortis/Assassin (dodges rockets)
    // =====================================
    BROCK: {
        id: 'brock',
        name: 'Brock',
        role: 'MARKSMAN',
        emoji: '🕶️',
        color: '#e74c3c',
        health: 3600,
        speed: 240,
        attackDamage: 1100,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 650,       // Very long range
        attackSpeed: 900,       // Slow fire rate
        ammoMax: 3,
        ammoReloadTime: 1900,   // Slightly faster reload (was 2100)
        superCharge: 8,
        superDamage: 1000,
        description: '로켓 레인 - 춤추는 폭발',
        superDescription: '🚀 로켓 레인: 지정된 지역에 로켓 폭격을 가하여 지형을 파괴함',
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
