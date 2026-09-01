#!/usr/bin/env python3

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
WIDTH, HEIGHT = 1200, 630

CARDS = {
    "social-site.png": ("DIGITALE LÖSUNGEN", "Erst den Arbeitsalltag verstehen. Dann die kleinste wirksame Lösung."),
    "social-blog.png": ("PRAXISWISSEN", "Erkenntnisse statt Erfolgsfolklore. Entscheidungen statt Techniktheater."),
    "social-digitalisierung-handwerk.png": ("DIGITALISIERUNG IM HANDWERK", "Digitalisierung beginnt beim Ablauf."),
    "social-begruendetes-nein.png": ("PRODUKTVALIDIERUNG", "Warum ein begründetes Nein ein gutes Projektergebnis sein kann."),
    "social-technische-partnerschaft.png": ("TECHNISCHE PARTNERSCHAFT", "Verantwortung braucht Entscheidungsrechte."),
    "social-baeckerei-pilot.png": ("BÄCKEREI-PILOT", "Weniger Retouren. Ohne früher ausverkauft zu sein."),
    "social-revierhege.png": ("REFERENZPROJEKT REVIERHEGE", "Ein echtes Problem. Ein funktionierender Pilot. Ein begründetes Nein."),
}


def fitted_lines(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_card(filename, category, title):
    image = Image.new("RGB", (WIDTH, HEIGHT), "#172126")
    draw = ImageDraw.Draw(image)
    category_font = ImageFont.truetype(BOLD, 24)
    brand_font = ImageFont.truetype(BOLD, 32)
    title_font = ImageFont.truetype(BOLD, 66)
    small_font = ImageFont.truetype(REGULAR, 24)

    draw.rectangle((0, 0, 22, HEIGHT), fill="#D7A64A")
    draw.rounded_rectangle((835, 74, 1122, 556), radius=24, fill="#F0E6D6")
    draw.text((74, 62), "byte & Handwerk", font=brand_font, fill="#FFFFFF")
    draw.text((74, 136), category, font=category_font, fill="#D7A64A")

    y = 198
    for line in fitted_lines(draw, title, title_font, 700):
        draw.text((74, y), line, font=title_font, fill="#FFFFFF")
        y += 77

    draw.text((74, 556), "byteundhandwerk.de", font=small_font, fill="#C9CFD1")

    steps = [("01", "Verstehen"), ("02", "Prüfen"), ("03", "Wirken")]
    for index, (number, label) in enumerate(steps):
        step_y = 132 + index * 132
        fill = "#D7A64A" if index == 1 else "#456552"
        draw.ellipse((883, step_y, 939, step_y + 56), fill=fill)
        draw.text((898, step_y + 14), number, font=ImageFont.truetype(BOLD, 16), fill="#FFFFFF")
        draw.text((964, step_y + 11), label, font=ImageFont.truetype(BOLD, 24), fill="#172126")
        if index < len(steps) - 1:
            draw.line((911, step_y + 64, 911, step_y + 120), fill="#AAB7AE", width=4)

    image.save(ASSETS / filename, optimize=True)


def main():
    for filename, (category, title) in CARDS.items():
        draw_card(filename, category, title)
        print(f"Generated assets/{filename}")


if __name__ == "__main__":
    main()
