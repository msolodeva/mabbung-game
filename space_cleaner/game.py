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
)
from sound import generate_sound
from background import BackgroundManager
from entities import Player, Laser, Item, Explosion, EngineTrail, HitSpark, LaserTrail
from enemies import (
    Enemy,
    HeavyEnemy,
    Interceptor,
    SniperEnemy,
    GhostEnemy,
    SplitEnemy,
    LaserEnemy,
    KamikazeEnemy,
    MiniEnemy,
)
from weapons import HomingMissile, PiercingLaser, PlasmaWave
from environment import EnvironmentManager
from junk import Junk


class ScreenShake:
    """
    화면 흔들림 효과 클래스.
    카메라 오프셋을 랜덤하게 조정하여 진동 효과 생성.
    """

    def __init__(self):
        self.offset_x = 0
        self.offset_y = 0
        self.intensity = 0
        self.duration = 0

    def trigger(self, intensity=10, duration=10):
        """
        화면 흔들림 시작.
        Args:
            intensity: 흔들림의 강도 (픽셀 단위)
            duration: 지속 시간 (프레임)
        """
        self.intensity = intensity
        self.duration = duration

    def update(self):
        """화면 흔들림 업데이트."""
        if self.duration > 0:
            self.duration -= 1
            # 랜덤 오프셋 생성 (정수로 변환)
            intensity_int = int(self.intensity)
            self.offset_x = random.randint(-intensity_int, intensity_int)
            self.offset_y = random.randint(-intensity_int, intensity_int)
            # 시간이 지나면서 감쇠
            self.intensity = max(0, self.intensity - 0.5)
        else:
            self.offset_x = 0
            self.offset_y = 0
            self.intensity = 0


class Game:
    """
    메인 게임 클래스.
    - 게임 루프 (이벤트 처리, 업데이트, 렌더링)
    - 엔티티 관리 (플레이어, 적, 레이저 등)
    - 충돌 검사 및 점수/체력 관리
    """

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Space Cleaner")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 24)
        self.large_font = pygame.font.SysFont("Arial", 64)

        # 사운드 초기화
        self._init_sounds()

        # 화면 흔들림 시스템
        self.screen_shake = ScreenShake()

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

        # 게임 상태 리셋
        self.game_over = False
        self.game_paused = False

        # 플레이어 1 (WASD + LSHIFT)
        self.p1 = Player(
            WIDTH // 4,
            HEIGHT - 60,
            RED,
            {
                "left": pygame.K_a,
                "right": pygame.K_d,
                "up": pygame.K_w,
                "down": pygame.K_s,
                "fire": pygame.K_LSHIFT,
                "bomb": pygame.K_SPACE,
            },
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
        )

        self.lasers = []
        self.junks = []
        self.enemies = []
        self.enemy_bullets = []
        self.items = []
        self.special_projectiles = []
        self.explosions = []
        self.hit_sparks = []
        self.laser_trails = []
        self.engine_trail = EngineTrail()
        self.bg_manager = BackgroundManager()
        self.env_manager = EnvironmentManager()
        self.game_over = False
        self.game_paused = False
        self.spawn_timer = 0

    # ---------------------------
    # 스폰 로직
    # ---------------------------

    def spawn_junk(self):
        """적, 아이템, 쓰레기 스폰."""
        # 환경 스폰 배율 가져오기
        spawn_mul = self.env_manager.get_spawn_multiplier()

        # 난이도 계산: 60초마다 난이도 1.0 증가 (기존 45초에서 늦춤)
        elapsed_seconds = (pygame.time.get_ticks() - self.start_ticks) / 1000
        difficulty = 1.0 + (elapsed_seconds / 60.0)

        # 난이도가 오를수록 스폰 주기 빨라짐 (더 완만하게 조정)
        spawn_threshold = max(5, (45 - int((difficulty - 1) * 8)) // int(spawn_mul))

        self.spawn_timer += 1
        if self.spawn_timer > spawn_threshold:
            r = random.random()

            # 난이도가 오를수록 적 생성 확률 증가 (더 완만하게 조정)
            enemy_prob = min(0.35, 0.12 + (difficulty - 1) * 0.05)

            if r < enemy_prob:
                # HeavyEnemy 발생 빈도 감소 및 등장 시점 조절
                # 한번에 최대 1개만 출현하도록 제한 추가
                has_heavy = any(isinstance(e, HeavyEnemy) for e in self.enemies)

                # 모든 종류의 적이 처음부터 출현 가능하도록 변경
                r2 = random.random()
                if not has_heavy and r2 < 0.04:
                    self.enemies.append(HeavyEnemy(difficulty))
                elif r2 < 0.12:  # 고속 요격기
                    self.enemies.append(Interceptor(difficulty))
                elif r2 < 0.20:  # 저격수
                    self.enemies.append(SniperEnemy(difficulty))
                elif r2 < 0.28:  # 유령 적
                    self.enemies.append(GhostEnemy(difficulty))
                elif r2 < 0.36:  # 분열 적 (신규)
                    self.enemies.append(SplitEnemy(difficulty))
                elif r2 < 0.42:  # 회전 레이저 적 (신규)
                    self.enemies.append(LaserEnemy(difficulty))
                elif r2 < 0.48:  # 자폭 적 (신규)
                    self.enemies.append(KamikazeEnemy(difficulty))
                else:
                    self.enemies.append(Enemy(difficulty))
            elif r < enemy_prob + 0.02:
                self.items.append(Item())
            else:
                self.junks.append(Junk(difficulty))
            self.spawn_timer = 0

    # ---------------------------
    # 충돌 검사
    # ---------------------------

    def check_collisions(self):
        """모든 충돌 검사 수행."""
        self._check_laser_junk_collisions()
        self._check_player_junk_collisions()
        self._check_laser_enemy_collisions()
        self._check_enemy_bullet_player_collisions()
        self._check_enemy_player_collisions()
        self._check_item_collisions()
        self._check_laser_beam_player_collisions()

    def _check_laser_junk_collisions(self):
        """레이저-쓰레기 충돌: 색상 매칭 시 점수 획득."""
        for laser in self.lasers[:]:
            for junk in self.junks[:]:
                if laser.rect.colliderect(junk.rect):
                    if laser.color == junk.color:
                        # 색상 매칭 성공
                        if laser.color == RED:
                            self.p1.score += 10
                        else:
                            self.p2.score += 10
                        self.explosions.append(
                            Explosion(junk.rect.centerx, junk.rect.centery, YELLOW)
                        )
                        if self.snd_explosion:
                            self.snd_explosion.play()
                    else:
                        # 색상 불일치 (페널티)
                        if laser.color == RED:
                            self.p1.score -= 5
                        else:
                            self.p2.score -= 5
                        self.explosions.append(
                            Explosion(junk.rect.centerx, junk.rect.centery, GREY)
                        )

                    if junk in self.junks:
                        self.junks.remove(junk)
                    if laser in self.lasers:
                        self.lasers.remove(laser)
                    break

    def _check_player_junk_collisions(self):
        """플레이어-쓰레기 충돌: 체력 감소."""
        for junk in self.junks[:]:
            hit_p1 = self.p1.rect.colliderect(junk.rect)
            hit_p2 = self.p2.rect.colliderect(junk.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    if self.p1.has_shield:
                        # 쉴드가 피격 흡수
                        self.p1.has_shield = False
                        self.explosions.append(
                            Explosion(self.p1.rect.centerx, self.p1.rect.centery, CYAN)
                        )
                    else:
                        self.p1.health -= 15
                if hit_p2:
                    if self.p2.has_shield:
                        # 쉴드가 피격 흡수
                        self.p2.has_shield = False
                        self.explosions.append(
                            Explosion(self.p2.rect.centerx, self.p2.rect.centery, CYAN)
                        )
                    else:
                        self.p2.health -= 15

                # 화면 흔들림 (중간 강도)
                self.screen_shake.trigger(intensity=8, duration=8)

                if junk in self.junks:
                    self.junks.remove(junk)

                if self.p1.health <= 0 or self.p2.health <= 0:
                    self.game_over = True

    def _check_laser_enemy_collisions(self):
        """레이저/특수 무기-적 충돌: 점수 획득 및 폭발."""
        # 일반 레이저 충돌
        self._collide_projectiles_with_enemies(self.lasers)
        # 특수 무기 충돌
        self._collide_projectiles_with_enemies(
            self.special_projectiles, is_special=True
        )

    def _collide_projectiles_with_enemies(self, projectiles, is_special=False):
        for proj in projectiles[:]:
            for enemy in self.enemies[:]:
                if proj.rect.colliderect(enemy.rect):
                    if enemy in self.enemies:
                        # 유령 상태일 때 무시
                        if getattr(enemy, "is_ghost", False):
                            continue

                        # 관통 레이저인 경우 이미 맞은 적인지 확인
                        if isinstance(proj, PiercingLaser):
                            if enemy in proj.hit_enemies:
                                continue
                            proj.hit_enemies.add(enemy)

                        # 히트 스파크 생성
                        self.hit_sparks.append(
                            HitSpark(proj.rect.centerx, proj.rect.centery, ORANGE)
                        )

                        # 체력이 있는 적 처리
                        if hasattr(enemy, "health"):
                            damage = 20 if is_special else 10
                            enemy.health -= damage
                            if enemy.health <= 0:
                                self.enemies.remove(enemy)
                                # SplitEnemy 처리
                                if isinstance(enemy, SplitEnemy):
                                    self.enemies.extend(enemy.on_death())
                                # 폭발 및 흔들림
                                for _ in range(3):
                                    self.explosions.append(
                                        Explosion(
                                            enemy.rect.centerx
                                            + random.randint(-20, 20),
                                            enemy.rect.centery
                                            + random.randint(-20, 20),
                                            RED,
                                        )
                                    )
                                self.screen_shake.trigger(12, 12)
                                if self.snd_explosion:
                                    self.snd_explosion.play()
                                self.p1.score += 100  # 간단하게 P1 점수로 합산 (실제로는 발사자 구분이 필요하지만 일단 단순화)
                        else:
                            # 일반 적 원샷
                            self.enemies.remove(enemy)
                            self.explosions.append(
                                Explosion(
                                    enemy.rect.centerx, enemy.rect.centery, PURPLE
                                )
                            )
                            if self.snd_explosion:
                                self.snd_explosion.play()
                            self.p1.score += 20

                    # 투사체 제거 여부 결정
                    if not isinstance(proj, (PiercingLaser, PlasmaWave)):
                        if proj in projectiles:
                            projectiles.remove(proj)
                        break

    def _check_enemy_bullet_player_collisions(self):
        """적 총알-플레이어 충돌: 체력 감소."""
        for bullet in self.enemy_bullets[:]:
            hit_p1 = self.p1.rect.colliderect(bullet.rect)
            hit_p2 = self.p2.rect.colliderect(bullet.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    if self.p1.has_shield:
                        self.p1.has_shield = False
                        self.explosions.append(
                            Explosion(self.p1.rect.centerx, self.p1.rect.centery, CYAN)
                        )
                    else:
                        self.p1.health -= 10
                if hit_p2:
                    if self.p2.has_shield:
                        self.p2.has_shield = False
                        self.explosions.append(
                            Explosion(self.p2.rect.centerx, self.p2.rect.centery, CYAN)
                        )
                    else:
                        self.p2.health -= 10

                if bullet in self.enemy_bullets:
                    self.enemy_bullets.remove(bullet)

                if self.p1.health <= 0 or self.p2.health <= 0:
                    self.game_over = True

    def _check_enemy_player_collisions(self):
        """적 기체-플레이어 충돌: 체력 대폭 감소."""
        for enemy in self.enemies[:]:
            hit_p1 = self.p1.rect.colliderect(enemy.rect)
            hit_p2 = self.p2.rect.colliderect(enemy.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    self.p1.health -= 20
                if hit_p2:
                    self.p2.health -= 20

                # 강한 화면 흔들림
                self.screen_shake.trigger(intensity=15, duration=10)

                if enemy in self.enemies:
                    self.enemies.remove(enemy)

                if self.p1.health <= 0 or self.p2.health <= 0:
                    self.game_over = True

    def _check_item_collisions(self):
        """아이템 수집: 무기 강화 또는 체력 회복."""
        for item in self.items[:]:
            if self.p1.rect.colliderect(item.rect):
                if item in self.items:
                    self.items.remove(item)
                    if self.snd_powerup:
                        self.snd_powerup.play()
                    self.explosions.append(
                        Explosion(item.rect.centerx, item.rect.centery, item.color)
                    )

                    if item.kind == "weapon":
                        r_weapon = random.choice(["homing", "piercing", "plasma"])
                        self.p1.special_weapon = r_weapon
                        self.p1.special_weapon_timer = 600  # 10초
                    elif item.kind == "health":
                        self.p1.health = min(self.p1.max_health, self.p1.health + 30)
                    elif item.kind == "bomb":
                        self.p1.bomb_count = min(
                            self.p1.max_bombs, self.p1.bomb_count + 1
                        )
                    elif item.kind == "shield":
                        self.p1.has_shield = True
                    elif item.kind == "magnet":
                        self.p1.magnet_timer = 600  # 10초
                    elif item.kind == "slow":
                        self.p1.slow_timer = 300  # 5초
                    elif item.kind == "clone":
                        self.p1.clone_timer = 480  # 8초

            elif self.p2.rect.colliderect(item.rect):
                if item in self.items:
                    self.items.remove(item)
                    if self.snd_powerup:
                        self.snd_powerup.play()
                    self.explosions.append(
                        Explosion(item.rect.centerx, item.rect.centery, item.color)
                    )

                    if item.kind == "weapon":
                        r_weapon = random.choice(["homing", "piercing", "plasma"])
                        self.p2.special_weapon = r_weapon
                        self.p2.special_weapon_timer = 600
                    elif item.kind == "health":
                        self.p2.health = min(self.p2.max_health, self.p2.health + 30)
                    elif item.kind == "bomb":
                        self.p2.bomb_count = min(
                            self.p2.max_bombs, self.p2.bomb_count + 1
                        )
                    elif item.kind == "shield":
                        self.p2.has_shield = True
                    elif item.kind == "magnet":
                        self.p2.magnet_timer = 600  # 10초
                    elif item.kind == "slow":
                        self.p2.slow_timer = 300  # 5초
                    elif item.kind == "clone":
                        self.p2.clone_timer = 480  # 8초

    def _check_laser_beam_player_collisions(self):
        """LaserEnemy의 회전 레이저 빔과 플레이어 충돌 검사."""
        for enemy in self.enemies:
            if isinstance(enemy, LaserEnemy):
                laser_line = enemy.get_laser_line()
                if laser_line:
                    # 선분과 플레이어 rect의 충돌 검사
                    for player in [self.p1, self.p2]:
                        if player.health > 0:
                            # 간단한 거리 기반 충돌 검사
                            if (
                                self._point_to_line_distance(
                                    player.rect.center, laser_line[0], laser_line[1]
                                )
                                < 20
                            ):
                                # 지속 데미지 (매 프레임 1 데미지)
                                player.health -= 1
                                # 약한 화면 흔들림
                                if random.random() < 0.1:
                                    self.screen_shake.trigger(intensity=3, duration=3)
                                # 히트 스파크
                                if random.random() < 0.3:
                                    self.hit_sparks.append(
                                        HitSpark(
                                            player.rect.centerx,
                                            player.rect.centery,
                                            RED,
                                        )
                                    )
                                if player.health <= 0:
                                    self.game_over = True

    def _point_to_line_distance(self, point, line_start, line_end):
        """점과 선분 사이의 거리 계산."""
        px, py = point
        x1, y1 = line_start
        x2, y2 = line_end

        # 선분의 길이
        line_len_sq = (x2 - x1) ** 2 + (y2 - y1) ** 2
        if line_len_sq == 0:
            return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5

        # 점에서 선분으로의 수직선이 선분 위에 있는 비율
        t = max(
            0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / line_len_sq)
        )

        # 가장 가까운 점
        closest_x = x1 + t * (x2 - x1)
        closest_y = y1 + t * (y2 - y1)

        # 거리 반환
        return ((px - closest_x) ** 2 + (py - closest_y) ** 2) ** 0.5

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
            self.handle_events()
            if not self.game_over and not self.game_paused:
                self.update()
            self.draw()
            self.clock.tick(FPS)

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

                # R키로 재시작 (게임 오버 또는 일시정지 중)
                if event.key == pygame.K_r and (self.game_over or self.game_paused):
                    self.reset_game()

                if not self.game_over and not self.game_paused:
                    if event.key == self.p1.controls["fire"]:
                        self._fire_weapon(self.p1)
                    if event.key == self.p2.controls["fire"]:
                        self._fire_weapon(self.p2)

                    # 폭탄 사용
                    if event.key == self.p1.controls["bomb"]:
                        self._use_bomb(self.p1)
                    if event.key == self.p2.controls["bomb"]:
                        self._use_bomb(self.p2)

    def _use_bomb(self, player):
        """폭탄 사용: 적 총알 제거, 장애물 파괴, 적에게 데미지."""
        if player.bomb_count > 0:
            player.bomb_count -= 1
            if self.snd_explosion:
                self.snd_explosion.play()

            # 강한 화면 흔들림
            self.screen_shake.trigger(intensity=20, duration=15)

            # 화면 전체 섬광 효과 (단순 폭발에서 더 화려하게)
            # 폭발을 시간차를 두고 여러 개 생성하거나, 랜덤 위치에 대량 생성
            for _ in range(50):  # 20개 -> 50개로 증가
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
                        for _ in range(10):  # 5개 -> 10개로 증가
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
        """무기 레벨 또는 특수 무기에 따른 발사."""
        px = player.rect.centerx
        py = player.rect.top
        color = player.color

        # 특수 무기 우선
        if player.special_weapon == "homing":
            self.special_projectiles.append(HomingMissile(px, py, color, self.enemies))
        elif player.special_weapon == "piercing":
            self.special_projectiles.append(PiercingLaser(px, py, color))
        elif player.special_weapon == "plasma":
            self.special_projectiles.append(PlasmaWave(px, py, color))
        else:
            # 기본 무기
            if player.weapon_level == 1:
                self.lasers.append(Laser(px, py, color))
            elif player.weapon_level == 2:
                self.lasers.append(Laser(px - 10, py, color))
                self.lasers.append(Laser(px + 10, py, color))
            elif player.weapon_level >= 3:
                self.lasers.append(Laser(px - 15, py + 5, color))
                self.lasers.append(Laser(px, py, color))
                self.lasers.append(Laser(px + 15, py + 5, color))

        # 분신 효과: 좌우에 추가 레이저 발사
        if player.clone_timer > 0:
            # 분신은 기본 레이저만 발사하도록 함 (밸런스)
            self.lasers.append(Laser(px - 50, py + 10, color))
            self.lasers.append(Laser(px + 50, py + 10, color))

        if self.snd_shoot:
            self.snd_shoot.play()

    def update(self):
        """게임 상태 업데이트."""
        # 화면 흔들림 업데이트
        self.screen_shake.update()

        # 환경 업데이트
        self.env_manager.update(
            self.enemies, self.enemy_bullets, self.junks, self.items
        )

        # 배경 업데이트
        self.bg_manager.update()

        # 플레이어 업데이트 (타이머)
        self.p1.update()
        self.p2.update()

        # 플레이어 입력
        keys = pygame.key.get_pressed()
        self.p1.handle_input(keys)
        self.p2.handle_input(keys)

        # 플레이어 엔진 트레일 생성 (확률 감소)
        if random.random() < 0.1:  # 30% -> 10%
            self.engine_trail.emit(
                self.p1.rect.centerx, self.p1.rect.bottom, self.p1.color
            )
            self.engine_trail.emit(
                self.p2.rect.centerx, self.p2.rect.bottom, self.p2.color
            )

        # 레이저 업데이트
        for laser in self.lasers[:]:
            laser.update()
            if laser.rect.bottom < 0:
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
                    # 범위 데미지 (50 픽셀 내 플레이어)
                    for player in [self.p1, self.p2]:
                        dx = player.rect.centerx - enemy.rect.centerx
                        dy = player.rect.centery - enemy.rect.centery
                        dist = (dx**2 + dy**2) ** 0.5
                        if dist < 80:
                            player.health -= 25
                            if player.health <= 0:
                                self.game_over = True
                    # 적 제거
                    if enemy in self.enemies:
                        self.enemies.remove(enemy)
            else:
                enemy.update(self.enemy_bullets)
            if enemy.rect.top > HEIGHT:
                self.enemies.remove(enemy)

        # 적 총알 업데이트
        for bullet in self.enemy_bullets[:]:
            bullet.update()
            if bullet.rect.top > HEIGHT:
                self.enemy_bullets.remove(bullet)

        # 아이템 업데이트
        for item in self.items[:]:
            item.update()

            # 자석 효과: 플레이어에게 끌려감
            for player in [self.p1, self.p2]:
                if player.magnet_timer > 0:
                    dx = player.rect.centerx - item.rect.centerx
                    dy = player.rect.centery - item.rect.centery
                    dist = (dx**2 + dy**2) ** 0.5
                    if dist > 0 and dist < 200:  # 200px 범위 내
                        pull_speed = 8
                        item.x += (dx / dist) * pull_speed
                        item.y += (dy / dist) * pull_speed
                        item.rect.x = int(item.x)
                        item.rect.y = int(item.y)

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
            p2_score_txt = self.font.render(f"P2 (BLUE): {self.p2.score}", True, BLUE)
            shake_surface.blit(p1_score_txt, (20, 20))
            shake_surface.blit(p2_score_txt, (WIDTH - 180, 20))

            # 폭탄 개수 표시
            p1_bomb_txt = self.font.render(f"Bomb: {self.p1.bomb_count}", True, ORANGE)
            p2_bomb_txt = self.font.render(f"Bomb: {self.p2.bomb_count}", True, ORANGE)
            shake_surface.blit(p1_bomb_txt, (20, 50))
            shake_surface.blit(p2_bomb_txt, (WIDTH - 180, 50))

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
            self._draw_hud_bar(
                shake_surface,
                WIDTH - 180,
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
