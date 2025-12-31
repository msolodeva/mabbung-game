# background.py
# 배경 환경 시스템: 별, 행성, 성운 등

import pygame
import random

from constants import (
    WIDTH,
    HEIGHT,
    WHITE,
    LIGHT_GREY,
    YELLOW,
    NAVY,
    PURPLE,
    ORANGE,
    DARK_GREY,
)


class Star:
    """
    배경의 별 파티클.
    깊이(layer)에 따라 크기와 속도가 다름.
    """

    def __init__(self):
        self.reset()
        # 초기 배치 시 화면 전체에 무작위 분포
        self.y = random.randint(0, HEIGHT)

    def reset(self):
        self.x = random.randint(0, WIDTH)
        self.y = -10
        # 깊이 레이어 (1: 멀리 있음, 2: 중간, 3: 가까움)
        self.layer = random.randint(1, 3)
        self.speed = self.layer * 1.5
        self.size = self.layer
        self.color = random.choice([WHITE, LIGHT_GREY, YELLOW])

    def update(self):
        self.y += self.speed
        if self.y > HEIGHT:
            self.reset()

    def draw(self, surface):
        # 가까운 별(layer 3)은 이동 선(streaks)으로 그려서 속도감 표현
        if self.layer == 3:
            pygame.draw.line(
                surface, self.color, (self.x, self.y), (self.x, self.y + 5), 1
            )
        else:
            pygame.draw.circle(
                surface, self.color, (int(self.x), int(self.y)), self.size // 2 + 1
            )


class BackgroundObject:
    """
    행성이나 성운 등 배경에서 멀리 지나가는 물체.
    """

    def __init__(self, obj_type="planet"):
        self.obj_type = obj_type
        self.size = (
            random.randint(100, 300)
            if obj_type == "nebula"
            else random.randint(40, 120)
        )
        self.x = random.randint(-50, WIDTH + 50)
        self.y = -self.size
        self.speed = random.uniform(0.5, 1.2)
        self.color = random.choice([NAVY, PURPLE, ORANGE, DARK_GREY])

        # 행성의 경우 표면 텍스처(간단한 원들) 미리 생성
        if obj_type == "planet":
            self.surface = pygame.Surface((self.size, self.size), pygame.SRCALPHA)
            pygame.draw.circle(
                self.surface,
                self.color,
                (self.size // 2, self.size // 2),
                self.size // 2,
            )
            # 입체감을 위한 음영
            shade_color = (
                max(0, self.color[0] - 40),
                max(0, self.color[1] - 40),
                max(0, self.color[2] - 40),
                150,
            )
            pygame.draw.circle(
                self.surface,
                shade_color,
                (self.size // 2 + 5, self.size // 2 + 5),
                self.size // 2,
                self.size // 4,
            )
            # 행성 고리 (확률적)
            if random.random() > 0.7:
                ring_rect = pygame.Rect(0, self.size // 2 - 5, self.size, 10)
                pygame.draw.ellipse(self.surface, WHITE, ring_rect, 2)
        else:
            # 성운은 반투명한 부드러운 효과
            self.surface = pygame.Surface((self.size, self.size), pygame.SRCALPHA)
            for r in range(self.size // 2, 0, -5):
                alpha = int((r / (self.size // 2)) * 30)
                pygame.draw.circle(
                    self.surface,
                    (*self.color, alpha),
                    (self.size // 2, self.size // 2),
                    r,
                )

    def update(self):
        self.y += self.speed

    def draw(self, surface):
        surface.blit(self.surface, (self.x, self.y))


class BackgroundManager:
    """
    별과 배경 오브젝트를 관리하는 매니저.
    """

    def __init__(self):
        self.stars = [Star() for _ in range(120)]
        self.bg_objects = []
        self.timer = 0

    def update(self):
        for star in self.stars:
            star.update()

        for obj in self.bg_objects[:]:
            obj.update()
            if obj.y > HEIGHT + 100:
                self.bg_objects.remove(obj)

        self.timer += 1
        # 가끔 행성이나 성운 생성
        if self.timer > 300:
            obj_type = "nebula" if random.random() > 0.6 else "planet"
            self.bg_objects.append(BackgroundObject(obj_type))
            self.timer = 0

    def draw(self, surface):
        # 1. 성운 등 가장 먼 물체
        for obj in self.bg_objects:
            if obj.obj_type == "nebula":
                obj.draw(surface)

        # 2. 별 (레이어별로 그려도 좋지만 여기선 한꺼번에)
        for star in self.stars:
            star.draw(surface)

        # 3. 행성
        for obj in self.bg_objects:
            if obj.obj_type == "planet":
                obj.draw(surface)
