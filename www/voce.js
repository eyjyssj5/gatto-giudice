/* Gatto Giudice: WAV generato dal nostro motore libero sul computer.
 * Niente Siri, niente ElevenLabs, niente inferenza Piper sul telefono.
 * Il browser non conosce la chiave privata del motore.
 */
(function(root) {
  "use strict";
  const LOCALES=Object.freeze({
    it:"it_IT",es:"es_ES",en:"en_US",pt:"pt_PT",fr:"fr_FR",de:"de_DE",
    nl:"nl_NL",pl:"pl_PL",ru:"ru_RU",tr:"tr_TR",ar:"ar_JO",zh:"zh_CN"
  });
  const PRESETS=Object.freeze({dolce:1,severo:1.05,ironico:1.12});
  const VOICE_URL="https://gatto-giudice-ai.eyjyssj.workers.dev/voce";
  let context=null,active=null,url=null,pending=null,busy=false;
  let serial=0;
  function prepare(){
    try{
      const Ctor=root.AudioContext||root.webkitAudioContext;
      if(!Ctor)return false;
      if(!context)context=new Ctor();
      if(context.state==="suspended")context.resume().catch(()=>{});
      const src=context.createBufferSource();
      src.buffer=context.createBuffer(1,1,22050);
      src.connect(context.destination);
      src.start();
      return true;
    }catch(_err){return false;}
  }
  function stop(){
    serial++;
    if(pending){pending.abort();pending=null;}
    if(active){active.onended=null;try{active.stop();}catch(_err){};active.disconnect?.();active=null;}
    if(url){URL.revokeObjectURL(url);url=null;}
    busy=false;
  }
  function normalizeLocale(lang){
    const x=String(lang||"it").slice(0,2).toLowerCase();
    return Object.hasOwn(LOCALES,x)?x:"it";
  }
  function deviceId(){
    try {
      const saved=JSON.parse(root.localStorage.getItem("gatto.stato")||"{}");
      if(typeof saved.dispositivo==="string" && /^[A-Za-z0-9-]{8,100}$/.test(saved.dispositivo))return saved.dispositivo;
    }catch(_err){}
    // Il dispositivo e' stato creato dal form, questa e' soltanto una riserva.
    let id=root.localStorage.getItem("gatto.audio-device");
    if(!id){id="device-"+String(Date.now())+"-"+Math.random().toString(36).slice(2);root.localStorage.setItem("gatto.audio-device",id);}
    return id;
  }
  async function speak(text,lang,character,hooks={}){
    if(busy)return false;
    stop();
    busy=true;
    const current=++serial;
    pending=new AbortController();
    const device=deviceId();
    try {
      hooks.onProgress?.("loading");
      const timeout=setTimeout(()=>pending?.abort(),25000);
      let response;
      try {
        response=await fetch(VOICE_URL,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({text:String(text||"").slice(0,260),lang:normalizeLocale(lang),character,device}),
          signal:pending.signal
        });
      }finally{clearTimeout(timeout);}
      if(current!==serial)return false;
      if(!response.ok){
        const detail=await response.json().catch(()=>({}));
        throw Object.assign(new Error(detail.errore||"Motore vocale non disponibile"),{voiceStage:response.status===503?"server":"network"});
      }
      const wav=await response.arrayBuffer();
      if(wav.byteLength<100)throw Object.assign(new Error("Audio mancante"),{voiceStage:"empty"});
      hooks.onProgress?.("playback");
      if(context) {
        const buffer=await context.decodeAudioData(wav.slice(0));
        if(current!==serial)return false;
        await context.resume();
        const src=context.createBufferSource();
        src.buffer=buffer;
        src.playbackRate.value=PRESETS[character]||1;
        src.connect(context.destination);
        src.onended=()=>{
          if(current!==serial)return;
          active=null;busy=false;
          hooks.onEnd?.();
        };
        active=src;
        src.start();
      } else {
        // Ultima opzione: audio registrato WAV. MAI la voce del telefono.
        const blob=new Blob([wav],{type:"audio/wav"});
        url=URL.createObjectURL(blob);
        const player=new Audio(url);
        active=player;
        player.playbackRate=PRESETS[character]||1;
        player.onended=()=>{if(current===serial){busy=false;hooks.onEnd?.();}};
        await player.play();
      }
      pending=null;
      hooks.onStart?.();
      return true;
    }catch(error){
      if(current===serial){
        busy=false;
        pending=null;
        hooks.onError?.(error);
      }
      return false;
    }
  }
  const api={speak,stop,prepare,normalizeLocale,isBusy:()=>busy,usesSystemVoice:()=>false,LOCALES,PRESETS};
  if(typeof module==="object" && module.exports)module.exports=api;
  else root.GattoVoce=api;
})(typeof window!=="undefined"?window:globalThis);
