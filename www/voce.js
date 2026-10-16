/* Piper TTS sperimentale, avviato su richiesta. Nessuna voce di Siri.
 * Il modello gratuito si scarica nel browser/WebView tramite piper-tts-web,
 * senza installare un'app esterna. La compatibilita' con iOS/Android e le
 * licenze delle singole voci vanno certificate prima della pubblicazione.
 */
(function(root) {
 "use strict";
 const PIPER_MODULE="https://esm.sh/@mintplex-labs/piper-tts-web@1.0.5?bundle";
 const LOCALES=Object.freeze({
   it:"it_IT",es:"es_ES",en:"en_US",pt:"pt_PT",fr:"fr_FR",de:"de_DE",
   nl:"nl_NL",pl:"pl_PL",ru:"ru_RU",tr:"tr_TR",ar:"ar_JO",zh:"zh_CN"
 });
 const PRESETS=Object.freeze({
   dolce:{rate:1.16},    // un po' piu' acuto, voce buffa
   severo:{rate:0.85},   // un po' piu' profondo
   ironico:{rate:1.07}   // leggermente vivace
 });
 let modulePromise=null;
 let audio=null, activeUrl=null, audioContext=null, sourceNode=null, busy=false, selected=null;
 const voiceByLocale=new Map();

 async function getModule() {
   if (!modulePromise) modulePromise=import(PIPER_MODULE).catch(e=>{modulePromise=null;throw e;});
   const mod=await modulePromise;
   if(typeof mod.predict!=="function" || typeof mod.voices!=="function")
     throw new Error("Libreria vocale Piper non disponibile.");
   return mod;
 }
 function normalizeLocale(code) {
   const s=String(code||"it").toLowerCase().slice(0,2);
   return Object.hasOwn(LOCALES,s)?s:"it";
 }
 function chooseVoice(available,language) {
   const code=LOCALES[normalizeLocale(language)];
   const list=Array.isArray(available)
     ? available.map(v=>typeof v==="string"?v:(v.key||v.id||v.voiceId||""))
     : Object.keys(available||{});
   const eligible=list.filter(id=>id.toLowerCase().startsWith(code.toLowerCase()+"-"));
   if(!eligible.length) return null;
   // I modelli di qualita' media sono preferiti se disponibili.
   eligible.sort((a,b)=>{
     const score=x=>(/-medium$/i.test(x)?0:/-low$/i.test(x)?1:2);
     return score(a)-score(b) || a.localeCompare(b);
   });
   return eligible[0];
 }
 async function getVoice(language) {
   const locale=normalizeLocale(language);
   if(voiceByLocale.has(locale))return voiceByLocale.get(locale);
   const tts=await getModule();
   const chosen=chooseVoice(await tts.voices(),locale);
   if(!chosen)throw new Error("Nessuna voce Piper disponibile per "+locale);
   voiceByLocale.set(locale,chosen);
   return chosen;
 }
 function stop() {
   if(sourceNode) { sourceNode.onended=null;try{sourceNode.stop();}catch(_err){};sourceNode.disconnect();sourceNode=null; }
   if(audio){audio.pause();audio.onended=null;audio.onerror=null;audio=null;}
   if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null;}
   if(selected && selected.onEnd)selected.onEnd();
   selected=null;
 }
 async function speak(text,language,character,hooks={}) {
   if(busy)return false;
   stop();
   busy=true;
   // Apriamo il dispositivo audio SUBITO, nel gesto dell'utente:
   // iOS puo' bloccare un play() avviato dopo un download asincrono.
   const Context=root.AudioContext||root.webkitAudioContext;
   if(Context && !audioContext)audioContext=new Context();
   if(audioContext && audioContext.state==="suspended")audioContext.resume().catch(()=>{});
   const id=Symbol("voce");
   selected={id,onEnd:hooks.onEnd};
   try {
     hooks.onProgress?.("loading");
     const voiceId=await getVoice(language);
     const tts=await getModule();
     // Il catalogo di modelli e' online, il WAV viene prodotto in locale.
     const wav=await tts.predict({text:String(text).slice(0,240),voiceId});
     if(!selected || selected.id!==id)return false;
     if(!(wav instanceof Blob))throw new Error("Piper non ha restituito un audio");
     if(audioContext) {
       const bytes=await wav.arrayBuffer();
       const buffer=await audioContext.decodeAudioData(bytes.slice(0));
       if(!selected || selected.id!==id)return false;
       const source=audioContext.createBufferSource();
       source.buffer=buffer;
       source.playbackRate.value=PRESETS[character]?.rate||1;
       source.connect(audioContext.destination);
       source.onended=()=>{if(selected?.id===id)stop();};
       sourceNode=source;
       await audioContext.resume();
       source.start();
     } else {
       // Fallback audio HTML5, senza usare la voce del sistema operativo.
       activeUrl=URL.createObjectURL(wav);
       audio=new Audio(activeUrl);
       audio.preservesPitch=false;
       audio.webkitPreservesPitch=false;
       audio.playbackRate=PRESETS[character]?.rate||1;
       audio.onended=()=>{if(selected?.id===id)stop();};
       audio.onerror=()=>{if(selected?.id===id)stop();hooks.onError?.();};
       await audio.play();
     }
     hooks.onStart?.();
     return true;
   } catch(error) {
     if(selected?.id===id){stop();hooks.onError?.(error);}
     return false;
   } finally {busy=false;}
 }
 const api={speak,stop,chooseVoice,normalizeLocale,isBusy:()=>busy,LOCALES,PRESETS};
 if(typeof module==="object" && module.exports)module.exports=api;
 else root.GattoVoce=api;
})(typeof window!=="undefined"?window:globalThis);
