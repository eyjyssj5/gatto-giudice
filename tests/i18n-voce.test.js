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

test("la voce cambia tra Dolce Severo e Ironico quando sono disponibili modelli distinti",()=>{
  const available=[
    {key:"it_IT-paola-medium"},
    {key:"it_IT-riccardo-x_low"},
    {key:"it_IT-altro-low"}
  ];
  const sweet=VOCE.chooseVoice(available,"it","dolce");
  const strict=VOCE.chooseVoice(available,"it","severo");
  const ironic=VOCE.chooseVoice(available,"it","ironico");
  assert.equal(new Set([sweet,strict,ironic]).size,3);
  assert.equal(VOCE.chooseVoice([{key:"pt_PT-tugão-medium"}],"pt","severo"),"pt_PT-tugão-medium");
});

test("al cambio della lingua o del gatto la sessione singleton Piper viene ricreata",()=>{
  const fake={TtsSession:{_instance:{voiceId:"it_IT-paola-medium"}}};
  assert.equal(VOCE.resetSessionIfVoiceChanged(fake,"it_IT-paola-medium"),false);
  assert.equal(fake.TtsSession._instance.voiceId,"it_IT-paola-medium");
  assert.equal(VOCE.resetSessionIfVoiceChanged(fake,"es_ES-davefx-medium"),true);
  assert.equal(fake.TtsSession._instance,null);
});

test("l'app sblocca l'audio iPhone al tocco e parla automaticamente dopo il verdetto",()=>{
  const app=fs.readFileSync(path.join(__dirname,"../www/app.js"),"utf8");
  const voice=fs.readFileSync(path.join(__dirname,"../www/voce.js"),"utf8");
  assert.match(app,/GattoVoce\.prepare\(\)/);
  assert.match(app,/pronuncia\(frase\);/);
  assert.match(voice,/audioContext\.resume\(\)/);
  assert.match(voice,/voiceStage:type/);
});

test("lo stato vocale e i messaggi di errore sono tradotti in 12 lingue",()=>{
  for(const code of I18N.codes){
    for(const key of ["voicePreparing","voiceDownloading","voicePlayback","voiceSpeaking","voiceTapToListen","voiceRetry","voiceFirstDownload"]) {
      assert.ok(I18N.MESSAGES[code][key] && I18N.MESSAGES[code][key].length>10,code+"/"+key);
    }
    assert.ok(I18N.text(code,"voiceDownloading",{n:48}).includes("48"),code);
  }
});
