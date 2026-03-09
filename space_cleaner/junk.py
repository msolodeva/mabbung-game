# junk.py
# 우주 쓰레기: 소행성, 인공위성, 우주 정거장

import pygame
import random
import math

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
            # 기준 다각형 점 (회전 적용)
            rotated_points = [pt.rotate(self.angle) + center for pt in self.points]

            # 음영(그림자) 파트 (약간 오른쪽 아래로 오프셋)
            shadow_points = [
                pygame.math.Vector2(pt.x + 3, pt.y + 3) for pt in rotated_points
            ]
            pygame.draw.polygon(surface, (40, 40, 40), shadow_points)

            # 메인 암석 바디
            base_color = (100, 100, 100) if self.color == BLUE else (120, 90, 80)
            light_color = (140, 140, 140) if self.color == BLUE else (160, 120, 100)

            pygame.draw.polygon(surface, base_color, rotated_points)

            # 하이라이트 (왼쪽 위에서 빛이 온다고 가정, 약간 축소 및 오프셋)
            highlight_points = [
                pygame.math.Vector2(pt.x - 2, pt.y - 2) for pt in rotated_points
            ]
            pygame.draw.polygon(surface, light_color, highlight_points, 3)

            # 크레이터 및 디테일 라인 (회전 적용)
            pygame.draw.polygon(surface, DARK_GREY, rotated_points, 2)
            for p1, p2 in self.detail_lines:
                rp1 = p1.rotate(self.angle) + center
                rp2 = p2.rotate(self.angle) + center
                pygame.draw.line(surface, (80, 80, 80), rp1, rp2, 2)

            # 타겟 코어 (광물)
            core_r = max(4, self.size // 8)
            pygame.draw.circle(
                surface, DARK_GREY, (int(center.x), int(center.y)), core_r + 2
            )
            pygame.draw.circle(
                surface, self.color, (int(center.x), int(center.y)), core_r
            )
            # 코어 반짝임
            if pygame.time.get_ticks() % 1000 < 100:
                pygame.draw.circle(
                    surface, WHITE, (int(center.x - 1), int(center.y - 1)), 2
                )

        elif self.type == "satellite":
            # 인공 위성 그리기
            # 패널 (디테일 추가)
            panel_surf = pygame.Surface((44, 12), pygame.SRCALPHA)
            pygame.draw.rect(panel_surf, (50, 80, 150), (0, 0, 44, 12), border_radius=2)
            # 태양 전지판 그리드
            for i in range(4, 44, 8):
                pygame.draw.line(panel_surf, (100, 150, 255), (i, 0), (i, 12), 1)
            pygame.draw.line(panel_surf, (100, 150, 255), (0, 6), (44, 6), 1)
            pygame.draw.rect(panel_surf, WHITE, (0, 0, 44, 12), 1)

            rotated_panel = pygame.transform.rotate(panel_surf, self.angle)
            surface.blit(rotated_panel, rotated_panel.get_rect(center=center))

            # 본체
            body_surf = pygame.Surface((20, 20), pygame.SRCALPHA)
            pygame.draw.rect(
                body_surf, (150, 150, 160), (0, 0, 20, 20), border_radius=3
            )
            pygame.draw.rect(
                body_surf, (80, 80, 90), (0, 0, 20, 20), 2, border_radius=3
            )
            # 패널 결합부
            pygame.draw.rect(body_surf, DARK_GREY, (8, -2, 4, 24))
            # 코어 라이트
            pygame.draw.circle(body_surf, DARK_GREY, (10, 10), 6)
            pygame.draw.circle(body_surf, self.color, (10, 10), 4)

            # 안테나 및 깜빡이는 신호등
            pygame.draw.line(body_surf, DARK_GREY, (10, 0), (10, -8), 2)
            blink_color = RED if pygame.time.get_ticks() % 500 < 250 else (100, 0, 0)
            pygame.draw.circle(body_surf, blink_color, (10, -8), 2)

            rotated_body = pygame.transform.rotate(body_surf, self.angle)
            surface.blit(rotated_body, rotated_body.get_rect(center=center))

        else:
            # 우주 정거장 그리기 (십자 모양 모듈식)
            sz = self.size
            surf = pygame.Surface((sz * 2, sz * 2), pygame.SRCALPHA)
            cx, cy = sz, sz  # 서피스 중심
            arm = int(sz * 0.45)
            w = int(sz * 0.2)
            mod = int(sz * 0.22)
            hub_r = int(sz * 0.22)

            # 그림자 레이어
            pygame.draw.rect(
                surf, (40, 40, 40), (cx - arm + 2, cy - w // 2 + 2, arm * 2, w)
            )
            pygame.draw.rect(
                surf, (40, 40, 40), (cx - w // 2 + 2, cy - arm + 2, w, arm * 2)
            )

            # 가로 팔 (입체감)
            pygame.draw.rect(surf, (160, 160, 170), (cx - arm, cy - w // 2, arm * 2, w))
            pygame.draw.line(
                surf,
                (200, 200, 210),
                (cx - arm, cy - w // 2),
                (cx + arm, cy - w // 2),
                2,
            )  # 하이라이트
            pygame.draw.rect(surf, DARK_GREY, (cx - arm, cy - w // 2, arm * 2, w), 1)

            # 세로 팔
            pygame.draw.rect(surf, (160, 160, 170), (cx - w // 2, cy - arm, w, arm * 2))
            pygame.draw.line(
                surf,
                (200, 200, 210),
                (cx - w // 2, cy - arm),
                (cx - w // 2, cy + arm),
                2,
            )
            pygame.draw.rect(surf, DARK_GREY, (cx - w // 2, cy - arm, w, arm * 2), 1)

            # 팔 끝 모듈 (4방향) - 태양광 패널 라인 추가
            for i, (dx, dy) in enumerate(
                [
                    (arm - mod, -mod // 2),
                    (-arm, -mod // 2),
                    (-mod // 2, arm - mod),
                    (-mod // 2, -arm),
                ]
            ):
                mod_rect = pygame.Rect(cx + dx, cy + dy, mod, mod)
                pygame.draw.rect(surf, (120, 120, 130), mod_rect, border_radius=2)
                pygame.draw.rect(surf, DARK_GREY, mod_rect, 2, border_radius=2)

                # 창문/라이트 장식
                light_color = self.color if i % 2 == 0 else (255, 255, 100)
                pygame.draw.rect(surf, light_color, (cx + dx + 2, cy + dy + 2, 4, 4))
                pygame.draw.rect(
                    surf, light_color, (cx + dx + mod - 6, cy + dy + mod - 6, 4, 4)
                )

            # 중앙 허브
            pygame.draw.circle(surf, (140, 140, 150), (cx, cy), hub_r)
            pygame.draw.circle(surf, DARK_GREY, (cx, cy), hub_r, 2)
            # 메인 타겟 코어
            pygame.draw.circle(surf, DARK_GREY, (cx, cy), hub_r - 2)
            pygame.draw.circle(surf, self.color, (cx, cy), hub_r - 4)
            # 코어 유리 반사
            pygame.draw.arc(
                surf,
                WHITE,
                (cx - hub_r + 6, cy - hub_r + 6, hub_r * 2 - 12, hub_r * 2 - 12),
                math.radians(20),
                math.radians(70),
                2,
            )

            rotated_surf = pygame.transform.rotate(surf, self.angle)
            surface.blit(
                rotated_surf,
                rotated_surf.get_rect(center=(int(center.x), int(center.y))),
            )
