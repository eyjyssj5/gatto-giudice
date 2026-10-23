from pathlib import Path
import argparse, json, re
P=Path('app-source/www')
parser=argparse.ArgumentParser();parser.add_argument('--edition',choices=['personal','play'],required=True);a=parser.parse_args()
p=P/'app.js';s=p.read_text()
# The V21 motion WebP must NEVER start just by showing a cat.
pattern=r'function portraitMarkup\(j,pos\)\{[\s\S]*?\n\}'
replacement='''function portraitMarkup(j,pos){
 return '<span class="judge-portrait"><img alt="" loading="'+(pos==="center"?"eager":"lazy")+'" src="'+j.img+'?v=16"></span>';
}
let motionTimer=null;
let motionSeq=0;
function stopJudgeMotion(){
 motionSeq++;
 if(motionTimer!==null){clearTimeout(motionTimer);motionTimer=null;}
 for(const [i,j] of JUDGES.entries()){
   const img=el("giudici")?.querySelector('.judge-card[data-judge="'+j.id+'"] .judge-portrait img');
   if(img){const normal=j.img+"?v=16";if(img.getAttribute("src")!==normal)img.setAttribute("src",normal);}
 }
}
function playJudgeMotion(id){
 stopJudgeMotion();
 if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
 const cat=JUDGES.find(j=>j.id===id);
 const img=el("giudici")?.querySelector('.judge-card[data-judge="'+id+'"] .judge-portrait img');
 if(!cat||!img)return;
 const sequence=++motionSeq;
 img.setAttribute("src","img/gatto-"+id+"-animato.webp?v=22&play="+Date.now());
 motionTimer=setTimeout(()=>{
  if(sequence!==motionSeq)return;
  if(img.isConnected)img.setAttribute("src",cat.img+"?v=16");
  motionTimer=null;
 },4010);
}
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopJudgeMotion();});'''
s,n=re.subn(pattern,lambda m:replacement,s,count=1)
assert n==1,'V21 portraitMarkup not found'
old='const animated=pos==="center"&&!reduce;'
assert old in s,'V21 renderJudges position logic not found'
s=s.replace(' const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;\n const animated=pos==="center"&&!reduce;\n const src=animated?("img/gatto-"+JUDGES[i].id+"-animato.webp?v=20"):(JUDGES[i].img+"?v=16");',' const src=JUDGES[i].img+"?v=16";',1)
assert 'const src=JUDGES[i].img+"?v=16";' in s
target='function selectIndex(i){index=point(i);'
assert target in s
s=s.replace(target,'function selectIndex(i){stopJudgeMotion();index=point(i);',1)
target='const selected=state.carattere;const card=el("giudici").querySelector(\'[data-judge="\'+selected+\'"]\');card?.classList.add("deciding");'
assert target in s,'Judge action hook not found'
s=s.replace(target,'const selected=state.carattere;playJudgeMotion(selected);const card=el("giudici").querySelector(\'[data-judge="\'+selected+\'"]\');',1)
s=s.replace("Tocca qualsiasi gatto per vedere il movimento, anche se il verdetto è bloccato.","Il gatto reagisce quando invii la decisione.")
s=s.replace("Tap any cat to preview its movement even when its verdict is locked.","The selected cat reacts when you submit your decision.")
if a.edition=='personal':
 target='function paid(id){return id===\'dolce\'||Boolean(window.GattoCheckin?.owned(id))||Boolean(window.GattoPremium?.owned(id));}'
 assert target in s,'Paid function not found'
 s=s.replace(target,'function paid(id){return true;}')
p.write_text(s)
css=P/'movimento-v17.css'
css.write_text('''/* V22: static framed cats; one short inner-cat reaction ONLY on verdict submission. */
.judge-card[data-position="center"] .judge-portrait,
.judge-card[data-position="center"][data-judge="severo"] .judge-portrait,
.judge-card[data-position="center"][data-judge="ironico"] .judge-portrait{animation:none!important}
.judge-card .judge-portrait img{animation:none!important;transform:none!important;will-change:auto!important}
.judge-card[data-position="center"].deciding{animation:none!important}
.judge-card[data-position="center"].deciding .judge-portrait:before{content:none!important;animation:none!important}
.judge-card.is-locked .judge-portrait:after{display:none!important}
.judge-card .lock{top:auto!important;bottom:8px!important;right:8px!important;font-size:14px!important;width:26px!important;height:26px!important}
''')
h=P/'index.html';html=h.read_text()
html=re.sub(r'app\.js\?v=[0-9.]+','app.js?v=22',html)
html=re.sub(r'movimento-v17\.css\?v=[0-9.]+','movimento-v17.css?v=22',html)
if a.edition=='personal':
 html=html.replace('<script src="premium-bundle.js?v=play16"></script>','')
 html=html.replace('<main class="app-shell">','<main class="app-shell"><div class="v22-personal-label" role="status">VERSIONE PERSONALE · TUTTI I 6 GIUDICI SBLOCCATI</div>',1)
 html=html.replace('</head>','<style>.checkin-section{display:none!important}.v22-personal-label{padding:8px 14px;background:#25604c;color:white;text-align:center;font:700 12px sans-serif;letter-spacing:.06em}</style></head>',1)
h.write_text(html)
if a.edition=='personal':
 config=Path('app-source/capacitor.config.json');obj=json.loads(config.read_text())
 obj['appId']='com.aivevia.gattogiudice.personale'
 obj['appName']='Gatto Giudice PERSONALE'
 config.write_text(json.dumps(obj,ensure_ascii=False))
# sanity checks
assert 'function playJudgeMotion(id)' in s
assert 'playJudgeMotion(selected)' in s
assert 'cat.id+"-animato.webp' not in s
assert 'function portraitMarkup(j,pos)' in s
assert 'img/gatto-"+id+"-animato.webp' in s
if a.edition=='personal':assert 'function paid(id){return true;}' in s
for name in ('dolce','severo','ironico','corrotto','pigro','supremo'):
 p=P/'img'/('gatto-'+name+'-animato.webp')
 assert p.exists() and p.stat().st_size>50000,p
print('V22 READY:',a.edition,'six fixed portraits; short motion on submit; no looping at rest')
