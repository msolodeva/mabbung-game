"""
게임 엔티티(적, 아이템, 플랫폼 등) 관련 클래스 및 함수
"""

import pygame
import random
import math
from constants import *


class EntityManager:
    """게임의 모든 엔티티를 관리하는 클래스"""

    def __init__(self):
        """엔티티 매니저 초기화"""
        self.platforms = []
        self.moving_platforms = []
        self.vertical_platforms = []
        self.fragile_platforms = []
        self.enemies = []
        self.fish_enemies = []
        self.turtle_enemies = []
        self.jellies = []
        self.coins = []
        self.mushrooms = []
        self.dinos = []
        self.fireballs = []
        self.springs = []
        self.spikes = []
        self.seas = []
        self.cars = []
        self.corals = []

    def reset_to_initial_state(self):
        """초기 상태로 리셋"""
        self.platforms = [
            pygame.Rect(0, GROUND_TOP_Y, 2600, GROUND_THICKNESS),
            pygame.Rect(250, 350, 120, 20),
            pygame.Rect(450, 300, 120, 20),
            pygame.Rect(700, 260, 120, 20),
            pygame.Rect(950, 350, 140, 20),
            pygame.Rect(1200, 300, 140, 20),
            pygame.Rect(1500, 360, 140, 20),
            pygame.Rect(1750, 320, 140, 20),
            pygame.Rect(2000, 280, 140, 20),
            pygame.Rect(2300, 360, 140, 20),
        ]

        self.moving_platforms = [
            {
                "rect": pygame.Rect(1350, 340, 120, 20),
                "vx": 2,
                "left": 1350,
                "right": 1650,
            },
            {
                "rect": pygame.Rect(1850, 260, 100, 20),
                "vx": -2,
                "left": 1750,
                "right": 2050,
            },
        ]

        self.vertical_platforms = [
            {
                "rect": pygame.Rect(1600, 260, 100, 20),
                "vy": 2,
                "top": 220,
                "bottom": 360,
            },
        ]

        self.fragile_platforms = [
            {"rect": pygame.Rect(1300, 300, 110, 18), "timer": -1},
        ]

        self.enemies = [
            {"rect": pygame.Rect(380, 392, 28, 28), "vx": -2, "vy": 0, "alive": True},
            {"rect": pygame.Rect(800, 392, 28, 28), "vx": 2, "vy": 0, "alive": True},
            {"rect": pygame.Rect(1080, 392, 28, 28), "vx": -2, "vy": 0, "alive": True},
            {"rect": pygame.Rect(1500, 392, 28, 28), "vx": -2, "vy": 0, "alive": True},
            {"rect": pygame.Rect(2000, 392, 28, 28), "vx": 2, "vy": 0, "alive": True},
            {
                "rect": pygame.Rect(1720, 392, 28, 28),
                "vx": 2,
                "vy": 0,
                "alive": True,
                "kind": "hopper",
                "jump_cd": 60,
            },
        ]

        self.fish_enemies = []
        self.turtle_enemies = []
        self.jellies = []

        self.coins = [
            pygame.Rect(260, 320, 16, 16),
            pygame.Rect(470, 270, 16, 16),
            pygame.Rect(730, 230, 16, 16),
            pygame.Rect(980, 320, 16, 16),
            pygame.Rect(1210, 270, 16, 16),
            pygame.Rect(1450, 330, 16, 16),
            pygame.Rect(1760, 290, 16, 16),
            pygame.Rect(2010, 250, 16, 16),
            pygame.Rect(2330, 330, 16, 16),
        ]

        self.mushrooms = [
            {"rect": pygame.Rect(1120, 396, 24, 24), "vx": 2, "vy": 0, "alive": True},
        ]

        self.dinos = []
        self.fireballs = []
        self.springs = [pygame.Rect(1550, 402, 26, 18)]
        self.spikes = [pygame.Rect(1680, 404, 24, 16)]
        self.seas = []
        self.corals = []
        self.cars = [
            {
                "rect": pygame.Rect(400, 390, 50, 30),
                "alive": True,
                "rider": None,
                "vx": 1,
                "left": 300,
                "right": 600,
            }
        ]

    def get_all_platforms(self):
        """모든 플랫폼을 하나의 리스트로 반환"""
        return (
            self.platforms
            + [mp["rect"] for mp in self.moving_platforms]
            + [vp["rect"] for vp in self.vertical_platforms]
            + [fp["rect"] for fp in self.fragile_platforms]
        )

    def update_moving_platforms(self):
        """움직이는 플랫폼 업데이트"""
        for mp in self.moving_platforms:
            mp["rect"].x += mp["vx"]
            if mp["rect"].left < mp["left"]:
                mp["rect"].left = mp["left"]
                mp["vx"] *= -1
            elif mp["rect"].right > mp["right"]:
                mp["rect"].right = mp["right"]
                mp["vx"] *= -1

    def update_vertical_platforms(self):
        """수직 플랫폼 업데이트"""
        for vp in self.vertical_platforms:
            vp["rect"].y += vp["vy"]
            if vp["rect"].top < vp["top"]:
                vp["rect"].top = vp["top"]
                vp["vy"] *= -1
            elif vp["rect"].bottom > vp["bottom"]:
                vp["rect"].bottom = vp["bottom"]
                vp["vy"] *= -1

    def update_enemies(self):
        """적 업데이트"""
        all_platforms = self.get_all_platforms()

        for e in self.enemies:
            if not e["alive"]:
                continue

            # 점프형 적
            if e.get("kind") == "hopper":
                e["jump_cd"] -= 1
                if e["jump_cd"] <= 0:
                    e["vy"] = -8
                    e["jump_cd"] = random.randint(50, 90)

            # 물속에서는 가벼운 중력
            in_sea = self._is_in_water(e["rect"])
            if in_sea:
                e["vy"] -= GRAVITY
                if e["rect"].top < in_sea.top - 4:
                    e["vy"] += 0.4
                e["vy"] *= 0.9
                e["vy"] = max(min(e["vy"], 5), -5)
            else:
                e["vy"] += GRAVITY

            e["vy"] = min(e["vy"], 20)

            # 수직 이동
            e["rect"].y += int(e["vy"])
            for p in all_platforms:
                if e["rect"].colliderect(p):
                    if e["vy"] > 0:
                        e["rect"].bottom = p.top
                        e["vy"] = 0

            # 수평 이동
            e["rect"].x += e["vx"]
            for p in all_platforms:
                if e["rect"].colliderect(p):
                    if e["vx"] > 0:
                        e["rect"].right = p.left
                    else:
                        e["rect"].left = p.right
                    e["vx"] *= -1

    def update_fish_enemies(self):
        """물고기 적 업데이트"""
        for f in self.fish_enemies:
            if not f["alive"]:
                continue
            f["rect"].x += f["vx"]
            if f["rect"].left < f["left"] or f["rect"].right > f["right"]:
                f["vx"] *= -1

    def update_turtle_enemies(self):
        """거북이 적 업데이트"""
        for t in self.turtle_enemies:
            if not t["alive"]:
                continue
            t["rect"].x += t["vx"]
            if t["rect"].left < t["left"] or t["rect"].right > t["right"]:
                t["vx"] *= -1
            t["t"] += 0.05
            t["rect"].y += int(math.sin(t["t"]) * t["amp"] * 0.1)

    def update_jellies(self):
        """해파리 업데이트"""
        for j in self.jellies:
            if not j["alive"]:
                continue
            j["rect"].y += j["dir"] * 1
            if j["rect"].top < j["top"] or j["rect"].bottom > j["bottom"]:
                j["dir"] *= -1

    def update_mushrooms(self):
        """버섯 아이템 업데이트"""
        all_platforms = (
            self.platforms
            + [mp["rect"] for mp in self.moving_platforms]
            + [vp["rect"] for vp in self.vertical_platforms]
        )

        for m in self.mushrooms:
            if not m["alive"]:
                continue

            m["vy"] += GRAVITY
            m["vy"] = min(m["vy"], 20)
            m["rect"].y += int(m["vy"])

            for p in all_platforms:
                if m["rect"].colliderect(p):
                    if m["vy"] > 0:
                        m["rect"].bottom = p.top
                        m["vy"] = 0

            m["rect"].x += m["vx"]
            for p in all_platforms:
                if m["rect"].colliderect(p):
                    if m["vx"] > 0:
                        m["rect"].right = p.left
                    else:
                        m["rect"].left = p.right
                    m["vx"] *= -1

    def update_dinos(self):
        """공룡 업데이트"""
        for d in self.dinos:
            if not d["alive"]:
                continue

            if d["rider"]:
                # 탑승 중인 공룡의 위치 업데이트는 Player.apply_vertical_movement에서 수행됨
                continue

            # 자유 이동 (자동차와 동일한 왔다 갔다 로직)
            d["rect"].x += d["vx"]
            if d["rect"].left < d["left"] or d["rect"].right > d["right"]:
                d["vx"] *= -1
                d["rect"].x += d["vx"]

            # 플랫폼 위에 고정
            on_platform = False
            for p in self.platforms:
                if d["rect"].colliderect(p) and d["rect"].bottom <= p.top + 4:
                    d["rect"].bottom = p.top
                    on_platform = True
                    break
            if not on_platform:
                d["rect"].bottom = min(d["rect"].bottom, GROUND_TOP_Y)

    def update_cars(self):
        """자동차 업데이트"""
        for car in self.cars:
            if not car["alive"]:
                continue

            if car["rider"]:
                # 탑승 중인 자동차의 위치 업데이트는 Player.apply_vertical_movement에서 수행됨
                continue

            # 자유 이동 (왔다 갔다)
            car["rect"].x += car["vx"]
            if car["rect"].left < car["left"] or car["rect"].right > car["right"]:
                car["vx"] *= -1
                car["rect"].x += car["vx"]

            # 플랫폼 위에 고정
            on_platform = False
            for p in self.platforms:
                if car["rect"].colliderect(p) and car["rect"].bottom <= p.top + 4:
                    car["rect"].bottom = p.top
                    on_platform = True
                    break
            if not on_platform:
                car["rect"].bottom = min(car["rect"].bottom, GROUND_TOP_Y)

    def update_fireballs(self, score):
        """불똥 업데이트 및 충돌 처리"""
        all_platforms = (
            self.platforms
            + [mp["rect"] for mp in self.moving_platforms]
            + [vp["rect"] for vp in self.vertical_platforms]
        )

        for fb in list(self.fireballs):
            if not fb["alive"]:
                self.fireballs.remove(fb)
                continue

            fb["rect"].x += fb["vx"]
            fb["ttl"] -= 1

            if fb["ttl"] <= 0:
                fb["alive"] = False
                try:
                    self.fireballs.remove(fb)
                except ValueError:
                    pass
                continue

            # 벽 충돌
            hit_wall = False
            for p in all_platforms:
                if fb["rect"].colliderect(p):
                    hit_wall = True
                    break

            if hit_wall:
                fb["alive"] = False
                try:
                    self.fireballs.remove(fb)
                except ValueError:
                    pass
                continue

            # 적과 충돌
            for e in self.enemies:
                if e["alive"] and fb["rect"].colliderect(e["rect"]):
                    e["alive"] = False
                    score += 1
                    fb["alive"] = False
                    break

            if fb["alive"]:
                for f in self.fish_enemies:
                    if f["alive"] and fb["rect"].colliderect(f["rect"]):
                        f["alive"] = False
                        score += 1
                        fb["alive"] = False
                        break

            if fb["alive"]:
                for t in self.turtle_enemies:
                    if t["alive"] and fb["rect"].colliderect(t["rect"]):
                        t["alive"] = False
                        score += 1
                        fb["alive"] = False
                        break

            if fb["alive"]:
                for j in self.jellies:
                    if j["alive"] and fb["rect"].colliderect(j["rect"]):
                        j["alive"] = False
                        score += 1
                        fb["alive"] = False
                        break

            if not fb["alive"]:
                try:
                    self.fireballs.remove(fb)
                except ValueError:
                    pass

        return score

    def cleanup_offscreen(self, despawn_x):
        """화면 밖 엔티티 제거"""
        self.platforms = [p for p in self.platforms if p.right > despawn_x]
        self.moving_platforms = [
            mp for mp in self.moving_platforms if mp["rect"].right > despawn_x
        ]
        self.vertical_platforms = [
            vp for vp in self.vertical_platforms if vp["rect"].right > despawn_x
        ]
        self.fragile_platforms = [
            fp
            for fp in self.fragile_platforms
            if fp["rect"].right > despawn_x and fp["rect"].width > 0
        ]
        self.enemies = [
            e
            for e in self.enemies
            if e["rect"].right > despawn_x
            and (e["alive"] or e["rect"].y < SCREEN_HEIGHT + 100)
        ]
        self.coins = [c for c in self.coins if c.right > despawn_x]
        self.springs = [s for s in self.springs if s.right > despawn_x]
        self.spikes = [g for g in self.spikes if g.right > despawn_x]
        self.mushrooms = [
            m for m in self.mushrooms if m["rect"].right > despawn_x and m["alive"]
        ]
        self.seas = [w for w in self.seas if w.right > despawn_x]
        self.fish_enemies = [
            f for f in self.fish_enemies if f["rect"].right > despawn_x and f["alive"]
        ]
        self.turtle_enemies = [
            t for t in self.turtle_enemies if t["rect"].right > despawn_x and t["alive"]
        ]
        self.jellies = [
            j for j in self.jellies if j["rect"].right > despawn_x and j["alive"]
        ]
        self.corals = [c for c in self.corals if c.right > despawn_x]
        self.cars = [
            car for car in self.cars if car["rect"].right > despawn_x and car["alive"]
        ]

    def _is_in_water(self, rect):
        """주어진 rect가 물속에 있는지 확인"""
        for w in self.seas:
            if rect.colliderect(w):
                return w
        return None
