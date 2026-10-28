#!/usr/bin/env python3
"""V28 Play: move the visible action right below the cat and dismiss the keyboard on submit.
Keep the existing V27 source button in its form to preserve its listeners and billing guards.
"""
from pathlib import Path
import re
P=Path("app-source/www")
p=P/"index.html"
h=p.read_text(encoding="utf-8")
anchor='<div class="carousel-controls">'
assert h.count(anchor)==1, "The cat carousel controls are missing"
assert 'id="btn-giudica"' in h and 'id="giudici"' in h
# Put the hint BELOW the new action, not between the portrait and the action.
hint=re.search(r'<p\s+class="cat-preview-tip"[^>]*>.*?</p>\s*',h,re.S)
txt=hint.group(0) if hint else ""
if hint:
    h=h[:hint.start()]+h[hint.end():]
h=h.replace(anchor,'<div id="v28-consegna-slot" class="v28-consegna-slot"></div>\n'+txt+anchor,1)
assert h.count('id="v28-consegna-slot"')==1
h=h.replace("</head>",'<link rel="stylesheet" href="consegna-v28.css?v=28">\n</head>',1)
assert "</body>" in h
h=h.replace("</body>",'<script src="consegna-v28.js?v=28"></script>\n</body>',1)
h=h.replace("app.js?v=27","app.js?v=28").replace("movimento-v17.css?v=27","movimento-v17.css?v=28")
p.write_text(h,encoding="utf-8")
(P/"consegna-v28.css").write_text("""
/* The action is immediately beneath the judge, ahead of microphone, check-in and inputs. */
#v28-consegna-slot{display:flex;align-items:center;justify-content:center;position:relative;z-index:20;margin:0 12px 8px;padding:0 0 3px;min-height:52px}
#v28-consegna-button{display:block;box-sizing:border-box;width:min(100%,360px);min-height:48px;appearance:none;-webkit-appearance:none;border:1px solid #91622a;border-radius:12px;padding:12px 18px;background:#8b5421;color:#fffdf8;font-weight:800;font-size:16px;line-height:1.25;text-align:center;cursor:pointer;box-shadow:0 2px 5px #0002;touch-action:manipulation}
#v28-consegna-button:active{filter:brightness(.9)}
#v28-consegna-button:focus-visible{outline:3px solid #2a6fbc;outline-offset:2px}
#v28-consegna-button:disabled{opacity:.55;cursor:wait}
#btn-giudica.v28-submit-source-hidden{display:none!important}
@media(max-width:420px){#v28-consegna-slot{margin:0 8px 6px}#v28-consegna-button{min-height:48px;font-size:15px}}
""",encoding="utf-8")
(P/"consegna-v28.js").write_text(r"""
/* V28: original V27 form button continues to process verdicts and all purchase restrictions. */
(()=>{
"use strict";
const install=()=>{
  const original=document.getElementById("btn-giudica");
  const slot=document.getElementById("v28-consegna-slot");
  if(!original||!slot||document.getElementById("v28-consegna-button"))return;
  const visible=document.createElement("button");
  visible.type="button";
  visible.id="v28-consegna-button";
  const sync=()=>{
    visible.textContent=(original.textContent||"").trim()||"Consegna al gatto";
    visible.disabled=Boolean(original.disabled);
    visible.setAttribute("aria-label",visible.textContent);
  };
  sync();
  const watcher=new MutationObserver(sync);
  watcher.observe(original,{subtree:true,characterData:true,childList:true,attributes:true,attributeFilter:["disabled"]});
  original.classList.add("v28-submit-source-hidden");
  original.tabIndex=-1;
  original.setAttribute("aria-hidden","true");
  slot.appendChild(visible);
  visible.addEventListener("click",()=>{
    if(original.disabled)return;
    const active=document.activeElement;
    if(active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))active.blur();
    // Clicking the original element retains all the commercial handlers.
    original.click();
    // Reposition the cat after the mobile keyboard has collapsed.
    window.setTimeout(()=>{
      const cat=document.getElementById("giudici");
      if(cat && typeof cat.scrollIntoView==="function"){
        cat.scrollIntoView({block:"center",behavior:"smooth"});
      }
    },160);
  });
};
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",install,{once:true});
}else{install();}
})();
""",encoding="utf-8")
assert 'id="v28-consegna-slot"' in h and 'consegna-v28.js?v=28' in h
assert 'premium-bundle.js' in h and 'checkin-section' in h
assert 'id="btn-giudica"' in h
assert 'function paid(id){return true;}' not in (P/"app.js").read_text(encoding="utf-8")
print("V28 VERIFIED: relocated button, keyboard dismiss, preserved checkin and purchase handling")
