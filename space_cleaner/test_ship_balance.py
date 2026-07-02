import unittest

from constants import SHIP_TYPES


class ShipBalanceTest(unittest.TestCase):
    def test_phantom_trades_top_speed_for_better_survivability(self):
        phantom = SHIP_TYPES["phantom"]
        speeds = {key: data["speed"] for key, data in SHIP_TYPES.items()}

        self.assertEqual(phantom["speed"], 6.3)
        self.assertEqual(phantom["health"], 105)
        self.assertEqual(phantom["bombs"], 2)
        self.assertEqual(phantom["weapon_style"], "rapid")
        self.assertEqual(phantom["speed"], max(speeds.values()))
        self.assertLess(phantom["health"], SHIP_TYPES["viper"]["health"])


if __name__ == "__main__":
    unittest.main()
