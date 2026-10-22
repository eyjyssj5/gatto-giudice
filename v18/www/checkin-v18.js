/* Consecutive check-ins: reset ONLY unfinished 10-day leg after one missed day. */
(function(root){'use strict';
const STORE='gatto.checkin.consecutivo.v2';
const REWARDS=Object.freeze({severo:10,ironico:20,corrotto:30,pigro:40});
const dayNow=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const valid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const diff=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
function raw(storage=root.localStorage){
let o={};try{o=JSON.parse(storage.getItem(STORE)||'{}')||{}}catch(_){}
const unlocked=Number.isInteger(o.unlocked)&&o.unlocked>=0&&o.unlocked<=40&&o.unlocked%10===0?o.unlocked:0;
const streak=Number.isInteger(o.streak)&&o.streak>=0&&o.streak<10&&unlocked<40?o.streak:0;
return {unlocked,streak,lastDay:valid(o.lastDay)?o.lastDay:''};
}
function read(storage=root.localStorage,today=dayNow()){
const o=raw(storage);const missed=o.lastDay&&valid(today)&&diff(o.lastDay,today)>1&&o.unlocked<40&&o.streak>0;
const streak=missed?0:o.streak;
return {...o,streak,count:o.unlocked+streak,missed:!!missed};
}
function checkIn(today=dayNow(),storage=root.localStorage){
if(!valid(today))return {...read(storage),credited:false,status:'invalid-date'};
const v=read(storage,today);
if(v.lastDay===today)return {...v,credited:false,status:'already'};
if(v.lastDay&&today<v.lastDay)return {...v,credited:false,status:'clock-back'};
if(v.unlocked>=40)return {...v,credited:false,status:'completed'};
let unlocked=v.unlocked,streak=v.streak+1,reward=null;
if(streak===10){streak=0;unlocked+=10;reward=Object.keys(REWARDS).find(x=>REWARDS[x]===unlocked)||null;}
try{storage.setItem(STORE,JSON.stringify({unlocked,streak,lastDay:today}));}catch(_){return {...v,credited:false,status:'storage-error'};}
return {unlocked,streak,lastDay:today,count:unlocked+streak,credited:true,status:'ok',reward,reset:v.missed};
}
function owned(id,storage=root.localStorage){return id==='dolce'||Object.hasOwn(REWARDS,id)&&raw(storage).unlocked>=REWARDS[id];}
function remaining(id,storage=root.localStorage,today=dayNow()){return Object.hasOwn(REWARDS,id)?Math.max(0,REWARDS[id]-read(storage,today).count):null;}
function progress(today=dayNow(),storage=root.localStorage){
const v=read(storage,today);
return {...v,today,checkedToday:v.lastDay===today,goal:40,milestones:Object.entries(REWARDS).map(([id,days])=>({id,days,unlocked:v.unlocked>=days})),next:Object.entries(REWARDS).find(([,days])=>v.unlocked<days)?.[0]||null};
}
root.GattoCheckin={REWARDS,dayNow,read,checkIn,owned,remaining,progress};
if(typeof module==='object'&&module.exports)module.exports=root.GattoCheckin;
})(typeof window==='object'?window:globalThis);
