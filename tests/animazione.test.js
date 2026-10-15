const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname,"../www/animazione.js"),"utf8");
const html = fs.readFileSync(path.join(__dirname,"../www/index.html"),"utf8");
const app = fs.readFileSync(path.join(__dirname,"../www/app.js"),"utf8");
const css = fs.readFileSync(path.join(__dirname,"../www/styles.css"),"utf8");

test("il sito usa esattamente le tre fotografie distinte",()=>{
  const photo = fs.readFileSync(path.join(__dirname,"../www/img/gatti-esatti-2026.avif"));
  assert.ok(photo.length>10000);
  assert.equal(photo.toString("ascii",4,12),"ftypavif");
  assert.match(html,/gatto-dolce-esatto\.webp/);
  assert.match(app,/gatto-" \+ stato\.carattere \+ "-esatto\.webp"/);
  for(const nome of ["dolce","severo","ironico"]) {
    const img=fs.readFileSync(path.join(__dirname,"../www/img/gatto-"+nome+"-esatto.webp"));
    assert.ok(img.length > 20000, nome);
    assert.equal(img.toString("ascii",0,4),"RIFF");
    assert.equal(img.toString("ascii",8,12),"WEBP");
  }
  assert.doesNotMatch(src,/rig-svg|createElement\("svg"\)/);
  assert.match(app,/GattoAnimato\.aggiorna\(stato\.carattere\)/);
});

test("i pulsanti aggiornano il carattere e la voce gestisce la classe parlante",()=>{
  const classes = new Set();
  const figura = {
    dataset: {carattere:"dolce"},
    classList: {
      add(x){classes.add(x)},
      remove(x){classes.delete(x)},
      toggle(x,b){if(b)classes.add(x);else classes.delete(x)}
    }
  };
  const window={};
  vm.runInNewContext(src,{window,document:{getElementById(id){
    return id==="gatto"?{}:id==="gatto-figura"?figura:null;
  }}});
  const a=window.GattoAnimato;
  a.aggiorna("severo");assert.equal(figura.dataset.carattere,"severo");
  a.aggiorna("ironico");assert.equal(figura.dataset.carattere,"ironico");
  a.aggiorna("dolce");assert.equal(figura.dataset.carattere,"dolce");
  a.parla();assert.equal(classes.has("parlante"),true);
  a.ferma();assert.equal(classes.has("parlante"),false);
  a.pensa(true);assert.equal(classes.has("pensando"),true);
  a.pensa(false);assert.equal(classes.has("pensando"),false);
});

test("non esiste la vecchia vibrazione rapida",()=>{
  assert.doesNotMatch(css,/gatto-parla \.22s|rig-svg/);
  assert.match(css,/gatto-respira 6\.8s/);
  assert.match(css,/prefers-reduced-motion/);
});
