import {store,ProductType,Platform} from "capacitor-plugin-cdv-purchase";
const ids=["severo","ironico","corrotto","pigro","supremo"];
const product=j=>j==="supremo"?"giudice_supremo_abbonamento":"giudice_"+j+"_premium";
const BASE="https://gatto-giudice-ai.eyjyssj.workers.dev";
const notify=()=>window.dispatchEvent(new Event("gatto-premium-update"));
let ready=false,billingEnabled=false;
let lastError="";
const setError=x=>{lastError=x;notify();};
store.validator=(receipt,callback)=>{
  fetch(BASE+"/verify-play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(receipt)})
   .then(async r=>{const response=await r.json();if(!response.ok)lastError=response.error?.message||"Acquisto non verificato.";return response;})
   .then(callback)
   .catch(()=>callback({ok:false,error:{code:503,message:"Verifica acquisto temporaneamente non disponibile."}}));
};
store.validator_privacy_policy=["fraud"];
window.GattoPremium={
  ready:()=>ready,
  billingEnabled:()=>billingEnabled,
  lastError:()=>lastError,
  owned:j=>j==="dolce"||(ready&&ids.includes(j)&&store.owned(product(j))),
  price:j=>ready&&ids.includes(j)?store.get(product(j),Platform.GOOGLE_PLAY)?.pricing?.price||"":"",
  buy:async j=>{
    if(!billingEnabled){setError("Acquisti non attivi: verifica Google Play ancora da configurare.");return false;}
    if(!ready||!ids.includes(j))return false;
    const p=store.get(product(j),Platform.GOOGLE_PLAY),offer=p?.getOffer();
    if(!offer||!p?.canPurchase){setError("Prodotto non attivo su Google Play.");return false;}
    const response=await offer.order();
    if(response?.isError){setError(response.message||"Acquisto non completato.");return false;}
    return true;
  },
  restore:async()=>{
    try {await store.restorePurchases();await store.update();notify();return true}
    catch(e){setError("Impossibile ripristinare gli acquisti.");return false;}
  }
};
function addRestoreButton(){
  if(document.getElementById("restore-purchases"))return;
  const section=document.querySelector(".checkin-section");
  if(!section)return;
  const b=document.createElement("button");
  b.id="restore-purchases";b.type="button";b.textContent="Ripristina acquisti Google Play";
  b.style.cssText="margin:12px 0 4px;min-height:44px;width:100%;background:#f5eee0;color:#283b37;border:1px solid #b8a17c;border-radius:9px;font-weight:600";
  const msg=document.createElement("p");msg.id="restore-purchases-status";msg.setAttribute("role","status");
  b.addEventListener("click",async()=>{
    b.disabled=true;msg.textContent="Verifica acquisti in corso...";
    const success=await window.GattoPremium.restore();
    msg.textContent=success?"Verifica acquisti completata.":"Ripristino non disponibile. Riprova.";
    b.disabled=false;
  });
  section.append(b,msg);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addRestoreButton,{once:true});
else addRestoreButton();
(async()=>{
  try{
    const status=await fetch(BASE+"/billing-status",{cache:"no-store"});
    billingEnabled=Boolean(status.ok&&(await status.json())?.ready);
  }catch(_){billingEnabled=false}
  try {
    store.register(ids.map(j=>({id:product(j),type:j==="supremo"?ProductType.PAID_SUBSCRIPTION:ProductType.NON_CONSUMABLE,platform:Platform.GOOGLE_PLAY})));
    store.when().productUpdated(notify).receiptUpdated(notify)
      .approved(tx=>tx.verify())
      .verified(receipt=>{receipt.finish();notify()})
      .finished(notify).cancelled(notify)
      .unverified(()=>setError("Acquisto non verificato da Google Play."));
    await store.initialize([Platform.GOOGLE_PLAY]);
    ready=true;notify();
  }catch(e){setError("Google Play Billing non disponibile.");}
})();
