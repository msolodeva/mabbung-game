# game.py
# 메인 게임 로직 및 실행

import pygame
import random
import sys

from constants import (
    WIDTH,
    HEIGHT,
    FPS,
    BLACK,
    WHITE,
    RED,
    BLUE,
    YELLOW,
    GREY,
    PURPLE,
    GREEN,
    ORANGE,
    CYAN,
    DAMAGE_KAMIKAZE_EXPLOSION,
    KAMIKAZE_EXPLOSION_RADIUS,
    FLOATING_MINE_EXPLOSION_RADIUS,
    DAMAGE_FLOATING_MINE,
    BLACK_HOLE_DAMAGE_RADIUS,
    BLACK_HOLE_DAMAGE_PER_FRAME,
    SHIP_TYPES,
    SHIP_TYPE_KEYS,
)
from utils import ScreenShake, point_to_line_distance
from sound import generate_sound
from background import BackgroundManager
from entities import (
    Player,
    Laser,
    Item,
    Explosion,
    EngineTrail,
    HitSpark,
    LaserTrail,
    Ally,
)
from enemies import (
    Enemy,
    HeavyEnemy,
    Interceptor,
    SniperEnemy,
    GhostEnemy,
    SplitEnemy,
    LaserEnemy,
    KamikazeEnemy,
    FloatingMine,
    BossCarrier,
    CarrierDrone,
)
from weapons import HomingMissile, PiercingLaser, PlasmaWave
from environment import EnvironmentManager
from junk import Junk
from spawn_manager import SpawnManager
from collision_manager import CollisionManager


class Game:
    """
    메인 게임 클래스.
    - 게임 루프 (이벤트 처리, 업데이트, 렌더링)
    - 엔티티 관리 (플레이어, 적, 레이저 등)
    """

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Space Cleaner")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 24)
        self.large_font = pygame.font.SysFont("Arial", 64)
        self.title_font = pygame.font.SysFont("Arial", 48, bold=True)
        self.small_font = pygame.font.SysFont("Arial", 18)

        # 사운드 초기화
        self._init_sounds()

        # 화면 흔들림 시스템
        self.screen_shake = ScreenShake()

        # 히트 스탑 (프레임 정지)
        self.hit_stop = 0

        # 매니저 초기화
        self.spawn_manager = SpawnManager()
        self.collision_manager = CollisionManager(self)

        # 비행기 선택 상태
        self.state = "select"  # "select", "playing"
        self.p1_ship_index = 0
        self.p2_ship_index = 0
        self.p1_confirmed = False
        self.p2_confirmed = False
        self.select_blink_timer = 0

        self.reset_game()

    def _init_sounds(self):
        """사운드 효과 생성."""
        try:
            pygame.mixer.init()
            self.snd_shoot = generate_sound("square", 600, 0.1, 0.3)
            self.snd_explosion = generate_sound("noise", 0, 0.2, 0.5)
            self.snd_powerup = generate_sound("square", 400, 0.3, 0.4)
        except Exception as e:
            print(f"Sound Init Error: {e}")
            self.snd_shoot = None
            self.snd_explosion = None
            self.snd_powerup = None

    def reset_game(self):
        """게임 상태 초기화."""
        self.start_ticks = pygame.time.get_ticks()
        self.game_time = 0

        # 게임 상태 리셋
        self.game_over = False
        self.game_paused = False

        # 선택된 비행기 타입 가져오기
        p1_ship_type = SHIP_TYPE_KEYS[self.p1_ship_index]
        p2_ship_type = SHIP_TYPE_KEYS[self.p2_ship_index]

        # 플레이어 1 (WASD + F/G)
        self.p1 = Player(
            WIDTH // 4,
            HEIGHT - 60,
            RED,
            {
                "left": pygame.K_a,
                "right": pygame.K_d,
                "up": pygame.K_w,
                "down": pygame.K_s,
                "fire": pygame.K_f,
                "bomb": pygame.K_g,
            },
            ship_type=p1_ship_type,
        )

        # 플레이어 2 (방향키 + RSHIFT)
        self.p2 = Player(
            3 * WIDTH // 4,
            HEIGHT - 60,
            BLUE,
            {
                "left": pygame.K_LEFT,
                "right": pygame.K_RIGHT,
                "up": pygame.K_UP,
                "down": pygame.K_DOWN,
                "fire": pygame.K_RSHIFT,
                "bomb": pygame.K_RETURN,
            },
            ship_type=p2_ship_type,
        )

        self.lasers = []
        self.junks = []
        self.enemies = []
        self.enemy_bullets = []
        self.items = []
        self.allies = []
        self.special_projectiles = []
        self.explosions = []
        self.hit_sparks = []
        self.laser_trails = []
        self.engine_trail = EngineTrail()
        self.bg_manager = BackgroundManager()
        self.env_manager = EnvironmentManager()
        self.game_over = False
        self.game_paused = False
        self.spawn_manager.spawn_timer = 0

    # ---------------------------
    # 스폰 및 충돌 처리 (위임)
    # ---------------------------

    def spawn_junk(self):
        """적, 아이템, 쓰레기 스폰 (SpawnManager 위임)."""
        self.spawn_manager.update(
            1.0,  # dt (프레임 단위라 1.0)
            self.game_time,
            self.env_manager,
            self.enemies,
            self.junks,
            self.items,
            self.allies,
        )

    # ---------------------------
    # 충돌 검사
    # ---------------------------

    def check_collisions(self):
        """모든 충돌 검사 수행 (CollisionManager 위임)."""
        self.collision_manager.update()

    def _draw_hud_bar(self, surface, x, y, width, height, ratio, color):
        """HUD용 반투명 막대 그리기."""
        # 배경 (반투명 어두운 회색)
        bg_surf = pygame.Surface((width, height), pygame.SRCALPHA)
        bg_surf.fill((50, 50, 50, 100))
        surface.blit(bg_surf, (x, y))

        # 채우기 (반투명 색상)
        fill_width = int(width * max(0, min(1, ratio)))
        if fill_width > 0:
            fill_surf = pygame.Surface((fill_width, height), pygame.SRCALPHA)
            fill_surf.fill((*color, 150))
            surface.blit(fill_surf, (x, y))

        # 테두리 (반투명 흰색)
        border_surf = pygame.Surface((width, height), pygame.SRCALPHA)
        pygame.draw.rect(border_surf, (255, 255, 255, 80), (0, 0, width, height), 1)
        surface.blit(border_surf, (x, y))

    def run(self):
        """메인 게임 루프."""
        while True:
            if self.state == "select":
                self._handle_select_events()
                self._draw_select_screen()
            else:
                self.handle_events()
                if not self.game_over and not self.game_paused:
                    self.update()
                self.draw()
            self.clock.tick(FPS)

    # ---------------------------
    # 비행기 선택 화면
    # ---------------------------

    def _handle_select_events(self):
        """비행기 선택 화면 이벤트 처리."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                # P1 선택 (W/S로 전환, F로 확정)
                if not self.p1_confirmed:
                    if event.key == pygame.K_w:
                        self.p1_ship_index = (self.p1_ship_index - 1) % len(
                            SHIP_TYPE_KEYS
                        )
                    elif event.key == pygame.K_s:
                        self.p1_ship_index = (self.p1_ship_index + 1) % len(
                            SHIP_TYPE_KEYS
                        )
                    elif event.key == pygame.K_f:
                        self.p1_confirmed = True
                        if self.snd_powerup:
                            self.snd_powerup.play()
                else:
                    # 확정 취소
                    if event.key == pygame.K_g:
                        self.p1_confirmed = False

                # P2 선택 (↑/↓로 전환, RSHIFT로 확정)
                if not self.p2_confirmed:
                    if event.key == pygame.K_UP:
                        self.p2_ship_index = (self.p2_ship_index - 1) % len(
                            SHIP_TYPE_KEYS
                        )
                    elif event.key == pygame.K_DOWN:
                        self.p2_ship_index = (self.p2_ship_index + 1) % len(
                            SHIP_TYPE_KEYS
                        )
                    elif event.key == pygame.K_RSHIFT:
                        self.p2_confirmed = True
                        if self.snd_powerup:
                            self.snd_powerup.play()
                else:
                    if event.key == pygame.K_RETURN:
                        self.p2_confirmed = False

                # 두 플레이어 모두 확정되면 게임 시작
                if self.p1_confirmed and self.p2_confirmed:
                    self.state = "playing"
                    self.reset_game()

    def _draw_select_screen(self):
        """비행기 선택 화면 그리기."""
        self.select_blink_timer += 1
        self.screen.fill(BLACK)

        # 타이틀
        title = self.title_font.render("SELECT YOUR SHIP", True, WHITE)
        self.screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 30))

        # 구분선
        pygame.draw.line(
            self.screen, GREY, (WIDTH // 2, 80), (WIDTH // 2, HEIGHT - 50), 1
        )

        # P1 영역 (좌측)
        self._draw_ship_select_panel(
            x_center=WIDTH // 4,
            player_label="P1",
            player_color=RED,
            ship_index=self.p1_ship_index,
            confirmed=self.p1_confirmed,
            controls_text="W/S: Select  |  F: Confirm  |  G: Cancel",
        )

        # P2 영역 (우측)
        self._draw_ship_select_panel(
            x_center=3 * WIDTH // 4,
            player_label="P2",
            player_color=BLUE,
            ship_index=self.p2_ship_index,
            confirmed=self.p2_confirmed,
            controls_text="Up/Down: Select  |  RShift: Confirm  |  Enter: Cancel",
        )

        pygame.display.flip()

    def _draw_ship_select_panel(
        self, x_center, player_label, player_color, ship_index, confirmed, controls_text
    ):
        """플레이어 한 명의 비행기 선택 패널 그리기."""
        ship_key = SHIP_TYPE_KEYS[ship_index]
        ship_data = SHIP_TYPES[ship_key]

        # 플레이어 라벨
        label = self.large_font.render(player_label, True, player_color)
        self.screen.blit(label, (x_center - label.get_width() // 2, 80))

        # 비행기 미리보기 (임시 Player 생성)
        preview_player = Player(
            0,
            0,
            player_color,
            {"left": 0, "right": 0, "up": 0, "down": 0, "fire": 0, "bomb": 0},
            ship_type=ship_key,
        )
        # 미리보기 위치
        preview_y = 200
        preview_player._draw_ship(self.screen, x_center, preview_y, player_color)

        # 화살표 (위/아래)
        if not confirmed:
            arrow_alpha = int(150 + 100 * abs((self.select_blink_timer % 60) / 30 - 1))
            # 위 화살표
            pygame.draw.polygon(
                self.screen,
                WHITE,
                [
                    (x_center, preview_y - 30),
                    (x_center - 12, preview_y - 15),
                    (x_center + 12, preview_y - 15),
                ],
            )
            # 아래 화살표
            pygame.draw.polygon(
                self.screen,
                WHITE,
                [
                    (x_center, preview_y + 75),
                    (x_center - 12, preview_y + 60),
                    (x_center + 12, preview_y + 60),
                ],
            )

        # 비행기 이름
        name_color = ship_data["color_accent"]
        name_txt = self.title_font.render(ship_data["name"], True, name_color)
        self.screen.blit(name_txt, (x_center - name_txt.get_width() // 2, 290))

        # 설명
        desc_txt = self.font.render(ship_data["description"], True, GREY)
        self.screen.blit(desc_txt, (x_center - desc_txt.get_width() // 2, 340))

        # 스탯 바
        bar_x = x_center - 100
        bar_y = 380
        bar_width = 200
        bar_height = 16
        bar_gap = 30

        stats = [
            ("HP", ship_data["health"] / 220, GREEN),
            ("SPEED", ship_data["speed"] / 7.5, CYAN),
            ("BOMBS", ship_data["bombs"] / 4, ORANGE),
        ]

        # 무기 스타일 표시
        weapon_labels = {
            "normal": ("WEAPON: Balanced", WHITE),
            "spread": ("WEAPON: Spread Shot", (100, 200, 255)),
            "rapid": ("WEAPON: Rapid Fire", (200, 100, 255)),
            "power": ("WEAPON: Power Shot", (50, 255, 100)),
        }

        for i, (stat_name, ratio, color) in enumerate(stats):
            sy = bar_y + i * bar_gap
            # 라벨
            stat_label = self.small_font.render(stat_name, True, WHITE)
            self.screen.blit(stat_label, (bar_x, sy - 2))
            # 바 배경
            pygame.draw.rect(
                self.screen, (40, 40, 40), (bar_x + 55, sy, bar_width - 55, bar_height)
            )
            # 바 채우기
            fill_w = int((bar_width - 55) * ratio)
            pygame.draw.rect(self.screen, color, (bar_x + 55, sy, fill_w, bar_height))
            # 바 테두리
            pygame.draw.rect(
                self.screen, WHITE, (bar_x + 55, sy, bar_width - 55, bar_height), 1
            )

        # 무기 타입
        weapon_text, weapon_color = weapon_labels.get(
            ship_data["weapon_style"], ("WEAPON: Normal", WHITE)
        )
        weapon_txt = self.font.render(weapon_text, True, weapon_color)
        self.screen.blit(
            weapon_txt,
            (x_center - weapon_txt.get_width() // 2, bar_y + len(stats) * bar_gap + 5),
        )

        # 확정 상태
        if confirmed:
            blink = (self.select_blink_timer // 20) % 2 == 0
            if blink:
                ready_txt = self.title_font.render("READY!", True, YELLOW)
                self.screen.blit(
                    ready_txt, (x_center - ready_txt.get_width() // 2, 540)
                )
        else:
            # 조작법
            ctrl_txt = self.small_font.render(controls_text, True, GREY)
            self.screen.blit(ctrl_txt, (x_center - ctrl_txt.get_width() // 2, 560))

    def handle_events(self):
        """이벤트 처리."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                # ESC로 일시정지 토글
                if event.key == pygame.K_ESCAPE and not self.game_over:
                    self.game_paused = not self.game_paused

                # R키로 선택 화면으로 복귀 (게임 오버 또는 일시정지 중)
                if event.key == pygame.K_r and (self.game_over or self.game_paused):
                    self.state = "select"
                    self.p1_confirmed = False
                    self.p2_confirmed = False

                if not self.game_over and not self.game_paused:
                    if event.key == self.p1.controls["fire"] and self.p1.health > 0:
                        self._fire_weapon(self.p1)
                    if event.key == self.p2.controls["fire"] and self.p2.health > 0:
                        self._fire_weapon(self.p2)

                    # 폭탄 사용
                    if event.key == self.p1.controls["bomb"] and self.p1.health > 0:
                        self._use_bomb(self.p1)
                    if event.key == self.p2.controls["bomb"] and self.p2.health > 0:
                        self._use_bomb(self.p2)

    def _use_bomb(self, player):
        """폭탄 사용: 적 총알 제거, 장애물 파괴, 적에게 데미지."""
        if player.bomb_count > 0:
            player.bomb_count -= 1
            if self.snd_explosion:
                self.snd_explosion.play()

            # 강한 화면 흔들림
            self.screen_shake.trigger(intensity=20, duration=15)
            self.hit_stop = 10  # 폭탄 사용 시 연출 강화

            # 화면 전체 섬광 효과 (단순 폭발에서 더 화려하게)
            # 폭발을 시간차를 두고 여러 개 생성하거나, 랜덤 위치에 대량 생성
            for _ in range(25):  # 50개 -> 25개로 감소 (성능 최적화)
                self.explosions.append(
                    Explosion(
                        random.randint(0, WIDTH),
                        random.randint(0, HEIGHT),
                        random.choice([ORANGE, RED, WHITE, YELLOW]),  # 색상 다양화
                    )
                )

            # 적 총알 모두 제거
            self.enemy_bullets.clear()

            # 쓰레기(Junk) 모두 제거
            for junk in self.junks:
                self.explosions.append(
                    Explosion(junk.rect.centerx, junk.rect.centery, GREY)
                )
            self.junks.clear()

            # 적에게 데미지 (일반 적 즉사, HeavyEnemy 50 데미지)
            for enemy in self.enemies[:]:
                if hasattr(enemy, "health"):
                    enemy.health -= 50
                    self.explosions.append(
                        Explosion(enemy.rect.centerx, enemy.rect.centery, ORANGE)
                    )
                    if enemy.health <= 0:
                        self.enemies.remove(enemy)
                        # 대형 폭발 추가
                        for _ in range(6):  # 10개 -> 6개로 감소 (성능 최적화)
                            self.explosions.append(
                                Explosion(
                                    enemy.rect.centerx + random.randint(-40, 40),
                                    enemy.rect.centery + random.randint(-40, 40),
                                    RED,
                                )
                            )
                else:
                    self.enemies.remove(enemy)
                    self.explosions.append(
                        Explosion(enemy.rect.centerx, enemy.rect.centery, PURPLE)
                    )

    def _fire_weapon(self, player):
        """무기 레벨 또는 특수 무기에 따른 발사. 비행기 타입별 특성 반영."""
        px = player.rect.centerx
        py = player.rect.top
        color = player.color
        style = player.weapon_style

        # 특수 무기 우선
        if player.special_weapon == "homing":
            target = None
            if self.enemies:
                candidates = [
                    e
                    for e in self.enemies
                    if 0 < e.rect.centerx < WIDTH and 0 < e.rect.centery < HEIGHT
                ]
                if candidates:
                    target = random.choice(candidates)
            self.special_projectiles.append(
                HomingMissile(px, py, color, self.enemies, target)
            )
        elif player.special_weapon == "piercing":
            self.special_projectiles.append(PiercingLaser(px, py, color))
        elif player.special_weapon == "plasma":
            self.special_projectiles.append(PlasmaWave(px, py, color))
        else:
            # 비행기 타입별 무기 패턴
            if style == "spread":
                # Titan: 넓은 산탄
                self._fire_spread(px, py, color, player.weapon_level)
            elif style == "rapid":
                # Phantom: 빠른 레이저
                self._fire_rapid(px, py, color, player.weapon_level)
            elif style == "power":
                # Viper: 강력한 레이저
                self._fire_power(px, py, color, player.weapon_level)
            else:
                # Falcon: 기본
                self._fire_normal(px, py, color, player.weapon_level)

        # 분신 효과: 좌우에 추가 레이저 발사
        if player.clone_timer > 0:
            self.lasers.append(Laser(px - 50, py + 10, color))
            self.lasers.append(Laser(px + 50, py + 10, color))

        if self.snd_shoot:
            self.snd_shoot.play()

    def _fire_normal(self, px, py, color, weapon_level):
        """Falcon 기본 무기."""
        if weapon_level == 1:
            self.lasers.append(Laser(px, py, color))
        elif weapon_level == 2:
            self.lasers.append(Laser(px - 10, py, color))
            self.lasers.append(Laser(px + 10, py, color))
        elif weapon_level >= 3:
            self.lasers.append(Laser(px - 15, py + 5, color))
            self.lasers.append(Laser(px, py, color))
            self.lasers.append(Laser(px + 15, py + 5, color))

    def _fire_spread(self, px, py, color, weapon_level):
        """Titan 산탄 무기: 넓은 범위."""
        import math

        if weapon_level == 1:
            # 3발 산탄
            for angle in [-15, 0, 15]:
                laser = Laser(px, py, color)
                rad = math.radians(angle)
                laser.speed_x = math.sin(rad) * 3
                laser.speed = -9
                self.lasers.append(laser)
        elif weapon_level == 2:
            for angle in [-20, -7, 7, 20]:
                laser = Laser(px, py, color)
                rad = math.radians(angle)
                laser.speed_x = math.sin(rad) * 3
                laser.speed = -9
                self.lasers.append(laser)
        elif weapon_level >= 3:
            for angle in [-25, -12, 0, 12, 25]:
                laser = Laser(px, py, color)
                rad = math.radians(angle)
                laser.speed_x = math.sin(rad) * 3
                laser.speed = -9
                self.lasers.append(laser)

    def _fire_rapid(self, px, py, color, weapon_level):
        """Phantom 빠른 레이저: 속도 빠르고 가는 탕."""
        if weapon_level == 1:
            laser = Laser(px, py, color)
            laser.speed = -14
            self.lasers.append(laser)
        elif weapon_level == 2:
            for offset in [-8, 8]:
                laser = Laser(px + offset, py, color)
                laser.speed = -14
                self.lasers.append(laser)
        elif weapon_level >= 3:
            for offset in [-12, 0, 12]:
                laser = Laser(px + offset, py, color)
                laser.speed = -14
                self.lasers.append(laser)

    def _fire_power(self, px, py, color, weapon_level):
        """Viper 강력 레이저: 굵고 강한 레이저."""
        if weapon_level == 1:
            laser = Laser(px, py, color)
            laser.rect.width = 6  # 더 굵은 레이저
            self.lasers.append(laser)
        elif weapon_level == 2:
            for offset in [-8, 8]:
                laser = Laser(px + offset, py, color)
                laser.rect.width = 6
                self.lasers.append(laser)
        elif weapon_level >= 3:
            for offset in [-12, 0, 12]:
                laser = Laser(px + offset, py, color)
                laser.rect.width = 6
                self.lasers.append(laser)

    def update(self):
        """게임 상태 업데이트."""
        # 히트 스탑 처리
        if self.hit_stop > 0:
            self.hit_stop -= 1
            return

        # 게임 시간 업데이트 (초 단위)
        self.game_time += 1 / FPS

        # 화면 흔들림 업데이트
        self.screen_shake.update()

        # 환경 업데이트
        self.env_manager.update(
            self.enemies, self.enemy_bullets, self.junks, self.items
        )

        # 블랙홀 근접 데미지
        bh = self.env_manager.active_black_hole
        if bh and bh.is_active:
            for player in [self.p1, self.p2]:
                if player.health <= 0:
                    continue
                dx = bh.x - player.rect.centerx
                dy = bh.y - player.rect.centery
                dist = (dx**2 + dy**2) ** 0.5
                if dist < BLACK_HOLE_DAMAGE_RADIUS:
                    # 가까울수록 데미지 증가 (최대 2.5배)
                    intensity = 1.0 + 1.5 * (1.0 - dist / BLACK_HOLE_DAMAGE_RADIUS)
                    player.health -= BLACK_HOLE_DAMAGE_PER_FRAME * intensity
                    if player.health <= 0:
                        player.health = 0
                        if self.p1.health <= 0 and self.p2.health <= 0:
                            self.game_over = True

        # 배경 업데이트
        self.bg_manager.update()

        # 플레이어 업데이트 (타이머)
        self.p1.update()
        self.p2.update()

        # 플레이어 입력 (살아있을 때만)
        keys = pygame.key.get_pressed()
        if self.p1.health > 0:
            self.p1.handle_input(keys)
        if self.p2.health > 0:
            self.p2.handle_input(keys)

        # 플레이어 엔진 트레일 생성 (확률 감소, 살아있을 때만)
        if random.random() < 0.1:  # 30% -> 10%
            if self.p1.health > 0:
                self.engine_trail.emit(
                    self.p1.rect.centerx, self.p1.rect.bottom, self.p1.color
                )
            if self.p2.health > 0:
                self.engine_trail.emit(
                    self.p2.rect.centerx, self.p2.rect.bottom, self.p2.color
                )

        # 레이저 업데이트
        for laser in self.lasers[:]:
            laser.update()
            if laser.rect.bottom < 0 or laser.rect.right < 0 or laser.rect.left > WIDTH:
                self.lasers.remove(laser)

        # 특수 투사체 업데이트
        for proj in self.special_projectiles[:]:
            proj.update()
            # 화면 밖으로 나가면 제거
            if (
                proj.rect.bottom < 0
                or proj.rect.top > HEIGHT
                or proj.rect.left > WIDTH
                or proj.rect.right < 0
            ):
                if proj in self.special_projectiles:
                    self.special_projectiles.remove(proj)
                continue

            # 수명이 다한 경우 (HomingMissile, PlasmaWave)
            if hasattr(proj, "lifetime") and proj.lifetime <= 0:
                if proj in self.special_projectiles:
                    self.special_projectiles.remove(proj)
                continue

        # 지원군 업데이트
        for ally in self.allies[:]:
            ally.update(self.enemies, self.special_projectiles)
            if ally.state == "leave" and ally.rect.top > HEIGHT:
                self.allies.remove(ally)

        # 쓰레기 업데이트
        slow_factor = 0.5 if (self.p1.slow_timer > 0 or self.p2.slow_timer > 0) else 1.0
        for junk in self.junks[:]:
            # 슬로우 타임 효과 적용
            if slow_factor < 1.0:
                # 속도를 절반으로
                original_y = junk.speed_y
                original_x = junk.speed_x
                junk.speed_y *= slow_factor
                junk.speed_x *= slow_factor
                junk.update()
                junk.speed_y = original_y
                junk.speed_x = original_x
            else:
                junk.update()
            if junk.rect.top > HEIGHT:
                self.junks.remove(junk)

        # 적 업데이트
        for enemy in self.enemies[:]:
            if isinstance(enemy, SniperEnemy):
                enemy.update(self.enemy_bullets, [self.p1, self.p2])
            elif isinstance(enemy, KamikazeEnemy):
                enemy.update(self.enemy_bullets, [self.p1, self.p2])
                # 자폭 적이 플레이어에게 근접하면 폭발
                if enemy.is_close_to_target(threshold=40):
                    # 폭발 효과
                    for _ in range(15):
                        self.explosions.append(
                            Explosion(
                                enemy.rect.centerx + random.randint(-30, 30),
                                enemy.rect.centery + random.randint(-30, 30),
                                ORANGE,
                            )
                        )
                    # 화면 흔들림
                    self.screen_shake.trigger(intensity=15, duration=12)
                    # 범위 데미지
                    for player in [self.p1, self.p2]:
                        dx = player.rect.centerx - enemy.rect.centerx
                        dy = player.rect.centery - enemy.rect.centery
                        dist = (dx**2 + dy**2) ** 0.5
                        if dist < KAMIKAZE_EXPLOSION_RADIUS:
                            player.health -= DAMAGE_KAMIKAZE_EXPLOSION
                            if self.p1.health <= 0 and self.p2.health <= 0:
                                self.game_over = True
                    # 적 제거
                    if enemy in self.enemies:
                        self.enemies.remove(enemy)
            elif isinstance(enemy, FloatingMine):
                enemy.update(self.enemy_bullets, [self.p1, self.p2])
                # 떠다니는 기뢰가 폭발 조건 충족 시
                if enemy.should_explode():
                    # 폭발 효과 (더 큰 폭발)
                    for _ in range(20):
                        self.explosions.append(
                            Explosion(
                                enemy.rect.centerx + random.randint(-40, 40),
                                enemy.rect.centery + random.randint(-40, 40),
                                random.choice([GREEN, YELLOW, WHITE]),
                            )
                        )
                    # 화면 흔들림
                    self.screen_shake.trigger(intensity=18, duration=15)
                    if self.snd_explosion:
                        self.snd_explosion.play()
                    # 범위 데미지
                    for player in [self.p1, self.p2]:
                        dx = player.rect.centerx - enemy.rect.centerx
                        dy = player.rect.centery - enemy.rect.centery
                        dist = (dx**2 + dy**2) ** 0.5
                        if dist < FLOATING_MINE_EXPLOSION_RADIUS:
                            player.health -= DAMAGE_FLOATING_MINE
                            if self.p1.health <= 0 and self.p2.health <= 0:
                                self.game_over = True
                    # 적 제거
                    if enemy in self.enemies:
                        self.enemies.remove(enemy)
            elif isinstance(enemy, BossCarrier):
                enemy.update(self.enemy_bullets, [self.p1, self.p2])
                # 드론 소환 처리
                drones = enemy.get_pending_drones()
                for drone in drones:
                    self.enemies.append(drone)
            elif isinstance(enemy, CarrierDrone):
                enemy.update(self.enemy_bullets, [self.p1, self.p2])
                # 수명 만료 시 제거
                if enemy.is_expired():
                    if enemy in self.enemies:
                        self.enemies.remove(enemy)
            else:
                enemy.update(self.enemy_bullets)
            if enemy.rect.top > HEIGHT:
                if enemy in self.enemies:
                    self.enemies.remove(enemy)

        # 적 총알 업데이트
        for bullet in self.enemy_bullets[:]:
            bullet.update()
            if bullet.rect.top > HEIGHT:
                self.enemy_bullets.remove(bullet)

        # 아이템 업데이트
        for item in self.items[:]:
            item.update()

            # 자석 효과: magnet_timer가 활성화된 플레이어에게 끌려감
            for player in [self.p1, self.p2]:
                if player.health > 0 and player.magnet_timer > 0:
                    dx = player.rect.centerx - item.rect.centerx
                    dy = player.rect.centery - item.rect.centery
                    dist = (dx**2 + dy**2) ** 0.5
                    if dist > 0 and dist < 300:  # 300픽셀 이내 아이템만 끌어당김
                        # 거리에 반비례하는 끌어당기는 힘
                        pull_strength = min(8, 200 / max(dist, 1))
                        item.rect.x += int((dx / dist) * pull_strength)
                        item.rect.y += int((dy / dist) * pull_strength)

            if item.rect.top > HEIGHT:
                self.items.remove(item)

        # 폭발 업데이트
        for exp in self.explosions[:]:
            exp.update()
            if exp.timer > 60:  # 20 -> 60으로 증가 (잔상이 다 사라질 때까지 대기)
                self.explosions.remove(exp)

        # 히트 스파크 업데이트
        for spark in self.hit_sparks[:]:
            spark.update()
            if spark.is_finished():
                self.hit_sparks.remove(spark)

        # 레이저 트레일 업데이트
        for trail in self.laser_trails[:]:
            trail.update()
            if trail.is_finished():
                self.laser_trails.remove(trail)

        # 엔진 트레일 업데이트
        self.engine_trail.update()

        # 스폰 및 충돌 검사
        self.spawn_junk()
        self.check_collisions()

    def draw(self):
        """화면 렌더링."""
        self.screen.fill(BLACK)

        # 화면 흔들림을 위한 오프셋 서피스 생성
        shake_surface = pygame.Surface((WIDTH, HEIGHT))
        shake_surface.fill(BLACK)

        # 환경 요소 그리기 (블랙홀 등)
        self.env_manager.draw(shake_surface)

        # 지원군 그리기
        for ally in self.allies:
            ally.draw(shake_surface)

        # 배경
        self.bg_manager.draw(shake_surface)

        if not self.game_over:
            # 파티클 (뒤쪽 레이어)
            self.engine_trail.draw(shake_surface)
            for trail in self.laser_trails:
                trail.draw(shake_surface)

            # 게임 엔티티
            self.p1.draw(shake_surface)
            self.p2.draw(shake_surface)
            for laser in self.lasers:
                laser.draw(shake_surface)
            for proj in self.special_projectiles:
                proj.draw(shake_surface)
            for junk in self.junks:
                junk.draw(shake_surface)
            for enemy in self.enemies:
                enemy.draw(shake_surface)
            for bullet in self.enemy_bullets:
                bullet.draw(shake_surface)
            for item in self.items:
                item.draw(shake_surface)

            # 폭발과 스파크 (앞쪽 레이어)
            for exp in self.explosions:
                exp.draw(shake_surface)
            for spark in self.hit_sparks:
                spark.draw(shake_surface)

            # HUD (흔들림 영향 없음)
            p1_score_txt = self.font.render(f"P1 (RED): {self.p1.score}", True, RED)
            # P2는 점수가 왼쪽에 오도록 형식 변경
            p2_score_txt = self.font.render(f"{self.p2.score} :P2 (BLUE)", True, BLUE)
            shake_surface.blit(p1_score_txt, (20, 20))
            # P2 점수는 오른쪽 정렬 (화면 오른쪽 끝에서 20픽셀 여백)
            shake_surface.blit(
                p2_score_txt, (WIDTH - p2_score_txt.get_width() - 20, 20)
            )

            # 폭탄 개수 표시
            p1_bomb_txt = self.font.render(f"Bomb: {self.p1.bomb_count}", True, ORANGE)
            # P2는 숫자가 왼쪽에 오도록 형식 변경
            p2_bomb_txt = self.font.render(f"{self.p2.bomb_count} :Bomb", True, ORANGE)
            shake_surface.blit(p1_bomb_txt, (20, 50))
            # P2 폭탄도 오른쪽 정렬
            shake_surface.blit(p2_bomb_txt, (WIDTH - p2_bomb_txt.get_width() - 20, 50))

            # 체력바 표시 (HUD) - 작고 반투명하게 변경
            self._draw_hud_bar(
                shake_surface,
                20,
                80,
                120,
                10,
                self.p1.health / self.p1.max_health,
                GREEN,
            )
            # P2 체력바도 오른쪽 정렬
            self._draw_hud_bar(
                shake_surface,
                WIDTH - 120 - 20,  # 체력바 너비(120) + 여백(20)
                80,
                120,
                10,
                self.p2.health / self.p2.max_health,
                GREEN,
            )

        # 화면 흔들림 적용하여 메인 화면에 블릿
        self.screen.blit(
            shake_surface, (self.screen_shake.offset_x, self.screen_shake.offset_y)
        )

        if self.game_paused:
            # 일시정지 오버레이
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 150))
            self.screen.blit(overlay, (0, 0))

            pause_txt = self.large_font.render("PAUSED", True, YELLOW)
            resume_txt = self.font.render("Press ESC to Resume", True, WHITE)
            restart_txt = self.font.render("Press 'R' to Restart", True, WHITE)
            quit_txt = self.font.render("Close Window to Quit", True, WHITE)

            self.screen.blit(
                pause_txt, (WIDTH // 2 - pause_txt.get_width() // 2, HEIGHT // 2 - 80)
            )
            self.screen.blit(
                resume_txt, (WIDTH // 2 - resume_txt.get_width() // 2, HEIGHT // 2)
            )
            self.screen.blit(
                restart_txt,
                (WIDTH // 2 - restart_txt.get_width() // 2, HEIGHT // 2 + 40),
            )
            self.screen.blit(
                quit_txt, (WIDTH // 2 - quit_txt.get_width() // 2, HEIGHT // 2 + 80)
            )
        elif self.game_over:
            # 게임 오버 화면
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            self.screen.blit(overlay, (0, 0))

            go_txt = self.large_font.render("GAME OVER", True, YELLOW)
            sco_txt = self.font.render(
                f"P1 Total: {self.p1.score} | P2 Total: {self.p2.score}", True, WHITE
            )
            res_txt = self.font.render("Press 'R' to Restart", True, WHITE)

            self.screen.blit(
                go_txt, (WIDTH // 2 - go_txt.get_width() // 2, HEIGHT // 2 - 100)
            )
            self.screen.blit(
                sco_txt, (WIDTH // 2 - sco_txt.get_width() // 2, HEIGHT // 2)
            )
            self.screen.blit(
                res_txt, (WIDTH // 2 - res_txt.get_width() // 2, HEIGHT // 2 + 50)
            )

        pygame.display.flip()


if __name__ == "__main__":
    game = Game()
    game.run()
