/* Il gatto giudice.
 * Se il server e' configurato, la decisione va al server, che usa l'intelligenza artificiale.
 * Se non lo e' ancora, il gatto risponde da solo, con le frasi che abbiamo scritto.
 */
(function () {
  const $ = (id) => document.getElementById(id);

  // Dopo la pubblicazione del Cloudflare Worker, incolla qui il suo indirizzo workers.dev.
  const SERVER = "INSERISCI_URL_DEL_WORKER";
  const SERVER_ATTIVO = !SERVER.startsWith("INSERISCI");
  const CHIAVE = "gatto.stato";
  const LIMITE = 10;

  // Modalita' di prova: decisioni illimitate. Si attiva toccando cinque volte il titolo.
  function provaAttiva() {
    return localStorage.getItem("gatto.prova") === "si";
  }

  function oggi() {
    return new Date().toISOString().slice(0, 10);
  }

  function leggi() {
    try {
      return Object.assign({ carattere: "dolce", decisioni: [], dispositivo: null }, JSON.parse(localStorage.getItem(CHIAVE)) || {});
    } catch (errore) {
      return { carattere: "dolce", decisioni: [], dispositivo: null };
    }
  }

  function scrivi(stato) {
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
  }

  // Un identificatore del telefono, creato una volta sola: serve al server per il limite giornaliero.
  function dispositivoDi(stato) {
    if (!stato.dispositivo) {
      stato.dispositivo = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : "d-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      scrivi(stato);
    }
    return stato.dispositivo;
  }

  function rimasteOggi(stato) {
    if (provaAttiva()) return LIMITE;
    return stato.rimasteData === oggi() && typeof stato.rimaste === "number" ? stato.rimaste : LIMITE;
  }

  function mostraLista(stato) {
    const lista = $("lista-oggi");
    lista.innerHTML = "";
    const decisioni = Gatto.decisioniDi(stato.decisioni, oggi());
    if (decisioni.length === 0) {
      lista.innerHTML = "<li>Nessuna decisione ancora.</li>";
    }
    decisioni.forEach((d) => {
      const riga = document.createElement("li");
      riga.className = "rimandabile";
      riga.title = "Tocca per rimandarla al gatto";
      const testoRiga = document.createElement("span");
      testoRiga.textContent = d.testo;
      const esito = document.createElement("strong");
      esito.textContent = d.approva ? "👍" : "👎";
      riga.append(testoRiga, esito);
      riga.addEventListener("click", () => consegna(d.testo));
      lista.appendChild(riga);
    });
  }

  function mostraRiepilogo(stato) {
    const r = Gatto.riepilogo(stato.decisioni, oggi());
    $("riepilogo").textContent = r.totale === 0
      ? "Nessuna decisione negli ultimi 7 giorni."
      : "Approvate: " + r.approvate + " · Bocciate: " + r.bocciate + " (totale " + r.totale + ")";
  }

  function mostraContatore(stato) {
    if (provaAttiva()) {
      $("contatore").textContent = "Modalità prova: decisioni illimitate";
      $("btn-giudica").disabled = false;
      return;
    }
    const restanti = rimasteOggi(stato);
    $("contatore").textContent = restanti > 0
      ? "Decisioni rimaste per oggi: " + restanti
      : "Per oggi il gatto ha finito. Torna domani.";
    $("btn-giudica").disabled = restanti <= 0;
  }

  function aggiornaCarattere(stato) {
    document.querySelectorAll(".car").forEach((b) => {
      b.classList.toggle("attivo", b.dataset.carattere === stato.carattere);
    });
    const nuovoSrc = "img/gatto-" + stato.carattere + ".png";
    if ($("gatto").getAttribute("src") !== nuovoSrc) $("gatto").src = nuovoSrc;
    GattoAnimato.aggiorna();
  }

  function aggiornaTutto() {
    const stato = leggi();
    aggiornaCarattere(stato);
    mostraLista(stato);
    mostraRiepilogo(stato);
    mostraContatore(stato);
  }

  let voceCorrente = null;

  function fermaVoce() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    voceCorrente = null;
    GattoAnimato.ferma();
  }

  function pronuncia(frase) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    fermaVoce();
    const voce = new SpeechSynthesisUtterance(frase);
    voceCorrente = voce;
    voce.lang = "it-IT";
    voce.rate = 0.93;
    voce.pitch = 0.85;
    voce.onstart = () => { if (voceCorrente === voce) GattoAnimato.parla(); };
    voce.onboundary = () => { if (voceCorrente === voce) GattoAnimato.parola(); };
    const termina = () => {
      if (voceCorrente === voce) {
        voceCorrente = null;
        GattoAnimato.ferma();
      }
    };
    voce.onend = termina;
    voce.onerror = termina;
    window.speechSynthesis.speak(voce);
  }

  $("btn-voce").addEventListener("click", () => {
    const frase = $("esito-frase").textContent;
    if (frase) pronuncia(frase);
  });

  function mostraEsito(approva, frase, testo) {
    $("fumetto").textContent = frase;
    $("pollice").textContent = approva ? "👍" : "👎";
    $("esito-frase").textContent = frase;
    $("esito").hidden = false;
    $("btn-voce").hidden = !("speechSynthesis" in window);
    // Riproduzione automatica dove consentita; su iPhone e' disponibile il pulsante Ascolta.
    pronuncia(frase);
  }

  // Restituisce { approva, frase, rimaste } oppure { limite: true }.
  async function chiediVerdetto(stato, testo, dispositivo) {
    if (!SERVER_ATTIVO) {
      if (!provaAttiva() && !Gatto.puoDecidere(stato.decisioni, oggi())) return { limite: true };
      const giudizio = Gatto.giudica(stato.carattere, Math.random(), testo);
      const usate = Gatto.decisioniDi(stato.decisioni, oggi()).length + 1;
      return { approva: giudizio.approva, frase: giudizio.frase, rimaste: provaAttiva() ? LIMITE : LIMITE - usate };
    }
    const risposta = await fetch(SERVER + "/giudica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisione: testo, carattere: stato.carattere, dispositivo: dispositivo }),
    });
    if (risposta.status === 429) {
      const info = await risposta.json().catch(() => ({}));
      return { pausa: info.errore || "Il gatto sta riposando. Riprova tra un minuto." };
    }
    if (!risposta.ok) throw new Error("server non disponibile");
    return risposta.json();
  }

  async function consegna(testo) {
    const stato = leggi();
    if (rimasteOggi(stato) <= 0) {
      aggiornaTutto();
      return;
    }
    const dispositivo = dispositivoDi(stato);
    fermaVoce();
    GattoAnimato.pensa(true);
    $("btn-giudica").disabled = true;
    $("fumetto").textContent = "Il gatto ci pensa...";
    try {
      const dati = await chiediVerdetto(stato, testo, dispositivo);
      if (dati.limite) {
        $("fumetto").textContent = "Per oggi il gatto ha finito. Torna domani.";
        stato.rimaste = 0;
        stato.rimasteData = oggi();
        scrivi(stato);
        return;
      }
      if (dati.pausa) {
        $("fumetto").textContent = dati.pausa;
        return;
      }
      stato.decisioni.push({ data: oggi(), testo: testo, approva: dati.approva, frase: dati.frase });
      const rimasteDopo = Math.max(0, LIMITE - Gatto.decisioniDi(stato.decisioni, oggi()).length);
      stato.rimaste = typeof dati.rimaste === "number"
        ? Math.min(rimasteDopo, Math.max(0, dati.rimaste))
        : rimasteDopo;
      stato.rimasteData = oggi();
      scrivi(stato);
      mostraEsito(dati.approva, dati.frase, testo);
      $("decisione").value = "";
    } catch (errore) {
      $("fumetto").textContent = SERVER_ATTIVO
        ? "Il gatto non risponde. Riprova tra poco."
        : "Qualcosa è andato storto. Riprova.";
    } finally {
      GattoAnimato.pensa(false);
      $("btn-giudica").disabled = false;
      aggiornaTutto();
    }
  }

  document.querySelectorAll(".car").forEach((b) => {
    b.addEventListener("click", () => {
      const stato = leggi();
      stato.carattere = b.dataset.carattere;
      scrivi(stato);
      aggiornaTutto();
    });
  });

  // Cinque tocchi sul titolo attivano o disattivano la modalita' di prova.
  let tocchi = 0;
  $("titolo").addEventListener("click", () => {
    tocchi += 1;
    if (tocchi >= 5) {
      tocchi = 0;
      const nuova = !provaAttiva();
      localStorage.setItem("gatto.prova", nuova ? "si" : "no");
      alert(nuova ? "Modalità prova attiva: decisioni illimitate." : "Modalità prova disattivata.");
      aggiornaTutto();
    }
  });

  $("form-decisione").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const testo = $("decisione").value.trim();
    if (!testo) return;
    consegna(testo);
  });

  aggiornaTutto();
})();
