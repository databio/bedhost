import io
import os
from typing import Optional

from PIL import Image, ImageDraw, ImageFont

_STATIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

_TEAL = (0, 128, 128)
_DARK = (30, 30, 30)
_GRAY = (110, 110, 110)
_LIGHT_GRAY = (240, 242, 244)
_WHITE = (255, 255, 255)

_W, _H = 1200, 630


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(os.path.join(_STATIC, name), size)
    except OSError:
        return ImageFont.load_default()


def _centered_x(
    draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont
) -> int:
    return (_W - int(draw.textlength(text, font=font))) // 2


def _draw_stat_card(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, value: str):
    w, h = 250, 115
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=_LIGHT_GRAY)
    draw.text(
        (x + 18, y + 14),
        label.upper(),
        font=_font("Roboto-Regular.ttf", 21),
        fill=_GRAY,
    )
    draw.text((x + 18, y + 50), value, font=_font("Roboto-Bold.ttf", 36), fill=_DARK)


def generate_bed_og_image(
    bed_id: str,
    genome: Optional[str],
    bed_compliance: Optional[str],
    number_of_regions: Optional[float],
    mean_region_width: Optional[float],
) -> bytes:
    img = Image.new("RGB", (_W, _H), _WHITE)
    draw = ImageDraw.Draw(img)

    # Teal header bar
    draw.rectangle([0, 0, _W, 110], fill=_TEAL)

    # Logo centered in header
    logo_path = os.path.join(_STATIC, "bedbase_og_logo.png")
    logo_w = 0
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        logo_h = 74
        logo_w = int(logo.width * (logo_h / logo.height))
        logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
        logo_x = (_W - logo_w) // 2
        img.paste(logo, (logo_x, 18), logo)

    # "bedbase.org" top-right
    url_font = _font("Roboto-Regular.ttf", 24)
    draw.text((_W - 210, 40), "bedbase.org", font=url_font, fill=(200, 240, 240))

    # BED ID as centered title
    id_font = _font("Roboto-Bold.ttf", 38)
    id_x = _centered_x(draw, bed_id, id_font)
    draw.text((id_x, 148), bed_id, font=id_font, fill=_DARK)

    # Subtitle centered
    sub_font = _font("Roboto-Regular.ttf", 26)
    subtitle = "Genomic regions hosted on BEDbase"
    sub_x = _centered_x(draw, subtitle, sub_font)
    draw.text((sub_x, 202), subtitle, font=sub_font, fill=_GRAY)

    # Divider
    draw.rectangle([80, 250, _W - 80, 253], fill=_LIGHT_GRAY)

    # Stat cards — centered row(s)
    stats = []
    if genome:
        stats.append(("Genome", genome))
    if bed_compliance:
        stats.append(("Format", bed_compliance.upper()))
    if number_of_regions is not None:
        stats.append(("Regions", f"{int(number_of_regions):,}"))
    if mean_region_width is not None:
        stats.append(("Mean width", f"{int(mean_region_width):,} bp"))

    card_w, card_gap = 250, 28
    n = len(stats)
    if n:
        per_row = min(n, 4)
        total_w = per_row * card_w + (per_row - 1) * card_gap
        start_x = (_W - total_w) // 2
        start_y = 275
        row_h = 135

        for i, (label, value) in enumerate(stats):
            col = i % per_row
            row = i // per_row
            x = start_x + col * (card_w + card_gap)
            y = start_y + row * row_h
            _draw_stat_card(draw, x, y, label, value)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
