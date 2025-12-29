"""
충돌 처리 담당 모듈
"""

from typing import Callable, Any, Optional
import pygame
from constants import *


class CollisionHandler:
    """게임 내 충돌을 처리하는 클래스"""

    @staticmethod
    def check_enemy_collision(
        player: "Player",
        enemies: list[dict[str, Any]],
        on_reset_game: Callable[[], None],
    ) -> int:
        """
        플레이어와 적의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            enemies: 적 리스트
            on_reset_game: 게임 리셋 콜백 함수

        Returns:
            int: 획득한 점수
        """
        score = 0
        for e in enemies:
            if not e["alive"]:
                continue

            # 플레이어 본체 또는 탑승 중인 자동차와 충돌 확인
            player_hit = player.rect.colliderect(e["rect"])
            car_hit = False
            if player.on_car and player.current_car:
                car_hit = player.current_car["rect"].colliderect(e["rect"])

            if player_hit or car_hit:
                # 위에서 밟았을 때 (플레이어 발이 적 머리 위)
                # 자동차 타고 있어도 밟기는 가능하게 처리 (선택사항이나 게임성을 위해 유지)
                if (
                    player.velocity_y > 0
                    and player.rect.bottom <= e["rect"].top + STOMP_TOLERANCE
                ):
                    player.rect.bottom = e["rect"].top
                    e["alive"] = False
                    score += 1
                    player.velocity_y = JUMP_POWER * 0.6
                else:
                    # 그 외 방향에서 닿으면 데미지
                    game_over = player.take_damage()
                    if game_over:
                        on_reset_game()
                        break

        return score

    @staticmethod
    def check_water_enemy_collision(
        player: "Player",
        water_enemies: list[dict[str, Any]],
        on_reset_game: Callable[[], None],
    ) -> int:
        """
        플레이어와 물 속 적의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            water_enemies: 물 속 적 리스트
            on_reset_game: 게임 리셋 콜백 함수

        Returns:
            int: 획득한 점수
        """
        score = 0
        for enemy in water_enemies:
            if not enemy["alive"]:
                continue

            # 플레이어 본체 또는 탑승 중인 자동차와 충돌 확인
            player_hit = player.rect.colliderect(enemy["rect"])
            car_hit = False
            if player.on_car and player.current_car:
                car_hit = player.current_car["rect"].colliderect(enemy["rect"])

            if player_hit or car_hit:
                # 물속 적은 밟을 수 없음 (보통) - 그냥 닿으면 데미지
                # 단, 슈퍼마리오 월드처럼 위에서 밟으면 죽는지는 기획에 따라 다름.
                # 여기선 기존 로직(밟기 가능)을 유지하되 자동차 무적만 제거

                if (
                    player.velocity_y > 0
                    and player.rect.bottom <= enemy["rect"].top + STOMP_TOLERANCE
                ):
                    player.rect.bottom = enemy["rect"].top
                    enemy["alive"] = False
                    score += 1
                    player.velocity_y = JUMP_POWER * 0.6
                else:
                    # 체력 감소
                    game_over = player.take_damage()
                    if game_over:
                        on_reset_game()
                        break

        return score

    @staticmethod
    def check_jelly_collision(
        player: "Player",
        jellies: list[dict[str, Any]],
        on_reset_game: Callable[[], None],
    ) -> None:
        """
        플레이어와 해파리의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            jellies: 해파리 리스트
            on_reset_game: 게임 리셋 콜백 함수
        """
        for j in jellies:
            if not j["alive"]:
                continue

            if player.rect.colliderect(j["rect"]):
                # 체력 감소
                game_over = player.take_damage()
                if game_over:
                    on_reset_game()
                    break

    @staticmethod
    def check_coin_collision(player: "Player", coins: list[pygame.Rect]) -> int:
        """
        플레이어와 동전의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            coins: 동전 리스트

        Returns:
            int: 획득한 점수
        """
        score = 0
        for c in list(coins):
            if player.rect.colliderect(c):
                coins.remove(c)
                score += 1
        return score

    @staticmethod
    def check_spring_collision(player: "Player", springs: list[pygame.Rect]) -> None:
        """
        플레이어와 스프링의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            springs: 스프링 리스트
        """
        for s in springs:
            if player.rect.colliderect(s) and player.velocity_y >= 0:
                player.rect.bottom = s.top
                player.velocity_y = JUMP_POWER * 1.2
                player.jump_hold_timer = JUMP_HOLD_TIME_MAX

    @staticmethod
    def check_mushroom_collision(
        player: "Player", mushrooms: list[dict[str, Any]]
    ) -> None:
        """
        플레이어와 버섯의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            mushrooms: 버섯 리스트
        """
        for m in list(mushrooms):
            if player.rect.colliderect(m["rect"]) and m["alive"]:
                mushrooms.remove(m)
                # 체력 회복
                healed = player.heal()
                # 체력이 최대가 아닌 경우에만 회복, 최대면 크기만 증가
                if not healed:
                    player.make_big()
                else:
                    player.make_big()

    @staticmethod
    def check_spike_collision(
        player: "Player", spikes: list[pygame.Rect], on_reset_game: Callable[[], None]
    ) -> None:
        """
        플레이어와 가시의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            spikes: 가시 리스트
            on_reset_game: 게임 리셋 콜백 함수
        """
        for g in spikes:
            if player.rect.colliderect(g):
                # 체력 감소
                game_over = player.take_damage()
                if game_over:
                    on_reset_game()
                    break

    @staticmethod
    def is_in_water(player: "Player", seas: list[pygame.Rect]) -> Optional[pygame.Rect]:
        """
        플레이어가 물속에 있는지 확인합니다.

        Args:
            player: 플레이어 객체
            seas: 바다 리스트

        Returns:
            pygame.Rect or None: 물속에 있으면 해당 바다 rect, 없으면 None
        """
        for w in seas:
            if player.rect.colliderect(w):
                return w
        return None

    @staticmethod
    def check_car_collision(
        player: "Player", cars: list[dict[str, Any]], on_ground: bool
    ) -> None:
        """
        플레이어와 자동차의 충돌을 확인합니다 (탑승 처리).

        Args:
            player: 플레이어 객체
            cars: 자동차 리스트
            on_ground: 플레이어가 바닥에 있는지 여부
        """
        for car in cars:
            if not car["alive"]:
                continue
            is_landing = player.velocity_y >= 0
            if (
                player.rect.colliderect(car["rect"])
                and (on_ground or is_landing)
                and not player.on_car
                and car["rider"] is None
            ):
                player.mount_car(car)
                break

    @staticmethod
    def check_flag_collision(player: "Player", flags: list[pygame.Rect]) -> bool:
        """
        플레이어와 깃발(Finish Line)의 충돌을 확인합니다.

        Args:
            player: 플레이어 객체
            flags: 깃발 리스트

        Returns:
            bool: 깃발 획득 여부
        """
        for f in flags:
            if player.rect.colliderect(f):
                return True
            # 자동차 타고 있을 때 자동차가 깃발에 닿아도 인정
            if player.on_car and player.current_car:
                if player.current_car["rect"].colliderect(f):
                    return True
        return False
