const {test}=require("node:test");
const assert=require("node:assert/strict");
async function billing(){return import("../worker/play-billing.mjs")}
test("Prodotti Google: riconosce solo acquisti pagati",async()=>{
 const b=await billing();
 assert.equal(b.evaluateGoogleProduct({purchaseState:0},"giudice_severo_premium"),true);
 assert.equal(b.evaluateGoogleProduct({purchaseState:2},"giudice_severo_premium"),false);
 assert.equal(b.evaluateGoogleProduct({purchaseState:1},"giudice_severo_premium"),false);
 assert.equal(b.evaluateGoogleProduct({purchaseState:0},"giudice_supremo_abbonamento"),false);
});
test("Supremo scade e rinnova in base ai dati verificati Google",async()=>{
 const b=await billing();const now=Date.now(),id="giudice_supremo_abbonamento";
 const obj={subscriptionState:"SUBSCRIPTION_STATE_ACTIVE",lineItems:[{productId:id,expiryTime:new Date(now+3600000).toISOString()}]};
 assert.ok(b.evaluateGoogleSubscription(obj,id,now));
 assert.equal(b.evaluateGoogleSubscription({...obj,subscriptionState:"SUBSCRIPTION_STATE_EXPIRED"},id,now),null);
 assert.equal(b.evaluateGoogleSubscription({subscriptionState:"SUBSCRIPTION_STATE_ACTIVE",lineItems:[{productId:id,expiryTime:new Date(now-1000).toISOString()}]},id,now),null);
});
test("La verifica rifiuta mancanza di credenziali, prodotto falso, token e package falsi",async()=>{
 const b=await billing();
 const valid={id:"giudice_severo_premium",transaction:{type:"android-playstore",purchaseToken:"token-of-verified-purchase",receipt:JSON.stringify({packageName:"com.aivevia.gattogiudice",productId:"giudice_severo_premium"})}};
 let r=await b.validatePlayReceipt(valid,{});
 assert.equal(r.ok,false);assert.equal(r.error.code,503);
 r=await b.validatePlayReceipt({...valid,id:"other_product"},{});
 assert.equal(r.ok,false);
 r=await b.validatePlayReceipt({...valid,transaction:{...valid.transaction,receipt:JSON.stringify({packageName:"other.app",productId:"giudice_severo_premium"})}},{});
 assert.equal(r.ok,false);
 r=await b.validatePlayReceipt({...valid,transaction:{...valid.transaction,purchaseToken:""}},{});
 assert.equal(r.ok,false);
});
test("API billing resta indisponibile finché manca la chiave Google",async()=>{
 const worker=(await import("../worker/index.mjs")).default;
 const root="https://gatto-giudice-ai.test.workers.dev";
 const r=await worker.fetch(new Request(root+"/billing-status",{headers:{Origin:"https://localhost"}}),{});
 assert.equal(r.status,200); assert.equal((await r.json()).ready,false);
 const t=await worker.fetch(new Request(root+"/verify-play",{method:"POST",headers:{Origin:"https://localhost","Content-Type":"application/json"},body:JSON.stringify({id:"giudice_severo_premium",transaction:{type:"android-playstore",purchaseToken:"tokenlonglonglonglong"}})}),{});
 assert.equal(t.status,503);
});
