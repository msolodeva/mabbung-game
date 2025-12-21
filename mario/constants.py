"""
게임 상수 및 설정값들을 모아놓은 모듈
"""
import pygame

# 화면 설정
SCREEN_WIDTH = 1600
SCREEN_HEIGHT = 960

# 색상 정의 (R, G, B)
SKY = (135, 206, 235)  # 하늘색
GRAY = (120, 120, 120)  # 발판(블록) 색
RED = (220, 30, 30)  # 장애물(빨간 블록) 색
GOLD = (255, 215, 0)  # 동전 색
BLUE = (50, 150, 255)  # 플레이어 색
BLACK = (0, 0, 0)  # 글자(검정) 색
DARK = (90, 90, 90)  # 움직이는 발판 색
BROWN = (150, 110, 60)  # 쉽게 부서지는 발판 색
GREEN = (60, 200, 80)  # 스프링(점프대) 색
ORANGE = (255, 140, 0)  # 뾰족가시 색
SEA = (64, 164, 223)  # 바다(물) 색
SEA_DARK = (34, 134, 193)  # 물결 그림자 색
CORAL = (255, 99, 71)  # 산호(장애물) 색
JELLY = (200, 100, 255)  # 해파리 색

# 지면 설정
GROUND_TOP_Y = 420  # 땅(수면) 윗면 높이
GROUND_THICKNESS = 140  # 땅 두께

# 플레이어 설정
PLAYER_START_X = 100
PLAYER_START_Y = 300
PLAYER_SPEED = 4
JUMP_POWER = -12
GRAVITY = 0.6

# 점프 관련 설정
JUMP_HOLD_TIME_MAX = 12  # 키를 누르고 있을 때 더해 줄 프레임 수
JUMP_HOLD_BOOST = -0.4  # 누르는 동안 위로 조금 더 힘
COYOTE_TIME_MAX = 8  # 가장자리에서 잠깐 떠도 점프를 허용
JUMP_BUFFER_TIME_MAX = 6  # 착지 직전에 눌러도 점프가 되게 기억

# 플레이어 크기
PLAYER_SMALL_WIDTH = 32
PLAYER_SMALL_HEIGHT = 40
PLAYER_BIG_WIDTH = 32
PLAYER_BIG_HEIGHT = 56

# 적 관련 설정
STOMP_TOLERANCE = 16  # 적 머리를 밟을 때 허용하는 여유 높이

# 공룡 관련 설정
DINO_SPEED_MULT = 1.2  # 공룡을 타면 조금 더 빨라짐
DINO_JUMP_BOOST = 0.1  # 공룡을 타면 점프가 더 부드럽게
DINO_FIRE_DELAY = 20  # 불똥 재장전 시간
FIREBALL_SPEED = 12  # 불똥 속도
FIREBALL_LIFETIME = 90  # 불똥이 사라지기까지 프레임 수
FIRE_KEY = pygame.K_LSHIFT  # 불똥을 쏘는 키

# 레벨 생성 설정
CHUNK_WIDTH = 800  # 한 구간의 가로 길이
INITIAL_GENERATED_X = 2600  # 초기 생성된 맵의 끝 X 좌표

# 수영 관련 설정
SWIM_FORCE = 0.6
WATER_JUMP_BOOST = -18
SWIM_UP_MAX = 14
SWIM_DOWN_MAX = 8

# 체력 시스템
MAX_HEALTH = 3
INITIAL_HEALTH = 3

