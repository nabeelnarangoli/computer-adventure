/* =====================================================================
   Admin: Upcoming events (create, edit, open/close registration,
   registrations, approvals over WhatsApp, Google Sheet, CSV export)
   ===================================================================== */
const EV_TZ=[['Asia/Kolkata','India time (IST)'],['Asia/Dubai','UAE time (GST)'],['Asia/Riyadh','Saudi time (AST)'],['Asia/Qatar','Qatar time (AST)'],['Europe/London','UK time']];
const EV_CUR=['AED','INR','USD','SAR','QAR','OMR'];
let EVENTS=[],EVSET={whatsapp:'+919539244342',sheetUrl:''};
const evDate=e=>{try{const d=new Date(e.start+':00');return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true})+' '+((EV_TZ.find(t=>t[0]===e.tz)||[])[1]||'').replace(/.*\((.*)\)/,'$1')}catch(x){return e.start}};
const evLink=e=>location.origin+'/events/'+e.slug;
const STATE_LABEL={open:['Registration open','ok'],closed:['Registration closed','no'],full:['Fully booked','no'],ended:['Ended','muted'],none:['Info only','muted']};
const waLink=(num,text)=>`https://wa.me/${String(num).replace(/[^\d]/g,'')}?text=${encodeURIComponent(text)}`;

function adminTabs(active){return `<nav class="admtabs" role="tablist">${[['learners','Learners'],['events','Events']].map(([k,t])=>`<button type="button" role="tab" aria-selected="${k===active}" class="${k===active?'on':''}" data-tab="${k}">${t}</button>`).join('')}</nav>`}
function bindTabs(){$$('[data-tab]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.tab==='events'?'#events':'';showTab(b.dataset.tab)})}
async function showTab(t){
 $('.admtabwrap').innerHTML=adminTabs(t);bindTabs();
 if(t==='events'){$('.adm').innerHTML='<p class="lead" style="margin-top:20px">Loading events…</p>';await loadEvents();renderEvents()}
 else{$('.adm').innerHTML='<p class="lead" style="margin-top:20px">Loading learners…</p>';try{await load()}catch(e){return}render()}
}
async function loadEvents(){const d=await AAPI.call('/admin/events');EVENTS=d.events;EVSET=d.settings}

function renderEvents(){
 const main=$('.adm');
 const card=e=>{const [sl,sc]=STATE_LABEL[e.state]||['',''];return `<article class="evcard">
  <div class="evthumb">${e.cover?`<img src="/api/img/${e.cover}" alt="" loading="lazy">`:'<span>No cover</span>'}</div>
  <div class="evbody"><div class="evchips">${e.published?'':'<span class="chipx draft">Draft (hidden)</span>'}<span class="chipx ${sc}">${sl}</span><span class="chipx">${e.mode==='online'?'Online':'Offline'}</span><span class="chipx">${e.paid?esc(e.currency+' '+e.price):'Free'}</span></div>
  <h3>${esc(e.title)}</h3><p class="small">${esc(evDate(e))}${e.mode==='offline'&&e.locationName?' · '+esc(e.locationName):''}</p>
  <p class="small">${e.regMode==='form'?`<b>${e.counts.total}</b> registration${e.counts.total===1?'':'s'} · ${e.counts.seats} seat${e.counts.seats===1?'':'s'}${e.capacity?' of '+e.capacity:''}${e.counts.pending?` · <b class="warn">${e.counts.pending} waiting for approval</b>`:''}`:e.regMode==='link'?'Registration on an external link':'No registration'}</p>
  <div class="evbtns"><button type="button" class="btn sm" data-ev="edit" data-id="${e.id}">Edit</button>${e.regMode==='form'?`<button type="button" class="btn sm ghost" data-ev="regs" data-id="${e.id}">Registrations</button>`:''}${e.regMode!=='none'&&e.state!=='ended'?`<button type="button" class="btn sm ghost" data-ev="toggle" data-id="${e.id}">${e.regOpen?'Close registration':'Open registration'}</button>`:''}<button type="button" class="btn sm ghost" data-ev="copy" data-id="${e.id}">Copy link</button><a class="btn sm ghost" href="/events/${esc(e.slug)}" target="_blank" rel="noopener">View page ↗</a></div></div></article>`};
 const t=e=>Date.parse(e.start+':00');const up=EVENTS.filter(e=>e.state!=='ended').sort((a,b)=>t(a)-t(b)),past=EVENTS.filter(e=>e.state==='ended').sort((a,b)=>t(b)-t(a));
 main.innerHTML=`<div class="admhead"><h1>Events</h1><button type="button" class="btn" id="newev">＋ New event</button></div>
 <details class="evset"><summary><b>Event settings</b> · WhatsApp for approvals: ${esc(EVSET.whatsapp)} · Google Sheet: ${EVSET.sheetUrl?'connected':'not connected'}</summary>
  <form class="mform evsetform"><div class="field"><label for="es-wa">WhatsApp number for paid registrations</label><input id="es-wa" value="${esc(EVSET.whatsapp)}" inputmode="tel"><small class="small">Visitors who register for a paid event send their details to this number for payment and approval. Include the country code.</small></div>
  <div class="field"><label for="es-sh">Google Sheet for all registrations (optional)</label><input id="es-sh" value="${esc(EVSET.sheetUrl)}" placeholder="https://script.google.com/macros/s/…/exec"><small class="small">Every registration is also added as a row in this sheet. Each event can use its own sheet instead. <button type="button" class="linkbtn sheethelp">How to connect a Google Sheet</button></small></div>
  <p class="formerr"></p><button class="btn sm" type="submit">Save settings</button></form></details>
 <h2 class="evh">Upcoming</h2>${up.length?`<div class="evlist">${up.map(card).join('')}</div>`:`<div class="empty"><p>No upcoming events. Press <b>＋ New event</b> to add one. It appears on the website under <b>Upcoming events</b>.</p></div>`}
 ${past.length?`<h2 class="evh">Past</h2><div class="evlist past">${past.map(card).join('')}</div>`:''}`;
 $('#newev').onclick=()=>eventForm();
 $('.sheethelp').onclick=sheetHelp;
 $('.evsetform').onsubmit=async ev=>{ev.preventDefault();const f=ev.target;try{EVSET=await AAPI.call('/admin/events/settings',{method:'PATCH',body:{whatsapp:$('#es-wa').value,sheetUrl:$('#es-sh').value}});toast('Settings saved');renderEvents()}catch(err){$('.formerr',f).textContent=err.message}};
 $$('[data-ev]').forEach(b=>b.onclick=async()=>{const e=EVENTS.find(x=>x.id===b.dataset.id);const a=b.dataset.ev;
  if(a==='edit')return eventForm(e);
  if(a==='regs')return regsView(e);
  if(a==='copy')return copy(evLink(e));
  if(a==='toggle'){try{await AAPI.call('/admin/events/'+e.id,{method:'PATCH',body:{regOpen:!e.regOpen}});toast(e.regOpen?'Registration closed':'Registration open');await loadEvents();renderEvents()}catch(err){toast(err.message,true)}}
 });
}

/* resize the cover in the browser before upload: max 1600 px wide, WebP (JPEG on older Safari) */
async function prepImage(file){
 const bmp=await createImageBitmap(file);const k=Math.min(1,1600/bmp.width);const c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
 let url=c.toDataURL('image/webp',.84);if(!url.startsWith('data:image/webp'))url=c.toDataURL('image/jpeg',.85);
 return {type:url.slice(5,url.indexOf(';')),data:url.slice(url.indexOf(',')+1),preview:url};
}

function eventForm(e){
 const isNew=!e;e=e||{tz:'Asia/Kolkata',mode:'offline',regMode:'form',regOpen:true,published:true,currency:'AED',maxSeats:1,paid:false};
 const r=(n,v,cur,label)=>`<label class="radio"><input type="radio" name="${n}" value="${v}" ${cur===v?'checked':''}><span>${label}</span></label>`;
 modal(`<h2>${isNew?'New event':'Edit event'}</h2><form class="mform evform">
 <div class="field"><label for="ef-title">Event name *</label><input id="ef-title" maxlength="120" required value="${esc(e.title||'')}"></div>
 <div class="field"><label for="ef-sum">Short summary <small>(one line on the event card)</small></label><input id="ef-sum" maxlength="240" value="${esc(e.summary||'')}"></div>
 <div class="field"><label for="ef-det">Event details *</label><textarea id="ef-det" rows="7" maxlength="6000" required>${esc(e.details||'')}</textarea><small class="small">What will happen, who it's for, speakers, what to bring. Leave an empty line between paragraphs. Web links become clickable.</small></div>
 <div class="field"><label>Cover photo</label><div class="evcover"><div class="evcprev">${e.cover?`<img src="/api/img/${e.cover}" alt="">`:'<span>No cover yet</span>'}</div><div><input type="file" id="ef-cover" accept="image/jpeg,image/png,image/webp"><small class="small">Best size: 1600 × 900 (16:9). It is also used when the event link is shared on WhatsApp or social media.</small>${e.cover?'<button type="button" class="linkbtn rmcover">Remove cover</button>':''}</div></div></div>
 <fieldset class="qset"><legend>Date and time *</legend><div class="f3"><div class="field"><label for="ef-start">Starts</label><input type="datetime-local" id="ef-start" required value="${esc(e.start||'')}"></div><div class="field"><label for="ef-end">Ends <small>(optional)</small></label><input type="datetime-local" id="ef-end" value="${esc(e.end||'')}"></div><div class="field"><label for="ef-tz">Time zone</label><select id="ef-tz">${EV_TZ.map(([v,t])=>`<option value="${v}" ${e.tz===v?'selected':''}>${t}</option>`).join('')}</select></div></div></fieldset>
 <fieldset class="qset"><legend>Where</legend><div class="rrow">${r('mode','offline',e.mode,'Offline (at a place)')}${r('mode','online',e.mode,'Online')}</div>
  <div class="m-off"><div class="field"><label for="ef-loc">Location *</label><input id="ef-loc" maxlength="160" value="${esc(e.locationName||'')}" placeholder="e.g. Aqlyon Career Discovery Centre, Koyilandy"></div><div class="field"><label for="ef-map">Google Maps link</label><input id="ef-map" maxlength="600" value="${esc(e.mapUrl||'')}" placeholder="https://maps.app.goo.gl/…"><small class="small">In Google Maps: find the place → Share → Copy link.</small></div></div>
  <div class="m-on"><div class="field"><label for="ef-on">Online meeting link</label><input id="ef-on" maxlength="600" value="${esc(e.onlineUrl||'')}" placeholder="https://meet.google.com/… or https://zoom.us/j/…"><small class="small">Kept private: free events show it after registering; paid events get it only after you approve them.</small></div></div></fieldset>
 <fieldset class="qset"><legend>Price</legend><div class="rrow">${r('paid','free',e.paid?'paid':'free','Free')}${r('paid','paid',e.paid?'paid':'free','Paid')}</div>
  <div class="m-paid"><div class="f3"><div class="field"><label for="ef-price">Price per person *</label><input id="ef-price" type="number" min="0" step="0.01" value="${e.price||''}"></div><div class="field"><label for="ef-cur">Currency</label><select id="ef-cur">${EV_CUR.map(c=>`<option ${e.currency===c?'selected':''}>${c}</option>`).join('')}</select></div></div><p class="small">Visitors register, then send their details to you on WhatsApp (${esc(EVSET.whatsapp)}) for payment. You approve them under <b>Registrations</b>.</p></div></fieldset>
 <fieldset class="qset"><legend>Registration</legend><div class="rrow">${r('regMode','form',e.regMode,'Our registration form')}${r('regMode','link',e.regMode,'External link')}${r('regMode','none',e.regMode,'No registration')}</div>
  <div class="m-form"><div class="f3"><div class="field"><label for="ef-cap">Total seats <small>(0 = no limit)</small></label><input id="ef-cap" type="number" min="0" value="${e.capacity||0}"></div><div class="field"><label for="ef-max">Seats one person can book</label><input id="ef-max" type="number" min="1" max="20" value="${e.maxSeats||1}"></div></div>
   <div class="field"><label for="ef-sheet">Google Sheet for this event <small>(optional)</small></label><div class="inrow"><input id="ef-sheet" maxlength="600" value="${esc(e.sheetUrl||'')}" placeholder="${EVSET.sheetUrl?'Uses the sheet from Event settings':'https://script.google.com/macros/s/…/exec'}">${isNew?'':'<button type="button" class="btn ghost sm testsheet">Test</button>'}</div><small class="small"><button type="button" class="linkbtn sheethelp">How to connect a Google Sheet</button></small></div></div>
  <div class="m-link"><div class="field"><label for="ef-link">Registration link *</label><input id="ef-link" maxlength="600" value="${esc(e.regLink||'')}" placeholder="https://forms.gle/…"></div></div>
  <label class="ck"><input type="checkbox" id="ef-open" ${e.regOpen?'checked':''}><span><b>Registration is open</b>: the Register button shows until you untick this.</span></label></fieldset>
 <label class="ck"><input type="checkbox" id="ef-pub" ${e.published?'checked':''}><span><b>Show on the website</b>: untick to keep it as a hidden draft.</span></label>
 <p class="formerr" role="alert"></p>
 <div class="mrow">${isNew?'':'<button type="button" class="btn danger delev" style="margin-right:auto">Delete</button>'}<button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">${isNew?'Create event':'Save changes'}</button></div></form>`,(m,close)=>{
  m.querySelector('.modal').classList.add('wide');
  let cover=e.cover||'';
  const sync=()=>{const v=n=>(m.querySelector(`input[name=${n}]:checked`)||{}).value;
   $('.m-off',m).hidden=v('mode')!=='offline';$('.m-on',m).hidden=v('mode')!=='online';$('.m-paid',m).hidden=v('paid')!=='paid';$('.m-form',m).hidden=v('regMode')!=='form';$('.m-link',m).hidden=v('regMode')!=='link'};
  $$('input[type=radio]',m).forEach(x=>x.onchange=sync);sync();
  $('#ef-cover',m).onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const pv=$('.evcprev',m);pv.innerHTML='<span>Uploading…</span>';
   try{const img=await prepImage(f);const d=await AAPI.call('/admin/upload',{method:'POST',body:{type:img.type,data:img.data}});cover=d.id;pv.innerHTML=`<img src="${img.preview}" alt="">`}catch(err){pv.innerHTML='<span>Upload failed</span>';toast(err.message,true)}};
  const rc=$('.rmcover',m);if(rc)rc.onclick=()=>{cover='';$('.evcprev',m).innerHTML='<span>No cover</span>'};
  $$('.sheethelp',m).forEach(b=>b.onclick=sheetHelp);
  const ts=$('.testsheet',m);if(ts)ts.onclick=async()=>{try{if($('#ef-sheet',m).value!==(e.sheetUrl||''))await AAPI.call('/admin/events/'+e.id,{method:'PATCH',body:{sheetUrl:$('#ef-sheet',m).value}});await AAPI.call('/admin/events/'+e.id+'/test-sheet',{method:'POST'});toast('Test row sent. Check your Google Sheet.')}catch(err){toast(err.message,true)}};
  const del=$('.delev',m);if(del)del.onclick=async()=>{close();if(!await confirmBox('Delete event?',`<b>${esc(e.title)}</b> and all its registrations will be deleted. This cannot be undone.`,'Delete event',true))return;await AAPI.call('/admin/events/'+e.id,{method:'DELETE'});toast('Event deleted');await loadEvents();renderEvents()};
  $('form',m).onsubmit=async ev=>{ev.preventDefault();const v=n=>(m.querySelector(`input[name=${n}]:checked`)||{}).value;const btn=$('button[type=submit]',m);btn.disabled=true;
   const body={title:$('#ef-title',m).value,summary:$('#ef-sum',m).value,details:$('#ef-det',m).value,cover,start:$('#ef-start',m).value,end:$('#ef-end',m).value,tz:$('#ef-tz',m).value,mode:v('mode'),locationName:$('#ef-loc',m).value,mapUrl:$('#ef-map',m).value,onlineUrl:$('#ef-on',m).value,paid:v('paid')==='paid',price:$('#ef-price',m).value,currency:$('#ef-cur',m).value,regMode:v('regMode'),capacity:$('#ef-cap',m).value,maxSeats:$('#ef-max',m).value,sheetUrl:$('#ef-sheet',m).value,regLink:$('#ef-link',m).value,regOpen:$('#ef-open',m).checked,published:$('#ef-pub',m).checked};
   try{await AAPI.call(isNew?'/admin/events':'/admin/events/'+e.id,{method:isNew?'POST':'PATCH',body});close();toast(isNew?'Event created':'Event saved');await loadEvents();renderEvents()}catch(err){$('.formerr',m).textContent=err.message;btn.disabled=false}};
 });
}

function sheetHelp(){
 const code=`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);
  var cols = ['registeredAt','event','eventDate','ref','name','email','phone','country','seats','paid','status','note'];
  if (sheet.getLastRow() === 0) sheet.appendRow(cols);
  sheet.appendRow(cols.map(function (c) { return d[c] === undefined ? '' : d[c]; }));
  return ContentService.createTextOutput('ok');
}`;
 modal(`<h2>Connect a Google Sheet</h2><p>Every new registration is added as a row in your sheet automatically.</p>
 <ol class="steps2"><li>Create a new Google Sheet (sheets.new) and give it a name, like <b>Event registrations</b>.</li>
 <li>In the sheet, click <b>Extensions → Apps Script</b>.</li>
 <li>Delete what is there and paste this code, then press <b>Save</b>:<pre class="creds">${esc(code)}</pre><button type="button" class="btn ghost sm cpcode">Copy code</button></li>
 <li>Click <b>Deploy → New deployment</b>. Choose type <b>Web app</b>. Set <b>Execute as: Me</b> and <b>Who has access: Anyone</b>. Click <b>Deploy</b> and allow access when Google asks.</li>
 <li>Copy the <b>Web app URL</b> (it starts with https://script.google.com/macros/s/ and ends with /exec) and paste it in <b>Event settings</b> (for all events) or in one event's form.</li>
 <li>Open the event and press <b>Test</b>: a test row appears in the sheet.</li></ol>
 <p class="small">Registrations are always saved here in the admin panel too, so nothing is lost if the sheet is not connected.</p><div class="mrow"><button type="button" class="btn" data-close>Done</button></div>`,(m)=>{$('.cpcode',m).onclick=()=>copy(code)});
}

async function regsView(e){
 let regs=[];try{regs=(await AAPI.call(`/admin/events/${e.id}/regs`)).regs}catch(err){return toast(err.message,true)}
 const ST={pending:['Waiting for approval','warn'],approved:['Approved','ok'],confirmed:['Confirmed','ok'],rejected:['Rejected','no'],cancelled:['Cancelled','muted']};
 const where=e.mode==='online'?(e.onlineUrl?`Join online: ${e.onlineUrl}`:'We will send the online joining link before the event.'):`Venue: ${e.locationName}${e.mapUrl?' · Map: '+e.mapUrl:''}`;
 const confirmMsg=r=>`Hello ${r.name.split(' ')[0]}, your registration for "${e.title}" is confirmed. ✅\nRef: ${r.ref} · Seats: ${r.seats}\nWhen: ${evDate(e)}\n${where}\nEvent page: ${evLink(e)}\n– Aqlyon Career Discovery Centre`;
 const csv=()=>{const cols=['ref','name','email','phone','country','seats','status','note','at'];const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const t=[cols.join(','),...regs.map(r=>cols.map(c=>q(r[c])).join(','))].join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+t],{type:'text/csv'}));a.download=`${e.slug}-registrations.csv`;a.click()};
 const html=()=>`<h2>Registrations</h2><p class="small"><b>${esc(e.title)}</b> · ${esc(evDate(e))} · ${regs.length} registration${regs.length===1?'':'s'} · ${regs.filter(r=>!['rejected','cancelled'].includes(r.status)).reduce((t,r)=>t+r.seats,0)} seats${e.capacity?' of '+e.capacity:''}</p>
 ${regs.length?`<div class="regtbl">${regs.slice().reverse().map(r=>{const [sl,sc]=ST[r.status]||[r.status,''];return `<div class="regrow"><div><b>${esc(r.name)}</b> <span class="chipx ${sc}">${sl}</span><small>${esc(r.ref)} · ${r.seats} seat${r.seats>1?'s':''} · ${new Date(r.at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</small><small><a href="${waLink(r.phone,'')}" target="_blank" rel="noopener">${esc(r.phone)}</a> · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a>${r.note?' · “'+esc(r.note)+'”':''}</small></div>
  <div class="regact">${r.status==='pending'?`<button type="button" class="btn sm" data-r="approved" data-id="${r.id}">Approve</button><button type="button" class="btn sm ghost" data-r="rejected" data-id="${r.id}">Reject</button>`:''}${['approved','confirmed'].includes(r.status)?`<a class="btn sm ghost" target="_blank" rel="noopener" href="${waLink(r.phone,confirmMsg(r))}">Send details on WhatsApp</a><button type="button" class="btn sm ghost" data-r="cancelled" data-id="${r.id}">Cancel</button>`:''}${['rejected','cancelled'].includes(r.status)?`<button type="button" class="btn sm ghost" data-r="${e.paid?'pending':'confirmed'}" data-id="${r.id}">Restore</button>`:''}</div></div>`}).join('')}</div>`:'<p class="empty">No registrations yet.</p>'}
 <div class="mrow">${regs.length?'<button type="button" class="btn ghost csv" style="margin-right:auto">Download CSV (Excel)</button>':''}<button type="button" class="btn" data-close>Close</button></div>`;
 modal(html(),(m)=>{m.querySelector('.modal').classList.add('wide');
  const bind=()=>{const c=$('.csv',m);if(c)c.onclick=csv;
   $$('[data-r]',m).forEach(b=>b.onclick=async()=>{const st=b.dataset.r;try{const d=await AAPI.call(`/admin/events/${e.id}/regs/${b.dataset.id}`,{method:'PATCH',body:{status:st}});regs=regs.map(x=>x.id===d.reg.id?d.reg:x);
     $('.modal',m).innerHTML=html();bind();toast(st==='approved'?'Approved. Now send the joining details on WhatsApp.':'Updated');
     if(st==='approved'){e.onlineUrl=d.onlineUrl||e.onlineUrl;window.open(waLink(d.reg.phone,confirmMsg(d.reg)),'_blank','noopener')}
     loadEvents()}catch(err){toast(err.message,true)}})};
  bind()});
}
