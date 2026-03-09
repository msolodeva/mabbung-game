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

    def __init__(self, x, y, color, enemies, target=None):
        self.rect = pygame.Rect(x - 5, y, 10, 20)
        # 정밀한 이동을 위해 실수형 좌표 사용
        self.pos_x = float(x)
        self.pos_y = float(y)
        self.color = color
        self.speed = 8
        self.angle = -90 + random.randint(-20, 20)
        self.enemies = enemies
        self.target = target
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
                        key=lambda e: (
                            (e.rect.centerx - px) ** 2 + (e.rect.centery - py) ** 2
                        ),
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

        # 미사일 꼬리 불꽃
        flame_h = random.randint(4, 8)
        pygame.draw.polygon(
            missile_surf, (255, 100, 0), [(7, 20), (13, 20), (10, 20 + flame_h)]
        )
        pygame.draw.polygon(
            missile_surf, (255, 200, 0), [(8, 20), (12, 20), (10, 20 + flame_h - 2)]
        )

        # 미사일 본체 (쉐이딩)
        pygame.draw.rect(missile_surf, (40, 40, 40), (6, 5, 8, 15))
        pygame.draw.rect(missile_surf, WHITE, (8, 5, 4, 15))

        # 미사일 머리 (빨간색 콘)
        pygame.draw.polygon(missile_surf, (200, 0, 0), [(6, 5), (14, 5), (10, 0)])
        pygame.draw.polygon(missile_surf, (255, 50, 50), [(8, 5), (12, 5), (10, 2)])

        # 미사일 날개
        pygame.draw.polygon(missile_surf, (100, 100, 100), [(6, 15), (2, 20), (6, 20)])
        pygame.draw.polygon(
            missile_surf, (100, 100, 100), [(14, 15), (18, 20), (14, 20)]
        )

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
        # 빛나는 효과 (글로우)
        glow_surf = pygame.Surface((18, 50), pygame.SRCALPHA)
        pygame.draw.rect(
            glow_surf, (*self.color[:3], 100), (0, 0, 18, 50), border_radius=4
        )
        pygame.draw.rect(
            glow_surf, (*self.color[:3], 200), (3, 2, 12, 46), border_radius=3
        )
        surface.blit(glow_surf, (self.rect.x - 6, self.rect.y - 5))

        # 레이저 코어 (매우 밝음)
        pygame.draw.rect(surface, WHITE, self.rect)

        # 전면부 뾰족한 에너지 스파크
        spark_y = self.rect.y - random.randint(2, 6)
        pygame.draw.line(
            surface,
            WHITE,
            (self.rect.centerx, self.rect.y),
            (self.rect.centerx, spark_y),
            2,
        )
        pygame.draw.line(
            surface,
            self.color,
            (self.rect.left, self.rect.y),
            (self.rect.centerx, spark_y),
            1,
        )
        pygame.draw.line(
            surface,
            self.color,
            (self.rect.right, self.rect.y),
            (self.rect.centerx, spark_y),
            1,
        )


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
        self.hit_enemies = set()

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
            surf_size = self.radius * 2
            s = pygame.Surface((surf_size, surf_size), pygame.SRCALPHA)

            # 파동의 여러 레이어 (입체감)
            # 바깥쪽 흐릿한 파동
            pygame.draw.arc(
                s,
                (*self.color[:3], int(self.alpha * 0.4)),
                (0, 0, surf_size, surf_size),
                math.radians(45),
                math.radians(135),
                int(15 * (self.radius / self.max_radius) + 5),
            )
            # 중간 밝은 파동
            pygame.draw.arc(
                s,
                (*self.color[:3], self.alpha),
                (5, 5, surf_size - 10, surf_size - 10),
                math.radians(50),
                math.radians(130),
                max(2, int(8 * (1 - self.radius / self.max_radius))),
            )
            # 중심부 날카로운 코어 라인
            core_alpha = min(255, int(self.alpha * 1.5))
            pygame.draw.arc(
                s,
                (255, 255, 255, core_alpha),
                (10, 10, surf_size - 20, surf_size - 20),
                math.radians(55),
                math.radians(125),
                2,
            )

            # 파동 내부에 지지직거리는 에너지 라인 (번개 효과)
            if self.radius > 20 and self.alpha > 50:
                for _ in range(3):
                    angle = math.radians(random.uniform(50, 130))
                    r_offset = random.uniform(-10, 10)
                    ex1 = surf_size // 2 + (self.radius / 2 + r_offset) * math.cos(
                        angle
                    )
                    ey1 = surf_size // 2 - (self.radius / 2 + r_offset) * math.sin(
                        angle
                    )
                    ex2 = surf_size // 2 + (self.radius / 2 + r_offset + 10) * math.cos(
                        angle + 0.1
                    )
                    ey2 = surf_size // 2 - (self.radius / 2 + r_offset + 10) * math.sin(
                        angle + 0.1
                    )
                    pygame.draw.line(
                        s, (150, 255, 255, self.alpha), (ex1, ey1), (ex2, ey2), 1
                    )

            surface.blit(s, (self.x - self.radius, self.y - self.radius))
