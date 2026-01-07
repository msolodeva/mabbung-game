import pygame
import math


def point_to_line_distance(point, line_start, line_end):
    """
    Calculate the shortest distance between a point and a line segment.

    Args:
        point (tuple): (x, y) coordinates of the point.
        line_start (tuple): (x, y) coordinates of the line start.
        line_end (tuple): (x, y) coordinates of the line end.

    Returns:
        float: The distance.
    """
    px, py = point
    x1, y1 = line_start
    x2, y2 = line_end

    line_len_sq = (x2 - x1) ** 2 + (y2 - y1) ** 2
    if line_len_sq == 0:
        return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5

    t = max(0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / line_len_sq))

    closest_x = x1 + t * (x2 - x1)
    closest_y = y1 + t * (y2 - y1)

    return ((px - closest_x) ** 2 + (py - closest_y) ** 2) ** 0.5


class ScreenShake:
    """
    Handles screen shake effects by generating random offsets.
    """

    def __init__(self):
        self.offset_x = 0
        self.offset_y = 0
        self.intensity = 0
        self.duration = 0

    def trigger(self, intensity=10, duration=10):
        self.intensity = intensity
        self.duration = duration

    def update(self):
        if self.duration > 0:
            self.duration -= 1
            intensity_int = int(self.intensity)
            if intensity_int > 0:
                self.offset_x = (
                    int((pygame.time.get_ticks() % 10) / 5 * intensity_int)
                    - intensity_int // 2
                )  # Deterministic pseudo-random for stability or just random
                # Actually random is better for shake
                import random

                self.offset_x = random.randint(-intensity_int, intensity_int)
                self.offset_y = random.randint(-intensity_int, intensity_int)

            self.intensity = max(0, self.intensity - 0.5)
        else:
            self.offset_x = 0
            self.offset_y = 0
            self.intensity = 0
