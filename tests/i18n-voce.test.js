const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const I18N=require("../www/i18n.js");
const VOCE=require("../www/voce.js");

test("dodici lingue dell'interfaccia complete e localizzabili",()=>{
  assert.deepEqual(I18N.codes,["it","es","en","pt","fr","de","nl","pl","ru","tr","ar","zh"]);
  const keys=Object.keys(I18N.MESSAGES.it);
  for(const language of I18N.codes){
    const values=I18N.MESSAGES[language];
    for(const key of keys){
      assert.equal(typeof values[key],"string",language+"/"+key);
      assert.ok(values[key].trim().length>0,language+"/"+key);
    }
    assert.ok(I18N.text(language,"remaining",{n:3}).includes("3"));
    assert.ok(I18N.text(language,"stats",{yes:2,no:1,total:3}).includes("3"));
  }
  assert.equal(I18N.normalize("pt-PT"),"pt");
  assert.equal(I18N.normalize("ar-SA"),"ar");
  assert.equal(I18N.normalize("xx"),"it");
});

test("dodici lingue supportate dal catalogo Piper e tre personalita' disponibili",()=>{
  assert.deepEqual(Object.keys(VOCE.LOCALES),I18N.codes);
  assert.deepEqual(Object.keys(VOCE.PRESETS),["dolce","severo","ironico"]);
  for(const language of I18N.codes){
    assert.ok(VOCE.chooseVoice({
      [VOCE.LOCALES[language]+"-qualcuno-x_low"]: {},
      [VOCE.LOCALES[language]+"-qualcuno-medium"]: {}
    },language).endsWith("-medium"),language);
  }
  assert.equal(VOCE.chooseVoice({}, "it"),null);
});

test("l'app richiama Piper su richiesta e non impone la voce Siri",()=>{
  const app=fs.readFileSync(path.join(__dirname,"../www/app.js"),"utf8");
  const html=fs.readFileSync(path.join(__dirname,"../www/index.html"),"utf8");
  assert.match(app,/GattoVoce\.speak/);
  assert.match(app,/lingua: I18N\.normalize\(stato\.lingua\)/);
  assert.doesNotMatch(app,/speechSynthesis|SpeechSynthesisUtterance/);
  assert.match(html,/src="i18n.js/);
  assert.match(html,/src="voce.js/);
  for(const key of I18N.codes) assert.ok(html.includes('value="'+key+'"'),key);
  for(const cat of ["dolce","severo","ironico"])assert.ok(html.includes('data-carattere="'+cat+'"'));
  assert.match(app,/gatto-" \+ stato\.carattere \+ "-esatto\.webp"/);
});
