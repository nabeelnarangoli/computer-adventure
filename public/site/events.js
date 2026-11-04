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
/* live stream & gallery helpers */
const PLATFORM={youtube:'YouTube',facebook:'Facebook',instagram:'Instagram',tiktok:'TikTok',vimeo:'Vimeo',drive:'Google Drive',file:'',link:''};
// the live status changes with the clock: recompute it in the browser unless the admin forced it
const liveNow=L=>!L?'':L.forced?L.status:Date.now()<L.startUTC?'scheduled':Date.now()<=L.endUTC?'live':'ended';
// Video from any site (shape from videoInfo on the server: p, name, embed | file, thumb, ratio).
// A still/poster first; the real player loads on click (fast pages, nothing from the video site until play).
// browsers only start a video by itself when it is muted: the live player starts muted, a clicked video with sound
const autoplay=(v,mute)=>v.p==='youtube'?'&autoplay=1'+(mute?'&mute=1':''):v.p==='vimeo'?'?autoplay=1'+(mute?'&muted=1':''):'';
const vidFrame=(v,auto,mute)=>v.file?`<div class="vwrap r-wide"><video src="${esc(v.file)}" controls playsinline preload="metadata"${auto?' autoplay':''}${mute?' muted':''}></video></div>`
 :`<div class="vwrap r-${esc(v.ratio||'wide')}"><iframe src="${esc(v.embed+(auto?autoplay(v,mute):''))}" title="${esc(v.name)} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" scrolling="no"></iframe></div>`;
const vidLite=(v,label,big)=>{
 if(!v.embed&&!v.file)return `<a class="vlink" href="${esc(v.url)}" target="_blank" rel="noopener"><span class="vlplay" aria-hidden="true"></span><b>Watch on ${esc(v.name)} ↗</b></a>`;
 if(v.file)return vidFrame(v,false);
 return `<button type="button" class="vlite r-${esc(v.ratio||'wide')}${big?' big':''}${v.thumb?'':' noimg p-'+esc(v.p)}" data-v='${esc(JSON.stringify({p:v.p,name:v.name,embed:v.embed,ratio:v.ratio}))}' aria-label="Play ${esc(v.name)} video${label?': '+esc(label):''}">${v.thumb?`<img src="${esc(v.thumb)}" alt="" loading="lazy">`:`<span class="vsite">${esc(v.name)}</span>`}<span class="vplay" aria-hidden="true"></span></button>`};
document.addEventListener('click',ev=>{const b=ev.target.closest('.vlite');if(!b)return;try{b.outerHTML=vidFrame(JSON.parse(b.dataset.v),true)}catch(e){}});
const badge=e=>{const d=local(e.start);return `<span class="evdate"><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-GB',{month:'short'})}</small></span>`};

/* ---------- home page section ---------- */
const sec=$('#events');
if(sec){
 const card=e=>`<a class="evc ${e.state}" href="/events/${esc(e.slug)}">
  <div class="evimg">${e.cover?`<img src="${esc(e.cover)}" alt="" loading="lazy">`:'<span class="evph"></span>'}${badge(e)}${liveNow(e.live)==='live'?'<span class="evlive"><i></i>LIVE</span>':''}</div>
  <div class="evtxt"><div class="evtags"><span>${e.mode==='online'?'Online':'Offline'}</span><span class="${e.paid?'':'free'}">${esc(price(e))}</span>${e.state!=='open'&&e.state!=='none'?`<span class="st">${STATE[e.state]}</span>`:''}${liveNow(e.live)==='scheduled'?'<span class="lvtag">Live stream</span>':liveNow(e.live)==='live'?'<span class="lvtag on">● Live now</span>':''}${(e.media||[]).length?'<span>Photos &amp; videos</span>':''}</div>
  <h3>${esc(e.title)}</h3><p class="when">${esc(local(e.start).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}))} · ${esc(timeLine(e))}</p>
  ${e.mode==='offline'&&e.locationName?`<p class="where">${esc(e.locationName)}</p>`:''}${e.summary?`<p class="sum">${esc(e.summary)}</p>`:''}
  <span class="evgo">${liveNow(e.live)==='live'?'Watch live':e.state==='open'?(e.regMode==='link'?'Details & register':'View & register'):(e.media||[]).length?'See photos & videos':'View details'} →</span></div></a>`;
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
const ics=(extra='')=>{const t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aqlyon//Events//EN','BEGIN:VEVENT',`UID:${E.slug}@aqlyon`,`DTSTAMP:${gdate(Date.now())}`,`DTSTART:${gdate(E.startUTC)}`,`DTEND:${gdate(endMs)}`,`SUMMARY:${E.title.replace(/[,;]/g,'\\$&')}`,`DESCRIPTION:${((E.summary||'')+' '+url+(extra?' '+extra:'')).replace(/[,;]/g,'\\$&')}`,`LOCATION:${where.replace(/[,;]/g,'\\$&')}`,`URL:${url}`,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Tomorrow: '+E.title.replace(/[,;]/g,'\\$&'),'TRIGGER:-P1D','END:VALARM','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Starts in 1 hour: '+E.title.replace(/[,;]/g,'\\$&'),'TRIGGER:-PT1H','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
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
  <div class="evtags"><span>${E.mode==='online'?'Online event':'In person'}</span><span class="${E.paid?'':'free'}">${esc(price(E))}</span>${E.state==='open'&&E.seatsLeft!==null&&E.seatsLeft<=15?`<span class="st">Only ${E.seatsLeft} seat${E.seatsLeft===1?'':'s'} left</span>`:''}<span class="lvtagslot"></span></div>
  <h1>${esc(E.title)}</h1>${E.summary?`<p class="lead">${esc(E.summary)}</p>`:''}
  <div class="toprow">${regBtn().replace('id="regbtn"','id="regbtn2"')}${E.share!==false?`<button type="button" class="btn line sharebig">${ICON.share} Share event</button>`:''}</div>
  <section class="evlivebox" id="live" aria-live="polite" hidden></section>
  <div class="evbody">${paras(E.details)}</div>
  ${(E.media||[]).length?`<section class="evgal" id="gallery" aria-labelledby="gal-h"><h2 id="gal-h">Photos &amp; videos</h2><div class="galgrid">${E.media.map((x,i)=>x.k==='img'?`<figure class="galitem"><button type="button" class="galimg" data-i="${i}" aria-label="Open photo ${i+1}${x.cap?': '+esc(x.cap):''}"><img src="${esc(x.src)}" alt="${esc(x.cap||E.title+' photo '+(i+1))}" loading="lazy"></button>${x.cap?`<figcaption>${esc(x.cap)}</figcaption>`:''}</figure>`:`<figure class="galitem vid">${vidLite(x,x.cap)}${x.cap?`<figcaption>${esc(x.cap)}</figcaption>`:''}</figure>`).join('')}</div></section>`:''}
 </div>
 <aside class="evside"><div class="evbox">
  <p class="row">${ICON.cal}<span><b>${esc(fmtDay(E))}</b>${esc(timeLine(E))}${yt?`<small>Your time: ${esc(yt)}</small>`:''}</span></p>
  <p class="row">${E.mode==='online'?ICON.web:ICON.pin}<span>${E.mode==='online'?'<b>Online</b>The joining link is shared after you register.':`<b>${esc(E.locationName)}</b>${E.mapUrl?`<a href="${esc(E.mapUrl)}" target="_blank" rel="noopener">Open in Google Maps ↗</a>`:''}`}</span></p>
  <p class="row">${ICON.tag}<span><b>${esc(price(E))}</b>${E.paid?'per person · pay after you register':'No payment needed'}</span></p>
  <div class="evcta">${regBtn()}</div>
  <div class="evmini"><a class="lnk" href="${gcal()}" target="_blank" rel="noopener">Add to Google Calendar</a><button type="button" class="lnk" id="icsb">Download calendar file</button></div>
 </div>
 ${E.share!==false?`<div class="evbox share"><b>${ICON.share} Share this event</b><div class="shbtns">
  <button type="button" class="shb" data-s="copy">Copy link</button>
  <a class="shb wa" href="https://api.whatsapp.com/send?text=${encodeURIComponent(E.title+' · '+fmtDay(E)+'\n'+url)}" target="_blank" rel="noopener">WhatsApp</a>
  <a class="shb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
  <a class="shb" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener">LinkedIn</a>
  <a class="shb" href="https://x.com/intent/post?text=${encodeURIComponent(E.title)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener">X</a>
  ${navigator.share?'<button type="button" class="shb" data-s="native">More…</button>':''}</div></div>`:''}
 </aside></div></article>`;
/* live stream panel: scheduled → live → recording, updated every 30 seconds */
const L=E.live;
if(L){
 const box=$('#live'),slot=$('.lvtagslot'),pf=PLATFORM[L.platform]||(L.platform==='link'&&L.video?L.video.name:'');
 const when=ms=>new Date(ms).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true});
 const until=ms=>{const m=Math.max(1,Math.round((ms-Date.now())/6e4));return m<60?`in ${m} min`:m<1440?`in ${Math.floor(m/60)} h ${m%60?m%60+' min':''}`.trim():`in ${Math.round(m/1440)} day${Math.round(m/1440)===1?'':'s'}`};
 let shown='';
 const draw=()=>{const st=liveNow(L);if(st===shown&&st!=='scheduled')return;const first=!shown;shown=st;box.hidden=false;box.className='evlivebox '+st;
  const head=st==='live'?`<span class="lvpill on"><i></i>LIVE</span><b>${esc(L.title||'Live now')}</b>`:st==='scheduled'?`<span class="lvpill sched">Live stream scheduled</span><b>${esc(L.title||'Watch this event live')}</b>`:`<span class="lvpill rec">Recording</span><b>${esc(L.title||'Watch the live stream again')}</b>`;
  const sub=st==='scheduled'?`Starts ${esc(when(L.startUTC))} (your time) · ${esc(until(L.startUTC))}`:st==='live'?`Streaming now${pf?' on '+pf:''}`:'';
  const V=L.video||{},plays=!!(V.embed||V.file);
  const player=plays?(st==='live'?vidFrame(V,true,true):vidLite({...V,url:L.url},L.title||E.title,true))
   :`<a class="btn ${st==='live'?'solid':'line'} lg lvgo" href="${esc(L.url)}" target="_blank" rel="noopener">${st==='live'?'Watch live':st==='scheduled'?'Open the live stream':'Watch the recording'}${pf?' on '+pf:''} ↗</a>${st==='scheduled'?'<small class="lvnote">The link works once the stream starts.</small>':''}`;
  box.innerHTML=`<div class="lvhead">${head}</div>${sub?`<p class="lvsub">${sub}</p>`:''}${player}${plays?`<a class="lvext" href="${esc(L.url)}" target="_blank" rel="noopener">Open on ${esc(pf||V.name||'the original site')} ↗</a>`:''}`;
  slot.innerHTML=st==='live'?'<span class="lvtag on">● Live now</span>':st==='scheduled'?'<span class="lvtag">Live stream</span>':'';
  if(st==='live'&&!first)box.scrollIntoView({behavior:'smooth',block:'center'})};
 draw();if(!L.forced)setInterval(draw,30000);
 if(liveNow(L)==='live'&&location.hash!=='#live')setTimeout(()=>box.scrollIntoView({block:'center'}),300);
}
/* gallery lightbox */
const photos=(E.media||[]).map((x,i)=>({...x,i})).filter(x=>x.k==='img');
if(photos.length){
 const dlg=document.createElement('dialog');dlg.className='lightbox';dlg.setAttribute('aria-label','Photos');
 dlg.innerHTML='<button type="button" class="lbx" aria-label="Close">×</button><button type="button" class="lbnav prev" aria-label="Previous photo">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="lbnav next" aria-label="Next photo">›</button><span class="lbcount"></span>';
 document.body.appendChild(dlg);let at=0;
 const show=k=>{at=(k+photos.length)%photos.length;const p=photos[at];$('img',dlg).src=p.src;$('img',dlg).alt=p.cap||E.title;$('figcaption',dlg).textContent=p.cap||'';$('.lbcount',dlg).textContent=`${at+1} / ${photos.length}`};
 $$('.galimg').forEach(b=>b.onclick=()=>{show(photos.findIndex(p=>p.i===+b.dataset.i));dlg.showModal()});
 $('.lbx',dlg).onclick=()=>dlg.close();$('.prev',dlg).onclick=()=>show(at-1);$('.next',dlg).onclick=()=>show(at+1);
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 dlg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(at-1);if(e.key==='ArrowRight')show(at+1)});
 let x0=null;dlg.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});dlg.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)show(at+(dx<0?1:-1));x0=null});
 if(photos.length<2)$$('.lbnav',dlg).forEach(b=>b.hidden=true);
}
const toast=m=>{const t=document.createElement('div');t.className='evtoast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)};
$('#icsb').onclick=()=>ics();
const shareNow=async()=>{if(navigator.share){try{await navigator.share({title:E.title,text:(E.summary||E.title)+' · '+fmtDay(E),url});return}catch(e){if(e.name==='AbortError')return}}
 const box=$('.evbox.share');box.scrollIntoView({behavior:'smooth',block:'center'});box.classList.add('flash');setTimeout(()=>box.classList.remove('flash'),1600)};
$$('.sharebig').forEach(b=>b.onclick=shareNow);
$$('[data-s]').forEach(b=>b.onclick=async()=>{if(b.dataset.s==='copy'){try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(e){prompt('Copy this link',url)}}else{try{await navigator.share({title:E.title,text:E.summary||E.title,url})}catch(e){}}});

/* ---------- registration ---------- */
const rb=$('#regbtn');if(!rb)return;const rb2=$('#regbtn2');if(rb2)rb2.onclick=()=>rb.click();
const guess=typeof guessCountry==='function'?guessCountry():'AE';
const cOpts=sel=>COUNTRIES.map(c=>`<option value="${c[0]}" ${c[0]===sel?'selected':''}>${c[1]}</option>`).join('');
const ccOpts=sel=>COUNTRIES.map(c=>`<option value="${c[0]}" ${c[0]===sel?'selected':''}>${flagOf(c[0])} +${c[2]} · ${c[1]}</option>`).join('');
const FORM=E.form||{std:{whatsapp:true,country:true,education:true,role:true},fields:[]},STD=FORM.std,FIELDS=FORM.fields||[];
rb.onclick=()=>{
 const m=document.createElement('div');m.className='evmodal';m.innerHTML=`<div class="evdlg" role="dialog" aria-modal="true" aria-labelledby="rgh"><button type="button" class="x" aria-label="Close">×</button>
 <h2 id="rgh">Register</h2><p class="small">${esc(E.title)} · ${esc(local(E.start).toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}, ${esc(timeLine(E))}</p>
 <form class="rgf" novalidate>
  <label>Full name<input name="name" required maxlength="80" autocomplete="name"></label>
  <label>Email<input name="email" type="email" required maxlength="80" autocomplete="email"></label>
  <label>Mobile number<span class="tel"><select name="cc" aria-label="Mobile country code">${ccOpts(guess)}</select><input name="mob" type="tel" inputmode="tel" required maxlength="18" autocomplete="tel-national"></span></label>
  ${STD.whatsapp?`<div class="lbl">WhatsApp number<label class="same"><input type="checkbox" name="same" checked> Same as mobile</label><span class="tel wa"><select name="wcc" aria-label="WhatsApp country code" disabled>${ccOpts(guess)}</select><input name="wmob" type="tel" inputmode="tel" required maxlength="18" disabled aria-label="WhatsApp number"></span></div>`:''}
  ${STD.country?`<label>Country<select name="country" required autocomplete="country" data-search>${cOpts(guess)}</select></label>`:''}
  ${STD.education?`<label>Education level<select name="education" required data-search><option value="">Choose…</option>${['SSLC','Plus Two','Bachelors','Masters','PhD','Other'].map(x=>`<option>${x}</option>`).join('')}</select></label>`:''}
  ${STD.role?`<label>I am a<select name="role" required><option value="">Choose…</option><option>Student</option><option>Parent</option></select></label>`:''}
  ${FIELDS.map(x=>FF.render(x)).join('')}
  ${E.maxSeats>1?`<label>Number of people<select name="seats">${Array.from({length:Math.min(E.maxSeats,E.seatsLeft??E.maxSeats)},(_,i)=>`<option>${i+1}</option>`).join('')}</select></label>`:''}
  <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
  ${E.paid?`<p class="small paidnote">After you register, you'll send your details to us on WhatsApp to pay <b>${esc(price(E))}</b> per person. Your seat is confirmed once payment is approved.</p>`:''}
  <p class="err" role="alert"></p>
  <button class="btn solid lg" type="submit">${E.paid?'Register and continue to payment':'Register'}</button>
 </form></div>`;
 document.body.appendChild(m);document.body.style.overflow='hidden';
 const close=()=>{m.remove();document.body.style.overflow=''};
 $('.x',m).onclick=close;m.addEventListener('click',e=>{if(e.target===m)close()});document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k)}});
 const f=$('form',m);let ccT=false;FF.enhance(f);
 const syncWa=()=>{if(!f.same)return;const same=f.same.checked;f.wcc.disabled=f.wmob.disabled=same;if(same){f.wcc.value=f.cc.value;f.wmob.value=f.mob.value}else if(!f.wmob.value)f.wmob.focus()};
 if(f.country)f.country.onchange=()=>{if(!ccT){f.cc.value=f.country.value;syncWa()}};f.cc.onchange=()=>{ccT=true;syncWa()};f.mob.oninput=syncWa;if(f.same)f.same.onchange=syncWa;f.name.focus();
 $$('.othtxt',f).forEach(t=>t.addEventListener('input',()=>{const o=t.closest('.opt').querySelector('input[value=__other]');if(t.value&&o)o.checked=true}));
 f.onsubmit=async ev=>{ev.preventDefault();const err=$('.err',m);err.textContent='';
  const num=v=>v.replace(/[\s\-().]/g,'').replace(/^0+/,''),dialOf=cc=>(COUNTRIES.find(c=>c[0]===cc)||[])[2];
  const email=f.email.value.trim(),mob=num(f.mob.value),dial=dialOf(f.cc.value),same=!f.same||f.same.checked,wmob=same?mob:num(f.wmob.value),wdial=same?dial:dialOf(f.wcc.value);
  if(!f.name.value.trim())return err.textContent='Please enter your name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return err.textContent='Please enter a valid email address.';
  if(!/^\d{6,14}$/.test(mob))return err.textContent='Please enter a valid mobile number (without the country code).';
  if(STD.whatsapp&&!/^\d{6,14}$/.test(wmob))return err.textContent='Please enter a valid WhatsApp number (without the country code).';
  if(STD.education&&!f.education.value)return err.textContent='Please choose your education level.';
  if(STD.role&&!f.role.value)return err.textContent='Please choose whether you are a student or a parent.';
  $$('.ff.bad',f).forEach(x=>x.classList.remove('bad'));
  const answers={},files=[];
  for(const q of FIELDS){const v=FF.read(q,f);const msg=FF.check(q,v);
   if(msg){const box=$(`[data-f="${q.id}"]`,f);if(box){box.classList.add('bad');box.scrollIntoView({behavior:'smooth',block:'center'})}return err.textContent=msg}
   if(v instanceof Blob)files.push([q,v]);else if(v!==undefined&&v!==''&&!(Array.isArray(v)&&!v.length))answers[q.id]=v}
  const b=$('button[type=submit]',f);b.disabled=true;b.textContent='Registering…';
  for(const [q,file] of files){b.textContent='Uploading '+file.name.slice(0,24)+'…';
   try{const data=await new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res(String(rd.result).split(',')[1]);rd.onerror=rej;rd.readAsDataURL(file)});
    const type=file.type||(/\.pdf$/i.test(file.name)?'application/pdf':/\.hei[cf]$/i.test(file.name)?'image/heic':'');
    const r=await fetch(`/api/events/${E.slug}/upload`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:file.name,type,data})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Upload failed');answers[q.id]=d.id}
   catch(x){err.textContent=`"${q.label}": ${x.message}`;b.disabled=false;b.textContent=E.paid?'Register and continue to payment':'Register';return}}
  b.textContent='Registering…';
  const body={name:f.name.value.trim(),email,country:f.country?f.country.value:'',phone:'+'+dial+' '+mob,whatsapp:STD.whatsapp?'+'+wdial+' '+wmob:'',education:f.education?f.education.value:'',role:f.role?f.role.value:'',answers,seats:f.seats?f.seats.value:1,website:f.website.value};
  let d;try{const r=await fetch(`/api/events/${E.slug}/register`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});d=await r.json();if(!r.ok)throw new Error(d.error||'Something went wrong. Please try again.')}
  catch(x){err.textContent=x.message;b.disabled=false;b.textContent=E.paid?'Register and continue to payment':'Register';return}
  const dlg=$('.evdlg',m);
  if(d.status==='pending'){
   const msg=`Hello Aqlyon, I registered for "${E.title}" (${fmtDay(E)}, ${timeLine(E)}).\nRef: ${d.ref}\nName: ${body.name}\nMobile: ${body.phone}${body.whatsapp?`\nWhatsApp: ${body.whatsapp}`:''}${body.education||body.role?`\n${[body.education,body.role].filter(Boolean).join(' · ')}`:''}\nEmail: ${body.email}\nPeople: ${d.seats}\nAmount: ${d.currency} ${d.total}\nPlease send me the payment details.`;
   const wa=`https://api.whatsapp.com/send?phone=${String(d.whatsapp).replace(/[^\d]/g,'')}&text=${encodeURIComponent(msg)}`;
   dlg.innerHTML=`<button type="button" class="x" aria-label="Close">×</button><div class="done"><span class="ok">1/2</span><h2>One more step: payment</h2><p>Your place is reserved. Send your details to us on WhatsApp and we'll share how to pay <b>${esc(d.currency+' '+d.total)}</b>. Your seat is confirmed once payment is approved.</p><p class="ref">Your reference: <b>${esc(d.ref)}</b></p><a class="btn solid lg wa" href="${wa}" target="_blank" rel="noopener">Send on WhatsApp</a><p class="small">WhatsApp didn't open? Message <b>${esc(d.whatsapp)}</b> with your reference.</p></div>`;
   window.open(wa,'_blank','noopener');
  }else{
   dlg.innerHTML=`<button type="button" class="x" aria-label="Close">×</button><div class="done"><span class="ok">✓</span><h2>You're registered!</h2><p>See you at <b>${esc(E.title)}</b>, ${esc(fmtDay(E))}, ${esc(timeLine(E))}.</p><p class="ref">Your reference: <b>${esc(d.ref)}</b></p>
    ${d.onlineUrl?`<p class="join">Joining link: <a href="${esc(d.onlineUrl)}" target="_blank" rel="noopener">${esc(d.onlineUrl)}</a><br><small>Save it now. It's also in the calendar file below.</small></p>`:E.mode==='online'?'<p>We\'ll send you the joining link before the event.</p>':E.mapUrl?`<p><a href="${esc(E.mapUrl)}" target="_blank" rel="noopener">Directions to ${esc(E.locationName)} ↗</a></p>`:''}
    <p class="small remind">📅 ${d.calendar?'We\'ve emailed your invitation to <b>'+esc(body.email)+'</b>. You can also add':'Add'} the event to your calendar below. The calendar file includes reminders 1 day and 1 hour before.</p>
    ${d.badge&&E.mode!=='online'?`<p class="badgecta"><a class="btn" href="${esc(d.badge)}" target="_blank" rel="noopener">🎫 View my entry badge</a><small>Show its QR code at the entrance.${d.calendar?' We\'ve also emailed it to you.':''}</small></p>`:''}
    <div class="row2"><a class="btn line" href="${gcal(d.onlineUrl?'Join: '+d.onlineUrl:'')}" target="_blank" rel="noopener">Add to Google Calendar</a><button type="button" class="btn line icsd">Download calendar file</button>${E.share!==false?`<button type="button" class="btn line sharebig">${ICON.share} Share</button>`:''}</div>
    ${E.share!==false?`<p class="small">Tell a friend: <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('I just registered for '+E.title+'. Join me: '+url)}" target="_blank" rel="noopener">share on WhatsApp</a></p>`:''}</div>`;
   $$('.sharebig',dlg).forEach(b=>b.onclick=shareNow);
   $('.icsd',dlg).onclick=()=>ics(d.onlineUrl?'Join: '+d.onlineUrl:'');
  }
  $('.x',dlg).onclick=close;
 };
};
})();
