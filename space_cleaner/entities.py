# entities.py
# 플레이어, 레이저, 아이템, 폭발 효과 등 핵심 엔티티

import pygame
import random

from constants import WIDTH, HEIGHT, WHITE, RED, GREEN, CYAN, ORANGE


class Player:
    """
    플레이어 우주선 클래스.
    - 이동, 체력, 점수, 무기 레벨 관리
    - 체력바 표시 포함
    """

    def __init__(self, x, y, color, controls):
        self.rect = pygame.Rect(x, y, 40, 40)
        self.color = color
        self.controls = controls
        self.speed = 5
        self.score = 0
        self.max_health = 140
        self.health = self.max_health
        self.weapon_level = 1  # 무기 레벨 (1~3)
        self.bomb_count = 3  # 폭탄 개수 (기본 3개)
        self.max_bombs = 3  # 최대 폭탄 개수
        self.weapon_timer = 0  # 무기 강화 지속 시간 프레임

    def update(self):
        """플레이어 상태 업데이트 (타이머 등)."""
        if self.weapon_level > 1:
            self.weapon_timer -= 1
            if self.weapon_timer <= 0:
                self.weapon_level = 1

    def handle_input(self, keys):
        """
        키보드 입력에 따른 이동 처리.
        Pygame 좌표계: (0,0)은 왼쪽 상단.
        """
        if keys[self.controls["left"]] and self.rect.left > 0:
            self.rect.x -= self.speed
        if keys[self.controls["right"]] and self.rect.right < WIDTH:
            self.rect.x += self.speed
        if keys[self.controls["up"]] and self.rect.top > 0:
            self.rect.y -= self.speed
        if keys[self.controls["down"]] and self.rect.bottom < HEIGHT:
            self.rect.y += self.speed

    def draw(self, surface):
        """우주선과 체력바 그리기."""
        # 중심 본체
        body_rect = pygame.Rect(self.rect.centerx - 8, self.rect.top + 10, 16, 30)
        pygame.draw.rect(surface, self.color, body_rect)

        # 머리 부분 (삼각형)
        head_points = [
            (self.rect.centerx, self.rect.top),
            (self.rect.centerx - 8, self.rect.top + 10),
            (self.rect.centerx + 8, self.rect.top + 10),
        ]
        pygame.draw.polygon(surface, self.color, head_points)

        # 왼쪽 날개
        left_wing = [
            (self.rect.centerx - 8, self.rect.top + 15),
            (self.rect.left, self.rect.bottom),
            (self.rect.centerx - 8, self.rect.bottom - 5),
        ]
        pygame.draw.polygon(surface, self.color, left_wing)

        # 오른쪽 날개
        right_wing = [
            (self.rect.centerx + 8, self.rect.top + 15),
            (self.rect.right, self.rect.bottom),
            (self.rect.centerx + 8, self.rect.bottom - 5),
        ]
        pygame.draw.polygon(surface, self.color, right_wing)

        # 조종석 (포인트)
        pygame.draw.circle(surface, WHITE, (self.rect.centerx, self.rect.top + 18), 4)

        # 체력바는 이제 HUD에 표시하므로 제거


class Laser:
    """
    플레이어가 발사하는 레이저.
    위쪽으로 이동 (Y 감소).
    """

    def __init__(self, x, y, color):
        self.rect = pygame.Rect(x - 2, y, 4, 15)
        self.color = color
        self.speed = -10  # 위로 이동

    def update(self):
        self.rect.y += self.speed

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, self.rect)


class Item:
    """
    수집 가능한 아이템.
    - "weapon": 무기 레벨 업 (시안색, P 표시)
    - "health": 체력 회복 (녹색, H 표시)
    """

    def __init__(self):
        self.size = 25
        self.x = random.randint(0, WIDTH - self.size)
        self.y = -self.size
        self.rect = pygame.Rect(self.x, self.y, self.size, self.size)
        self.speed = 3

        # 아이템 종류 결정 (30% 무기, 40% 체력, 30% 폭탄)
        r = random.random()
        if r < 0.3:
            self.kind = "weapon"
            self.color = CYAN
            self.label = "P"
        elif r < 0.7:
            self.kind = "health"
            self.color = GREEN
            self.label = "H"
        else:
            self.kind = "bomb"
            self.color = ORANGE
            self.label = "B"

        self.pulse = 0
        self.pulse_dir = 1

    def update(self):
        self.y += self.speed
        self.rect.y = self.y
        # 빛나는 효과를 위한 펄스
        self.pulse += self.pulse_dir * 0.1
        if self.pulse > 1 or self.pulse < 0:
            self.pulse_dir *= -1

    def draw(self, surface):
        # 외부 광후 효과
        glow_size = int(self.size * (1.2 + self.pulse * 0.3))
        glow_surf = pygame.Surface((glow_size * 2, glow_size * 2), pygame.SRCALPHA)
        pygame.draw.circle(
            glow_surf, (*self.color, 100), (glow_size, glow_size), glow_size
        )
        surface.blit(glow_surf, glow_surf.get_rect(center=self.rect.center))

        # 본체
        pygame.draw.circle(surface, WHITE, self.rect.center, self.size // 2)
        pygame.draw.circle(surface, self.color, self.rect.center, self.size // 2, 2)

        # 아이템 아이콘
        font = pygame.font.SysFont("Arial", 18, bold=True)
        txt = font.render(self.label, True, self.color)
        surface.blit(txt, txt.get_rect(center=self.rect.center))


class Explosion:
    """
    폭발 파티클 이펙트.
    다수의 파티클이 사방으로 흩어지며 사라짐.
    """

    def __init__(self, x, y, color):
        self.particles = []
        self.timer = 0
        for _ in range(15):
            dx = random.uniform(-5, 5)
            dy = random.uniform(-5, 5)
            # 색상을 약간 랜덤하게 변형하여 풍부한 연출
            c_list = list(color)
            c_list[0] = max(0, min(255, c_list[0] + random.randint(-50, 50)))
            c_list[1] = max(0, min(255, c_list[1] + random.randint(-50, 50)))
            c_list[2] = max(0, min(255, c_list[2] + random.randint(-50, 50)))

            self.particles.append([x, y, dx, dy, random.randint(2, 6), tuple(c_list)])

    def update(self):
        self.timer += 1
        for p in self.particles:
            p[0] += p[2]  # x += dx
            p[1] += p[3]  # y += dy
            p[4] -= 0.1  # radius 감소 (0.2 -> 0.1로 줄여서 더 오래 지속)

    def draw(self, surface):
        for p in self.particles:
            if p[4] > 0:
                pygame.draw.circle(surface, p[5], (int(p[0]), int(p[1])), int(p[4]))
