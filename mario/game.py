"""
마리오 스타일 플랫포머 게임 - 리팩터링 버전

이 파일은 깔끔하게 모듈화된 게임 메인 로직입니다.
각 기능은 별도의 모듈로 분리되어 있습니다:
- constants.py: 게임 설정 및 상수
- sprites.py: 스프라이트 생성 함수
- player.py: 플레이어 클래스
- entities.py: 엔티티 관리 (적, 아이템, 플랫폼)
- level.py: 레벨 생성 및 관리
- renderer.py: 렌더링
- collision.py: 충돌 처리
"""

import pygame
import sys

from constants import *
from player import Player
from entities import EntityManager
from level import LevelGenerator
from renderer import Renderer
from collision import CollisionHandler


class Game:
    """메인 게임 클래스"""

    def __init__(self):
        """게임 초기화"""
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("작은 마리오 (2인용)")
        self.clock = pygame.time.Clock()

        # 게임 컴포넌트 초기화
        # P1: 아이디 1, 초록색 (루이지 스타일)
        # P2: 아이디 2, 빨간색 (마리오 스타일)
        self.players = [Player(1, (0, 180, 0)), Player(2, (200, 0, 0))]
        self.entity_manager = EntityManager()
        self.level_generator = LevelGenerator(self.entity_manager)
        self.renderer = Renderer(self.screen)
        self.collision_handler = CollisionHandler()

        # 게임 상태
        self.camera_x = 0
        self.score = 0
        self.coins = 0
        self.time_left = 400
        self.last_time_update = pygame.time.get_ticks()
        self.on_ground = False  # 이건 각 플레이어별로 처리해야 함, 제거 고려

        # 초기 레벨 설정
        self.entity_manager.reset_to_initial_state()

    def reset_game(self):
        """게임을 처음 상태로 리셋"""
        for p in self.players:
            p.reset()
        self.entity_manager.reset_to_initial_state()
        self.level_generator.reset()
        self.camera_x = 0
        self.score = 0
        self.coins = 0
        self.time_left = 400
        self.last_time_update = pygame.time.get_ticks()

    def handle_input(self):
        """
        입력 처리

        Returns:
            list: 각 플레이어의 입력 튜플 리스트 [(move_dir, jump_down, jump_pressed, fire_pressed), ...]
        """
        keys = pygame.key.get_pressed()
        inputs = []

        # P1 Controls (Arrows, Space/Up, Shift)
        p1_jump_down = keys[pygame.K_SPACE] or keys[pygame.K_UP]
        p1_move = (1 if keys[pygame.K_RIGHT] else 0) - (1 if keys[pygame.K_LEFT] else 0)
        p1_jump_pressed = p1_jump_down and not self.players[0].jump_was_down
        p1_fire_down = keys[pygame.K_RSHIFT] or keys[pygame.K_LSHIFT]
        p1_fire_pressed = p1_fire_down and not self.players[0].fire_was_down

        self.players[0].jump_was_down = p1_jump_down
        self.players[0].fire_was_down = p1_fire_down
        inputs.append((p1_move, p1_jump_down, p1_jump_pressed, p1_fire_pressed))

        # P2 Controls (WASD, W, G)
        p2_jump_down = keys[pygame.K_w]
        p2_move = (1 if keys[pygame.K_d] else 0) - (1 if keys[pygame.K_a] else 0)
        p2_jump_pressed = p2_jump_down and not self.players[1].jump_was_down
        p2_fire_down = keys[pygame.K_g]
        p2_fire_pressed = p2_fire_down and not self.players[1].fire_was_down

        self.players[1].jump_was_down = p2_jump_down
        self.players[1].fire_was_down = p2_fire_down
        inputs.append((p2_move, p2_jump_down, p2_jump_pressed, p2_fire_pressed))

        return inputs, keys

    def update_players(self, inputs, keys):
        """모든 플레이어 업데이트"""
        all_platforms = self.entity_manager.get_all_platforms()

        for i, player in enumerate(self.players):
            move_dir, jump_down, jump_pressed, fire_pressed = inputs[i]

            # 점프 버퍼 감소
            if player.jump_buffer_timer > 0:
                player.jump_buffer_timer -= 1

            # 무적 타이머 감소
            player.update_invincibility()

            # 물속 확인
            current_sea = self.collision_handler.is_in_water(
                player, self.entity_manager.seas
            )
            in_water = current_sea is not None

            # 가로 이동
            player.apply_horizontal_movement(move_dir, all_platforms)

            # 움직이는 플랫폼 위에서 같이 이동
            self._handle_moving_platform_movement(player)

            # 수직 이동
            on_ground = False  # 임시 변수
            if in_water:
                player.handle_swimming(keys, jump_pressed)
                # 수면 근처에서 쉽게 빠져나오게 도움
                if player.rect.bottom <= current_sea.top + 26 and player.velocity_y < 0:
                    player.velocity_y -= 0.6
                player.rect.y += int(player.velocity_y)
            else:
                # ground check는 loop 안에서 지역적으로 수행
                on_ground = player.apply_vertical_movement(
                    all_platforms, False, jump_down
                )

            # 점프 처리
            player.handle_jump(jump_pressed, on_ground)

            # 수직 플랫폼 위에서 같이 이동
            self._handle_vertical_platform_movement(player)

            # 공룡과 충돌 (탑승) - 여기서 처리
            self.collision_handler.check_dino_collision(
                player, self.entity_manager.dinos, on_ground
            )

            # 자동차와 충돌 (탑승)
            self.collision_handler.check_car_collision(
                player, self.entity_manager.cars, on_ground
            )

    def _handle_moving_platform_movement(self, player):
        """움직이는 플랫폼 위에서 플레이어를 같이 이동"""
        for mp in self.entity_manager.moving_platforms:
            if (
                abs(player.rect.bottom - mp["rect"].top) <= 1
                and player.rect.right > mp["rect"].left
                and player.rect.left < mp["rect"].right
            ):
                player.rect.x += mp["vx"]

                # 벽 충돌 방지
                for p in self.entity_manager.get_all_platforms():
                    if player.rect.colliderect(p):
                        if mp["vx"] > 0:
                            player.rect.right = p.left
                        else:
                            player.rect.left = p.right

    def _handle_vertical_platform_movement(self, player):
        """수직 플랫폼 위에서 플레이어를 같이 이동"""
        for vp in self.entity_manager.vertical_platforms:
            if (
                abs(player.rect.bottom - vp["rect"].top) <= 1
                and player.rect.right > vp["rect"].left
                and player.rect.left < vp["rect"].right
            ):
                player.rect.y += vp["vy"]

    def handle_fireball_shooting(self, inputs):
        """불똥 발사 처리"""
        for i, player in enumerate(self.players):
            _, _, _, fire_pressed = inputs[i]

            if player.on_dino and player.current_dino and fire_pressed:
                if player.dino_fire_cooldown == 0:
                    fb_dir = player.facing if player.facing != 0 else 1
                    fb_rect = pygame.Rect(
                        player.rect.centerx + fb_dir * 18,
                        player.rect.centery - 6,
                        12,
                        12,
                    )
                    self.entity_manager.fireballs.append(
                        {
                            "rect": fb_rect,
                            "vx": fb_dir * FIREBALL_SPEED,
                            "alive": True,
                            "ttl": FIREBALL_LIFETIME,
                        }
                    )
                    player.dino_fire_cooldown = DINO_FIRE_DELAY

            if player.dino_fire_cooldown > 0:
                player.dino_fire_cooldown -= 1

    def update_entities(self):
        """모든 엔티티 업데이트"""
        self.entity_manager.update_moving_platforms()
        self.entity_manager.update_vertical_platforms()
        self.entity_manager.update_enemies()
        self.entity_manager.update_fish_enemies()
        self.entity_manager.update_turtle_enemies()
        self.entity_manager.update_jellies()
        self.entity_manager.update_mushrooms()
        self.entity_manager.update_dinos()
        self.entity_manager.update_cars()
        self.score = self.entity_manager.update_fireballs(self.score)

    def handle_collisions(self):
        """모든 충돌 처리 (모든 플레이어에 대해 수행)"""
        for player in self.players:
            # 적과 충돌
            self.score += self.collision_handler.check_enemy_collision(
                player, self.entity_manager.enemies, self.reset_game
            )

            # 물고기와 충돌
            self.score += self.collision_handler.check_water_enemy_collision(
                player, self.entity_manager.fish_enemies, self.reset_game
            )

            # 거북이와 충돌
            self.score += self.collision_handler.check_water_enemy_collision(
                player, self.entity_manager.turtle_enemies, self.reset_game
            )

            # 해파리와 충돌
            self.collision_handler.check_jelly_collision(
                player, self.entity_manager.jellies, self.reset_game
            )

            # 동전과 충돌
            coins_collected = self.collision_handler.check_coin_collision(
                player, self.entity_manager.coins
            )
            self.score += coins_collected * 200
            self.coins += coins_collected

            # 스프링과 충돌
            self.collision_handler.check_spring_collision(
                player, self.entity_manager.springs
            )

            # 버섯과 충돌
            self.collision_handler.check_mushroom_collision(
                player, self.entity_manager.mushrooms
            )

            # 가시와 충돌
            self.collision_handler.check_spike_collision(
                player, self.entity_manager.spikes, self.reset_game
            )

            # 공룡 충돌처리는 update_players에서 ground check 후 수행함

            # 자동차 들이받기는 check_enemy_collision 내부에서 우선적으로 처리됨

    def update_camera(self):
        """카메라 업데이트 (플레이어들의 중간 지점)"""
        if not self.players:
            return

        avg_x = sum(p.rect.centerx for p in self.players) / len(self.players)
        self.camera_x = max(0, avg_x - SCREEN_WIDTH // 2)

    def generate_level(self):
        """레벨 생성"""
        # 가장 멀리 간 플레이어 기준
        max_x = max(p.rect.centerx for p in self.players)
        if self.level_generator.should_generate_chunk(max_x):
            self.level_generator.generate_next_chunk()

    def cleanup_offscreen(self):
        """화면 밖 엔티티 제거"""
        despawn_x = self.camera_x - 400
        self.entity_manager.cleanup_offscreen(despawn_x)

    def check_fall_off(self):
        """플레이어가 화면 밖으로 떨어졌는지 확인"""
        for p in self.players:
            if p.rect.top > SCREEN_HEIGHT + 50:
                is_dead = p.take_damage()
                if is_dead:
                    self.reset_game()
                    break
                else:
                    # 살아있다면 다른 플레이어 위치나 카메라 시작점으로 리스폰
                    other_p = (
                        self.players[1] if p == self.players[0] else self.players[0]
                    )
                    p.rect.x = other_p.rect.x
                    p.rect.bottom = other_p.rect.top - 50
                    p.velocity_y = 0
                    p.dismount_dino()
                    p.dismount_car()
                break

    def run(self):
        """게임 메인 루프"""
        running = True
        while running:
            # 이벤트 처리
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False

            # 입력 처리
            inputs, keys = self.handle_input()

            # 플레이어 업데이트
            self.update_players(inputs, keys)

            # 불똥 발사
            self.handle_fireball_shooting(inputs)

            # 엔티티 업데이트
            self.update_entities()

            # 충돌 처리
            self.handle_collisions()

            # 카메라 업데이트
            self.update_camera()

            # 레벨 생성
            self.generate_level()

            # 화면 밖 정리
            self.cleanup_offscreen()

            # 낙사 체크
            self.check_fall_off()

            # 시간 업데이트
            current_time = pygame.time.get_ticks()
            if current_time - self.last_time_update > 1000:  # 1초마다
                self.time_left -= 1
                self.last_time_update = current_time
                if self.time_left <= 0:
                    # 모든 플레이어 데미지
                    for p in self.players:
                        p.take_damage()
                    # 일단 한명이라도 죽으면 리셋
                    if any(p.health <= 0 for p in self.players):
                        self.reset_game()

            # 렌더링
            self.renderer.render_all(
                self.entity_manager,
                self.players,
                self.camera_x,
                self.score,
                self.coins,
                self.time_left,
            )

            # 화면 업데이트
            pygame.display.flip()
            self.clock.tick(60)

        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()
