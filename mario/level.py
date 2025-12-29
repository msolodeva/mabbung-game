"""
레벨 생성 및 관리
"""

import pygame
import random
import math
from constants import *


class LevelGenerator:
    """레벨을 생성하고 관리하는 클래스"""

    def __init__(self, entity_manager):
        """
        레벨 생성기 초기화

        Args:
            entity_manager: 엔티티 매니저 인스턴스
        """
        self.entity_manager = entity_manager
        self.generated_until_x = INITIAL_GENERATED_X
        self.biome_type = "land"  # "land" 또는 "sea"
        self.biome_chunks_remaining = 4

    def reset(self):
        """레벨 생성기를 초기 상태로 리셋"""
        self.generated_until_x = INITIAL_GENERATED_X
        self.biome_type = "land"
        self.biome_chunks_remaining = 4

    def spawn_chunk(self, start_x, width):
        """
        새로운 레벨 구간을 생성합니다.

        Args:
            start_x: 시작 X 좌표
            width: 구간의 너비
        """
        chunk_plats = []

        # 바닥 생성
        ground = pygame.Rect(start_x, GROUND_TOP_Y, width, GROUND_THICKNESS)
        self.entity_manager.platforms.append(ground)
        chunk_plats.append(ground)

        # 공중 플랫폼 생성
        for _ in range(random.randint(2, 4)):
            w = random.randint(100, 160)
            x = random.randint(start_x + 80, start_x + width - w - 80)
            y = random.randint(240, 360)
            plat = pygame.Rect(x, y, w, 20)
            self.entity_manager.platforms.append(plat)
            chunk_plats.append(plat)

            # 동전 생성
            if random.random() < 0.7:
                coin = pygame.Rect(x + w // 2 - 8, y - 30, 16, 16)
                self.entity_manager.coins.append(coin)

        # 움직이는 플랫폼 생성
        if random.random() < 0.6:
            left = start_x + 120
            right = start_x + width - 120
            w = random.randint(90, 130)
            x = random.randint(left, right - w)
            y = random.randint(240, 340)
            moving_plat = {
                "rect": pygame.Rect(x, y, w, 20),
                "vx": random.choice([-2, 2]),
                "left": left,
                "right": right,
            }
            self.entity_manager.moving_platforms.append(moving_plat)

        # 수직 플랫폼 생성
        if random.random() < 0.5:
            top = random.randint(220, 260)
            bottom = random.randint(320, 380)
            x = random.randint(start_x + 140, start_x + width - 240)
            w = random.randint(90, 120)
            vertical_plat = {
                "rect": pygame.Rect(x, (top + bottom) // 2, w, 20),
                "vy": random.choice([-2, 2]),
                "top": top,
                "bottom": bottom,
            }
            self.entity_manager.vertical_platforms.append(vertical_plat)

        # 적 생성
        for _ in range(random.randint(1, 2)):
            base = random.choice(chunk_plats)
            ex = random.randint(base.left + 10, base.right - 38)
            ey = base.top - 28

            if random.random() < 0.4:  # 점프하는 적
                enemy = {
                    "rect": pygame.Rect(ex, ey, 28, 28),
                    "vx": random.choice([-2, 2]),
                    "vy": 0,
                    "alive": True,
                    "kind": "hopper",
                    "jump_cd": random.randint(40, 80),
                }
            else:  # 걷는 적
                enemy = {
                    "rect": pygame.Rect(ex, ey, 28, 28),
                    "vx": random.choice([-2, 2]),
                    "vy": 0,
                    "alive": True,
                }
            self.entity_manager.enemies.append(enemy)

        # 부서지는 플랫폼 생성
        if random.random() < 0.5:
            w = random.randint(90, 140)
            x = random.randint(start_x + 120, start_x + width - w - 120)
            y = random.randint(260, 340)
            fragile_plat = {"rect": pygame.Rect(x, y, w, 18), "timer": -1}
            self.entity_manager.fragile_platforms.append(fragile_plat)

        # 스프링 생성
        if random.random() < 0.6:
            sx = random.randint(start_x + 130, start_x + width - 130)
            spring = pygame.Rect(sx, ground.top - 18, 26, 18)
            self.entity_manager.springs.append(spring)

        # 가시 생성
        if random.random() < 0.6:
            gx = random.randint(start_x + 140, start_x + width - 140)
            spike = pygame.Rect(gx, ground.top - 16, 24, 16)
            self.entity_manager.spikes.append(spike)

        # 버섯 아이템 생성
        if random.random() < 0.7:
            for _ in range(random.randint(1, 2)):
                base = random.choice(chunk_plats)
                mx = random.randint(base.left + 10, base.right - 34)
                my = base.top - 24
                mushroom = {
                    "rect": pygame.Rect(mx, my, 24, 24),
                    "vx": random.choice([-2, 2]),
                    "vy": 0,
                    "alive": True,
                }
                self.entity_manager.mushrooms.append(mushroom)

        # 자동차 생성
        if random.random() < 0.30:  # 30% 확률
            base = random.choice(chunk_plats)
            # 자동차 너비는 50. 안전하게 배치하기 위해 최소 80 이상 너비 필요
            if base.width >= 80:
                # 좌우 여유 공간 확보
                cx = random.randint(
                    base.left + 10, max(base.left + 11, base.right - 60)
                )
                cy = base.top - 30
                roam_left = base.left + 5
                roam_right = base.right - 5
                car = {
                    "rect": pygame.Rect(cx, cy, 50, 30),
                    "alive": True,
                    "rider": None,
                    "vx": random.choice([-1, 1]),
                    "left": roam_left,
                    "right": roam_right,
                }
                self.entity_manager.cars.append(car)

        # 바이옴 처리
        self._handle_biome(start_x, width, ground, chunk_plats)

    def _handle_biome(self, start_x, width, ground, chunk_plats):
        """
        바이옴 전환 및 생성을 처리합니다.

        Args:
            start_x: 시작 X 좌표
            width: 구간의 너비
            ground: 바닥 rect
            chunk_plats: 이 구간의 플랫폼 리스트
        """
        # 바이옴 전환
        if self.biome_chunks_remaining <= 0:
            if self.biome_type == "land":
                self.biome_type = "sea"
                self.biome_chunks_remaining = random.randint(2, 4)
            else:
                self.biome_type = "land"
                self.biome_chunks_remaining = random.randint(3, 6)

        if self.biome_type == "sea":
            self._generate_sea_biome(start_x, width, ground, chunk_plats)

        self.biome_chunks_remaining -= 1

    def _generate_sea_biome(self, start_x, width, ground, chunk_plats):
        """
        바다 바이옴을 생성합니다.

        Args:
            start_x: 시작 X 좌표
            width: 구간의 너비
            ground: 바닥 rect
            chunk_plats: 이 구간의 플랫폼 리스트
        """
        sea = pygame.Rect(start_x, GROUND_TOP_Y, width, GROUND_THICKNESS + 240)
        self.entity_manager.seas.append(sea)

        # 바닥을 바다 부분만큼 제거
        if ground.colliderect(sea):
            try:
                self.entity_manager.platforms.remove(ground)
                chunk_plats.remove(ground)
            except ValueError:
                pass

            # 양쪽 끝 바닥 추가
            if sea.left > ground.left:
                left_ground = pygame.Rect(
                    ground.left, ground.top, sea.left - ground.left, ground.height
                )
                self.entity_manager.platforms.append(left_ground)
                chunk_plats.append(left_ground)
            if ground.right > sea.right:
                right_ground = pygame.Rect(
                    sea.right, ground.top, ground.right - sea.right, ground.height
                )
                self.entity_manager.platforms.append(right_ground)
                chunk_plats.append(right_ground)

        # 다리 생성
        if random.random() < 0.6:
            bridge_y = GROUND_TOP_Y - 60
            bridge = pygame.Rect(start_x + 20, bridge_y, width - 40, 18)
            self.entity_manager.platforms.append(bridge)
            chunk_plats.append(bridge)

        # 물고기 적 생성
        for _ in range(random.randint(2, 4)):
            fx = random.randint(start_x + 20, start_x + width - 48)
            fy = random.randint(sea.top + 20, min(sea.top + 80, sea.bottom - 40))
            fish = {
                "rect": pygame.Rect(fx, fy, 28, 20),
                "vx": random.choice([-2, 2]),
                "left": start_x + 10,
                "right": start_x + width - 10,
                "alive": True,
            }
            self.entity_manager.fish_enemies.append(fish)

        # 거북이 적 생성
        for _ in range(random.randint(1, 2)):
            tx = random.randint(start_x + 30, start_x + width - 58)
            base_y = random.randint(sea.top + 40, sea.bottom - 50)
            turtle = {
                "rect": pygame.Rect(tx, base_y, 30, 20),
                "vx": random.choice([-1, 1]),
                "left": start_x + 10,
                "right": start_x + width - 10,
                "alive": True,
                "t": random.random() * 6.28,
                "amp": 12,
            }
            self.entity_manager.turtle_enemies.append(turtle)

        # 산호 생성
        for _ in range(random.randint(2, 4)):
            cx = random.randint(start_x + 10, start_x + width - 26)
            ch = random.randint(30, 70)
            coral = pygame.Rect(cx, sea.bottom - ch, 18, ch)
            self.entity_manager.corals.append(coral)

        # 해파리 생성
        for _ in range(random.randint(2, 4)):
            jx = random.randint(start_x + 40, start_x + width - 40)
            jy = random.randint(sea.top + 20, sea.bottom - 60)
            jelly = {
                "rect": pygame.Rect(jx, jy, 18, 24),
                "dir": random.choice([-1, 1]),
                "top": sea.top + 20,
                "bottom": sea.bottom - 20,
                "alive": True,
            }
            self.entity_manager.jellies.append(jelly)

    def should_generate_chunk(self, player_x):
        """
        새 구간을 생성해야 하는지 확인합니다.

        Args:
            player_x: 플레이어의 X 좌표

        Returns:
            bool: 새 구간 생성 필요 여부
        """
        return player_x + SCREEN_WIDTH > self.generated_until_x - 200

    def generate_next_chunk(self):
        """다음 구간을 생성합니다"""
        self.spawn_chunk(self.generated_until_x, CHUNK_WIDTH)
        self.generated_until_x += CHUNK_WIDTH
