/* Nuovi personaggi del Gatto Giudice: veri livelli vettoriali animabili.
 * Nessuna oscillazione rapida dell'immagine, nessuna API a pagamento.
 * I componenti SVG sono separati: testa, orecchie, palpebre, muso, mandibola,
 * occhi, braccia, coda, corpo e toga. La bocca segue il parlato.
 */
(function (root) {
  "use strict";
  const foto = document.getElementById("gatto");
  const figura = document.getElementById("gatto-figura");
  const vecchioCanvas = document.getElementById("gatto-animato");
  if (!foto || !figura) return;

  const palette = {
    dolce: {
      nome:"DOLCE", fur:"#e9913f", light:"#ffd18d", dark:"#9d4c20",
      chest:"#fff2d6", eye:"#74bb68", inner:"#bd5a54", eyebrow:"#a95421",
      stripes:"M136 73q-15 11-20 25 M163 63q-10 13-13 26 M200 63q4 12 9 25 M225 71q10 11 12 22",
    },
    severo: {
      nome:"SEVERO", fur:"#77757a", light:"#bcb5b4", dark:"#424149",
      chest:"#dad9d7", eye:"#d4be4a", inner:"#b86976", eyebrow:"#37363b",
      stripes:"M132 70q-5 20 4 29 M155 60q-4 15 0 31 M184 54q2 22 2 35 M212 62q-2 17 4 29 M231 72q8 15 7 27",
    },
    ironico: {
      nome:"IRONICO", fur:"#d99846", light:"#ffe0a8", dark:"#8d4e24",
      chest:"#fff1cf", eye:"#8ec66f", inner:"#d87579", eyebrow:"#925020",
      stripes:"M137 76q-11 9-15 25 M155 63q-5 10-6 26 M183 58q-1 17 2 29 M211 64q5 11 8 26 M232 77q12 14 10 22",
    },
  };

  // Le parti del volto hanno ciascuna un gruppo SVG indipendente.
  const BASE = [
    '<svg class="rig-svg" viewBox="0 0 360 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gatto giudice @NAME@ animato">',
    '<defs>',
    '<linearGradient id="rig-fur" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="@LIGHT@"/><stop offset=".68" stop-color="@FUR@"/><stop offset="1" stop-color="@DARK@"/></linearGradient>',
    '<linearGradient id="rig-robe" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#354057"/><stop offset="1" stop-color="#101826"/></linearGradient>',
    '<linearGradient id="rig-wood" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a56132"/><stop offset=".5" stop-color="#794222"/><stop offset="1" stop-color="#542e19"/></linearGradient>',
    '<radialGradient id="rig-eye"><stop stop-color="@EYE@"/><stop offset=".78" stop-color="@EYE@"/><stop offset="1" stop-color="#3b5935"/></radialGradient>',
    '<filter id="rig-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity=".20"/></filter>',
    '</defs>',
    '<ellipse cx="180" cy="385" rx="119" ry="19" fill="#302a2b" opacity=".12"/>',

    // Coda, corpo e toga rimangono quasi fermi mentre parla.
    '<g class="rig-tail">',
      '<path d="M256 310 Q326 314 303 217 Q292 188 307 171" stroke="@DARK@" stroke-width="38" stroke-linecap="round" fill="none"/>',
      '<path d="M256 311 Q323 308 300 218 Q293 196 307 172" stroke="@FUR@" stroke-width="30" stroke-linecap="round" fill="none"/>',
      '<path d="M300 198l-17 10 M306 239l-24-2 M304 277l-25-12" stroke="@DARK@" stroke-width="8" fill="none" opacity=".35"/>',
    '</g>',
    '<g class="rig-corpo">',
      '<ellipse cx="180" cy="304" rx="91" ry="100" fill="url(#rig-fur)"/>',
      '<path d="M107 265 Q83 280 68 341 L90 380H270L294 341Q280 277 248 261L216 278H143Z" fill="url(#rig-robe)" stroke="#111825" stroke-width="3"/>',
      '<path d="M117 267 Q120 309 134 378 M244 267 Q240 315 226 378" stroke="#c9a04e" stroke-width="6" fill="none"/>',
      '<path d="M155 263L178 290L204 263L201 343Q183 355 161 342Z" fill="#f7f1e5"/>',
      '<path d="M177 286v58 M163 296l30 6 M163 308l30 6 M163 320l30 6" stroke="#ccc2b5" stroke-width="2" fill="none"/>',
      '<ellipse cx="122" cy="355" rx="25" ry="19" fill="@FUR@" stroke="@DARK@" stroke-width="2"/>',
      '<ellipse cx="237" cy="355" rx="25" ry="19" fill="@FUR@" stroke="@DARK@" stroke-width="2"/>',
      '<path d="M108 354v7 M121 352v9 M234 354v8 M247 354v8" stroke="@DARK@" stroke-width="2" opacity=".5"/>',
    '</g>',
    '<g class="rig-braccio">',
      '<path d="M260 286 Q284 280 298 305 Q308 319 294 333 Q275 344 262 324Z" fill="url(#rig-robe)" stroke="#c09b58" stroke-width="3"/>',
      '<ellipse cx="295" cy="315" rx="20" ry="22" fill="@FUR@" stroke="@DARK@" stroke-width="2"/>',
      '<path d="M280 312Q292 304 308 313 M282 323Q294 315 310 322" stroke="@DARK@" stroke-width="2" fill="none" opacity=".35"/>',
      '<g class="rig-martelletto" transform="translate(0 0)">',
      '<path d="M298 312L320 279" stroke="#71411f" stroke-width="7" stroke-linecap="round"/>',
      '<rect x="301" y="269" width="37" height="16" rx="5" fill="url(#rig-wood)" stroke="#3f2618" stroke-width="2" transform="rotate(-28 320 277)"/>',
      '</g>',
    '</g>',
    // Testa e orecchie sono parti autonome, pronte per movimento leggero.
    '<g class="rig-testa" filter="url(#rig-shadow)">',
      '<g class="rig-orecchie">',
        '<path d="M100 114 Q68 18 92 18 Q131 18 151 95Z" fill="@DARK@" stroke="@DARK@" stroke-width="5"/>',
        '<path d="M260 114 Q292 18 268 18 Q229 18 209 95Z" fill="@DARK@" stroke="@DARK@" stroke-width="5"/>',
        '<path d="M107 98 Q85 31 99 36Q126 45 134 97Z" fill="@INNER@"/>',
        '<path d="M253 98 Q275 31 261 36Q234 45 226 97Z" fill="@INNER@"/>',
      '</g>',
      '<ellipse cx="180" cy="155" rx="115" ry="105" fill="url(#rig-fur)" stroke="@DARK@" stroke-width="3"/>',
      '<path d="@STRIPES@" stroke="@DARK@" stroke-width="8" stroke-linecap="round" fill="none" opacity=".36"/>',
      '<ellipse cx="96" cy="187" rx="35" ry="42" fill="@LIGHT@" opacity=".80"/>',
      '<ellipse cx="264" cy="187" rx="35" ry="42" fill="@LIGHT@" opacity=".80"/>',
      '<path d="M83 203Q111 221 142 206 M217 206Q252 220 278 201" stroke="@DARK@" stroke-width="2" fill="none" opacity=".27"/>',
      // Occhi destro e sinistro.
      '<g class="rig-occhi">',
        '<ellipse cx="137" cy="146" rx="29" ry="34" fill="#fff8ee" stroke="@DARK@" stroke-width="4"/>',
        '<ellipse cx="223" cy="146" rx="29" ry="34" fill="#fff8ee" stroke="@DARK@" stroke-width="4"/>',
        '<g class="rig-pupille">',
          '<ellipse cx="141" cy="146" rx="18" ry="25" fill="url(#rig-eye)"/>',
          '<ellipse cx="219" cy="146" rx="18" ry="25" fill="url(#rig-eye)"/>',
          '<ellipse cx="142" cy="149" rx="9" ry="20" fill="#171d1c"/>',
          '<ellipse cx="218" cy="149" rx="9" ry="20" fill="#171d1c"/>',
          '<circle cx="136" cy="135" r="6" fill="#fff"/><circle cx="213" cy="135" r="6" fill="#fff"/>',
          '<circle cx="147" cy="157" r="2" fill="#fff" opacity=".7"/><circle cx="226" cy="157" r="2" fill="#fff" opacity=".7"/>',
        '</g>',
      '</g>',
      '<g class="rig-palpebre" opacity="0">',
        '<ellipse cx="137" cy="146" rx="31" ry="35" fill="@FUR@"/>',
        '<ellipse cx="223" cy="146" rx="31" ry="35" fill="@FUR@"/>',
        '<path d="M110 147Q137 163 163 147 M197 147Q223 163 250 147" stroke="@DARK@" stroke-width="5" stroke-linecap="round" fill="none"/>',
      '</g>',
      '<g class="rig-sopracciglia">',
        '@BROWS@',
      '</g>',
      // Parte superiore del muso. Bocca e mandibola sono distinte.
      '<path d="M145 196Q155 187 180 197Q205 185 215 196" fill="none" stroke="@DARK@" stroke-width="2" opacity=".4"/>',
      '<g class="rig-bocca">',
        '<ellipse class="rig-bocca-interno" cx="180" cy="230" rx="24" ry="21" fill="#3e1720" stroke="#853e41" stroke-width="2" transform="scale(1 .1)" style="transform-box:fill-box;transform-origin:center"/>',
        '<g class="rig-lingua"><ellipse cx="180" cy="242" rx="11" ry="7" fill="#e78b99"/></g>',
      '</g>',
      '<g class="rig-mandibola">',
        '<path d="M140 235Q180 262 220 235Q218 273 180 278Q142 273 140 235Z" fill="@CHEST@" stroke="@DARK@" stroke-width="1.5"/>',
        '<path d="M147 234Q180 248 213 234" fill="none" stroke="@DARK@" stroke-width="2"/>',
      '</g>',
      '<g class="rig-muso-superiore">',
        '<ellipse cx="157" cy="208" rx="27" ry="18" fill="@CHEST@"/>',
        '<ellipse cx="203" cy="208" rx="27" ry="18" fill="@CHEST@"/>',
        '<path d="M164 191Q180 182 196 191Q192 201 180 204Q168 201 164 191Z" fill="#d9858b" stroke="@DARK@" stroke-width="2"/>',
        '<path d="M180 204v18 M180 222q-15 15-29 3 M180 222q15 15 29 3" fill="none" stroke="@DARK@" stroke-width="2.5" stroke-linecap="round"/>',
        '<g opacity=".5" fill="@DARK@"><circle cx="147" cy="202" r="2.5"/><circle cx="153" cy="212" r="2"/><circle cx="214" cy="202" r="2.5"/><circle cx="207" cy="212" r="2"/></g>',
      '</g>',
      '<g class="rig-baffi" stroke="@CHEST@" stroke-width="2" fill="none" stroke-linecap="round">',
        '<path d="M144 213Q103 202 77 210 M146 223Q99 222 73 234 M143 231Q107 241 89 252"/>',
        '<path d="M216 213Q256 202 283 210 M214 223Q260 222 287 234 M217 231Q253 241 273 252"/>',
      '</g>',
    '</g>',
    // Scritta sul banco del giudice
    '<g class="rig-banco">',
      '<rect x="43" y="372" width="274" height="52" rx="12" fill="url(#rig-wood)" stroke="#412718" stroke-width="5"/>',
      '<rect x="105" y="379" width="150" height="36" rx="7" fill="#e9c987" stroke="#9a6d32" stroke-width="3"/>',
      '<text x="180" y="404" font-size="20" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#573b1e">@NAME@</text>',
    '</g>',
    '</svg>'
  ].join("");

  function creaSVG(carattere) {
    const p = palette[carattere] || palette.dolce;
    const brows = carattere === "severo"
      ? '<path d="M111 113Q134 114 162 129 M249 113Q227 114 197 129" stroke="@BROW@" stroke-width="11" fill="none" stroke-linecap="round"/>'
      : carattere === "ironico"
      ? '<path d="M110 117Q134 101 160 115 M199 118Q221 134 247 116" stroke="@BROW@" stroke-width="9" fill="none" stroke-linecap="round"/>'
      : '<path d="M112 119Q134 108 159 117 M202 117Q225 108 246 119" stroke="@BROW@" stroke-width="7" fill="none" stroke-linecap="round"/>';
    const swaps = {
      "@NAME@": p.nome, "@FUR@": p.fur, "@LIGHT@": p.light,
      "@DARK@": p.dark, "@CHEST@": p.chest, "@EYE@": p.eye,
      "@INNER@": p.inner, "@BROW@": p.eyebrow, "@STRIPES@": p.stripes,
      "@BROWS@": brows,
    };
    let svg = BASE;
    for (const [key, val] of Object.entries(swaps)) svg = svg.split(key).join(val);
    return svg;
  }

  let stato = "";
  let parlando = false;
  let istanteInizio = 0;
  let confineParola = 0;
  let frame = 0;
  let livello = 0;
  let istantePrecedente = 0;
  let blinkTimer = null;
  let blinkHalf = null;
  let blinkEnd = null;

  function trova(part) { return figura.querySelector(part); }
  function preferisceRiduzione() {
    return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function imposta(carattere) {
    if (!palette[carattere]) carattere = "dolce";
    if (carattere === stato) return;
    stato = carattere;
    const vecchio = trova(".rig-svg");
    if (vecchio) vecchio.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = creaSVG(carattere);
    const disegno = wrapper.firstElementChild;
    figura.appendChild(disegno);
    figura.classList.add("animazione-pronta");
    if (vecchioCanvas) vecchioCanvas.hidden = true;
    livello = 0;
    istantePrecedente = 0;
    coloraBocca(0);
    if (parlando) figura.classList.add("parlante");
    programmaBlink();
  }
  function coloraBocca(apertura) {
    const bocca = trova(".rig-bocca-interno");
    const mascella = trova(".rig-mandibola");
    const lingua = trova(".rig-lingua");
    if (!bocca || !mascella || !lingua) return;
    bocca.style.transform = "scaleY(" + (0.08 + apertura * 1.06).toFixed(3) + ")";
    mascella.setAttribute("transform", "translate(0 " + (apertura * 12).toFixed(2) + ")");
    lingua.style.opacity = String(Math.max(0, Math.min(1, (apertura - 0.28) * 2.1)));
  }
  function fotogramma(ora) {
    frame = 0;
    const dt = Math.min(80, Math.max(1, ora - (istantePrecedente || ora)));
    istantePrecedente = ora;
    let bersaglio = 0;
    if (parlando && !preferisceRiduzione()) {
      const t = (ora - istanteInizio) / 1000;
      // Doppia oscillazione dolce: sillabe con pause, non tremolio meccanico.
      const sillaba = Math.pow(Math.max(0, Math.sin(t * Math.PI * 6.1)), 1.16);
      const infles = 0.80 + 0.20 * Math.cos(t * Math.PI * 0.85);
      const accento = (ora - confineParola < 220) ? 1 : 0.80;
      bersaglio = (0.14 + 0.75 * sillaba) * infles * accento;
    }
    livello += (bersaglio - livello) * Math.min(1, dt / 62);
    coloraBocca(livello);
    if (parlando || livello > 0.012) frame = root.requestAnimationFrame(fotogramma);
    else {
      livello = 0;
      coloraBocca(0);
      istantePrecedente = 0;
    }
  }
  function programmaBlink() {
    if (blinkTimer) root.clearTimeout(blinkTimer);
    if (blinkHalf) root.clearTimeout(blinkHalf);
    if (blinkEnd) root.clearTimeout(blinkEnd);
    const occhi = trova(".rig-palpebre");
    if (occhi) occhi.style.opacity = "0";
    blinkTimer = root.setTimeout(function () {
      const palpebre = trova(".rig-palpebre");
      if (palpebre && !preferisceRiduzione()) {
        palpebre.style.opacity = "1";
        blinkHalf = root.setTimeout(() => { palpebre.style.opacity = ".5"; }, 100);
        blinkEnd = root.setTimeout(() => { palpebre.style.opacity = "0"; }, 170);
      }
      programmaBlink();
    }, 3500 + Math.random() * 3800);
  }
  const controller = {
    parla() {
      parlando = true;
      istanteInizio = root.performance.now();
      confineParola = istanteInizio;
      figura.classList.add("parlante");
      figura.classList.remove("pensando");
      if (!frame) frame = root.requestAnimationFrame(fotogramma);
    },
    parola() { confineParola = root.performance.now(); },
    ferma() {
      parlando = false;
      figura.classList.remove("parlante");
      if (!frame) frame = root.requestAnimationFrame(fotogramma);
    },
    pensa(attivo) { figura.classList.toggle("pensando", Boolean(attivo)); },
    aggiorna() {
      const src = foto.getAttribute("src") || "";
      imposta(src.includes("severo") ? "severo" : src.includes("ironico") ? "ironico" : "dolce");
    },
  };
  root.GattoAnimato = controller;
  controller.aggiorna();
})(window);
