/* Check-in UI; all six portraits remain visible and selectable for movement preview. */
(()=>{'use strict';const $=id=>document.getElementById(id);const C=window.GattoCheckin;
const msg={
it:{title:'Check-in: sblocca i gatti',days:'Giorni validi: {n}/40 · Serie: {s}/10',action:'Check-in di oggi',done:'Check-in già fatto oggi',reset:'Hai saltato un giorno: azzerata solo la serie incompleta, non i gatti già sbloccati.',next:'Prossimo: {cat} dopo {n} giorni.',success:'Check-in registrato.',reward:'Sbloccato: {cat}!',finished:'Sbloccati i quattro gatti. Supremo solo con abbonamento.',note:'Devi fare check-in ogni giorno. Se salti un giorno perdi il progresso parziale verso il prossimo gatto, ma mantieni quelli già sbloccati. Dati locali sul telefono.'},
en:{title:'Daily check-in unlocks',days:'Earned days: {n}/40 · Streak: {s}/10',action:'Check in today',done:'Already checked in today',reset:'Missing a day reset only unfinished progress. Unlocked judges are kept.',next:'Next: {cat} at day {n}.',success:'Check-in saved.',reward:'Unlocked {cat}!',finished:'Four judges unlocked; Supreme subscription only.',note:'One check-in each day. Missing a day resets the current unfinished streak. Previously unlocked judges are kept.'},
es:{title:'Check-in diario',days:'Días válidos: {n}/40 · Racha: {s}/10',action:'Check-in de hoy',done:'Ya registrado hoy',reset:'Saltaste un día: se pierde solo la racha incompleta.',next:'Próximo: {cat} al día {n}.',success:'Check-in guardado.',reward:'¡Desbloqueado: {cat}!',finished:'Cuatro jueces desbloqueados. Supremo solo por suscripción.',note:'Si pierdes un día se reinicia solo la racha incompleta.'}};
const names={severo:'Severo',ironico:'Ironico',corrotto:'Corrotto',pigro:'Pigro'};
const tr=()=>msg[$('lingua').value]||msg.en;
const fmt=(s,v)=>s.replace(/\{(\w+)\}/g,(_,k)=>String(v[k]??''));
function render(feedback=''){
const x=C.progress(),t=tr();
$('checkin-title').textContent=t.title;
$('checkin-total').textContent=fmt(t.days,{n:x.count,s:x.streak});
$('checkin-progress').value=x.count;
const b=$('checkin-button');b.disabled=x.checkedToday||x.unlocked===40;b.textContent=x.unlocked===40?t.finished:x.checkedToday?t.done:t.action;
$('checkin-feedback').textContent=feedback||x.missed?t.reset:'';
$('checkin-next').textContent=x.next?fmt(t.next,{cat:names[x.next],n:C.REWARDS[x.next]}):t.finished;
$('checkin-storage-notice').textContent=t.note;
const list=$('checkin-milestones');list.replaceChildren();
x.milestones.forEach(m=>{const li=document.createElement('li');li.textContent=(m.unlocked?'✓ ':'🔒 ')+names[m.id]+' · '+m.days+' giorni';if(m.unlocked)li.className='is-earned';list.append(li);});
}
$('checkin-button').addEventListener('click',()=>{const x=C.checkIn(),t=tr();let message=x.reward?fmt(t.reward,{cat:names[x.reward]}):x.credited?t.success:'';if(x.reset)message=t.reset+' '+message;render(message);window.dispatchEvent(new Event('gatto-premium-update'));});
$('lingua').addEventListener('change',()=>render());
render();
})();
