/* Il Gatto Giudice: micro-animazione locale del muso, senza servizi esterni.
 * La bocca segue approssimativamente il ritmo della voce del browser:
 * non e' un lip-sync fonetico e non anima davvero un modello 3D.
 */
(function (root) {
  "use strict";
  const figura = document.getElementById("gatto-figura");
  const foto = document.getElementById("gatto");
  const tela = document.getElementById("gatto-animato");
  const ctx = tela && tela.getContext && tela.getContext("2d", { alpha: true });
  if (!figura || !foto || !ctx) {
    root.GattoAnimato = { parla() {}, ferma() {}, pensa() {}, aggiorna() {} };
    return;
  }

  // Posizione della bocca nelle tre immagini PNG originali.
  // Coordinate relative: nessuna immagine esterna ne' ritocco permanente.
  const profili = {
    dolce: { x: 0.49, y: 0.448, r: 0.046, mascella: 0.105, max: 1 },
    severo: { x: 0.548, y: 0.493, r: 0.040, mascella: 0.102, max: 0.86 },
    ironico: { x: 0.522, y: 0.460, r: 0.037, mascella: 0.095, max: 0.42 },
  };

  const movimentoRidotto = () => root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let staParlando = false;
  let animazione = 0;
  let origineVoce = 0;
  let ultimoConfineParola = 0;

  function disegnaBase() {
    if (!foto.complete || !foto.naturalWidth) return false;
    const w = foto.naturalWidth;
    const h = foto.naturalHeight;
    if (tela.width !== w || tela.height !== h) {
      tela.width = w;
      tela.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(foto, 0, 0, w, h);
    figura.classList.add("animazione-pronta");
    return true;
  }

  function disegnaBocca(apertura) {
    if (apertura <= 0.055) return;
    const stato = foto.getAttribute("src") || "";
    const carattere = stato.includes("severo") ? "severo" : stato.includes("ironico") ? "ironico" : "dolce";
    const p = profili[carattere];
    const w = tela.width, h = tela.height;
    const x = p.x * w, y = p.y * h;
    const r = p.r * w;
    const a = apertura * p.max;
    const ampiezza = r * (0.42 + a * 0.22);
    const altezza = 1.8 + a * 7.0;
    const spostamento = a * 10.0;

    // Ombra soffusa della bocca che si apre: niente deformazione dell'intero gatto.
    ctx.save();
    const ombra = ctx.createRadialGradient(x, y + 2, 0.2, x, y + 2, r * 1.15);
    ombra.addColorStop(0, "rgba(35,15,17,0.92)");
    ombra.addColorStop(0.6, "rgba(54,27,30,0.85)");
    ombra.addColorStop(1, "rgba(81,43,36,0.18)");
    ctx.fillStyle = ombra;
    ctx.beginPath();
    ctx.ellipse(x, y + spostamento * 0.13, ampiezza, altezza, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Piccola porzione inferiore del muso che segue l'apertura della mandibola.
    // Il resto dell'immagine non salta e non vibra.
    ctx.save();
    const rx = p.mascella * w;
    const top = y + 2 + spostamento * 0.7;
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.73, top);
    ctx.quadraticCurveTo(x, top + spostamento * 0.30, x + rx * 0.73, top);
    ctx.quadraticCurveTo(x + rx, top + rx * 0.85, x, top + rx * 1.45);
    ctx.quadraticCurveTo(x - rx, top + rx * 0.85, x - rx * 0.73, top);
    ctx.clip();
    ctx.drawImage(foto, 0, spostamento, w, h);
    ctx.restore();
  }

  function fotogramma(ora) {
    animazione = 0;
    if (!disegnaBase()) return;
    if (!staParlando) return;

    if (!movimentoRidotto()) {
      const t = (ora - origineVoce) / 1000;
      // Ritmo della voce: aperture tonde, pause tra parole, niente tremolio del corpo.
      const sillaba = Math.pow(Math.max(0, Math.sin(t * Math.PI * 6.0)), 1.3);
      const frase = 0.80 + 0.20 * Math.cos(t * Math.PI * 0.70);
      const accento = ora - ultimoConfineParola < 240 ? 1 : 0.78;
      const apertura = Math.min(1, sillaba * frase * accento);
      disegnaBocca(apertura);
    }
    animazione = root.requestAnimationFrame(fotogramma);
  }

  function avvia() {
    if (!animazione) animazione = root.requestAnimationFrame(fotogramma);
  }

  foto.addEventListener("load", () => {
    disegnaBase();
    if (staParlando) avvia();
  });
  foto.addEventListener("error", () => {
    figura.classList.remove("animazione-pronta");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animazione) root.cancelAnimationFrame(animazione);
      animazione = 0;
    } else if (staParlando) avvia();
  });

  root.GattoAnimato = {
    parla() {
      staParlando = true;
      origineVoce = root.performance.now();
      ultimoConfineParola = 0;
      figura.classList.add("parlante");
      figura.classList.remove("pensando");
      avvia();
    },
    parola() {
      ultimoConfineParola = root.performance.now();
    },
    ferma() {
      staParlando = false;
      figura.classList.remove("parlante");
      if (!animazione) disegnaBase();
    },
    pensa(attivo) {
      figura.classList.toggle("pensando", Boolean(attivo));
    },
    aggiorna() {
      if (!staParlando) disegnaBase();
    },
  };

  if (foto.complete && foto.naturalWidth) disegnaBase();
})(window);
