# junk.py
# 우주 쓰레기: 소행성, 인공위성

import pygame
import random

from constants import WIDTH, RED, BLUE, GREY, DARK_GREY, LIGHT_GREY, WHITE


class Junk:
    """
    우주 쓰레기 클래스.
    - "asteroid": 불규칙한 암석 형태
    - "satellite": 인공위성 형태 (본체 + 태양광 패널)

    색상(RED/BLUE)에 맞는 레이저로 맞춰야 점수 획득.
    """

    def __init__(self, difficulty=1.0):
        self.type = random.choice(["asteroid", "satellite"])
        self.size = random.randint(30, 50)
        self.x = random.randint(0, WIDTH - self.size)
        self.y = -self.size
        self.rect = pygame.Rect(self.x, self.y, self.size, self.size)
        self.color = random.choice([RED, BLUE])

        # 난이도에 따른 속도 증가
        self.speed_y = random.uniform(2, 5) * (1 + (difficulty - 1) * 0.5)
        self.speed_x = random.uniform(-1.0, 1.0) * (1 + (difficulty - 1) * 0.2)

        self.angle = 0
        self.rotation_speed = random.uniform(-4, 4) * difficulty

        if self.type == "asteroid":
            self._setup_asteroid()
        else:
            self._setup_satellite()

    def _setup_asteroid(self):
        """불규칙한 다각형 꼭짓점 생성."""
        self.num_points = random.randint(5, 8)
        self.points = []
        for i in range(self.num_points):
            angle_rad = (i / self.num_points) * 2 * 3.14159
            radius = random.uniform(self.size * 0.3, self.size * 0.5)
            pt_x = radius * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).x
            pt_y = radius * pygame.math.Vector2(1, 0).rotate_rad(angle_rad).y
            self.points.append(pygame.math.Vector2(pt_x, pt_y))

        self.detail_lines = []
        for _ in range(3):
            p1 = random.choice(self.points) * 0.8
            p2 = random.choice(self.points) * 0.8
            self.detail_lines.append((p1, p2))

    def _setup_satellite(self):
        """위성 형태 (본체 + 태양광 패널) 설정."""
        self.body_rect = pygame.Rect(-8, -8, 16, 16)
        self.panel_rect = pygame.Rect(-20, -4, 40, 8)
        self.antenna = pygame.math.Vector2(0, -15)

    def update(self):
        self.rect.y = int(self.rect.y + self.speed_y)
        self.rect.x = int(self.rect.x + self.speed_x)
        self.angle += self.rotation_speed
        if self.rect.left < 0 or self.rect.right > WIDTH:
            self.speed_x *= -1

    def draw(self, surface):
        center = pygame.math.Vector2(self.rect.center)

        if self.type == "asteroid":
            rotated_points = [pt.rotate(self.angle) + center for pt in self.points]
            pygame.draw.polygon(surface, GREY, rotated_points)
            pygame.draw.polygon(surface, DARK_GREY, rotated_points, 2)
            # 코어 표시
            pygame.draw.circle(
                surface, self.color, (int(center.x), int(center.y)), self.size // 7
            )
            for p1, p2 in self.detail_lines:
                rp1 = p1.rotate(self.angle) + center
                rp2 = p2.rotate(self.angle) + center
                pygame.draw.line(surface, DARK_GREY, rp1, rp2, 1)
        else:
            # 인공 위성 그리기
            panel_surf = pygame.Surface((40, 8), pygame.SRCALPHA)
            pygame.draw.rect(panel_surf, (100, 100, 255), (0, 0, 40, 8))
            pygame.draw.rect(panel_surf, WHITE, (0, 0, 40, 8), 1)

            rotated_panel = pygame.transform.rotate(panel_surf, self.angle)
            surface.blit(rotated_panel, rotated_panel.get_rect(center=center))

            body_surf = pygame.Surface((16, 16), pygame.SRCALPHA)
            pygame.draw.rect(body_surf, LIGHT_GREY, (0, 0, 16, 16))
            pygame.draw.rect(body_surf, DARK_GREY, (0, 0, 16, 16), 1)
            pygame.draw.circle(body_surf, self.color, (8, 8), 4)

            rotated_body = pygame.transform.rotate(body_surf, self.angle)
            surface.blit(rotated_body, rotated_body.get_rect(center=center))
