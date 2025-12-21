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
        self.font = pygame.font.SysFont(None, 36)
        
        # 스프라이트 미리 생성
        self.enemy_img = make_enemy_sprite(28, 28)
        self.fish_img = make_fish_sprite(28, 18)
        self.turtle_img = make_turtle_sprite(30, 20)
        self.dino_img = make_dino_sprite(64, 40)
        self.fireball_img = make_fireball_sprite(8)
        self.mushroom_img = make_mushroom_sprite(24, 24)
    
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
            pygame.draw.arc(self.screen, SEA_DARK, (wx - 12, wy - 6, 24, 12), math.pi, 2 * math.pi, 2)
    
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
    
    def draw_health_bar(self, health):
        """
        화면 오른쪽 상단에 체력(하트)을 그립니다.
        
        Args:
            health: 현재 체력
        """
        # 하트 시작 위치 (오른쪽 상단)
        start_x = SCREEN_WIDTH - 150
        start_y = 25
        heart_spacing = 40
        
        for i in range(MAX_HEALTH):
            x = start_x + i * heart_spacing
            # 현재 체력보다 작거나 같으면 채워진 하트
            filled = (i < health)
            self.draw_heart(x, start_y, filled)
    
    def render_all(self, entity_manager, player, camera_x, score):
        """
        모든 게임 요소를 렌더링합니다.
        
        Args:
            entity_manager: 엔티티 매니저
            player: 플레이어 객체
            camera_x: 카메라 X 좌표
            score: 현재 점수
        """
        # 배경
        self.screen.fill(SKY)
        
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
                pygame.draw.ellipse(self.screen, JELLY, 
                                  (j["rect"].x - camera_x, j["rect"].y, 
                                   j["rect"].width, j["rect"].height))
        
        # 버섯
        for m in entity_manager.mushrooms:
            if m["alive"]:
                self.screen.blit(self.mushroom_img, (m["rect"].x - camera_x, m["rect"].y))
        
        # 공룡
        for d in entity_manager.dinos:
            if d["alive"]:
                self.screen.blit(self.dino_img, (d["rect"].x - camera_x, d["rect"].y))
        
        # 불똥
        for fb in entity_manager.fireballs:
            if fb["alive"]:
                self.screen.blit(self.fireball_img, (fb["rect"].x - camera_x, fb["rect"].y))
        
        # 동전
        for c in entity_manager.coins:
            center_pos = (c.centerx - camera_x, c.centery)
            pygame.draw.circle(self.screen, GOLD, center_pos, c.width // 2)
        
        # 플레이어
        player.draw(self.screen, camera_x)
        
        # 점수
        score_text = self.font.render(f"점수: {score}", True, BLACK)
        self.screen.blit(score_text, (10, 10))
        
        # 체력 (하트)
        self.draw_health_bar(player.health)

