import {store,ProductType,Platform} from "capacitor-plugin-cdv-purchase";
const ids=['severo','ironico','corrotto','pigro','supremo'];
const product=j=>j==='supremo'?'giudice_supremo_abbonamento':'giudice_'+j+'_premium';
const notify=()=>window.dispatchEvent(new Event('gatto-premium-update'));
let ready=false;
window.GattoPremium={
 ready:()=>ready,
 owned:j=>j==='dolce'||ready&&ids.includes(j)&&store.owned(product(j)),
 price:j=>ready&&ids.includes(j)?store.get(product(j),Platform.GOOGLE_PLAY)?.pricing?.price||'':'',
 buy:async j=>{if(!ready||!ids.includes(j))return false;const p=store.get(product(j),Platform.GOOGLE_PLAY),offer=p?.getOffer();if(!offer||!p?.canPurchase)return false;const result=await offer.order();return !result?.isError;}
};
(async()=>{try{
 store.register(ids.map(j=>({id:product(j),type:j==='supremo'?ProductType.PAID_SUBSCRIPTION:ProductType.NON_CONSUMABLE,platform:Platform.GOOGLE_PLAY})));
 store.when().productUpdated(notify).receiptUpdated(notify).approved(tx=>{if(store.validator)tx.verify();else tx.finish();}).verified(receipt=>{receipt.finish();notify()}).finished(notify).cancelled(notify);
 await store.initialize([Platform.GOOGLE_PLAY]);ready=true;notify();
}catch(e){console.error('Play Billing:',e);notify()}})();
