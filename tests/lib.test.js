const test = require("node:test");
const assert = require("node:assert/strict");
const G = require("../www/lib.js");
const FRASI = require("../www/frasi.js");

test("ogni carattere ha 100 frasi di approvazione e 100 di bocciatura", () => {
  for (const c of ["dolce", "severo", "ironico"]) {
    assert.equal(FRASI[c].si.length, 100, c + " si");
    assert.equal(FRASI[c].no.length, 100, c + " no");
  }
});

test("il carattere cambia la probabilita' di approvazione", () => {
  assert.equal(G.giudica("dolce", 0.6).approva, true);
  assert.equal(G.giudica("dolce", 0.8).approva, false);
  assert.equal(G.giudica("ironico", 0.4).approva, true);
  assert.equal(G.giudica("ironico", 0.6).approva, false);
  assert.equal(G.giudica("severo", 0.2).approva, true);
  assert.equal(G.giudica("severo", 0.4).approva, false);
});

test("ogni carattere ha una frase non vuota", () => {
  for (const c of ["dolce", "severo", "ironico"]) {
    assert.ok(G.giudica(c, 0.2).frase.length > 0);
    assert.ok(G.giudica(c, 0.8).frase.length > 0);
  }
});

test("il limite giornaliero e' di 10 decisioni", () => {
  const storico = [];
  for (let i = 0; i < 10; i++) storico.push({ data: "2026-10-10", approva: true });
  assert.equal(G.puoDecidere(storico, "2026-10-10"), false);
  assert.equal(G.puoDecidere(storico, "2026-10-11"), true);
});

test("i giorni precedenti vanno all'indietro e attraversano il mese", () => {
  assert.deepEqual(G.giorniPrecedenti("2026-10-02", 3), ["2026-10-02", "2026-10-01", "2026-09-30"]);
});

test("il riepilogo conta solo gli ultimi 7 giorni", () => {
  const storico = [
    { data: "2026-10-10", approva: true },
    { data: "2026-10-09", approva: false },
    { data: "2026-10-04", approva: true },
    { data: "2026-10-03", approva: true },
    { data: "2026-09-01", approva: true },
  ];
  const r = G.riepilogo(storico, "2026-10-10");
  assert.equal(r.totale, 3);
  assert.equal(r.approvate, 2);
  assert.equal(r.bocciate, 1);
});

test("riconosce i temi dalle parole chiave", () => {
  assert.equal(G.temaDi("ho fame"), "fame");
  assert.equal(G.temaDi("vado in palestra"), "sport");
  assert.equal(G.temaDi("compro una casa"), null);
});

test("con un tema riconosciuto la frase parla di quel tema", () => {
  const g = G.giudica("dolce", 0.2, "ho fame");
  assert.ok(g.frase.toLowerCase().indexOf("fame") !== -1);
});
