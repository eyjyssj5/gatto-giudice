/* Il gatto giudice.
 * Se il server e' configurato, la decisione va al server, che usa l'intelligenza artificiale.
 * Se non lo e' ancora, il gatto risponde da solo, con le frasi che abbiamo scritto.
 */
(function () {
  const $ = (id) => document.getElementById(id);

  // Dopo la pubblicazione del Cloudflare Worker, incolla qui il suo indirizzo workers.dev.
  const SERVER = "https://gatto-giudice-ai.eyjyssj.workers.dev";
  const SERVER_ATTIVO = !SERVER.startsWith("INSERISCI");
  const CHIAVE = "gatto.stato";
  const LIMITE = 10;
  const I18N = window.GattoLingue;
  const t = (key,vars) => I18N.text(leggi().lingua,key,vars);
  const linguaIniziale = I18N.normalize(navigator.language||"it");

  // Modalita' di prova: decisioni illimitate. Si attiva toccando cinque volte il titolo.
  function provaAttiva() {
    return localStorage.getItem("gatto.prova") === "si";
  }

  function oggi() {
    return new Date().toISOString().slice(0, 10);
  }

  function leggi() {
    try {
      return Object.assign({ carattere: "dolce", lingua: linguaIniziale, decisioni: [], dispositivo: null }, JSON.parse(localStorage.getItem(CHIAVE)) || {});
    } catch (errore) {
      return { carattere: "dolce", lingua: linguaIniziale, decisioni: [], dispositivo: null };
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
      lista.innerHTML = "<li>" + t("noneToday") + "</li>";
    }
    decisioni.forEach((d) => {
      const riga = document.createElement("li");
      riga.className = "rimandabile";
      riga.title = t("submit");
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
      ? t("noneWeek")
      : t("stats",{yes:r.approvate,no:r.bocciate,total:r.totale});
  }

  function mostraContatore(stato) {
    if (provaAttiva()) {
      $("contatore").textContent = t("trial");
      $("btn-giudica").disabled = false;
      return;
    }
    const restanti = rimasteOggi(stato);
    $("contatore").textContent = restanti > 0
      ? t("remaining",{n:restanti})
      : t("limit");
    $("btn-giudica").disabled = restanti <= 0;
  }

  function aggiornaCarattere(stato) {
    document.querySelectorAll(".car").forEach((b) => {
      b.classList.toggle("attivo", b.dataset.carattere === stato.carattere);
      b.textContent = t(b.dataset.carattere);
    });
    const fileFoto = "img/gatto-" + stato.carattere + "-esatto.webp";
    if (!$("gatto").src.endsWith(fileFoto)) $("gatto").src = fileFoto;
    $("gatto").alt = t("title") + ": " + t(stato.carattere);
    GattoAnimato.aggiorna(stato.carattere);
  }

  function aggiornaLingua(stato) {
    const lang=I18N.normalize(stato.lingua);
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==="ar" ? "rtl" : "ltr";
    document.title=t("title");
    $("titolo").textContent=t("title");
    $("lingua-label").textContent=t("language");
    $("lingua").value=lang;
    $("decisione").placeholder=t("placeholder");
    $("btn-giudica").textContent=t("submit");
    $("btn-voce").textContent="🔊 " + t("listen");
    $("voce-info").textContent=t("voiceInfo");
    $("titolo-oggi").textContent=t("today");
    $("titolo-settimana").textContent=t("week");
    if ($("esito").hidden) $("fumetto").textContent=t("intro");
  }
  function aggiornaTutto() {
    const stato = leggi();
    aggiornaLingua(stato);
    aggiornaCarattere(stato);
    mostraLista(stato);
    mostraRiepilogo(stato);
    mostraContatore(stato);
  }

  function fermaVoce() {
    GattoVoce.stop();
    GattoAnimato.ferma();
  }

  async function pronuncia(frase) {
    const stato=leggi();
    const status=$("stato-voce");
    status.textContent=t("voicePreparing");
    const ok=await GattoVoce.speak(frase,stato.lingua,stato.carattere,{
      onProgress:(phase)=>{
        if(phase.startsWith("download:")) {
          status.textContent=t("voiceDownloading",{n:phase.slice(9)});
        } else if(phase==="download" || phase==="loading") {
          status.textContent=t("voicePreparing");
        } else if(phase==="playback") {
          status.textContent=t("voicePlayback");
        } else if(phase==="speaking") {
          status.textContent=t("voiceSpeaking");
        }
      },
      onStart:()=>{GattoAnimato.parla();status.textContent=t("voiceSpeaking");},
      onEnd:()=>{GattoAnimato.ferma();},
      onError:(error)=>{
        GattoAnimato.ferma();
        // Codice diagnostico compatto e leggibile anche senza console browser.
        const stage=String(error?.voiceStage||error?.code||"audio").replace(/[^a-z]/gi,"").slice(0,16);
        status.textContent=t("voiceRetry")+" ("+stage+")";
      }
    });
    if(!ok && !status.textContent.includes("(")) status.textContent=t("voiceTapToListen");
  }

  $("btn-voce").addEventListener("click", () => {
    const frase = $("esito-frase").textContent;
    if (!frase) return;
    GattoVoce.prepare(); // attiva Web Audio dentro il gesto del dito su iPhone
    if(!GattoVoce.isBusy()) pronuncia(frase);
  });

  function mostraEsito(approva, frase, testo) {
    $("fumetto").textContent = frase;
    $("pollice").textContent = approva ? "👍" : "👎";
    $("esito-frase").textContent = frase;
    $("esito").hidden = false;
    $("btn-voce").hidden = false;
    $("voce-info").textContent=t("voiceFirstDownload");
    $("stato-voce").textContent=t("voicePreparing");
    // Prova a parlare automaticamente. Safari puo' richiedere un altro tocco:
    // il pulsante Ascolta rimane sempre disponibile.
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
      body: JSON.stringify({ decisione: testo, carattere: stato.carattere, dispositivo: dispositivo, lingua: I18N.normalize(stato.lingua) }),
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
    $("fumetto").textContent = t("thinking");
    try {
      const dati = await chiediVerdetto(stato, testo, dispositivo);
      if (dati.limite) {
        $("fumetto").textContent = t("limit");
        stato.rimaste = 0;
        stato.rimasteData = oggi();
        scrivi(stato);
        return;
      }
      if (dati.pausa) {
        $("fumetto").textContent = t("pause");
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
      $("fumetto").textContent = t("serverError");
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
      fermaVoce();
      $("esito").hidden=true;
      $("btn-voce").hidden=true;
      $("stato-voce").textContent="";
      aggiornaTutto();
    });
  });

  $("lingua").addEventListener("change", (evento) => {
    const stato=leggi();
    stato.lingua=I18N.normalize(evento.target.value);
    scrivi(stato);
    fermaVoce();
    $("esito").hidden=true;
    $("btn-voce").hidden=true;
    $("stato-voce").textContent="";
    aggiornaTutto();
  });

  // Cinque tocchi sul titolo attivano o disattivano la modalita' di prova.
  let tocchi = 0;
  $("titolo").addEventListener("click", () => {
    tocchi += 1;
    if (tocchi >= 5) {
      tocchi = 0;
      const nuova = !provaAttiva();
      localStorage.setItem("gatto.prova", nuova ? "si" : "no");
      alert(nuova ? t("trialOn") : t("trialOff"));
      aggiornaTutto();
    }
  });

  $("form-decisione").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const testo = $("decisione").value.trim();
    if (!testo) return;
    // Un blocco audio avviato nel gesto utente rimane sbloccato in attesa dell'AI.
    GattoVoce.prepare();
    consegna(testo);
  });

  aggiornaTutto();
})();
