const {test}=require("node:test");
const assert=require("node:assert/strict");
test("Privacy policy pubblica, leggibile e accessibile senza login",async()=>{
  const worker=(await import("../worker/index.mjs")).default;
  const response=await worker.fetch(new Request("https://gatto-giudice-ai.example.workers.dev/privacy",{method:"GET"}),{});
  assert.equal(response.status,200);
  assert.match(response.headers.get("Content-Type")||"",/text\/html/);
  const html=await response.text();
  assert.match(html,/Gatto Giudice - Informativa sulla privacy/);
  assert.match(html,/Cloudflare Workers AI/);
  assert.match(html,/Google Play/);
  assert.match(html,/eyjyssj@gmail.com/);
});
