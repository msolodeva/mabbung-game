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
        # 정밀한 이동을 위해 실수형 좌표 사용
        self.pos_x = float(x)
        self.pos_y = float(y)
        self.color = color
        self.speed = 8
        self.angle = -90 + random.randint(-20, 20)
        self.enemies = enemies
        self.target = None
        self.turn_speed = 8  # 너무 빠르면 부자연스러우므로 적절히 조정
        self.lifetime = 240  # 4초로 수명 연장

    def update(self):
        self.lifetime -= 1

        # 타겟 유효성 검사
        if self.target and self.target not in self.enemies:
            self.target = None

        # 타겟 탐색
        if not self.target:
            if self.enemies:
                # 현재 진행 방향(angle) 전방에 있는 적을 선호하도록 가중치 부여 가능하나,
                # 일단 가장 가까운 적을 찾되, 화면 밖 너무 멀리 있는 적은 제외
                px, py = self.pos_x, self.pos_y
                candidates = [
                    e
                    for e in self.enemies
                    if 0 < e.rect.centerx < WIDTH and 0 < e.rect.centery < HEIGHT
                ]

                if candidates:
                    self.target = min(
                        candidates,
                        key=lambda e: (e.rect.centerx - px) ** 2
                        + (e.rect.centery - py) ** 2,
                    )

        if self.target:
            # 타겟 방향 계산
            target_dx = self.target.rect.centerx - self.pos_x
            target_dy = self.target.rect.centery - self.pos_y
            target_angle = math.degrees(math.atan2(target_dy, target_dx))

            # 각도 차이 계산 (-180 ~ 180)
            angle_diff = (target_angle - self.angle + 180) % 360 - 180

            # 부드러운 회전
            if abs(angle_diff) < self.turn_speed:
                self.angle = target_angle
            else:
                # 타겟 쪽으로 회전
                if angle_diff > 0:
                    self.angle += self.turn_speed
                else:
                    self.angle -= self.turn_speed

        # 이동 (실수 좌표 업데이트)
        self.pos_x += math.cos(math.radians(self.angle)) * self.speed
        self.pos_y += math.sin(math.radians(self.angle)) * self.speed

        # Rect 동기화
        self.rect.centerx = int(self.pos_x)
        self.rect.centery = int(self.pos_y)

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
