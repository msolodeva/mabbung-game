# entities.py
# 플레이어, 레이저, 아이템, 폭발 효과 등 핵심 엔티티

import pygame
import random
import math

from constants import (
    WIDTH,
    HEIGHT,
    WHITE,
    RED,
    GREEN,
    CYAN,
    ORANGE,
    PLAYER_SPEED,
    PLAYER_MAX_HEALTH,
    PLAYER_INIT_BOMBS,
    PLAYER_MAX_BOMBS,
    ITEM_WEAPON_THRESHOLD,
    ITEM_HEALTH_THRESHOLD,
    ITEM_BOMB_THRESHOLD,
    ITEM_SHIELD_THRESHOLD,
    ITEM_SLOW_THRESHOLD,
    ITEM_MAGNET_THRESHOLD,
    SHOCKWAVE_SPEED,
    SHOCKWAVE_FADE,
    EXPLOSION_PARTICLE_COUNT,
    HIT_SPARK_PARTICLE_COUNT,
    ALLY_SPEED_X,
    ALLY_LIFETIME,
    ALLY_FIRE_RATE,
    LASER_TRAIL_FADE,
    SHIP_TYPES,
)
from weapons import HomingMissile


class Player:
    """
    플레이어 우주선 클래스.
    - 이동, 체력, 점수, 무기 레벨 관리
    - 체력바 표시 포함
    - ship_type에 따라 스탯과 외형이 달라짐
    """

    def __init__(self, x, y, color, controls, ship_type="falcon"):
        self.ship_type = ship_type
        ship_data = SHIP_TYPES[ship_type]

        self.rect = pygame.Rect(x, y, 40, 40)
        self.color = color
        self.controls = controls
        self.speed = ship_data["speed"]
        self.score = 0
        self.max_health = ship_data["health"]
        self.health = self.max_health
        self.weapon_level = 1  # 무기 레벨 (1~3)
        self.bomb_count = ship_data["bombs"]
        self.max_bombs = ship_data["bombs"]
        self.weapon_timer = 0  # 무기 강화 지속 시간 프레임
        self.weapon_style = ship_data["weapon_style"]

        # 새로운 아이템 상태
        self.has_shield = False  # 쉴드 (1회 피격 방어)
        self.slow_timer = 0  # 슬로우 타임 (전역 효과이지만 플레이어가 활성화)
        self.clone_timer = 0  # 분신 지속 시간
        self.magnet_timer = 0  # 자석 아이템 끌어당김 지속 시간

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
        if self.slow_timer > 0:
            self.slow_timer -= 1
        if self.clone_timer > 0:
            self.clone_timer -= 1
        if self.magnet_timer > 0:
            self.magnet_timer -= 1
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
        # 체력이 0 이하면 그리지 않음
        if self.health <= 0:
            return

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

        # 자석 효과 표시
        if self.magnet_timer > 0:
            # 마젠타색 끌어당기는 효과 원
            magnet_surf = pygame.Surface((80, 80), pygame.SRCALPHA)
            pulse = (self.magnet_timer % 30) / 30  # 맥동 효과
            alpha = int(50 + 30 * pulse)
            pygame.draw.circle(
                magnet_surf,
                (255, 100, 255, alpha),
                (40, 40),
                int(30 + 10 * pulse),
                2,
            )
            surface.blit(magnet_surf, (self.rect.centerx - 40, self.rect.centery - 40))

    def _draw_ship(self, surface, cx, top, color):
        """비행기 타입별 우주선 그리기."""
        if self.ship_type == "titan":
            self._draw_titan(surface, cx, top, color)
        elif self.ship_type == "phantom":
            self._draw_phantom(surface, cx, top, color)
        elif self.ship_type == "viper":
            self._draw_viper(surface, cx, top, color)
        else:
            self._draw_falcon(surface, cx, top, color)

    def _draw_falcon(self, surface, cx, top, color):
        """Falcon: 균형 잡힌 기본형 실루엣."""
        # 엔진 화염
        flame_h = random.randint(10, 18)
        pygame.draw.polygon(
            surface,
            (255, 100, 0),
            [(cx - 4, top + 30), (cx + 4, top + 30), (cx, top + 30 + flame_h)],
        )
        pygame.draw.polygon(
            surface,
            (255, 200, 0),
            [(cx - 2, top + 30), (cx + 2, top + 30), (cx, top + 30 + flame_h - 4)],
        )

        # 본체 쉐이딩용 표면
        ship_surf = pygame.Surface((40, 40), pygame.SRCALPHA)
        center_x = 20
        c_top = 0
        base_color = color[:3]

        # 어두운 외곽선/그림자 (아래 레이어)
        dark_color = (
            max(0, base_color[0] - 60),
            max(0, base_color[1] - 60),
            max(0, base_color[2] - 60),
        )
        # 밝은 하이라이트 (위 레이어)
        light_color = (
            min(255, base_color[0] + 60),
            min(255, base_color[1] + 60),
            min(255, base_color[2] + 60),
        )

        # 왼쪽 날개
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x - 8, c_top + 15),
                (center_x - 20, c_top + 40),
                (center_x - 8, c_top + 35),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x - 6, c_top + 17),
                (center_x - 17, c_top + 38),
                (center_x - 6, c_top + 34),
            ],
        )

        # 오른쪽 날개
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x + 8, c_top + 15),
                (center_x + 20, c_top + 40),
                (center_x + 8, c_top + 35),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x + 6, c_top + 17),
                (center_x + 17, c_top + 38),
                (center_x + 6, c_top + 34),
            ],
        )

        # 중심 본체
        pygame.draw.rect(ship_surf, dark_color, (center_x - 8, c_top + 10, 16, 20))
        pygame.draw.rect(ship_surf, base_color, (center_x - 6, c_top + 10, 12, 20))
        # 꼬리 부분 수직 미익
        pygame.draw.polygon(
            ship_surf,
            light_color,
            [
                (center_x - 2, c_top + 20),
                (center_x + 2, c_top + 20),
                (center_x, c_top + 35),
            ],
        )

        # 머리 부분 (삼각형)
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [(center_x, c_top), (center_x - 8, c_top + 11), (center_x + 8, c_top + 11)],
        )
        pygame.draw.polygon(
            ship_surf,
            light_color,
            [
                (center_x, c_top + 2),
                (center_x - 6, c_top + 10),
                (center_x + 6, c_top + 10),
            ],
        )

        # 조종석 (그라데이션 효과 흉내)
        pygame.draw.ellipse(ship_surf, (0, 0, 0), (center_x - 4, c_top + 14, 8, 10))
        pygame.draw.ellipse(
            ship_surf, (100, 200, 255), (center_x - 3, c_top + 15, 6, 8)
        )
        pygame.draw.ellipse(
            ship_surf, WHITE, (center_x - 1, c_top + 16, 3, 3)
        )  # 반사광

        # 투명도 적용
        if len(color) == 4:
            ship_surf.set_alpha(color[3])

        surface.blit(ship_surf, (cx - 20, top))

    def _draw_titan(self, surface, cx, top, color):
        """Titan: 넓고 두꺼운 탱커 실루엣."""
        # 트윈 엔진 화염
        flame_h = random.randint(12, 20)
        pygame.draw.polygon(
            surface,
            (255, 50, 0),
            [(cx - 10, top + 32), (cx - 4, top + 32), (cx - 7, top + 32 + flame_h)],
        )
        pygame.draw.polygon(
            surface,
            (255, 200, 0),
            [(cx - 9, top + 32), (cx - 5, top + 32), (cx - 7, top + 32 + flame_h - 5)],
        )
        pygame.draw.polygon(
            surface,
            (255, 50, 0),
            [(cx + 4, top + 32), (cx + 10, top + 32), (cx + 7, top + 32 + flame_h)],
        )
        pygame.draw.polygon(
            surface,
            (255, 200, 0),
            [(cx + 5, top + 32), (cx + 9, top + 32), (cx + 7, top + 32 + flame_h - 5)],
        )

        ship_surf = pygame.Surface((50, 42), pygame.SRCALPHA)
        center_x = 25
        c_top = 0
        base_color = color[:3]

        dark_color = (
            max(0, base_color[0] - 50),
            max(0, base_color[1] - 50),
            max(0, base_color[2] - 50),
        )
        light_color = (
            min(255, base_color[0] + 50),
            min(255, base_color[1] + 50),
            min(255, base_color[2] + 50),
        )

        # 가장 바깥쪽 무거운 장갑 (그림자 포함)
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x - 14, c_top + 20),
                (center_x - 25, c_top + 34),
                (center_x - 14, c_top + 34),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x + 14, c_top + 20),
                (center_x + 25, c_top + 34),
                (center_x + 14, c_top + 34),
            ],
        )
        # 날개
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x - 10, c_top + 12),
                (center_x - 23, c_top + 36),
                (center_x - 10, c_top + 30),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x + 10, c_top + 12),
                (center_x + 23, c_top + 36),
                (center_x + 10, c_top + 30),
            ],
        )

        # 본체 장갑판 (여러 겹)
        pygame.draw.rect(
            ship_surf, dark_color, (center_x - 12, c_top + 8, 24, 25), border_radius=3
        )
        pygame.draw.rect(
            ship_surf, base_color, (center_x - 10, c_top + 9, 20, 23), border_radius=2
        )
        pygame.draw.rect(ship_surf, light_color, (center_x - 6, c_top + 10, 12, 10))

        # 둥근 머리 범퍼
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x, c_top + 2),
                (center_x - 11, c_top + 12),
                (center_x + 11, c_top + 12),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            light_color,
            [
                (center_x, c_top + 4),
                (center_x - 8, c_top + 11),
                (center_x + 8, c_top + 11),
            ],
        )

        # 조종석 (두꺼운 장갑 유리)
        pygame.draw.rect(ship_surf, (0, 50, 50), (center_x - 4, c_top + 15, 8, 5))
        pygame.draw.rect(ship_surf, (150, 255, 255), (center_x - 3, c_top + 16, 6, 3))

        # 에너지 노드 (발광 효과)
        glow_alpha = 150 + int(math.sin(pygame.time.get_ticks() * 0.01) * 100)
        pygame.draw.circle(
            ship_surf, (0, 255, 255, glow_alpha), (center_x - 14, c_top + 26), 2
        )
        pygame.draw.circle(
            ship_surf, (0, 255, 255, glow_alpha), (center_x + 14, c_top + 26), 2
        )

        if len(color) == 4:
            ship_surf.set_alpha(color[3])

        surface.blit(ship_surf, (cx - 25, top))

    def _draw_phantom(self, surface, cx, top, color):
        """Phantom: 날렵하고 가벼운 스피드형 실루엣."""
        # 푸른색 이온 엔진 화염 (매우 길고 얇게)
        flame_h = random.randint(15, 25)
        pygame.draw.polygon(
            surface,
            (0, 150, 255),
            [(cx - 3, top + 32), (cx + 3, top + 32), (cx, top + 32 + flame_h)],
        )
        pygame.draw.polygon(
            surface,
            (150, 255, 255),
            [(cx - 1, top + 32), (cx + 1, top + 32), (cx, top + 32 + flame_h - 8)],
        )

        ship_surf = pygame.Surface((40, 42), pygame.SRCALPHA)
        center_x = 20
        c_top = 0
        base_color = color[:3]

        dark_color = (
            max(0, base_color[0] - 70),
            max(0, base_color[1] - 70),
            max(0, base_color[2] - 70),
        )
        neon_color = (
            min(255, base_color[0] + 100),
            min(255, base_color[1] + 100),
            min(255, base_color[2] + 100),
        )

        # 뒤로 젖혀진 날렵한 날개 (그림자)
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x - 6, c_top + 22),
                (center_x - 18, c_top + 42),
                (center_x - 6, c_top + 38),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x + 6, c_top + 22),
                (center_x + 18, c_top + 42),
                (center_x + 6, c_top + 38),
            ],
        )
        # 밝은 날개 라인
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x - 5, c_top + 24),
                (center_x - 16, c_top + 40),
                (center_x - 5, c_top + 36),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x + 5, c_top + 24),
                (center_x + 16, c_top + 40),
                (center_x + 5, c_top + 36),
            ],
        )

        # 날개 네온 엣지
        pygame.draw.line(
            ship_surf,
            neon_color,
            (center_x - 6, c_top + 22),
            (center_x - 18, c_top + 42),
            1,
        )
        pygame.draw.line(
            ship_surf,
            neon_color,
            (center_x + 6, c_top + 22),
            (center_x + 18, c_top + 42),
            1,
        )

        # 날렵한 본체
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x - 6, c_top + 34),
                (center_x + 6, c_top + 34),
                (center_x, c_top + 6),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x - 4, c_top + 32),
                (center_x + 4, c_top + 32),
                (center_x, c_top + 6),
            ],
        )

        # 뾰족한 머리
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x, c_top - 2),
                (center_x - 6, c_top + 10),
                (center_x + 6, c_top + 10),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            neon_color,
            [(center_x, c_top), (center_x - 4, c_top + 8), (center_x + 4, c_top + 8)],
        )

        # V자형 조종석
        pygame.draw.polygon(
            ship_surf,
            (0, 0, 0),
            [
                (center_x, c_top + 18),
                (center_x - 3, c_top + 13),
                (center_x + 3, c_top + 13),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            (255, 200, 255),
            [
                (center_x, c_top + 17),
                (center_x - 2, c_top + 14),
                (center_x + 2, c_top + 14),
            ],
        )

        if len(color) == 4:
            ship_surf.set_alpha(color[3])

        surface.blit(ship_surf, (cx - 20, top))

    def _draw_viper(self, surface, cx, top, color):
        """Viper: 각진 공격적인 실루엣."""
        # 3중 분출 엔진
        flame_h = random.randint(8, 14)
        pygame.draw.polygon(
            surface,
            (200, 0, 255),
            [(cx - 6, top + 30), (cx - 2, top + 30), (cx - 4, top + 30 + flame_h)],
        )
        pygame.draw.polygon(
            surface,
            (255, 100, 255),
            [(cx - 2, top + 32), (cx + 2, top + 32), (cx, top + 32 + flame_h + 4)],
        )  # 중앙 주 엔진
        pygame.draw.polygon(
            surface,
            (200, 0, 255),
            [(cx + 2, top + 30), (cx + 6, top + 30), (cx + 4, top + 30 + flame_h)],
        )

        ship_surf = pygame.Surface((44, 42), pygame.SRCALPHA)
        center_x = 22
        c_top = 0
        base_color = color[:3]

        dark_color = (
            max(0, base_color[0] - 60),
            max(0, base_color[1] - 60),
            max(0, base_color[2] - 60),
        )
        light_color = (
            min(255, base_color[0] + 70),
            min(255, base_color[1] + 70),
            min(255, base_color[2] + 70),
        )

        # 전진형 각진 날개 (전진익)
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x - 7, c_top + 14),
                (center_x - 22, c_top + 28),
                (center_x - 15, c_top + 40),
                (center_x - 7, c_top + 32),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x - 7, c_top + 16),
                (center_x - 20, c_top + 28),
                (center_x - 14, c_top + 38),
                (center_x - 7, c_top + 30),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x + 7, c_top + 14),
                (center_x + 22, c_top + 28),
                (center_x + 15, c_top + 40),
                (center_x + 7, c_top + 32),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            base_color,
            [
                (center_x + 7, c_top + 16),
                (center_x + 20, c_top + 28),
                (center_x + 14, c_top + 38),
                (center_x + 7, c_top + 30),
            ],
        )

        # 본체
        pygame.draw.rect(ship_surf, dark_color, (center_x - 7, c_top + 8, 14, 24))
        pygame.draw.rect(ship_surf, base_color, (center_x - 5, c_top + 8, 10, 22))

        # 날카로운 머리 (더 뾰족하고 레이어드 됨)
        pygame.draw.polygon(
            ship_surf,
            dark_color,
            [
                (center_x, c_top - 4),
                (center_x - 7, c_top + 12),
                (center_x + 7, c_top + 12),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            light_color,
            [
                (center_x, c_top - 2),
                (center_x - 4, c_top + 10),
                (center_x + 4, c_top + 10),
            ],
        )

        # 무기 탑재 부위 강조 (날개 중앙)
        pygame.draw.rect(ship_surf, (100, 100, 100), (center_x - 16, c_top + 22, 4, 8))
        pygame.draw.rect(ship_surf, (100, 100, 100), (center_x + 12, c_top + 22, 4, 8))
        pygame.draw.line(
            ship_surf, RED, (center_x - 14, c_top + 20), (center_x - 14, c_top + 30), 2
        )
        pygame.draw.line(
            ship_surf, RED, (center_x + 14, c_top + 20), (center_x + 14, c_top + 30), 2
        )

        # 포구 장식 (앞쪽 라인)
        pygame.draw.line(
            ship_surf, light_color, (center_x, c_top - 4), (center_x, c_top + 6), 2
        )

        # 다각형 조종석
        pygame.draw.polygon(
            ship_surf,
            (0, 0, 0),
            [
                (center_x, c_top + 14),
                (center_x - 5, c_top + 18),
                (center_x, c_top + 22),
                (center_x + 5, c_top + 18),
            ],
        )
        pygame.draw.polygon(
            ship_surf,
            (50, 255, 100),
            [
                (center_x, c_top + 15),
                (center_x - 3, c_top + 18),
                (center_x, c_top + 21),
                (center_x + 3, c_top + 18),
            ],
        )

        if len(color) == 4:
            ship_surf.set_alpha(color[3])

        surface.blit(ship_surf, (cx - 22, top))


class Laser:
    """
    플레이어가 발사하는 레이저.
    위쪽으로 이동 (Y 감소). speed_x로 좌우 이동 가능.
    """

    def __init__(self, x, y, color):
        self.rect = pygame.Rect(x - 2, y, 4, 15)
        self.color = color
        self.speed = -10  # 위로 이동
        self.speed_x = 0  # 좌우 이동 (Titan 산탄용)

    def update(self):
        self.rect.y += self.speed
        self.rect.x += self.speed_x

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

        # 아이템 종류 결정
        r = random.random()
        if r < ITEM_WEAPON_THRESHOLD:
            self.kind = "weapon"
            self.color = CYAN
            self.label = "P"
        elif r < ITEM_HEALTH_THRESHOLD:
            self.kind = "health"
            self.color = GREEN
            self.label = "H"
        elif r < ITEM_BOMB_THRESHOLD:
            self.kind = "bomb"
            self.color = ORANGE
            self.label = "B"
        elif r < ITEM_SHIELD_THRESHOLD:
            self.kind = "shield"
            self.color = (0, 255, 255)  # 청록색
            self.label = "S"
        elif r < ITEM_SLOW_THRESHOLD:
            self.kind = "slow"
            self.color = (100, 100, 255)  # 파란색
            self.label = "T"
        elif r < ITEM_MAGNET_THRESHOLD:
            self.kind = "magnet"
            self.color = (255, 100, 255)  # 마젠타색
            self.label = "M"
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


class Shockwave:
    """
    폭발 시 발생하는 충격파 이펙트 (확장되는 원).
    성능 최적화를 위해 프레임별 이미지를 캐싱하여 사용.
    """

    _cache = {}  # (color, frame) -> image

    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = tuple(color[:3]) if len(color) >= 3 else tuple(color)
        self.radius = 10
        self.width = 10
        self.alpha = 255
        self.speed = SHOCKWAVE_SPEED
        self.frame = 0

    def update(self, *args):  # args to ignore extra default args if any
        self.radius += self.speed
        self.width = max(1, self.width * 0.9)  # 너비가 빠르게 줄어듦
        self.alpha = max(0, self.alpha - SHOCKWAVE_FADE)
        self.frame += 1

    def draw(self, surface):
        if self.alpha > 0 and self.width > 1:
            key = (self.color, self.frame)
            if key not in self._cache:
                # 캐시에 없으면 생성
                size = int(self.radius * 2 + self.width * 2)
                s = pygame.Surface((size, size), pygame.SRCALPHA)
                pygame.draw.circle(
                    s,
                    (*self.color, self.alpha),
                    (size // 2, size // 2),
                    int(self.radius),
                    int(self.width),
                )
                self._cache[key] = s

            # 캐시된 이미지 사용
            img = self._cache[key]
            surface.blit(
                img, (self.x - img.get_width() // 2, self.y - img.get_height() // 2)
            )


class Explosion:
    """
    폭발 파티클 이펙트.
    다수의 파티클이 사방으로 흩어지며 사라짐.
    """

    def __init__(self, x, y, color):
        self.particles = []
        self.shockwave = Shockwave(x, y, color)
        self.timer = 0

        # 파티클 개수 증가 및 물리학 개선
        count = EXPLOSION_PARTICLE_COUNT
        for _ in range(count):
            angle = random.uniform(0, 6.28)
            speed = random.uniform(2, 8)
            dx = math.cos(angle) * speed
            dy = math.sin(angle) * speed

            # 색상을 랜덤하게 변형
            c_list = list(color)
            c_list[0] = max(0, min(255, c_list[0] + random.randint(-50, 50)))
            c_list[1] = max(0, min(255, c_list[1] + random.randint(-50, 50)))
            c_list[2] = max(0, min(255, c_list[2] + random.randint(-50, 50)))

            # [x, y, vx, vy, radius, color, visible]
            self.particles.append(
                [x, y, dx, dy, random.uniform(3, 6), tuple(c_list), True]
            )

    def update(self):
        self.timer += 1
        self.shockwave.update()
        for p in self.particles:
            p[0] += p[2]  # x += vx
            p[1] += p[3]  # y += vy
            p[2] *= 0.9  # 마찰력 (속도 감소)
            p[3] *= 0.9
            p[4] -= 0.15  # radius 감소
            if p[4] <= 0:
                p[6] = False

    def draw(self, surface):
        self.shockwave.draw(surface)
        for p in self.particles:
            if p[6] and p[4] > 0:
                # 반투명 효과를 위해 서피스를 쓰면 좋지만 성능상 불투명 원으로 유지하되 크기로 조절
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
            # 매 프레임 Surface를 생성하는 것은 무겁습니다.
            # 성능을 위해 직접 원으로 그립니다 (투명도 대신 크기 감소 활용)
            pygame.draw.circle(
                surface, self.color, (int(self.x), int(self.y)), int(self.size)
            )


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
        for _ in range(HIT_SPARK_PARTICLE_COUNT):
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
        self.width = width
        self.height = height
        self.alpha = 255
        self.fade_speed = LASER_TRAIL_FADE

        # 최적화: Surface 미리 생성
        self.image = pygame.Surface((width, height))
        self.image.fill(color)

    def update(self):
        self.alpha = max(0, self.alpha - self.fade_speed)

    def is_finished(self):
        return self.alpha <= 0

    def draw(self, surface):
        if self.alpha > 0:
            self.image.set_alpha(self.alpha)
            surface.blit(self.image, (self.x - self.width // 2, self.y))


class Ally:
    """
    지원군 유닛. 플레이어를 돕는 AI 드론.
    - 일정 시간 등장하여 적에게 호밍 미사일 발사
    - 무적 상태
    """

    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 30, 30)
        self.color = (100, 255, 100)  # 연두색
        self.speed_x = ALLY_SPEED_X
        self.target_y = HEIGHT - 250
        self.state = "enter"
        self.lifetime = ALLY_LIFETIME
        self.fire_timer = 0

    def update(self, enemies, projectiles):
        self.lifetime -= 1

        # 1. 입장
        if self.state == "enter":
            self.rect.y -= 3
            if self.rect.y <= self.target_y:
                self.state = "fight"

        # 2. 전투 (좌우 배회)
        elif self.state == "fight":
            self.rect.x += self.speed_x
            if self.rect.right > WIDTH - 20:
                self.speed_x = -abs(self.speed_x)
            elif self.rect.left < 20:
                self.speed_x = abs(self.speed_x)

            # 공격 (호밍 미사일)
            self.fire_timer += 1
            if self.fire_timer > ALLY_FIRE_RATE:
                self.fire_timer = 0
                if enemies:
                    # HomingMissile 생성
                    missile = HomingMissile(
                        self.rect.centerx, self.rect.top, self.color, enemies
                    )
                    projectiles.append(missile)

        # 3. 퇴장 (수명 끝)
        if self.lifetime <= 0:
            self.state = "leave"
            self.rect.y += 5  # 아래로 퇴장

    def draw(self, surface):
        # 드론 모양 그리기
        # 본체
        pygame.draw.circle(surface, self.color, self.rect.center, 15)
        pygame.draw.circle(surface, WHITE, self.rect.center, 8)

        # 날개
        wing_rect = pygame.Rect(0, 0, 34, 6)
        wing_rect.center = self.rect.center
        pygame.draw.rect(surface, self.color, wing_rect)

        # 엔진 불꽃 (장식)
        if self.state in ["enter", "fight"]:
            pygame.draw.circle(
                surface, (255, 200, 0), (self.rect.centerx, self.rect.bottom + 5), 4
            )
