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
        pygame.display.set_caption("작은 마리오")
        self.clock = pygame.time.Clock()
        
        # 게임 컴포넌트 초기화
        self.player = Player()
        self.entity_manager = EntityManager()
        self.level_generator = LevelGenerator(self.entity_manager)
        self.renderer = Renderer(self.screen)
        self.collision_handler = CollisionHandler()
        
        # 게임 상태
        self.camera_x = 0
        self.score = 0
        self.on_ground = False
        
        # 초기 레벨 설정
        self.entity_manager.reset_to_initial_state()
    
    def reset_game(self):
        """게임을 처음 상태로 리셋"""
        self.player.reset()
        self.entity_manager.reset_to_initial_state()
        self.level_generator.reset()
        self.camera_x = 0
        self.score = 0
        self.on_ground = False
    
    def handle_input(self):
        """
        입력 처리
        
        Returns:
            tuple: (move_direction, jump_down, jump_pressed, fire_pressed)
        """
        keys = pygame.key.get_pressed()
        
        jump_down = keys[pygame.K_SPACE] or keys[pygame.K_UP]
        move_direction = (1 if keys[pygame.K_RIGHT] else 0) - (1 if keys[pygame.K_LEFT] else 0)
        
        jump_pressed = jump_down and not self.player.jump_was_down
        
        fire_down = keys[FIRE_KEY]
        fire_pressed = fire_down and not self.player.fire_was_down
        
        self.player.jump_was_down = jump_down
        self.player.fire_was_down = fire_down
        
        return move_direction, jump_down, jump_pressed, fire_pressed, keys
    
    def update_player(self, move_direction, jump_down, jump_pressed, keys):
        """플레이어 업데이트"""
        # 점프 버퍼 감소
        if self.player.jump_buffer_timer > 0:
            self.player.jump_buffer_timer -= 1
        
        # 무적 타이머 감소
        self.player.update_invincibility()
        
        # 물속 확인
        current_sea = self.collision_handler.is_in_water(self.player, self.entity_manager.seas)
        in_water = current_sea is not None
        
        # 가로 이동
        all_platforms = self.entity_manager.get_all_platforms()
        self.player.apply_horizontal_movement(move_direction, all_platforms)
        
        # 움직이는 플랫폼 위에서 같이 이동
        self._handle_moving_platform_movement()
        
        # 수직 이동
        if in_water:
            self.player.handle_swimming(keys, jump_pressed)
            # 수면 근처에서 쉽게 빠져나오게 도움
            if self.player.rect.bottom <= current_sea.top + 26 and self.player.velocity_y < 0:
                self.player.velocity_y -= 0.6
            self.player.rect.y += int(self.player.velocity_y)
        else:
            self.on_ground = self.player.apply_vertical_movement(all_platforms, self.on_ground, jump_down)
        
        # 점프 처리
        self.player.handle_jump(jump_pressed, self.on_ground)
        
        # 수직 플랫폼 위에서 같이 이동
        self._handle_vertical_platform_movement()
    
    def _handle_moving_platform_movement(self):
        """움직이는 플랫폼 위에서 플레이어를 같이 이동"""
        for mp in self.entity_manager.moving_platforms:
            if (abs(self.player.rect.bottom - mp["rect"].top) <= 1 and 
                self.player.rect.right > mp["rect"].left and 
                self.player.rect.left < mp["rect"].right):
                
                self.player.rect.x += mp["vx"]
                
                # 벽 충돌 방지
                for p in self.entity_manager.get_all_platforms():
                    if self.player.rect.colliderect(p):
                        if mp["vx"] > 0:
                            self.player.rect.right = p.left
                        else:
                            self.player.rect.left = p.right
    
    def _handle_vertical_platform_movement(self):
        """수직 플랫폼 위에서 플레이어를 같이 이동"""
        for vp in self.entity_manager.vertical_platforms:
            if (abs(self.player.rect.bottom - vp["rect"].top) <= 1 and 
                self.player.rect.right > vp["rect"].left and 
                self.player.rect.left < vp["rect"].right):
                
                self.player.rect.y += vp["vy"]
    
    def handle_fireball_shooting(self, fire_pressed):
        """불똥 발사 처리"""
        if self.player.on_dino and self.player.current_dino and fire_pressed:
            if self.player.dino_fire_cooldown == 0:
                fb_dir = self.player.facing if self.player.facing != 0 else 1
                fb_rect = pygame.Rect(
                    self.player.rect.centerx + fb_dir * 18,
                    self.player.rect.centery - 6,
                    12, 12
                )
                self.entity_manager.fireballs.append({
                    "rect": fb_rect,
                    "vx": fb_dir * FIREBALL_SPEED,
                    "alive": True,
                    "ttl": FIREBALL_LIFETIME,
                })
                self.player.dino_fire_cooldown = DINO_FIRE_DELAY
        
        if self.player.dino_fire_cooldown > 0:
            self.player.dino_fire_cooldown -= 1
    
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
        self.score = self.entity_manager.update_fireballs(self.score)
    
    def handle_collisions(self):
        """모든 충돌 처리"""
        # 적과 충돌
        self.score += self.collision_handler.check_enemy_collision(
            self.player, self.entity_manager.enemies, self.reset_game
        )
        
        # 물고기와 충돌
        self.score += self.collision_handler.check_water_enemy_collision(
            self.player, self.entity_manager.fish_enemies, self.reset_game
        )
        
        # 거북이와 충돌
        self.score += self.collision_handler.check_water_enemy_collision(
            self.player, self.entity_manager.turtle_enemies, self.reset_game
        )
        
        # 해파리와 충돌
        self.collision_handler.check_jelly_collision(
            self.player, self.entity_manager.jellies, self.reset_game
        )
        
        # 동전과 충돌
        self.score += self.collision_handler.check_coin_collision(
            self.player, self.entity_manager.coins
        )
        
        # 스프링과 충돌
        self.collision_handler.check_spring_collision(
            self.player, self.entity_manager.springs
        )
        
        # 버섯과 충돌
        self.collision_handler.check_mushroom_collision(
            self.player, self.entity_manager.mushrooms
        )
        
        # 가시와 충돌
        self.collision_handler.check_spike_collision(
            self.player, self.entity_manager.spikes, self.reset_game
        )
        
        # 공룡과 충돌 (탑승)
        self.collision_handler.check_dino_collision(
            self.player, self.entity_manager.dinos, self.on_ground
        )
    
    def update_camera(self):
        """카메라 업데이트"""
        self.camera_x = max(0, self.player.rect.centerx - SCREEN_WIDTH // 2)
    
    def generate_level(self):
        """레벨 생성"""
        if self.level_generator.should_generate_chunk(self.player.rect.centerx):
            self.level_generator.generate_next_chunk()
    
    def cleanup_offscreen(self):
        """화면 밖 엔티티 제거"""
        despawn_x = self.camera_x - 400
        self.entity_manager.cleanup_offscreen(despawn_x)
    
    def check_fall_off(self):
        """플레이어가 화면 밖으로 떨어졌는지 확인"""
        if self.player.rect.top > SCREEN_HEIGHT + 50:
            self.reset_game()
    
    def run(self):
        """게임 메인 루프"""
        running = True
        while running:
            # 이벤트 처리
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
            
            # 입력 처리
            move_direction, jump_down, jump_pressed, fire_pressed, keys = self.handle_input()
            
            # 플레이어 업데이트
            self.update_player(move_direction, jump_down, jump_pressed, keys)
            
            # 불똥 발사
            self.handle_fireball_shooting(fire_pressed)
            
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
            
            # 렌더링
            self.renderer.render_all(self.entity_manager, self.player, self.camera_x, self.score)
            
            # 화면 업데이트
            pygame.display.flip()
            self.clock.tick(60)
        
        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()

