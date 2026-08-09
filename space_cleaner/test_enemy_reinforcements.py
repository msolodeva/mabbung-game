import unittest

from constants import BOSS_CARRIER_DRONE_COUNT, SPLIT_ENEMY_CHILD_COUNT
from enemies import BossCarrier, SplitEnemy


class EnemyReinforcementBalanceTest(unittest.TestCase):
    def test_split_enemy_creates_reduced_child_count(self):
        enemy = SplitEnemy(difficulty=1.0)

        children = enemy.on_death()

        self.assertEqual(len(children), SPLIT_ENEMY_CHILD_COUNT)
        self.assertEqual(SPLIT_ENEMY_CHILD_COUNT, 2)

    def test_boss_carrier_summons_reduced_drone_count(self):
        enemy = BossCarrier(difficulty=1.0)
        enemy.state = "fighting"
        enemy.phase = 2

        enemy.update([], players=[])

        self.assertEqual(len(enemy.get_pending_drones()), BOSS_CARRIER_DRONE_COUNT)
        self.assertEqual(BOSS_CARRIER_DRONE_COUNT, 2)


if __name__ == "__main__":
    unittest.main()
