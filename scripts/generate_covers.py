import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r"d:\100. cá nhân\mobile game\logic-gate-plumber\media_assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_font(size, bold=True):
    font_paths = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\consola.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_pcb_background(width, height):
    # Deep Cyber navy gradient
    base = Image.new("RGBA", (width, height), (6, 12, 24, 255))
    draw = ImageDraw.Draw(base)
    
    for y in range(height):
        ratio = y / height
        r = int(6 + 8 * (1 - ratio) + 12 * ratio)
        g = int(12 + 10 * ratio)
        b = int(24 + 20 * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    # Grid lines
    grid = 60
    grid_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grid_layer)
    for x in range(0, width, grid):
        gdraw.line([(x, 0), (x, height)], fill=(0, 240, 255, 18), width=1)
    for y in range(0, height, grid):
        gdraw.line([(0, y), (width, y)], fill=(0, 240, 255, 18), width=1)
        
    # Random PCB traces (copper & cyan)
    random.seed(1337)
    for _ in range(50):
        c = random.choice([
            (0, 240, 255, 60), 
            (0, 255, 136, 50), 
            (191, 130, 48, 45), 
            (139, 0, 255, 40)
        ])
        x = random.randint(0, width // grid) * grid
        y = random.randint(0, height // grid) * grid
        l = random.randint(2, 5) * grid
        if random.random() < 0.5:
            gdraw.line([(x, y), (x + l, y)], fill=c, width=2)
            gdraw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=c)
            gdraw.ellipse([x + l - 3, y - 3, x + l + 3, y + 3], fill=c)
        else:
            gdraw.line([(x, y), (x, y + l)], fill=c, width=2)
            gdraw.ellipse([x - 3, y - 3, x + 3, y + 3], fill=c)
            gdraw.ellipse([x, y + l - 3, x, y + l + 3], fill=c)

    base = Image.alpha_composite(base, grid_layer)
    return base

def draw_chip_ic(draw, cx, cy, w, h, name, sub="LOGIC IC", active=True):
    # IC Body
    fill_col = (14, 26, 44, 255) if active else (12, 20, 32, 255)
    border_col = (0, 240, 255, 255) if active else (0, 140, 180, 200)
    
    # Outer stroke
    draw.rounded_rectangle([cx - w//2, cy - h//2, cx + w//2, cy + h//2], radius=10, fill=fill_col, outline=border_col, width=3)
    
    # Notch on left edge
    notch_r = 7
    draw.ellipse([cx - w//2 - notch_r, cy - notch_r, cx - w//2 + notch_r, cy + notch_r], fill=(8, 16, 28, 255), outline=border_col, width=2)
    
    # IC Pins (Left & Right)
    pin_col = (190, 210, 230, 255)
    for py in [cy - h//4, cy + h//4]:
        draw.rectangle([cx - w//2 - 12, py - 3, cx - w//2, py + 3], fill=pin_col)
    draw.rectangle([cx + w//2, cy - 3, cx + w//2 + 12, cy + 3], fill=(0, 255, 136, 255) if active else pin_col)
    
    # Chip Labels
    font_main = get_font(int(h * 0.36), bold=True)
    bb = draw.textbbox((0, 0), name, font=font_main)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    text_col = (255, 255, 255, 255) if active else (140, 170, 200, 255)
    draw.text((cx - tw//2, cy - th//2 - 4), name, fill=text_col, font=font_main)
    
    font_sub = get_font(max(10, int(h * 0.13)), bold=True)
    sbb = draw.textbbox((0, 0), sub, font=font_sub)
    sw = sbb[2] - sbb[0]
    draw.text((cx - sw//2, cy + h//4 + 3), sub, fill=(0, 240, 255, 200), font=font_sub)

def draw_source(draw, cx, cy, val="1", radius=24):
    is_high = val == "1"
    border = (0, 255, 136, 255) if is_high else (0, 180, 255, 255)
    fill = (12, 28, 48, 255)
    
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=fill, outline=border, width=3)
    
    font = get_font(int(radius * 1.15), bold=True)
    bb = draw.textbbox((0, 0), val, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    draw.text((cx - tw//2, cy - th//2 - 2), val, fill=border, font=font)

def draw_led_node(draw, cx, cy, radius=26, lit=True):
    base_col = (16, 32, 54, 255)
    border_col = (0, 240, 255, 255)
    core_col = (0, 255, 136, 255) if lit else (30, 50, 70, 255)
    
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=base_col, outline=border_col, width=3)
    draw.ellipse([cx - radius//2, cy - radius//2, cx + radius//2, cy + radius//2], fill=core_col)
    if lit:
        draw.ellipse([cx - radius//4, cy - radius//4, cx + radius//4, cy + radius//4], fill=(220, 255, 240, 255))

def render_title_text(canvas, cx, cy, scale=1.0):
    t1 = "LOGIC GATE"
    t2 = "PLUMBER"
    badge = "CYBERPUNK CIRCUIT PUZZLE  •  100+ LEVELS"
    
    f1 = get_font(int(74 * scale), bold=True)
    f2 = get_font(int(82 * scale), bold=True)
    fb = get_font(int(20 * scale), bold=True)
    
    d = ImageDraw.Draw(canvas)
    b1 = d.textbbox((0, 0), t1, font=f1)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    
    b2 = d.textbbox((0, 0), t2, font=f2)
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    
    y1 = cy - h1 - int(16 * scale)
    y2 = cy + int(10 * scale)
    
    # 1. Glow layer
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((cx - w1//2, y1), t1, fill=(0, 240, 255, 255), font=f1)
    gd.text((cx - w2//2, y2), t2, fill=(0, 255, 136, 255), font=f2)
    glow_blurred = glow.filter(ImageFilter.GaussianBlur(int(14 * scale)))
    glow_soft = glow.filter(ImageFilter.GaussianBlur(int(28 * scale)))
    
    canvas = Image.alpha_composite(canvas, glow_soft)
    canvas = Image.alpha_composite(canvas, glow_blurred)
    
    # 2. Main sharp text
    d = ImageDraw.Draw(canvas)
    # Shadow
    d.text((cx - w1//2 + 3, y1 + 3), t1, fill=(0, 0, 0, 200), font=f1)
    d.text((cx - w2//2 + 3, y2 + 3), t2, fill=(0, 0, 0, 200), font=f2)
    # Core
    d.text((cx - w1//2, y1), t1, fill=(0, 240, 255, 255), font=f1)
    d.text((cx - w2//2, y2), t2, fill=(0, 255, 136, 255), font=f2)
    
    # 3. Badge banner
    bb = d.textbbox((0, 0), badge, font=fb)
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    by = y2 + h2 + int(24 * scale)
    pad_x = int(22 * scale)
    pad_y = int(8 * scale)
    
    d.rounded_rectangle(
        [cx - bw//2 - pad_x, by - pad_y, cx + bw//2 + pad_x, by + bh + pad_y],
        radius=int(12 * scale), fill=(14, 28, 48, 240), outline=(0, 240, 255, 220), width=int(2 * scale)
    )
    d.text((cx - bw//2, by - 2), badge, fill=(255, 255, 255, 255), font=fb)
    
    return canvas


# -------------------------------------------------------------
# 1. LANDSCAPE (1920 x 1080)
# -------------------------------------------------------------
def generate_landscape():
    W, H = 1920, 1080
    canvas = draw_pcb_background(W, H)
    
    # Left side: Title
    canvas = render_title_text(canvas, cx=620, cy=430, scale=1.35)
    
    # Features badges below title
    d = ImageDraw.Draw(canvas)
    feat_font = get_font(24, bold=True)
    tags = ["TRUTH TABLES", "ROTATE & SOLVE", "TIME ATTACK", "ENDLESS MODE"]
    start_x = 200
    tag_y = 730
    for tag in tags:
        bb = d.textbbox((0, 0), tag, font=feat_font)
        tw = bb[2] - bb[0]
        d.rounded_rectangle([start_x, tag_y, start_x + tw + 26, tag_y + 44], radius=10, fill=(16, 34, 58, 220), outline=(0, 240, 255, 180), width=2)
        d.text((start_x + 13, tag_y + 8), tag, fill=(0, 240, 255, 255), font=feat_font)
        start_x += tw + 40
        
    # RIGHT SIDE: Interactive Circuit Enclosure
    box_x1, box_y1, box_x2, box_y2 = 1100, 160, 1820, 920
    d.rounded_rectangle([box_x1, box_y1, box_x2, box_y2], radius=22, fill=(9, 18, 34, 240), outline=(0, 240, 255, 220), width=3)
    
    # Enclosure Header
    hfont = get_font(20, bold=True)
    d.text((box_x1 + 30, box_y1 + 22), "CIRCUIT MATRIX // ACTIVE SIMULATION", fill=(0, 240, 255, 220), font=hfont)
    d.line([(box_x1 + 30, box_y1 + 54), (box_x2 - 30, box_y1 + 54)], fill=(0, 240, 255, 60), width=2)
    
    # Circuit Components
    s1_x, s1_y = 1180, 340
    s2_x, s2_y = 1180, 500
    s3_x, s3_y = 1180, 740
    
    g1_x, g1_y = 1400, 420
    g2_x, g2_y = 1400, 740
    
    led1_x, led1_y = 1710, 420
    led2_x, led2_y = 1710, 740
    
    w1_pts = [(s1_x + 24, s1_y), (g1_x - 70, s1_y), (g1_x - 70, g1_y - 20), (g1_x - 65, g1_y - 20)]
    w2_pts = [(s2_x + 24, s2_y), (g1_x - 70, s2_y), (g1_x - 70, g1_y + 20), (g1_x - 65, g1_y + 20)]
    w_out1 = [(g1_x + 65, g1_y), (led1_x - 32, led1_y)]
    
    w3_pts = [(s3_x + 24, s3_y), (g2_x - 65, g2_y)]
    w_out2 = [(g2_x + 65, g2_y), (led2_x - 30, led2_y)]
    
    # Create smooth glow for active wires and LED 1
    wire_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wgd = ImageDraw.Draw(wire_glow)
    
    wgd.line(w1_pts[:2], fill=(0, 255, 136, 255), width=16)
    wgd.line(w1_pts[1:], fill=(0, 255, 136, 255), width=16)
    wgd.line(w2_pts[:2], fill=(0, 255, 136, 255), width=16)
    wgd.line(w2_pts[1:], fill=(0, 255, 136, 255), width=16)
    wgd.line(w_out1, fill=(0, 255, 136, 255), width=18)
    
    # LED 1 soft radial glow
    for r in range(80, 20, -5):
        wgd.ellipse([led1_x - r, led1_y - r, led1_x + r, led1_y + r], fill=(0, 255, 136, 40))
        
    wire_glow_blur = wire_glow.filter(ImageFilter.GaussianBlur(14))
    canvas = Image.alpha_composite(canvas, wire_glow_blur)
    
    # Foreground elements
    d = ImageDraw.Draw(canvas)
    d.line(w1_pts[:2], fill=(0, 255, 136, 255), width=5)
    d.line(w1_pts[1:], fill=(0, 255, 136, 255), width=5)
    d.line(w2_pts[:2], fill=(0, 255, 136, 255), width=5)
    d.line(w2_pts[1:], fill=(0, 255, 136, 255), width=5)
    d.line(w_out1, fill=(0, 255, 136, 255), width=6)
    
    pulse_x = 1530
    d.ellipse([pulse_x - 7, g1_y - 7, pulse_x + 7, g1_y + 7], fill=(255, 255, 255, 255))
    
    d.line(w3_pts, fill=(0, 180, 255, 180), width=4)
    d.line(w_out2, fill=(35, 60, 85, 255), width=4)
    
    draw_source(d, s1_x, s1_y, "1", radius=28)
    draw_source(d, s2_x, s2_y, "1", radius=28)
    draw_source(d, s3_x, s3_y, "0", radius=28)
    
    draw_chip_ic(d, g1_x, g1_y, 140, 95, "AND", active=True)
    draw_chip_ic(d, g2_x, g2_y, 140, 95, "XOR", active=False)
    
    draw_led_node(d, led1_x, led1_y, radius=32, lit=True)
    draw_led_node(d, led2_x, led2_y, radius=28, lit=False)
    
    sfont = get_font(22, bold=True)
    d.text((led1_x - 42, led1_y + 44), "SOLVED!", fill=(0, 255, 136, 255), font=sfont)
    d.text((led2_x - 22, led2_y + 40), "IDLE", fill=(100, 135, 170, 255), font=sfont)
    
    out_path = os.path.join(OUTPUT_DIR, "cover_landscape_1920x1080.png")
    canvas.save(out_path, quality=95)
    print("Regenerated Landscape:", out_path)


# -------------------------------------------------------------
# 2. PORTRAIT (800 x 1200)
# -------------------------------------------------------------
def generate_portrait():
    W, H = 800, 1200
    canvas = draw_pcb_background(W, H)
    
    canvas = render_title_text(canvas, cx=400, cy=260, scale=0.88)
    
    b_x1, b_y1, b_x2, b_y2 = 60, 450, 740, 1050
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([b_x1, b_y1, b_x2, b_y2], radius=20, fill=(9, 18, 34, 240), outline=(0, 240, 255, 220), width=3)
    
    hfont = get_font(18, bold=True)
    d.text((b_x1 + 30, b_y1 + 18), "CIRCUIT MATRIX // LEVEL 42", fill=(0, 240, 255, 200), font=hfont)
    d.line([(b_x1 + 30, b_y1 + 46), (b_x2 - 30, b_y1 + 46)], fill=(0, 240, 255, 60), width=2)
    
    s1_x, s1_y = 210, 560
    s2_x, s2_y = 590, 560
    g_x, g_y = 400, 720
    led_x, led_y = 400, 930
    
    wire_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wgd = ImageDraw.Draw(wire_glow)
    
    wgd.line([(s1_x, s1_y + 25), (s1_x, g_y - 20), (g_x - 75, g_y - 20)], fill=(0, 255, 136, 255), width=16)
    wgd.line([(s2_x, s2_y + 25), (s2_x, g_y + 20), (g_x - 75, g_y + 20)], fill=(0, 255, 136, 255), width=16)
    wgd.line([(g_x + 75, g_y), (650, g_y), (650, led_y), (led_x + 35, led_y)], fill=(0, 255, 136, 255), width=16)
    
    for r in range(75, 15, -5):
        wgd.ellipse([led_x - r, led_y - r, led_x + r, led_y + r], fill=(0, 255, 136, 35))
        
    wire_glow_blur = wire_glow.filter(ImageFilter.GaussianBlur(14))
    canvas = Image.alpha_composite(canvas, wire_glow_blur)
    
    d = ImageDraw.Draw(canvas)
    d.line([(s1_x, s1_y + 25), (s1_x, g_y - 20), (g_x - 75, g_y - 20)], fill=(0, 255, 136, 255), width=5)
    d.line([(s2_x, s2_y + 25), (s2_x, g_y + 20), (g_x - 75, g_y + 20)], fill=(0, 255, 136, 255), width=5)
    d.line([(g_x + 75, g_y), (650, g_y), (650, led_y), (led_x + 35, led_y)], fill=(0, 255, 136, 255), width=5)
    
    draw_source(d, s1_x, s1_y, "1", radius=26)
    draw_source(d, s2_x, s2_y, "1", radius=26)
    draw_chip_ic(d, g_x, g_y, 150, 100, "AND", active=True)
    draw_led_node(d, led_x, led_y, radius=32, lit=True)
    
    sfont = get_font(22, bold=True)
    d.text((led_x - 64, led_y + 44), "CIRCUIT LIT!", fill=(0, 255, 136, 255), font=sfont)
    
    bfont = get_font(22, bold=True)
    callout = "ROTATE  •  CONNECT  •  SOLVE"
    bb = d.textbbox((0, 0), callout, font=bfont)
    bw = bb[2] - bb[0]
    d.rounded_rectangle([400 - bw//2 - 20, 1085, 400 + bw//2 + 20, 1135], radius=12, fill=(16, 36, 60, 240), outline=(0, 255, 136, 220), width=2)
    d.text((400 - bw//2, 1097), callout, fill=(0, 255, 136, 255), font=bfont)
    
    out_path = os.path.join(OUTPUT_DIR, "cover_portrait_800x1200.png")
    canvas.save(out_path, quality=95)
    print("Regenerated Portrait:", out_path)


# -------------------------------------------------------------
# 3. SQUARE (800 x 800)
# -------------------------------------------------------------
def generate_square():
    W, H = 800, 800
    canvas = draw_pcb_background(W, H)
    
    canvas = render_title_text(canvas, cx=400, cy=210, scale=0.76)
    
    b_x1, b_y1, b_x2, b_y2 = 60, 360, 740, 730
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([b_x1, b_y1, b_x2, b_y2], radius=18, fill=(9, 18, 34, 240), outline=(0, 240, 255, 220), width=3)
    
    s1_x, s1_y = 160, 460
    s2_x, s2_y = 160, 630
    g_x, g_y = 390, 545
    led_x, led_y = 620, 545
    
    wire_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wgd = ImageDraw.Draw(wire_glow)
    
    wgd.line([(s1_x + 24, s1_y), (g_x - 70, s1_y), (g_x - 70, g_y - 20), (g_x - 65, g_y - 20)], fill=(0, 255, 136, 255), width=16)
    wgd.line([(s2_x + 24, s2_y), (g_x - 70, s2_y), (g_x - 70, g_y + 20), (g_x - 65, g_y + 20)], fill=(0, 255, 136, 255), width=16)
    wgd.line([(g_x + 65, g_y), (led_x - 30, led_y)], fill=(0, 255, 136, 255), width=16)
    
    for r in range(65, 15, -4):
        wgd.ellipse([led_x - r, led_y - r, led_x + r, led_y + r], fill=(0, 255, 136, 30))
        
    wire_glow_blur = wire_glow.filter(ImageFilter.GaussianBlur(13))
    canvas = Image.alpha_composite(canvas, wire_glow_blur)
    
    d = ImageDraw.Draw(canvas)
    d.line([(s1_x + 24, s1_y), (g_x - 70, s1_y), (g_x - 70, g_y - 20), (g_x - 65, g_y - 20)], fill=(0, 255, 136, 255), width=5)
    d.line([(s2_x + 24, s2_y), (g_x - 70, s2_y), (g_x - 70, g_y + 20), (g_x - 65, g_y + 20)], fill=(0, 255, 136, 255), width=5)
    d.line([(g_x + 65, g_y), (led_x - 30, led_y)], fill=(0, 255, 136, 255), width=5)
    
    draw_source(d, s1_x, s1_y, "1", radius=25)
    draw_source(d, s2_x, s2_y, "1", radius=25)
    draw_chip_ic(d, g_x, g_y, 140, 95, "AND", active=True)
    draw_led_node(d, led_x, led_y, radius=30, lit=True)
    
    sfont = get_font(20, bold=True)
    d.text((led_x - 28, led_y + 40), "PASS", fill=(0, 255, 136, 255), font=sfont)
    
    out_path = os.path.join(OUTPUT_DIR, "cover_square_800x800.png")
    canvas.save(out_path, quality=95)
    print("Regenerated Square:", out_path)

if __name__ == "__main__":
    generate_landscape()
    generate_portrait()
    generate_square()
    print("All refined cover images completed!")
