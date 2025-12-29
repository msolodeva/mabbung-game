"""
게임 렌더링 담당 모듈
"""

import pygame
import math
from constants import *
from sprites import *


class Renderer:
    """게임 화면 렌더링을 담당하는 클래스"""

    def __init__(self, screen):
        """
        렌더러 초기화

        Args:
            screen: pygame 화면
        """
        self.screen = screen
        self.font = pygame.font.SysFont("arial", 24, bold=True)
        self.hud_font = pygame.font.SysFont("arial", 20, bold=True)

        # 스프라이트 미리 생성
        self.enemy_img = make_enemy_sprite(28, 28)
        self.fish_img = make_fish_sprite(28, 18)
        self.turtle_img = make_turtle_sprite(30, 20)
        self.fireball_img = make_fireball_sprite(8)
        self.mushroom_img = make_mushroom_sprite(24, 24)
        self.car_img = make_car_sprite(50, 30)

    def draw_rect_with_camera(self, rect, color, camera_x):
        """
        카메라 오프셋을 적용하여 사각형을 그립니다.

        Args:
            rect: 그릴 사각형
            color: 색상
            camera_x: 카메라 X 좌표
        """
        shifted = pygame.Rect(rect.x - camera_x, rect.y, rect.width, rect.height)
        pygame.draw.rect(self.screen, color, shifted)

    def draw_spike_with_camera(self, rect, color, camera_x):
        """
        카메라 오프셋을 적용하여 가시를 그립니다.

        Args:
            rect: 가시 사각형
            color: 색상
            camera_x: 카메라 X 좌표
        """
        x = rect.x - camera_x
        y = rect.y
        w, h = rect.width, rect.height
        points = [(x, y + h), (x + w // 2, y), (x + w, y + h)]
        pygame.draw.polygon(self.screen, color, points)

    def draw_wave(self, sea_rect, camera_x):
        """
        바다 물결 효과를 그립니다.

        Args:
            sea_rect: 바다 사각형
            camera_x: 카메라 X 좌표
        """
        wave_top = sea_rect.top - 4
        for i in range(0, sea_rect.width, 24):
            wx = sea_rect.x + i - camera_x
            wy = wave_top + int(math.sin((i + pygame.time.get_ticks() * 0.005)) * 3)
            pygame.draw.arc(
                self.screen,
                SEA_DARK,
                (wx - 12, wy - 6, 24, 12),
                math.pi,
                2 * math.pi,
                2,
            )

    def draw_heart(self, x, y, filled=True):
        """
        하트를 그립니다.

        Args:
            x: X 좌표
            y: Y 좌표
            filled: 채워진 하트인지 여부 (False면 빈 하트)
        """
        # 하트 모양을 폴리곤으로 그리기
        heart_color = (255, 50, 50) if filled else (100, 100, 100)
        outline_color = (200, 30, 30) if filled else (80, 80, 80)

        # 하트 좌표 (크기: 약 30x28)
        scale = 1.2
        points = [
            (x, y + 8 * scale),  # 아래 중앙
            (x - 8 * scale, y),  # 왼쪽 위
            (x - 8 * scale, y - 4 * scale),  # 왼쪽 상단
            (x - 4 * scale, y - 8 * scale),  # 왼쪽 꼭대기
            (x, y - 6 * scale),  # 중앙 상단
            (x + 4 * scale, y - 8 * scale),  # 오른쪽 꼭대기
            (x + 8 * scale, y - 4 * scale),  # 오른쪽 상단
            (x + 8 * scale, y),  # 오른쪽 위
        ]

        # 하트 채우기
        if filled:
            pygame.draw.polygon(self.screen, heart_color, points)

        # 하트 외곽선
        pygame.draw.polygon(self.screen, outline_color, points, 3)

    def draw_background(self, camera_x):
        """그라데이션 배경을 그립니다"""
        top_color = (135, 206, 235)  # 하늘색
        bottom_color = (200, 230, 255)  # 연한 하늘색

        for y in range(SCREEN_HEIGHT):
            # 선형 보간
            ratio = y / SCREEN_HEIGHT
            r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
            g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
            b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
            pygame.draw.line(self.screen, (r, g, b), (0, y), (SCREEN_WIDTH, y))

    def draw_health_bar(self, health, is_p1=True):
        """
        화면 오른쪽 상단에 체력(하트)을 그립니다.

        Args:
            health: 현재 체력
            is_p1: P1인지 여부 (True면 오른쪽, False면 왼쪽)
        """
        # 하트 시작 위치
        if is_p1:
            start_x = SCREEN_WIDTH - 150
        else:
            start_x = 30  # P2는 왼쪽

        start_y = 70  # HUD 아래로 내림
        heart_spacing = 40

        for i in range(MAX_HEALTH):
            x = start_x + i * heart_spacing
            # 현재 체력보다 작거나 같으면 채워진 하트
            filled = i < health
            self.draw_heart(x, start_y, filled)

    def draw_hud(self, score, coins, time_left, players):
        """
        슈퍼 마리오 스타일 HUD를 그립니다.

        Args:
            score: 점수
            coins: 코인 수
            time_left: 남은 시간
            players: 플레이어 리스트
        """
        # 1. 텍스트 라벨 (MARIO, COINS, WORLD, TIME)
        labels = [("MARIO", 50), ("COINS", 250), ("WORLD", 450), ("TIME", 650)]

        for text, x in labels:
            label_surf = self.hud_font.render(text, True, (255, 255, 255))
            self.screen.blit(label_surf, (x, 10))

        # 2. 값 표시
        # 점수 (6자리, 0으로 채움)
        score_text = f"{score:06d}"
        score_surf = self.font.render(score_text, True, (255, 255, 255))
        self.screen.blit(score_surf, (50, 35))

        # 코인 (x 00)
        coin_text = f"x {coins:02d}"
        coin_surf = self.font.render(coin_text, True, (255, 255, 255))
        self.screen.blit(coin_surf, (250, 35))

        # 월드 (1-1 고정)
        world_text = "1-1"
        world_surf = self.font.render(world_text, True, (255, 255, 255))
        self.screen.blit(world_surf, (450 + 10, 35))

        # 시간 (3자리)
        time_text = f"{max(0, int(time_left)):03d}"
        time_surf = self.font.render(time_text, True, (255, 255, 255))
        self.screen.blit(time_surf, (650 + 10, 35))

        # 체력바 표시
        # P1 (오른쪽)
        if len(players) > 0:
            self.draw_health_bar(players[0].health, is_p1=True)
        # P2 (왼쪽)
        if len(players) > 1:
            self.draw_health_bar(players[1].health, is_p1=False)

    def render_all(self, entity_manager, players, camera_x, score, coins, time_left):
        """
        모든 게임 요소를 렌더링합니다.

        Args:
            entity_manager: 엔티티 매니저
            players: 플레이어 리스트
            camera_x: 카메라 X 좌표
            score: 현재 점수
            coins: 현재 코인 수
            time_left: 남은 시간
        """
        # 배경
        self.draw_background(camera_x)

        # 플랫폼
        for p in entity_manager.platforms:
            self.draw_rect_with_camera(p, GRAY, camera_x)

        # 움직이는 플랫폼
        for mp in entity_manager.moving_platforms:
            self.draw_rect_with_camera(mp["rect"], DARK, camera_x)

        # 수직 플랫폼
        for vp in entity_manager.vertical_platforms:
            self.draw_rect_with_camera(vp["rect"], DARK, camera_x)

        # 부서지는 플랫폼
        for fp in entity_manager.fragile_platforms:
            self.draw_rect_with_camera(fp["rect"], BROWN, camera_x)

        # 스프링
        for s in entity_manager.springs:
            self.draw_rect_with_camera(s, GREEN, camera_x)

        # 가시
        for g in entity_manager.spikes:
            self.draw_spike_with_camera(g, ORANGE, camera_x)

        # 산호
        for c in entity_manager.corals:
            self.draw_rect_with_camera(c, CORAL, camera_x)

        # 바다
        for w in entity_manager.seas:
            self.draw_rect_with_camera(w, SEA, camera_x)
            self.draw_wave(w, camera_x)

        # 적
        for e in entity_manager.enemies:
            if e["alive"]:
                self.screen.blit(self.enemy_img, (e["rect"].x - camera_x, e["rect"].y))

        # 물고기
        for f in entity_manager.fish_enemies:
            if f["alive"]:
                self.screen.blit(self.fish_img, (f["rect"].x - camera_x, f["rect"].y))

        # 거북이
        for t in entity_manager.turtle_enemies:
            if t["alive"]:
                self.screen.blit(self.turtle_img, (t["rect"].x - camera_x, t["rect"].y))

        # 해파리
        for j in entity_manager.jellies:
            if j["alive"]:
                pygame.draw.ellipse(
                    self.screen,
                    JELLY,
                    (
                        j["rect"].x - camera_x,
                        j["rect"].y,
                        j["rect"].width,
                        j["rect"].height,
                    ),
                )

        # 버섯
        for m in entity_manager.mushrooms:
            if m["alive"]:
                self.screen.blit(
                    self.mushroom_img, (m["rect"].x - camera_x, m["rect"].y)
                )

        # 불똥
        for fb in entity_manager.fireballs:
            if fb["alive"]:
                self.screen.blit(
                    self.fireball_img, (fb["rect"].x - camera_x, fb["rect"].y)
                )

        # 동전
        for c in entity_manager.coins:
            center_pos = (c.centerx - camera_x, c.centery)
            pygame.draw.circle(self.screen, GOLD, center_pos, c.width // 2)

        # 자동차
        for car in entity_manager.cars:
            if car["alive"]:
                self.screen.blit(
                    self.car_img, (car["rect"].x - camera_x, car["rect"].y)
                )

        # 플레이어들
        for p in players:
            p.draw(self.screen, camera_x)

        # HUD 및 체력
        self.draw_hud(score, coins, time_left, players)
