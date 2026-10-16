# Gatto Giudice AIVEVIA: 12 lingue e roadmap iOS / Android

## Cosa e' gia' implementato
- 12 interfacce: italiano, spagnolo, inglese, portoghese, francese, tedesco, olandese, polacco, russo, turco, arabo e cinese semplificato. L'arabo imposta RTL.
- Il Worker Cloudflare riceve `lingua`, valida il codice e istruisce il modello a rispondere nella lingua selezionata.
- Rimangono le fotografie esatte di Dolce, Severo e Ironico. Non vengono aggiunti gatti a pagamento in questa versione.
- Motore vocale Piper TTS **beta**: tap su «Ascolta» per caricare una voce dalla libreria Piper (WASM/ONNX) e generare il WAV nel browser/WebView. Nessuna installazione di Piper separata per il cliente; nessuna API key vocale nel dispositivo.
- Primo utilizzo della lingua richiede Internet e puo' scaricare decine di MB. Il sistema non usa la voce nativa tipo Siri. Se il sintetizzatore non e' compatibile col dispositivo, la risposta rimane scritta.
- Le tre personalita' vengono differenziate con altezza/velocita' tramite playbackRate. Questa **non** e' ancora una registrazione esclusiva con tre timbri professionali e neppure lip-sync fonetico.

## Limiti importanti prima della vendita su App Store e Google Play
- Non e' ancora stato verificato che i 12 modelli Piper funzionino sul WebView di ogni dispositivo. iOS Safari/WebView e' particolarmente delicato con WebAssembly, OPFS e riproduzione audio.
- Le voci Piper hanno **licenze diverse per modello**: verificare i MODEL_CARD prima di distribuirle in un'app commerciale. La licenza del software non garantisce automaticamente quella delle voci.
- La libreria Piper del browser e' importata on-demand da esm.sh. Prima del rilascio negli store conviene includere il runtime verificato nella build, evitare dipendenze runtime da CDN e fare test reali con i modelli approvati.
- I binari Android e iOS non sono ancora stati generati o pubblicati: abbiamo configurazione Capacitor, non app firmate/pronte al negozio.
- Per vendere personaggi a pagamento serviranno prodotti in-app Google Play Billing e Apple StoreKit con verifica server-side. **Non** si abilita alcuna vendita oggi.

## Compilazione nativa quando le voci saranno verificate
Da una macchina con Node.js:
```bash
npm install
npx cap add android
npx cap add ios
npx cap sync
```
Android: Android Studio / SDK per build AAB.
iOS: Xcode su macOS e account Apple Developer per firmare e distribuire.
Queste operazioni NON vanno eseguite su un repository senza avere verificato la compatibilita' dell'app e la titolarita' dei modelli voce.

## Test
`npm test` esegue test di interfaccia, supporto delle 12 lingue, personaggi, parametri del Worker e logica voce. I test mock non sostituiscono la prova reale su iPhone e Android.

## Attenzione Cloudflare
Il deploy e' collegato a `wrangler.toml`. Unire modifiche su `main` avvia automaticamente la pipeline collegata solo se l'integrazione GitHub in Cloudflare e' attiva. Controllare Deployments prima di dire che la versione online usa le nuove lingue.
