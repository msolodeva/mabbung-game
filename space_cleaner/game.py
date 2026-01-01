# game.py
# 메인 게임 로직 및 실행

import pygame
import random
import sys

from constants import (
    WIDTH,
    HEIGHT,
    FPS,
    BLACK,
    WHITE,
    RED,
    BLUE,
    YELLOW,
    GREY,
    PURPLE,
    GREEN,
    ORANGE,
)
from sound import generate_sound
from background import BackgroundManager
from entities import Player, Laser, Item, Explosion
from enemies import Enemy, HeavyEnemy
from junk import Junk


class Game:
    """
    메인 게임 클래스.
    - 게임 루프 (이벤트 처리, 업데이트, 렌더링)
    - 엔티티 관리 (플레이어, 적, 레이저 등)
    - 충돌 검사 및 점수/체력 관리
    """

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Space Cleaner")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 24)
        self.large_font = pygame.font.SysFont("Arial", 64)

        # 사운드 초기화
        self._init_sounds()

        self.reset_game()

    def _init_sounds(self):
        """사운드 효과 생성."""
        try:
            pygame.mixer.init()
            self.snd_shoot = generate_sound("square", 600, 0.1, 0.3)
            self.snd_explosion = generate_sound("noise", 0, 0.2, 0.5)
            self.snd_powerup = generate_sound("square", 400, 0.3, 0.4)
        except Exception as e:
            print(f"Sound Init Error: {e}")
            self.snd_shoot = None
            self.snd_explosion = None
            self.snd_powerup = None

    def reset_game(self):
        """게임 상태 초기화."""
        self.start_ticks = pygame.time.get_ticks()

        # 플레이어 1 (WASD + LSHIFT)
        self.p1 = Player(
            WIDTH // 4,
            HEIGHT - 60,
            RED,
            {
                "left": pygame.K_a,
                "right": pygame.K_d,
                "up": pygame.K_w,
                "down": pygame.K_s,
                "fire": pygame.K_LSHIFT,
                "bomb": pygame.K_SPACE,
            },
        )

        # 플레이어 2 (방향키 + RSHIFT)
        self.p2 = Player(
            3 * WIDTH // 4,
            HEIGHT - 60,
            BLUE,
            {
                "left": pygame.K_LEFT,
                "right": pygame.K_RIGHT,
                "up": pygame.K_UP,
                "down": pygame.K_DOWN,
                "fire": pygame.K_RSHIFT,
                "bomb": pygame.K_RETURN,
            },
        )

        self.lasers = []
        self.junks = []
        self.enemies = []
        self.enemy_bullets = []
        self.items = []
        self.explosions = []
        self.bg_manager = BackgroundManager()
        self.game_over = False
        self.spawn_timer = 0

    # ---------------------------
    # 스폰 로직
    # ---------------------------

    def spawn_junk(self):
        """적, 아이템, 쓰레기 스폰."""
        # 난이도 계산: 60초마다 난이도 1.0 증가 (기존 45초에서 늦춤)
        elapsed_seconds = (pygame.time.get_ticks() - self.start_ticks) / 1000
        difficulty = 1.0 + (elapsed_seconds / 60.0)

        # 난이도가 오를수록 스폰 주기 빨라짐 (더 완만하게 조정)
        spawn_threshold = max(20, 45 - int((difficulty - 1) * 8))

        self.spawn_timer += 1
        if self.spawn_timer > spawn_threshold:
            r = random.random()

            # 난이도가 오를수록 적 생성 확률 증가 (더 완만하게 조정)
            enemy_prob = min(0.35, 0.12 + (difficulty - 1) * 0.05)

            if r < enemy_prob:
                # HeavyEnemy 발생 빈도 감소 및 등장 시점 조절
                # 한번에 최대 1개만 출현하도록 제한 추가
                has_heavy = any(isinstance(e, HeavyEnemy) for e in self.enemies)
                if difficulty > 1.2 and not has_heavy and random.random() < 0.05:
                    self.enemies.append(HeavyEnemy(difficulty))
                else:
                    self.enemies.append(Enemy(difficulty))
            elif r < enemy_prob + 0.02:
                self.items.append(Item())
            else:
                self.junks.append(Junk(difficulty))
            self.spawn_timer = 0

    # ---------------------------
    # 충돌 검사
    # ---------------------------

    def check_collisions(self):
        """모든 충돌 검사 수행."""
        self._check_laser_junk_collisions()
        self._check_player_junk_collisions()
        self._check_laser_enemy_collisions()
        self._check_enemy_bullet_player_collisions()
        self._check_enemy_player_collisions()
        self._check_item_collisions()

    def _check_laser_junk_collisions(self):
        """레이저-쓰레기 충돌: 색상 매칭 시 점수 획득."""
        for laser in self.lasers[:]:
            for junk in self.junks[:]:
                if laser.rect.colliderect(junk.rect):
                    if laser.color == junk.color:
                        # 색상 매칭 성공
                        if laser.color == RED:
                            self.p1.score += 10
                        else:
                            self.p2.score += 10
                        self.explosions.append(
                            Explosion(junk.rect.centerx, junk.rect.centery, YELLOW)
                        )
                        if self.snd_explosion:
                            self.snd_explosion.play()
                    else:
                        # 색상 불일치 (페널티)
                        if laser.color == RED:
                            self.p1.score -= 5
                        else:
                            self.p2.score -= 5
                        self.explosions.append(
                            Explosion(junk.rect.centerx, junk.rect.centery, GREY)
                        )

                    if junk in self.junks:
                        self.junks.remove(junk)
                    if laser in self.lasers:
                        self.lasers.remove(laser)
                    break

    def _check_player_junk_collisions(self):
        """플레이어-쓰레기 충돌: 체력 감소."""
        for junk in self.junks[:]:
            hit_p1 = self.p1.rect.colliderect(junk.rect)
            hit_p2 = self.p2.rect.colliderect(junk.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    self.p1.health -= 15
                if hit_p2:
                    self.p2.health -= 15

                if junk in self.junks:
                    self.junks.remove(junk)

                if self.p1.health <= 0 or self.p2.health <= 0:
                    self.game_over = True

    def _check_laser_enemy_collisions(self):
        """레이저-적 충돌: 점수 획득 및 폭발."""
        for laser in self.lasers[:]:
            for enemy in self.enemies[:]:
                if laser.rect.colliderect(enemy.rect):
                    if enemy in self.enemies:
                        # HeavyEnemy는 체력 시스템 사용
                        if hasattr(enemy, "health"):
                            enemy.health -= 10
                            self.explosions.append(
                                Explosion(
                                    laser.rect.centerx, laser.rect.centery, ORANGE
                                )
                            )
                            if enemy.health <= 0:
                                self.enemies.remove(enemy)
                                # 대형 폭발
                                for _ in range(5):
                                    self.explosions.append(
                                        Explosion(
                                            enemy.rect.centerx
                                            + random.randint(-20, 20),
                                            enemy.rect.centery
                                            + random.randint(-20, 20),
                                            RED,
                                        )
                                    )
                                if self.snd_explosion:
                                    self.snd_explosion.play()
                                if laser.color == RED:
                                    self.p1.score += 100
                                else:
                                    self.p2.score += 100
                        else:
                            # 일반 적 (원샷)
                            self.enemies.remove(enemy)
                            self.explosions.append(
                                Explosion(
                                    enemy.rect.centerx, enemy.rect.centery, PURPLE
                                )
                            )
                            self.explosions.append(
                                Explosion(enemy.rect.centerx, enemy.rect.centery, GREEN)
                            )
                            if self.snd_explosion:
                                self.snd_explosion.play()
                            if laser.color == RED:
                                self.p1.score += 20
                            else:
                                self.p2.score += 20

                    if laser in self.lasers:
                        self.lasers.remove(laser)
                    break

    def _check_enemy_bullet_player_collisions(self):
        """적 총알-플레이어 충돌: 체력 감소."""
        for bullet in self.enemy_bullets[:]:
            hit_p1 = self.p1.rect.colliderect(bullet.rect)
            hit_p2 = self.p2.rect.colliderect(bullet.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    self.p1.health -= 10
                if hit_p2:
                    self.p2.health -= 10

                if bullet in self.enemy_bullets:
                    self.enemy_bullets.remove(bullet)

                if self.p1.health <= 0 or self.p2.health <= 0:
                    self.game_over = True

    def _check_enemy_player_collisions(self):
        """적 기체-플레이어 충돌: 체력 대폭 감소."""
        for enemy in self.enemies[:]:
            hit_p1 = self.p1.rect.colliderect(enemy.rect)
            hit_p2 = self.p2.rect.colliderect(enemy.rect)

            if hit_p1 or hit_p2:
                if hit_p1:
                    self.p1.health -= 20
                if hit_p2:
                    self.p2.health -= 20

                if enemy in self.enemies:
                    self.enemies.remove(enemy)

                if self.p1.health <= 0 or self.p2.health <= 0:
                    self.game_over = True

    def _check_item_collisions(self):
        """아이템 수집: 무기 강화 또는 체력 회복."""
        for item in self.items[:]:
            if self.p1.rect.colliderect(item.rect):
                if item in self.items:
                    self.items.remove(item)
                    if self.snd_powerup:
                        self.snd_powerup.play()
                    self.explosions.append(
                        Explosion(item.rect.centerx, item.rect.centery, item.color)
                    )

                    if item.kind == "weapon":
                        self.p1.weapon_level = min(3, self.p1.weapon_level + 1)
                        self.p1.weapon_timer = 1800  # 30초 (60FPS 기준)
                    elif item.kind == "health":
                        self.p1.health = min(self.p1.max_health, self.p1.health + 30)
                    elif item.kind == "bomb":
                        self.p1.bomb_count = min(
                            self.p1.max_bombs, self.p1.bomb_count + 1
                        )

            elif self.p2.rect.colliderect(item.rect):
                if item in self.items:
                    self.items.remove(item)
                    if self.snd_powerup:
                        self.snd_powerup.play()
                    self.explosions.append(
                        Explosion(item.rect.centerx, item.rect.centery, item.color)
                    )

                    if item.kind == "weapon":
                        self.p2.weapon_level = min(3, self.p2.weapon_level + 1)
                        self.p2.weapon_timer = 1800  # 30초
                    elif item.kind == "health":
                        self.p2.health = min(self.p2.max_health, self.p2.health + 30)
                    elif item.kind == "bomb":
                        self.p2.bomb_count = min(
                            self.p2.max_bombs, self.p2.bomb_count + 1
                        )

    def _draw_hud_bar(self, x, y, width, height, ratio, color):
        """HUD용 반투명 막대 그리기."""
        # 배경 (반투명 어두운 회색)
        bg_surf = pygame.Surface((width, height), pygame.SRCALPHA)
        bg_surf.fill((50, 50, 50, 100))
        self.screen.blit(bg_surf, (x, y))

        # 채우기 (반투명 색상)
        fill_width = int(width * max(0, min(1, ratio)))
        if fill_width > 0:
            fill_surf = pygame.Surface((fill_width, height), pygame.SRCALPHA)
            fill_surf.fill((*color, 150))
            self.screen.blit(fill_surf, (x, y))

        # 테두리 (반투명 흰색)
        border_surf = pygame.Surface((width, height), pygame.SRCALPHA)
        pygame.draw.rect(border_surf, (255, 255, 255, 80), (0, 0, width, height), 1)
        self.screen.blit(border_surf, (x, y))

    def run(self):
        """메인 게임 루프."""
        while True:
            self.handle_events()
            if not self.game_over:
                self.update()
            self.draw()
            self.clock.tick(FPS)

    def handle_events(self):
        """이벤트 처리."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if self.game_over and event.key == pygame.K_r:
                    self.reset_game()
                if not self.game_over:
                    if event.key == self.p1.controls["fire"]:
                        self._fire_weapon(self.p1)
                    if event.key == self.p2.controls["fire"]:
                        self._fire_weapon(self.p2)

                    # 폭탄 사용
                    if event.key == self.p1.controls["bomb"]:
                        self._use_bomb(self.p1)
                    if event.key == self.p2.controls["bomb"]:
                        self._use_bomb(self.p2)

    def _use_bomb(self, player):
        """폭탄 사용: 적 총알 제거, 장애물 파괴, 적에게 데미지."""
        if player.bomb_count > 0:
            player.bomb_count -= 1
            if self.snd_explosion:
                self.snd_explosion.play()

            # 화면 전체 섬광 효과 (단순 폭발에서 더 화려하게)
            # 폭발을 시간차를 두고 여러 개 생성하거나, 랜덤 위치에 대량 생성
            for _ in range(50):  # 20개 -> 50개로 증가
                self.explosions.append(
                    Explosion(
                        random.randint(0, WIDTH),
                        random.randint(0, HEIGHT),
                        random.choice([ORANGE, RED, WHITE, YELLOW]),  # 색상 다양화
                    )
                )

            # 적 총알 모두 제거
            self.enemy_bullets.clear()

            # 쓰레기(Junk) 모두 제거
            for junk in self.junks:
                self.explosions.append(
                    Explosion(junk.rect.centerx, junk.rect.centery, GREY)
                )
            self.junks.clear()

            # 적에게 데미지 (일반 적 즉사, HeavyEnemy 50 데미지)
            for enemy in self.enemies[:]:
                if hasattr(enemy, "health"):
                    enemy.health -= 50
                    self.explosions.append(
                        Explosion(enemy.rect.centerx, enemy.rect.centery, ORANGE)
                    )
                    if enemy.health <= 0:
                        self.enemies.remove(enemy)
                        # 대형 폭발 추가
                        for _ in range(10):  # 5개 -> 10개로 증가
                            self.explosions.append(
                                Explosion(
                                    enemy.rect.centerx + random.randint(-40, 40),
                                    enemy.rect.centery + random.randint(-40, 40),
                                    RED,
                                )
                            )
                else:
                    self.enemies.remove(enemy)
                    self.explosions.append(
                        Explosion(enemy.rect.centerx, enemy.rect.centery, PURPLE)
                    )

    def _fire_weapon(self, player):
        """무기 레벨에 따른 레이저 발사."""
        px = player.rect.centerx
        py = player.rect.top
        color = player.color

        if player.weapon_level == 1:
            self.lasers.append(Laser(px, py, color))
        elif player.weapon_level == 2:
            self.lasers.append(Laser(px - 10, py, color))
            self.lasers.append(Laser(px + 10, py, color))
        elif player.weapon_level >= 3:
            self.lasers.append(Laser(px - 15, py + 5, color))
            self.lasers.append(Laser(px, py, color))
            self.lasers.append(Laser(px + 15, py + 5, color))

        if self.snd_shoot:
            self.snd_shoot.play()

    def update(self):
        """게임 상태 업데이트."""
        # 배경 업데이트
        self.bg_manager.update()

        # 플레이어 업데이트 (타이머)
        self.p1.update()
        self.p2.update()

        # 플레이어 입력
        keys = pygame.key.get_pressed()
        self.p1.handle_input(keys)
        self.p2.handle_input(keys)

        # 레이저 업데이트
        for laser in self.lasers[:]:
            laser.update()
            if laser.rect.bottom < 0:
                self.lasers.remove(laser)

        # 쓰레기 업데이트
        for junk in self.junks[:]:
            junk.update()
            if junk.rect.top > HEIGHT:
                self.junks.remove(junk)

        # 적 업데이트
        for enemy in self.enemies[:]:
            enemy.update(self.enemy_bullets)
            if enemy.rect.top > HEIGHT:
                self.enemies.remove(enemy)

        # 적 총알 업데이트
        for bullet in self.enemy_bullets[:]:
            bullet.update()
            if bullet.rect.top > HEIGHT:
                self.enemy_bullets.remove(bullet)

        # 아이템 업데이트
        for item in self.items[:]:
            item.update()
            if item.rect.top > HEIGHT:
                self.items.remove(item)

        # 폭발 업데이트
        for exp in self.explosions[:]:
            exp.update()
            if exp.timer > 60:  # 20 -> 60으로 증가 (잔상이 다 사라질 때까지 대기)
                self.explosions.remove(exp)

        # 스폰 및 충돌 검사
        self.spawn_junk()
        self.check_collisions()

    def draw(self):
        """화면 렌더링."""
        self.screen.fill(BLACK)

        # 배경
        self.bg_manager.draw(self.screen)

        if not self.game_over:
            # 게임 엔티티
            self.p1.draw(self.screen)
            self.p2.draw(self.screen)
            for laser in self.lasers:
                laser.draw(self.screen)
            for junk in self.junks:
                junk.draw(self.screen)
            for enemy in self.enemies:
                enemy.draw(self.screen)
            for bullet in self.enemy_bullets:
                bullet.draw(self.screen)
            for item in self.items:
                item.draw(self.screen)
            for exp in self.explosions:
                exp.draw(self.screen)

            # HUD
            p1_score_txt = self.font.render(f"P1 (RED): {self.p1.score}", True, RED)
            p2_score_txt = self.font.render(f"P2 (BLUE): {self.p2.score}", True, BLUE)
            self.screen.blit(p1_score_txt, (20, 20))
            self.screen.blit(p2_score_txt, (WIDTH - 180, 20))

            # 폭탄 개수 표시
            p1_bomb_txt = self.font.render(f"Bomb: {self.p1.bomb_count}", True, ORANGE)
            p2_bomb_txt = self.font.render(f"Bomb: {self.p2.bomb_count}", True, ORANGE)
            self.screen.blit(p1_bomb_txt, (20, 50))
            self.screen.blit(p2_bomb_txt, (WIDTH - 180, 50))

            # 체력바 표시 (HUD) - 작고 반투명하게 변경
            self._draw_hud_bar(
                20, 80, 120, 10, self.p1.health / self.p1.max_health, GREEN
            )
            self._draw_hud_bar(
                WIDTH - 180,
                80,
                120,
                10,
                self.p2.health / self.p2.max_health,
                GREEN,
            )
        else:
            # 게임 오버 화면
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            self.screen.blit(overlay, (0, 0))

            go_txt = self.large_font.render("GAME OVER", True, YELLOW)
            sco_txt = self.font.render(
                f"P1 Total: {self.p1.score} | P2 Total: {self.p2.score}", True, WHITE
            )
            res_txt = self.font.render("Press 'R' to Restart", True, WHITE)

            self.screen.blit(
                go_txt, (WIDTH // 2 - go_txt.get_width() // 2, HEIGHT // 2 - 100)
            )
            self.screen.blit(
                sco_txt, (WIDTH // 2 - sco_txt.get_width() // 2, HEIGHT // 2)
            )
            self.screen.blit(
                res_txt, (WIDTH // 2 - res_txt.get_width() // 2, HEIGHT // 2 + 50)
            )

        pygame.display.flip()


if __name__ == "__main__":
    game = Game()
    game.run()
