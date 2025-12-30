import pygame
import random
import sys

# --- 전역 설정 및 상수 ---
WIDTH, HEIGHT = 800, 600
FPS = 60

# 색상 정의 (RGB)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 50, 50)
BLUE = (50, 50, 255)
YELLOW = (255, 255, 0)


class Player:
    def __init__(self, x, y, color, controls):
        self.rect = pygame.Rect(x, y, 40, 40)
        self.color = color
        self.controls = controls
        self.speed = 5
        self.score = 0

    def handle_input(self, keys):
        # [교육 주석] 좌표계 설명:
        # Pygame에서 (0,0)은 왼쪽 상단입니다.
        # X축은 오른쪽으로 갈수록 증가(+), Y축은 아래로 갈수록 증가(+)합니다.
        # Updating X/Y position simulates movement in the space.
        if keys[self.controls["left"]] and self.rect.left > 0:
            self.rect.x -= self.speed
        if keys[self.controls["right"]] and self.rect.right < WIDTH:
            self.rect.x += self.speed
        if (
            keys[self.controls["up"]] and self.rect.top > HEIGHT * 0.7
        ):  # Restrict movement to bottom 30%
            self.rect.y -= self.speed
        if keys[self.controls["down"]] and self.rect.bottom < HEIGHT:
            self.rect.y += self.speed

    def draw(self, surface):
        # [교육 주석] 단순한 삼각형에서 좀 더 세련된 함선 디자인으로 변경
        # 함선의 본체, 날개, 조종석을 각각 그려서 입체감을 줍니다.

        # 중심 본체
        body_rect = pygame.Rect(self.rect.centerx - 8, self.rect.top + 10, 16, 30)
        pygame.draw.rect(surface, self.color, body_rect)

        # 머리 부분 (삼각형)
        head_points = [
            (self.rect.centerx, self.rect.top),
            (self.rect.centerx - 8, self.rect.top + 10),
            (self.rect.centerx + 8, self.rect.top + 10),
        ]
        pygame.draw.polygon(surface, self.color, head_points)

        # 왼쪽 날개
        left_wing = [
            (self.rect.centerx - 8, self.rect.top + 15),
            (self.rect.left, self.rect.bottom),
            (self.rect.centerx - 8, self.rect.bottom - 5),
        ]
        pygame.draw.polygon(surface, self.color, left_wing)

        # 오른쪽 날개
        right_wing = [
            (self.rect.centerx + 8, self.rect.top + 15),
            (self.rect.right, self.rect.bottom),
            (self.rect.centerx + 8, self.rect.bottom - 5),
        ]
        pygame.draw.polygon(surface, self.color, right_wing)

        # 조종석 (포인트)
        pygame.draw.circle(surface, WHITE, (self.rect.centerx, self.rect.top + 18), 4)


class Laser:
    def __init__(self, x, y, color):
        self.rect = pygame.Rect(x - 2, y, 4, 15)
        self.color = color
        self.speed = -10  # Moving UP means decreasing Y value

    def update(self):
        # [교육 주석] Updating Y position to simulate laser firing upwards.
        self.rect.y += self.speed

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, self.rect)


class Junk:
    def __init__(self):
        self.size = random.randint(20, 40)
        self.x = random.randint(0, WIDTH - self.size)
        self.y = -self.size  # Start above the screen
        self.rect = pygame.Rect(self.x, self.y, self.size, self.size)
        self.color = random.choice([RED, BLUE])
        self.speed = random.uniform(2, 5)

    def update(self):
        # [교육 주석] Updating Y position to simulate gravity/falling debris.
        self.rect.y += self.speed

    def draw(self, surface):
        # Junk drawn as a circle
        pygame.draw.circle(surface, self.color, self.rect.center, self.size // 2)


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Space Cleaner")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 24)
        self.large_font = pygame.font.SysFont("Arial", 64)

        self.reset_game()

    def reset_game(self):
        # Reset players, junk, and scores
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
            },
        )
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
            },
        )

        self.lasers = []
        self.junks = []
        self.stars = [
            (random.randint(0, WIDTH), random.randint(0, HEIGHT)) for _ in range(100)
        ]
        self.game_over = False
        self.spawn_timer = 0

    def spawn_junk(self):
        self.spawn_timer += 1
        if self.spawn_timer > 40:  # Delay between spawns
            self.junks.append(Junk())
            self.spawn_timer = 0

    def check_collisions(self):
        # [교육 주석] Collision Logic 상세 설명:
        # Check distance and overlap between geometric shapes.
        # pygame.Rect.colliderect is a built-in AABB collision detection.

        # 1. Lasers hitting Junk
        for laser in self.lasers[:]:
            for junk in self.junks[:]:
                if laser.rect.colliderect(junk.rect):
                    # Educational Conditional Check:
                    if laser.color == junk.color:
                        # Success: Matching color
                        if laser.color == RED:
                            self.p1.score += 10
                        else:
                            self.p2.score += 10
                    else:
                        # Penalty: Wrong color
                        if laser.color == RED:
                            self.p1.score -= 5
                        else:
                            self.p2.score -= 5

                    if junk in self.junks:
                        self.junks.remove(junk)
                    if laser in self.lasers:
                        self.lasers.remove(laser)
                    break

        # 2. Ships colliding with any Junk (Game Over)
        for junk in self.junks:
            if self.p1.rect.colliderect(junk.rect) or self.p2.rect.colliderect(
                junk.rect
            ):
                self.game_over = True

    def run(self):
        while True:
            self.handle_events()
            if not self.game_over:
                self.update()
            self.draw()
            self.clock.tick(FPS)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if self.game_over and event.key == pygame.K_r:
                    self.reset_game()
                if not self.game_over:
                    if event.key == self.p1.controls["fire"]:
                        self.lasers.append(
                            Laser(self.p1.rect.centerx, self.p1.rect.top, RED)
                        )
                    if event.key == self.p2.controls["fire"]:
                        self.lasers.append(
                            Laser(self.p2.rect.centerx, self.p2.rect.top, BLUE)
                        )

    def update(self):
        # Keyboard polling for movement
        keys = pygame.key.get_pressed()
        self.p1.handle_input(keys)
        self.p2.handle_input(keys)

        # Update all laser positions
        for laser in self.lasers[:]:
            laser.update()
            if laser.rect.bottom < 0:  # Cleanup
                self.lasers.remove(laser)

        # Update all junk positions
        for junk in self.junks[:]:
            junk.update()
            if junk.rect.top > HEIGHT:  # Cleanup
                self.junks.remove(junk)

        self.spawn_junk()
        self.check_collisions()

    def draw(self):
        # Render sequence
        self.screen.fill(BLACK)  # Clear screen

        # Simple stars background
        for star in self.stars:
            pygame.draw.circle(self.screen, WHITE, star, 1)

        if not self.game_over:
            # Draw game entities
            self.p1.draw(self.screen)
            self.p2.draw(self.screen)
            for laser in self.lasers:
                laser.draw(self.screen)
            for junk in self.junks:
                junk.draw(self.screen)

            # Draw HUD
            p1_score_txt = self.font.render(f"P1 (RED): {self.p1.score}", True, RED)
            p2_score_txt = self.font.render(f"P2 (BLUE): {self.p2.score}", True, BLUE)
            self.screen.blit(p1_score_txt, (20, 20))
            self.screen.blit(p2_score_txt, (WIDTH - 180, 20))
        else:
            # Game Over display
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
