#!/usr/bin/env python3
"""V30: validated Play purchases and a restore purchase button. Do not release until API is configured."""
from pathlib import Path
src=Path("v30/premium-entry.js")
out=Path("app-source/www/premium-entry.js")
assert out.is_file() and "giudice_supremo_abbonamento" in out.read_text(encoding="utf-8")
s=src.read_text(encoding="utf-8")
assert "store.validator=" in s
assert ".approved(tx=>tx.verify())" in s
assert "else tx.finish()" not in s
assert "store.restorePurchases()" in s
assert "billingEnabled" in s
assert "giudice_supremo_abbonamento" in s
out.write_text(s,encoding="utf-8")
print("V30: validation gated purchases and restore prepared; requires Cloudflare Play secret + Console products")
