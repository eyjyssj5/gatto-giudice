#!/usr/bin/env python3
"""Google Play commercial edition: 6 genuine on-demand MP4s, 4 earned cats, Supreme subscription."""
from pathlib import Path
import re
P=Path("app-source/www")
cats=("dolce","severo","ironico","corrotto","pigro","supremo")
for cat in cats:
    video=P/"video"/(cat+".mp4")
    assert video.is_file() and video.stat().st_size>30000,video
app=P/"app.js"
s=app.read_text(encoding="utf-8")
assert 'function paid(id){return id===\'dolce\'||Boolean(window.GattoCheckin?.owned(id))||Boolean(window.GattoPremium?.owned(id));}' in s
assert 'function paid(id){return true;}' not in s
a=s.index("function portraitMarkup(j,pos){")
endline='document.addEventListener("visibilitychange",()=>{if(document.hidden)stopJudgeMotion();});'
b=s.index(endline,a)+len(endline)
repl='''function portraitMarkup(j,pos){
 const original=j.img+"?v=26";
 const movie="video/"+j.id+".mp4?v=26";
 return '<span class="judge-portrait"><img alt="" loading="'+(pos==="center"?"eager":"lazy")+'" src="'+original+'" data-static="'+original+'"><video class="cat-reaction" muted playsinline webkit-playsinline preload="none" disablepictureinpicture src="'+movie+'" aria-hidden="true"></video></span>';
}
let motionTimer=null;
let motionSeq=0;
function stopJudgeMotion(){
 motionSeq++;
 if(motionTimer!==null){clearTimeout(motionTimer);motionTimer=null;}
 for(const j of JUDGES){
  const card=el("giudici")?.querySelector('.judge-card[data-judge="'+j.id+'"]');
  const img=card?.querySelector('.judge-portrait img');
  const v=card?.querySelector('video.cat-reaction');
  if(v){
    v.onplaying=null;v.onended=null;v.onerror=null;
    v.pause();
    try{if(v.readyState>=1)v.currentTime=0;}catch(_){}
    v.style.opacity="0";
  }
  if(img){img.style.visibility="visible";}
 }
}
function playJudgeMotion(id){
 stopJudgeMotion();
 if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
 const card=el("giudici")?.querySelector('.judge-card[data-judge="'+id+'"]');
 const img=card?.querySelector('.judge-portrait img');
 const v=card?.querySelector('video.cat-reaction');
 if(!card||!img||!v)return;
 const seq=++motionSeq;
 function finish(){
   if(seq!==motionSeq)return;
   v.pause();
   v.style.opacity="0";
   img.style.visibility="visible";
   motionTimer=null;
 }
 v.onplaying=()=>{if(seq===motionSeq){v.style.opacity="1";img.style.visibility="hidden";}};
 v.onended=finish;
 v.onerror=finish;
 v.muted=true;
 try{v.currentTime=0;}catch(_){}
 const p=v.play();
 if(p&&typeof p.catch==="function")p.catch(finish);
 motionTimer=setTimeout(finish,5000);
}
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopJudgeMotion();});'''
s=s[:a]+repl+s[b:]
old='const src=JUDGES[i].img+"?v=16";'
assert old in s
s=s.replace(old,'const src=JUDGES[i].img+"?v=26";',1)
assert 'function selectIndex(i){stopJudgeMotion();' in s
assert 'playJudgeMotion(selected)' in s
assert 'GattoCheckin?.owned(id)' in s
assert 'function paid(id){return true;}' not in s
s=s.replace("Anteprima movimento gratuita. Supremo richiede SOLO un abbonamento attivo.","Supremo richiede un abbonamento attivo.")
s=s.replace("Anteprima movimento gratuita. I verdetti si sbloccano ogni 10 check-in consecutivi o con acquisto.","Sblocca il giudice con check-in consecutivi o con acquisto.")
app.write_text(s,encoding="utf-8")
html=(P/"index.html").read_text(encoding="utf-8")
html=re.sub(r'app\.js\?v=[0-9a-z.]+','app.js?v=26',html)
html=re.sub(r'movimento-v17\.css\?v=[0-9a-z.]+','movimento-v17.css?v=26',html)
html=html.replace('Tocca qualsiasi gatto per vedere il movimento, anche se il verdetto e bloccato.','Il giudice reagisce quando gli consegni una decisione.')
html=html.replace('Tocca qualsiasi gatto per vedere il movimento, anche se il verdetto è bloccato.','Il giudice reagisce quando gli consegni una decisione.')
assert 'checkin-section' in html and 'premium-bundle.js' in html
assert 'v22-personal-label' not in html
(P/"index.html").write_text(html,encoding="utf-8")
css=P/"movimento-v17.css"
css.write_text(css.read_text(encoding="utf-8")+'''
/* Real AI video motion. A still original portrait until a judgment is sent. */
.judge-portrait video.cat-reaction{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center center;opacity:0;pointer-events:none;z-index:3;transition:none!important;transform:none!important;animation:none!important;background:transparent}
.judge-card .judge-portrait img{animation:none!important;transform:none!important;transition:none!important}
''',encoding="utf-8")
for cat in cats:
    p=P/"img"/("gatto-"+cat+"-animato.webp")
    if p.exists():p.unlink()
billing=P/"premium-entry.js"
code=billing.read_text(encoding="utf-8")
# The V18 premium adapter already contains 4 one-time purchases and Supreme subscription.
assert "giudice_supremo_abbonamento" in code
assert "ProductType.PAID_SUBSCRIPTION" in code
assert "ProductType.NON_CONSUMABLE" in code
assert "j==='supremo'?ProductType.PAID_SUBSCRIPTION:ProductType.NON_CONSUMABLE" in code
config=Path("app-source/capacitor.config.json")
assert '"com.aivevia.gattogiudice"' in config.read_text()
assert 'com.aivevia.gattogiudice.personale' not in config.read_text()
print("PLAY V26 READY: commercial package, six real MP4, check-in unlocks, 4 individual items, Supremo subscription")
