# Apply after v22/patch-v22.py --edition personal.
from pathlib import Path
import re
P=Path('app-source/www')
app=P/'app.js';s=app.read_text()
start=s.index('function portraitMarkup(j,pos){')
end=s.index('function panel(){',start)
replacement='''function portraitMarkup(j,pos){
 const prefix="img/gatto-"+j.id;
 const staticSrc=prefix+"-static.webp?v=23";
 return '<span class="judge-portrait"><img alt="" loading="'+(pos==="center"?"eager":"lazy")+'" src="'+staticSrc+'" data-static="'+staticSrc+'" data-anim="'+prefix+'-animato.webp?v=23"></span>';
}
let motionTimer=null;
let motionSeq=0;
function stopJudgeMotion(){
 motionSeq++;
 if(motionTimer!==null){clearTimeout(motionTimer);motionTimer=null;}
 for(const j of JUDGES){
   const img=el("giudici")?.querySelector('.judge-card[data-judge="'+j.id+'"] .judge-portrait img');
   if(img){const normal="img/gatto-"+j.id+"-static.webp?v=23";if(img.getAttribute("src")!==normal)img.setAttribute("src",normal);}
 }
}
function playJudgeMotion(id){
 stopJudgeMotion();
 if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
 const cat=JUDGES.find(j=>j.id===id);
 const img=el("giudici")?.querySelector('.judge-card[data-judge="'+id+'"] .judge-portrait img');
 if(!cat||!img)return;
 const sequence=++motionSeq;
 img.setAttribute("src","img/gatto-"+id+"-animato.webp?v=23&play="+Date.now());
 motionTimer=setTimeout(()=>{
  if(sequence!==motionSeq)return;
  if(img.isConnected)img.setAttribute("src","img/gatto-"+id+"-static.webp?v=23");
  motionTimer=null;
 },1420);
}
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopJudgeMotion();});
'''
s=s[:start]+replacement+s[end:]
# When changing the selected cat, keep its portrait static (not the original unanimated PNG).
target='const src=JUDGES[i].img+"?v=16";'
assert target in s,'Missing V22 static selector in renderJudges'
s=s.replace(target,'const src="img/gatto-"+JUDGES[i].id+"-static.webp?v=23";',1)
assert 'function paid(id){return true;}' in s
assert 'playJudgeMotion(selected)' in s
assert 'function selectIndex(i){stopJudgeMotion();' in s
# Playing the same cat twice must restart the short clip.
assert 'Date.now()' in s
app.write_text(s)
page=P/'index.html';h=page.read_text()
h=h.replace('app.js?v=22','app.js?v=23').replace('movimento-v17.css?v=22','movimento-v17.css?v=23')
h=h.replace('VERSIONE PERSONALE · TUTTI I 6 GIUDICI SBLOCCATI','V23 PERSONALE · TUTTI I 6 GIUDICI SBLOCCATI')
h=h.replace('Tocca qualsiasi gatto per vedere il movimento, anche se il verdetto è bloccato.','Il gatto reagisce solo quando invii la decisione.')
assert 'premium-bundle.js?v=play16' not in h
assert 'checkin-section{display:none!important}' in h
page.write_text(h)
for cat in ('dolce','severo','ironico','corrotto','pigro','supremo'):
 for kind in ('static','animato'):
  assert (P/'img'/('gatto-'+cat+'-'+kind+'.webp')).is_file(),cat
print('OK V23 PERSONALE: 6 unlocked; react on verdict; 1.42-second reaction; no idle animation')
