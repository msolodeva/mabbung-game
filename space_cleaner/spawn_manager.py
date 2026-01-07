import random
from constants import (
    WIDTH,
    HEIGHT,
    DIFFICULTY_INTERVAL,
    MAX_ENEMIES,
    MAX_JUNKS,
    SPAWN_BASE_THRESHOLD,
    PROB_SUPPORT_ALLY,
    PROB_BASE_ENEMY,
    PROB_MAX_ENEMY,
    SPAWN_HEAVY_THRESHOLD,
    SPAWN_INTERCEPTOR_THRESHOLD,
    SPAWN_SNIPER_THRESHOLD,
    SPAWN_GHOST_THRESHOLD,
    SPAWN_SPLIT_THRESHOLD,
    SPAWN_LASER_THRESHOLD,
    SPAWN_KAMIKAZE_THRESHOLD,
    ITEM_SPAWN_OFFSET,
)
from entities import Item, Ally
from junk import Junk
from enemies import (
    Enemy,
    HeavyEnemy,
    Interceptor,
    SniperEnemy,
    GhostEnemy,
    SplitEnemy,
    LaserEnemy,
    KamikazeEnemy,
)


class SpawnManager:
    """
    적, 아이템, 쓰레기 등의 스폰을 관리하는 클래스.
    """

    def __init__(self):
        self.spawn_timer = 0

    def update(self, dt, game_time, env_manager, enemies, junks, items, allies):
        """
        스폰 로직 업데이트.

        Args:
            dt: 델타 타임 (현재는 프레임 단위라 1.0 가정하거나 호출측에서 관리)
            game_time: 게임 진행 시간 (초)
            env_manager: 환경 매니저 (스폰 배율 확인용)
            enemies: 적 리스트
            junks: 쓰레기 리스트
            items: 아이템 리스트
            allies: 아군 리스트
        """
        # 환경 스폰 배율 가져오기
        spawn_mul = env_manager.get_spawn_multiplier()

        # 난이도 계산
        difficulty = 1.0 + (game_time / DIFFICULTY_INTERVAL)

        # 난이도가 오를수록 스폰 주기 빨라짐
        spawn_threshold = max(
            5, (SPAWN_BASE_THRESHOLD - int((difficulty - 1) * 8)) // int(spawn_mul)
        )

        self.spawn_timer += 1  # 프레임 단위 카운트라고 가정

        if self.spawn_timer > spawn_threshold:
            # 지원군 스폰 (PROB_SUPPORT_ALLY 확률, 동시 1기 제한)
            if not allies and random.random() < PROB_SUPPORT_ALLY:
                allies.append(Ally(WIDTH // 2, HEIGHT + 40))

            r = random.random()

            # 난이도가 오를수록 적 생성 확률 증가
            enemy_prob = min(PROB_MAX_ENEMY, PROB_BASE_ENEMY + (difficulty - 1) * 0.05)

            # 화면 내 객체 수 제한
            if r < enemy_prob and len(enemies) < MAX_ENEMIES:
                # HeavyEnemy 발생 빈도 조절
                has_heavy = any(isinstance(e, HeavyEnemy) for e in enemies)

                r2 = random.random()
                if not has_heavy and r2 < SPAWN_HEAVY_THRESHOLD:
                    enemies.append(HeavyEnemy(difficulty))
                elif r2 < SPAWN_INTERCEPTOR_THRESHOLD:  # 고속 요격기
                    enemies.append(Interceptor(difficulty))
                elif r2 < SPAWN_SNIPER_THRESHOLD:  # 저격수
                    enemies.append(SniperEnemy(difficulty))
                elif r2 < SPAWN_GHOST_THRESHOLD:  # 유령 적
                    enemies.append(GhostEnemy(difficulty))
                elif r2 < SPAWN_SPLIT_THRESHOLD:  # 분열 적
                    enemies.append(SplitEnemy(difficulty))
                elif r2 < SPAWN_LASER_THRESHOLD:  # 회전 레이저 적
                    enemies.append(LaserEnemy(difficulty))
                elif r2 < SPAWN_KAMIKAZE_THRESHOLD:  # 자폭 적
                    enemies.append(KamikazeEnemy(difficulty))
                else:
                    enemies.append(Enemy(difficulty))

            elif r < enemy_prob + 0.02:
                items.append(Item())

            elif len(junks) < MAX_JUNKS:
                junks.append(Junk(difficulty))

            self.spawn_timer = 0
