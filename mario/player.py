"""
플레이어 관련 클래스 및 함수
"""
import pygame
from constants import *
from sprites import make_player_sprite


class Player:
    """플레이어 캐릭터를 관리하는 클래스"""
    
    def __init__(self):
        """플레이어 초기화"""
        self.rect = pygame.Rect(PLAYER_START_X, PLAYER_START_Y, PLAYER_SMALL_WIDTH, PLAYER_SMALL_HEIGHT)
        self.velocity_y = 0
        self.speed = PLAYER_SPEED
        self.is_big = False
        self.invincible_timer = 0
        self.facing = 1  # 1: 오른쪽, -1: 왼쪽
        self.health = INITIAL_HEALTH  # 체력 추가
        
        # 점프 관련
        self.jump_hold_timer = 0
        self.coyote_timer = 0
        self.jump_buffer_timer = 0
        self.jump_was_down = False
        
        # 공룡 탑승 관련
        self.on_dino = False
        self.current_dino = None
        self.dino_fire_cooldown = 0
        self.fire_was_down = False
        
        # 스프라이트
        self.sprite = make_player_sprite(self.rect.width, self.rect.height)
    
    def reset(self):
        """플레이어를 초기 상태로 리셋"""
        self.rect.x = PLAYER_START_X
        self.rect.y = PLAYER_START_Y
        self.rect.width = PLAYER_SMALL_WIDTH
        self.rect.height = PLAYER_SMALL_HEIGHT
        self.velocity_y = 0
        self.is_big = False
        self.invincible_timer = 0
        self.facing = 1
        self.on_dino = False
        self.current_dino = None
        self.dino_fire_cooldown = 0
        self.fire_was_down = False
        self.health = INITIAL_HEALTH  # 체력 리셋
        self.sprite = make_player_sprite(self.rect.width, self.rect.height)
    
    def update_invincibility(self):
        """무적 시간 업데이트"""
        if self.invincible_timer > 0:
            self.invincible_timer -= 1
    
    def make_big(self):
        """플레이어를 크게 만듭니다"""
        old_bottom = self.rect.bottom
        old_centerx = self.rect.centerx
        self.rect.width = PLAYER_BIG_WIDTH
        self.rect.height = PLAYER_BIG_HEIGHT
        self.rect.x = old_centerx - self.rect.width // 2
        self.rect.bottom = old_bottom
        self.is_big = True
        self.invincible_timer = 60
        self.sprite = make_player_sprite(self.rect.width, self.rect.height)
    
    def take_damage(self):
        """
        플레이어가 피해를 입습니다.
        
        Returns:
            bool: 체력이 0이 되어 게임 오버인지 여부
        """
        if self.invincible_timer > 0:
            return False
        
        self.health -= 1
        self.invincible_timer = 90  # 1.5초 무적
        
        # 크기가 큰 상태면 작게 만들기
        if self.is_big:
            self.make_small()
        
        return self.health <= 0
    
    def heal(self):
        """체력을 1 회복합니다 (최대 3까지)"""
        if self.health < MAX_HEALTH:
            self.health += 1
            return True
        return False
    
    def make_small(self):
        """플레이어를 작게 만듭니다"""
        old_center = self.rect.center
        self.rect.width = PLAYER_SMALL_WIDTH
        self.rect.height = PLAYER_SMALL_HEIGHT
        self.rect.x = old_center[0] - self.rect.width // 2
        self.rect.y = old_center[1] - self.rect.height // 2
        self.is_big = False
        self.invincible_timer = 60
        self.sprite = make_player_sprite(self.rect.width, self.rect.height)
    
    def mount_dino(self, dino):
        """공룡에 탑승합니다"""
        self.on_dino = True
        self.current_dino = dino
        dino["rider"] = self.rect
        self.velocity_y = 0
        self.rect.bottom = dino["rect"].top + 6
        self.dino_fire_cooldown = 0
    
    def dismount_dino(self, kick_speed=3):
        """공룡에서 내립니다"""
        if not self.on_dino or self.current_dino is None:
            return
        
        d = self.current_dino
        d["rider"] = None
        d["fire_cooldown"] = 0
        d["vx"] = kick_speed * (self.facing if self.facing != 0 else 1)
        self.on_dino = False
        self.current_dino = None
        self.dino_fire_cooldown = 0
        d["rect"].bottom = min(d["rect"].bottom, GROUND_TOP_Y)
    
    def apply_horizontal_movement(self, move_direction, platforms):
        """
        플레이어의 가로 이동을 처리합니다.
        
        Args:
            move_direction: 이동 방향 (-1: 왼쪽, 0: 정지, 1: 오른쪽)
            platforms: 충돌 검사할 플랫폼 리스트
        """
        if move_direction != 0:
            self.facing = move_direction
        
        effective_move = move_direction * self.speed
        if self.on_dino and self.current_dino:
            effective_move *= DINO_SPEED_MULT
        
        self.rect.x += effective_move
        
        # 벽 충돌 처리
        for p in platforms:
            if self.rect.colliderect(p):
                if effective_move > 0:
                    self.rect.right = p.left
                elif effective_move < 0:
                    self.rect.left = p.right
    
    def apply_vertical_movement(self, platforms, on_ground, jump_down):
        """
        플레이어의 수직 이동을 처리합니다.
        
        Args:
            platforms: 충돌 검사할 플랫폼 리스트
            on_ground: 바닥에 있는지 여부
            jump_down: 점프 키가 눌렸는지 여부
        
        Returns:
            bool: 바닥에 있는지 여부
        """
        # 중력 적용
        self.velocity_y += GRAVITY
        if self.on_dino and self.current_dino and on_ground:
            self.velocity_y += DINO_JUMP_BOOST
        
        # 점프 홀드 보너스
        if jump_down and self.velocity_y < 0 and self.jump_hold_timer > 0:
            self.velocity_y += JUMP_HOLD_BOOST
            self.jump_hold_timer -= 1
        
        # 최대 낙하 속도 제한
        if self.velocity_y > 20:
            self.velocity_y = 20
        
        self.rect.y += int(self.velocity_y)
        
        # 플랫폼 충돌 처리
        new_on_ground = False
        for p in platforms:
            if self.rect.colliderect(p):
                if self.velocity_y > 0:  # 아래로 떨어질 때
                    self.rect.bottom = p.top
                    self.velocity_y = 0
                    new_on_ground = True
                elif self.velocity_y < 0:  # 점프 중 위에 부딪힘
                    self.rect.top = p.bottom
                    self.velocity_y = 0
                
                # 공룡 탑승 중이면 공룡도 같이 이동
                if self.on_dino and self.current_dino:
                    self.current_dino["rect"].centerx = self.rect.centerx
                    self.current_dino["rect"].bottom = self.rect.bottom + 6
        
        return new_on_ground
    
    def handle_jump(self, jump_pressed, on_ground):
        """
        점프 입력을 처리합니다.
        
        Args:
            jump_pressed: 이번 프레임에 점프 키를 눌렀는지
            on_ground: 바닥에 있는지 여부
        """
        # 점프 버퍼 업데이트
        if jump_pressed:
            self.jump_buffer_timer = JUMP_BUFFER_TIME_MAX
        
        # 코요테 타임 업데이트
        if on_ground:
            self.coyote_timer = COYOTE_TIME_MAX
        elif self.coyote_timer > 0:
            self.coyote_timer -= 1
        
        # 점프 실행
        if self.jump_buffer_timer > 0 and (on_ground or self.coyote_timer > 0):
            self.velocity_y = JUMP_POWER
            self.jump_hold_timer = JUMP_HOLD_TIME_MAX
            self.jump_buffer_timer = 0
            self.coyote_timer = 0
    
    def handle_swimming(self, keys, jump_pressed):
        """
        물속에서의 움직임을 처리합니다.
        
        Args:
            keys: 눌린 키 목록
            jump_pressed: 이번 프레임에 점프 키를 눌렀는지
        """
        # 중력 상쇄
        self.velocity_y -= GRAVITY
        
        # 수영
        if jump_pressed:
            if self.velocity_y > WATER_JUMP_BOOST:
                self.velocity_y = WATER_JUMP_BOOST
            if self.jump_hold_timer < JUMP_HOLD_TIME_MAX:
                self.jump_hold_timer = JUMP_HOLD_TIME_MAX
        
        if keys[pygame.K_UP]:
            self.velocity_y -= SWIM_FORCE
        if keys[pygame.K_DOWN]:
            self.velocity_y += SWIM_FORCE
        if not (keys[pygame.K_UP] or keys[pygame.K_DOWN]):
            self.velocity_y *= 0.8
            if abs(self.velocity_y) < 0.25:
                self.velocity_y = 0
        
        # 최대 속도 제한
        if self.velocity_y > SWIM_DOWN_MAX:
            self.velocity_y = SWIM_DOWN_MAX
        if self.velocity_y < -SWIM_UP_MAX:
            self.velocity_y = -SWIM_UP_MAX
    
    def draw(self, screen, camera_x):
        """
        플레이어를 화면에 그립니다.
        
        Args:
            screen: 그릴 화면
            camera_x: 카메라 X 위치
        """
        screen.blit(self.sprite, (self.rect.x - camera_x, self.rect.y))

