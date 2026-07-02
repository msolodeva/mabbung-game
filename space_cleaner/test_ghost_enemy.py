import unittest

from constants import GHOST_PHASE_DURATION
from enemies import GhostEnemy


class GhostEnemyTest(unittest.TestCase):
    def test_materializing_ghost_surges_and_fires_two_bullets(self):
        enemy = GhostEnemy(difficulty=1.0)
        enemy.timer = GHOST_PHASE_DURATION - 1
        enemy.is_ghost = True
        y_before = enemy.rect.y
        bullets = []

        enemy.update(bullets)

        self.assertFalse(enemy.is_ghost)
        self.assertEqual(enemy.rect.y - y_before, int(enemy.speed_y + 3))
        self.assertEqual(len(bullets), 2)
        self.assertEqual([bullet.vx for bullet in bullets], [-2, 2])
        self.assertEqual([bullet.vy for bullet in bullets], [8, 8])


if __name__ == "__main__":
    unittest.main()
