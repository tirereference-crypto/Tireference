from PIL import Image
from collections import deque

PATH = 'public/images/tires/tire-flat-side-view.png'
CARD_BG = (250, 249, 255)


def is_removable_bg(p):
    r, g, b = p[:3]
    a = p[3] if len(p) == 4 else 255
    if a == 0:
        return True
    # Baked card tint from prior flatten step
    if abs(r - CARD_BG[0]) <= 10 and abs(g - CARD_BG[1]) <= 10 and abs(b - CARD_BG[2]) <= 10:
        return True
    mx, mn = max(r, g, b), min(r, g, b)
    # Residual checker / studio backdrop
    return mn >= 140 and (mx - mn) <= 50


def clear_region(px, w, h, visited, start_x, start_y):
    region = []
    dq = deque([(start_x, start_y)])
    visited[start_y * w + start_x] = 1
    while dq:
        cx, cy = dq.popleft()
        region.append((cx, cy))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not visited[i] and is_removable_bg(px[nx, ny]):
                    visited[i] = 1
                    dq.append((nx, ny))
    return region


im = Image.open(PATH).convert('RGBA')
w, h = im.size
px = im.load()
visited = bytearray(w * h)

for x in range(w):
    for y in (0, h - 1):
        if not visited[y * w + x] and is_removable_bg(px[x, y]):
            for cx, cy in clear_region(px, w, h, visited, x, y):
                px[cx, cy] = (0, 0, 0, 0)

for y in range(h):
    for x in (0, w - 1):
        if not visited[y * w + x] and is_removable_bg(px[x, y]):
            for cx, cy in clear_region(px, w, h, visited, x, y):
                px[cx, cy] = (0, 0, 0, 0)

AREA_THRESHOLD = 200
for y in range(h):
    for x in range(w):
        if not visited[y * w + x] and is_removable_bg(px[x, y]):
            region = clear_region(px, w, h, visited, x, y)
            if len(region) >= AREA_THRESHOLD:
                for cx, cy in region:
                    px[cx, cy] = (0, 0, 0, 0)

bbox = im.getbbox()
if not bbox:
    raise SystemExit('No opaque pixels left in tire image')

im = im.crop(bbox)
im.save(PATH)
print('saved transparent', PATH, 'size', im.size, 'mode', im.mode, 'corner', im.load()[0, 0])
