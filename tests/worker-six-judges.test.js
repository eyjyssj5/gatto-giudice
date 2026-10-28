const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const chars=["dolce","severo","ironico","corrotto","pigro","supremo"];
const expected={corrotto:/monete|venale/i,pigro:/assonnato|svogliato/i,supremo:/solenne|maestoso/i};
test("Il Worker AI accetta tutti e sei i giudici con personalita' distinte",async()=>{
 const worker=(await import("../worker/index.mjs")).default;
 for(const carattere of chars){
   let calls=0;
   const env={
    LIMITER:{limit:async()=>({success:true})},
    AI:{run:async(_model,opts)=>{
      calls++;
      const prompt=opts.messages[0].content;
      assert.match(prompt,/Personalita'/);
      if(expected[carattere])assert.match(prompt,expected[carattere]);
      return {response:JSON.stringify({verdetto:"APPROVO",frase:"Questa scelta merita un'approvazione felina."})};
    }}
   };
   const res=await worker.fetch(new Request("https://gatto-giudice-ai.example.workers.dev/giudica",{
     method:"POST",headers:{"Origin":"https://localhost","Content-Type":"application/json"},
     body:JSON.stringify({decisione:"Leggo un libro",carattere,dispositivo:randomUUID(),lingua:"it"})
   }),env);
   assert.equal(res.status,200,carattere);
   const json=await res.json();
   assert.equal(json.approva,true);
   assert.match(json.frase,/approvazione/);
   assert.equal(calls,1);
 }
});
