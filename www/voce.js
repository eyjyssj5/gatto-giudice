/* Piper TTS sperimentale, avviato su richiesta. Nessuna voce di Siri.
 * Il modello gratuito si scarica nel browser/WebView tramite piper-tts-web,
 * senza installare un'app esterna. La compatibilita' con iOS/Android e le
 * licenze delle singole voci vanno certificate prima della pubblicazione.
 */
(function(root) {
 "use strict";
 const PIPER_MODULE="./vendor/piper.js";
 // L'originaria URL cdnjs ONNX 1.18 non contiene ort-wasm-simd-threaded.mjs:
 // era il 404 che rendeva Piper completamente muto.
 // Il runtime WebAssembly viene caricato da un pacchetto npm pubblico completo.
 const WASM_PATHS=Object.freeze({
   onnxWasm:"https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.1/dist/",
   piperData:"https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data",
   piperWasm:"https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm"
 });
 const SYSTEM_LANGUAGES=Object.freeze({
   it:"it-IT",es:"es-ES",en:"en-US",pt:"pt-PT",fr:"fr-FR",de:"de-DE",
   nl:"nl-NL",pl:"pl-PL",ru:"ru-RU",tr:"tr-TR",ar:"ar-SA",zh:"zh-CN"
 });
 const SYSTEM_PROFILES=Object.freeze({
   dolce:{pitch:1.34,rate:1.06},
   severo:{pitch:0.73,rate:0.88},
   ironico:{pitch:1.12,rate:1.15}
 });
 function usesSystemVoice() {
   // Fallback temporaneo: inferenza Piper mobile troppo pesante, interfaccia
   // deve restare pronta. Si lascia Piper per il browser desktop.
   return /iPhone|iPad|iPod|Android/i.test(root.navigator?.userAgent||"") &&
     typeof root.speechSynthesis!=="undefined" &&
     typeof root.SpeechSynthesisUtterance==="function";
 }
 let nativeBusy=false;
 let nativeUtterance=null;
 let nativeTimeout=null;
 function clearNative() {
   if(nativeTimeout){clearTimeout(nativeTimeout);nativeTimeout=null;}
   if(nativeUtterance){
     nativeUtterance.onstart=null;
     nativeUtterance.onend=null;
     nativeUtterance.onerror=null;
     nativeUtterance=null;
   }
   nativeBusy=false;
   try {root.speechSynthesis?.cancel();}catch(_err){}
 }
 function speakSystem(text,language,character,hooks={}) {
   // Questa funzione viene chiamata sincronicamente dal click dell'utente,
   // condizione necessaria per le policy iOS di avvio audio.
   clearNative();
   const lang=SYSTEM_LANGUAGES[normalizeLocale(language)];
   const profile=SYSTEM_PROFILES[character]||SYSTEM_PROFILES.dolce;
   try {
     const utterance=new root.SpeechSynthesisUtterance(String(text).trim().slice(0,240));
     utterance.lang=lang;
     utterance.pitch=profile.pitch;
     utterance.rate=profile.rate;
     utterance.volume=1;
     const voices=root.speechSynthesis.getVoices();
     const candidates=voices.filter(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));
     if(candidates.length)utterance.voice=candidates[character==="severo" ? Math.min(1,candidates.length-1) : character==="ironico" ? candidates.length-1 : 0];
     nativeBusy=true;
     nativeUtterance=utterance;
     hooks.onProgress?.("playback");
     utterance.onstart=()=>{
       if(nativeUtterance!==utterance)return;
       if(nativeTimeout){clearTimeout(nativeTimeout);nativeTimeout=null;}
       hooks.onProgress?.("speaking");
       hooks.onStart?.();
     };
     utterance.onend=()=>{
       if(nativeUtterance!==utterance)return;
       clearNative();
       hooks.onEnd?.();
     };
     utterance.onerror=(event)=>{
       if(nativeUtterance!==utterance)return;
       clearNative();
       hooks.onError?.(Object.assign(new Error("Sintesi del telefono non disponibile"),{voiceStage:event?.error||"system"}));
     };
     // Alcune versioni Safari falliscono senza chiamare onstart/onerror.
     nativeTimeout=setTimeout(()=>{
       if(nativeUtterance===utterance && !root.speechSynthesis.speaking) {
         clearNative();
         hooks.onError?.(Object.assign(new Error("Il dispositivo non ha avviato la voce"),{voiceStage:"systemtimeout"}));
       }
     },6000);
     root.speechSynthesis.cancel();
     root.speechSynthesis.speak(utterance);
     return Promise.resolve(true);
   }catch(error) {
     clearNative();
     hooks.onError?.(Object.assign(error instanceof Error?error:new Error(String(error)),{voiceStage:"system"}));
     return Promise.resolve(false);
   }
 }
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
 let phase="idle";
 let audio=null, activeUrl=null, audioContext=null, sourceNode=null, busy=false, selected=null, unlocked=false;
 const voiceByLocale=new Map();

 async function getModule() {
   if (!modulePromise) {
     modulePromise=import(PIPER_MODULE).catch(error=>{
       modulePromise=null;
       throw Object.assign(new Error("Impossibile caricare il motore vocale. Controlla Internet."),{code:"library",cause:error});
     });
   }
   const mod=await modulePromise;
   if(typeof mod.TtsSession!=="function" || typeof mod.voices!=="function")
     throw Object.assign(new Error("La libreria vocale non è compatibile."),{code:"library"});
   return mod;
 }
 function prepare() {
   // La preparazione DEVE avvenire direttamente al tocco del pulsante,
   // altrimenti Safari iOS puo' impedire la riproduzione al termine della rete.
   try {
     const Context=root.AudioContext||root.webkitAudioContext;
     if(!Context)return false;
     if(!audioContext)audioContext=new Context();
     if(audioContext.state==="suspended")audioContext.resume().catch(()=>{});
     // Riproduci un frame silenzioso durante il gesto per abilitare l'audio futuro.
     const buffer=audioContext.createBuffer(1,1,22050);
     const source=audioContext.createBufferSource();
     source.buffer=buffer;
     source.connect(audioContext.destination);
     source.start();
     unlocked=true;
     return true;
   } catch(error) {
     return false;
   }
 }
 function normalizeLocale(code) {
   const s=String(code||"it").toLowerCase().slice(0,2);
   return Object.hasOwn(LOCALES,s)?s:"it";
 }
 function chooseVoice(available,language,character="dolce") {
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
   // Caratteri differenti usano modelli differenti dove il catalogo li offre.
   // Dove c'e' un solo modello, la differenza e' nella velocita'/altezza.
   if(character==="severo") return eligible[Math.min(1,eligible.length-1)];
   if(character==="ironico") return eligible[eligible.length>2?2:0];
   return eligible[0];
 }
 async function getVoice(language,character) {
   const locale=normalizeLocale(language);
   const key=locale+"/"+character;
   if(voiceByLocale.has(key))return voiceByLocale.get(key);
   const tts=await getModule();
   const chosen=chooseVoice(await tts.voices(),locale,character);
   if(!chosen)throw new Error("Nessuna voce Piper disponibile per "+locale);
   voiceByLocale.set(key,chosen);
   return chosen;
 }
 function resetSessionIfVoiceChanged(tts, voiceId) {
   // piper-tts-web@1.0.5 ha una sessione ONNX singleton.
   // Senza questo reset cambiare lingua pronuncia con il modello precedente.
   const Session=tts.TtsSession;
   if(!Session || !("_instance" in Session))return false;
   if(Session._instance && Session._instance.voiceId!==voiceId) {
     Session._instance=null;
     return true;
   }
   return false;
 }
 function stop() {
   clearNative();
   if(sourceNode) { sourceNode.onended=null;try{sourceNode.stop();}catch(_err){};sourceNode.disconnect();sourceNode=null; }
   if(audio){audio.pause();audio.onended=null;audio.onerror=null;audio=null;}
   if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null;}
   if(selected && selected.onEnd)selected.onEnd();
   selected=null;
 }
 async function speak(text,language,character,hooks={}) {
   if(usesSystemVoice())return speakSystem(text,language,character,hooks);
   if(busy) return false;
   stop();
   busy=true;
   const id=Symbol("voce");
   selected={id,onEnd:hooks.onEnd};
   const report=(value)=>{phase=value;hooks.onProgress?.(value);};
   try {
     if(!unlocked) prepare();
     report("loading");
     const voiceId=await getVoice(language,character);
     if(!selected || selected.id!==id)return false;
     const tts=await getModule();
     resetSessionIfVoiceChanged(tts,voiceId);
     report("download");
     // La funzione predict() generale usa un percorso ONNX rotto.
     // Creando TtsSession direttamente indichiamo un URL WASM valido.
     const session=new tts.TtsSession({
       voiceId,
       wasmPaths:WASM_PATHS,
       progress:(progress)=>{
         if(selected?.id===id && progress?.total>0){
           const percent=Math.min(100,Math.max(0,Math.round(progress.loaded/progress.total*100)));
           report("download:"+percent);
         }
       }
     });
     const wav=await session.predict(String(text).trim().slice(0,240));
     if(!selected || selected.id!==id)return false;
     if(!(wav instanceof Blob) || wav.size<44)
       throw Object.assign(new Error("La sintesi vocale non ha creato l'audio."),{code:"synthesis"});
     report("playback");
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
       source.start(0);
     } else {
       activeUrl=URL.createObjectURL(wav);
       audio=new Audio(activeUrl);
       audio.preservesPitch=false;
       audio.webkitPreservesPitch=false;
       audio.playbackRate=PRESETS[character]?.rate||1;
       audio.onended=()=>{if(selected?.id===id)stop();};
       audio.onerror=()=>{if(selected?.id===id){const err=Object.assign(new Error("Errore durante l'audio"),{code:"playback"});stop();hooks.onError?.(err);}};
       await audio.play();
     }
     report("speaking");
     hooks.onStart?.();
     return true;
   } catch(error) {
     if(selected?.id===id){
       // Non ignoriamo silenziosamente gli errori Piper: li mostra la UI.
       const type=error?.code || (phase.startsWith("download")?"download":phase);
       stop();
       hooks.onError?.(Object.assign(error instanceof Error?error:new Error(String(error)),{voiceStage:type}));
     }
     return false;
   } finally {
     busy=false;
   }
 }
 const api={speak,stop,prepare,chooseVoice,normalizeLocale,resetSessionIfVoiceChanged,isBusy:()=>busy||nativeBusy,usesSystemVoice,SYSTEM_LANGUAGES,SYSTEM_PROFILES,WASM_PATHS,LOCALES,PRESETS};
 if(typeof module==="object" && module.exports)module.exports=api;
 else root.GattoVoce=api;
})(typeof window!=="undefined"?window:globalThis);
