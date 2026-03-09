# enemies.py
# 적 유닛: UFO, 헤비급 함선, 적 총알

import pygame
import random
import math

from constants import (
    WIDTH,
    HEIGHT,
    YELLOW,
    RED,
    PURPLE,
    GREEN,
    DARK_GREY,
    CYAN,
    WHITE,
    BLUE,
    ORANGE,
    ENEMY_BASE_SPEED_Y,
    ENEMY_FIRE_RATE_MIN,
    ENEMY_FIRE_RATE_MAX,
    HEAVY_ENEMY_HEALTH_BASE,
    HEAVY_ENEMY_HEALTH_SCALE,
    HEAVY_ENEMY_FIRE_RATE_BASE,
    INTERCEPTOR_SPEED_Y,
    SNIPER_FIRE_RATE_BASE,
    GHOST_PHASE_DURATION,
    SPLIT_ENEMY_HEALTH_BASE,
    SPLIT_ENEMY_HEALTH_SCALE,
    LASER_ENEMY_HEALTH_BASE,
    LASER_ENEMY_HEALTH_SCALE,
    LASER_ENEMY_ROTATION_SPEED_BASE,
    KAMIKAZE_SPEED_BASE,
    FLOATING_MINE_DRIFT_SPEED,
    FLOATING_MINE_DETECTION_RADIUS,
    BOSS_CARRIER_HEALTH_BASE,
    BOSS_CARRIER_HEALTH_SCALE,
    BOSS_CARRIER_FIRE_RATE,
    BOSS_CARRIER_PHASE_DURATION,
    BOSS_CARRIER_DRONE_SPEED,
)


class EnemyBullet:
    """
    적이 발사하는 총알.
    방향 속도(vx, vy)를 가짐.
    """

    def __init__(self, x, y, vx, vy):
        self.rect = pygame.Rect(x - 3, y, 6, 15)
        self.color = YELLOW
        self.vx = vx
        self.vy = vy

    def update(self):
        self.rect.x = int(self.rect.x + self.vx)
        self.rect.y = int(self.rect.y + self.vy)

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, self.rect)
        pygame.draw.circle(surface, RED, self.rect.center, 3)  # 위험 표시 코어


class Enemy:
    """
    일반 UFO 적.
    - 화면을 지그재그로 이동
    - 3방향 산탄 발사
    - 1타에 격추
    """

    def __init__(self, difficulty=1.0):
        self.width = 50
        self.height = 30
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        # 난이도에 따른 속도 증가
        base_speed = random.uniform(ENEMY_BASE_SPEED_Y - 1, ENEMY_BASE_SPEED_Y + 1)
        self.speed_y = base_speed * (1 + (difficulty - 1) * 0.25)
        self.speed_x = random.choice([-3, 3]) * (1 + (difficulty - 1) * 0.15)

        self.move_timer = 0
        self.fire_timer = 0

        # 난이도가 높을수록 발사 간격 감소
        min_fire = max(30, int(ENEMY_FIRE_RATE_MIN / difficulty))
        max_fire = max(60, int(ENEMY_FIRE_RATE_MAX / difficulty))
        self.fire_rate = random.randint(min_fire, max_fire)

    def update(self, enemy_bullets):
        self.rect.y = int(self.rect.y + self.speed_y)
        self.rect.x = int(self.rect.x + self.speed_x)

        # 화면 벽에 닿으면 방향 전환
        if self.rect.left < 0 or self.rect.right > WIDTH:
            self.speed_x *= -1

        # 주기적으로 총알 발사 (3방향 산탄)
        self.fire_timer += 1
        if self.fire_timer >= self.fire_rate:
            bullet_speed = 7
            # 중앙 발사
            enemy_bullets.append(
                EnemyBullet(self.rect.centerx, self.rect.bottom, 0, bullet_speed)
            )
            # 왼쪽 대각선
            enemy_bullets.append(
                EnemyBullet(self.rect.centerx, self.rect.bottom, -3, bullet_speed * 0.9)
            )
            # 오른쪽 대각선
            enemy_bullets.append(
                EnemyBullet(self.rect.centerx, self.rect.bottom, 3, bullet_speed * 0.9)
            )

            self.fire_timer = 0
            self.fire_rate = random.randint(60, 120)

    def draw(self, surface):
        # UFO 모양 그리기 (보라색 돔 + 녹색 하단)
        # 하단 원반 (그라데이션 효과 흉내)
        pygame.draw.ellipse(
            surface, (0, 150, 0), (self.rect.x, self.rect.y + 10, 50, 20)
        )  # 그림자/바닥
        pygame.draw.ellipse(
            surface, GREEN, (self.rect.x + 2, self.rect.y + 11, 46, 16)
        )  # 밝은 면

        # 보라색 돔 (투명도 및 하이라이트)
        dome_surf = pygame.Surface((30, 20), pygame.SRCALPHA)
        pygame.draw.ellipse(dome_surf, (150, 50, 255, 200), (0, 0, 30, 20))
        pygame.draw.ellipse(dome_surf, (200, 150, 255, 200), (4, 2, 16, 8))  # 반사광
        surface.blit(dome_surf, (self.rect.x + 10, self.rect.y))

        # 회전하는 창문/라이트 (timer 기반)
        self.move_timer += 1
        for i in range(4):
            # 시간에 따라 위치 이동 (회전하는 링 효과)
            offset = (i * 25 + self.move_timer * 3) % 100
            # 0~100 사이의 값을 -25~25(좌우)로 매핑하고 사인으로 깊이감
            pos_x = self.rect.x + 25 + int(math.cos(offset * math.pi / 50) * 20)
            if math.sin(offset * math.pi / 50) > 0:  # 앞쪽에 있을 때만 그림
                ly = self.rect.y + +18
                pygame.draw.circle(surface, YELLOW, (pos_x, ly), 3)
                pygame.draw.circle(surface, WHITE, (pos_x, ly), 1)


class HeavyEnemy:
    """
    헤비급 함선 (보스형 적).
    - 체력이 있어 여러 번 맞춰야 격추
    - 화면 상단에 머무르며 좌우 이동
    - 5방향 확산탄 발사
    """

    def __init__(self, difficulty=1.0):
        self.width = 80
        self.height = 60
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.speed = 2 * (1 + (difficulty - 1) * 0.08)
        self.speed_x = 2

        # 체력 스케일링
        self.max_health = (
            HEAVY_ENEMY_HEALTH_BASE + HEAVY_ENEMY_HEALTH_SCALE * difficulty
        )
        self.health = self.max_health

        self.target_y = random.randint(50, 200)
        self.state = "entering"

        self.fire_timer = 0
        self.fire_rate = max(70, int(HEAVY_ENEMY_FIRE_RATE_BASE * 1.5 / difficulty))

    def update(self, enemy_bullets):
        # 움직임 로직: 등장 후 좌우 이동
        if self.state == "entering":
            self.rect.y = int(self.rect.y + self.speed)
            if self.rect.y >= self.target_y:
                self.state = "fighting"
        else:
            self.rect.x = int(self.rect.x + self.speed_x)
            if self.rect.left < 0 or self.rect.right > WIDTH:
                self.speed_x *= -1

        # 발사 로직 (3방향)
        self.fire_timer += 1
        if self.fire_timer >= self.fire_rate:
            for i in range(-1, 2):
                vx = i * 2
                vy = 4
                enemy_bullets.append(
                    EnemyBullet(self.rect.centerx, self.rect.bottom, vx, vy)
                )
            self.fire_timer = 0

    def draw(self, surface):
        # 쌍발 엔진 불꽃
        flame_h = random.randint(15, 25)
        flame_y = self.rect.bottom - 5
        pygame.draw.polygon(
            surface,
            (255, 50, 0),
            [
                (self.rect.x + 15, flame_y),
                (self.rect.x + 25, flame_y),
                (self.rect.x + 20, flame_y + flame_h),
            ],
        )
        pygame.draw.polygon(
            surface,
            (255, 50, 0),
            [
                (self.rect.x + 55, flame_y),
                (self.rect.x + 65, flame_y),
                (self.rect.x + 60, flame_y + flame_h),
            ],
        )

        # 거대 UFO 본체
        # 후방 구조물
        pygame.draw.rect(
            surface,
            (40, 40, 40),
            (self.rect.x + 20, self.rect.y, 40, 60),
            border_radius=4,
        )
        pygame.draw.rect(
            surface,
            (80, 80, 80),
            (self.rect.x + 25, self.rect.y + 5, 30, 50),
            border_radius=2,
        )

        # 메인 원반 (층이 나뉜 구조)
        pygame.draw.ellipse(
            surface, (150, 20, 20), (self.rect.x, self.rect.y + 20, 80, 40)
        )  # 하단 그림자/어두운 면
        pygame.draw.ellipse(
            surface, RED, (self.rect.x + 2, self.rect.y + 22, 76, 36)
        )  # 상단 밝은 면
        pygame.draw.ellipse(
            surface, (255, 100, 100), (self.rect.x + 10, self.rect.y + 25, 60, 20)
        )  # 중심부

        # 무기 포대
        pygame.draw.rect(surface, YELLOW, (self.rect.x + 10, self.rect.y + 30, 10, 10))
        pygame.draw.rect(surface, YELLOW, (self.rect.x + 60, self.rect.y + 30, 10, 10))
        pygame.draw.circle(surface, ORANGE, (self.rect.x + 15, self.rect.y + 35), 3)
        pygame.draw.circle(surface, ORANGE, (self.rect.x + 65, self.rect.y + 35), 3)

        # 점멸하는 코어
        if pygame.time.get_ticks() % 500 < 250:
            pygame.draw.circle(surface, WHITE, (self.rect.centerx, self.rect.y + 35), 6)
        else:
            pygame.draw.circle(
                surface, YELLOW, (self.rect.centerx, self.rect.y + 35), 6
            )

        # HP Bar
        ratio = self.health / self.max_health
        pygame.draw.rect(surface, RED, (self.rect.x, self.rect.top - 10, self.width, 5))
        pygame.draw.rect(
            surface,
            GREEN,
            (self.rect.x, self.rect.top - 10, int(self.width * ratio), 5),
        )
        pygame.draw.rect(
            surface, WHITE, (self.rect.x, self.rect.top - 10, self.width, 5), 1
        )


class Interceptor:
    """
    고속 요격기.
    - 매우 빠름, 사격 없음
    - 플레이어 방향으로 돌진하거나 빠르게 화면을 가로지름
    """

    def __init__(self, difficulty=1.0):
        self.width = 30
        self.height = 40
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.speed_y = INTERCEPTOR_SPEED_Y * (1 + (difficulty - 1) * 0.3)
        self.speed_x = random.uniform(-2, 2)

    def update(self, enemy_bullets):
        self.rect.y = int(self.rect.y + self.speed_y)
        self.rect.x = int(self.rect.x + self.speed_x)

    def draw(self, surface):
        # 날렵한 삼각형 함선
        points = [
            (self.rect.centerx, self.rect.bottom),
            (self.rect.left, self.rect.top),
            (self.rect.right, self.rect.top),
        ]
        # 긴 엔진 트레일
        trail_h = random.randint(20, 35)
        pygame.draw.polygon(
            surface,
            (0, 200, 255),
            [
                (self.rect.centerx - 4, self.rect.top),
                (self.rect.centerx + 4, self.rect.top),
                (self.rect.centerx, self.rect.top - trail_h),
            ],
        )
        pygame.draw.polygon(
            surface,
            WHITE,
            [
                (self.rect.centerx - 1, self.rect.top),
                (self.rect.centerx + 1, self.rect.top),
                (self.rect.centerx, self.rect.top - trail_h + 10),
            ],
        )

        # 본체 쉐이딩
        pygame.draw.polygon(surface, (0, 150, 150), points)  # 어두운 톤
        inner_points = [
            (self.rect.centerx, self.rect.bottom - 4),
            (self.rect.left + 4, self.rect.top + 2),
            (self.rect.right - 4, self.rect.top + 2),
        ]
        pygame.draw.polygon(surface, CYAN, inner_points)  # 밝은 톤
        pygame.draw.polygon(surface, WHITE, points, 1)  # 라인 처리


class SniperEnemy:
    """
    저격수 적.
    - 화면 상단에서 플레이어 중 한 명을 조준하여 빠른 탄환 발사
    """

    def __init__(self, difficulty=1.0):
        self.width = 40
        self.height = 40
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.target_y = random.randint(30, 100)
        self.state = "entering"
        self.fire_timer = 0
        self.fire_rate = max(60, int(SNIPER_FIRE_RATE_BASE / difficulty))
        self.color = WHITE

    def update(self, enemy_bullets, players=None):
        if self.state == "entering":
            self.rect.y = int(self.rect.y + 3)
            if self.rect.y >= self.target_y:
                self.state = "sniping"
        else:
            # 저격 로직
            self.fire_timer += 1
            if self.fire_timer >= self.fire_rate:
                if players:
                    # 살아있는 플레이어 중 한 명 타겟팅
                    target = random.choice([p for p in players if p.health > 0])
                    # 방향 계산
                    dx = target.rect.centerx - self.rect.centerx
                    dy = target.rect.centery - self.rect.bottom
                    dist = (dx**2 + dy**2) ** 0.5
                    if dist != 0:
                        vx = (dx / dist) * 10
                        vy = (dy / dist) * 10
                        enemy_bullets.append(
                            EnemyBullet(self.rect.centerx, self.rect.bottom, vx, vy)
                        )
                self.fire_timer = 0

    def draw(self, surface):
        # 조준선 (발사 직전에 붉어짐)
        if self.state == "sniping" and self.fire_timer > self.fire_rate - 15:
            pygame.draw.line(
                surface,
                (255, 0, 0, 100),
                (self.rect.centerx, self.rect.bottom),
                (self.rect.centerx, HEIGHT),
                1,
            )

        # 긴 육각형 형태
        pts = [
            (self.rect.centerx, self.rect.top),
            (self.rect.right, self.rect.centery),
            (self.rect.centerx, self.rect.bottom),
            (self.rect.left, self.rect.centery),
        ]
        pygame.draw.polygon(surface, (40, 40, 40), pts)
        pygame.draw.polygon(surface, WHITE, pts, 2)

        # 내부 디테일 (십자선과 코어)
        pygame.draw.line(
            surface,
            WHITE,
            (self.rect.left + 5, self.rect.centery),
            (self.rect.right - 5, self.rect.centery),
            1,
        )
        pygame.draw.line(
            surface,
            WHITE,
            (self.rect.centerx, self.rect.top + 5),
            (self.rect.centerx, self.rect.bottom - 5),
            1,
        )

        # 렌즈 (점멸)
        if self.state == "sniping":
            lens_color = RED if self.fire_timer % 10 < 5 else (150, 0, 0)
        else:
            lens_color = (100, 0, 0)
        pygame.draw.circle(surface, lens_color, self.rect.center, 6)
        pygame.draw.circle(
            surface, WHITE, (self.rect.centerx - 2, self.rect.centery - 2), 2
        )


class GhostEnemy:
    """
    유령 적.
    - 주기적으로 반투명해지며 레이저를 통과시킴 (무적 상태)
    """

    def __init__(self, difficulty=1.0):
        self.width = 45
        self.height = 45
        self.x = random.randint(50, WIDTH - 50 - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        # 더 빨라진 속도
        self.speed_y = 4 * (1 + (difficulty - 1) * 0.15)
        self.float_offset = random.uniform(0, 100)  # 개별적인 흔들림 시작점

        self.timer = 0
        self.is_ghost = False
        self.color = (200, 200, 255)

    def update(self, enemy_bullets):
        self.rect.y = int(self.rect.y + self.speed_y)
        self.timer += 1

        # 좌우로 흔들리는 움직임 (Sine파 이용)
        sway = math.sin((self.timer + self.float_offset) * 0.05) * 4
        self.rect.x = int(self.rect.x + sway)

        # 상태 변화
        if self.timer % (GHOST_PHASE_DURATION * 2) < GHOST_PHASE_DURATION:
            self.is_ghost = True
        else:
            self.is_ghost = False

    def draw(self, surface):
        alpha = 80 if self.is_ghost else 220  # 무적일 때 더 투명하게

        # 잔상 흔들림 계산
        wobble_x1 = int(math.sin(self.timer * 0.1) * 3)
        wobble_x2 = int(math.cos(self.timer * 0.13) * 3)

        s = pygame.Surface((self.width + 10, self.height + 10), pygame.SRCALPHA)
        # 글로우 외곽
        pygame.draw.circle(
            s,
            (*self.color[:3], alpha // 2),
            (self.width // 2 + 5, self.height // 2 + 5),
            self.width // 2 + 3,
        )
        # 구름/유령 형태 본체
        pygame.draw.circle(
            s,
            (*self.color[:3], alpha),
            (self.width // 2 + 5 + wobble_x1, self.height // 2 + 5),
            self.width // 2 - 2,
        )
        # 유령 눈
        eye_color = (255, 255, 255, alpha) if not self.is_ghost else (255, 0, 0, alpha)
        pygame.draw.ellipse(
            s,
            eye_color,
            (self.width // 2 - 10 + wobble_x2, self.height // 2 - 5, 6, 10),
        )
        pygame.draw.ellipse(
            s, eye_color, (self.width // 2 + 4 + wobble_x2, self.height // 2 - 5, 6, 10)
        )
        # 눈동자
        if not self.is_ghost:
            pygame.draw.circle(
                s,
                (0, 0, 0, alpha),
                (self.width // 2 - 7 + wobble_x2, self.height // 2 - 1),
                2,
            )
            pygame.draw.circle(
                s,
                (0, 0, 0, alpha),
                (self.width // 2 + 7 + wobble_x2, self.height // 2 - 1),
                2,
            )

        surface.blit(s, (self.rect.x - 5, self.rect.y - 5))


class SplitEnemy:
    """
    분열 적.
    - 격추 시 2~3개의 작은 적(MiniEnemy)으로 분열
    - 중간 체력을 가짐
    """

    def __init__(self, difficulty=1.0):
        self.width = 45
        self.height = 45
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.speed_y = 3 * (1 + (difficulty - 1) * 0.2)
        self.speed_x = random.choice([-2, 2])

        self.max_health = (
            SPLIT_ENEMY_HEALTH_BASE + SPLIT_ENEMY_HEALTH_SCALE * difficulty
        )
        self.health = self.max_health

        self.pulse = 0

    def update(self, enemy_bullets):
        self.rect.y = int(self.rect.y + self.speed_y)
        self.rect.x = int(self.rect.x + self.speed_x)

        if self.rect.left < 0 or self.rect.right > WIDTH:
            self.speed_x *= -1

        self.pulse += 0.1

    def draw(self, surface):
        # 펄스 진동 계산
        pulse_offset = int(6 * pygame.math.Vector2(1, 0).rotate(self.pulse * 15).x)
        pulse_radius = self.width // 3 + int(math.sin(self.pulse * 5) * 3)

        # 발광 글로우 뒤에 그리기
        glow = pygame.Surface((self.width * 2, self.height * 2), pygame.SRCALPHA)
        pygame.draw.circle(
            glow, (0, 250, 100, 50), (self.width, self.height), self.width // 2 + 5
        )
        surface.blit(
            glow, (self.rect.x - self.width // 2, self.rect.y - self.height // 2)
        )

        # 핵 분열 모양 (두 개의 원이 겹침)
        # 왼쪽/위쪽 셀
        pygame.draw.circle(
            surface,
            GREEN,
            (self.rect.centerx - pulse_offset, self.rect.centery - pulse_offset // 2),
            pulse_radius,
        )
        pygame.draw.circle(
            surface,
            (100, 255, 100),
            (
                self.rect.centerx - pulse_offset - 3,
                self.rect.centery - pulse_offset // 2 - 3,
            ),
            4,
        )  # 하이라이트

        # 오른쪽/아래쪽 셀
        pygame.draw.circle(
            surface,
            ORANGE,
            (self.rect.centerx + pulse_offset, self.rect.centery + pulse_offset // 2),
            pulse_radius,
        )
        pygame.draw.circle(
            surface,
            (255, 200, 100),
            (
                self.rect.centerx + pulse_offset - 3,
                self.rect.centery + pulse_offset // 2 - 3,
            ),
            4,
        )

        # 중심 코어 결합부 (에너지 링)
        pygame.draw.ellipse(
            surface, YELLOW, (self.rect.centerx - 8, self.rect.centery - 4, 16, 8), 2
        )
        pygame.draw.circle(surface, WHITE, self.rect.center, 4)

        # HP Bar
        ratio = self.health / self.max_health
        pygame.draw.rect(surface, RED, (self.rect.x, self.rect.top - 10, self.width, 5))
        pygame.draw.rect(
            surface,
            GREEN,
            (self.rect.x, self.rect.top - 10, int(self.width * ratio), 5),
        )
        pygame.draw.rect(
            surface, WHITE, (self.rect.x, self.rect.top - 10, self.width, 5), 1
        )

    def on_death(self):
        """격추 시 MiniEnemy 2~3개 생성."""
        mini_count = random.randint(2, 3)
        return [
            MiniEnemy(self.rect.centerx, self.rect.centery) for _ in range(mini_count)
        ]


class MiniEnemy:
    """
    작은 적 (SplitEnemy에서 분열됨).
    - 빠르고 작음
    - 1타에 격추
    """

    def __init__(self, x, y):
        self.width = 20
        self.height = 20
        self.rect = pygame.Rect(x - 10, y - 10, self.width, self.height)

        # 랜덤한 방향으로 빠르게 이동
        angle = random.uniform(0, 2 * 3.14159)
        speed = random.uniform(4, 7)
        self.speed_x = speed * pygame.math.Vector2(1, 0).rotate_rad(angle).x
        self.speed_y = abs(speed * pygame.math.Vector2(1, 0).rotate_rad(angle).y)

    def update(self, enemy_bullets):
        self.rect.x = int(self.rect.x + self.speed_x)
        self.rect.y = int(self.rect.y + self.speed_y)

    def draw(self, surface):
        # 꼬리 잔상
        trail_surf = pygame.Surface((self.width, self.height * 2), pygame.SRCALPHA)
        pygame.draw.circle(
            trail_surf, (255, 100, 0, 100), (self.width // 2, self.height), 6
        )
        surface.blit(trail_surf, (self.rect.x, self.rect.y - self.height // 2))

        # 작고 날카로운 크리스탈 형태
        points = [
            (self.rect.centerx, self.rect.top),
            (self.rect.left, self.rect.centery),
            (self.rect.centerx, self.rect.bottom),
            (self.rect.right, self.rect.centery),
        ]
        pygame.draw.polygon(surface, ORANGE, points)
        pygame.draw.polygon(surface, YELLOW, points, 1)  # 테두리
        # 밝은 면
        pygame.draw.polygon(
            surface,
            (255, 200, 100),
            [
                (self.rect.centerx, self.rect.top),
                (self.rect.left, self.rect.centery),
                (self.rect.centerx, self.rect.bottom),
            ],
        )
        # 코어
        pygame.draw.circle(
            surface, WHITE, (self.rect.centerx - 1, self.rect.centery), 2
        )


class LaserEnemy:
    """
    회전 레이저 적.
    - 화면 상단에서 360도 회전하는 레이저 빔 발사
    - 레이저에 닿으면 지속 데미지
    """

    def __init__(self, difficulty=1.0):
        self.width = 50
        self.height = 50
        self.x = random.randint(50, WIDTH - 50 - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.target_y = random.randint(50, 150)
        self.state = "entering"

        self.laser_angle = 0
        self.laser_rotation_speed = LASER_ENEMY_ROTATION_SPEED_BASE * difficulty
        self.laser_length = 420

        self.max_health = (
            LASER_ENEMY_HEALTH_BASE + LASER_ENEMY_HEALTH_SCALE * difficulty
        )
        self.health = self.max_health

    def update(self, enemy_bullets):
        if self.state == "entering":
            self.rect.y = int(self.rect.y + 3)
            if self.rect.y >= self.target_y:
                self.state = "firing"
        else:
            # 레이저 회전
            self.laser_angle += self.laser_rotation_speed
            if self.laser_angle >= 360:
                self.laser_angle -= 360

    def get_laser_line(self):
        """레이저 빔의 시작점과 끝점 반환."""
        if self.state != "firing":
            return None

        angle_rad = self.laser_angle * (3.14159 / 180)
        end_x = (
            self.rect.centerx
            + self.laser_length * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).x
        )
        end_y = (
            self.rect.centery
            + self.laser_length * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).y
        )

        return ((self.rect.centerx, self.rect.centery), (int(end_x), int(end_y)))

    def draw(self, surface):
        # 본체 (이중 육각형 및 글로우)
        center = self.rect.center

        # 글로우 효과
        glow_surf = pygame.Surface((self.width + 20, self.height + 20), pygame.SRCALPHA)
        pygame.draw.circle(
            glow_surf,
            (0, 200, 255, 60),
            (self.width // 2 + 10, self.height // 2 + 10),
            self.width // 2 + 8,
        )
        surface.blit(glow_surf, (self.rect.x - 10, self.rect.y - 10))

        # 외곽 육각형
        points_outer = []
        points_inner = []
        for i in range(6):
            angle = i * 60 + (
                self.laser_angle if self.state == "firing" else 0
            )  # 발사 중에는 회전
            angle_rad = angle * (3.14159 / 180)

            # 외부 꼭짓점
            px = center[0] + 22 * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).x
            py = center[1] + 22 * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).y
            points_outer.append((int(px), int(py)))

            # 내부 꼭짓점
            px_in = center[0] + 14 * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).x
            py_in = center[1] + 14 * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).y
            points_inner.append((int(px_in), int(py_in)))

        pygame.draw.polygon(surface, (20, 100, 150), points_outer)  # 어두운 톤
        pygame.draw.polygon(surface, CYAN, points_outer, 2)
        pygame.draw.polygon(surface, WHITE, points_inner)  # 밝은 내부

        # 회전하는 레이저 빔
        if self.state == "firing":
            laser_line = self.get_laser_line()
            if laser_line:
                # 레이저 광선 (반투명 글로우)
                s = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                pygame.draw.line(s, (255, 50, 50, 150), laser_line[0], laser_line[1], 8)
                pygame.draw.line(
                    s, (255, 100, 100, 200), laser_line[0], laser_line[1], 4
                )
                surface.blit(s, (0, 0))
                # 레이저 코어 (불투명 흰색)
                pygame.draw.line(surface, WHITE, laser_line[0], laser_line[1], 2)

        # 중심 코어 (커졌다 작아짐)
        core_r = 6 + int(math.sin(pygame.time.get_ticks() * 0.01) * 2)
        pygame.draw.circle(surface, RED, center, core_r)
        pygame.draw.circle(surface, WHITE, center, core_r - 2)

        # HP Bar
        ratio = self.health / self.max_health
        pygame.draw.rect(surface, RED, (self.rect.x, self.rect.top - 10, self.width, 5))
        pygame.draw.rect(
            surface,
            GREEN,
            (self.rect.x, self.rect.top - 10, int(self.width * ratio), 5),
        )
        pygame.draw.rect(
            surface, WHITE, (self.rect.x, self.rect.top - 10, self.width, 5), 1
        )


class KamikazeEnemy:
    """
    자폭 적 - 3단계 이동 패턴.
    1. entering : 화면 위에서 내려와 조준 위치에 도달
    2. aiming   : 잠깐 멈추며 플레이어를 lock-on (점멸 경고)
    3. charging : 가속도 + 약한 사인파로 플레이어에게 돌진
    - 돌진 방향으로 본체가 회전, 엔진 트레일 효과
    """

    def __init__(self, difficulty=1.0):
        self.width = 30
        self.height = 30
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.base_speed = KAMIKAZE_SPEED_BASE * (1 + (difficulty - 1) * 0.3)
        self.speed = self.base_speed
        self.target = None
        self.timer = 0
        self.warning_blink = False

        # 3단계 행동
        self.state = "entering"  # entering / aiming / charging
        self.aim_timer = 0
        self.aim_duration = 50  # 조준 유지 프레임 (약 0.8초)
        self.target_entry_y = random.randint(60, 140)  # 진입 후 멈출 Y 위치

        # 돌진 방향 (aiming 때 고정)
        self.charge_dx = 0
        self.charge_dy = 1
        self.angle = 0  # 그리기용 회전 각도 (도)

        # 사인파 흔들림
        self.wave_timer = 0
        self.wave_amp = 2.5  # 좌우 흔들림 폭
        self.wave_speed = 0.18

        # 트레일 (잔상)
        self.trail = []  # [(x, y, alpha), ...]
        self.trail_max = 10

    def _set_target(self, players):
        """살아있는 플레이어 중 가장 가까운 놈을 타겟으로."""
        if not players:
            return
        alive = [p for p in players if p.health > 0]
        if alive:
            self.target = min(
                alive,
                key=lambda p: (
                    (
                        (p.rect.centerx - self.rect.centerx) ** 2
                        + (p.rect.centery - self.rect.centery) ** 2
                    )
                    ** 0.5
                ),
            )

    def update(self, enemy_bullets, players=None):
        self.timer += 1

        # ── 단계 1 : 진입 ──────────────────────────────────
        if self.state == "entering":
            self.rect.y += int(self.base_speed * 0.7)
            if self.rect.y >= self.target_entry_y:
                self.state = "aiming"
                self._set_target(players)

        # ── 단계 2 : 조준 ──────────────────────────────────
        elif self.state == "aiming":
            self.aim_timer += 1
            # 점멸 경고
            self.warning_blink = self.aim_timer % 8 < 4

            # 타겟 방향 계속 업데이트
            if players:
                self._set_target(players)

            if self.aim_timer >= self.aim_duration:
                # 돌진 방향 고정
                if self.target:
                    dx = self.target.rect.centerx - self.rect.centerx
                    dy = self.target.rect.centery - self.rect.centery
                    dist = max((dx**2 + dy**2) ** 0.5, 1)
                    self.charge_dx = dx / dist
                    self.charge_dy = dy / dist
                else:
                    self.charge_dx, self.charge_dy = 0, 1
                # 각도 계산 (위쪽이 0도)
                self.angle = math.degrees(math.atan2(self.charge_dx, -self.charge_dy))
                self.speed = self.base_speed * 0.5  # 돌진 초기 속도
                self.state = "charging"

        # ── 단계 3 : 돌진 ──────────────────────────────────
        elif self.state == "charging":
            self.warning_blink = False
            self.wave_timer += 1

            # 가속도 (프레임당 0.25씩 증가, 최대 base_speed * 2.2)
            self.speed = min(self.speed + 0.25, self.base_speed * 2.2)

            # 수직 방향 성분
            move_x = self.charge_dx * self.speed
            move_y = self.charge_dy * self.speed

            # 수직 방향 법선 벡터 기반 사인파 흔들림 (회피 어렵게)
            perp_x = -self.charge_dy
            perp_y = self.charge_dx
            wave = math.sin(self.wave_timer * self.wave_speed) * self.wave_amp
            move_x += perp_x * wave
            move_y += perp_y * wave

            self.rect.x = int(self.rect.x + move_x)
            self.rect.y = int(self.rect.y + move_y)

            # 트레일 기록
            self.trail.append((self.rect.centerx, self.rect.centery))
            if len(self.trail) > self.trail_max:
                self.trail.pop(0)

        # 경고 점멸 (entering 단계에서는 느린 점멸)
        if self.state == "entering":
            self.warning_blink = self.timer % 20 < 10

    def is_close_to_target(self, threshold=50):
        """타겟과의 거리가 threshold 이하인지 확인."""
        if self.target:
            dx = self.target.rect.centerx - self.rect.centerx
            dy = self.target.rect.centery - self.rect.centery
            return (dx**2 + dy**2) ** 0.5 < threshold
        return False

    def draw(self, surface):
        cx, cy = self.rect.center
        r = self.width // 2

        # 돌진 트레일 (잔상)
        for i, (tx, ty) in enumerate(self.trail):
            alpha = int(180 * (i + 1) / len(self.trail)) if self.trail else 0
            trail_r = max(2, int((r + 2) * (i + 1) / len(self.trail) * 0.7))
            trail_surf = pygame.Surface(
                (trail_r * 2 + 4, trail_r * 2 + 4), pygame.SRCALPHA
            )
            # 트레일 레이어
            pygame.draw.circle(
                trail_surf,
                (255, 50, 0, alpha // 2),
                (trail_r + 2, trail_r + 2),
                trail_r + 2,
            )
            pygame.draw.circle(
                trail_surf, (255, 140, 0, alpha), (trail_r + 2, trail_r + 2), trail_r
            )
            surface.blit(trail_surf, (tx - trail_r - 2, ty - trail_r - 2))

        # 경고 원 (점멸 및 회전하는 조준선)
        if self.warning_blink:
            warn_r = r + 8 + int(4 * math.sin(self.timer * 0.5))
            pygame.draw.circle(surface, RED, (cx, cy), warn_r, 2)
            # 타겟팅 크로스헤어
            for i in range(4):
                hang = math.radians(self.timer * 5 + i * 90)
                hx1 = cx + (warn_r - 4) * math.cos(hang)
                hy1 = cy + (warn_r - 4) * math.sin(hang)
                hx2 = cx + (warn_r + 6) * math.cos(hang)
                hy2 = cy + (warn_r + 6) * math.sin(hang)
                pygame.draw.line(surface, RED, (hx1, hy1), (hx2, hy2), 2)

        # ── 본체 : 돌진 방향으로 회전하는 삼각형 ──
        angle_rad = math.radians(self.angle)
        # 더 날카로운 각도
        tip_x = cx + (r + 5) * math.sin(angle_rad)
        tip_y = cy - (r + 5) * math.cos(angle_rad)
        left_x = cx + r * math.sin(angle_rad + 2.5)
        left_y = cy - r * math.cos(angle_rad + 2.5)
        right_x = cx + r * math.sin(angle_rad - 2.5)
        right_y = cy - r * math.cos(angle_rad - 2.5)

        # 내부 구조물(엔진 결합부)
        back_x = cx + (r - 5) * math.sin(angle_rad + 3.14)
        back_y = cy - (r - 5) * math.cos(angle_rad + 3.14)

        if self.state == "charging":
            body_color = (255, 50, 0)
            edge_color = YELLOW
        elif self.state == "aiming":
            body_color = (200, 100, 0)
            edge_color = ORANGE
        else:
            body_color = (150, 100, 50)
            edge_color = DARK_GREY

        pygame.draw.polygon(
            surface,
            body_color,
            [
                (int(tip_x), int(tip_y)),
                (int(left_x), int(left_y)),
                (int(back_x), int(back_y)),
                (int(right_x), int(right_y)),
            ],
        )

        # 외곽선 / 장갑 패널 라인
        pygame.draw.polygon(
            surface,
            edge_color,
            [
                (int(tip_x), int(tip_y)),
                (int(left_x), int(left_y)),
                (int(back_x), int(back_y)),
                (int(right_x), int(right_y)),
            ],
            2,
        )
        pygame.draw.line(
            surface, edge_color, (int(tip_x), int(tip_y)), (int(back_x), int(back_y)), 1
        )  # 중앙선

        # 중심 코어 (빛남)
        core_color = WHITE if self.warning_blink else YELLOW
        pygame.draw.circle(surface, core_color, (cx, cy), 4)

        # 경고 심볼 (aiming 단계에서만 뚜렷하게)
        if self.state in ("entering", "aiming"):
            font = pygame.font.SysFont("Arial", 16, bold=True)
            txt = font.render("!", True, RED)
            surface.blit(txt, txt.get_rect(center=(cx, cy - 25)))


class FloatingMine:
    """
    둥실둥실 떠다니는 기뢰.
    - 플레이어를 직접 추적하지 않음
    - 사인파를 활용한 부드러운 부유 움직임
    - 플레이어가 감지 범위 내에 들어오면 폭발
    - 맥동하는 시각적 효과
    """

    def __init__(self, difficulty=1.0):
        self.width = 35
        self.height = 35
        self.x = random.randint(50, WIDTH - 50 - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        # 부유 속도 (난이도에 따라 약간 증가)
        self.drift_speed = FLOATING_MINE_DRIFT_SPEED * (1 + (difficulty - 1) * 0.1)

        # 사인파 움직임을 위한 파라미터
        self.float_timer = random.uniform(0, math.pi * 2)
        self.float_amplitude_x = random.uniform(1.5, 3.0)  # 좌우 흔들림 폭
        self.float_amplitude_y = random.uniform(0.3, 0.8)  # 상하 흔들림 폭
        self.float_speed = random.uniform(0.03, 0.06)  # 흔들림 속도

        # 시각적 효과
        self.pulse_timer = 0
        self.pulse_speed = 0.1
        self.glow_radius = 0

        # 폭발 준비 상태 (플레이어 감지 시)
        self.triggered = False
        self.trigger_timer = 0
        self.trigger_delay = 30  # 감지 후 폭발까지 0.5초

        # 색상
        self.base_color = (100, 200, 100)  # 연두색
        self.glow_color = (150, 255, 150)

    def update(self, enemy_bullets, players=None):
        self.float_timer += self.float_speed
        self.pulse_timer += self.pulse_speed

        if not self.triggered:
            # 부유 움직임
            sway_x = math.sin(self.float_timer) * self.float_amplitude_x
            sway_y = math.sin(self.float_timer * 1.5) * self.float_amplitude_y

            self.rect.x = int(self.rect.x + sway_x)
            self.rect.y = int(self.rect.y + self.drift_speed + sway_y)

            # 화면 경계 처리
            if self.rect.left < 10:
                self.rect.left = 10
            if self.rect.right > WIDTH - 10:
                self.rect.right = WIDTH - 10

            # 플레이어 감지
            if players:
                for player in players:
                    if player.health > 0:
                        dx = player.rect.centerx - self.rect.centerx
                        dy = player.rect.centery - self.rect.centery
                        dist = (dx**2 + dy**2) ** 0.5
                        if dist < FLOATING_MINE_DETECTION_RADIUS:
                            self.triggered = True
                            break
        else:
            # 트리거 후 카운트다운 (제자리에서 진동)
            self.trigger_timer += 1
            # 빠른 진동
            vibrate = random.randint(-2, 2)
            self.rect.x += vibrate

        # 글로우 효과 업데이트
        self.glow_radius = int(5 + 3 * math.sin(self.pulse_timer * 2))

    def should_explode(self):
        """폭발 조건 확인."""
        return self.triggered and self.trigger_timer >= self.trigger_delay

    def get_nearby_players(self, players, radius):
        """폭발 범위 내 플레이어 반환."""
        nearby = []
        for player in players:
            if player.health > 0:
                dx = player.rect.centerx - self.rect.centerx
                dy = player.rect.centery - self.rect.centery
                dist = (dx**2 + dy**2) ** 0.5
                if dist < radius:
                    nearby.append(player)
        return nearby

    def draw(self, surface):
        # 글로우 효과 (외곽 발광)
        glow_surf = pygame.Surface((self.width + 40, self.height + 40), pygame.SRCALPHA)
        glow_alpha = 80 + int(40 * math.sin(self.pulse_timer * 2))

        if self.triggered:
            blink = self.trigger_timer % 6 < 3
            glow_color = (
                (255, 50, 50, glow_alpha + 50) if blink else (255, 100, 0, glow_alpha)
            )
            core_color = RED if blink else ORANGE
            spike_color = WHITE if blink else YELLOW
        else:
            glow_color = (*self.glow_color, glow_alpha)
            core_color = self.base_color
            spike_color = YELLOW

        # 여러 겹의 부드러운 외곽 글로우
        pygame.draw.circle(
            glow_surf,
            glow_color,
            (self.width // 2 + 20, self.height // 2 + 20),
            self.width // 2 + self.glow_radius,
        )
        pygame.draw.circle(
            glow_surf,
            (glow_color[0], glow_color[1], glow_color[2], glow_alpha // 2),
            (self.width // 2 + 20, self.height // 2 + 20),
            self.width // 2 + self.glow_radius + 5,
        )
        surface.blit(glow_surf, (self.rect.x - 20, self.rect.y - 20))

        # 본체 (입체감 있는 동그란 기뢰)
        pygame.draw.circle(
            surface,
            (
                max(0, core_color[0] - 40),
                max(0, core_color[1] - 40),
                max(0, core_color[2] - 40),
            ),
            self.rect.center,
            self.width // 2,
        )
        pygame.draw.circle(
            surface,
            core_color,
            (self.rect.centerx - 2, self.rect.centery - 2),
            self.width // 2 - 2,
        )

        # 스파이크 (8방향, 더 뼈대 같은 느낌)
        for i in range(8):
            angle = i * 45 + self.pulse_timer * 20  # 조금 더 빨리 회전
            angle_rad = angle * (math.pi / 180)
            spike_length = 8 + self.glow_radius + (4 if self.triggered else 0)

            start_x = self.rect.centerx + (self.width // 2 - 4) * math.cos(angle_rad)
            start_y = self.rect.centery + (self.width // 2 - 4) * math.sin(angle_rad)
            end_x = self.rect.centerx + (self.width // 2 + spike_length) * math.cos(
                angle_rad
            )
            end_y = self.rect.centery + (self.width // 2 + spike_length) * math.sin(
                angle_rad
            )

            # 스파이크 라인
            pygame.draw.line(
                surface,
                DARK_GREY,
                (int(start_x), int(start_y)),
                (int(end_x), int(end_y)),
                4,
            )
            pygame.draw.line(
                surface,
                spike_color,
                (int(start_x), int(start_y)),
                (int(end_x), int(end_y)),
                2,
            )
            # 스파이크 끝부분 센서 노드
            pygame.draw.circle(surface, spike_color, (int(end_x), int(end_y)), 2)

        # 중심 코어 (기계적인 눈 느낌)
        core_pulse = int(5 + 3 * math.sin(self.pulse_timer * 3))
        if self.triggered:
            pygame.draw.circle(surface, WHITE, self.rect.center, core_pulse + 2)
            pygame.draw.circle(surface, RED, self.rect.center, core_pulse)
        else:
            pygame.draw.circle(surface, DARK_GREY, self.rect.center, core_pulse + 2)
            pygame.draw.circle(surface, CYAN, self.rect.center, core_pulse)


class CarrierDrone:
    """
    보스 캐리어가 소환하는 소형 추적 드론.
    - 플레이어를 천천히 추적
    - 단발 사격
    - 체력 없이 1타에 격추
    """

    def __init__(self, x, y, difficulty=1.0):
        self.width = 22
        self.height = 22
        self.rect = pygame.Rect(x - 11, y - 11, self.width, self.height)

        self.speed = BOSS_CARRIER_DRONE_SPEED * (1 + (difficulty - 1) * 0.15)
        self.target = None
        self.fire_timer = 0
        self.fire_rate = max(50, int(90 / difficulty))
        self.timer = 0
        self.lifetime = 600  # 10초 후 자동 소멸

    def update(self, enemy_bullets, players=None):
        self.timer += 1

        # 가장 가까운 살아있는 플레이어 추적
        if players:
            alive = [p for p in players if p.health > 0]
            if alive:
                self.target = min(
                    alive,
                    key=lambda p: (
                        (p.rect.centerx - self.rect.centerx) ** 2
                        + (p.rect.centery - self.rect.centery) ** 2
                    ),
                )

        if self.target and self.target.health > 0:
            dx = self.target.rect.centerx - self.rect.centerx
            dy = self.target.rect.centery - self.rect.centery
            dist = max((dx**2 + dy**2) ** 0.5, 1)
            self.rect.x = int(self.rect.x + (dx / dist) * self.speed)
            self.rect.y = int(self.rect.y + (dy / dist) * self.speed)

            # 사격
            self.fire_timer += 1
            if self.fire_timer >= self.fire_rate:
                vx = (dx / dist) * 5
                vy = (dy / dist) * 5
                enemy_bullets.append(
                    EnemyBullet(self.rect.centerx, self.rect.centery, vx, vy)
                )
                self.fire_timer = 0
        else:
            # 타겟 없으면 아래로 이동
            self.rect.y += 2

    def is_expired(self):
        return self.timer >= self.lifetime

    def draw(self, surface):
        cx, cy = self.rect.center
        r = self.width // 2

        # 드론 글로우 효과
        glow_surf = pygame.Surface((self.width + 10, self.height + 10), pygame.SRCALPHA)
        pygame.draw.circle(
            glow_surf,
            (0, 255, 255, 50),
            (self.width // 2 + 5, self.height // 2 + 5),
            r + 2,
        )
        surface.blit(glow_surf, (self.rect.x - 5, self.rect.y - 5))

        # 본체 (작은 다이아몬드 + 외부 패널)
        pts_outer = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
        pts_inner = [
            (cx, cy - r + 3),
            (cx + r - 3, cy),
            (cx, cy + r - 3),
            (cx - r + 3, cy),
        ]

        pygame.draw.polygon(surface, (30, 80, 150), pts_outer)
        pygame.draw.polygon(surface, CYAN, pts_inner)
        pygame.draw.polygon(surface, WHITE, pts_outer, 1)

        # 추진기 불꽃 (위쪽)
        pygame.draw.circle(
            surface, (0, 200, 255), (cx, cy - r - 2), 2 + int(math.sin(self.timer) * 2)
        )

        # 중심 코어 (깜빡임, 발사 직전에 더 밝게)
        is_firing = self.fire_timer > self.fire_rate - 10
        core_size = 4 if is_firing else 3

        if is_firing or self.timer % 10 < 5:
            pygame.draw.circle(surface, WHITE, (cx, cy), core_size + 1)
            pygame.draw.circle(surface, YELLOW, (cx, cy), core_size)
        else:
            pygame.draw.circle(surface, ORANGE, (cx, cy), core_size)


class BossCarrier:
    """
    보스 캐리어 - 3페이즈 순환 공격 패턴.
    Phase 1: 확산탄 (5방향)
    Phase 2: 드론 소환 (CarrierDrone 2~3기)
    Phase 3: 보호막 + 플레이어 조준 집중 사격
    높은 체력, 격추 시 300점.
    """

    def __init__(self, difficulty=1.0):
        self.width = 100
        self.height = 70
        self.x = random.randint(50, WIDTH - 50 - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.speed = 1.5
        self.speed_x = 1.5 * random.choice([-1, 1])
        self.target_y = random.randint(40, 120)
        self.state = "entering"  # entering / fighting
        self.difficulty = difficulty

        # 체력
        self.max_health = (
            BOSS_CARRIER_HEALTH_BASE + BOSS_CARRIER_HEALTH_SCALE * difficulty
        )
        self.health = self.max_health

        # 페이즈 시스템
        self.phase = 1  # 1: 확산탄, 2: 드론소환, 3: 보호막+집중사격
        self.phase_timer = 0
        self.phase_duration = BOSS_CARRIER_PHASE_DURATION

        # 사격
        self.fire_timer = 0
        self.fire_rate = max(40, int(BOSS_CARRIER_FIRE_RATE / difficulty))

        # 보호막
        self.shield_active = False
        self.shield_pulse = 0

        # 드론 소환
        self.drones_spawned = False
        self.pending_drones = []  # 소환 대기 중인 드론

        # 시각 효과
        self.glow_timer = 0

    def update(self, enemy_bullets, players=None):
        self.glow_timer += 1

        # === 진입 ===
        if self.state == "entering":
            self.rect.y = int(self.rect.y + self.speed)
            if self.rect.y >= self.target_y:
                self.state = "fighting"
            return

        # === 전투 ===
        # 좌우 이동
        self.rect.x = int(self.rect.x + self.speed_x)
        if self.rect.left < 20 or self.rect.right > WIDTH - 20:
            self.speed_x *= -1

        # 페이즈 타이머
        self.phase_timer += 1
        if self.phase_timer >= self.phase_duration:
            self.phase_timer = 0
            self.phase = (self.phase % 3) + 1
            self.drones_spawned = False
            self.fire_timer = 0

        # 보호막 상태
        self.shield_active = self.phase == 3
        if self.shield_active:
            self.shield_pulse += 0.15

        # === 페이즈별 행동 ===
        if self.phase == 1:
            # Phase 1: 3방향 확산탄
            self.fire_timer += 1
            if self.fire_timer >= self.fire_rate:
                for i in range(3):
                    angle = -20 + (i * 20)  # -20도 ~ +20도
                    angle_rad = math.radians(angle)
                    vx = math.sin(angle_rad) * 4
                    vy = math.cos(angle_rad) * 4
                    enemy_bullets.append(
                        EnemyBullet(self.rect.centerx, self.rect.bottom, vx, vy)
                    )
                self.fire_timer = 0

        elif self.phase == 2:
            # Phase 2: 드론 소환 (1번만)
            if not self.drones_spawned:
                self.drones_spawned = True
                drone_count = random.randint(2, 3)
                self.pending_drones = []
                for i in range(drone_count):
                    offset_x = (i - drone_count // 2) * 30
                    self.pending_drones.append(
                        CarrierDrone(
                            self.rect.centerx + offset_x,
                            self.rect.bottom + 10,
                            self.difficulty,
                        )
                    )

        elif self.phase == 3:
            # Phase 3: 보호막 + 플레이어 조준 집중 사격
            self.fire_timer += 1
            focused_rate = max(25, int(self.fire_rate * 0.6))
            if self.fire_timer >= focused_rate and players:
                alive = [p for p in players if p.health > 0]
                if alive:
                    target = random.choice(alive)
                    dx = target.rect.centerx - self.rect.centerx
                    dy = target.rect.centery - self.rect.bottom
                    dist = max((dx**2 + dy**2) ** 0.5, 1)
                    speed = 6
                    vx = (dx / dist) * speed
                    vy = (dy / dist) * speed
                    # 2발 연사
                    enemy_bullets.append(
                        EnemyBullet(self.rect.centerx - 15, self.rect.bottom, vx, vy)
                    )
                    enemy_bullets.append(
                        EnemyBullet(self.rect.centerx + 15, self.rect.bottom, vx, vy)
                    )
                self.fire_timer = 0

    def get_pending_drones(self):
        """소환 대기 중인 드론을 꺼내감."""
        drones = self.pending_drones
        self.pending_drones = []
        return drones

    def draw(self, surface):
        cx, cy = self.rect.center

        # 보호막 (Phase 3) - 에너지 셀 구면 보호막처럼 연출
        if self.shield_active:
            shield_surf = pygame.Surface(
                (self.width + 40, self.height + 40), pygame.SRCALPHA
            )
            pulse_val = math.sin(self.shield_pulse)
            shield_alpha = int(100 + 50 * pulse_val)

            # 다중 레이어 보호막
            pygame.draw.ellipse(
                shield_surf,
                (50, 150, 255, shield_alpha // 3),
                (0, 0, self.width + 40, self.height + 40),
            )
            pygame.draw.ellipse(
                shield_surf,
                (150, 200, 255, shield_alpha),
                (0, 0, self.width + 40, self.height + 40),
                4,
            )
            pygame.draw.ellipse(
                shield_surf,
                WHITE,
                (5, 5, self.width + 30, self.height + 30),
                1 + int(pulse_val),
            )

            surface.blit(shield_surf, (self.rect.x - 20, self.rect.y - 20))

        # 본체 (초거대 전함 텍스처링)
        # 그림자 효과용 배경
        pygame.draw.rect(
            surface, (20, 20, 30), (self.rect.x + 12, self.rect.y + 2, 76, self.height)
        )

        # 기갑 날개 (여러 겹)
        left_wing_pts = [
            (self.rect.x - 10, self.rect.y + 25),
            (self.rect.x + 15, self.rect.y + 10),
            (self.rect.x + 15, self.rect.y + self.height - 15),
            (self.rect.x - 5, self.rect.y + self.height - 5),
        ]
        pygame.draw.polygon(surface, (60, 60, 80), left_wing_pts)
        pygame.draw.polygon(
            surface, (100, 100, 130), left_wing_pts, 3
        )  # 날개 테두리 하이라이트

        right_wing_pts = [
            (self.rect.right + 10, self.rect.y + 25),
            (self.rect.right - 15, self.rect.y + 10),
            (self.rect.right - 15, self.rect.y + self.height - 15),
            (self.rect.right + 5, self.rect.y + self.height - 5),
        ]
        pygame.draw.polygon(surface, (60, 60, 80), right_wing_pts)
        pygame.draw.polygon(surface, (100, 100, 130), right_wing_pts, 3)

        # 메인 장갑판 (가운데 줄무늬 포함)
        pygame.draw.rect(
            surface, (70, 70, 90), (self.rect.x + 15, self.rect.y, 70, self.height)
        )
        # 장갑 패널 라인
        for i in range(1, 5):
            ly = self.rect.y + i * (self.height // 5)
            pygame.draw.line(
                surface, DARK_GREY, (self.rect.x + 15, ly), (self.rect.x + 85, ly), 2
            )

        # 전면부 대형 장갑
        pygame.draw.polygon(
            surface,
            (90, 90, 110),
            [
                (self.rect.x + 25, self.rect.bottom),
                (self.rect.x + 75, self.rect.bottom),
                (self.rect.x + 50, self.rect.bottom + 15),
            ],
        )

        # 브릿지 (상부 돔형 관제탑)
        pygame.draw.ellipse(
            surface, (40, 40, 60), (self.rect.x + 30, self.rect.y - 15, 40, 30)
        )
        pygame.draw.ellipse(
            surface, (150, 200, 255), (self.rect.x + 35, self.rect.y - 10, 30, 15)
        )  # 유리창
        pygame.draw.line(
            surface,
            WHITE,
            (self.rect.x + 40, self.rect.y - 5),
            (self.rect.x + 60, self.rect.y - 5),
            2,
        )  # 하이라이트

        # 드론 방출 베이 (Phase 2에서 빛남)
        bay_color = CYAN if self.phase == 2 and not self.drones_spawned else DARK_GREY
        pygame.draw.rect(
            surface, bay_color, (self.rect.x + 25, self.rect.bottom - 20, 15, 10)
        )
        pygame.draw.rect(
            surface, bay_color, (self.rect.x + 60, self.rect.bottom - 20, 15, 10)
        )

        # 대형 엔진 불빛 (4개)
        for offset in [-30, -10, 10, 30]:
            engine_color = (255, 100, 0) if self.glow_timer % 8 < 4 else YELLOW
            flame_p = random.randint(5, 12)
            pygame.draw.polygon(
                surface,
                engine_color,
                [
                    (cx + offset - 6, self.rect.y),
                    (cx + offset + 6, self.rect.y),
                    (cx + offset, self.rect.y - flame_p),
                ],
            )
            pygame.draw.circle(surface, WHITE, (cx + offset, self.rect.y), 3)

        # 페이즈 표시등 (3개 작은 원, 무기 게이지)
        for i in range(3):
            lx = self.rect.x + 30 + i * 20
            ly = self.rect.y + 15
            color = RED if self.phase == i + 1 else (50, 0, 0)
            pygame.draw.circle(surface, color, (lx, ly), 5)
            if self.phase == i + 1:
                pygame.draw.circle(surface, WHITE, (lx, ly), 2)

        # HP Bar (훨씬 크고 보스답게 표시)
        bar_width = self.width + 40
        bar_x = self.rect.x - 20
        ratio = self.health / self.max_health
        bar_y = self.rect.top - 25
        pygame.draw.rect(surface, (50, 0, 0), (bar_x, bar_y, bar_width, 10))
        pygame.draw.rect(
            surface, (255, 50, 50), (bar_x, bar_y, int(bar_width * ratio), 10)
        )
        pygame.draw.rect(surface, WHITE, (bar_x, bar_y, bar_width, 10), 2)
