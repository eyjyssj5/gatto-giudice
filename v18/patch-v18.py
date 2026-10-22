from pathlib import Path
P=Path('app-source/www')
p=P/'index.html';h=p.read_text()
assert '<div class="carousel-controls">' in h
h=h.replace('<div class="carousel-controls">','<p class="cat-preview-tip">Tocca qualsiasi gatto per vedere il movimento, anche se il verdetto e bloccato.</p>\n   <div class="carousel-controls">',1)
assert '<section class="verdict-section"' in h
section='''<section class="checkin-section" aria-labelledby="checkin-title">
<h2 id="checkin-title">Check-in giornaliero</h2>
<p id="checkin-total"></p><progress id="checkin-progress" max="40" value="0"></progress>
<button type="button" id="checkin-button">Fai check-in oggi</button>
<p id="checkin-feedback" role="status" aria-live="polite"></p><p id="checkin-next"></p>
<ul id="checkin-milestones"></ul><p id="checkin-storage-notice"></p>
</section>
'''
h=h.replace('<section class="verdict-section"',section+'<section class="verdict-section"',1)
h=h.replace('movimento-v17.css?v=17','movimento-v17.css?v=18')
h=h.replace('</head>','<link rel="stylesheet" href="checkin-v18.css?v=18">\n</head>',1)
assert '<script src="premium-bundle.js?v=play16"></script>' in h
h=h.replace('<script src="premium-bundle.js?v=play16"></script>','<script src="checkin-v18.js?v=18"></script>\n<script src="premium-bundle.js?v=play16"></script>',1)
assert '<script src="app.js?v=play16"></script>' in h
h=h.replace('<script src="app.js?v=play16"></script>','<script src="app.js?v=18"></script>\n<script src="checkin-ui-v18.js?v=18"></script>',1)
p.write_text(h)
p=P/'app.js';s=p.read_text()
old="function paid(id){return id==='dolce'||Boolean(window.GattoPremium?.owned(id));}"
assert old in s, 'paid() source mismatch'
s=s.replace(old,"function paid(id){return id==='dolce'||Boolean(window.GattoCheckin?.owned(id))||Boolean(window.GattoPremium?.owned(id));}")
old="const price=window.GattoPremium?.price(j.id)||'';"
assert old in s
s=s.replace(old, """const price=window.GattoPremium?.price(j.id)||'';
   const preview=document.createElement('p'); preview.className='checkin-unlock-hint';
   preview.textContent=j.id==='supremo'?'Anteprima movimento gratuita. Supremo richiede SOLO un abbonamento attivo.':'Anteprima movimento gratuita. I verdetti si sbloccano ogni 10 check-in consecutivi o con acquisto.';
   e.append(preview);""",1)
s=s.replace("const buy=j.id==='supremo'?", "const buy=j.id==='supremo'?") if False else s
assert 'window.addEventListener("gatto-premium-update"' in s
p.write_text(s)
files=['checkin-v18.js','checkin-ui-v18.js','checkin-v18.css','movimento-v17.css','premium-entry.js']
for n in files:
 src=Path('v18/www')/n
 assert src.is_file() and src.stat().st_size>500,n
 (P/n).write_bytes(src.read_bytes())
# Copia gestione pausa / background già sperimentata nella V17.
(P/'movimento-v17.js').write_bytes(Path('v17/www/movimento-v17.js').read_bytes())
print('V18: checkin consecutivo, preview 6 gatti, movimenti, abbonamento Supremo')
