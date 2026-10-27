#!/usr/bin/env python3
"""V27 Google Play: same real MP4s as personal, playback independent of verdict entitlements."""
from pathlib import Path
P=Path("app-source/www")
a=P/"app.js"
s=a.read_text(encoding="utf-8")
old='el("btn-giudica").disabled=busy||!paid(state.carattere)||n<=0;'
assert s.count(old)==1,"Could not locate disabled button commercial gate"
s=s.replace(old,'el("btn-giudica").disabled=busy;',1)
start=s.index("async function judge(text){")
stop=s.index(" try{\n  const ctl=new AbortController();",start)
existing=s[start:stop]
assert "if(busy||!paid(state.carattere))" in existing
assert "playJudgeMotion(selected);" in existing
new='''async function judge(text){
 if(busy){showRemaining();return;}
 // V27: a video preview costs nothing and can be watched even when
 // the judge is locked or today's server verdict quota is exhausted.
 // This NEVER authorizes or sends an AI verdict for a locked judge.
 const selected=state.carattere;
 playJudgeMotion(selected);
 if(!paid(selected)){
   el("fumetto").textContent=state.lingua==="it"
     ?"Questo gatto si muove, ma per ricevere il suo verdetto devi prima sbloccarlo."
     :"The cat can move, but you must unlock it to receive a verdict.";
   showRemaining();
   return;
 }
 if(localRemaining()<=0){
   el("fumetto").textContent=t("limit");
   showRemaining();
   return;
 }
 busy=true;showRemaining();el("fumetto").textContent=t("thinking");el("esito").hidden=true;
 const card=el("giudici").querySelector('[data-judge="'+selected+'"]');
'''
s=s[:start]+new+s[stop:]
assert s.count("playJudgeMotion(selected);")==1
assert "if(!paid(selected))" in s
assert "if(busy||!paid(state.carattere))" not in s
assert 'GattoCheckin?.owned(id)' in s
assert 'GattoPremium?.owned(id)' in s
assert 'function paid(id){return true;}' not in s
assert 'fetch(SERVER+"/giudica"' in s
s=s.replace('preload="none" disablepictureinpicture', 'preload="auto" disablepictureinpicture')
# Prevent premium background refresh from destroying the active video element.
old_listener='window.addEventListener("gatto-premium-update",()=>{drawCarousel();showRemaining();});'
assert s.count(old_listener)==1
s=s.replace(old_listener,'window.addEventListener("gatto-premium-update",()=>{if(motionTimer!==null){showRemaining();return;}drawCarousel();showRemaining();});',1)
a.write_text(s,encoding="utf-8")
html=P/"index.html"
h=html.read_text(encoding="utf-8")
h=h.replace('app.js?v=26','app.js?v=27')
h=h.replace('movimento-v17.css?v=26','movimento-v17.css?v=27')
html.write_text(h,encoding="utf-8")
for cat in ("dolce","severo","ironico","corrotto","pigro","supremo"):
    vid=P/"video"/(cat+".mp4")
    assert vid.is_file() and vid.stat().st_size>30000,vid
for expected in ('PAID_SUBSCRIPTION','NON_CONSUMABLE','giudice_supremo_abbonamento'):
    assert expected in (P/"premium-entry.js").read_text(encoding="utf-8")
print("V27 FIX VERIFIED: every cat previews natural MP4 on Consegna, locked verdicts remain gated")
