"""Produce tre immagini separate dall'atlante delle TRE foto scelte dall'utente.
Non sostituisce, non rigenera e non ridisegna i gatti.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "www/img/gatti-esatti-2026.avif"
im = Image.open(source).convert("RGB")
width, height = im.size
assert width % 3 == 0, (width, height)
w = width // 3
for i, name in enumerate(("dolce", "severo", "ironico")):
    crop = im.crop((i * w, 0, (i + 1) * w, height))
    crop.save(root / f"www/img/gatto-{name}-esatto.webp", "WEBP", quality=95, method=6)
    print(name, crop.size)
