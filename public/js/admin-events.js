/* =====================================================================
   Admin: Upcoming events (create, edit, open/close registration,
   registrations page with approvals over WhatsApp and Excel download)
   ===================================================================== */
const EV_TZ=[['Asia/Kolkata','India time (IST)'],['Asia/Dubai','UAE time (GST)'],['Asia/Riyadh','Saudi time (AST)'],['Asia/Qatar','Qatar time (AST)'],['Europe/London','UK time']];
const EV_CUR=['AED','INR','USD','SAR','QAR','OMR'];
let EVENTS=[],EVSET={whatsapp:'+919539244342'};
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
 <details class="evset"><summary><b>Event settings</b> · WhatsApp for approvals: ${esc(EVSET.whatsapp)}</summary>
  <form class="mform evsetform"><div class="field"><label for="es-wa">WhatsApp number for paid registrations</label><input id="es-wa" value="${esc(EVSET.whatsapp)}" inputmode="tel"><small class="small">Visitors who register for a paid event send their details to this number for payment and approval. Include the country code.</small></div>
  <p class="formerr"></p><button class="btn sm" type="submit">Save settings</button></form></details>
 <h2 class="evh">Upcoming</h2>${up.length?`<div class="evlist">${up.map(card).join('')}</div>`:`<div class="empty"><p>No upcoming events. Press <b>＋ New event</b> to add one. It appears on the website under <b>Upcoming events</b>.</p></div>`}
 ${past.length?`<h2 class="evh">Past</h2><div class="evlist past">${past.map(card).join('')}</div>`:''}`;
 $('#newev').onclick=()=>eventForm();
 $('.evsetform').onsubmit=async ev=>{ev.preventDefault();const f=ev.target;try{EVSET=await AAPI.call('/admin/events/settings',{method:'PATCH',body:{whatsapp:$('#es-wa').value}});toast('Settings saved');renderEvents()}catch(err){$('.formerr',f).textContent=err.message}};
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
   ${isNew?'':`<p class="small evregnote">${e.counts?`<b>${e.counts.total}</b> registration${e.counts.total===1?'':'s'} so far. `:''}<button type="button" class="linkbtn openregs">View registrations and download Excel</button></p>`}</div>
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
  const orr=$('.openregs',m);if(orr)orr.onclick=()=>{close();regsView(e)};
  const del=$('.delev',m);if(del)del.onclick=async()=>{close();if(!await confirmBox('Delete event?',`<b>${esc(e.title)}</b> and all its registrations will be deleted. This cannot be undone.`,'Delete event',true))return;await AAPI.call('/admin/events/'+e.id,{method:'DELETE'});toast('Event deleted');await loadEvents();renderEvents()};
  $('form',m).onsubmit=async ev=>{ev.preventDefault();const v=n=>(m.querySelector(`input[name=${n}]:checked`)||{}).value;const btn=$('button[type=submit]',m);btn.disabled=true;
   const body={title:$('#ef-title',m).value,summary:$('#ef-sum',m).value,details:$('#ef-det',m).value,cover,start:$('#ef-start',m).value,end:$('#ef-end',m).value,tz:$('#ef-tz',m).value,mode:v('mode'),locationName:$('#ef-loc',m).value,mapUrl:$('#ef-map',m).value,onlineUrl:$('#ef-on',m).value,paid:v('paid')==='paid',price:$('#ef-price',m).value,currency:$('#ef-cur',m).value,regMode:v('regMode'),capacity:$('#ef-cap',m).value,maxSeats:$('#ef-max',m).value,regLink:$('#ef-link',m).value,regOpen:$('#ef-open',m).checked,published:$('#ef-pub',m).checked};
   try{await AAPI.call(isNew?'/admin/events':'/admin/events/'+e.id,{method:isNew?'POST':'PATCH',body});close();toast(isNew?'Event created':'Event saved');await loadEvents();renderEvents()}catch(err){$('.formerr',m).textContent=err.message;btn.disabled=false}};
 });
}


/* ---------- Excel (.xlsx) download, built in the browser: a small zip (stored) with the sheet XML ---------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC_T[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function zipStore(files){
 const enc=new TextEncoder(),parts=[],cen=[];let off=0;
 const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 for(const [name,text] of files){const nm=enc.encode(name),d=enc.encode(text),c=crc32(d);
  const common=[...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0)];
  const loc=new Uint8Array([...u32(0x04034b50),...common]);parts.push(loc,nm,d);
  cen.push(new Uint8Array([...u32(0x02014b50),...u16(20),...common,...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
  off+=loc.length+nm.length+d.length}
 const cl=cen.reduce((t,x)=>t+x.length,0);
 return new Blob([...parts,...cen,new Uint8Array([...u32(0x06054b50),0,0,0,0,...u16(files.length),...u16(files.length),...u32(cl),...u32(off),0,0])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
/* rows: arrays of strings, numbers, or {d:Date}. title rows on top, then a bold header row with a filter */
function xlsxBlob(sheetName,titleRows,head,rows,widths){
 const x=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const col=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26}return s};
 const cell=(v,r,c,st)=>{const ref=col(c)+r;
  if(v&&v.d instanceof Date)return `<c r="${ref}" s="3"><v>${(v.d.getTime()-v.d.getTimezoneOffset()*60000)/86400000+25569}</v></c>`;
  if(typeof v==='number')return `<c r="${ref}"${st?` s="${st}"`:''}><v>${v}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${st?` s="${st}"`:''}><is><t xml:space="preserve">${x(v)}</t></is></c>`};
 let r=0;const out=[];
 titleRows.forEach((t,i)=>{r++;out.push(`<row r="${r}">${cell(t,r,0,i===0?2:0)}</row>`)});
 if(titleRows.length)r++;
 const hr=++r;out.push(`<row r="${hr}">${head.map((h,c)=>cell(h,hr,c,1)).join('')}</row>`);
 rows.forEach(row=>{r++;out.push(`<row r="${r}">${row.map((v,c)=>cell(v,r,c,0)).join('')}</row>`)});
 const last=col(head.length-1);
 const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${hr}" topLeftCell="A${hr+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${out.join('')}</sheetData>${rows.length?`<autoFilter ref="A${hr}:${last}${hr+rows.length}"/>`:''}</worksheet>`;
 const name=x(String(sheetName).replace(/[\[\]:*?\/\\]/g,' ').slice(0,31)||'Registrations');
 return zipStore([
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets>${rows.length?`<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${name.replace(/'/g,"''")}'!$A$${hr}:$${last}$${hr+rows.length}</definedName></definedNames>`:''}</workbook>`],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd mmm yyyy, hh:mm"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1A1E3A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
  ['xl/worksheets/sheet1.xml',sheet]]);
}

/* ---------- Registrations page for one event ---------- */
const REG_ST={pending:['Waiting for approval','warn'],approved:['Approved','ok'],confirmed:['Confirmed','ok'],rejected:['Rejected','no'],cancelled:['Cancelled','muted']};
const countryName=iso=>{const c=(typeof COUNTRIES!=='undefined'?COUNTRIES:[]).find(x=>x[0]===iso);return c?c[1]:(iso||'')};
const regTime=at=>new Date(at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});

async function regsView(e){
 const main=$('.adm');main.innerHTML='<p class="lead" style="margin-top:20px">Loading registrations…</p>';
 let regs=[];try{regs=(await AAPI.call(`/admin/events/${e.id}/regs`)).regs}catch(err){toast(err.message,true);return renderEvents()}
 let q='',fs='all';
 const live=r=>!['rejected','cancelled'].includes(r.status);
 const where=e.mode==='online'?(e.onlineUrl?`Join online: ${e.onlineUrl}`:'We will send the online joining link before the event.'):`Venue: ${e.locationName}${e.mapUrl?' · Map: '+e.mapUrl:''}`;
 const confirmMsg=r=>`Hello ${r.name.split(' ')[0]}, your registration for "${e.title}" is confirmed. ✅\nRef: ${r.ref} · Seats: ${r.seats}\nWhen: ${evDate(e)}\n${where}\nEvent page: ${evLink(e)}\n– Aqlyon Career Discovery Centre`;
 const ordered=()=>regs.slice().sort((a,b)=>a.at<b.at?-1:1); // oldest first, so # is the sign-up order
 const shown=()=>{const t=q.trim().toLowerCase();return ordered().map((r,i)=>({r,n:i+1})).filter(({r})=>(fs==='all'||(fs==='active'?live(r):r.status===fs))&&(!t||[r.name,r.email,r.phone,r.whatsapp,r.ref,countryName(r.country),r.education,r.role].join(' ').toLowerCase().includes(t)))};
 const download=()=>{
  const head=['#','Ref','Name','Email','Mobile','WhatsApp','Country','Education','Student / Parent','People','Status','Registered on'];const w=[5,11,24,30,17,17,16,12,15,8,20,20];
  if(e.paid){head.push('Amount');w.push(14)}
  const rows=ordered().map((r,i)=>{const row=[i+1,r.ref,r.name,r.email,r.phone,r.whatsapp||r.phone,countryName(r.country),r.education||'',r.role||'',r.seats,(REG_ST[r.status]||[r.status])[0],{d:new Date(r.at)}];if(e.paid)row.push(`${e.currency} ${e.price*r.seats}`);return row});
  const act=regs.filter(live);
  const titles=[e.title,`${evDate(e)} · ${e.mode==='online'?'Online':e.locationName||''}`,`${regs.length} registrations · ${act.reduce((t,r)=>t+r.seats,0)} people attending${e.capacity?' of '+e.capacity+' seats':''} · downloaded ${regTime(Date.now())}`];
  const a=document.createElement('a');a.href=URL.createObjectURL(xlsxBlob('Registrations',titles,head,rows,w));a.download=`${e.slug}-registrations.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Excel file downloaded')};
 const acts=r=>`${r.status==='pending'?`<button type="button" class="btn sm" data-r="approved" data-id="${r.id}">Approve</button><button type="button" class="btn sm ghost" data-r="rejected" data-id="${r.id}">Reject</button>`:''}${['approved','confirmed'].includes(r.status)?`<a class="btn sm ghost" target="_blank" rel="noopener" href="${waLink(r.whatsapp||r.phone,confirmMsg(r))}">Send details on WhatsApp</a><button type="button" class="btn sm ghost" data-r="cancelled" data-id="${r.id}">Cancel</button>`:''}${['rejected','cancelled'].includes(r.status)?`<button type="button" class="btn sm ghost" data-r="${e.paid?'pending':'confirmed'}" data-id="${r.id}">Restore</button>`:''}`;
 const table=()=>{const list=shown();
  if(!regs.length)return '<div class="empty"><p>No registrations yet. They appear here as soon as someone registers on the event page.</p></div>';
  if(!list.length)return '<div class="empty"><p>No registrations match your search.</p></div>';
  return `<div class="rtwrap"><table class="rtable"><thead><tr><th>#</th><th>Ref</th><th>Name</th><th>Email</th><th>Mobile</th><th>WhatsApp</th><th>Country</th><th>Education</th><th>Student / Parent</th><th>People</th><th>Status</th><th>Registered on</th><th>Actions</th></tr></thead><tbody>${list.map(({r,n})=>{const [sl,sc]=REG_ST[r.status]||[r.status,''];return `<tr class="${live(r)?'':'off'}"><td>${n}</td><td class="mono">${esc(r.ref)}</td><td><b>${esc(r.name)}</b></td><td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></td><td><a href="${waLink(r.whatsapp||r.phone,'')}" target="_blank" rel="noopener">${esc(r.whatsapp||r.phone)}</a></td><td>${esc(countryName(r.country))}</td><td>${esc(r.education||'')}</td><td>${esc(r.role||'')}</td><td class="num">${r.seats}</td><td><span class="chipx ${sc}">${sl}</span></td><td class="nowrap">${esc(regTime(r.at))}</td><td><div class="regact">${acts(r)}</div></td></tr>`}).join('')}</tbody></table></div>`};
 const stats=()=>{const act=regs.filter(live),ppl=act.reduce((t,r)=>t+r.seats,0),pend=regs.filter(r=>r.status==='pending').length,stu=act.filter(r=>r.role==='Student').length,par=act.filter(r=>r.role==='Parent').length;
  return `<div class="rstats"><div><b>${regs.length}</b><span>Registrations</span></div><div><b>${ppl}${e.capacity?`<small> / ${e.capacity}</small>`:''}</b><span>People attending</span></div>${e.paid?`<div class="${pend?'hot':''}"><b>${pend}</b><span>Waiting for approval</span></div>`:''}<div><b>${stu}</b><span>Students</span></div><div><b>${par}</b><span>Parents</span></div></div>`};
 const opts=[['all','All'],['active','Attending'],...(e.paid?[['pending','Waiting for approval'],['approved','Approved'],['rejected','Rejected']]:[['confirmed','Confirmed']]),['cancelled','Cancelled']];
 main.innerHTML=`<p class="rback"><button type="button" class="linkbtn backev">← All events</button></p>
  <div class="admhead rhead"><div><h1>Registrations</h1><p class="small"><b>${esc(e.title)}</b> · ${esc(evDate(e))}${e.mode==='offline'&&e.locationName?' · '+esc(e.locationName):e.mode==='online'?' · Online':''}</p></div>
  <div class="evbtns"><button type="button" class="btn xls" ${regs.length?'':'disabled'}>⬇ Download Excel</button><button type="button" class="btn ghost editev">Edit event</button></div></div>
  <div class="rstatwrap">${stats()}</div>
  <div class="rtools"><input type="search" class="rq" placeholder="Search name, email, mobile or ref" aria-label="Search registrations"><select class="rf" aria-label="Show">${opts.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div>
  <div class="rtbody">${table()}</div>`;
 const bind=()=>$$('[data-r]',main).forEach(b=>b.onclick=async()=>{const st=b.dataset.r;b.disabled=true;
  try{const d=await AAPI.call(`/admin/events/${e.id}/regs/${b.dataset.id}`,{method:'PATCH',body:{status:st}});regs=regs.map(x=>x.id===d.reg.id?d.reg:x);
   toast(st==='approved'?'Approved. Now send the joining details on WhatsApp.':'Updated');
   if(st==='approved'){e.onlineUrl=d.onlineUrl||e.onlineUrl;window.open(waLink(d.reg.whatsapp||d.reg.phone,confirmMsg(d.reg)),'_blank','noopener')}
   draw();loadEvents()}catch(err){b.disabled=false;toast(err.message,true)}});
 const draw=()=>{$('.rtbody',main).innerHTML=table();$('.rstatwrap',main).innerHTML=stats();bind()};
 $('.rq',main).oninput=ev=>{q=ev.target.value;draw()};
 $('.rf',main).onchange=ev=>{fs=ev.target.value;draw()};
 $('.xls',main).onclick=download;
 $('.backev',main).onclick=async()=>{await loadEvents();renderEvents();scrollTo(0,0)};
 $('.editev',main).onclick=()=>eventForm(EVENTS.find(x=>x.id===e.id)||e);
 bind();scrollTo(0,0);
}
