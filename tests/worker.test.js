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
      assert.match(model, /llama-3.1/);
      assert.match(options.messages[1].content, /a piedi/);
      chiamate++;
      return {response: "APPROVO: Camminare fa bene, basta che tu non parta per l'altra galassia."};
    }}
  };
  const risultato = await (await worker()).fetch(request(dati), env);
  assert.equal(risultato.status, 200);
  assert.deepEqual(await risultato.json(), {approva: true, frase: "Camminare fa bene, basta che tu non parta per l'altra galassia."});
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
