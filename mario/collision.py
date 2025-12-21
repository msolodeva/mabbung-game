"""
충돌 처리 담당 모듈
"""
from constants import *


class CollisionHandler:
    """게임 내 충돌을 처리하는 클래스"""
    
    @staticmethod
    def check_enemy_collision(player, enemies, on_reset_game):
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
            
            if player.rect.colliderect(e["rect"]):
                # 위에서 밟았을 때
                if player.velocity_y > 0 and player.rect.bottom <= e["rect"].top + STOMP_TOLERANCE:
                    player.rect.bottom = e["rect"].top
                    e["alive"] = False
                    score += 1
                    player.velocity_y = JUMP_POWER * 0.6
                else:
                    # 옆이나 아래에서 닿았을 때
                    if player.on_dino and player.current_dino:
                        player.dismount_dino()
                        player.invincible_timer = 30
                        player.velocity_y = JUMP_POWER * 0.5
                        player.rect.bottom = e["rect"].top - 2
                    else:
                        # 체력 감소
                        game_over = player.take_damage()
                        if game_over:
                            on_reset_game()
                            break
        
        return score
    
    @staticmethod
    def check_water_enemy_collision(player, water_enemies, on_reset_game):
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
            
            if player.rect.colliderect(enemy["rect"]):
                # 위에서 밟았을 때
                if player.velocity_y > 0 and player.rect.bottom <= enemy["rect"].top + STOMP_TOLERANCE:
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
    def check_jelly_collision(player, jellies, on_reset_game):
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
    def check_coin_collision(player, coins):
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
    def check_spring_collision(player, springs):
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
    def check_mushroom_collision(player, mushrooms):
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
    def check_spike_collision(player, spikes, on_reset_game):
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
    def check_dino_collision(player, dinos, on_ground):
        """
        플레이어와 공룡의 충돌을 확인합니다 (탑승 처리).
        
        Args:
            player: 플레이어 객체
            dinos: 공룡 리스트
            on_ground: 플레이어가 바닥에 있는지 여부
        """
        for d in dinos:
            if not d["alive"]:
                continue
            if player.rect.colliderect(d["rect"]) and on_ground and not player.on_dino:
                player.mount_dino(d)
                break
    
    @staticmethod
    def is_in_water(player, seas):
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

