// Verify Google Play purchase tokens on the server. Never store service-account credentials in the app.
const PACKAGE="com.aivevia.gattogiudice";
const ONE_TIME=new Set(["giudice_severo_premium","giudice_ironico_premium","giudice_corrotto_premium","giudice_pigro_premium"]);
const SUBSCRIPTION="giudice_supremo_abbonamento";
const decodeBase64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
const b64url=x=>btoa(String.fromCharCode(...new Uint8Array(x))).split("+").join("-").split("/").join("_").replace(/=+$/,"");
async function oauthAccessToken(env,fetcher=fetch){
 const raw=env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
 if(!raw)throw Error("Google Play service account not configured");
 const cred=JSON.parse(raw);
 if(!cred.client_email||!cred.private_key)throw Error("Incomplete Google Play service account");
 const privateKey=decodeBase64(cred.private_key.split("-----BEGIN PRIVATE KEY-----").join("").split("-----END PRIVATE KEY-----").join("").replaceAll(String.fromCharCode(10),"").replaceAll(String.fromCharCode(13),"").replaceAll(" ",""));
 const key=await crypto.subtle.importKey("pkcs8",privateKey,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
 const now=Math.floor(Date.now()/1000);
 const header=b64url(new TextEncoder().encode(JSON.stringify({alg:"RS256",typ:"JWT"})));
 const payload=b64url(new TextEncoder().encode(JSON.stringify({iss:cred.client_email,scope:"https://www.googleapis.com/auth/androidpublisher",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3300})));
 const unsigned=header+"."+payload;
 const signature=b64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned)));
 const response=await fetcher("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:unsigned+"."+signature})});
 if(!response.ok)throw Error("Google OAuth service account failed "+response.status);
 const result=await response.json();
 if(!result.access_token)throw Error("Missing OAuth access token");
 return result.access_token;
}
export function evaluateGoogleProduct(data,id){
 return !!data && ONE_TIME.has(id) && data.purchaseState===0 && (data.quantity===undefined || Number(data.quantity)>=1);
}
export function evaluateGoogleSubscription(data,id,now=Date.now()){
 if(id!==SUBSCRIPTION||!data)return null;
 if(!["SUBSCRIPTION_STATE_ACTIVE","SUBSCRIPTION_STATE_IN_GRACE_PERIOD","SUBSCRIPTION_STATE_CANCELED"].includes(data.subscriptionState))return null;
 const line=(data.lineItems||[]).find(x=>x.productId===id && Date.parse(x.expiryTime)>now);
 return line?{expiryDate:Date.parse(line.expiryTime),renewalIntent:data.subscriptionState==="SUBSCRIPTION_STATE_ACTIVE"?"Renew":"Lapse"}:null;
}
export function billingConfigured(env){
 if(!env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)return false;
 try {const x=JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);return !!(x.private_key&&x.client_email)}catch{return false}
}
export async function validatePlayReceipt(body,env,fetcher=fetch){
 // Do not trust item ID, token, package or purchase status reported by the phone.
 const id=body?.id,tran=body?.transaction;
 if(!(ONE_TIME.has(id)||id===SUBSCRIPTION)||tran?.type!=="android-playstore")return {ok:false,error:{code:400,message:"Invalid Google Play product or platform"}};
 let native={};
 try {if(tran.receipt)native=JSON.parse(tran.receipt)}catch{return {ok:false,error:{code:400,message:"Malformed Google Play receipt"}}}
 const token=tran.purchaseToken||native.purchaseToken;
 if(typeof token!=="string"||token.length<16||token.length>4096)return {ok:false,error:{code:400,message:"Missing purchase token"}};
 if(native.packageName&&native.packageName!==PACKAGE)return {ok:false,error:{code:400,message:"Wrong app"}};
 if(native.productId&&native.productId!==id)return {ok:false,error:{code:400,message:"Wrong product"}};
 if(Array.isArray(native.productIds)&&!native.productIds.includes(id))return {ok:false,error:{code:400,message:"Wrong product"}};
 if(!billingConfigured(env))return {ok:false,error:{code:503,message:"Google Play validation not configured"}};
 try {
   const access=await oauthAccessToken(env,fetcher);
   const endpoint=id===SUBSCRIPTION
    ? "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"+PACKAGE+"/purchases/subscriptionsv2/tokens/"+encodeURIComponent(token)
    : "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"+PACKAGE+"/purchases/products/"+encodeURIComponent(id)+"/tokens/"+encodeURIComponent(token);
   const response=await fetcher(endpoint,{headers:{Authorization:"Bearer "+access}});
   if(!response.ok)return {ok:false,error:{code:response.status,message:"Google Play did not validate purchase"}};
   const data=await response.json();
   const sub=id===SUBSCRIPTION?evaluateGoogleSubscription(data,id):null;
   if(id===SUBSCRIPTION?!sub:!evaluateGoogleProduct(data,id))return {ok:false,error:{code:403,message:"Purchase pending, cancelled or expired"}};
   const purchase={id,platform:"android-playstore",purchaseId:token,transactionId:data.orderId||tran.id||"",isExpired:false,isAcknowledged:(id===SUBSCRIPTION?data.acknowledgementState==="ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED":data.acknowledgementState===1)};
   if(sub){purchase.expiryDate=sub.expiryDate;purchase.renewalIntent=sub.renewalIntent}
   return {ok:true,data:{id,latest_receipt:true,transaction:tran,collection:[purchase],date:new Date().toISOString()}};
 }catch(err){
   return {ok:false,error:{code:503,message:"Google Play validation unavailable"}};
 }
}
