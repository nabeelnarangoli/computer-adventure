/* =====================================================================
   Aqlyon Digital Skill Academy — learner app
   login → choose computer → choose course → placement check → personal course map → lessons
   ===================================================================== */
const app=$('#app');
let USER=null;
const API={
 token:()=>{try{return localStorage.getItem('ca-token')}catch(e){return null}},
 setToken:t=>{try{t?localStorage.setItem('ca-token',t):localStorage.removeItem('ca-token')}catch(e){}},
 async call(path,{method='GET',body}={}){
  const h={'content-type':'application/json'};const t=API.token();if(t)h.authorization='Bearer '+t;
  let r;try{r=await fetch('/api'+path,{method,headers:h,body:body?JSON.stringify(body):undefined})}catch(e){throw new Error('Can\'t reach the server. Check your internet connection.')}
  let d={};try{d=await r.json()}catch(e){}
  if(!r.ok){const err=new Error(d.error||'Something went wrong.');err.status=r.status;throw err}
  return d;
 }
};

/* ---------- saving progress (debounced) ---------- */
let saveTimer=null,saving=false,pending=false;
function setSaveState(s){const el=$('.savestate');if(!el)return;el.dataset.s=s;el.textContent={saving:'Saving…',saved:'Saved',error:'Not saved: check internet'}[s]||''}
window.persist=function(){
 PROG.planTotal=planLessons().length;PROG.planDone=doneCount();
 clearTimeout(saveTimer);saveTimer=setTimeout(flush,700);setSaveState('saving');
};
async function flush(){
 if(saving){pending=true;return}saving=true;
 try{await API.call('/progress',{method:'PUT',body:PROG});setSaveState('saved')}
 catch(e){setSaveState('error');if(e.status===401)return logout('Your session ended. Please log in again.')}
 finally{saving=false;if(pending){pending=false;flush()}}
}
window.addEventListener('beforeunload',e=>{if(saveTimer&&$('.savestate')?.dataset.s==='saving'){e.preventDefault();e.returnValue=''}});

/* ---------- plan helpers ---------- */
const unitById=id=>UNITS.find(u=>u.id===id);
const planUnits=()=>(PROG.plan||[]).map(p=>({...unitById(p.u),status:p.s})).filter(u=>u.id);
const planLessons=()=>planUnits().filter(u=>u.status!=='known').flatMap(u=>u.lessons);
const allPlanLessons=()=>planUnits().flatMap(u=>u.lessons);
const isDone=id=>!!(PROG.done&&PROG.done[id]);
const doneCount=()=>planLessons().filter(isDone).length;
/* lessons open one at a time: the first one, or after the one before is finished. Units the quick check marked as known stay open for review. */
const lessonOpen=id=>{const L=planLessons();const i=L.indexOf(id);return i<=0||isDone(id)||isDone(L[i-1])};
const nextLesson=()=>planLessons().find(id=>!isDone(id))||planLessons().slice(-1)[0];
const unitOf=id=>UNITS.find(u=>u.lessons.includes(id));
const unitDone=u=>u.lessons.every(isDone);
const deepP=o=>typeof o==='string'?P(o):Array.isArray(o)?o.map(deepP):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,typeof v==='function'?v:deepP(v)])):o;
const withPlat=(plat,fn)=>{const old=PLAT;PLAT=plat;try{return P(fn())}finally{PLAT=old}};
const STATUS_LABEL={learn:'',refresh:'Refresher',known:'You know this'};
const medal=(on)=>`<svg class="medal" viewBox="0 0 40 40" aria-hidden="true"><path d="M13 2h6l-3 12h-6zM21 2h6l3 12h-6z" fill="${on?'var(--wk)':'#9AA0B8'}" opacity="${on?1:.45}"/><circle cx="20" cy="25" r="12" fill="${on?'#F5B700':'#C3C8DA'}"/><circle cx="20" cy="25" r="8.5" fill="none" stroke="${on?'#fff':'#E6E9F2'}" stroke-width="2"/><path d="M20 19.5l1.7 3.4 3.8.5-2.7 2.6.6 3.7-3.4-1.8-3.4 1.8.6-3.7-2.7-2.6 3.8-.5z" fill="#fff"/></svg>`;

/* ---------- shell ---------- */
function topbar(){
 const t=planLessons().length;
 return `<header class="top"><div class="in"><a class="brand" href="#courses" title="All courses"><span class="logo">${SVG.laptop.replace('<svg','<svg width="20" height="20"')}</span><span class="bfull">Aqlyon Digital Skill Academy</span><span class="bshort" aria-hidden="true">Aqlyon</span></a>
 <span class="savestate" aria-live="polite"></span>
 <a class="aqnav ${isAcHash(location.hash)?'on':''}" href="#courses" title="All courses">${GRID}<span>Courses</span></a>
 ${t?`<span class="stars">${SVG.star} ${doneCount()} / ${t}</span>`:''}
 <button type="button" class="langbtn" aria-haspopup="true" title="Subtitle language">${GLOBE}<span>${esc((LANGS.find(l=>l.code===SUBLANG)||LANGS[0]).code.toUpperCase()||'EN')}</span></button>
 <a class="userbtn" href="#profile" title="Your profile">${SVG.user}<span>${esc(USER.name.split(' ')[0])}</span></a></div></header>`;
}
function applyContext(){setContext({platform:PROG.platform||'mac',kind:USER.kind,name:USER.name});window.CURRENT_USER=USER.username;window.CURRENT_NAME=USER.name;document.documentElement.dataset.plat=PROG.platform||'mac';if((USER.lang||'')!==SUBLANG)setSubLang(USER.lang||'')}
/* ---------- subtitle language ---------- */
const GLOBE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
const langPicker=(cls='')=>`<div class="langpick ${cls}" role="radiogroup" aria-label="Subtitle language">${LANGS.map(l=>`<button type="button" role="radio" aria-checked="${l.code===SUBLANG}" class="${l.code===SUBLANG?'on':''}" data-lang="${l.code}" data-noi18n><b lang="${l.code||'en'}" ${l.rtl?'dir="rtl"':''}>${l.native}</b>${l.code?`<small>${l.name}</small>`:''}</button>`).join('')}</div>`;
async function chooseLang(code){
 USER.lang=code;await setSubLang(code);
 $$('.langpick [data-lang]').forEach(b=>{const on=b.dataset.lang===code;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});
 const lb=$('.langbtn span');if(lb)lb.textContent=code?code.toUpperCase():'EN';
 try{await API.call('/lang',{method:'PUT',body:{lang:code}})}catch(e){setSaveState('error')}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-lang]');if(b){chooseLang(b.dataset.lang);const m=b.closest('.langmenu');if(m)m.remove();return}
 const lb=e.target.closest('.langbtn');const open=$('.langmenu');
 if(lb){if(open)return open.remove();const m=document.createElement('div');m.className='langmenu';m.innerHTML=`<p>Subtitles</p>${langPicker('col')}`;lb.parentElement.appendChild(m);return}
 if(open&&!e.target.closest('.langmenu'))open.remove();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.langmenu');if(m)m.remove()}});
document.addEventListener('click',e=>{const a=e.target.closest('[data-prog]');if(a&&PROG){PROG.track=a.dataset.prog;persist()}});

/* ---------- login ---------- */
function loginView(msg=''){
 app.innerHTML=`<main class="auth"><div class="authpair">${mascot('wave',{say:'Welcome! Log in to start learning.'})}<div class="authcard"><span class="logo big">${SVG.laptop.replace('<svg','<svg width="34" height="34"')}</span><h1>Aqlyon Digital Skill Academy</h1><p class="lead">Computer skills and AI, from your first click to professional AI creation.</p>
 <form class="authform" autocomplete="on"><div class="field"><label for="li-u">Username</label><input id="li-u" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
 <div class="field"><label for="li-p">PIN or password</label><input id="li-p" name="pin" type="password" autocomplete="current-password" required></div>
 <p class="formerr" role="alert">${esc(msg)}</p><button class="btn" type="submit">Log in ${SVG.next}</button></form>
 <div class="regbox" hidden><p class="small">New here?</p><button type="button" class="btn ghost reg">Create an account</button></div>
 <p class="small noreg" hidden>No account yet? Ask your admin (a parent, teacher or manager) to create one for you.</p><p class="small" style="margin-top:18px"><a href="/">Aqlyon Career Discovery Centre website</a></p></div></div></main>`;
 API.call('/config').then(c=>{if(c.allowRegister){$('.regbox').hidden=false;const mb=$('.authpair .mbub');if(mb)mb.textContent='Welcome! Log in, or create your free account in one minute.';$('.reg').onclick=registerView}else $('.noreg').hidden=false}).catch(()=>{$('.noreg').hidden=false});
 const f=$('.authform');f.onsubmit=async e=>{e.preventDefault();const b=$('button',f);b.disabled=true;$('.formerr').textContent='';
  try{const d=await API.call('/login',{method:'POST',body:{username:$('#li-u').value,pin:$('#li-p').value}});API.setToken(d.token);USER=d.user;PROG=d.progress||{};PROG.done=PROG.done||{};applyContext();location.hash='#home';route()}
  catch(err){$('.formerr').textContent=err.message;b.disabled=false}};
 $('#li-u').focus();
}
/* ---------- self sign-up ---------- */
const genPin=()=>String(Math.floor(1000+Math.random()*9000));
const slugUser=n=>n.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'').slice(0,20);
function registerView(){
 app.innerHTML=`<main class="auth"><div class="authpair">${mascot('wave',{say:'Hello! Pick a username and a PIN. That\'s all.'})}<div class="authcard wide"><span class="logo big">${SVG.laptop.replace('<svg','<svg width="34" height="34"')}</span><h1>Create your account</h1><p class="lead">It takes one minute. Then you can start learning straight away.</p>
 <form class="authform regform"><div class="field"><label for="r-name">Your name</label><input id="r-name" required maxlength="40" autocomplete="name"></div>
 <div class="field"><label for="r-user">Username</label><input id="r-user" required maxlength="24" autocapitalize="none" spellcheck="false" autocomplete="username"><small class="small">Small letters, numbers, dot, dash or underscore. You use it to log in.</small></div>
 <div class="field"><label for="r-pin">PIN</label><div class="inrow"><input id="r-pin" required minlength="4" maxlength="20" autocomplete="new-password" value="${genPin()}"><button type="button" class="btn ghost sm gen">New PIN</button></div><small class="small">4 to 20 characters. Adults: use a longer password.</small></div>
 <fieldset class="qset"><legend>Who is learning?</legend><label class="ck"><input type="radio" name="kind" value="child" checked><span><b>A child</b>: playful wording</span></label><label class="ck"><input type="radio" name="kind" value="adult"><span><b>An adult</b>: plain wording</span></label></fieldset>
 <div class="field"><label for="r-lang">Subtitle language</label><select id="r-lang">${LANGS.map(l=>`<option value="${l.code}">${l.code?l.name+' · '+l.native:l.name}</option>`).join('')}</select><small class="small">English stays the main text. This language shows underneath.</small></div>
 <p class="formerr" role="alert"></p><button class="btn" type="submit">Create my account ${SVG.next}</button></form>
 <button type="button" class="linkbtn back">${SVG.back} I already have an account</button></div></div></main>`;
 const nm=$('#r-name'),us=$('#r-user');let touched=false;us.oninput=()=>touched=true;nm.oninput=()=>{if(!touched)us.value=slugUser(nm.value.split(' ')[0]||'')};
 $('.gen').onclick=()=>$('#r-pin').value=genPin();$('.back').onclick=()=>{setSubLang('');loginView()};$('#r-lang').onchange=e=>setSubLang(e.target.value);nm.focus();
 $('.regform').onsubmit=async e=>{e.preventDefault();const b=$('button[type=submit]',e.target);b.disabled=true;$('.formerr').textContent='';
  const body={name:nm.value.trim(),username:us.value.trim().toLowerCase(),pin:$('#r-pin').value,kind:$('input[name=kind]:checked').value,lang:$('#r-lang').value};
  try{const d=await API.call('/register',{method:'POST',body});API.setToken(d.token);USER=d.user;PROG={done:{}};applyContext();registeredView(body)}
  catch(err){$('.formerr').textContent=err.message;b.disabled=false}};
}
function registeredView(b){
 const txt=`Aqlyon Digital Skill Academy\nSign in at: ${location.origin}/academy\nUsername: ${b.username}\nPIN: ${b.pin}`;
 app.innerHTML=`<main class="auth"><div class="authpair">${mascot('celebrate',{say:`You're all set, ${esc(b.name.split(' ')[0])}! Save your sign-in details first.`})}<div class="authcard wide"><span class="logo big">${SVG.check||SVG.star}</span><h1>${esc(b.name.split(' ')[0])}, you're all set!</h1><p class="lead">Save these sign-in details. Your PIN is only shown now. Copy them, write them down or take a photo.</p>
 <pre class="creds">${esc(txt)}</pre><div class="row2"><button type="button" class="btn ghost cp">Copy details</button><button type="button" class="btn go">Start learning ${SVG.next}</button></div></div></div></main>`;
 $('.cp').onclick=async()=>{const c=$('.cp');try{await navigator.clipboard.writeText(txt);c.textContent='Copied ✓'}catch(e){c.textContent='Select the text to copy'}};
 $('.go').onclick=()=>{location.hash='';route()};
}
function logout(msg){API.setToken(null);USER=null;setSubLang('');PROG={};location.hash='';loginView(msg||'')}

/* ---------- setup / onboarding: pick a course, nothing else to answer ---------- */
const ALL_BASIC_KNOWN={units:Object.fromEntries(UNITS.filter(u=>u.track==='basic').map(u=>[u.id,{asked:2,right:2}]))};
/* computer course plan from the learner's own choice: full course, Basic only, or Advanced only (no basics shown) */
const makePlan=t=>t==='advanced'?buildPlan(ALL_BASIC_KNOWN,'advanced'):buildPlan(null,t==='basic'?'basic':'auto');
function setupShell(step,inner){return `<main class="wrap setup">${inner}</main>`}
function setupTrack(){
 const comp=`<button type="button" class="pickcard tr aqpick" data-t="computer"><span class="tag2">Beginner to Advanced · Mac &amp; Windows</span><b>Computer Skills Course</b><span>From your first click to pro skills: files, internet safety, email, Word, PowerPoint, Excel, cloud, security, design and coding.</span></button>`;
 app.innerHTML=topbar()+setupShell(0,`<div class="mrow"><div><h1>Hi ${esc(USER.name.split(' ')[0])}! What would you like to learn?</h1><p class="lead">Pick a course and start straight away. You can switch any time; your progress in each course is saved.</p></div>${mascot('sit',{say:'Pick a course. You can switch any time.',cls:'sm'})}</div>
 <div class="pick2 progs three">${comp}${PROG_KEYS.map(k=>{const C=PROGRAMMES[k];return `<button type="button" class="pickcard tr aqpick" data-t="${k}"><span class="tag2">${esc(C.level)}</span><b>${esc(C.full)}</b><span>${P(C.card)}</span></button>`}).join('')}</div>
 <div class="langrow" style="margin-top:26px"><p class="small"><b>Subtitles:</b> English stays on top. Pick a language to show underneath.</p>${langPicker()}</div>`);
 $$('[data-t]').forEach(b=>b.onclick=()=>{const t=b.dataset.t;
  if(PROGRAMMES[t]){PROG.track=t;persist();location.hash='#'+t;return route()}
  setupComputer()});
}
function setupComputer(){
 const prev=p=>`<div class="mac ${p==='win'?'w11':''}" aria-hidden="true">${withPlat(p,()=>desk(win('pw','{{Finder||File Explorer}}',finderBody([['x1','School','folder'],['x2','Photo','pic']]),[16,10,60,62]),{icons:[]}))}</div>`;
 let plat=PROG.platform||'';
 app.innerHTML=topbar()+setupShell(1,`<h1>Computer Skills Course</h1><p class="lead">From your first click to pro skills, on your own computer.</p>
 <h2 class="pickh">Which computer will you learn on?</h2>
 <div class="pick2">${[['mac','Mac','MacBook or iMac (Apple)'],['win','Windows','Windows laptop or PC']].map(([k,t,d])=>`<button type="button" class="pickcard ${plat===k?'on':''}" data-p="${k}">${prev(k)}<b>${t}</b><span>${d}</span></button>`).join('')}</div>
 <p class="small">Not sure? A Mac has an apple logo on the lid. A Windows computer shows four blue squares on the Start button.</p>
 <div class="row2" style="margin-top:22px"><button type="button" class="btn go" data-go="check" ${plat?'':'disabled'}>Find my level ${SVG.next}</button><button type="button" class="btn ghost go" data-go="start" ${plat?'':'disabled'}>Start from the beginning</button></div>
 <p class="small" style="margin-top:10px">Optional: a few quick questions show what you already know. At the end you choose whether to skip it or include everything.</p>
 <button type="button" class="linkbtn back">${SVG.back} Choose another course</button>`);
 $$('[data-p]').forEach(b=>b.onclick=()=>{plat=b.dataset.p;$$('[data-p]').forEach(x=>x.classList.toggle('on',x===b));$$('.go').forEach(g=>g.disabled=false);PROG.platform=plat;applyContext()});
 $$('.go').forEach(g=>g.onclick=()=>{PROG.platform=plat;applyContext();
  if(g.dataset.go==='start'){PROG.track='auto';PROG.ctrack='auto';PROG.placement=null;PROG.plan=makePlan('auto');persist();location.hash='#home';return route()}
  persist();setupPlacement()});
 $('.back').onclick=setupTrack;
}
function setupPlacement(){
 app.innerHTML=topbar()+setupShell(2,`<div class="pqpair"><div class="pqwrap"></div>${mascot('think',{say:'Take your time. Pick “I\'m not sure” instead of guessing.'})}</div>`);
 runPlacement($('.pqwrap'),res=>setupChoice(res),5);
}
function setupChoice(pl){
 const knownPlan=buildPlan(pl,'auto');const knownU=knownPlan.filter(p=>p.s==='known').map(p=>unitById(p.u)).filter(Boolean);
 const go=skip=>{PROG.track='auto';PROG.ctrack='auto';PROG.placement=skip?pl:null;PROG.plan=skip?knownPlan:makePlan('auto');persist();location.hash='#home';route()};
 if(!knownU.length){go(false);return}
 const n=knownU.reduce((t,u)=>t+u.lessons.length,0);
 app.innerHTML=topbar()+setupShell(3,`<div class="resulthead mrow"><div><span class="lvl2">${esc(pl.level)}</span><h1>You already know a lot!</h1><p class="lead">You answered ${pl.asked} questions. You seem to know these units already (${n} lessons):</p></div>${mascot('present',{say:'Your choice! Skip what you know, or go through everything.',cls:'sm'})}</div>
 <div class="planlist">${knownU.map(u=>`<div class="pl ${u.c} known"><span class="pill">${u.track==='basic'?'Basic':'Advanced'}</span><b>${esc(P(u.t))}</b><span class="pln">${u.lessons.length} lessons</span><span class="chip2 known">You know this</span></div>`).join('')}</div>
 <div class="pick2 choose">
  <button type="button" class="pickcard tr" data-c="skip"><span class="tag2">Faster</span><b>Skip what I already know</b><span>These units become optional review. Your course starts with what's new for you.</span></button>
  <button type="button" class="pickcard tr" data-c="all"><b>Include everything</b><span>Go through every lesson from lesson 1, one at a time.</span></button>
 </div>`);
 $$('[data-c]').forEach(b=>b.onclick=()=>go(b.dataset.c==='skip'));
}

/* ---------- course map ---------- */
const heroDemo=()=>DEMO(()=>desk(win('hw','{{Notes||Sticky Notes}}',`<div style="padding:2.4cqw;font-size:2.4cqw;font-weight:600;line-height:1.5;flex:1;background:{{#fff||#FFF7C2}}" data-k="ht"></div>`,[16,10,58,54],'off'),{dock:dockPlus,icons:[['h1',"[name]'s Work",'folder',86,10]]}),[['cap','Click {{Notes||Sticky Notes}}…',300],['to','d-notes'],['click'],['cls','d-notes','bounce'],['cls','d-notes','run'],['show','hw',600],['cls','d-notes','bounce',false],['cap','…and type!',200],['type','ht','Hello [name]!\nReady to learn something new today?',55],['cap','Every lesson has moving pictures like this one.']],{intro:'Press <b>Watch how</b> to see a moving picture.',start:[46,58]});
function home(){
 const total=planLessons().length,d=doneCount(),nx=nextLesson(),C=2*Math.PI*34;const nl=COURSE[nx];
 const trackName={basic:'Basic course',advanced:'Advanced course',auto:'Computer Skills: full course'}[PROG.track]||'';
 let h=topbar()+`<main class="wrap"><section class="hero"><div><p class="eyebrow">${esc(trackName)} · ${PROG.platform==='win'?'Windows':'Mac'}${PROG.placement?.level?' · '+esc(PROG.placement.level):''}</p><h1>Hi ${esc(USER.name.split(' ')[0])}, <em>keep going!</em></h1><p class="lead">One lesson is about an hour. Watch the moving pictures, try each step on your own computer, play the practice games, and tick it off.</p>
 <div class="prog"><svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="var(--soft)" stroke-width="9"/><circle cx="42" cy="42" r="34" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-(total?d/total:0))}" transform="rotate(-90 42 42)"/><text x="42" y="50" text-anchor="middle">${d}</text></svg><div><b>${d===total?'Course complete!':`${d} of ${total} lessons done`}</b><span>${d===total?'Amazing work. Try the other course on your profile page.':`<span data-noi18n>Next:</span> <span class="tu">${esc(P(nl.t))}</span>`}</span></div></div>
 <a class="btn" href="#lesson-${nx}">${d===0?'Start your first lesson':d===total?'See your graduation':'Continue'} ${SVG.next}</a></div><div class="herodemo"></div></section>
 <div class="hour"><span><i>10 min</i> typing warm-up</span><span><i>30 min</i> learn &amp; try</span><span><i>15 min</i> challenge</span><span><i>5 min</i> show &amp; tell</span></div>`;
 let n=0;
 planUnits().forEach(u=>{const got=u.status!=='known'&&unitDone(u);const known=u.status==='known';
  const tiles=u.lessons.map(id=>{const l=COURSE[id];if(!known)n++;const nxt=id===nx&&!isDone(id);const op=lessonOpen(id);const tg=op?'a':'div';return `<${tg} class="tile ${isDone(id)?'done':''} ${nxt?'next':''} ${op?'':'locked'}" ${op?`href="#lesson-${id}"`:'aria-disabled="true" title="Finish the lesson before it to open this one"'}>${isDone(id)?`<span class="ok">${SVG.check}</span>`:op?'':`<span class="ok lk">${LOCK}</span>`}<span class="dn">${known?'·':n}</span><span class="dt">${esc(P(l.t))}</span>${nxt?'<span class="nx">Up next</span>':op?'':'<span class="nx lk2">Locked</span>'}</${tg}>`}).join('');
  h+=`<section class="week ${u.c} ${known?'knownu':''}"><div class="wkhead"><span class="pill">${u.track==='basic'?'Basic':'Advanced'}</span><h2>${esc(P(u.t))}</h2>${u.status!=='learn'?`<span class="chip2 ${u.status}">${STATUS_LABEL[u.status]}</span>`:''}<span class="badge ${got?'got':''}">${medal(got)}${got?'Earned: ':'Badge: '}${esc(u.badge)}</span></div>${known?`<details class="knownd"><summary>You already know this unit. Open to review it (optional).</summary><div class="days">${tiles}</div></details>`:`<div class="days">${tiles}</div>`}</section>`});
 h+=aiPromo()+`</main>`;
 app.innerHTML=h;new Player($('.herodemo'),heroDemo());
}

function aiPromo(){return `<section class="aqpromos">${PROG_KEYS.map(k=>{const C=PROGRAMMES[k];const n=acCount(C);return `<div class="aqpromo">${aqLockup('stack')}<div><p class="aqk">${esc(C.level)}</p><h2>${esc(C.full)}</h2><p>${n?`${n} of ${C.stages.length} stages passed`:P(C.card)}</p></div><a class="btn aqbtn" href="#${k}" data-prog="${k}">${n?'Continue':'Explore'} ${SVG.next}</a></div>`}).join('')}</section>`}

/* ---------- lesson page ---------- */
function sech(ic,t,time,p){return `<div class="sech"><span class="ico">${ic}</span><h2>${t}</h2>${time?`<span class="time">${time}</span>`:''}${p?`<p>${p}</p>`:''}</div>`}
function lesson(id){
 const l=COURSE[id];if(!l)return home();const u=unitOf(id);const checks=(PROG.checks||{})[id]||[];
 const order=allPlanLessons();const idx=order.indexOf(id);const prev=order[idx-1],next=order[idx+1];
 const pos=planLessons().indexOf(id);
 if(!lessonOpen(id)){const L=planLessons();const pv=L[L.indexOf(id)-1];
  app.innerHTML=topbar()+`<main class="wrap ${u.c}"><div class="lhead"><div class="crumb"><a href="#home">${SVG.back} Course map</a><span class="pill">${esc(P(u.t))}</span></div><div class="mrow"><div><h1>${LOCK} ${esc(P(l.t))}</h1><p class="goal">This lesson opens when you finish <a href="#lesson-${pv}">${esc(P(COURSE[pv].t))}</a>.</p><p><a class="btn" href="#lesson-${nextLesson()}">Go to my next lesson ${SVG.next}</a></p></div>${mascot('think',{say:'Finish the lesson before this one first.',cls:'md'})}</div></div></main>`;return}
 PROG.lastLesson=id;persist();
 let h=topbar()+`<main class="wrap ${u.c}"><div class="lhead"><div class="crumb"><a href="#home">${SVG.back} Course map</a><span class="pill">${esc(P(u.t))}</span>${pos>=0?`<span>Lesson ${pos+1} of ${planLessons().length}</span>`:'<span>Optional review</span>'}</div><h1>${esc(P(l.t))}</h1><p class="goal">${P(l.goal)}</p><div class="plan"><span class="chip">10 min warm-up</span><span class="chip">30 min learn &amp; try</span><span class="chip">15 min challenge</span><span class="chip">5 min show &amp; tell</span></div></div>`;
 h+=`<section class="sec">${sech(SVG.warm,'Warm-up','10 min',l.warm==='click'?'Wake up your fingers with the bubble game.':'Type for 10 minutes. Use this game, or your lessons on typingclub.com or typing.com.')}<div class="game warmup"></div></section>`;
 h+=`<section class="sec">${sech(SVG.bulb,'Learn','20 min','Read each step and press <b>Watch how</b> to see it happen on a '+(isWin()?'Windows':'Mac')+' screen.')}${l.learn.map((s,i)=>`<article class="step ${s.demo?'':'nodemo'}"><div class="txt"><span class="sn">${i+1}</span><h3>${P(s.h)}</h3>${P(s.p)}${readBtn(P('<p>'+s.h+'.</p>'+s.p))}</div>${s.demo?`<div class="demo" data-i="${i}"></div>`:''}</article>`).join('')}</section>`;
 h+=`<section class="sec">${sech(SVG.laptop,'Try it on your computer','10 min','Now do it for real. Tick each box when it\'s done.')}${l.mac.map((m,i)=>`<label class="ck ${checks[i]?'on':''}"><input type="checkbox" data-ck="${i}" ${checks[i]?'checked':''}><span>${P(m)}</span></label>`).join('')}</section>`;
 if(l.practice&&l.practice.length)h+=`<section class="sec">${sech(SVG.game,l.final?'Final tests':'Practice games','',l.final?'':'Practise right here on this page.')}${l.practice.map((p,i)=>`<div class="game" data-p="${i}"></div>`).join('')}</section>`;
 h+=`<section class="sec">${sech(SVG.flag,'Challenge','15 min')}<div class="chal"><p>${P(l.challenge)}</p>${readBtn(P(l.challenge))}</div></section>`;
 h+=`<section class="sec">${sech(SVG.chat,'Show &amp; Tell','5 min')}<div class="card" style="font-size:18px">${P('Teach Mum or Dad')} what you learned: <b class="tu">${P(l.tell)}</b></div></section>`;
 h+=`<div class="finish"></div><div class="stuck">${mascot('desk',{cls:'xs'})}<p><b>Stuck?</b> ${P('Press <b>Watch how</b> again, or press <b>Read to me</b>. Did something go wrong on your computer? Press <kbd>⌘</kbd> + <kbd>Z</kbd> to undo. Still stuck? Write down what happened and ask a grown-up. That\'s what real experts do!')}</p></div>
 <nav class="pn">${prev?`<a class="btn ghost" href="#lesson-${prev}">${SVG.back} Previous</a>`:'<span></span>'}${next&&lessonOpen(next)?`<a class="btn ghost" href="#lesson-${next}">Next ${SVG.next}</a>`:''}</nav></main>`;
 app.innerHTML=h;
 const wu=$('.warmup');if(l.warm==='click')wClick(wu,{goal:12,title:'Mouse warm-up: bubble pop'});else wTyping(wu,{level:l.warmLevel||1,title:'Typing warm-up'});
 $$('.demo').forEach(d=>new Player(d,l.learn[+d.dataset.i].demo));
 (l.practice||[]).forEach((p,i)=>{const el=$(`.game[data-p="${i}"]`);let cfg=Object.assign({},p);if(isWin()&&p.win)cfg=Object.assign(cfg,p.win);try{WIDGETS[p.type](el,deepP(cfg))}catch(e){console.error(e);el.textContent='This game could not load.'}});
 $$('[data-ck]').forEach(c=>c.onchange=()=>{PROG.checks=PROG.checks||{};const a=PROG.checks[id]||[];a[+c.dataset.ck]=c.checked;PROG.checks[id]=a;persist();c.closest('.ck').classList.toggle('on',c.checked)});
 finishBox(id,next);
}
function finishBox(id,next){
 const f=$('.finish');const u=unitOf(id);
 if(isDone(id)){f.innerHTML=`<h2>Lesson complete!</h2><p>${unitDone(u)?`<span class="tu">You earned the <b>${esc(u.badge)}</b> badge.</span> `:''}<span class="tu">${next?'On to the next one when you\'re ready.':'You finished the whole course. Amazing!'}</span></p><div class="row">${next?`<a class="btn wk" href="#lesson-${next}">Next lesson ${SVG.next}</a>`:''}<a class="btn ghost" href="#home">${SVG.map} Course map</a><button type="button" class="btn ghost sm undo">Mark as not finished</button></div>`;
  $('.undo',f).onclick=()=>{delete PROG.done[id];persist();finishBox(id,next);refreshStars()}}
 else{f.innerHTML=`<h2>All done?</h2><p>Watched every step, tried it on your computer and done the challenge? Then press the button!</p><div class="row"><button type="button" class="btn wk fin">${SVG.star} I finished this lesson!</button></div>`;
  $('.fin',f).onclick=()=>{PROG.done=PROG.done||{};PROG.done[id]=new Date().toISOString().slice(0,10);persist();confetti();finishBox(id,next);refreshStars()}}
}
function refreshStars(){const s=$('.stars');if(s)s.innerHTML=SVG.star+' '+doneCount()+' / '+planLessons().length}

/* ---------- profile ---------- */
function profile(){
 const pl=PROG.placement||{};const q=PROG.quiz||{};
 app.innerHTML=topbar()+`<main class="wrap"><div class="lhead"><div class="crumb"><a href="#home">${SVG.back} Course map</a></div><h1>${esc(USER.name)}</h1><p class="goal" data-noi18n>Username: <b>${esc(USER.username)}</b></p></div>
 <section class="sec"><div class="statgrid"><div><b>${doneCount()} / ${planLessons().length}</b><span>lessons done</span></div><div><b>${esc(pl.level||'–')}</b><span>level from your check</span></div><div><b>${PROG.wpm?.best||'–'}</b><span>best typing speed (wpm)</span></div><div><b>${Object.keys(q).length}</b><span>quizzes taken</span></div></div></section>
 <section class="sec"><h2>Computer</h2><p class="small">Lessons show screens and shortcuts for this computer. Your progress is kept if you switch.</p><div class="seg">${[['mac','Mac'],['win','Windows']].map(([k,t])=>`<button type="button" data-pp="${k}" class="${PROG.platform===k?'on':''}">${t}</button>`).join('')}</div></section>
 <section class="sec"><h2>Subtitle language</h2><p class="small">English stays the main text. Your language shows as a smaller line under it.</p>${langPicker()}</section>
 <section class="sec"><h2>Course</h2><p class="small">Switching keeps every lesson you've finished.</p><div class="seg">${[['auto','Computer: full course'],['advanced','Computer: Advanced only'],...PROG_KEYS.map(k=>[k,PROGRAMMES[k].name])].map(([k,t])=>`<button type="button" data-tt="${k}" class="${PROG.track===k?'on':''}">${t}</button>`).join('')}</div>
 <p style="margin-top:16px"><button type="button" class="btn ghost sm retake">Find my level (computer course)</button></p></section>
 <section class="sec"><button type="button" class="btn ghost" id="lo">${SVG.logout} Log out</button></section></main>`;
 $$('[data-pp]').forEach(b=>b.onclick=()=>{PROG.platform=b.dataset.pp;applyContext();persist();profile()});
 $$('[data-tt]').forEach(b=>b.onclick=()=>{PROG.track=b.dataset.tt;if(!PROGRAMMES[PROG.track]){PROG.ctrack=PROG.track;PROG.plan=makePlan(PROG.track)}persist();profile()});
 $('.retake').onclick=()=>setupPlacement();
 $('#lo').onclick=()=>{clearTimeout(saveTimer);flush().finally(()=>logout())};
}

/* ---------- router ---------- */
function route(){
 try{speechSynthesis.cancel()}catch(e){}
 if(!USER)return loginView();
 const hsh=location.hash;
 if(isAcHash(hsh)){acRoute(hsh);return window.scrollTo(0,0)}
 if(!PROG.track)return setupTrack();
 if(PROGRAMMES[PROG.track]&&hsh!=='#profile'){acHome(PROGRAMMES[PROG.track]);return window.scrollTo(0,0)}
 if(!PROG.platform||!PROG.plan||!PROG.plan.length)return setupComputer();const m=hsh.match(/^#lesson-([ab]\d+)$/);
 if(m)lesson(m[1]);else if(hsh==='#profile')profile();else home();
 window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
(async function boot(){
 if(!API.token())return loginView();
 app.innerHTML='<main class="auth"><p class="lead">Loading…</p></main>';
 try{const d=await API.call('/me');USER=d.user;PROG=d.progress||{};PROG.done=PROG.done||{};applyContext();route()}
 catch(e){if(e.status===401){API.setToken(null);loginView()}else loginView(e.message)}
})();
