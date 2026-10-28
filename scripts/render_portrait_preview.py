import os
import json
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"d:\100. cá nhân\mobile game\logic-gate-plumber"
ARTIFACT_DIR = r"C:\Users\ACER\.gemini\antigravity\brain\f1801efe-e54a-49e2-b1b5-f6cab23473be"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def get_font(size, bold=False):
    font_candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\consolab.ttf" if bold else r"C:\Windows\Fonts\consola.ttf",
    ]
    for p in font_candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

font_title = get_font(32, bold=True)
font_h2 = get_font(22, bold=True)
font_btn = get_font(20, bold=True)
font_meta = get_font(15, bold=False)
font_mono = get_font(16, bold=True)
font_icon = get_font(44, bold=True)

def render_portrait_menu(out_path):
    w, h = 720, 1280
    im = Image.new("RGBA", (w, h), (6, 12, 24, 255))
    draw = ImageDraw.Draw(im)

    # Grid background
    for x in range(0, w, 36):
        draw.line([(x, 0), (x, h)], fill=(17, 40, 68, 90), width=1)
    for y in range(0, h, 36):
        draw.line([(0, y), (w, y)], fill=(17, 40, 68, 90), width=1)

    # Header controls
    draw.rounded_rectangle([w - 65, 20, w - 15, 54], radius=6, fill=(14, 36, 60), outline=(0, 240, 255), width=1)
    draw.text((w - 40, 37), "EN", fill=(0, 240, 255), font=font_meta, anchor="mm")

    draw.rounded_rectangle([w - 130, 20, w - 80, 54], radius=6, fill=(14, 36, 60), outline=(0, 240, 255), width=1)
    draw.text((w - 105, 37), "SND", fill=(0, 240, 255), font=font_meta, anchor="mm")

    draw.rounded_rectangle([w - 240, 20, w - 145, 54], radius=6, fill=(14, 36, 60), outline=(0, 255, 157), width=2)
    draw.text((w - 192, 37), "16:9 / 9:16", fill=(0, 255, 157), font=font_meta, anchor="mm")

    # Title & Icon
    draw.text((w // 2, 140), "[⚡]", fill=(0, 255, 157), font=font_icon, anchor="mm")
    draw.text((w // 2, 210), "LOGIC GATE PLUMBER", fill=(0, 255, 157), font=font_title, anchor="mm")
    draw.text((w // 2, 255), "HIGH-TECH DIGITAL CIRCUIT PUZZLE", fill=(0, 240, 255), font=font_meta, anchor="mm")

    # Main Action Buttons
    btn_y = 390
    draw.rounded_rectangle([w // 2 - 170, btn_y - 26, w // 2 + 170, btn_y + 26], radius=10, fill=(12, 51, 37), outline=(0, 255, 157), width=2)
    draw.text((w // 2, btn_y), "PLAY / CONTINUE", fill=(0, 255, 157), font=font_btn, anchor="mm")

    btn_y += 72
    draw.rounded_rectangle([w // 2 - 170, btn_y - 26, w // 2 + 170, btn_y + 26], radius=10, fill=(15, 33, 56), outline=(0, 210, 255), width=2)
    draw.text((w // 2, btn_y), "SELECT LEVEL", fill=(255, 255, 255), font=font_btn, anchor="mm")

    btn_y += 72
    draw.rounded_rectangle([w // 2 - 170, btn_y - 26, w // 2 + 170, btn_y + 26], radius=10, fill=(15, 33, 56), outline=(0, 210, 255), width=2)
    draw.text((w // 2, btn_y), "HOW TO PLAY", fill=(255, 255, 255), font=font_btn, anchor="mm")

    # Badges side-by-side in portrait
    by = 760
    bw, bh = 280, 210
    # Left: Gate Matrix
    lx = w // 2 - 150
    draw.rounded_rectangle([lx - bw//2, by - bh//2, lx + bw//2, by + bh//2], radius=10, fill=(12, 27, 48), outline=(0, 240, 255), width=2)
    draw.text((lx, by - 70), "GATE MATRIX", fill=(0, 240, 255), font=font_h2, anchor="mm")
    draw.text((lx, by - 30), "AND  [&]", fill=(144, 202, 249), font=font_mono, anchor="mm")
    draw.text((lx, by), "OR   [>=1]", fill=(144, 202, 249), font=font_mono, anchor="mm")
    draw.text((lx, by + 30), "NOT  [|>o]", fill=(144, 202, 249), font=font_mono, anchor="mm")
    draw.text((lx, by + 60), "XOR  [=1]", fill=(144, 202, 249), font=font_mono, anchor="mm")

    # Right: System Specs
    rx = w // 2 + 150
    draw.rounded_rectangle([rx - bw//2, by - bh//2, rx + bw//2, by + bh//2], radius=10, fill=(12, 27, 48), outline=(255, 208, 0), width=2)
    draw.text((rx, by - 70), "SYSTEM SPECS", fill=(255, 208, 0), font=font_h2, anchor="mm")
    draw.text((rx, by - 30), "5 CHAPTERS", fill=(255, 236, 179), font=font_mono, anchor="mm")
    draw.text((rx, by), "100 PUZZLES", fill=(255, 236, 179), font=font_mono, anchor="mm")
    draw.text((rx, by + 30), "ENDLESS MODE", fill=(255, 236, 179), font=font_mono, anchor="mm")
    draw.text((rx, by + 60), "PAR SCORING", fill=(255, 236, 179), font=font_mono, anchor="mm")

    # Footer
    draw.rectangle([0, h - 50, w, h], fill=(10, 22, 40))
    draw.line([(0, h - 50), (w, h - 50)], fill=(0, 240, 255), width=1)
    draw.text((w // 2, h - 25), "⚡ 100 UNIQUE LEVELS • DUAL ORIENTATION: LANDSCAPE & PORTRAIT", fill=(110, 147, 184), font=font_meta, anchor="mm")

    im.save(out_path)
    print(f"Saved portrait menu preview: {out_path}")

def render_portrait_gameplay(out_path):
    w, h = 720, 1280
    im = Image.new("RGBA", (w, h), (6, 12, 24, 255))
    draw = ImageDraw.Draw(im)

    # Grid background
    for x in range(0, w, 36):
        draw.line([(x, 0), (x, h)], fill=(17, 40, 68, 90), width=1)
    for y in range(0, h, 36):
        draw.line([(0, y), (w, y)], fill=(17, 40, 68, 90), width=1)

    # Top Header (0 to 62)
    draw.rectangle([0, 0, w, 62], fill=(10, 22, 40, 245), outline=(0, 240, 255, 100), width=1)
    draw.rounded_rectangle([15, 16, 95, 48], radius=6, fill=(14, 36, 60), outline=(0, 240, 255), width=1)
    draw.text((55, 32), "< MENU", fill=(0, 240, 255), font=font_meta, anchor="mm")

    draw.text((w // 2, 20), "LEVEL 1: NOT INVERTER", fill=(0, 255, 157), font=font_h2, anchor="mm")
    draw.text((w // 2, 45), "CHAPTER 1: THE BASICS", fill=(130, 165, 199), font=font_meta, anchor="mm")

    draw.text((w - 165, 32), "01:28", fill=(255, 208, 0), font=font_mono, anchor="mm")
    draw.rounded_rectangle([w - 110, 16, w - 75, 48], radius=6, fill=(14, 36, 60), outline=(0, 240, 255), width=1)
    draw.text((w - 92, 32), "SND", fill=(0, 240, 255), font=font_meta, anchor="mm")
    draw.rounded_rectangle([w - 65, 16, w - 15, 48], radius=6, fill=(14, 36, 60), outline=(0, 255, 157), width=1)
    draw.text((w - 40, 32), "16:9", fill=(0, 255, 157), font=font_meta, anchor="mm")

    # Top HUD Status Bar (66 to 134)
    draw.rounded_rectangle([15, 68, w - 15, 134], radius=10, fill=(10, 24, 43), outline=(0, 240, 255), width=1)
    draw.text((30, 86), "MOVES: 1 / 8", fill=(255, 255, 255), font=font_mono, anchor="lm")
    draw.text((30, 114), "⭐⭐⭐ (Par: 4)", fill=(255, 208, 0), font=font_meta, anchor="lm")

    draw.text((w // 2 - 20, 101), "OUTPUTS: 1 / 1 ⚡", fill=(0, 255, 157), font=font_h2, anchor="mm")

    draw.rounded_rectangle([w - 150, 84, w - 65, 118], radius=6, fill=(14, 36, 60), outline=(255, 208, 0), width=1)
    draw.text((w - 107, 101), "HINT (3)", fill=(255, 208, 0), font=font_meta, anchor="mm")

    draw.rounded_rectangle([w - 55, 84, w - 20, 118], radius=6, fill=(46, 18, 36), outline=(255, 82, 119), width=1)
    draw.text((w - 37, 101), "RETRY", fill=(255, 136, 170), font=font_meta, anchor="mm")

    # Center Circuit Grid Board (142 to 780)
    cs = 104
    gw, gh = 3, 3
    bw = gw * cs
    bh = gh * cs
    bx = (w - bw) // 2
    by = 142 + (638 - bh) // 2

    # Draw circuit grid
    draw.rounded_rectangle([bx - 10, by - 10, bx + bw + 10, by + bh + 10], radius=12, fill=(8, 19, 34), outline=(0, 240, 255), width=2)
    for r in range(gh):
        for c in range(gw):
            cx = bx + c * cs
            cy = by + r * cs
            draw.rectangle([cx, cy, cx + cs, cy + cs], outline=(18, 36, 61), width=1)

    # Source at (1, 0)
    draw.rounded_rectangle([bx + 12, by + cs + 12, bx + cs - 12, by + 2*cs - 12], radius=8, fill=(15, 33, 56), outline=(0, 255, 157), width=3)
    draw.text((bx + cs // 2, by + cs + cs // 2), "SRC: 1", fill=(0, 255, 157), font=font_mono, anchor="mm")

    # Wire/Gate at (1, 1)
    draw.rounded_rectangle([bx + cs + 12, by + cs + 12, bx + 2*cs - 12, by + 2*cs - 12], radius=8, fill=(15, 33, 56), outline=(0, 255, 157), width=3)
    draw.text((bx + cs + cs // 2, by + cs + cs // 2), "NOT", fill=(0, 255, 157), font=font_h2, anchor="mm")

    # Target LED at (1, 2)
    draw.rounded_rectangle([bx + 2*cs + 12, by + cs + 12, bx + 3*cs - 12, by + 2*cs - 12], radius=8, fill=(15, 33, 56), outline=(0, 255, 157), width=3)
    draw.text((bx + 2*cs + cs // 2, by + cs + cs // 2), "LED: 0 [MATCH]", fill=(0, 255, 157), font=font_meta, anchor="mm")

    # Live green connecting line
    draw.line([(bx + cs, by + cs + cs // 2), (bx + 2*cs, by + cs + cs // 2)], fill=(0, 255, 157), width=6)

    # Bottom Inspector & Mobile Deck (790 to 1260)
    draw.rounded_rectangle([15, 790, w - 15, 1260], radius=10, fill=(10, 24, 43), outline=(0, 240, 255), width=1)
    draw.text((w // 2, 814), "GATE INSPECTOR & LIVE TRUTH TABLE", fill=(0, 240, 255), font=font_h2, anchor="mm")
    draw.line([(30, 834), (w - 30, 834)], fill=(27, 60, 102), width=1)

    draw.text((w // 2, 856), "NOT INVERTER (▷○)", fill=(0, 255, 157), font=font_h2, anchor="mm")
    draw.text((w // 2, 884), "IN: [1] ➔ OUT: [0]", fill=(0, 255, 157), font=font_mono, anchor="mm")

    # Truth Table box
    tt_w = 320
    tt_x = (w - tt_w) // 2
    draw.rounded_rectangle([tt_x, 908, tt_x + tt_w, 986], radius=6, fill=(7, 21, 38), outline=(26, 59, 92), width=1)
    draw.text((w // 2, 922), "INPUT (A)   |   OUTPUT (Q)", fill=(255, 208, 0), font=font_mono, anchor="mm")
    draw.text((w // 2, 946), "0           |   1", fill=(136, 164, 194), font=font_mono, anchor="mm")
    # Glowing active row
    draw.rectangle([tt_x + 2, 958, tt_x + tt_w - 2, 982], fill=(0, 255, 157, 40))
    draw.text((w // 2, 970), "1           |   0  [ACTIVE]", fill=(0, 255, 157), font=font_mono, anchor="mm")

    draw.text((w // 2, 1010), "Invert bit: 0 -> 1  |  1 -> 0", fill=(208, 229, 255), font=font_meta, anchor="mm")
    draw.text((w // 2, 1038), "MISSION INTEL: Connect the NOT gate to turn OFF the LED to match Target 0!", fill=(255, 208, 0), font=font_meta, anchor="mm")

    # Mobile Touch Action Buttons (Large)
    btn_y = 1195
    # Rotate CCW
    draw.rounded_rectangle([32, btn_y - 24, 212, btn_y + 24], radius=8, fill=(14, 36, 60), outline=(0, 240, 255), width=2)
    draw.text((122, btn_y), "↺ ROTATE CCW (Q)", fill=(0, 240, 255), font=font_meta, anchor="mm")

    # Rotate CW (Primary)
    draw.rounded_rectangle([226, btn_y - 24, 486, btn_y + 24], radius=8, fill=(12, 51, 37), outline=(0, 255, 157), width=2)
    draw.text((356, btn_y), "↻ ROTATE CW (ENTER)", fill=(0, 255, 157), font=font_btn, anchor="mm")

    # Cheat Sheet
    draw.rounded_rectangle([500, btn_y - 24, w - 32, btn_y + 24], radius=8, fill=(14, 36, 60), outline=(255, 208, 0), width=2)
    draw.text((605, btn_y), "CHEAT SHEET", fill=(255, 208, 0), font=font_meta, anchor="mm")

    draw.text((w // 2, 1242), "📱 Tap any gate on grid or press rotate buttons below", fill=(110, 147, 184), font=font_meta, anchor="mm")

    im.save(out_path)
    print(f"Saved portrait gameplay preview: {out_path}")

render_portrait_menu(os.path.join(ARTIFACT_DIR, "portrait_preview_menu.png"))
render_portrait_gameplay(os.path.join(ARTIFACT_DIR, "portrait_preview_gameplay.png"))
