const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname,"../www/animazione.js"),"utf8");
const html = fs.readFileSync(path.join(__dirname,"../www/index.html"),"utf8");
const app = fs.readFileSync(path.join(__dirname,"../www/app.js"),"utf8");
const css = fs.readFileSync(path.join(__dirname,"../www/styles.css"),"utf8");

test("il sito mostra le tre fotografie reali da un unico file AVIF",()=>{
  const photo = fs.readFileSync(path.join(__dirname,"../www/img/gatti-esatti-2026.avif"));
  assert.ok(photo.length>10000);
  assert.equal(photo.toString("ascii",4,12),"ftypavif");
  assert.match(css,/gatti-esatti-2026\.avif/);
  assert.match(css,/background-size: 300% 100%/);
  assert.match(css,/data-carattere="severo"/);
  assert.match(css,/data-carattere="ironico"/);
  assert.match(html,/data-carattere="dolce"/);
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
