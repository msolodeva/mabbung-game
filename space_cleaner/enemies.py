# enemies.py
# 적 유닛: UFO, 헤비급 함선, 적 총알

import pygame
import random

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
        self.rect.x += self.vx
        self.rect.y += self.vy

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

        # 난이도에 따른 속도 증가 (0.4 -> 0.25로 완화)
        base_speed = random.uniform(2, 4)
        self.speed_y = base_speed * (1 + (difficulty - 1) * 0.25)
        self.speed_x = random.choice([-3, 3]) * (1 + (difficulty - 1) * 0.15)

        self.move_timer = 0
        self.fire_timer = 0

        # 난이도가 높을수록 발사 간격 감소
        min_fire = max(30, int(60 / difficulty))
        max_fire = max(60, int(120 / difficulty))
        self.fire_rate = random.randint(min_fire, max_fire)

    def update(self, enemy_bullets):
        self.rect.y += self.speed_y
        self.rect.x += self.speed_x

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

        # 체력 스케일링 완화 (기존 30 + 10 * difficulty -> 30 + 7 * difficulty)
        self.max_health = 30 + 7 * difficulty
        self.health = self.max_health

        self.target_y = random.randint(50, 200)
        self.state = "entering"

        self.fire_timer = 0
        self.fire_rate = max(40, int(90 / difficulty))

    def update(self, enemy_bullets):
        # 움직임 로직: 등장 후 좌우 이동
        if self.state == "entering":
            self.rect.y += self.speed
            if self.rect.y >= self.target_y:
                self.state = "fighting"
        else:
            self.rect.x += self.speed_x
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

        self.speed_y = 8 * (1 + (difficulty - 1) * 0.3)
        self.speed_x = random.uniform(-2, 2)

    def update(self, enemy_bullets):
        self.rect.y += self.speed_y
        self.rect.x += self.speed_x

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
        self.fire_rate = max(60, int(150 / difficulty))
        self.color = WHITE

    def update(self, enemy_bullets, players=None):
        if self.state == "entering":
            self.rect.y += 3
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
        self.x = random.randint(0, WIDTH - self.width)
        self.y = -self.height
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)

        self.speed_y = 3 * (1 + (difficulty - 1) * 0.1)
        self.timer = 0
        self.is_ghost = False
        self.color = (200, 200, 255)

    def update(self, enemy_bullets):
        self.rect.y += self.speed_y
        self.timer += 1
        # 2초 주기로 상태 변화 (60fps 기준 120프레임)
        if self.timer % 120 < 60:
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
