#!/usr/bin/env python3
"""Replace artificial animated WebP warps with six real generated MP4 cat performances."""
from pathlib import Path
import re
P=Path("app-source/www")
SIX=("dolce","severo","ironico","corrotto","pigro","supremo")
for cat in SIX:
    f=P/"video"/(cat+".mp4")
    assert f.is_file() and f.stat().st_size>20000, f
app=P/"app.js"
s=app.read_text()
start=s.index("function portraitMarkup(j,pos){")
endline='document.addEventListener("visibilitychange",()=>{if(document.hidden)stopJudgeMotion();});'
end=s.index(endline,start)+len(endline)
repl='''function portraitMarkup(j,pos){
 const original=j.img+"?v=25";
 const movie="video/"+j.id+".mp4?v=25";
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
s=s[:start]+repl+s[end:]
old='const src="img/gatto-"+JUDGES[i].id+"-static.webp?v=23";'
assert old in s
s=s.replace(old,'const src=JUDGES[i].img+"?v=25";')
assert "function paid(id){return true;}" in s
assert "playJudgeMotion(selected)" in s
assert "function selectIndex(i){stopJudgeMotion();" in s
assert s.count("function playJudgeMotion(id)") == 1
app.write_text(s)
page=P/"index.html";html=page.read_text()
html=html.replace("app.js?v=23","app.js?v=25").replace("movimento-v17.css?v=23","movimento-v17.css?v=25")
html=html.replace("V23 PERSONALE","V25 PERSONALE")
page.write_text(html)
styles=P/"movimento-v17.css"
css=styles.read_text()+"\n/* Real per-character AI video; no image warps, no CSS breathing, no loops. */\n.judge-portrait video.cat-reaction{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center center;opacity:0;pointer-events:none;z-index:3;transition:none!important;transform:none!important;animation:none!important;background:transparent}\n.judge-card .judge-portrait img{animation:none!important;transform:none!important;transition:none!important}\n"
styles.write_text(css)
for cat in SIX:
    animated=P/"img"/("gatto-"+cat+"-animato.webp")
    if animated.exists():animated.unlink()
print("V25 REAL MP4 REACTIONS INSTALLED",[(c,(P/"video"/(c+".mp4")).stat().st_size) for c in SIX])
