/* Study with Ms. Mirna: keeps a student's name and class on this device, once written on any page,
   and sends their answers and progress to the teacher's Google Sheet (Game Results tab).
   Load after student-visits.js. Options on the script tag:
   data-game, data-chapter, data-watch="0" (page sends its own answers), data-joined="0". */
(function(){
"use strict";
var URL='https://script.google.com/macros/s/AKfycbxqxWcG4jS6gWBLKroZBscjhfJEBmSRwIjZ4OtamJe55XvdfLjX0Jj9j2xgfPAr0Mbu6g/exec';
var KEY='msm-student',QK='msm-live-q',SEEN='msm-live-seen',JOIN='msm-live-joined',GAP=30*60*1000,WAIT='msm-live-wait';
var CLASSES=['9-A','9-B','10-A','10-B','11-A','11-B','12-A','12-B'];
var tag=document.currentScript||{getAttribute:function(){return null;}};
var GAME=tag.getAttribute('data-game')||document.title,CHAPTER=tag.getAttribute('data-chapter')||'';
var WATCH=tag.getAttribute('data-watch')!=='0',JOINED=tag.getAttribute('data-joined')!=='0';
var FILE=location.pathname.split('/').pop()||'index.html',T0=Date.now();
var PAIRS=[['pname','pclass'],['nm','cl'],['sname','sclass'],['exName','exCls'],['ckName','ckCls'],['lvName','lvCls'],['xn','xc']];
function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function jget(k,d){try{return JSON.parse(get(k)||'null')||d;}catch(e){return d;}}
function student(){var s=jget(KEY,null);return s&&s.name&&s.cls?s:null;}
function when(){return new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function code(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return 'LV-'+('00000'+h.toString(36).toUpperCase()).slice(-6);}

/* ---- sending: rows wait in a queue on the device until they get through ---- */
var flushing=false;
function flush(){if(flushing)return;var q=jget(QK,[]);if(!q.length)return;flushing=true;var job=q[0];
 fetch(URL,{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(job.p)})
  .then(function(){set(QK,JSON.stringify(jget(QK,[]).filter(function(j){return j.id!==job.id;})));flushing=false;flush();})
  .catch(function(){flushing=false;setTimeout(flush,8000);});}
function short(t,n){t=String(t||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1).trim()+'…':t;}
function stamp(p,s){p.name=s.name;p.cls=s.cls;p.code=code(s.name+'|'+s.cls+'|'+p.game+'|'+p.when);return p;}
function row(r){syncFields();var s=student(),p={game:GAME+' Live: '+r.part,chapter:CHAPTER,name:'',cls:'',score:r.score||0,correct:r.correct||0,total:r.total||0,
  mins:Math.round((Date.now()-T0)/6000)/10,when:when(),code:'',missed:String(r.missed||'').slice(0,500)};
 if(!s){var w=jget(WAIT,[]);w.push(p);set(WAIT,JSON.stringify(w));askName();return;}
 var q=jget(QK,[]);q.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),p:stamp(p,s)});set(QK,JSON.stringify(q));flush();}
window.MSMLive={row:row,short:short};

/* ---- name and class live on the page; nothing stops a student until they check ---- */
var RED='border-color:#c2415e;background:#fdeef1';
function pairEls(){var out=[];PAIRS.forEach(function(p){var n=document.getElementById(p[0]),c=document.getElementById(p[1]);if(n&&c&&!n.getAttribute('data-msm'))out.push([n,c]);});return out;}
function clean(v){return String(v||'').trim().replace(/\s+/g,' ');}
function worksheetClass(){var n=document.getElementById('nm');if(!n||!n.closest('.hrow')||document.getElementById('cl'))return;
 var l=document.createElement('label');l.style.flex='0 0 auto';l.textContent='Class ';var c=document.createElement('select');c.id='cl';c.setAttribute('aria-label','Class');
 c.innerHTML='<option value=""></option>'+CLASSES.map(function(x){return '<option>'+x+'</option>';}).join('');l.appendChild(c);n.closest('label').parentNode.insertBefore(l,n.closest('label').nextSibling);}
function nameBar(){if(document.getElementById('msm-bar'))return;
 var b=document.createElement('div');b.id='msm-bar';
 b.setAttribute('style','display:flex;flex-wrap:wrap;gap:10px;align-items:center;box-sizing:border-box;max-width:100%;margin:10px 0;padding:8px 12px;background:#fff;border:2px solid #c9d4e6;border-radius:14px;color:#18233a;font:500 15px Fredoka,system-ui,sans-serif');
 var f='box-sizing:border-box;padding:6px 10px;border:2px solid #c9d4e6;border-radius:10px;background:#fff;color:#18233a;font:16px "Atkinson Hyperlegible",system-ui,sans-serif';
 b.innerHTML='<label for="msmName">Your full name</label><input id="msmName" autocomplete="name" maxlength="60" style="'+f+';flex:1 1 180px;min-width:0">'+
  '<label for="msmCls">Class</label><select id="msmCls" style="'+f+'"><option value=""></option>'+CLASSES.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select>';
 var h=document.querySelector('h1'),top=h&&(h.closest('header')||h.parentNode);
 if(top&&top!==document.body)top.parentNode.insertBefore(b,top.nextSibling);else document.body.insertBefore(b,document.body.firstChild);}
function save(nm,cl){set(KEY,JSON.stringify({name:nm,cls:cl}));begin();}
function syncFields(){if(student())return;
 var n=document.getElementById('msmName'),c=document.getElementById('msmCls');
 if(n&&clean(n.value).length>=2&&c.value){save(clean(n.value),c.value);return;}
 pairEls().some(function(p){var nm=clean(p[0].value),cl=clean(p[1].value);if(nm.length<2||!cl)return false;
  p[0].setAttribute('data-msm',nm);p[1].setAttribute('data-msm',cl);save(nm,cl);return true;});}
function mark(el){if(!el||clean(el.value))return;el.setAttribute('data-msm-style',el.getAttribute('style')||'');el.style.cssText+=';'+RED;
 el.addEventListener('input',function(){el.style.cssText=el.getAttribute('data-msm-style')||'';},{once:true});el.addEventListener('change',function(){el.style.cssText=el.getAttribute('data-msm-style')||'';},{once:true});}
function askName(){var els=[];var n=document.getElementById('msmName');
 if(n)els=[n,document.getElementById('msmCls')];else pairEls().some(function(p){els=p;return true;});
 if(!els.length){nameBar();els=[document.getElementById('msmName'),document.getElementById('msmCls')];}
 els.forEach(mark);var first=els.filter(function(e){return !clean(e.value);})[0];
 if(first){first.scrollIntoView({block:'center'});try{first.focus({preventScroll:true});}catch(e){first.focus();}}}
var CHECK=/^check\b/i;
function guard(e){var b=e.target&&e.target.closest&&e.target.closest('button');if(!b||b.disabled)return;syncFields();
 if(b.closest('#msm-badge')){setTimeout(function(){location.reload();},50);return;}
 if(!CHECK.test(b.textContent.trim())||student())return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();askName();}

/* ---- the page's own name fields fill themselves in ---- */
function fillOne(el,v){if(!el||el.getAttribute('data-msm'))return;
 if(el.tagName==='SELECT'&&!Array.prototype.some.call(el.options,function(o){return o.value===v||o.text===v;})){var o=document.createElement('option');o.textContent=v;el.appendChild(o);}
 el.value=v;el.setAttribute('data-msm',v);
 try{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
 var box=el.closest('.hrow');if(box){el.readOnly=el.tagName!=='SELECT';if(el.tagName==='SELECT')el.disabled=true;return;}
 box=el.closest('.field,.namerow,.name-row,label')||el.parentNode;box.style.display='none';}
function fillFields(){var s=student();if(!s)return;PAIRS.forEach(function(p){fillOne(document.getElementById(p[0]),s.name);fillOne(document.getElementById(p[1]),s.cls);});}

/* ---- simulations: which section is open, and every checked answer ---- */
function activeText(sel){var b=document.querySelector(sel);return b?b.textContent.replace(/\s+/g,' ').trim().replace(/^[\d\s✓✗·.]+/,''):'';}
function section(){var a=activeText('.tabs .on,.tabs .active,.tabs [aria-selected="true"],.tabs [aria-current],.stations [aria-selected="true"],.stations [aria-current]'),
  b=activeText('.steps .on,.ss .on');return a&&b?a+' · '+b:(a||b);}
var seen=jget(SEEN,{});
function logSection(){var t=section().split(' · ')[0];if(!t||!student())return;var m=seen[FILE]||(seen[FILE]={});if(m[t])return;m[t]=1;set(SEEN,JSON.stringify(seen));
 row({part:'Opened tab | '+t});}
var lastTouch=0,lastNav=false,marked={};
var GOOD=/^[✓\s]*(correct\s*[!:.]|all correct|correct order|well done)/i,TRIGGER=/^[✗\s]*(not quite|not yet[.!]|not balanced|balanced, but|try again)/i;
function scan(node){var w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT,null),t;
 while((t=w.nextNode()))test(t);}
function test(t){var s=t.nodeValue||'';s=s.trim();if(!GOOD.test(s)&&!TRIGGER.test(s))return;var el=t.parentNode;
 if(!el||!el.closest||el.closest('button,h1,h2,h3,label,style,script,th,#msm-badge'))return;
 if(lastNav||/choose an answer|type a number|type an answer/i.test(el.closest('div,p,li')?el.closest('div,p,li').textContent:''))return;
 var b=el.closest('div,p,li')||el,txt=b.textContent.replace(/\s+/g,' ').trim().slice(0,240);
 var sec=section()||'Lab',ask=askOf(el,txt),now=Date.now(),k=sec+'|'+ask+'|'+txt;if(marked[k]&&now-marked[k]<3000)return;marked[k]=now;
 var ok=GOOD.test(s),pick=(el.closest('.qz')||document).querySelector('.wrong,.qzb.wrong'),chose=!ok&&pick?'Chose: '+short(pick.textContent,60).replace(/^[A-D](?=\S)/,'')+' · ':'';
 row({part:sec.replace(' · ',' | ')+' | '+ask,score:ok?100:0,correct:ok?1:0,total:1,missed:ok?'':chose+txt});}
function askOf(el,txt){var r=el.closest('.tfrow');
 if(r){var f=r.querySelector('.fn'),q=r.querySelector('.tfq');return 'Q'+(f?f.textContent.trim():'?')+' '+short(q?q.firstChild.textContent:'',80);}
 var box=el.closest('.qz,#panel,main')||document.body,q=box.querySelector('.qzq,.qcard,.qtext,.q-text,.stem'),m=box.textContent.match(/Question (\d+) of/),n=m?'Q'+m[1]+' ':'';
 if(q)return n+short(q.textContent,80);
 var t=document.getElementById('stitle')||document.querySelector('main h2,h2');
 var rest=/^[✗\s]*not yet/i.test(txt)?'':txt.replace(/^[✓✗\s]*(correct\s*[!:.]|well done\s*!?|not quite\.?)\s*/i,'');
 return n+short((t&&t.textContent)||'',50)+(rest?' · '+short(rest,70):'');}
function watch(){if(!window.MutationObserver)return;
 ['click','keydown','pointerup','touchend'].forEach(function(ev){document.addEventListener(ev,function(e){lastTouch=Date.now();lastNav=!!(e.target&&e.target.closest&&e.target.closest('.tabs,.steps,.ss,.stations,.subbar'));setTimeout(logSection,400);},true);});
 new MutationObserver(function(ms){if(Date.now()-lastTouch>2500)return;ms.forEach(function(m){
   if(m.type==='characterData')test(m.target);else Array.prototype.forEach.call(m.addedNodes,function(n){if(n.nodeType===3)test(n);else if(n.nodeType===1)scan(n);});});
  }).observe(document.body,{childList:true,subtree:true,characterData:true});}
function watchFields(){if(window.MutationObserver)new MutationObserver(fillFields).observe(document.body,{childList:true,subtree:true});}

var started=false;
function begin(){fillFields();
 if(!started){started=true;watchFields();}
 if(JOINED){var j=jget(JOIN,{});if(!j[FILE]||Date.now()-j[FILE]>GAP){j[FILE]=Date.now();set(JOIN,JSON.stringify(j));row({part:'Joined',missed:'Opened the page'});}}
 if(WATCH)logSection();
 var s=student(),w=jget(WAIT,[]),q=jget(QK,[]);if(s&&w.length){w.forEach(function(p,i){q.push({id:Date.now()+'-w'+i,p:stamp(p,s)});});set(QK,JSON.stringify(q));set(WAIT,'[]');}
 flush();}
function init(){document.addEventListener('click',guard,true);document.addEventListener('change',syncFields,true);document.addEventListener('focusout',syncFields,true);document.addEventListener('keydown',function(e){if(e.key==='Enter')syncFields();},true);
 worksheetClass();if(WATCH)watch();
 if(student()){begin();return;}
 if(!pairEls().length)nameBar();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('online',flush);
})();
