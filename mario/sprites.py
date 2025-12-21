"""
게임에 사용되는 스프라이트(그림) 생성 함수들
"""
import pygame


def make_player_sprite(w, h):
    """
    플레이어(마리오) 스프라이트를 생성합니다.
    
    Args:
        w: 가로 크기
        h: 세로 크기
    
    Returns:
        pygame.Surface: 생성된 플레이어 스프라이트
    """
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(s, (200, 0, 0), (0, 0, w, h // 4))  # 빨간 모자
    pygame.draw.rect(s, (255, 220, 180), (w // 4, h // 4, w // 2, h // 3))  # 얼굴
    pygame.draw.rect(s, (0, 0, 255), (0, h * 2 // 3, w, h // 3))  # 파란 옷
    pygame.draw.circle(s, (0, 0, 0), (w // 2 - 4, h // 2), 2)  # 왼쪽 눈
    pygame.draw.circle(s, (0, 0, 0), (w // 2 + 4, h // 2), 2)  # 오른쪽 눈
    pygame.draw.rect(s, (80, 50, 20), (w // 4, h // 2 + 2, w // 2, 3))  # 콧수염
    return s


def make_enemy_sprite(w, h):
    """
    적(버섯 친구) 스프라이트를 생성합니다.
    
    Args:
        w: 가로 크기
        h: 세로 크기
    
    Returns:
        pygame.Surface: 생성된 적 스프라이트
    """
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.ellipse(s, (170, 120, 60), (0, h // 6, w, h * 2 // 3))  # 몸통
    pygame.draw.rect(s, (170, 120, 60), (w // 8, h // 2, w * 3 // 4, h // 3))  # 아래쪽 몸
    pygame.draw.circle(s, (255, 255, 255), (w // 3, h // 2), 4)  # 왼쪽 눈
    pygame.draw.circle(s, (255, 255, 255), (2 * w // 3, h // 2), 4)  # 오른쪽 눈
    pygame.draw.circle(s, (0, 0, 0), (w // 3, h // 2), 2)  # 왼쪽 눈동자
    pygame.draw.circle(s, (0, 0, 0), (2 * w // 3, h // 2), 2)  # 오른쪽 눈동자
    pygame.draw.rect(s, (90, 60, 30), (w // 6, h - 4, w // 4, 4))  # 왼쪽 발
    pygame.draw.rect(s, (90, 60, 30), (w - w // 6 - w // 4, h - 4, w // 4, 4))  # 오른쪽 발
    return s


def make_mushroom_sprite(w, h):
    """
    버섯 아이템 스프라이트를 생성합니다.
    
    Args:
        w: 가로 크기
        h: 세로 크기
    
    Returns:
        pygame.Surface: 생성된 버섯 스프라이트
    """
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    cap_h = h // 2  # 윗부분(갓) 높이
    pygame.draw.ellipse(s, (220, 40, 40), (0, 0, w, cap_h + 4))  # 빨간 갓
    pygame.draw.circle(s, (255, 255, 255), (w // 3, cap_h // 2), 3)  # 하얀 점
    pygame.draw.circle(s, (255, 255, 255), (2 * w // 3, cap_h // 2), 3)  # 하얀 점
    pygame.draw.rect(s, (255, 230, 180), (w // 4, cap_h, w // 2, h - cap_h))  # 줄기
    return s


def make_fish_sprite(w, h):
    """
    물고기 스프라이트를 생성합니다.
    
    Args:
        w: 가로 크기
        h: 세로 크기
    
    Returns:
        pygame.Surface: 생성된 물고기 스프라이트
    """
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.ellipse(s, (255, 120, 60), (4, 2, w - 10, h - 4))  # 몸통
    pygame.draw.polygon(s, (255, 120, 60), [(w - 8, h // 2), (w - 2, 2), (w - 2, h - 2)])  # 꼬리
    pygame.draw.circle(s, (255, 255, 255), (8, h // 2 - 2), 3)  # 눈 흰자
    pygame.draw.circle(s, (0, 0, 0), (8, h // 2 - 2), 2)  # 눈동자
    return s


def make_turtle_sprite(w, h):
    """
    거북이 스프라이트를 생성합니다.
    
    Args:
        w: 가로 크기
        h: 세로 크기
    
    Returns:
        pygame.Surface: 생성된 거북이 스프라이트
    """
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.ellipse(s, (50, 160, 70), (2, 4, w - 8, h - 6))  # 등딱지
    pygame.draw.rect(s, (80, 200, 90), (w - 10, h // 2 - 3, 10, 6))  # 머리
    pygame.draw.circle(s, (0, 0, 0), (w - 4, h // 2 - 2), 2)  # 눈
    pygame.draw.rect(s, (80, 200, 90), (6, h - 4, 8, 4))  # 왼쪽 발
    pygame.draw.rect(s, (80, 200, 90), (w - 18, h - 4, 8, 4))  # 오른쪽 발
    return s


def make_dino_sprite(w, h):
    """
    공룡(요시 느낌) 스프라이트를 생성합니다.
    
    Args:
        w: 가로 크기
        h: 세로 크기
    
    Returns:
        pygame.Surface: 생성된 공룡 스프라이트
    """
    s = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.ellipse(s, (70, 200, 120), (4, h // 3, w - 8, h // 2 + 4))  # 몸통
    pygame.draw.circle(s, (70, 200, 120), (w - 10, h // 2), h // 3)  # 머리
    pygame.draw.circle(s, (0, 0, 0), (w - 6, h // 2 - 4), 4)  # 눈
    pygame.draw.circle(s, (255, 255, 255), (w - 7, h // 2 - 5), 2)  # 눈 하이라이트
    pygame.draw.rect(s, (90, 60, 30), (10, h - 6, 12, 6))  # 왼쪽 발
    pygame.draw.rect(s, (90, 60, 30), (24, h - 6, 12, 6))  # 가운데 발
    pygame.draw.rect(s, (90, 60, 30), (38, h - 6, 12, 6))  # 오른쪽 발
    pygame.draw.polygon(s, (60, 180, 110), [(6, h // 2 + 4), (0, h // 2 - 2), (10, h // 2 - 6)])  # 꼬리
    pygame.draw.circle(s, (255, 100, 100), (w - 2, h // 2 + 4), 6)  # 볼 빨간 점
    return s


def make_fireball_sprite(r):
    """
    불똥 스프라이트를 생성합니다.
    
    Args:
        r: 반지름
    
    Returns:
        pygame.Surface: 생성된 불똥 스프라이트
    """
    s = pygame.Surface((r * 2, r * 2), pygame.SRCALPHA)
    pygame.draw.circle(s, (255, 140, 0), (r, r), r)
    pygame.draw.circle(s, (255, 220, 120), (r, r), max(1, r - 3))
    return s

