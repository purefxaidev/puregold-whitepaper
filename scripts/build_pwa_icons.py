#!/usr/bin/env python3
"""Build PureGold PWA icons and iPhone splash images from one source file.

Swap the logo later by placing a 1024×1024 PNG at icons/source.png
(preferred) or by replacing icon.png, then run:

    python3 scripts/build_pwa_icons.py
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
SPLASH = OUT / "splash"
BG = (16, 14, 10, 255)
SOURCE_CANDIDATES = (
    OUT / "source.png",
    ROOT / "icon.png",
    ROOT / "assets" / "logo-192.png",
)
SIZES = {
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-32.png": 32,
}
SPLASHES = [
    (640, 1136),
    (750, 1334),
    (828, 1792),
    (1125, 2436),
    (1170, 2532),
    (1179, 2556),
    (1206, 2622),
    (1242, 2208),
    (1242, 2688),
    (1284, 2778),
    (1290, 2796),
    (1320, 2868),
]


def find_source() -> Path:
    for path in SOURCE_CANDIDATES:
        if path.exists():
            return path
    raise SystemExit("No logo source found. Add icons/source.png or icon.png")


def contain(src: Image.Image, size: int, bg=BG, pad: int = 0) -> Image.Image:
    out = Image.new("RGBA", (size, size), bg)
    inner = max(1, size - pad * 2)
    icon = src.copy()
    icon.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - icon.size[0]) // 2
    y = (size - icon.size[1]) // 2
    out.alpha_composite(icon, (x, y))
    return out


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"{path.relative_to(ROOT)}  {im.size}  {path.stat().st_size}B")


def font_pair(width: int):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if Path(path).exists():
            return (
                ImageFont.truetype(path, max(22, int(width * 0.045))),
                ImageFont.truetype(path, max(12, int(width * 0.022))),
            )
    return None, None


def make_splash(src: Image.Image, w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), (16, 14, 10))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        draw.line([(0, y), (w, y)], fill=(int(16 + 4 * t), int(14 + 2 * t), int(10 + t)))
    img_rgba = img.convert("RGBA")
    glow_d = int(min(w, h) * 0.62)
    glow = Image.new("RGBA", (glow_d, glow_d), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((0, 0, glow_d - 1, glow_d - 1), fill=(212, 177, 95, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=glow_d * 0.18))
    gx = (w - glow_d) // 2
    side = int(min(w, h) * 0.28)
    iy = int(h * 0.38) - side // 2
    gy = int(h * 0.38) - glow_d // 2
    img_rgba.alpha_composite(glow, (gx, gy))
    icon = contain(src, side, (0, 0, 0, 0), pad=0)
    img_rgba.alpha_composite(icon, ((w - side) // 2, iy))
    d = ImageDraw.Draw(img_rgba)
    big, small = font_pair(w)
    ty = iy + side + int(h * 0.04)
    if big:
        title, sub = "PureGold", "by PureFxAi"
        tw = d.textbbox((0, 0), title, font=big)
        d.text(((w - (tw[2] - tw[0])) // 2, ty), title, font=big, fill=(234, 215, 162, 255))
        sw = d.textbbox((0, 0), sub, font=small)
        d.text(((w - (sw[2] - sw[0])) // 2, ty + int(w * 0.055)), sub, font=small, fill=(196, 180, 138, 230))
    rgb = img_rgba.convert("RGB")
    return rgb.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)


def main() -> None:
    src_path = find_source()
    src = Image.open(src_path).convert("RGBA")
    print(f"source: {src_path} {src.size}")
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in SIZES.items():
        save_png(contain(src, size), OUT / name)
    save_png(contain(src, 512, pad=int(512 * 0.14)), OUT / "icon-512-maskable.png")
    for w, h in SPLASHES:
        save_png(make_splash(src, w, h), SPLASH / f"splash-{w}x{h}.png")


if __name__ == "__main__":
    main()
