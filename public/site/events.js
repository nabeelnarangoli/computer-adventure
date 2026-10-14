/* Aqlyon Career Discovery Centre — Upcoming events
   1. On the home page: fills the "Upcoming events" section.
   2. On /events/<slug>: the event page with registration, calendar and sharing. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const local=s=>new Date(s+':00');   // event's own wall-clock time, formatted as is
const fmtDay=e=>local(e.start).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const fmtTime=s=>local(s).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true}).replace(' ','\u202F');
const timeLine=e=>`${fmtTime(e.start)}${e.end?' – '+fmtTime(e.end):''} ${e.tzLabel}`;
const yourTime=e=>{try{const d=new Date(e.startUTC);const mine=d.toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true});const theirs=local(e.start).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true});return mine!==theirs?mine:''}catch(x){return ''}};
const price=e=>e.paid?`${e.currency} ${Number(e.price).toLocaleString('en-GB')}`:'Free';
const STATE={open:'Registration open',closed:'Registration closed',full:'Fully booked',ended:'This event has ended',none:''};
const ICON={cal:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
 pin:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
 web:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
 tag:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
 share:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>'};
const badge=e=>{const d=local(e.start);return `<span class="evdate"><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-GB',{month:'short'})}</small></span>`};

/* ---------- home page section ---------- */
const sec=$('#events');
if(sec){
 const card=e=>`<a class="evc ${e.state}" href="/events/${esc(e.slug)}">
  <div class="evimg">${e.cover?`<img src="${esc(e.cover)}" alt="" loading="lazy">`:'<span class="evph"></span>'}${badge(e)}</div>
  <div class="evtxt"><div class="evtags"><span>${e.mode==='online'?'Online':'Offline'}</span><span class="${e.paid?'':'free'}">${esc(price(e))}</span>${e.state!=='open'&&e.state!=='none'?`<span class="st">${STATE[e.state]}</span>`:''}</div>
  <h3>${esc(e.title)}</h3><p class="when">${esc(local(e.start).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}))} · ${esc(timeLine(e))}</p>
  ${e.mode==='offline'&&e.locationName?`<p class="where">${esc(e.locationName)}</p>`:''}${e.summary?`<p class="sum">${esc(e.summary)}</p>`:''}
  <span class="evgo">${e.state==='open'?(e.regMode==='link'?'Details & register':'View & register'):'View details'} →</span></div></a>`;
 fetch('/api/events').then(r=>r.json()).then(d=>{
  const g=$('.evgrid',sec);g.innerHTML=(d.upcoming||[]).map(card).join('');
  $('.evnone',sec).hidden=!!(d.upcoming||[]).length;
  if((d.past||[]).length){const p=$('.evpast',sec);p.hidden=false;$('.evgrid',p).innerHTML=d.past.map(card).join('')}
 }).catch(()=>{$('.evgrid',sec).innerHTML='';$('.evnone',sec).hidden=false});
}

/* ---------- event page ---------- */
const root=$('#ev');const E=window.EVENT;
if(!root||!E)return;
const url=location.origin+'/events/'+E.slug;
const linkify=t=>esc(t).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
const paras=t=>String(t||'').trim().split(/\n\s*\n/).map(p=>`<p>${linkify(p).replace(/\n/g,'<br>')}</p>`).join('');
const z=n=>String(n).padStart(2,'0');
const gdate=ms=>{const d=new Date(ms);return `${d.getUTCFullYear()}${z(d.getUTCMonth()+1)}${z(d.getUTCDate())}T${z(d.getUTCHours())}${z(d.getUTCMinutes())}00Z`};
const endMs=E.endUTC||E.startUTC+2*3600e3;
const where=E.mode==='online'?'Online':E.locationName;
const gcal=(x='')=>`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(E.title)}&dates=${gdate(E.startUTC)}/${gdate(endMs)}&details=${encodeURIComponent((E.summary||'')+'\n\n'+url+(x?'\n'+x:''))}&location=${encodeURIComponent(where)}`;
const ics=(extra='')=>{const t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aqlyon//Events//EN','BEGIN:VEVENT',`UID:${E.slug}@aqlyon`,`DTSTAMP:${gdate(Date.now())}`,`DTSTART:${gdate(E.startUTC)}`,`DTEND:${gdate(endMs)}`,`SUMMARY:${E.title.replace(/[,;]/g,'\\$&')}`,`DESCRIPTION:${((E.summary||'')+' '+url+(extra?' '+extra:'')).replace(/[,;]/g,'\\$&')}`,`LOCATION:${where.replace(/[,;]/g,'\\$&')}`,`URL:${url}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/calendar'}));a.download=E.slug+'.ics';a.click()};
const yt=yourTime(E);
const regBtn=()=>{
 if(E.state==='open'&&E.regMode==='form')return `<button type="button" class="btn solid lg" id="regbtn">Register${E.paid?' · '+esc(price(E)):' free'}</button>`;
 if(E.state==='open'&&E.regMode==='link')return `<a class="btn solid lg" href="${esc(E.regLink)}" target="_blank" rel="noopener">Register →</a>`;
 if(E.state==='none')return '';
 return `<span class="evstate">${STATE[E.state]}</span>`};
root.innerHTML=`<article class="evdetail">
 <div class="evhero">${E.cover?`<img src="${esc(E.cover)}" alt="">`:'<span class="evph big"></span>'}</div>
 <div class="evgridd"><div class="evmain">
  <div class="evtags"><span>${E.mode==='online'?'Online event':'In person'}</span><span class="${E.paid?'':'free'}">${esc(price(E))}</span>${E.state==='open'&&E.seatsLeft!==null&&E.seatsLeft<=15?`<span class="st">Only ${E.seatsLeft} seat${E.seatsLeft===1?'':'s'} left</span>`:''}</div>
  <h1>${esc(E.title)}</h1>${E.summary?`<p class="lead">${esc(E.summary)}</p>`:''}
  <div class="evbody">${paras(E.details)}</div>
 </div>
 <aside class="evside"><div class="evbox">
  <p class="row">${ICON.cal}<span><b>${esc(fmtDay(E))}</b>${esc(timeLine(E))}${yt?`<small>Your time: ${esc(yt)}</small>`:''}</span></p>
  <p class="row">${E.mode==='online'?ICON.web:ICON.pin}<span>${E.mode==='online'?'<b>Online</b>The joining link is shared after you register.':`<b>${esc(E.locationName)}</b>${E.mapUrl?`<a href="${esc(E.mapUrl)}" target="_blank" rel="noopener">Open in Google Maps ↗</a>`:''}`}</span></p>
  <p class="row">${ICON.tag}<span><b>${esc(price(E))}</b>${E.paid?'per person · pay after you register':'No payment needed'}</span></p>
  <div class="evcta">${regBtn()}</div>
  <div class="evmini"><a class="lnk" href="${gcal()}" target="_blank" rel="noopener">Add to Google Calendar</a><button type="button" class="lnk" id="icsb">Download calendar file</button></div>
 </div>
 <div class="evbox share"><b>${ICON.share} Share this event</b><div class="shbtns">
  <button type="button" class="shb" data-s="copy">Copy link</button>
  <a class="shb wa" href="https://wa.me/?text=${encodeURIComponent(E.title+' · '+fmtDay(E)+'\n'+url)}" target="_blank" rel="noopener">WhatsApp</a>
  <a class="shb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
  <a class="shb" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener">LinkedIn</a>
  <a class="shb" href="https://x.com/intent/post?text=${encodeURIComponent(E.title)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener">X</a>
  ${navigator.share?'<button type="button" class="shb" data-s="native">More…</button>':''}</div></div>
 </aside></div></article>`;
const toast=m=>{const t=document.createElement('div');t.className='evtoast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)};
$('#icsb').onclick=()=>ics();
$$('[data-s]').forEach(b=>b.onclick=async()=>{if(b.dataset.s==='copy'){try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(e){prompt('Copy this link',url)}}else{try{await navigator.share({title:E.title,text:E.summary||E.title,url})}catch(e){}}});

/* ---------- registration ---------- */
const rb=$('#regbtn');if(!rb)return;
const guess=typeof guessCountry==='function'?guessCountry():'AE';
const cOpts=sel=>COUNTRIES.map(c=>`<option value="${c[0]}" ${c[0]===sel?'selected':''}>${c[1]}</option>`).join('');
const ccOpts=sel=>COUNTRIES.map(c=>`<option value="${c[0]}" ${c[0]===sel?'selected':''}>${flagOf(c[0])} +${c[2]} · ${c[1]}</option>`).join('');
rb.onclick=()=>{
 const m=document.createElement('div');m.className='evmodal';m.innerHTML=`<div class="evdlg" role="dialog" aria-modal="true" aria-labelledby="rgh"><button type="button" class="x" aria-label="Close">×</button>
 <h2 id="rgh">Register</h2><p class="small">${esc(E.title)} · ${esc(local(E.start).toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}, ${esc(timeLine(E))}</p>
 <form class="rgf" novalidate>
  <label>Full name<input name="name" required maxlength="80" autocomplete="name"></label>
  <label>Email<input name="email" type="email" required maxlength="80" autocomplete="email"></label>
  <label>Country<select name="country" autocomplete="country">${cOpts(guess)}</select></label>
  <label>Mobile number (WhatsApp)<span class="tel"><select name="cc" aria-label="Country code">${ccOpts(guess)}</select><input name="mob" type="tel" inputmode="tel" required maxlength="18" autocomplete="tel-national"></span></label>
  ${E.maxSeats>1?`<label>Number of people<select name="seats">${Array.from({length:Math.min(E.maxSeats,E.seatsLeft??E.maxSeats)},(_,i)=>`<option>${i+1}</option>`).join('')}</select></label>`:''}
  <label>Anything we should know? <small>(optional)</small><textarea name="note" rows="2" maxlength="500"></textarea></label>
  <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
  ${E.paid?`<p class="small paidnote">After you register, you'll send your details to us on WhatsApp to pay <b>${esc(price(E))}</b> per person. Your seat is confirmed once payment is approved.</p>`:''}
  <p class="err" role="alert"></p>
  <button class="btn solid lg" type="submit">${E.paid?'Register and continue to payment':'Register'}</button>
 </form></div>`;
 document.body.appendChild(m);document.body.style.overflow='hidden';
 const close=()=>{m.remove();document.body.style.overflow=''};
 $('.x',m).onclick=close;m.addEventListener('click',e=>{if(e.target===m)close()});document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k)}});
 const f=$('form',m);let ccT=false;f.country.onchange=()=>{if(!ccT)f.cc.value=f.country.value};f.cc.onchange=()=>ccT=true;f.name.focus();
 f.onsubmit=async ev=>{ev.preventDefault();const err=$('.err',m);err.textContent='';
  const email=f.email.value.trim(),mob=f.mob.value.replace(/[\s\-().]/g,'').replace(/^0+/,''),dial=(COUNTRIES.find(c=>c[0]===f.cc.value)||[])[2];
  if(!f.name.value.trim())return err.textContent='Please enter your name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return err.textContent='Please enter a valid email address.';
  if(!/^\d{6,14}$/.test(mob))return err.textContent='Please enter a valid mobile number (without the country code).';
  const b=$('button[type=submit]',f);b.disabled=true;b.textContent='Registering…';
  const body={name:f.name.value.trim(),email,country:f.country.value,phone:'+'+dial+' '+mob,seats:f.seats?f.seats.value:1,note:f.note.value,website:f.website.value};
  let d;try{const r=await fetch(`/api/events/${E.slug}/register`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});d=await r.json();if(!r.ok)throw new Error(d.error||'Something went wrong. Please try again.')}
  catch(x){err.textContent=x.message;b.disabled=false;b.textContent=E.paid?'Register and continue to payment':'Register';return}
  const dlg=$('.evdlg',m);
  if(d.status==='pending'){
   const msg=`Hello Aqlyon, I registered for "${E.title}" (${fmtDay(E)}, ${timeLine(E)}).\nRef: ${d.ref}\nName: ${body.name}\nMobile: ${body.phone}\nEmail: ${body.email}\nPeople: ${d.seats}\nAmount: ${d.currency} ${d.total}\nPlease send me the payment details.`;
   const wa=`https://wa.me/${String(d.whatsapp).replace(/[^\d]/g,'')}?text=${encodeURIComponent(msg)}`;
   dlg.innerHTML=`<button type="button" class="x" aria-label="Close">×</button><div class="done"><span class="ok">1/2</span><h2>One more step: payment</h2><p>Your place is reserved. Send your details to us on WhatsApp and we'll share how to pay <b>${esc(d.currency+' '+d.total)}</b>. Your seat is confirmed once payment is approved.</p><p class="ref">Your reference: <b>${esc(d.ref)}</b></p><a class="btn solid lg wa" href="${wa}" target="_blank" rel="noopener">Send on WhatsApp</a><p class="small">WhatsApp didn't open? Message <b>${esc(d.whatsapp)}</b> with your reference.</p></div>`;
   window.open(wa,'_blank','noopener');
  }else{
   dlg.innerHTML=`<button type="button" class="x" aria-label="Close">×</button><div class="done"><span class="ok">✓</span><h2>You're registered!</h2><p>See you at <b>${esc(E.title)}</b>, ${esc(fmtDay(E))}, ${esc(timeLine(E))}.</p><p class="ref">Your reference: <b>${esc(d.ref)}</b></p>
    ${d.onlineUrl?`<p class="join">Joining link: <a href="${esc(d.onlineUrl)}" target="_blank" rel="noopener">${esc(d.onlineUrl)}</a><br><small>Save it now. It's also added to your calendar file.</small></p>`:E.mode==='online'?'<p>We\'ll send you the joining link before the event.</p>':E.mapUrl?`<p><a href="${esc(E.mapUrl)}" target="_blank" rel="noopener">Directions to ${esc(E.locationName)} ↗</a></p>`:''}
    <div class="row2"><a class="btn line" href="${gcal(d.onlineUrl?'Join: '+d.onlineUrl:'')}" target="_blank" rel="noopener">Add to Google Calendar</a><button type="button" class="btn line icsd">Calendar file</button></div>
    <p class="small">Tell a friend: <a href="https://wa.me/?text=${encodeURIComponent('I just registered for '+E.title+'. Join me: '+url)}" target="_blank" rel="noopener">share on WhatsApp</a></p></div>`;
   $('.icsd',dlg).onclick=()=>ics(d.onlineUrl?'Join: '+d.onlineUrl:'');
  }
  $('.x',dlg).onclick=close;
 };
};
})();
