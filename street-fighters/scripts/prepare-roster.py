"""Isolate 16 alpha silhouettes and repack with padding, without changing pose scale.
Usage: python scripts/prepare-roster.py source.png destination.png
Requires Pillow. Source is a generated 4x4 atlas with actual alpha transparency.
"""
from collections import deque
from pathlib import Path
import sys
from PIL import Image, ImageFilter

source = Image.open(sys.argv[1]).convert('RGBA')
w, h = source.size
alpha = source.getchannel('A')
mask = bytearray(1 if value >= 60 else 0 for value in alpha.tobytes())
parts = []
for start in range(w * h):
    if not mask[start]:
        continue
    queue = deque([start])
    mask[start] = 0
    pixels = []
    while queue:
        p = queue.popleft()
        pixels.append(p)
        x = p % w
        for n in (p - 1 if x else -1, p + 1 if x < w - 1 else -1, p - w, p + w):
            if 0 <= n < w * h and mask[n]:
                mask[n] = 0
                queue.append(n)
    if len(pixels) > 2000:
        xs = [p % w for p in pixels]
        ys = [p // w for p in pixels]
        parts.append((min(xs), min(ys), max(xs), max(ys), pixels))
if len(parts) != 16:
    raise ValueError(f'Expected 16 silhouettes, found {len(parts)}')
parts.sort(key=lambda p: (((p[1] + p[3]) / 2) // (h / 4), p[0]))
result = Image.new('RGBA', (1792, 1280))
for i, (x1, y1, x2, y2, pixels) in enumerate(parts):
    bounds = (max(0, x1 - 2), max(0, y1 - 2), min(w, x2 + 3), min(h, y2 + 3))
    cutout = source.crop(bounds)
    silhouette = Image.new('L', cutout.size)
    for p in pixels:
        silhouette.putpixel((p % w - bounds[0], p // w - bounds[1]), 255)
    # Keep source edge antialiasing; exclude neighboring poses that cross grid lines.
    silhouette = silhouette.filter(ImageFilter.MaxFilter(5))
    original_alpha = cutout.getchannel('A')
    original_alpha.paste(0, mask=silhouette.point(lambda v: 255-v))
    cutout.putalpha(original_alpha)
    x = i % 4 * 448 + 224 - round(i % 4 * w / 4 + w / 8 - bounds[0])
    y = i // 4 * 320 + 308 - cutout.height
    if x < i % 4 * 448 or x + cutout.width > (i % 4 + 1) * 448 or cutout.height > 308:
        raise ValueError(f'Pose {i} exceeds output cell')
    result.paste(cutout, (x, y))
Path(sys.argv[2]).parent.mkdir(parents=True, exist_ok=True)
result.save(sys.argv[2])
print(f'{sys.argv[2]}: 16 isolated poses, {result.width}x{result.height}')
