/* =====================================================================
   Aqlyon Digital Skill Academy — admin panel
   ===================================================================== */
const root=$('#admin');
const AAPI={
 // "Keep me signed in" stores the login on this device (so badge QR links open straight into check-in)
 token:()=>{try{return sessionStorage.getItem('ca-admin')||localStorage.getItem('ca-admin')}catch(e){return null}},
 setToken:(t,keep)=>{try{sessionStorage.removeItem('ca-admin');localStorage.removeItem('ca-admin');if(t)(keep?localStorage:sessionStorage).setItem('ca-admin',t)}catch(e){}},
 async call(path,{method='GET',body}={}){
  const h={'content-type':'application/json'};const t=AAPI.token();if(t)h.authorization='Bearer '+t;
  let r;try{r=await fetch('/api'+path,{method,headers:h,body:body?JSON.stringify(body):undefined})}catch(e){throw new Error('Can\'t reach the server.')}
  let d={};try{d=await r.json()}catch(e){}
  if(r.status===401&&path!=='/admin/login'){AAPI.setToken(null);loginView('Please log in again.');throw new Error('Admin login needed.')}
  if(!r.ok)throw new Error(d.error||'Something went wrong.');return d;
 }
};
let USERS=[],FILTER='';
const fmtDate=s=>s?new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'–';
const ago=s=>{if(!s)return'Never';const d=(Date.now()-new Date(s))/864e5;return d<1?'Today':d<2?'Yesterday':d<7?Math.floor(d)+' days ago':fmtDate(s)};
const genPin=()=>String(Math.floor(1000+Math.random()*9000));
const slugUser=n=>n.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'').slice(0,20);
const trackName={auto:'Personal',basic:'Basic',advanced:'Advanced',ai:'AI Academy',dm:'Digital Marketing'};
function toast(msg,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
function modal(html,onReady){const m=document.createElement('div');m.className='modalbg';m.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(m);
 const close=()=>m.remove();m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))close()});document.addEventListener('keydown',function k(e){if(!m.isConnected)return document.removeEventListener('keydown',k);if(e.key==='Escape'&&m===[...document.querySelectorAll('.modalbg')].pop()){close();document.removeEventListener('keydown',k)}});onReady&&onReady(m,close);return close}
function confirmBox(title,text,okLabel,danger){return new Promise(res=>modal(`<h2>${title}</h2><p>${text}</p><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn ${danger?'danger':''} ok">${okLabel}</button></div>`,(m,close)=>{$('.ok',m).onclick=()=>{close();res(true)};m.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target===m)res(false)})}))}

function loginView(msg=''){
 root.innerHTML=`<main class="auth"><div class="authcard"><span class="logo big">${SVG.shield.replace('<svg','<svg width="34" height="34"')}</span><h1>Admin panel</h1><p class="lead">Aqlyon Digital Skill Academy</p><form class="authform"><div class="field"><label for="ap">Admin password</label><input id="ap" type="password" autocomplete="current-password" required></div><label class="ck keep"><input type="checkbox" id="keep" checked><span>Keep me signed in on this device <small>(for 2 weeks, handy for scanning badges)</small></span></label>${location.hash.startsWith('#checkin/')?'<p class="tipbox" style="margin:0 0 12px"><b>Helping with check-in?</b> You don\'t need to log in. Open the check-in link the organiser sent you and press <b>Scan badge</b> there.</p>':''}<p class="formerr" role="alert">${esc(msg)}</p><button class="btn" type="submit">Log in ${SVG.next}</button></form><p class="small"><a href="/academy">Go to the learner site</a></p></div></main>`;
 $('form').onsubmit=async e=>{e.preventDefault();const b=$('button',e.target);b.disabled=true;$('.formerr').textContent='';
  try{const keep=$('#keep').checked;const d=await AAPI.call('/admin/login',{method:'POST',body:{password:$('#ap').value,remember:keep}});AAPI.setToken(d.token,keep);dashboard()}catch(err){$('.formerr').textContent=err.message;b.disabled=false}};
 $('#ap').focus();
}

let SETTINGS={allowRegister:true};
async function load(){const [d,st]=await Promise.all([AAPI.call('/admin/users'),AAPI.call('/admin/settings').catch(()=>SETTINGS)]);USERS=d.users;SETTINGS=st;}
async function dashboard(){
 root.innerHTML=`<header class="top"><div class="in"><span class="brand"><span class="logo">${SVG.shield.replace('<svg','<svg width="20" height="20"')}</span><span>Admin panel</span></span><a class="userbtn" href="/academy" target="_blank" rel="noopener" style="margin-left:auto">Learner site ↗</a><button type="button" class="userbtn" id="alo">${SVG.logout}<span>Log out</span></button></div></header><div class="wrap admtabwrap"></div><main class="wrap adm"><p class="lead" style="margin-top:20px">Loading…</p></main>`;
 $('#alo').onclick=()=>{AAPI.setToken(null);loginView()};
 const h=location.hash;showTab(h.startsWith('#checkin/')||h.startsWith('#scan')?'checkin':h.startsWith('#events')?'events':'learners');
}
function render(){
 const main=$('.adm');const now=Date.now();
 const active=USERS.filter(u=>u.lastSeen&&now-new Date(u.lastSeen)<7*864e5).length;
 const lessons=USERS.reduce((s,u)=>s+(u.summary.done||0),0);
 const started=USERS.filter(u=>u.summary.total);const avg=started.length?Math.round(started.reduce((s,u)=>s+Math.min(1,u.summary.done/u.summary.total),0)/started.length*100):0;
 const list=USERS.filter(u=>!FILTER||(u.name+' '+u.username+' '+(u.email||'')+' '+(u.phone||'')).toLowerCase().includes(FILTER));
 main.innerHTML=`<div class="admhead"><h1>Learners</h1><button type="button" class="btn" id="add">＋ Add a learner</button></div>
 <div class="statgrid"><div><b>${USERS.length}</b><span>learners</span></div><div><b>${active}</b><span>active in the last 7 days</span></div><div><b>${lessons}</b><span>lessons completed in total</span></div><div><b>${avg}%</b><span>average course progress</span></div></div>
 <div class="tipbox signin">Learners sign in at <b class="url">${esc(location.origin)}/academy</b> <button type="button" class="mini cpurl">Copy link</button></div>
 <label class="regtoggle"><input type="checkbox" id="allowreg" ${SETTINGS.allowRegister?'checked':''}><span><b>Let people create their own account</b><small>Shows a "Create an account" button on the learner sign-in page. New sign-ups appear here and you can manage them like any learner.</small></span></label>
 <div class="field" style="max-width:360px;margin-top:18px"><label for="flt">Search</label><input id="flt" placeholder="Name, username, email or phone" value="${esc(FILTER)}"></div>
 ${USERS.length?`<div class="utable" role="table"><div class="urow uhead" role="row"><span>Learner</span><span>Computer · course</span><span>Level</span><span>Progress</span><span>Last active</span><span></span></div>${list.map(rowHTML).join('')||'<p class="small" style="padding:16px">No learners match your search.</p>'}</div>`:`<div class="empty"><h2>No learners yet</h2><p>Add your first learner: give them a username and a PIN, then send them the sign-in link above.</p><button type="button" class="btn" id="add2">＋ Add a learner</button></div>`}`;
 $('#add').onclick=addLearner;const a2=$('#add2');if(a2)a2.onclick=addLearner;
 $('.cpurl').onclick=()=>copy(location.origin+'/academy');
 $('#allowreg').onchange=async e=>{const v=e.target.checked;try{SETTINGS=await AAPI.call('/admin/settings',{method:'PATCH',body:{allowRegister:v}});toast(v?'Sign-up is open':'Sign-up is closed')}catch(err){e.target.checked=!v;toast(err.message,true)}};
 const f=$('#flt');f.oninput=()=>{FILTER=f.value.toLowerCase().trim();const pos=f.selectionStart;render();const g=$('#flt');g.focus();g.setSelectionRange(pos,pos)};
 $$('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act,b.dataset.u));
}
function rowHTML(u){const s=u.summary;const pct=s.total?Math.round(Math.min(1,s.done/s.total)*100):0;
 return `<div class="urow ${u.active?'':'inactive'}" role="row"><span class="uname"><b>${esc(u.name)}</b><small>@${esc(u.username)} · ${u.kind==='child'?'Child':'Adult'}${u.lang?' · '+esc(langName(u.lang).split(' · ')[0]):''}${u.self?' · <span class="selfreg">signed up</span>':''}${u.active?'':' · <em>switched off</em>'}</small>${u.email||u.phone?`<small class="ucontact">${u.country?`${flagOf(u.country)} ${esc((COUNTRIES.find(c=>c[0]===u.country)||[,u.country])[1])} · `:''}${u.phone?`<a href="tel:${esc(u.phone.replace(/\s/g,''))}">${esc(u.phone)}</a> · `:''}${u.email?`<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>`:''}</small>`:''}</span>
 <span>${s.started&&s.platform?`${s.platform==='win'?'Windows':'Mac'} · ${trackName[s.track]||'–'}`:'<span class="muted">Not started</span>'}</span>
 <span>${s.level?`<span class="chip2">${esc(s.level)}</span>`:'–'}</span>
 <span class="prog2"><span class="pbar"><i style="width:${pct}%"></i></span><small>${s.done||0} / ${s.total||0} lessons</small>${PROG_KEYS.filter(k=>s.prog?.[k]?.started).map(k=>`<small class="aiprog">${PROGRAMMES[k].name}: ${s.prog[k].passed} / ${s.prog[k].total}${u.certs?.[k]?' · <b>certified</b>':''}</small>`).join('')}</span>
 <span>${ago(u.lastSeen)}</span>
 <span class="acts"><button type="button" class="mini" data-act="view" data-u="${u.username}">View</button><button type="button" class="mini" data-act="pin" data-u="${u.username}">Reset PIN</button><button type="button" class="mini" data-act="more" data-u="${u.username}" aria-label="More actions">⋯</button></span></div>`}
async function copy(t){try{await navigator.clipboard.writeText(t);toast('Copied')}catch(e){toast('Copy failed. Select the text and copy it.',true)}}

const SUBL=[['','English only'],['ml','Malayalam · മലയാളം'],['hi','Hindi · हिन्दी'],['ar','Arabic · العربية']];
const langName=c=>(SUBL.find(l=>l[0]===(c||''))||SUBL[0])[1];
const langSelect=(id,v='')=>`<select id="${id}" class="sel">${SUBL.map(([k,t])=>`<option value="${k}" ${k===(v||'')?'selected':''}>${t}</option>`).join('')}</select>`;
function addLearner(){
 modal(`<h2>Add a learner</h2><form class="mform"><div class="field"><label for="n-name">Name</label><input id="n-name" required maxlength="40"></div>
 <div class="field"><label for="n-user">Username</label><input id="n-user" required maxlength="24" autocapitalize="none" spellcheck="false"><small class="small">Small letters, numbers, dot, dash or underscore.</small></div>
 <div class="field"><label for="n-pin">PIN</label><div class="inrow"><input id="n-pin" required minlength="4" maxlength="20" value="${genPin()}"><button type="button" class="btn ghost sm gen">New PIN</button></div><small class="small">4–20 characters. Use a longer password for adults.</small></div>
 <fieldset class="qset"><legend>Learner type</legend><label class="ck"><input type="radio" name="kind" value="child" checked><span><b>Child</b>: playful wording, mentions parents</span></label><label class="ck"><input type="radio" name="kind" value="adult"><span><b>Adult</b>: plain wording</span></label></fieldset>
 <div class="field"><label for="n-lang">Subtitle language</label>${langSelect('n-lang')}<small class="small">English stays the main text; this language shows underneath. The learner can change it too.</small></div>
 <p class="formerr"></p><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn">Create learner</button></div></form>`,(m,close)=>{
  const nm=$('#n-name',m),us=$('#n-user',m);let touched=false;us.oninput=()=>touched=true;nm.oninput=()=>{if(!touched)us.value=slugUser(nm.value.split(' ')[0]||'')};
  $('.gen',m).onclick=()=>$('#n-pin',m).value=genPin();nm.focus();
  $('form',m).onsubmit=async e=>{e.preventDefault();const body={name:nm.value.trim(),username:us.value.trim().toLowerCase(),pin:$('#n-pin',m).value,kind:$('input[name=kind]:checked',m).value,lang:$('#n-lang',m).value};
   try{await AAPI.call('/admin/users',{method:'POST',body});close();await load();render();showCreds(body)}catch(err){$('.formerr',m).textContent=err.message}};
 });
}
function showCreds(b){const txt=`Aqlyon Digital Skill Academy\nSign in at: ${location.origin}/academy\nUsername: ${b.username}\nPIN: ${b.pin}`;
 modal(`<h2>${esc(b.name)} is ready</h2><p>Share these sign-in details with ${esc(b.name.split(' ')[0])}. The PIN is only shown now. You can always reset it later.</p><pre class="creds">${esc(txt)}</pre><div class="mrow"><button type="button" class="btn ghost cp">Copy details</button><button type="button" class="btn" data-close>Done</button></div>`,(m)=>{$('.cp',m).onclick=()=>copy(txt)})}

async function act(a,username){
 const u=USERS.find(x=>x.username===username);if(!u)return;
 if(a==='view')return viewUser(u);
 if(a==='pin')return modal(`<h2>Reset PIN for ${esc(u.name)}</h2><form class="mform"><div class="field"><label for="r-pin">New PIN</label><div class="inrow"><input id="r-pin" minlength="4" maxlength="20" required value="${genPin()}"><button type="button" class="btn ghost sm gen">New PIN</button></div></div><p class="formerr"></p><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Save PIN</button></div></form>`,(m,close)=>{
  $('.gen',m).onclick=()=>$('#r-pin',m).value=genPin();
  $('form',m).onsubmit=async e=>{e.preventDefault();const pin=$('#r-pin',m).value;try{await AAPI.call('/admin/users/'+username,{method:'PATCH',body:{pin}});close();showCreds({name:u.name,username,pin})}catch(err){$('.formerr',m).textContent=err.message}}});
 if(a==='more')return modal(`<h2>${esc(u.name)}</h2><div class="morelist"><button type="button" class="btn ghost" data-m="toggle">${u.active?'Switch off account':'Switch on account'}</button><button type="button" class="btn ghost" data-m="kind">Change to ${u.kind==='child'?'adult':'child'} wording</button><button type="button" class="btn ghost" data-m="lang">Subtitles: ${esc(langName(u.lang))}</button><button type="button" class="btn ghost" data-m="rename">Rename</button><button type="button" class="btn ghost" data-m="reset">Reset progress…</button><button type="button" class="btn danger" data-m="delete">Delete learner…</button></div><div class="mrow"><button type="button" class="btn ghost" data-close>Close</button></div>`,(m,close)=>{
  $$('[data-m]',m).forEach(b=>b.onclick=async()=>{close();const k=b.dataset.m;try{
   if(k==='toggle'){await AAPI.call('/admin/users/'+username,{method:'PATCH',body:{active:!u.active}});toast(u.active?'Account switched off':'Account switched on')}
   if(k==='kind'){await AAPI.call('/admin/users/'+username,{method:'PATCH',body:{kind:u.kind==='child'?'adult':'child'}});toast('Wording updated')}
   if(k==='lang'){return modal(`<h2>Subtitle language</h2><form class="mform"><div class="field"><label for="ul">Shown under the English text for ${esc(u.name)}</label>${langSelect('ul',u.lang)}</div><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`,(m2,c2)=>{$('form',m2).onsubmit=async e=>{e.preventDefault();await AAPI.call('/admin/users/'+username,{method:'PATCH',body:{lang:$('#ul',m2).value}});c2();await load();render();toast('Subtitle language saved')}})}
   if(k==='rename'){return modal(`<h2>Rename</h2><form class="mform"><div class="field"><label for="rn">Name</label><input id="rn" value="${esc(u.name)}" maxlength="40" required></div><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`,(m2,c2)=>{$('form',m2).onsubmit=async e=>{e.preventDefault();await AAPI.call('/admin/users/'+username,{method:'PATCH',body:{name:$('#rn',m2).value}});c2();await load();render();toast('Renamed')}})}
   if(k==='reset'){if(!await confirmBox('Reset progress?',`${esc(u.name)} will start again from the beginning: computer choice, quick check and all lessons. This cannot be undone.`,'Reset progress',true))return;await AAPI.call('/admin/users/'+username+'/reset-progress',{method:'POST'});toast('Progress reset')}
   if(k==='delete'){if(!await confirmBox('Delete learner?',`${esc(u.name)}'s account and all progress will be removed for good.`,'Delete',true))return;await AAPI.call('/admin/users/'+username,{method:'DELETE'});toast('Learner deleted')}
   await load();render()}catch(err){toast(err.message,true)}})});
}

function progAdmin(C,p,u){const k=C.key;const cert=u.certs?.[k];if(!p[k]&&!cert)return'';const st=p[k]?.st||{};
 const rows=C.stages.map((x,i)=>{const r=st[x.id];return `<tr><td><b>${i+1}. ${esc(P(x.t))}</b><br><small class="small">Level ${x.lvl}</small></td><td>${r?.passed?'<span class="chip2 known">Passed</span>':r?.tries?'<span class="chip2 refresh">Trying</span>':'–'}</td><td>${r?`${r.best}/5`:'–'}</td><td>${r?.tries||0}</td></tr>`}).join('');
 const pl=p[k]?.place;
 return `<h3 style="margin-top:18px">${esc(C.full)}</h3><p class="small">${pl?`Level check: ${esc(C.levelNames[pl.start]||'')} (${pl.right}/${pl.asked} right, ${fmtDate(pl.date)}). `:''}${cert?`Certificate <b>${esc(cert.id)}</b> issued ${fmtDate(cert.date)}, final score ${cert.score}%.`:'No certificate yet.'}</p><div class="shwrap"><table class="dtable"><tr><th>Stage</th><th>Status</th><th>Best quiz</th><th>Tries</th></tr>${rows}</table></div>`}
async function viewUser(u){
 let d;try{d=await AAPI.call('/admin/users/'+u.username)}catch(e){return toast(e.message,true)}
 const p=d.progress||{};setContext({platform:p.platform||'mac',kind:u.kind,name:u.name});
 const pl=p.placement;const done=p.done||{};const plan=(p.plan||[]);
 const unitRows=plan.map(x=>{const un=UNITS.find(y=>y.id===x.u);if(!un)return'';const n=un.lessons.filter(id=>done[id]).length;const pr=pl?.units?.[un.id];
  return `<tr><td><b>${esc(P(un.t))}</b><br><small class="small">${un.track==='basic'?'Basic':'Advanced'}</small></td><td>${x.s==='known'?'<span class="chip2 known">Knows it</span>':x.s==='refresh'?'<span class="chip2 refresh">Refresher</span>':'Learning'}</td><td>${pr?`${pr.right}/${pr.asked} right`:'–'}</td><td><span class="pbar"><i style="width:${Math.round(n/un.lessons.length*100)}%"></i></span> ${n}/${un.lessons.length}</td></tr>`}).join('');
 const recent=Object.entries(done).sort((a,b)=>b[1].localeCompare(a[1])).slice(0,12).map(([id,dt])=>`<li><b>${esc(P(COURSE[id]?.t||id))}</b> <span class="small">${fmtDate(dt)}</span></li>`).join('');
 const qz=Object.entries(p.quiz||{}).map(([k,v])=>`<li>${esc(k)}: <b>${v}${p.quizMax?.[k]?' / '+p.quizMax[k]:''}</b></li>`).join('');
 modal(`<h2>${esc(u.name)} <small class="small">@${esc(u.username)}</small></h2>
 <div class="statgrid sm"><div><b>${d.summary.done||0} / ${d.summary.total||0}</b><span>lessons</span></div><div><b>${esc(pl?.level||'–')}</b><span>level${pl?.date?' ('+fmtDate(pl.date)+')':''}</span></div><div><b>${p.platform?(p.platform==='win'?'Windows':'Mac'):'–'}</b><span>computer</span></div><div><b>${p.wpm?.best||'–'}</b><span>best wpm</span></div></div>
 ${pl&&!pl.skipped?`<p class="small">Quick check: basics ${pl.basicScore}% correct${pl.advScore||pl.level==='Advanced'||pl.level==='Expert'?`, advanced ${pl.advScore}% correct`:''} (${pl.asked} questions).</p>`:''}
 ${plan.length?`<div class="shwrap"><table class="dtable"><tr><th>Unit</th><th>Status</th><th>Quick check</th><th>Progress</th></tr>${unitRows}</table></div>`:(PROGRAMMES[p.track]?'<p>This learner is on a certificate programme only (see below).</p>':'<p>This learner hasn\'t set up their course yet.</p>')}
 ${PROG_KEYS.map(k=>progAdmin(PROGRAMMES[k],p,u)).join('')}<div class="twocol"><div><h3>Recently finished</h3><ul class="plainlist">${recent||'<li class="small">Nothing yet</li>'}</ul></div><div><h3>Quiz scores</h3><ul class="plainlist">${qz||'<li class="small">No quizzes yet</li>'}</ul><h3>Typing</h3><p class="small">First: ${p.wpm?.first||'–'} · Best: ${p.wpm?.best||'–'} · Final test: ${p.wpm?.final||p.wpm?.advFinal||'–'} wpm</p></div></div>
 <div class="mrow"><button type="button" class="btn" data-close>Close</button></div>`);
}

(function boot(){if(AAPI.token())dashboard();else loginView()})();
