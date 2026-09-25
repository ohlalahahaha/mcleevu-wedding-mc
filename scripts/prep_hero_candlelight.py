#!/usr/bin/env python3
"""hero now.PNG -> production hero plate for mcleevusydney.com (Golden Treatment).
Identity-preserving: global tonal ops only, no regeneration or retouching of features."""
from PIL import Image, ImageEnhance, ImageFilter
import sys

SRC = "/Users/ps/Desktop/hero now.PNG"
OUT = "/Users/ps/Codex_Local_Work/mcleevu-wedding-mc/deploy-candle/media/lee-vu-hero-candlelight.jpg"

im = Image.open(SRC).convert("RGB")
w, h = im.size

# Master for 1920-wide screens without CSS upscale: 1.25x Lanczos
target_w = 1720
im = im.resize((target_w, round(h * target_w / w)), Image.LANCZOS)

# Gentle clarity: wide-radius unsharp (local contrast), then fine output sharpen
im = im.filter(ImageFilter.UnsharpMask(radius=9, percent=9, threshold=4))
im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=42, threshold=2))

# Settle toward the site's navy ink in the deepest shadows only (tone curve on a scale)
def shadow_navy(r, g, b):
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    t = max(0.0, 1.0 - lum / 56.0)  # only shadows below lum 56
    t = t * t
    b2 = b + 6 * t
    r2 = r - 2 * t
    return min(255, round(r2)), g, min(255, round(b2))

px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b = px[x, y]
        nr, ng, nb = shadow_navy(r, g, b)
        if (nr, ng, nb) != (r, g, b):
            px[x, y] = (nr, ng, nb)

# Restrained global warmth (candle gold lean, ~1.5%), face-safe
r_, g_, b_ = im.split()
r2 = r_.point(lambda v: min(255, round(v * 1.018)))
b2 = b_.point(lambda v: round(v * 0.985))
warm = Image.merge("RGB", (r2, g_, b2))
im = Image.blend(im, warm, 0.5)

im = ImageEnhance.Color(im).enhance(1.03)

im.save(OUT, "JPEG", quality=83, progressive=True, optimize=True)
import os, hashlib
print("saved", OUT, im.size, os.path.getsize(OUT), "bytes")
print("sha256", hashlib.sha256(open(OUT, "rb").read()).hexdigest()[:16])
