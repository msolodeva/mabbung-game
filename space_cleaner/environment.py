# environment.py
# 환경 요소: 소행성 벨트, 블랙홀

import pygame
import random
import math
from constants import WIDTH, HEIGHT, DARK_GREY, WHITE, PURPLE, BLACK


class AsteroidBelt:
    """
    소행성 벨트 이벤트.
    - 일정 시간 동안 쓰레기(Junk) 스폰율 대폭 증가
    """

    def __init__(self, duration=600):
        self.duration = duration
        self.timer = 0
        self.is_active = True

    def update(self):
        self.timer += 1
        if self.timer >= self.duration:
            self.is_active = False


class BlackHole:
    """
    블랙홀.
    - 화면 중앙 부근에 등장
    - 주변 적, 탄환, 아이템을 빨아들임
    - 플레이어에게는 시각적 효과만 (요청 사항: 플레이어는 영향 없이)
    """

    def __init__(self):
        self.x = random.randint(WIDTH // 4, 3 * WIDTH // 4)
        self.y = random.randint(HEIGHT // 4, HEIGHT // 2)
        self.radius = 40
        self.pull_radius = 250
        self.pull_strength = 3
        self.duration = 480  # 8초
        self.timer = 0
        self.is_active = True
        self.angle = 0  # 회전 효과용

    def update(self, enemies, bullets, junks, items):
        self.timer += 1
        self.angle += 5
        if self.timer >= self.duration:
            self.is_active = False
            return

        # 주변 객체 빨아들이기
        self._pull_objects(enemies)
        self._pull_objects(bullets)
        self._pull_objects(junks)
        self._pull_objects(items)

    def _pull_objects(self, objects):
        for obj in objects[:]:
            dx = self.x - obj.rect.centerx
            dy = self.y - obj.rect.centery
            dist = (dx**2 + dy**2) ** 0.5

            if dist < self.pull_radius:
                if dist < self.radius:
                    # 너무 가까우면 제거 (흡수)
                    if obj in objects:
                        objects.remove(obj)
                else:
                    # 인력 적용
                    pull = self.pull_strength * (1 - dist / self.pull_radius)
                    obj.rect.x = int(obj.rect.x + (dx / dist) * pull)
                    obj.rect.y = int(obj.rect.y + (dy / dist) * pull)
                    # Junk나 Item의 경우 내부 x, y 좌표도 업데이트 필요할 수 있음 (일단 rect만)
                    if hasattr(obj, "x"):
                        obj.x = float(obj.rect.x)
                    if hasattr(obj, "y"):
                        obj.y = float(obj.rect.y)

    def draw(self, surface):
        # 소용돌이 효과 그리기
        for i in range(3):
            r = self.radius + i * 10 + math.sin(pygame.time.get_ticks() * 0.01) * 5
            s = pygame.Surface((int(r * 2), int(r * 2)), pygame.SRCALPHA)
            pygame.draw.circle(
                s, (100, 50, 150, 100 - i * 30), (int(r), int(r)), int(r)
            )

            # 회전 선
            start_angle = math.radians(self.angle + i * 120)
            end_angle = start_angle + math.radians(180)
            pygame.draw.arc(
                s, PURPLE, (0, 0, int(r * 2), int(r * 2)), start_angle, end_angle, 2
            )

            surface.blit(s, (int(self.x - r), int(self.y - r)))

        # 중심부 (검은색)
        pygame.draw.circle(surface, BLACK, (int(self.x), int(self.y)), self.radius // 2)
        pygame.draw.circle(
            surface, WHITE, (int(self.x), int(self.y)), self.radius // 2, 1
        )


class EnvironmentManager:
    """
    환경 이벤트 스케줄러.
    """

    def __init__(self):
        self.active_belt = None
        self.active_black_hole = None
        self.event_timer = 0
        self.next_event_time = random.randint(600, 1200)  # 10~20초 후 첫 이벤트

    def update(self, enemies, bullets, junks, items):
        self.event_timer += 1

        if self.event_timer >= self.next_event_time:
            self.event_timer = 0
            self.next_event_time = random.randint(1200, 2400)  # 20~40초 간격

            # 이벤트 결정
            if random.random() < 0.5:
                self.active_belt = AsteroidBelt()
            else:
                self.active_black_hole = BlackHole()

        if self.active_belt:
            self.active_belt.update()
            if not self.active_belt.is_active:
                self.active_belt = None

        if self.active_black_hole:
            self.active_black_hole.update(enemies, bullets, junks, items)
            if not self.active_black_hole.is_active:
                self.active_black_hole = None

    def draw(self, surface):
        if self.active_black_hole:
            self.active_black_hole.draw(surface)

        if self.active_belt:
            # 벨트 경고 표시
            font = pygame.font.SysFont("Arial", 24, bold=True)
            txt = font.render("! ASTEROID BELT DETECTED !", True, (255, 100, 0))
            if (pygame.time.get_ticks() // 500) % 2 == 0:
                surface.blit(txt, (WIDTH // 2 - txt.get_width() // 2, 100))

    def get_spawn_multiplier(self):
        return 5.0 if self.active_belt else 1.0
