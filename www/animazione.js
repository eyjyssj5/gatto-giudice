/* Il Gatto Giudice: animazione sobria delle immagini fotografiche originali.
 * Le fotografie inviate sono mantenute intatte, e la voce del dispositivo
 * attiva un movimento lento. Il movimento non e' un lip-sync facciale.
 */
(function(root) {
 "use strict";
 const foto=document.getElementById("gatto");
 const figura=document.getElementById("gatto-figura");
 if(!foto||!figura) return;
 const controller={
   parla() {figura.classList.remove("pensando");figura.classList.add("parlante");},
   parola() {},
   ferma() {figura.classList.remove("parlante");},
   pensa(attivo) {figura.classList.toggle("pensando",Boolean(attivo));},
   aggiorna(carattere) {
     if (["dolce","severo","ironico"].includes(carattere)) {
       figura.dataset.carattere = carattere;
     }
   }
 };
 root.GattoAnimato=controller;
})(window);
