# Gatto Giudice: attivazione AI gratuita

Questa modifica mantiene la web app esistente, con i tre caratteri (dolce, severo, ironico), lo storico e le 10 sentenze al giorno. In piu' aggiunge: risposte generate da Workers AI, sintesi vocale italiana del browser e animazione leggera del gatto quando parla. L'animazione muove l'intera immagine, non la bocca in lip-sync.

## Da attivare una sola volta su Cloudflare
1. Accedi all'account Cloudflare dove vuoi usare il piano gratuito Workers.
2. Da un PC, con Node.js installato, apri una console nella cartella del repository.
3. Esegui `npx wrangler login` e segui l'accesso.
4. Esegui `npx wrangler deploy`. Usa il file `wrangler.toml` di questa cartella. Verranno creati automaticamente i binding `AI` e `LIMITER`.
5. Copia l'URL fornito dal comando, ad esempio `https://gatto-giudice-ai.NOME-ACCOUNT.workers.dev`.
6. Nel file `www/app.js`, sostituisci `INSERISCI_URL_DEL_WORKER` con quell'URL (senza `/giudica` alla fine).
7. Pubblica il ramo delle modifiche su `main` e attendi l'aggiornamento della pagina GitHub Pages.

Non serve creare ne' inserire una chiave AI nel browser; Cloudflare Workers AI usa un binding server-side. Nessun costo iniziale con il piano Free entro l'allocazione gratuita giornaliera. La quota puo' esaurirsi, quindi controlla la dashboard Cloudflare prima di promettere un servizio illimitato.

## Verifiche
- `npm test` lancia i test esistenti e quelli nuovi.
- Non attivare mai una API key come stringa visibile in `www/app.js`.
- Durante la configurazione, il sito mantiene le frasi preimpostate e resta utilizzabile.
- La voce puo' richiedere la pressione di «Ascolta la sentenza» su iOS e altri browser con restrizioni audio.
- Il limite delle 10 decisioni al giorno e' principalmente locale: in produzione serve un limite server-side persistente se si vogliono evitare abusi su vasta scala.
