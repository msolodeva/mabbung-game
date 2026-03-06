# constants.py
# 게임 전역 상수 정의

# --- 화면 설정 ---
WIDTH, HEIGHT = 1280, 720
FPS = 60

# --- 색상 정의 (RGB) ---
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 50, 50)
BLUE = (50, 50, 255)
YELLOW = (255, 255, 0)
GREY = (120, 120, 120)
DARK_GREY = (60, 60, 60)
LIGHT_GREY = (180, 180, 180)
PURPLE = (150, 50, 255)
ORANGE = (255, 165, 0)
CYAN = (0, 255, 255)
NAVY = (0, 0, 128)
GREEN = (0, 255, 0)

# --- 게임 밸런스 설정 ---

# 플레이어
PLAYER_SPEED = 5
PLAYER_MAX_HEALTH = 140
PLAYER_INIT_BOMBS = 3
PLAYER_MAX_BOMBS = 3

# 난이도 및 스폰
DIFFICULTY_INTERVAL = 60.0  # 난이도 1 증가하는 시간(초)
MAX_ENEMIES = 15
MAX_JUNKS = 25
SPAWN_BASE_THRESHOLD = 45  # 기본 스폰 주기 계산 상수

# 적 생성 확률 (난이도에 따라 변동되거나 고정)
PROB_SUPPORT_ALLY = 0.02  # 지원군 스폰 확률
PROB_BASE_ENEMY = 0.12  # 적 스폰 기본 확률
PROB_MAX_ENEMY = 0.35  # 적 스폰 최대 확률

# 적 종류별 등장 확률 (누적 임계값)
# HeavyEnemy는 별도 로직(0.04)이나, 나머지 적들의 분기점
SPAWN_HEAVY_THRESHOLD = 0.04
SPAWN_INTERCEPTOR_THRESHOLD = 0.12
SPAWN_SNIPER_THRESHOLD = 0.20
SPAWN_GHOST_THRESHOLD = 0.28
SPAWN_SPLIT_THRESHOLD = 0.36
SPAWN_LASER_THRESHOLD = 0.42
SPAWN_KAMIKAZE_THRESHOLD = 0.48
SPAWN_BOSS_CARRIER_THRESHOLD = 0.52
SPAWN_FLOATING_MINE_THRESHOLD = 0.60  # 6% -> 12%로 증가

# 아이템 생성 확률 (누적 임계값)
# weapon(15%), health(25%), bomb(15%), shield(15%), slow(10%), magnet(12%), clone(8%)
ITEM_WEAPON_THRESHOLD = 0.15  # 15% - 특수 무기 (공격 강화)
ITEM_HEALTH_THRESHOLD = 0.40  # 25% - 체력 회복 (가장 중요한 생존 아이템)
ITEM_BOMB_THRESHOLD = 0.55  # 15% - 폭탄 추가 (긴급 상황용)
ITEM_SHIELD_THRESHOLD = 0.70  # 15% - 보호막 (생존 보조)
ITEM_SLOW_THRESHOLD = 0.72  # 2%로 감소 - 슬로우 타임
ITEM_MAGNET_THRESHOLD = 0.97  # 25%로 증가 - 자석 (아이템 수집 편의)
# 나머지 3%는 clone (분신 - 강력한 공격 보조)

# --- 데미지 및 회복량 ---
DAMAGE_PLAYER_BASIC = 10
DAMAGE_PLAYER_COLLISION = 20
DAMAGE_PLAYER_LASER_BEAM = 2  # 프레임당
DAMAGE_KAMIKAZE_EXPLOSION = 25
HEAL_AMOUNT = 30

# --- 엔티티 설정 ---
ITEM_SPEED = 3
ITEM_SPAWN_OFFSET = 20  # 아이템 스폰 시 추가 확률 보정 (r < enemy_prob + 0.02)

# 쇼크웨이브 & 이펙트
SHOCKWAVE_SPEED = 8
SHOCKWAVE_FADE = 20
EXPLOSION_PARTICLE_COUNT = 12
HIT_SPARK_PARTICLE_COUNT = 3
LASER_TRAIL_FADE = 20

# 아군 (Ally)
ALLY_SPEED_X = 4
ALLY_LIFETIME = 900  # 15초
ALLY_FIRE_RATE = 40  # 약 0.7초

# --- 적 설정 ---
ENEMY_BASE_SPEED_Y = 3
ENEMY_FIRE_RATE_MIN = 60
ENEMY_FIRE_RATE_MAX = 120

HEAVY_ENEMY_HEALTH_BASE = 30
HEAVY_ENEMY_HEALTH_SCALE = 7
HEAVY_ENEMY_FIRE_RATE_BASE = 90

INTERCEPTOR_SPEED_Y = 8
SNIPER_FIRE_RATE_BASE = 150
GHOST_PHASE_DURATION = 45  # 0.75초씩 번갈아가며

SPLIT_ENEMY_HEALTH_BASE = 20
SPLIT_ENEMY_HEALTH_SCALE = 5

LASER_ENEMY_HEALTH_BASE = 50
LASER_ENEMY_HEALTH_SCALE = 12
LASER_ENEMY_ROTATION_SPEED_BASE = 3

KAMIKAZE_SPEED_BASE = 2
KAMIKAZE_EXPLOSION_RADIUS = 80

# 기뢰 (Floating Mine)
FLOATING_MINE_DRIFT_SPEED = 2.5  # 1.5 -> 2.5로 증가
FLOATING_MINE_DETECTION_RADIUS = 70
FLOATING_MINE_EXPLOSION_RADIUS = 100
DAMAGE_FLOATING_MINE = 30

# --- 쓰레기 (Junk) ---
JUNK_SPEED_Y_MIN = 2
JUNK_SPEED_Y_MAX = 5

# --- 블랙홀 (BlackHole) ---
BLACK_HOLE_DAMAGE_RADIUS = 150  # 데미지가 시작되는 거리 (픽셀)
BLACK_HOLE_DAMAGE_PER_FRAME = 0.3  # 프레임당 체력 감소 (60FPS 기준 약 18/초)

# --- 보스 캐리어 (BossCarrier) ---
BOSS_CARRIER_HEALTH_BASE = 150
BOSS_CARRIER_HEALTH_SCALE = 30
BOSS_CARRIER_FIRE_RATE = 60
BOSS_CARRIER_PHASE_DURATION = 180  # 3초 (60FPS 기준)
BOSS_CARRIER_DRONE_SPEED = 2

# --- 비행기 타입 ---
SHIP_TYPES = {
    "falcon": {
        "name": "Falcon",
        "health": 140,
        "speed": 5,
        "bombs": 3,
        "color_accent": (255, 220, 50),
        "description": "Balanced all-rounder",
        "weapon_style": "normal",
    },
    "titan": {
        "name": "Titan",
        "health": 220,
        "speed": 3.5,
        "bombs": 4,
        "color_accent": (100, 200, 255),
        "description": "Slow but very tanky",
        "weapon_style": "spread",
    },
    "phantom": {
        "name": "Phantom",
        "health": 90,
        "speed": 7.5,
        "bombs": 2,
        "color_accent": (200, 100, 255),
        "description": "Fast but fragile",
        "weapon_style": "rapid",
    },
    "viper": {
        "name": "Viper",
        "health": 110,
        "speed": 5,
        "bombs": 2,
        "color_accent": (50, 255, 100),
        "description": "High damage dealer",
        "weapon_style": "power",
    },
}
SHIP_TYPE_KEYS = list(SHIP_TYPES.keys())
