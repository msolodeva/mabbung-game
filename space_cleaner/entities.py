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

        # 새로운 아이템 상태
        self.has_shield = False  # 쉴드 (1회 피격 방어)
        self.magnet_timer = 0  # 자석 효과 지속 시간
        self.slow_timer = 0  # 슬로우 타임 (전역 효과이지만 플레이어가 활성화)
        self.clone_timer = 0  # 분신 지속 시간

        # 특수 무기 상태
        self.special_weapon = ""  # "", "homing", "piercing", "plasma"
        self.special_weapon_timer = 0

    def update(self):
        """플레이어 상태 업데이트 (타이머 등)."""
        if self.weapon_level > 1:
            self.weapon_timer -= 1
            if self.weapon_timer <= 0:
                self.weapon_level = 1

        # 아이템 타이머 감소
        if self.magnet_timer > 0:
            self.magnet_timer -= 1
        if self.slow_timer > 0:
            self.slow_timer -= 1
        if self.clone_timer > 0:
            self.clone_timer -= 1
        if self.special_weapon_timer > 0:
            self.special_weapon_timer -= 1
            if self.special_weapon_timer <= 0:
                self.special_weapon = ""

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
        # 분신 효과 (반투명 고스트)
        if self.clone_timer > 0:
            # 왼쪽 분신
            clone_surf_left = pygame.Surface((40, 40), pygame.SRCALPHA)
            self._draw_ship(clone_surf_left, 20, 0, (*self.color, 100))
            surface.blit(clone_surf_left, (self.rect.x - 50, self.rect.y))
            # 오른쪽 분신
            clone_surf_right = pygame.Surface((40, 40), pygame.SRCALPHA)
            self._draw_ship(clone_surf_right, 20, 0, (*self.color, 100))
            surface.blit(clone_surf_right, (self.rect.x + 50, self.rect.y))

        # 본체 그리기
        self._draw_ship(surface, self.rect.centerx, self.rect.top, self.color)

        # 쉴드 표시
        if self.has_shield:
            # 청록색 반투명 원
            shield_surf = pygame.Surface(
                (self.rect.width + 20, self.rect.height + 20), pygame.SRCALPHA
            )
            pygame.draw.circle(
                shield_surf,
                (0, 255, 255, 100),
                (self.rect.width // 2 + 10, self.rect.height // 2 + 10),
                self.rect.width // 2 + 10,
            )
            surface.blit(shield_surf, (self.rect.x - 10, self.rect.y - 10))

    def _draw_ship(self, surface, cx, top, color):
        """우주선 그리기 (색상 별도 지정 가능)."""
        # 중심 본체
        body_rect = pygame.Rect(cx - 8, top + 10, 16, 30)
        if len(color) == 4:  # 알파값 있음
            s = pygame.Surface((16, 30), pygame.SRCALPHA)
            s.fill(color)
            surface.blit(s, (cx - 8, top + 10))
        else:
            pygame.draw.rect(surface, color, body_rect)

        # 머리 부분 (삼각형)
        head_points = [
            (cx, top),
            (cx - 8, top + 10),
            (cx + 8, top + 10),
        ]
        if len(color) == 4:
            pygame.draw.polygon(surface, color, head_points)
        else:
            pygame.draw.polygon(surface, color, head_points)

        # 왼쪽 날개
        left_wing = [
            (cx - 8, top + 15),
            (cx - 20, top + 40),
            (cx - 8, top + 35),
        ]
        if len(color) == 4:
            pygame.draw.polygon(surface, color, left_wing)
        else:
            pygame.draw.polygon(surface, color, left_wing)

        # 오른쪽 날개
        right_wing = [
            (cx + 8, top + 15),
            (cx + 20, top + 40),
            (cx + 8, top + 35),
        ]
        if len(color) == 4:
            pygame.draw.polygon(surface, color, right_wing)
        else:
            pygame.draw.polygon(surface, color, right_wing)

        # 조종석 (포인트)
        cockpit_color = WHITE if len(color) == 3 else (*WHITE, color[3])
        pygame.draw.circle(surface, cockpit_color, (cx, top + 18), 4)


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

        # 아이템 종류 결정 (weapon 15%, health 20%, bomb 15%, shield 15%, magnet 15%, slow 10%, clone 10%)
        r = random.random()
        if r < 0.15:
            self.kind = "weapon"
            self.color = CYAN
            self.label = "P"
        elif r < 0.35:
            self.kind = "health"
            self.color = GREEN
            self.label = "H"
        elif r < 0.50:
            self.kind = "bomb"
            self.color = ORANGE
            self.label = "B"
        elif r < 0.65:
            self.kind = "shield"
            self.color = (0, 255, 255)  # 청록색
            self.label = "S"
        elif r < 0.80:
            self.kind = "magnet"
            self.color = (255, 0, 255)  # 자주색
            self.label = "M"
        elif r < 0.90:
            self.kind = "slow"
            self.color = (100, 100, 255)  # 파란색
            self.label = "T"
        else:
            self.kind = "clone"
            self.color = (255, 255, 100)  # 노란색
            self.label = "C"

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
        for _ in range(10):
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


class Particle:
    """
    기본 파티클 클래스.
    위치, 속도, 색상, 수명을 가짐.
    """

    def __init__(self, x, y, vx, vy, color, size=3, lifetime=30):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.size = size
        self.lifetime = lifetime
        self.age = 0

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.age += 1
        # 점점 작아짐
        self.size = max(0, self.size - 0.1)

    def is_dead(self):
        return self.age >= self.lifetime or self.size <= 0

    def draw(self, surface):
        if self.size > 0:
            # 수명에 따라 투명도 감소
            alpha = int(255 * (1 - self.age / self.lifetime))
            s = pygame.Surface(
                (int(self.size * 2), int(self.size * 2)), pygame.SRCALPHA
            )
            pygame.draw.circle(
                s,
                (*self.color, alpha),
                (int(self.size), int(self.size)),
                int(self.size),
            )
            surface.blit(s, (int(self.x - self.size), int(self.y - self.size)))


class EngineTrail:
    """
    엔진 트레일 파티클 생성기.
    플레이어와 적 뒤에서 연속적으로 파티클 방출.
    """

    def __init__(self):
        self.particles = []

    def emit(self, x, y, color):
        """파티클 방출."""
        # 약간의 랜덤성을 가진 파티클 생성
        for _ in range(2):
            vx = random.uniform(-1, 1)
            vy = random.uniform(1, 3)  # 아래로 흐름
            self.particles.append(Particle(x, y, vx, vy, color, size=3, lifetime=20))

    def update(self):
        """파티클 업데이트."""
        for p in self.particles[:]:
            p.update()
            if p.is_dead():
                self.particles.remove(p)

    def draw(self, surface):
        """파티클 렌더링."""
        for p in self.particles:
            p.draw(surface)


class HitSpark:
    """
    피격 시 스파크 효과.
    짧고 강렬한 파티클 폭발.
    """

    def __init__(self, x, y, color):
        self.particles = []
        self.timer = 0
        # 적은 파티클로 단순화
        for _ in range(4):
            angle = random.uniform(0, 2 * 3.14159)
            speed = random.uniform(3, 8)
            vx = speed * pygame.math.Vector2(1, 0).rotate_rad(angle).x
            vy = speed * pygame.math.Vector2(1, 0).rotate_rad(angle).y
            self.particles.append(Particle(x, y, vx, vy, color, size=4, lifetime=15))

    def update(self):
        self.timer += 1
        for p in self.particles[:]:
            p.update()

    def is_finished(self):
        return all(p.is_dead() for p in self.particles)

    def draw(self, surface):
        for p in self.particles:
            p.draw(surface)


class LaserTrail:
    """
    레이저 잔상 효과.
    레이저가 지나간 자리에 희미한 잔상 남김.
    """

    def __init__(self, x, y, color, width=4, height=15):
        self.x = x
        self.y = y
        self.color = color
        self.width = width
        self.height = height
        self.alpha = 255
        self.fade_speed = 20

    def update(self):
        self.alpha = max(0, self.alpha - self.fade_speed)

    def is_finished(self):
        return self.alpha <= 0

    def draw(self, surface):
        if self.alpha > 0:
            s = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
            s.fill((*self.color, self.alpha))
            surface.blit(s, (self.x - self.width // 2, self.y))
