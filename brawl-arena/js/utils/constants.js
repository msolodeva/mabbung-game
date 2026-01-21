// ========================================
// BRAWL ARENA - GAME CONSTANTS
// ========================================

export const GAME_CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    TILE_SIZE: 40,
    FPS: 60,
    MATCH_DURATION: 150, // 2.5 minutes in seconds
    WIN_GEM_COUNT: 10,
    WIN_COUNTDOWN: 15, // 15 seconds to hold gems
    RESPAWN_TIME: 3000, // 3 seconds
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
export const BRAWLERS = {
    SHELLY: {
        id: 'shelly',
        name: 'Shelly',
        emoji: '🔫',
        color: '#9b59b6',
        health: 3600,
        speed: 200,
        attackDamage: 400,
        attackProjectiles: 5,
        attackSpread: 0.6, // radians
        attackRange: 200,
        attackSpeed: 500, // ms between attacks
        ammoMax: 3,
        ammoReloadTime: 1500,
        superCharge: 12, // hits to charge
        superDamage: 600,
        superKnockback: 300,
        description: 'Close-range shotgun blaster',
    },
    NITA: {
        id: 'nita',
        name: 'Nita',
        emoji: '🐻',
        color: '#e74c3c',
        health: 4000,
        speed: 200,
        attackDamage: 800,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 350,
        attackSpeed: 600,
        ammoMax: 3,
        ammoReloadTime: 1400,
        superCharge: 10,
        description: 'Summons a bear companion',
    },
    COLT: {
        id: 'colt',
        name: 'Colt',
        emoji: '🤠',
        color: '#4a90d9',
        health: 2800,
        speed: 220,
        attackDamage: 320,
        attackProjectiles: 6,
        attackSpread: 0.15,
        attackRange: 500,
        attackSpeed: 400,
        ammoMax: 3,
        ammoReloadTime: 1600,
        superCharge: 14,
        superDamage: 400,
        description: 'Long-range dual pistols',
    },
    POCO: {
        id: 'poco',
        name: 'Poco',
        emoji: '🎸',
        color: '#2ecc71',
        health: 4000,
        speed: 200,
        attackDamage: 660,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 400,
        attackSpeed: 700,
        attackWidth: 100, // wide wave attack
        ammoMax: 3,
        ammoReloadTime: 1200,
        superCharge: 10,
        superHeal: 2100,
        superRadius: 250,
        description: 'Healing support brawler',
    },
    SPIKE: {
        id: 'spike',
        name: 'Spike',
        emoji: '🌵',
        color: '#27ae60',
        health: 2400,
        speed: 200,
        attackDamage: 520,
        attackProjectiles: 1,
        attackSpread: 0,
        attackRange: 400,
        attackSpeed: 650,
        explodeSpikes: 6,
        explodeSpikeDamage: 180,
        ammoMax: 3,
        ammoReloadTime: 1800,
        superCharge: 12,
        superRadius: 150,
        superSlowDuration: 3000,
        superDamagePerSecond: 400,
        description: 'Area control specialist',
    },
};

export const PROJECTILE_CONFIG = {
    BULLET_SPEED: 600,
    BULLET_SIZE: 8,
    SHOCKWAVE_SPEED: 500,
    SHOCKWAVE_WIDTH: 60,
};

export const GEM_CONFIG = {
    SPAWN_INTERVAL: 7000, // 7 seconds
    MAX_GEMS_ON_FIELD: 10,
    COLLECT_RADIUS: 30,
    DROP_SPREAD: 50,
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
