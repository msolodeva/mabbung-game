import pygame
import random
from constants import (
    RED,
    YELLOW,
    GREY,
    CYAN,
    ORANGE,
    PURPLE,
    GREEN,
    BLUE,
    DAMAGE_PLAYER_BASIC,
    DAMAGE_PLAYER_COLLISION,
    DAMAGE_PLAYER_LASER_BEAM,
    HEAL_AMOUNT,
    PLAYER_MAX_HEALTH,
    PLAYER_MAX_BOMBS,
)
from entities import Explosion, HitSpark
from weapons import PiercingLaser, PlasmaWave
from enemies import SplitEnemy, LaserEnemy
from utils import point_to_line_distance


class CollisionManager:
    """
    게임 내 모든 충돌 처리를 담당하는 클래스.
    Game 인스턴스를 참조하여 점수, 체력, 이펙트 등을 직접 제어합니다.
    """

    def __init__(self, game):
        self.game = game

    def update(self):
        """모든 충돌 검사 수행."""
        self._check_laser_junk_collisions()
        self._check_player_junk_collisions()
        self._check_laser_enemy_collisions()
        self._check_enemy_bullet_player_collisions()
        self._check_enemy_player_collisions()
        self._check_item_collisions()
        self._check_laser_beam_player_collisions()

    def _check_laser_junk_collisions(self):
        """레이저-쓰레기 충돌: 색상 매칭 시 점수 획득."""
        # 복사본을 순회하며 삭제 안전성 확보
        for laser in self.game.lasers[:]:
            for junk in self.game.junks[:]:
                if laser.rect.colliderect(junk.rect):
                    if laser.color == junk.color:
                        # 색상 매칭 성공
                        if laser.color == RED:
                            self.game.p1.score += 10
                        else:
                            self.game.p2.score += 10
                        self.game.explosions.append(
                            Explosion(junk.rect.centerx, junk.rect.centery, YELLOW)
                        )
                        if self.game.snd_explosion:
                            self.game.snd_explosion.play()
                    else:
                        # 색상 불일치 (페널티)
                        if laser.color == RED:
                            self.game.p1.score -= 5
                        else:
                            self.game.p2.score -= 5
                        self.game.explosions.append(
                            Explosion(junk.rect.centerx, junk.rect.centery, GREY)
                        )

                    if junk in self.game.junks:
                        self.game.junks.remove(junk)
                    if laser in self.game.lasers:
                        self.game.lasers.remove(laser)
                    break

    def _check_player_junk_collisions(self):
        """플레이어-쓰레기 충돌: 체력 감소."""
        for junk in self.game.junks[:]:
            hit_p1 = self.game.p1.rect.colliderect(junk.rect)
            hit_p2 = self.game.p2.rect.colliderect(junk.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    if self.game.p1.has_shield:
                        self.game.p1.has_shield = False
                        self.game.explosions.append(
                            Explosion(
                                self.game.p1.rect.centerx,
                                self.game.p1.rect.centery,
                                CYAN,
                            )
                        )
                    else:
                        self.game.p1.health -= 15
                if hit_p2:
                    if self.game.p2.has_shield:
                        self.game.p2.has_shield = False
                        self.game.explosions.append(
                            Explosion(
                                self.game.p2.rect.centerx,
                                self.game.p2.rect.centery,
                                CYAN,
                            )
                        )
                    else:
                        self.game.p2.health -= 15

                # 화면 흔들림 (중간 강도)
                self.game.screen_shake.trigger(intensity=8, duration=8)

                if junk in self.game.junks:
                    self.game.junks.remove(junk)

                if self.game.p1.health <= 0 and self.game.p2.health <= 0:
                    self.game.game_over = True

    def _check_laser_enemy_collisions(self):
        """레이저/특수 무기-적 충돌: 점수 획득 및 폭발."""
        # 일반 레이저 충돌
        self._collide_projectiles_with_enemies(self.game.lasers)
        # 특수 무기 충돌
        self._collide_projectiles_with_enemies(
            self.game.special_projectiles, is_special=True
        )

    def _collide_projectiles_with_enemies(self, projectiles, is_special=False):
        for proj in projectiles[:]:
            for enemy in self.game.enemies[:]:
                if proj.rect.colliderect(enemy.rect):
                    if enemy in self.game.enemies:
                        # 유령 상태일 때 무시
                        if getattr(enemy, "is_ghost", False):
                            continue

                        # 관통 레이저인 경우 이미 맞은 적인지 확인
                        if isinstance(proj, PiercingLaser):
                            if enemy in proj.hit_enemies:
                                continue
                            proj.hit_enemies.add(enemy)

                        # 히트 스파크 생성
                        self.game.hit_sparks.append(
                            HitSpark(proj.rect.centerx, proj.rect.centery, ORANGE)
                        )

                        # 체력이 있는 적 처리
                        if hasattr(enemy, "health"):
                            damage = 20 if is_special else 10
                            enemy.health -= damage
                            if enemy.health <= 0:
                                self.game.enemies.remove(enemy)
                                # SplitEnemy 처리
                                if isinstance(enemy, SplitEnemy):
                                    self.game.enemies.extend(enemy.on_death())
                                # 폭발 및 흔들림
                                for _ in range(3):
                                    self.game.explosions.append(
                                        Explosion(
                                            enemy.rect.centerx
                                            + random.randint(-20, 20),
                                            enemy.rect.centery
                                            + random.randint(-20, 20),
                                            RED,
                                        )
                                    )
                                self.game.screen_shake.trigger(12, 12)
                                self.game.hit_stop = 4  # 강한 타격감
                                if self.game.snd_explosion:
                                    self.game.snd_explosion.play()
                                self.game.p1.score += 100  # P1 점수로 합산
                        else:
                            # 일반 적 원샷
                            self.game.enemies.remove(enemy)
                            self.game.explosions.append(
                                Explosion(
                                    enemy.rect.centerx, enemy.rect.centery, PURPLE
                                )
                            )
                            if self.game.snd_explosion:
                                self.game.snd_explosion.play()
                            self.game.p1.score += 20

                    # 투사체 제거 여부 결정
                    if not isinstance(proj, (PiercingLaser, PlasmaWave)):
                        if proj in projectiles:
                            projectiles.remove(proj)
                        break

    def _check_enemy_bullet_player_collisions(self):
        """적 총알-플레이어 충돌: 체력 감소."""
        for bullet in self.game.enemy_bullets[:]:
            hit_p1 = self.game.p1.rect.colliderect(bullet.rect)
            hit_p2 = self.game.p2.rect.colliderect(bullet.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    if self.game.p1.has_shield:
                        self.game.p1.has_shield = False
                        self.game.explosions.append(
                            Explosion(
                                self.game.p1.rect.centerx,
                                self.game.p1.rect.centery,
                                CYAN,
                            )
                        )
                    else:
                        self.game.p1.health -= DAMAGE_PLAYER_BASIC
                if hit_p2:
                    if self.game.p2.has_shield:
                        self.game.p2.has_shield = False
                        self.game.explosions.append(
                            Explosion(
                                self.game.p2.rect.centerx,
                                self.game.p2.rect.centery,
                                CYAN,
                            )
                        )
                    else:
                        self.game.p2.health -= DAMAGE_PLAYER_BASIC

                if bullet in self.game.enemy_bullets:
                    self.game.enemy_bullets.remove(bullet)

                if self.game.p1.health <= 0 and self.game.p2.health <= 0:
                    self.game.game_over = True

    def _check_enemy_player_collisions(self):
        """적 기체-플레이어 충돌: 체력 대폭 감소."""
        for enemy in self.game.enemies[:]:
            hit_p1 = self.game.p1.rect.colliderect(enemy.rect)
            hit_p2 = self.game.p2.rect.colliderect(enemy.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    self.game.p1.health -= DAMAGE_PLAYER_COLLISION
                if hit_p2:
                    self.game.p2.health -= DAMAGE_PLAYER_COLLISION

                # 강한 화면 흔들림
                self.game.screen_shake.trigger(intensity=15, duration=10)
                self.game.hit_stop = 8  # 매우 강한 충돌

                if enemy in self.game.enemies:
                    self.game.enemies.remove(enemy)

                if self.game.p1.health <= 0 and self.game.p2.health <= 0:
                    self.game.game_over = True

    def _check_item_collisions(self):
        """아이템 수집: 무기 강화 또는 체력 회복."""
        for item in self.game.items[:]:
            if self.game.p1.rect.colliderect(item.rect):
                self._apply_item_effect(self.game.p1, item)
            elif self.game.p2.rect.colliderect(item.rect):
                self._apply_item_effect(self.game.p2, item)

    def _apply_item_effect(self, player, item):
        if item in self.game.items:
            self.game.items.remove(item)
            if self.game.snd_powerup:
                self.game.snd_powerup.play()
            self.game.explosions.append(
                Explosion(item.rect.centerx, item.rect.centery, item.color)
            )

            if item.kind == "weapon":
                r_weapon = random.choice(["homing", "piercing", "plasma"])
                player.special_weapon = r_weapon
                player.special_weapon_timer = 1200  # 20초
            elif item.kind == "health":
                player.health = min(PLAYER_MAX_HEALTH, player.health + HEAL_AMOUNT)
            elif item.kind == "bomb":
                player.bomb_count = min(PLAYER_MAX_BOMBS, player.bomb_count + 1)
            elif item.kind == "shield":
                player.has_shield = True
            elif item.kind == "slow":
                player.slow_timer = 900  # 15초
            elif item.kind == "clone":
                player.clone_timer = 1200  # 20초

    def _check_laser_beam_player_collisions(self):
        """LaserEnemy의 회전 레이저 빔과 플레이어 충돌 검사."""
        for enemy in self.game.enemies:
            if isinstance(enemy, LaserEnemy):
                laser_line = enemy.get_laser_line()
                if laser_line:
                    for player in [self.game.p1, self.game.p2]:
                        if player.health > 0:
                            if (
                                point_to_line_distance(
                                    player.rect.center, laser_line[0], laser_line[1]
                                )
                                < 20
                            ):
                                player.health -= DAMAGE_PLAYER_LASER_BEAM
                                if random.random() < 0.1:
                                    self.game.screen_shake.trigger(
                                        intensity=3, duration=3
                                    )
                                if random.random() < 0.3:
                                    self.game.hit_sparks.append(
                                        HitSpark(
                                            player.rect.centerx,
                                            player.rect.centery,
                                            RED,
                                        )
                                    )
                                if (
                                    self.game.p1.health <= 0
                                    and self.game.p2.health <= 0
                                ):
                                    self.game.game_over = True
