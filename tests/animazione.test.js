const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sorgente = fs.readFileSync(path.join(__dirname, "../www/animazione.js"), "utf8");

function creaPagina() {
  let src = "img/gatto-dolce.png";
  const disegni = [];
  let svgCorrente = null;
  const figura = {
    classList: {add(){}, remove(){}, toggle(){}},
    appendChild(el){ svgCorrente = el; disegni.push(el.html); },
    querySelector(){ return null; }
  };
  const foto = {getAttribute(k){return k==="src"?src:null;}};
  const canvas = {hidden:false};
  let valore = 100;
  const win = {
    performance:{now(){return valore++}},
    matchMedia(){return {matches:false}},
    setTimeout(){return 9}, clearTimeout(){},
    requestAnimationFrame(){return 10}, cancelAnimationFrame(){}
  };
  const documento = {
    getElementById(id) { return id==="gatto"?foto:id==="gatto-figura"?figura:id==="gatto-animato"?canvas:null; },
    createElement(){return {
      set innerHTML(s){this.s = s;},
      get firstElementChild(){return {html:this.s, remove(){ if(svgCorrente) svgCorrente = null; }};}
    };}
  };
  vm.runInNewContext(sorgente, {window:win, document:documento});
  return {win, setCarattere(x){src = "img/gatto-"+x+".png";win.GattoAnimato.aggiorna()},disegni,canvas};
}

test("i tre nuovi gatti sono SVG con testa, occhi, orecchie, muso e mandibola indipendenti",()=>{
  const pagina = creaPagina();
  for(const nome of ["dolce","severo","ironico"]) {
    pagina.setCarattere(nome);
    const s = pagina.disegni.at(-1);
    for(const parte of ["rig-testa","rig-occhi","rig-palpebre","rig-mandibola","rig-bocca","rig-tail","rig-braccio"])
      assert.ok(s.includes('class="'+parte+'"'),parte+" "+nome);
    assert.ok(s.includes('aria-label="Gatto giudice '+nome.toUpperCase()));
    assert.ok(!/@(NAME|FUR|LIGHT|DARK|BROW|BROWS|EYE|INNER|STRIPES|CHEST)@/.test(s),"placeholder rimasto");
  }
  assert.equal(pagina.canvas.hidden,true);
});

test("si puo' parlare, scandire parole, smettere e passare tra i tre personaggi senza errore",()=>{
  const pagina = creaPagina();
  const a = pagina.win.GattoAnimato;
  a.parla();
  a.parola();
  pagina.setCarattere("severo");
  a.parola();
  pagina.setCarattere("ironico");
  a.ferma();
  a.pensa(true);
  a.pensa(false);
  assert.equal(pagina.disegni.length,3);
});

test("nessuna vecchia animazione a vibrazione e supporto riduzione movimento",()=>{
  const css = fs.readFileSync(path.join(__dirname, "../www/styles.css"), "utf8");
  assert.ok(!css.includes("gatto-parla .22s"));
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/rig-testa-parla/);
});
