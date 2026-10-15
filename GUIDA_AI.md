# Gatto Giudice: attivazione AI gratuita

Questa modifica mantiene la web app esistente, con i tre caratteri (dolce, severo, ironico), lo storico e le 10 sentenze al giorno. In piu' aggiunge: risposte generate da Workers AI, sintesi vocale italiana del browser e animazione leggera del gatto quando parla. L'animazione muove l'intera immagine, non la bocca in lip-sync.

## Attivazione gratuita da browser (senza terminale)
1. Su GitHub apri e unisci la pull request della modifica nel branch `main`.
2. Apri https://dash.cloudflare.com/ e vai su **Workers & Pages > Create application > Import a repository**.
3. Collega GitHub e seleziona `eyjyssj5/gatto-giudice`, branch `main`.
4. Controlla che il nome Worker sia `gatto-giudice-ai` e la configurazione sia `wrangler.toml`; come comando di distribuzione usa `npx wrangler deploy` se richiesto.
5. Conferma **Save and Deploy**. Cloudflare mostrera' un URL `https://gatto-giudice-ai.NOME-ACCOUNT.workers.dev`.
6. Nel file `www/app.js` su GitHub sostituisci `INSERISCI_URL_DEL_WORKER` con l'URL apparso su Cloudflare, senza `/giudica` alla fine. Fai commit su `main`.
7. Riapri il sito GitHub Pages e verifica che ogni domanda riceva una risposta nuova, con voce e movimento.

## Alternativa da terminale (PC)
Dalla cartella del repository esegui `npx wrangler login`, quindi `npx wrangler deploy`. Copia l'URL `workers.dev` in `www/app.js` come al punto 6 precedente.

Non serve creare ne' inserire una chiave AI nel browser; Cloudflare Workers AI usa un binding server-side. Nessun costo iniziale con il piano Free entro l'allocazione gratuita giornaliera. La quota puo' esaurirsi, quindi controlla la dashboard Cloudflare prima di promettere un servizio illimitato.

## Verifiche
- `npm test` lancia i test esistenti e quelli nuovi.
- Non attivare mai una API key come stringa visibile in `www/app.js`.
- Durante la configurazione, il sito mantiene le frasi preimpostate e resta utilizzabile.
- La voce puo' richiedere la pressione di «Ascolta la sentenza» su iOS e altri browser con restrizioni audio.
- Il limite delle 10 decisioni al giorno e' principalmente locale: in produzione serve un limite server-side persistente se si vogliono evitare abusi su vasta scala.
