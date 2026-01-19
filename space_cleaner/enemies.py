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
        pygame.draw.ellipse(surface, PURPLE, (self.rect.x + 10, self.rect.y, 30, 20))
        pygame.draw.ellipse(surface, GREEN, (self.rect.x, self.rect.y + 10, 50, 20))
        # 창문/라이트
        for i in range(3):
            lx = self.rect.x + 10 + i * 15
            ly = self.rect.y + 20
            pygame.draw.circle(surface, YELLOW, (lx, ly), 3)


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
        self.fire_rate = max(40, int(HEAVY_ENEMY_FIRE_RATE_BASE / difficulty))

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

        # 발사 로직 (5방향)
        self.fire_timer += 1
        if self.fire_timer >= self.fire_rate:
            for i in range(-2, 3):
                vx = i * 2
                vy = 6
                enemy_bullets.append(
                    EnemyBullet(self.rect.centerx, self.rect.bottom, vx, vy)
                )
            self.fire_timer = 0

    def draw(self, surface):
        # 거대 UFO 본체
        pygame.draw.rect(surface, DARK_GREY, (self.rect.x + 20, self.rect.y, 40, 60))
        pygame.draw.ellipse(surface, RED, (self.rect.x, self.rect.y + 20, 80, 40))
        pygame.draw.rect(surface, YELLOW, (self.rect.x + 10, self.rect.y + 30, 10, 10))
        pygame.draw.rect(surface, YELLOW, (self.rect.x + 60, self.rect.y + 30, 10, 10))

        # HP Bar
        ratio = self.health / self.max_health
        pygame.draw.rect(surface, RED, (self.rect.x, self.rect.top - 10, self.width, 5))
        pygame.draw.rect(
            surface, GREEN, (self.rect.x, self.rect.top - 10, self.width * ratio, 5)
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
        pygame.draw.polygon(surface, CYAN, points)
        # 엔진 불꽃
        pygame.draw.circle(
            surface, ORANGE, (self.rect.centerx, self.rect.top), random.randint(3, 8)
        )


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
        # 긴 육각형 형태
        pts = [
            (self.rect.centerx, self.rect.top),
            (self.rect.right, self.rect.centery),
            (self.rect.centerx, self.rect.bottom),
            (self.rect.left, self.rect.centery),
        ]
        pygame.draw.polygon(surface, WHITE, pts, 2)
        pygame.draw.circle(surface, RED, self.rect.center, 5)


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
        alpha = 100 if self.is_ghost else 255
        s = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        # 구름/유령 형태
        pygame.draw.circle(
            s,
            (*self.color, alpha),
            (self.width // 2, self.height // 2),
            self.width // 2,
        )
        pygame.draw.circle(
            s, (255, 255, 255, alpha), (self.width // 2 - 10, self.height // 2 - 5), 5
        )
        pygame.draw.circle(
            s, (255, 255, 255, alpha), (self.width // 2 + 10, self.height // 2 - 5), 5
        )
        surface.blit(s, (self.rect.x, self.rect.y))


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
        # 핵 분열 모양 (두 개의 원이 겹침)
        pulse_offset = int(5 * pygame.math.Vector2(1, 0).rotate(self.pulse * 10).x)
        pygame.draw.circle(
            surface,
            GREEN,
            (self.rect.centerx - pulse_offset, self.rect.centery),
            self.width // 3,
        )
        pygame.draw.circle(
            surface,
            ORANGE,
            (self.rect.centerx + pulse_offset, self.rect.centery),
            self.width // 3,
        )
        # 중심 코어
        pygame.draw.circle(surface, YELLOW, self.rect.center, 5)

        # HP Bar
        ratio = self.health / self.max_health
        pygame.draw.rect(surface, RED, (self.rect.x, self.rect.top - 8, self.width, 4))
        pygame.draw.rect(
            surface, GREEN, (self.rect.x, self.rect.top - 8, self.width * ratio, 4)
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
        # 작은 삼각형
        points = [
            (self.rect.centerx, self.rect.top),
            (self.rect.left, self.rect.bottom),
            (self.rect.right, self.rect.bottom),
        ]
        pygame.draw.polygon(surface, ORANGE, points)
        pygame.draw.circle(surface, YELLOW, self.rect.center, 3)


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
        self.laser_length = 300

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
        # 본체 (육각형)
        center = self.rect.center
        points = []
        for i in range(6):
            angle = i * 60
            angle_rad = angle * (3.14159 / 180)
            px = center[0] + 20 * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).x
            py = center[1] + 20 * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).y
            points.append((int(px), int(py)))
        pygame.draw.polygon(surface, CYAN, points)
        pygame.draw.polygon(surface, WHITE, points, 2)

        # 회전하는 레이저 빔
        if self.state == "firing":
            laser_line = self.get_laser_line()
            if laser_line:
                # 레이저 광선 (반투명)
                s = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                pygame.draw.line(s, (255, 0, 0, 100), laser_line[0], laser_line[1], 5)
                surface.blit(s, (0, 0))
                # 레이저 코어 (불투명)
                pygame.draw.line(surface, RED, laser_line[0], laser_line[1], 2)

        # 중심 코어
        pygame.draw.circle(surface, RED, center, 8)

        # HP Bar
        ratio = self.health / self.max_health
        pygame.draw.rect(surface, RED, (self.rect.x, self.rect.top - 10, self.width, 5))
        pygame.draw.rect(
            surface, GREEN, (self.rect.x, self.rect.top - 10, self.width * ratio, 5)
        )


class KamikazeEnemy:
    """
    자폭 적.
    - 플레이어를 향해 빠르게 돌진
    - 근접 시 폭발 (범위 데미지)
    - 경고 표시 (점멸)
    """

    def __init__(self, difficulty=1.0):
        self.width = 30
        self.height = 30
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.speed = KAMIKAZE_SPEED_BASE * (1 + (difficulty - 1) * 0.3)
        self.target = None
        self.timer = 0
        self.warning_blink = False

    def update(self, enemy_bullets, players=None):
        self.timer += 1

        # 타겟 설정 (가장 가까운 플레이어)
        if players and (self.target is None or self.timer % 60 == 0):
            alive_players = [p for p in players if p.health > 0]
            if alive_players:
                # 가장 가까운 플레이어 찾기
                closest = min(
                    alive_players,
                    key=lambda p: (
                        (p.rect.centerx - self.rect.centerx) ** 2
                        + (p.rect.centery - self.rect.centery) ** 2
                    )
                    ** 0.5,
                )
                self.target = closest

        # 타겟을 향해 이동
        if self.target:
            dx = self.target.rect.centerx - self.rect.centerx
            dy = self.target.rect.centery - self.rect.centery
            dist = (dx**2 + dy**2) ** 0.5
            if dist > 0:
                self.rect.x = int(self.rect.x + (dx / dist) * self.speed)
                self.rect.y = int(self.rect.y + (dy / dist) * self.speed)
        else:
            self.rect.y = int(self.rect.y + self.speed)

        # 경고 점멸
        if self.timer % 10 < 5:
            self.warning_blink = True
        else:
            self.warning_blink = False

    def is_close_to_target(self, threshold=50):
        """타겟과의 거리가 threshold 이하인지 확인."""
        if self.target:
            dx = self.target.rect.centerx - self.rect.centerx
            dy = self.target.rect.centery - self.rect.centery
            dist = (dx**2 + dy**2) ** 0.5
            return dist < threshold
        return False

    def draw(self, surface):
        # 경고 원 (점멸)
        if self.warning_blink:
            pygame.draw.circle(surface, RED, self.rect.center, self.width // 2 + 5, 2)

        # 본체 (십자형)
        pygame.draw.circle(surface, ORANGE, self.rect.center, self.width // 2)
        pygame.draw.rect(
            surface,
            YELLOW,
            (self.rect.centerx - 3, self.rect.top, 6, self.height),
        )
        pygame.draw.rect(
            surface,
            YELLOW,
            (self.rect.left, self.rect.centery - 3, self.width, 6),
        )

        # 경고 심볼
        font = pygame.font.SysFont("Arial", 14, bold=True)
        txt = font.render("!", True, RED)
        surface.blit(txt, txt.get_rect(center=self.rect.center))


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
        glow_surf = pygame.Surface((self.width + 20, self.height + 20), pygame.SRCALPHA)
        glow_alpha = 80 + int(40 * math.sin(self.pulse_timer * 2))

        if self.triggered:
            # 트리거 시 빨간색 점멸
            blink = self.trigger_timer % 6 < 3
            glow_color = (
                (255, 50, 50, glow_alpha) if blink else (255, 150, 50, glow_alpha)
            )
            core_color = RED if blink else ORANGE
        else:
            glow_color = (*self.glow_color, glow_alpha)
            core_color = self.base_color

        # 외곽 글로우
        pygame.draw.circle(
            glow_surf,
            glow_color,
            (self.width // 2 + 10, self.height // 2 + 10),
            self.width // 2 + self.glow_radius,
        )
        surface.blit(glow_surf, (self.rect.x - 10, self.rect.y - 10))

        # 본체 (동그란 기뢰)
        pygame.draw.circle(surface, core_color, self.rect.center, self.width // 2)

        # 스파이크 (8방향)
        for i in range(8):
            angle = i * 45 + self.pulse_timer * 10
            angle_rad = angle * (math.pi / 180)
            spike_length = 8 + self.glow_radius
            start_x = self.rect.centerx + (self.width // 2 - 2) * math.cos(angle_rad)
            start_y = self.rect.centery + (self.width // 2 - 2) * math.sin(angle_rad)
            end_x = self.rect.centerx + (self.width // 2 + spike_length) * math.cos(
                angle_rad
            )
            end_y = self.rect.centery + (self.width // 2 + spike_length) * math.sin(
                angle_rad
            )
            pygame.draw.line(
                surface,
                YELLOW if not self.triggered else RED,
                (int(start_x), int(start_y)),
                (int(end_x), int(end_y)),
                2,
            )

        # 중심 코어
        core_pulse = int(4 + 2 * math.sin(self.pulse_timer * 3))
        pygame.draw.circle(
            surface,
            YELLOW if not self.triggered else WHITE,
            self.rect.center,
            core_pulse,
        )
