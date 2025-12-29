"""
플레이어 관련 클래스 및 함수
"""

from typing import Any
import pygame
from constants import *  # CAR_SPEED_MULT 포함
from sprites import make_player_sprite


class Player:
    """플레이어 캐릭터를 관리하는 클래스"""

    def __init__(self, player_id: int, color: tuple[int, int, int]) -> None:
        """
        플레이어 초기화

        Args:
            player_id: 플레이어 ID (1 or 2)
            color: 플레이어 색상 (R, G, B)
        """
        self.player_id = player_id
        self.color = color
        self.rect = pygame.Rect(
            PLAYER_START_X + (player_id - 1) * 50,
            PLAYER_START_Y,
            PLAYER_SMALL_WIDTH,
            PLAYER_SMALL_HEIGHT,
        )
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

        # 자동차 탑승 관련
        self.on_car = False
        self.current_car = None

        # 스프라이트
        self.sprite = make_player_sprite(self.rect.width, self.rect.height, self.color)

    def reset(self) -> None:
        """플레이어를 초기 상태로 리셋"""
        self.rect.x = PLAYER_START_X + (self.player_id - 1) * 50
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
        self.on_car = False
        self.current_car = None
        self.sprite = make_player_sprite(self.rect.width, self.rect.height, self.color)

    def update_invincibility(self) -> None:
        """무적 시간 업데이트"""
        if self.invincible_timer > 0:
            self.invincible_timer -= 1

    def make_big(self) -> None:
        """플레이어를 크게 만듭니다"""
        old_bottom = self.rect.bottom
        old_centerx = self.rect.centerx
        self.rect.width = PLAYER_BIG_WIDTH
        self.rect.height = PLAYER_BIG_HEIGHT
        self.rect.x = old_centerx - self.rect.width // 2
        self.rect.bottom = old_bottom
        self.is_big = True
        self.invincible_timer = 60
        self.sprite = make_player_sprite(self.rect.width, self.rect.height, self.color)

    def take_damage(self) -> bool:
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

    def heal(self) -> bool:
        """체력을 1 회복합니다 (최대 3까지)"""
        if self.health < MAX_HEALTH:
            self.health += 1
            return True
        return False

    def make_small(self) -> None:
        """플레이어를 작게 만듭니다"""
        old_center = self.rect.center
        self.rect.width = PLAYER_SMALL_WIDTH
        self.rect.height = PLAYER_SMALL_HEIGHT
        self.rect.x = old_center[0] - self.rect.width // 2
        self.rect.y = old_center[1] - self.rect.height // 2
        self.is_big = False
        self.invincible_timer = 60
        self.sprite = make_player_sprite(self.rect.width, self.rect.height, self.color)

    def mount_car(self, car: dict[str, Any]) -> None:
        """자동차에 탑승합니다"""
        self.on_car = True
        self.current_car = car
        car["rider"] = self.rect
        self.velocity_y = 0
        self.rect.bottom = car["rect"].top + 6

    def dismount_car(self) -> None:
        """자동차에서 내립니다"""
        if not self.on_car or self.current_car is None:
            return

        car = self.current_car
        car["rider"] = None
        self.on_car = False
        self.current_car = None
        self.velocity_y = JUMP_POWER * 0.5  # 내릴 때 살짝 점프
        car["rect"].bottom = min(car["rect"].bottom, GROUND_TOP_Y)

    def apply_horizontal_movement(
        self, move_direction: int, platforms: list[pygame.Rect]
    ) -> None:
        """
        플레이어의 가로 이동을 처리합니다.

        Args:
            move_direction: 이동 방향 (-1: 왼쪽, 0: 정지, 1: 오른쪽)
            platforms: 충돌 검사할 플랫폼 리스트
        """
        if move_direction != 0:
            self.facing = move_direction

        effective_move = move_direction * self.speed
        if self.on_car and self.current_car:
            effective_move *= CAR_SPEED_MULT

        self.rect.x += effective_move

        # 벽 충돌 처리
        for p in platforms:
            if self.rect.colliderect(p):
                if effective_move > 0:
                    self.rect.right = p.left
                elif effective_move < 0:
                    self.rect.left = p.right

    def apply_vertical_movement(
        self, platforms: list[pygame.Rect], on_ground: bool, jump_down: bool
    ) -> bool:
        """
        플레이어의 수직 이동을 처리합니다.
        """
        # 1. 중력 및 점프 보너스 적용
        self.velocity_y += GRAVITY

        # 상승 중에 점프 키를 유지하면 더 높이 점프 (모든 상태 공통)
        if jump_down and self.velocity_y < 0 and self.jump_hold_timer > 0:
            self.velocity_y += JUMP_HOLD_BOOST
            self.jump_hold_timer -= 1

        # 최대 낙하 속도 제한
        if self.velocity_y > 20:
            self.velocity_y = 20

        # 위치 업데이트
        self.rect.y += int(self.velocity_y)
        new_on_ground = False

        # 2. 상태별 충돌 처리
        if self.on_car and self.current_car:
            # 자동차 탑승 중 (차량 기준 충돌 검사)
            car = self.current_car
            car["rect"].centerx = self.rect.centerx
            car["rect"].top = self.rect.bottom - 6

            for p in platforms:
                if car["rect"].colliderect(p):
                    if self.velocity_y > 0:
                        car["rect"].bottom = p.top
                        self.rect.bottom = car["rect"].top + 6
                        self.velocity_y = 0
                        new_on_ground = True
                    elif self.velocity_y < 0:
                        car["rect"].top = p.bottom
                        self.rect.bottom = car["rect"].top + 6
                        self.velocity_y = 0

        else:
            # 일반 상태
            for p in platforms:
                if self.rect.colliderect(p):
                    if self.velocity_y > 0:
                        self.rect.bottom = p.top
                        self.velocity_y = 0
                        new_on_ground = True
                    elif self.velocity_y < 0:
                        self.rect.top = p.bottom
                        self.velocity_y = 0

        return new_on_ground

    def handle_jump(self, jump_pressed: bool, on_ground: bool) -> None:
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
            jump_force = JUMP_POWER
            if self.on_car:
                jump_force *= CAR_JUMP_MULT

            self.velocity_y = jump_force
            self.jump_hold_timer = JUMP_HOLD_TIME_MAX
            self.jump_buffer_timer = 0
            self.coyote_timer = 0

    def handle_swimming(
        self, keys: pygame.key.ScancodeWrapper, jump_pressed: bool
    ) -> None:
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

    def draw(self, screen: pygame.Surface, camera_x: float) -> None:
        """
        플레이어를 화면에 그립니다.

        Args:
            screen: 그릴 화면
            camera_x: 카메라 X 위치
        """
        screen.blit(self.sprite, (self.rect.x - camera_x, self.rect.y))
