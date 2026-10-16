# Gatto Giudice: voci open source su SERVER CLOUD, nessun PC personale

Questa e' la scelta di distribuzione per Google Play e App Store: il tuo PC puo' restare SPENTO.
Piper e' un MOTORE vocale gratuito, non un servizio di hosting. Lo eseguiamo su una
VM cloud Oracle Always Free; l'utente usa solo l'app.

## Stato
Codice del server: PRONTO nella branch di sviluppo. Server cloud: NON ancora attivato.
Non unire questa branch su main fino al test con una VM reale, licenze verificate e token presenti.

## Risorse e limiti
- Oracle Always Free consente alcune VM nel limite gratuito, ma richiede account
  personale e in genere una carta per verificare l'identita'.
- La disponibilita' di VM A1 e' limitata per regione; Oracle puo' recuperare VM
  inutilizzate e le quote gratuite possono cambiare. Non garantire disponibilita'
  universale gratuita per un'app commerciale ad alto traffico.
- Scegli l'istanza marcata **Always Free Eligible**, Ampere A1, massimo le quote
  free mostrate nel TUO pannello. Non scegliere risorse a pagamento.
- Quando i modelli sono scaricati, il servizio non paga per ogni parola sintetizzata.
  Restano limiti di CPU, memoria, rete e licenze dei modelli. La scalabilita' va misurata.

## Preparazione, una volta sola (su VM Ubuntu ARM64 Oracle)
1. Crea account Oracle Cloud da https://www.oracle.com/it/cloud/free/
2. Avvia una VM **Ampere A1 Always Free** con Ubuntu 24.04 ARM64, se disponibile,
   con risorse entro quote mostrate.
3. Nel server installa Docker e Docker Compose plugin dal repository ufficiale Docker.
4. Copia il repository nel server, apri la cartella `voice_server/`,
   copia `.env.example` in `.env` e genera un segreto casuale.
   `chmod 600 .env`; `.env` non va mai caricato su GitHub.
5. Da Cloudflare (gia' utilizzato da AIVEVIA) crea un tunnel gestito
   chiamato, ad esempio, "gatto-voce". Prendi il token da installazione Docker.
   Mettilo solo nella variabile `CLOUDFLARE_TUNNEL_TOKEN` del file `.env`.
6. Nel tunnel crea un hostname HTTPS dedicato di tua proprieta'
   con destinazione `http://tts:8765` (nome del container nella stessa rete).
   Non aprire porte inbound TCP 8765 sulla VM.
7. Esegui `docker compose up -d --build` dentro `voice_server/`.
8. Nel Worker Cloudflare `gatto-giudice-ai`:
   - Secret `TTS_SECRET`: identico al `VOICE_SHARED_SECRET` della VM.
   - Secret/Variable `TTS_URL`: URL HTTPS completo che termina in `/voce`.
   Non mettere URL o segreto nel JavaScript pubblico.
9. Esegui test audio REALI: sentenza italiana in italiano, spagnola in spagnolo,
   e prova ciascuno dei 12 modelli. Regola cache, volume e latenza prima della vendita.
10. SOLO allora unisci questo ramo al principale e rigenera le app Capacitor.

## Sicurezza
Non usare Quick Tunnel temporanei come soluzione permanente. Usa Cloudflare Tunnel.
Non incollare in chat password, token, segreti o numeri di carta.
Il Worker richiede il token al server; il browser non conosce il token.
Rate limit nella funzione Worker, modello su server e nessuna porta pubblica diretta.

## Cosa manca per gli store
- I tre gatti hanno tre STILI vocali, per ora non tre timbri professionali distinti
  verificati in OGNI lingua. Servono selezione e test qualitativi delle voci.
- Verifica licenze dei modelli specifici di Piper per uso commerciale.
- Compilazioni firmate AAB (Google Play) e IPA (App Store), oltre alla parte legale.
- Test su iPhone e Android veri e sul server cloud effettivo.

Documentazione Cloudflare: https://developers.cloudflare.com/tunnel/get-started/
Documentazione Oracle: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
