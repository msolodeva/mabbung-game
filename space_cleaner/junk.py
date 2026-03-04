# junk.py
# 우주 쓰레기: 소행성, 인공위성, 우주 정거장

import pygame
import random

from constants import (
    WIDTH,
    RED,
    BLUE,
    GREY,
    DARK_GREY,
    LIGHT_GREY,
    WHITE,
    JUNK_SPEED_Y_MIN,
    JUNK_SPEED_Y_MAX,
)


class Junk:
    """
    우주 쓰레기 클래스.
    - "asteroid": 불규칙한 암석 형태
    - "satellite": 인공위성 형태 (본체 + 태양광 패널)

    색상(RED/BLUE)에 맞는 레이저로 맞춰야 점수 획득.
    """

    def __init__(self, difficulty=1.0):
        self.type = random.choice(["asteroid", "satellite", "space_station"])
        self.size = random.randint(30, 50)
        self.x = random.randint(0, WIDTH - self.size)
        self.y = -self.size
        self.rect = pygame.Rect(self.x, self.y, self.size, self.size)
        self.color = random.choice([RED, BLUE])

        # 난이도에 따른 속도 증가
        self.speed_y = random.uniform(JUNK_SPEED_Y_MIN, JUNK_SPEED_Y_MAX) * (
            1 + (difficulty - 1) * 0.5
        )
        self.speed_x = random.uniform(-1.0, 1.0) * (1 + (difficulty - 1) * 0.2)

        self.angle = 0
        self.rotation_speed = random.uniform(-4, 4) * difficulty

        if self.type == "asteroid":
            self._setup_asteroid()
        elif self.type == "satellite":
            self._setup_satellite()
        else:
            self._setup_space_station()

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

    def _setup_space_station(self):
        """폐기된 우주 정거장 (십자 형태) 설정."""
        arm = int(self.size * 0.45)
        w = int(self.size * 0.18)
        # 가로/세로 팔 로컬 좌표 (중심 기준)
        self.h_arm = pygame.Rect(-arm, -w // 2, arm * 2, w)
        self.v_arm = pygame.Rect(-w // 2, -arm, w, arm * 2)
        self.hub_radius = int(self.size * 0.18)
        # 각 팔 끝에 붙은 모듈 크기
        self.module_size = int(self.size * 0.18)

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
        elif self.type == "satellite":
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

        else:
            # 우주 정거장 그리기 (십자 모양)
            sz = self.size
            surf = pygame.Surface((sz * 2, sz * 2), pygame.SRCALPHA)
            cx, cy = sz, sz  # 서피스 중심
            arm = int(sz * 0.45)
            w = int(sz * 0.18)
            mod = int(sz * 0.18)
            hub_r = int(sz * 0.18)

            # 가로 팔
            pygame.draw.rect(surf, LIGHT_GREY, (cx - arm, cy - w // 2, arm * 2, w))
            pygame.draw.rect(surf, DARK_GREY, (cx - arm, cy - w // 2, arm * 2, w), 1)
            # 세로 팔
            pygame.draw.rect(surf, LIGHT_GREY, (cx - w // 2, cy - arm, w, arm * 2))
            pygame.draw.rect(surf, DARK_GREY, (cx - w // 2, cy - arm, w, arm * 2), 1)
            # 팔 끝 모듈 (4방향)
            for dx, dy in [
                (arm - mod, -mod // 2),
                (-arm, -mod // 2),
                (-mod // 2, arm - mod),
                (-mod // 2, -arm),
            ]:
                pygame.draw.rect(surf, GREY, (cx + dx, cy + dy, mod, mod))
                pygame.draw.rect(surf, DARK_GREY, (cx + dx, cy + dy, mod, mod), 1)
            # 중앙 허브
            pygame.draw.circle(surf, GREY, (cx, cy), hub_r)
            pygame.draw.circle(surf, self.color, (cx, cy), hub_r - 3)
            pygame.draw.circle(surf, DARK_GREY, (cx, cy), hub_r, 1)

            rotated_surf = pygame.transform.rotate(surf, self.angle)
            surface.blit(
                rotated_surf,
                rotated_surf.get_rect(center=(int(center.x), int(center.y))),
            )
