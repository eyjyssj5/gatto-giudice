const {test}=require("node:test");
const assert=require("node:assert/strict");
test("Limiter applicato sia al dispositivo che all'IP Cloudflare, anche su ID cambiati",async()=>{
 const w=(await import("../worker/index.mjs")).default;
 const calls=[];
 const env={LIMITER:{limit:async({key})=>{calls.push(key);return {success:true};}},
   AI:{run:async()=>({response:"APPROVO: Una scelta ragionevole."})}};
 const req=new Request("https://gatto-giudice-ai.example.workers.dev/giudica",{
    method:"POST",headers:{"Origin":"https://localhost","Content-Type":"application/json","CF-Connecting-IP":"203.0.113.7"},
    body:JSON.stringify({decisione:"Leggo un libro",carattere:"dolce",dispositivo:"abcde1234567890",lingua:"it"})});
 const res=await w.fetch(req,env);
 assert.equal(res.status,200);
 assert.deepEqual(calls,["device:abcde1234567890","ip:203.0.113.7"]);
});
