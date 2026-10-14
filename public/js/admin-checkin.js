/* =====================================================================
   Admin: event check-in (made for a phone at the entrance)
   - Scan a participant's badge QR with the camera, see who it is, mark them as attended.
   - Badge QR codes hold  <site>/admin#checkin/<token>, so the phone's own camera app also opens them here.
   - Find people by name / mobile / ref when they don't have their badge.
   ===================================================================== */
let CK={ev:null,regs:[],stream:null,raf:0,busy:false,detector:null,jsqr:false,auto:false};
try{CK.auto=localStorage.getItem('ck-auto')==='1'}catch(x){}
const ckTime=s=>new Date(s).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true});
const ckTok=txt=>{const m=String(txt||'').match(/(?:checkin\/|badge\/)([a-f0-9]{20})\b/)||String(txt||'').trim().match(/^([a-f0-9]{20})$/);return m?m[1]:''};

// the event to check in for: the one in the link, else the one chosen before, else the one happening soonest
function ckPick(list){
 const fromHash=(location.hash.match(/^#scan\/([a-f0-9]{16})/)||[])[1];let saved='';try{saved=localStorage.getItem('ck-ev')||''}catch(x){}
 const now=Date.now(),t=e=>Date.parse(e.start+':00');
 return list.find(e=>e.id===fromHash)||list.find(e=>e.id===saved)||list.slice().sort((a,b)=>Math.abs(t(a)-now)-Math.abs(t(b)-now))[0]||null;
}
async function checkinTab(){
 const main=$('.adm');main.innerHTML='<p class="lead" style="margin-top:20px">Loading…</p>';
 try{await loadEvents()}catch(e){return}
 const list=EVENTS.filter(e=>e.regMode==='form'&&e.mode!=='online'&&Date.parse(e.start+':00')>Date.now()-30*864e5);
 const tk=(location.hash.match(/^#checkin\/([a-f0-9]{20})/)||[])[1];
 CK.ev=ckPick(list);
 main.innerHTML=`<div class="admhead"><h1>Check-in</h1></div>
 ${list.length?`<div class="ckbar"><label for="ckev" class="small">Event</label><select id="ckev">${list.map(e=>`<option value="${e.id}" ${CK.ev&&e.id===CK.ev.id?'selected':''}>${esc(e.title)} · ${esc(evDate(e).split(' · ')[0])}</option>`).join('')}</select></div>
 <div class="ckcount" aria-live="polite"></div>
 <button type="button" class="btn ckscan">📷 Scan badge</button>
 <div class="ckcam" hidden><video playsinline muted></video><div class="ckframe" aria-hidden="true"></div><p class="ckcamtip">Point the camera at the QR code on the badge</p><button type="button" class="btn ghost sm ckstop">Close camera</button></div>
 <label class="ckauto"><input type="checkbox" id="ckauto" ${CK.auto?'checked':''}><span>Check in straight away after scanning <small>(faster for long queues)</small></span></label>
 <div class="field ckfind"><label for="ckq">No badge? Find the person</label><input id="ckq" type="search" placeholder="Name, mobile number or ref" autocomplete="off"></div>
 <div class="ckres"></div>
 <h2 class="evh">Recently checked in</h2><div class="cklast"></div>`
 :`<div class="empty"><p>No offline events with registrations yet. Create an event with <b>Our registration form</b> under <b>Events</b>.</p></div>`}`;
 if(!list.length){if(tk)ckOpen(tk);return}
 $('#ckev').onchange=async ev=>{CK.ev=list.find(e=>e.id===ev.target.value);try{localStorage.setItem('ck-ev',CK.ev.id)}catch(x){}history.replaceState(null,'','#scan/'+CK.ev.id);await ckLoad()};
 $('#ckauto').onchange=ev=>{CK.auto=ev.target.checked;try{localStorage.setItem('ck-auto',CK.auto?'1':'0')}catch(x){}};
 $('.ckscan').onclick=startScan;$('.ckstop').onclick=stopScan;
 $('#ckq').oninput=ckFind;
 await ckLoad();
 if(tk){history.replaceState(null,'','#scan/'+(CK.ev?CK.ev.id:''));ckOpen(tk)}
}
async function ckLoad(){
 if(!CK.ev)return;try{CK.regs=(await AAPI.call(`/admin/events/${CK.ev.id}/regs`)).regs}catch(e){CK.regs=[]}
 ckDraw();
}
function ckDraw(){
 const ok=CK.regs.filter(r=>['confirmed','approved'].includes(r.status));
 const tot=ok.reduce((t,r)=>t+(r.seats||1),0),inn=ok.filter(r=>r.attended).reduce((t,r)=>t+(r.seats||1),0);
 const c=$('.ckcount');if(c)c.innerHTML=`<b>${inn}</b> of ${tot} people checked in<div class="ckprog"><i style="width:${tot?Math.round(inn/tot*100):0}%"></i></div>`;
 const last=ok.filter(r=>r.attended).sort((a,b)=>a.attended<b.attended?1:-1).slice(0,8);
 const l=$('.cklast');if(l)l.innerHTML=last.length?last.map(r=>`<div class="ckrow"><div><b>${esc(r.name)}</b><small>${esc(r.ref)} · ${esc(r.role||'')}${r.seats>1?' · '+r.seats+' people':''}</small></div><span class="attyes">✓ ${ckTime(r.attended)}</span></div>`).join(''):'<p class="small">Nobody yet.</p>';
 ckFind();
}
function ckFind(){
 const box=$('.ckres'),q=($('#ckq')||{}).value||'';if(!box)return;const t=q.trim().toLowerCase();
 if(t.length<2){box.innerHTML='';return}
 const digits=t.replace(/\D/g,'');
 const hits=CK.regs.filter(r=>(r.name||'').toLowerCase().includes(t)||(r.ref||'').toLowerCase().includes(t)||(digits.length>=4&&String(r.phone+r.whatsapp).replace(/\D/g,'').includes(digits))).slice(0,8);
 box.innerHTML=hits.length?hits.map(r=>`<button type="button" class="ckrow pick" data-tk="${r.tk||''}"><div><b>${esc(r.name)}</b><small>${esc(r.ref)} · ${esc(r.phone)} · ${esc((REG_ST[r.status]||[r.status])[0])}</small></div>${r.attended?`<span class="attyes">✓ ${ckTime(r.attended)}</span>`:'<span class="ckgo">Open ›</span>'}</button>`).join(''):'<p class="small">No one found for this event.</p>';
 $$('.pick',box).forEach(b=>b.onclick=()=>b.dataset.tk&&ckOpen(b.dataset.tk));
}

/* ---------- result card: who is this, and mark as attended ---------- */
async function ckOpen(tk,fromScan){
 let d;try{d=await AAPI.call('/admin/checkin/'+tk)}catch(err){ckSheet(`<div class="ckhead bad"><span>✕</span><b>Not valid</b></div><p>${esc(err.message)}</p>`,fromScan);return}
 if(fromScan&&CK.auto&&['confirmed','approved'].includes(d.reg.status)&&!d.reg.attended&&(!CK.ev||d.event.id===CK.ev.id)){
  try{const x=await AAPI.call('/admin/checkin/'+tk,{method:'POST',body:{attended:true}});return ckShow(x,fromScan,true)}catch(err){}
 }
 ckShow(d,fromScan,false);
}
function ckShow(d,fromScan,justNow){
 const r=d.reg,e=d.event,ok=['confirmed','approved'].includes(r.status),other=CK.ev&&e.id!==CK.ev.id;
 const head=!ok?`<div class="ckhead bad"><span>✕</span><b>${r.status==='pending'?'Not approved yet':'Registration '+esc(r.status)}</b></div>`
  :r.attended&&!justNow?`<div class="ckhead warn"><span>!</span><b>Already checked in at ${ckTime(r.attended)}</b></div>`
  :r.attended?`<div class="ckhead in"><span>✓</span><b>Checked in</b></div>`:`<div class="ckhead ok"><span>✓</span><b>Valid badge</b></div>`;
 ckSheet(`${head}${other?`<p class="ckother">⚠ This badge is for another event: <b>${esc(e.title)}</b></p>`:''}
  <h2 class="ckname">${esc(r.name)}</h2>
  <p class="ckchips">${r.role?`<span class="chipx">${esc(r.role)}</span>`:''}${r.seats>1?`<span class="chipx adm">Admits ${r.seats}</span>`:''}<span class="chipx">${esc(r.ref)}</span></p>
  <p class="small">${esc(e.title)} · <a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>${r.education?' · '+esc(r.education):''}</p>
  <div class="ckacts">${ok&&!r.attended?`<button type="button" class="btn big ckmark">✓ Mark as attended${r.seats>1?` (${r.seats} people)`:''}</button>`:''}
  ${ok&&r.attended?`<button type="button" class="btn ghost ckundo">Undo check-in</button>`:''}
  <button type="button" class="btn ${ok&&!r.attended?'ghost':''} cknext">${CK.stream?'Scan next':'Done'}</button></div>`,fromScan,{
  mark:async b=>{b.disabled=true;try{const x=await AAPI.call('/admin/checkin/'+r.tk,{method:'POST',body:{attended:true}});if(navigator.vibrate)navigator.vibrate(60);ckShow(x,fromScan,true)}catch(err){b.disabled=false;toast(err.message,true)}},
  undo:async b=>{b.disabled=true;try{const x=await AAPI.call('/admin/checkin/'+r.tk,{method:'POST',body:{attended:false}});toast('Check-in undone');ckShow(x,fromScan,false)}catch(err){b.disabled=false;toast(err.message,true)}}});
 // keep the list on screen in step
 const i=CK.regs.findIndex(x=>x.id===r.id);if(i>=0){CK.regs[i]={...CK.regs[i],attended:r.attended,status:r.status};ckDraw()}
}
function ckSheet(html,fromScan,h={}){
 const old=$('.cksheet');if(old)old.remove();
 const m=document.createElement('div');m.className='cksheet';m.innerHTML=`<div class="ckcard" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(m);
 const close=()=>{m.remove();CK.closedAt=Date.now();if(CK.stream){CK.busy=false}};
 m.addEventListener('click',ev=>{if(ev.target===m)close()});
 const mk=$('.ckmark',m);if(mk)mk.onclick=()=>h.mark(mk);
 const un=$('.ckundo',m);if(un)un.onclick=()=>h.undo(un);
 const nx=$('.cknext',m);if(nx)nx.onclick=close;else{const b=document.createElement('div');b.className='ckacts';b.innerHTML=`<button type="button" class="btn cknext">${CK.stream?'Scan next':'Close'}</button>`;$('.ckcard',m).appendChild(b);$('.cknext',m).onclick=close}
}

/* ---------- camera scanner: BarcodeDetector where the browser has it, otherwise jsQR ---------- */
async function startScan(){
 const cam=$('.ckcam'),v=$('.ckcam video');
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('This browser cannot use the camera here. Open the badge QR with the phone camera app instead.',true);return}
 try{CK.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
 catch(err){toast(err.name==='NotAllowedError'?'Camera permission was refused. Allow the camera for this site in the browser settings.':'Could not open the camera.',true);return}
 v.srcObject=CK.stream;await v.play().catch(()=>{});cam.hidden=false;$('.ckscan').hidden=true;CK.busy=false;
 cam.scrollIntoView({behavior:'smooth',block:'center'});
 if(!CK.detector&&'BarcodeDetector' in window){try{const f=await BarcodeDetector.getSupportedFormats();if(f.includes('qr_code'))CK.detector=new BarcodeDetector({formats:['qr_code']})}catch(x){}}
 if(!CK.detector&&!CK.jsqr){await new Promise(res=>{const s=document.createElement('script');s.src='/js/vendor/jsQR.js';s.onload=res;s.onerror=res;document.head.appendChild(s)});CK.jsqr=typeof jsQR==='function'}
 const cv=document.createElement('canvas'),g=cv.getContext('2d',{willReadFrequently:true});let last=0;
 const loop=async t=>{if(!CK.stream)return;CK.raf=requestAnimationFrame(loop);
  if(CK.busy||t-last<180||v.readyState<2)return;last=t;let txt='';
  try{if(CK.detector){const c=await CK.detector.detect(v);txt=c[0]&&c[0].rawValue}
   else if(CK.jsqr){const k=Math.min(1,720/v.videoWidth);cv.width=v.videoWidth*k;cv.height=v.videoHeight*k;g.drawImage(v,0,0,cv.width,cv.height);const c=jsQR(g.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:'dontInvert'});txt=c&&c.data}}catch(x){}
  if(!txt||CK.busy)return;CK.busy=true;if(navigator.vibrate)navigator.vibrate(40);
  const tk=ckTok(txt);
  if(tk&&tk===CK.lastTk&&Date.now()-(CK.closedAt||0)<4000){CK.busy=false;return}   // same badge still in front of the camera
  CK.lastTk=tk;if(!tk){ckSheet(`<div class="ckhead bad"><span>✕</span><b>Not an Aqlyon badge</b></div><p class="small">This QR code is not a badge from this website.</p>`,true);return}
  ckOpen(tk,true)};
 CK.raf=requestAnimationFrame(loop);
}
function stopScan(){
 cancelAnimationFrame(CK.raf);if(CK.stream){CK.stream.getTracks().forEach(t=>t.stop());CK.stream=null}
 const cam=$('.ckcam');if(cam)cam.hidden=true;const b=$('.ckscan');if(b)b.hidden=false;CK.busy=false;
}
// a badge link opened while the admin is already on this page
addEventListener('hashchange',()=>{const tk=(location.hash.match(/^#checkin\/([a-f0-9]{20})/)||[])[1];if(tk&&$('.adm'))showTab('checkin')});
