const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname,"../www/animazione.js"),"utf8");
const html = fs.readFileSync(path.join(__dirname,"../www/index.html"),"utf8");
const app = fs.readFileSync(path.join(__dirname,"../www/app.js"),"utf8");
const css = fs.readFileSync(path.join(__dirname,"../www/styles.css"),"utf8");

test("l'app usa le tre fotografie del gatto giudice, non gatti sostitutivi",()=>{
  assert.match(html, /gatto-dolce-giudice\.svg/);
  assert.match(app, /gatto-" \+ stato\.carattere \+ "-giudice\.svg"/);
  assert.doesNotMatch(src, /rig-svg|createElement\("svg"\)/);
  for(const type of ["dolce","severo","ironico"]) {
    const svg = fs.readFileSync(path.join(__dirname,"../www/img/gatto-"+type+"-giudice.svg"),"utf8");
    assert.match(svg,/^<\?xml[^]*<svg/);
    assert.match(svg, new RegExp("Gatto giudice "+type));
    assert.match(svg,/href="data:image\/webp;base64,UklG/);
    assert.match(svg,/<\/svg>/);
  }
});

test("il GattoAnimato risponde a parla/ferma/aggiorna senza coprire le foto",()=>{
  const classes = new Set();
  const figura = {classList:{
    add(x){classes.add(x)},
    remove(x){classes.delete(x)},
    toggle(x,b){if(b)classes.add(x);else classes.delete(x)}
  }};
  const window = {};
  vm.runInNewContext(src,{window,document:{getElementById(id){
    return id==="gatto"?{}:id==="gatto-figura"?figura:null;
  }}});
  const a=window.GattoAnimato;
  a.parla();assert.equal(classes.has("parlante"),true);
  a.ferma();assert.equal(classes.has("parlante"),false);
  a.pensa(true);assert.equal(classes.has("pensando"),true);
  a.aggiorna();assert.equal(classes.has("animazione-pronta"),false);
  a.pensa(false);assert.equal(classes.has("pensando"),false);
});

test("nessuna vibrazione veloce; foto a larghezza mobile",()=>{
  assert.doesNotMatch(css,/gatto-parla \.22s|rig-svg/);
  assert.match(css,/gatto-respira 6\.8s/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css, /object-fit: contain/);
});
