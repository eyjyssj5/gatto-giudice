/* E2E reale: importa Piper, scarica il modello e tenta la riproduzione.
 * Non consuma Cloudflare AI: simuliamo soltanto il verdetto dal server.
 * Questo test in Chromium NON sostituisce la prova WebKit su iPhone.
 */
const puppeteer=require("puppeteer-core");
(async()=>{
  const chrome=process.env.CHROME_BIN||"/usr/bin/google-chrome";
  const browser=await puppeteer.launch({
    executablePath:chrome,
    headless:true,
    args:["--no-sandbox","--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"]
  });
  const page=await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  page.setDefaultTimeout(210000);
  const errors=[],requests=[];
  page.on("pageerror",e=>errors.push("JS: "+e.message));
  page.on("requestfailed",r=>requests.push(r.url()+" -> "+r.failure()?.errorText));
  page.on("response",r=>{if(r.status()>=400)requests.push("HTTP "+r.status()+" "+r.url());});
  await page.evaluateOnNewDocument(()=>{
    const originalFetch=window.fetch.bind(window);
    window.fetch=(input,options)=>{
      const url=typeof input==="string"?input:input?.url||"";
      if(url.includes(".workers.dev/giudica")){
        return Promise.resolve(new Response(JSON.stringify({
          approva:true,frase:"Oggi studierò con impegno e pazienza.",lingua:"it"
        }),{status:200,headers:{"Content-Type":"application/json"}}));
      }
      return originalFetch(input,options);
    };
  });
  try{
    await page.goto("http://127.0.0.1:8765/",{waitUntil:"load",timeout:30000});
    await page.$eval("#decisione",e=>e.value="Voglio studiare oggi");
    await page.click("#btn-giudica");
    await page.waitForFunction(()=>document.getElementById("esito")?.hidden===false);
    console.log("Verdetto arrivato; sintesi vocale in corso.");
    const start=Date.now();
    let last="";
    while(Date.now()-start<185000){
      const status=await page.$eval("#stato-voce",el=>el.textContent);
      if(status!==last){console.log("Voce:",status);last=status;}
      if(/sta parlando|speaking/i.test(status)){console.log("OK: Piper ha avviato la riproduzione audio");return;}
      if(/non disponibile|voce non disponibile|voice unavailable/i.test(status)){
        throw new Error("La voce ha fallito: "+status);
      }
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    throw new Error("Timeout: modello Piper non ha avviato audio entro 185s; ultimo stato: "+last);
  } catch(e){
    console.error("ERRORE TEST PIPER:",e.message);
    for(const x of errors.slice(-12))console.error(x);
    for(const x of requests.slice(-12))console.error(x);
    await page.screenshot({path:"piper-browser-diagnostica.png",fullPage:true}).catch(()=>{});
    process.exitCode=1;
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
