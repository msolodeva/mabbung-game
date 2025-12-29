"""
게임 엔티티 데이터 모델

이 모듈은 게임의 모든 엔티티를 dataclass로 정의하여
타입 안정성과 AI 친화성을 높입니다.
"""

from dataclasses import dataclass
import pygame


@dataclass
class Position:
    """위치 컴포넌트"""

    x: float
    y: float


@dataclass
class Velocity:
    """속도 컴포넌트"""

    vx: float = 0.0
    vy: float = 0.0


@dataclass
class Platform:
    """플랫폼 엔티티"""

    rect: pygame.Rect
    color: tuple[int, int, int]
    breakable: bool = False
    break_timer: int = 0


@dataclass
class MovingPlatform:
    """움직이는 플랫폼 엔티티"""

    rect: pygame.Rect
    start_x: float
    end_x: float
    speed: float
    direction: int = 1  # 1: 오른쪽, -1: 왼쪽


@dataclass
class VerticalPlatform:
    """수직 플랫폼 엔티티"""

    rect: pygame.Rect
    start_y: float
    end_y: float
    speed: float
    direction: int = 1  # 1: 아래, -1: 위


@dataclass
class Enemy:
    """적 엔티티"""

    rect: pygame.Rect
    vel_x: float = -2.0
    vel_y: float = 0.0
    jumping: bool = False
    alive: bool = True


@dataclass
class FishEnemy:
    """물고기 적 엔티티"""

    rect: pygame.Rect
    vel_x: float = -3.0
    amplitude: float = 0.0
    phase: float = 0.0


@dataclass
class TurtleEnemy:
    """거북이 적 엔티티"""

    rect: pygame.Rect
    vel_x: float = -1.5


@dataclass
class Jelly:
    """해파리 엔티티"""

    rect: pygame.Rect
    start_y: float
    end_y: float
    vel_y: float = 2.0
    direction: int = 1


@dataclass
class Coin:
    """동전 엔티티"""

    rect: pygame.Rect


@dataclass
class Spring:
    """스프링 엔티티"""

    rect: pygame.Rect


@dataclass
class Spike:
    """가시 엔티티"""

    rect: pygame.Rect


@dataclass
class Mushroom:
    """버섯 아이템 엔티티"""

    rect: pygame.Rect
    vel_x: float = 2.0
    vel_y: float = 0.0


@dataclass
class Car:
    """자동차 엔티티"""

    rect: pygame.Rect
    vel_x: float = 0.0
    vel_y: float = 0.0
    mounted: bool = False


@dataclass
class Fireball:
    """불똥 엔티티"""

    rect: pygame.Rect
    vel_x: float
    lifetime: int
    sprite: pygame.Surface


@dataclass
class Sea:
    """바다 엔티티"""

    rect: pygame.Rect


@dataclass
class GameState:
    """게임 전역 상태"""

    score: int = 0
    coins: int = 0
    time_left: int = 300
    camera_x: float = 0.0
    is_game_over: bool = False
    game_time: int = 0
