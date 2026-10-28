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

test("Verifica completa mock Google: firma OAuth, token e prodotto non consumabile",async()=>{
 const {generateKeyPairSync}=require("node:crypto");
 const {privateKey}=generateKeyPairSync("rsa",{modulusLength:2048});
 const pem=privateKey.export({type:"pkcs8",format:"pem"}).toString();
 const env={GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:JSON.stringify({client_email:"test@project.iam.gserviceaccount.com",private_key:pem})};
 const calls=[];
 const fetcher=async (url,options)=>{
   calls.push({url,options});
   if(String(url).includes("oauth2.googleapis.com")){
     const token=new URLSearchParams(options.body).get("assertion");
     assert.equal(token.split(".").length,3);
     assert.ok(token.length>100);
     return {ok:true,json:async()=>({access_token:"test-oauth-token"})};
   }
   assert.match(url,/purchases\\/products\\/giudice_severo_premium\\/tokens\\/token-verified-1234567890/);
   assert.equal(options.headers.Authorization,"Bearer test-oauth-token");
   return {ok:true,json:async()=>({purchaseState:0,orderId:"GPA.TEST",acknowledgementState:0})};
 };
 const b=await billing();
 const body={id:"giudice_severo_premium",transaction:{type:"android-playstore",purchaseToken:"token-verified-1234567890",receipt:JSON.stringify({packageName:"com.aivevia.gattogiudice",productId:"giudice_severo_premium"})}};
 const response=await b.validatePlayReceipt(body,env,fetcher);
 assert.equal(response.ok,true);
 assert.equal(response.data.collection[0].id,"giudice_severo_premium");
 assert.equal(calls.length,2);
});
