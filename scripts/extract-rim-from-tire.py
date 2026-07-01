"""Extract a rim-only side-view asset from the full tire side-view PNG."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TIRE_SRC = ROOT / 'public/images/tires/tire-flat-side-view.png'
RIM_OUT = ROOT / 'public/images/tires/wheel-rim-side-view.png'

# 275/70R18 — matches EDUCATIONAL_CONTENT.diameterVsWheel example
WHEEL_DIAMETER_IN = 18
OVERALL_DIAMETER_IN = 33.161
# Slight overscan keeps the full visible rim lip without outer tread
RIM_RADIUS_SCALE = 1.08


def main() -> None:
    im = Image.open(TIRE_SRC).convert('RGBA')
    w, h = im.size
    px = im.load()
    cx, cy = w / 2, h / 2

    max_r = 0.0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 20:
                max_r = max(max_r, math.hypot(x - cx, y - cy))

    rim_r = int(max_r * (WHEEL_DIAMETER_IN / OVERALL_DIAMETER_IN) * RIM_RADIUS_SCALE)
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((cx - rim_r, cy - rim_r, cx + rim_r, cy + rim_r), fill=255)

    rim = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    rim.paste(im, (0, 0), mask)
    bbox = rim.getbbox()
    if not bbox:
        raise SystemExit('No rim pixels extracted')

    cropped = rim.crop(bbox)
    side = max(cropped.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    square.save(RIM_OUT)
    print('saved', RIM_OUT, square.size)


if __name__ == '__main__':
    main()
