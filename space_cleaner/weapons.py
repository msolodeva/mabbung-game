# weapons.py
# 특수 무기: 호밍 미사일, 관통 레이저, 플라즈마 파동

import pygame
import math
import random
from constants import WIDTH, HEIGHT, YELLOW, CYAN, ORANGE, WHITE, RED


class HomingMissile:
    """
    호밍 미사일.
    - 가장 가까운 적을 추적하여 곡선 이동
    - 적과 충돌 시 폭발
    """

    def __init__(self, x, y, color, enemies):
        self.rect = pygame.Rect(x - 5, y, 10, 20)
        self.color = color
        self.speed = 7
        self.angle = -90  # 위쪽 방향 (도 단위)
        self.enemies = enemies
        self.target = None
        self.turn_speed = 5  # 초당 회전 각도
        self.lifetime = 180  # 3초 수명

    def update(self):
        self.lifetime -= 1

        # 타겟팅 (살아있는 적 중 가장 가까운 것)
        if not self.target or not self.target in self.enemies:
            if self.enemies:
                self.target = min(
                    self.enemies,
                    key=lambda e: (e.rect.centerx - self.rect.centerx) ** 2
                    + (e.rect.centery - self.rect.centery) ** 2,
                )

        if self.target:
            # 타겟 방향 계산
            target_dx = self.target.rect.centerx - self.rect.centerx
            target_dy = self.target.rect.centery - self.rect.centery
            target_angle = math.degrees(math.atan2(target_dy, target_dx))

            # 각도 차이 계산 및 회전
            angle_diff = (target_angle - self.angle + 180) % 360 - 180
            if angle_diff > 0:
                self.angle += min(self.turn_speed, angle_diff)
            else:
                self.angle -= min(self.turn_speed, abs(angle_diff))

        # 이동
        self.rect.x = int(self.rect.x + math.cos(math.radians(self.angle)) * self.speed)
        self.rect.y = int(self.rect.y + math.sin(math.radians(self.angle)) * self.speed)

    def draw(self, surface):
        # 회전된 미사일 그리기
        missile_surf = pygame.Surface((20, 20), pygame.SRCALPHA)
        pygame.draw.rect(missile_surf, self.color, (5, 0, 10, 20))
        pygame.draw.polygon(missile_surf, WHITE, [(5, 0), (15, 0), (10, -5)])

        rotated_surf = pygame.transform.rotate(missile_surf, -self.angle - 90)
        surface.blit(rotated_surf, rotated_surf.get_rect(center=self.rect.center))


class PiercingLaser:
    """
    관통 레이저.
    - 적을 통과하며 다수의 적에게 피해
    """

    def __init__(self, x, y, color):
        self.rect = pygame.Rect(x - 3, y, 6, 40)
        self.color = color
        self.speed = -15
        self.hit_enemies = set()  # 이미 맞은 적들을 기록하여 중복 타격 방지

    def update(self):
        self.rect.y += self.speed

    def draw(self, surface):
        # 빛나는 효과와 함께 그리기
        pygame.draw.rect(surface, WHITE, self.rect)
        pygame.draw.rect(surface, self.color, self.rect, 2)


class PlasmaWave:
    """
    플라즈마 파동.
    - 전방 부채꼴 모양으로 확장되는 파동
    """

    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        self.radius = 10
        self.max_radius = 150
        self.speed = 5
        self.lifetime = 60
        self.alpha = 200

    @property
    def rect(self):
        # 충돌 검사용 가상 rect
        return pygame.Rect(
            self.x - self.radius,
            self.y - self.radius - self.radius,
            self.radius * 2,
            self.radius * 2,
        )

    def update(self):
        self.radius += self.speed
        self.y -= self.speed * 0.5
        self.lifetime -= 1
        self.alpha = max(0, self.alpha - 4)

    def draw(self, surface):
        if self.alpha > 0:
            s = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
            pygame.draw.arc(
                s,
                (*self.color, self.alpha),
                (0, 0, self.radius * 2, self.radius * 2),
                math.radians(45),
                math.radians(135),
                10,
            )
            surface.blit(s, (self.x - self.radius, self.y - self.radius))
