# Gatto Giudice: attivazione pagamenti Google Play (V30, bozza tecnica)

**La V29 è distribuibile come build, NON certificata per incassare. La V30 qui preparata NON va rilasciata prima che tutti i controlli sotto siano conclusi.** I download della V29 sono disponibili come Release GitHub pubblica.

## 1. Prodotti da attivare in Play Console

Apri la stessa app `com.aivevia.gattogiudice` (non edizione personale).

| ID prodotto (esatto) | Tipo | Funzione |
|---|---|---|
| `giudice_severo_premium` | Prodotto in-app UNA TANTUM non consumabile | Sblocca Severo |
| `giudice_ironico_premium` | Prodotto in-app UNA TANTUM non consumabile | Sblocca Ironico |
| `giudice_corrotto_premium` | Prodotto in-app UNA TANTUM non consumabile | Sblocca Corrotto |
| `giudice_pigro_premium` | Prodotto in-app UNA TANTUM non consumabile | Sblocca Pigro |
| `giudice_supremo_abbonamento` | Abbonamento | Supremo, con piano base attivo |

Non inventare prezzi: stabilirli nel Play Console. Assicurarsi che ciascun prodotto sia ATTIVO. Su Supremo creare/attivare un piano base, non solo il prodotto padre.

## 2. Incassi e autorizzazioni API (configurazione riservata al titolare)

1. Play Console > Impostazioni > Monetizzazione > Profilo pagamenti: confermare account commerciante, dati fiscali e metodo per ricevere pagamenti verificato.
2. Google Cloud Console: usare un progetto di proprietà del titolare; abilitare Google Play Developer API e creare un account di servizio.
3. Play Console > Utenti e autorizzazioni > Invita nuovi utenti: invitare l'**indirizzo dell'account di servizio**, dando le autorizzazioni necessarie per leggere dati finanziari/ordini e gestire ordini/abbonamenti.
4. Salvare la chiave JSON dell'account di servizio **come secret Cloudflare** del Worker `gatto-giudice-ai`, con nome `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. Non committare e non incollare la chiave nel repository o nella chat.
5. Testare `/billing-status` e `/verify-play` nel Worker di V30. Il servizio deve convalidare i token con le API Google prima di concedere i prodotti. ATTENZIONE: questo endpoint non è ancora pubblicato mentre manca il secret.
6. Verificare licenze di prova, acquisti e ripristino da app ottenuta tramite il canale di test Play; non usare pagamenti reali per effettuare la prova.

## 3. Regole di sicurezza applicate nel codice V30

- `store.validator` invia la ricevuta al Worker; il Worker verifica token e stato presso Google usando `androidpublisher`.
- Il pulsante acquisti non consente di avviare nuove transazioni se non è configurato il server di verifica.
- I pagamenti NON vengono finalizzati automaticamente in assenza di validazione.
- Un abbonamento Supremo scaduto oppure in sospensione non sblocca il giudice. Se la disdetta conserva accesso fino alla fine del periodo pagato, il server verifica che la data di scadenza sia futura.
- Gli acquisti una tantum sono non consumabili. `Ripristina acquisti` forza il recupero dal Play Store.
- Sono ancora da collaudare con Google: approvazione/pending, rinnovo, rimborso, revoca, ripristino dopo cambio dispositivo, riconciliazione post-acquisto e riscontri webhook/RTDN.
- Le chiavi di servizio NON sono in questo repository.

## 4. Checklist prima di richiedere produzione

- [ ] 12 tester attivi nel test chiuso per almeno 14 giorni consecutivi, verificati in Play Console.
- [ ] Release nel test chiuso, feedback raccolto, test fisici su tutti e sei i gatti.
- [ ] Profilo commerciante con incassi verificati.
- [ ] Cinque prodotti e piano base Supremo attivi e con prezzi.
- [ ] Account servizio autorizzato; secret Cloudflare installato.
- [ ] Token di acquisto verificati sul server; acquisti di prova e ripristino provati dal telefono.
- [ ] Privacy, modulo Sicurezza dei dati, classificazione contenuti, pubblicità, accesso app, paesi e materiali dello Store completati.
- [ ] Crediti AI: limite giornaliero persistente e anti-abuso documentati.
- [ ] Inviare la richiesta di accesso produzione; attendere approvazione Google. 14 giorni da soli NON comportano pubblicazione automatica.

Documentazione Google:
- https://developers.google.com/android-publisher/getting_started
- https://developer.android.com/google/play/billing/security
- https://support.google.com/googleplay/android-developer/answer/14151465?hl=it
- https://support.google.com/googleplay/android-developer/answer/1153481?hl=it
- https://support.google.com/googleplay/android-developer/answer/140504?hl=it
