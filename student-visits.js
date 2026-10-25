/* Study with Ms. Mirna: remembers a student on this device after they send a result,
   then records which pages they open in the teacher's Google Sheet (Visits tab). */
(function(){
"use strict";
var URL='https://script.google.com/macros/s/AKfycbxqxWcG4jS6gWBLKroZBscjhfJEBmSRwIjZ4OtamJe55XvdfLjX0Jj9j2xgfPAr0Mbu6g/exec';
var KEY='msm-student',DEV='msm-device',LAST='msm-lastvisit',GAP=30*60*1000;
function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function del(k){try{localStorage.removeItem(k);}catch(e){}}
function student(){try{var s=JSON.parse(get(KEY)||'null');return s&&s.name?s:null;}catch(e){return null;}}
function device(){var d=get(DEV);if(!d){d='D-'+Math.random().toString(36).slice(2,8).toUpperCase();set(DEV,d);}return d;}
function when(){return new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
var top=true;try{top=window.self===window.top;}catch(e){top=false;}
var realFetch=window.fetch?window.fetch.bind(window):null;

/* 1. remember the student whenever a page sends a result to the sheet */
if(realFetch){window.fetch=function(u,o){try{if(String(u).indexOf('script.google.com/macros')>=0&&o&&typeof o.body==='string'){var d=JSON.parse(o.body);
  if(d&&d.type!=='visit'&&d.name&&d.cls){var old=student();set(KEY,JSON.stringify({name:String(d.name).slice(0,60),cls:String(d.cls).slice(0,10)}));
   if(!old||old.name!==d.name||old.cls!==d.cls){del(LAST);setTimeout(function(){logVisit(true);showBadge();},1500);}}}}catch(e){}
  return realFetch.apply(window,arguments);};}

/* 2. record this page visit (at most once every 30 minutes per page) */
function logVisit(force){var s=student();if(!s||!realFetch)return;
 var page=(document.title||location.pathname).replace(/\s+/g,' ').trim(),path=location.pathname.split('/').pop()||'index.html',map={};
 try{map=JSON.parse(get(LAST)||'{}')||{};}catch(e){map={};}
 if(!force&&map[path]&&Date.now()-map[path]<GAP)return;map[path]=Date.now();set(LAST,JSON.stringify(map));
 realFetch(URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({type:'visit',name:s.name,cls:s.cls,page:page,file:path,when:when(),device:device()})}).catch(function(){});}

/* 3. a small "remembered as" badge so students know, with "Not you?" for shared devices */
function showBadge(){if(!top)return;var old=document.getElementById('msm-badge');if(old)old.parentNode.removeChild(old);var s=student();if(!s)return;
 var b=document.createElement('div');b.id='msm-badge';
 b.setAttribute('style','position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;align-items:center;gap:8px;background:#fff;border:2px solid #c9d4e6;border-radius:999px;padding:5px 6px 5px 12px;box-shadow:0 3px 0 #c3cfe3;font:500 13px Fredoka,system-ui,sans-serif;color:#5a6780;max-width:calc(100vw - 24px)');
 var t=document.createElement('span');t.textContent='Remembered as '+s.name+' ('+s.cls+')';t.setAttribute('style','white-space:nowrap;overflow:hidden;text-overflow:ellipsis');
 var x=document.createElement('button');x.type='button';x.textContent='Not you?';
 x.setAttribute('style','font:600 13px Fredoka,system-ui,sans-serif;border:2px solid #e2708a;color:#e2708a;background:#fff;border-radius:999px;padding:2px 10px;cursor:pointer;-webkit-appearance:none;appearance:none');
 x.onclick=function(){del(KEY);del(LAST);b.parentNode.removeChild(b);};
 b.appendChild(t);b.appendChild(x);document.body.appendChild(b);
 b.style.transition='opacity .8s';setTimeout(function(){b.style.opacity='0';setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b);},900);},8000);}

function init(){logVisit(false);showBadge();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
