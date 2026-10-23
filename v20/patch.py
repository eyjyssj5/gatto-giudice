from pathlib import Path
import re
P=Path('app-source/www')
a=P/'app.js'
s=a.read_text()
helper='''function portraitMarkup(j,pos){
 const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
 const animated=pos==="center"&&!reduce;
 const path=animated?("img/gatto-"+j.id+"-animato.webp?v=20"):(j.img+"?v=16");
 return '<span class="judge-portrait"><img alt="" loading="'+(pos==="center"?"eager":"lazy")+'" src="'+path+'"></span>';
}
'''
assert 'function drawCarousel(){' in s
s=s.replace('function drawCarousel(){',helper+'function drawCarousel(){',1)
lines=s.splitlines()
found=False
for i,line in enumerate(lines):
 if 'b.innerHTML=' in line and 'judge-portrait' in line and '🔒' in line:
  lines[i]='  b.innerHTML=portraitMarkup(j,pos)+\'<span class="name">\'+escapeText(name(j.id))+\'</span>\'+(paid(j.id)?"":\'<span class="lock" aria-hidden="true">🔒</span>\');'
  found=True;break
assert found,'Cannot find carousel rendering'
s='\n'.join(lines)+'\n'
target=' cards.forEach((b,i)=>{const pos=carouselPositions(i);b.dataset.position=pos;b.setAttribute("aria-current",pos==="center"?"true":"false");b.tabIndex=["center","left","right"].includes(pos)?0:-1;});'
replacement=''' cards.forEach((b,i)=>{const pos=carouselPositions(i);b.dataset.position=pos;b.setAttribute("aria-current",pos==="center"?"true":"false");b.tabIndex=["center","left","right"].includes(pos)?0:-1;
 const pic=b.querySelector(".judge-portrait img");
 const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
 const animated=pos==="center"&&!reduce;
 const src=animated?("img/gatto-"+JUDGES[i].id+"-animato.webp?v=20"):(JUDGES[i].img+"?v=16");
 if(pic&&pic.getAttribute("src")!==src)pic.setAttribute("src",src);
 });'''
assert target in s,'Cannot find renderJudges'
s=s.replace(target,replacement,1);a.write_text(s)
h=P/'index.html';html=h.read_text()
assert '<link rel="stylesheet" href="movimento-v17.css?v=18">' in html
html=html.replace('movimento-v17.css?v=18','movimento-v17.css?v=20')
html=html.replace('app.js?v=18','app.js?v=20')
h.write_text(html)
(P/'movimento-v17.css').write_text('''/* V20: static photo frame with animated real cat features inside WebP. */
.judge-card[data-position="center"] .judge-portrait,
.judge-card[data-position="center"][data-judge="severo"] .judge-portrait,
.judge-card[data-position="center"][data-judge="ironico"] .judge-portrait{animation:none!important}
.judge-card .judge-portrait img{animation:none!important;transform:none!important;will-change:auto!important}
.judge-card.is-locked .judge-portrait:after{display:none!important}
.judge-card .lock{top:auto!important;bottom:8px!important;right:8px!important;font-size:14px!important;width:26px!important}
''')
ids=('dolce','severo','ironico','corrotto','pigro','supremo')
for cat in ids:
 p=P/'img'/('gatto-'+cat+'-animato.webp')
 assert p.is_file() and p.stat().st_size>50000,p
print('V20 six inner-cat animated portraits and general 10-day checkin ready')
