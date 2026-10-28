#!/usr/bin/env python3
"""V29: link privacy visibile e accessibile dal Play Store, mantenendo tutta la V28."""
from pathlib import Path
P=Path("app-source/www")
f=P/"index.html"
s=f.read_text(encoding="utf-8")
assert 'id="v28-consegna-slot"' in s
assert 'id="btn-giudica"' in s
assert '<footer class="footer">' in s
assert 'id="privacy-link"' not in s
s=s.replace('<footer class="footer">','<footer class="footer"><a id="privacy-link" style="color:inherit;text-decoration:underline;font-weight:600" href="https://gatto-giudice-ai.eyjyssj.workers.dev/privacy" target="_blank" rel="noopener noreferrer">Informativa privacy / Privacy policy</a> ',1)
assert s.count('id="privacy-link"')==1
f.write_text(s,encoding="utf-8")
print("V29: collegamento privacy aggiunto in app, V28 intact")
