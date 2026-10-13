/* Logica del gatto giudice: giudizi, limite giornaliero e riepilogo settimanale.
 * Le frasi stanno in frasi.js.
 */
(function (root) {
  const FRASI = (typeof module !== "undefined" && module.exports)
    ? require("./frasi.js")
    : root.FRASI_GATTO;

  // Probabilita' che il gatto approvi, per carattere.
  const PROBABILITA_APPROVAZIONE = {
    dolce: 0.7,
    ironico: 0.5,
    severo: 0.3,
  };

  // Temi riconosciuti dalle parole chiave, con una frase per carattere e per esito.
  const PAROLE_TEMA = {
    fame: ["fame", "mangi", "cena", "pranzo", "colazione", "pizza"],
    sonno: ["sonno", "dormi", "stanc", "riposo"],
    soldi: ["soldi", "euro", "bolletta", "spesa", "stipendio", "comprare"],
    sport: ["palestra", "corr", "sport", "allen"],
    lavoro: ["lavoro", "ufficio", "capo", "colloquio", "esame"],
  };

  const FRASI_TEMA = {
    fame: {
      dolce: { si: "Amore, hai fame? Mangia qualcosa e poi decidi, io approvo.", no: "Amore, prima mangia qualcosa: la fame non fa scegliere bene." },
      severo: { si: "Mangia, che la fame non ti rende lucido. Approvato.", no: "La fame non è una scelta. Mangia e ripensaci." },
      ironico: { si: "Ah, la fame. Ottimo motivo per decidere: il corpo parla, tu ascolta.", no: "La fame non è un criterio. Mangia, e poi ne riparliamo." },
    },
    sonno: {
      dolce: { si: "Dormi tranquillo, amore: hai proprio bisogno di riposo.", no: "Amore, sei stanco: andiamo a dormire e ne riparliamo domattina." },
      severo: { si: "Dormire è sensato. Per una volta non discuto.", no: "Stanchezza non è una scusa. Riposa e poi decidi." },
      ironico: { si: "Dormire: l'unica decisione che nessuno può contestarti.", no: "Con il sonno che hai, anche le decisioni dormono." },
    },
    soldi: {
      dolce: { si: "Amore, con i soldi bisogna essere prudenti: mi piace come ragioni.", no: "Tesoro, prima di spendere facciamo i conti insieme." },
      severo: { si: "Spendere con criterio. Accettabile, per una volta.", no: "Spendere così è un errore. Rifai i conti." },
      ironico: { si: "Spendere con cura è già un risparmio, a modo suo.", no: "Il portafoglio ha già detto no. Io ti do solo la conferma." },
    },
    sport: {
      dolce: { si: "Brava, amore: il movimento ti fa bene. Ti ammiro.", no: "Amore, un giorno di riposo non ti fa male. Domani si riparte." },
      severo: { si: "Sport? Bene. Non montarti la testa, conta la costanza.", no: "Rimandare non porta da nessuna parte. Ma oggi lascia perdere." },
      ironico: { si: "Palestra! Il corpo ringrazia, il divano un po' meno.", no: "La palestra aspetta. Lei non si offende, tranquillo." },
    },
    lavoro: {
      dolce: { si: "Amore, sul lavoro sei bravissimo: si vede dalle scelte.", no: "Tesoro, non farti prendere dalla fretta sul lavoro. Ci pensiamo insieme." },
      severo: { si: "Lavoro serio, decisione seria. Va bene.", no: "Sul lavoro non si improvvisa. No." },
      ironico: { si: "Il lavoro approva, il capo forse no. Io sì.", no: "Sul lavoro le parole contano: questa non le rende convincenti." },
    },
  };

  // Riconosce il tema di un testo, oppure restituisce null.
  function temaDi(testo) {
    const minuscolo = String(testo || "").toLowerCase();
    const temi = Object.keys(PAROLE_TEMA);
    for (let i = 0; i < temi.length; i++) {
      if (PAROLE_TEMA[temi[i]].some((parola) => minuscolo.indexOf(parola) !== -1)) return temi[i];
    }
    return null;
  }

  const LIMITE_GIORNALIERO = 10;

  // Il gatto approva o boccia. "casuale" e' un numero tra 0 e 1.
  function giudica(carattere, casuale, testo) {
    const gruppo = FRASI[carattere] || FRASI.dolce;
    const probabilita = PROBABILITA_APPROVAZIONE[carattere] || 0.5;
    const approva = casuale < probabilita;
    const tema = temaDi(testo);
    if (tema && FRASI_TEMA[tema] && FRASI_TEMA[tema][carattere]) {
      return { approva: approva, frase: FRASI_TEMA[tema][carattere][approva ? "si" : "no"] };
    }
    const frasi = approva ? gruppo.si : gruppo.no;
    const frase = frasi[Math.floor(casuale * 100000) % frasi.length];
    return { approva: approva, frase: frase };
  }

  function decisioniDi(storico, giorno) {
    return storico.filter((d) => d.data === giorno);
  }

  function puoDecidere(storico, giorno) {
    return decisioniDi(storico, giorno).length < LIMITE_GIORNALIERO;
  }

  // Elenca n giorni, a partire da "giorno" e tornando indietro. Formato AAAA-MM-GG.
  function giorniPrecedenti(giorno, n) {
    const [anno, mese, giornoNum] = giorno.split("-").map(Number);
    const base = Date.UTC(anno, mese - 1, giornoNum);
    const risultato = [];
    for (let i = 0; i < n; i++) {
      risultato.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
    }
    return risultato;
  }

  // Quante decisioni approvate e bocciate negli ultimi 7 giorni.
  function riepilogo(storico, giorno) {
    const giorni = giorniPrecedenti(giorno, 7);
    const ultime = storico.filter((d) => giorni.indexOf(d.data) !== -1);
    const approvate = ultime.filter((d) => d.approva).length;
    return { totale: ultime.length, approvate: approvate, bocciate: ultime.length - approvate };
  }

  const api = { giudica, temaDi, puoDecidere, decisioniDi, riepilogo, giorniPrecedenti, LIMITE_GIORNALIERO };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.Gatto = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
