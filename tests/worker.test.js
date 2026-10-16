const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE = "https://gatto-giudice-ai.example.workers.dev/giudica";
const ORIGIN = "https://eyjyssj5.github.io";
async function worker() { return (await import("../worker/index.mjs")).default; }
function request(data, origin = ORIGIN) {
  return new Request(BASE, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
const dati = { decisione: "Vado a piedi al lavoro", carattere: "ironico", dispositivo: "abcd1234567890" };

test("CORS: autorizzato solo il sito", async () => {
  const ok = await (await worker()).fetch(new Request(BASE, {method: "OPTIONS", headers: {Origin: ORIGIN}}), {});
  assert.equal(ok.status, 204);
  const nonok = await (await worker()).fetch(request(dati, "https://example.org"), {});
  assert.equal(nonok.status, 403);
});

test("AI restituisce sentenza strutturata in tema", async () => {
  let chiamate = 0;
  const env = {
    LIMITER: {limit: async () => ({success: true})},
    AI: {run: async (model, options) => {
      assert.match(model, /glm-4.7/);
      assert.match(options.messages[1].content, /a piedi/);
      chiamate++;
      return {response: "APPROVO: Camminare fa bene, basta che tu non parta per l'altra galassia."};
    }}
  };
  const risultato = await (await worker()).fetch(request(dati), env);
  assert.equal(risultato.status, 200);
  assert.deepEqual(await risultato.json(), {approva: true, frase: "Camminare fa bene, basta che tu non parta per l'altra galassia.", lingua: "it"});
  assert.equal(chiamate, 1);
});

test("Limite richieste blocca l'AI", async () => {
  const env = {
    LIMITER: {limit: async () => ({success: false})},
    AI: {run: async () => { throw new Error("non chiamare"); }}
  };
  const r = await (await worker()).fetch(request(dati), env);
  assert.equal(r.status, 429);
});

test("Input vuoto o eccessivo rifiutato", async () => {
  const w = await worker();
  for (const decisione of ["", "x".repeat(121)]) {
    const r = await w.fetch(request({...dati, decisione}), {AI:{}, LIMITER:{}});
    assert.equal(r.status, 400);
  }
});

test("Risposta AI non valida restituisce errore, non una frase a caso", async () => {
  const env = {LIMITER: {limit: async () => ({success: true})}, AI: {run: async () => ({response:"Ciao!"})}};
  assert.equal((await (await worker()).fetch(request(dati), env)).status, 502);
});

test("le 12 lingue sono accettate e comunicate al modello AI", async () => {
  const codes=["it","es","en","pt","fr","de","nl","pl","ru","tr","ar","zh"];
  const prompts=[];
  const env={
    LIMITER:{limit:async()=>({success:true})},
    AI:{run:async(model,params)=>{
      prompts.push(params.messages[0].content);
      return {response:"APPROVO: Verdetto di prova"};
    }}
  };
  for(const lingua of codes){
    const res=await (await worker()).fetch(request({...dati,lingua}),env);
    assert.equal(res.status,200,lingua);
    assert.equal((await res.json()).lingua,lingua);
  }
  assert.equal(prompts.length,12);
  assert.match(prompts[10],/العربية/);
  assert.match(prompts[11],/简体中文/);
});

test("i protocolli di Capacitor iOS e Android hanno CORS consentito",async()=>{
  const w=await worker();
  for(const origin of ["capacitor://localhost","http://localhost","https://localhost"]){
    const preflight=await w.fetch(new Request(BASE,{method:"OPTIONS",headers:{Origin:origin}}),{});
    assert.equal(preflight.status,204);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"),origin);
  }
});

test("lingue non approvate sono respinte prima di consumare AI",async()=>{
  const w=await worker();
  const res=await w.fetch(request({...dati,lingua:"xx"}),{AI:{},LIMITER:{}});
  assert.equal(res.status,400);
});

test("comprende verdetti con prefisso arabo e cinese", async () => {
  const w=await worker();
  const cases=[
    {lingua:"ar",response:"أوافق: دراسة اللغة كل يوم فكرة ممتازة.",expected:true},
    {lingua:"ar",response:"أرفض: هذا قرار غير حكيم.",expected:false},
    {lingua:"zh",response:"赞成：每天学习是个好决定。",expected:true},
    {lingua:"zh",response:"反对：不建议这样做。",expected:false}
  ];
  for(const x of cases){
    const env={LIMITER:{limit:async()=>({success:true})},AI:{run:async()=>({response:x.response})}};
    const r=await w.fetch(request({...dati,lingua:x.lingua}),env);
    assert.equal(r.status,200,x.lingua);
    assert.equal((await r.json()).approva,x.expected);
  }
});

test("se manca il prefisso chiede al modello un secondo tentativo", async()=>{
  let calls=0;
  const env={
    LIMITER:{limit:async()=>({success:true})},
    AI:{run:async()=>{
      calls++;
      return {response:calls===1?"Ecco il mio parere.":"BOCCIO: Non e' una scelta prudente."};
    }}
  };
  const r=await (await worker()).fetch(request({...dati,lingua:"it"}),env);
  assert.equal(r.status,200);
  assert.equal((await r.json()).approva,false);
  assert.equal(calls,2);
});

test("risposta JSON del modello multilingue riconosciuta", async()=>{
  const w=await worker();
  const cases=[
    {lingua:"ar",response:'{"verdetto":"APPROVO","frase":"هذا قرار مناسب."}',approved:true},
    {lingua:"es",response:'{"verdetto":"BOCCIO","frase":"No me parece una buena decisión."}',approved:false},
    {lingua:"zh",response:'{"verdetto":"APPROVO","frase":"每天坚持学习很好。"}',approved:true}
  ];
  for(const sample of cases){
    const env={LIMITER:{limit:async()=>({success:true})},AI:{run:async()=>({response:sample.response})}};
    const r=await w.fetch(request({...dati,lingua:sample.lingua}),env);
    assert.equal(r.status,200,sample.lingua);
    const result=await r.json();
    assert.equal(result.approva,sample.approved);
    assert.ok(result.frase.length>5);
  }
});
