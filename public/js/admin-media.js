/* =====================================================================
   Admin: an event's live stream and its photos & videos (event editor)
   liveEditor(box, e)  → {get}  e.live = {on, url, start, end, status: auto|live|ended, title}
   mediaEditor(box, e) → {get}  e.media = [{k:'img', id, cap} | {k:'vid', url, cap}]  (video links from any site)
   Server: cleanLive / cleanMedia / liveInfo in netlify/lib/events.mjs
   ===================================================================== */
const ytIdOf=u=>{const m=String(u||'').trim().match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})(?:[?&#/].*)?$/i);return m?m[1]:''};
const ytThumb=v=>`https://i.ytimg.com/vi/${v}/hqdefault.jpg`;
// which site a video link is from and whether it can play inside the event page (same rules as videoInfo on the server)
function vidOf(raw){
 let u;try{u=new URL(String(raw||'').trim())}catch(e){return null}if(u.protocol!=='https:')return null;
 const h=u.hostname.replace(/^(www|m|mobile|web)\./,''),p=u.pathname,v=ytIdOf(raw);
 if(v)return {name:'YouTube',plays:true,thumb:ytThumb(v)};
 if(/(^|\.)facebook\.com$|^fb\.watch$/.test(h))return {name:'Facebook',plays:true};
 if(/(^|\.)instagram\.com$/.test(h))return /\/(p|reel|reels|tv)\//.test(p)?{name:'Instagram',plays:true}:{name:'Instagram',plays:false};
 if(/(^|\.)tiktok\.com$/.test(h))return {name:'TikTok',plays:/\/video\/\d+/.test(p)};
 if(/(^|\.)vimeo\.com$/.test(h))return {name:'Vimeo',plays:/\/\d{5,}/.test(p)};
 if(h==='drive.google.com')return {name:'Google Drive',plays:/\/file\/d\//.test(p)};
 if(/\.(mp4|webm|mov|m4v)$/i.test(p))return {name:'Video file',plays:true};
 return {name:/zoom\.us$/.test(h)?'Zoom':/meet\.google\.com$/.test(h)?'Google Meet':h,plays:false};
}
const vidHint=i=>!i?'<span class="badline">Paste the full link, starting with https://</span>':i.plays?`<span class="okline">✓ ${esc(i.name)} video: it plays right on the event page.</span>`:`${esc(i.name)} link: it can't play inside the page, so visitors get a “Watch on ${esc(i.name)}” button.`;

function liveEditor(box,e,m){
 const L=Object.assign({on:false,url:'',start:'',end:'',status:'auto',title:''},e.live||{});
 const st=(v,t,d)=>`<label class="ck"><input type="radio" name="lvst" value="${v}" ${L.status===v?'checked':''}><span><b>${t}</b>${d?': '+d:''}</span></label>`;
 box.innerHTML=`<label class="ck"><input type="checkbox" id="lv-on" ${L.on?'checked':''}><span><b>This event is streamed live</b>: the event page shows “Live stream scheduled” before it starts, a red <b>LIVE</b> badge with the video while it's on, and the recording afterwards.</span></label>
 <div class="lvbody">
  <div class="field"><label for="lv-url">Live stream link</label><input id="lv-url" type="url" maxlength="600" value="${esc(L.url)}" placeholder="YouTube, Facebook, Instagram, Zoom… live link"><small class="small lvhint"></small></div>
  <div class="field"><label for="lv-title">Title above the video <small>(optional)</small></label><input id="lv-title" maxlength="120" value="${esc(L.title)}" placeholder="e.g. Watch RISE-26 live"></div>
  <div class="f3"><div class="field"><label for="lv-start">Stream starts <small>(empty = event start)</small></label><input type="datetime-local" id="lv-start" value="${esc(L.start)}"></div><div class="field"><label for="lv-end">Stream ends <small>(empty = event end)</small></label><input type="datetime-local" id="lv-end" value="${esc(L.end)}"></div></div>
  <div class="lvstatus"><p class="fbsub">Live status on the website</p>${st('auto','Automatic','“Scheduled” before the start time, “Live” between start and end, then the recording')}${st('live','Live now','show it as live straight away (for example if you start early)')}${st('ended','Ended','show the recording')}</div>
 </div>`;
 const on=$('#lv-on',box),url=$('#lv-url',box),hint=$('.lvhint',box);
 const sync=()=>{$('.lvbody',box).hidden=!on.checked;const u=url.value.trim();
  hint.innerHTML=!u?'YouTube and Facebook live streams play right on the event page; Instagram Live, Zoom and others get a “Watch live” button. Schedule the stream first (YouTube Studio → Create → Go live → Schedule) and paste its link here.':vidHint(vidOf(u))};
 on.onchange=sync;url.oninput=sync;sync();
 return {get:()=>({on:on.checked,url:url.value.trim(),title:$('#lv-title',box).value.trim(),start:$('#lv-start',box).value,end:$('#lv-end',box).value,status:(box.querySelector('input[name=lvst]:checked')||{}).value||'auto'}),
  check:()=>on.checked&&!/^https:\/\/\S+\.\S+/i.test(url.value.trim())?'Add the live stream link (starting with https://), or untick “This event is streamed live”.':''};
}

function mediaEditor(box,e){
 let M=(e.media||[]).map(x=>({...x}));
 const draw=()=>{
  box.innerHTML=`<p class="small">Shown on the event page as a gallery: photos open full screen, and videos from YouTube, Facebook, Instagram, TikTok, Vimeo or Google Drive play in the page. Add them before, during or after the event. ${M.length?`<b>${M.length}</b> item${M.length===1?'':'s'}.`:''}</p>
  <div class="mdgrid">${M.map((x,i)=>`<div class="mditem"><div class="mdthumb">${x.k==='img'?`<img src="${x.preview||'/api/img/'+x.id}" alt="" loading="lazy">`:(()=>{const i=vidOf(x.url)||{name:'Video'};return i.thumb?`<img src="${i.thumb}" alt="" loading="lazy"><span class="mdplay" aria-hidden="true">▶</span>`:`<span class="mdsite">▶ ${esc(i.name)}</span>`})()}${x.busy?'<span class="mdbusy">Uploading…</span>':''}</div>
   <input class="mdcap" data-i="${i}" maxlength="160" value="${esc(x.cap||'')}" placeholder="${x.k==='img'?'Photo caption (optional)':'Video title (optional)'}" aria-label="Caption">
   <div class="mdacts"><button type="button" class="mini" data-mv="-1" data-i="${i}" ${i?'':'disabled'} aria-label="Move earlier">←</button><button type="button" class="mini" data-mv="1" data-i="${i}" ${i<M.length-1?'':'disabled'} aria-label="Move later">→</button><button type="button" class="mini" data-rm="${i}">Remove</button></div></div>`).join('')}</div>
  <div class="mdadd"><label class="btn ghost sm mdfile">＋ Add photos<input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden></label><button type="button" class="btn ghost sm mdyt">＋ Add a video</button></div>`;
  $$('.mdcap',box).forEach(c=>c.oninput=()=>{M[+c.dataset.i].cap=c.value});
  $$('[data-mv]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.i,j=i+ +b.dataset.mv;[M[i],M[j]]=[M[j],M[i]];draw()});
  $$('[data-rm]',box).forEach(b=>b.onclick=()=>{M.splice(+b.dataset.rm,1);draw()});
  $('.mdfile input',box).onchange=async ev=>{const files=[...ev.target.files].slice(0,40);ev.target.value='';
   for(const f of files){const it={k:'img',id:'',cap:'',busy:true};M.push(it);draw();
    try{const img=await prepImage(f);it.preview=img.preview;draw();const d=await AAPI.call('/admin/upload',{method:'POST',body:{type:img.type,data:img.data}});it.id=d.id;it.busy=false}
    catch(err){M.splice(M.indexOf(it),1);toast(`${f.name}: ${err.message}`,true)}draw()}};
  $('.mdyt',box).onclick=()=>modal(`<h2>Add a video</h2><form class="mform"><div class="field"><label for="vd-url">Video link</label><input id="vd-url" required placeholder="Paste a YouTube, Facebook, Instagram, TikTok, Vimeo or Google Drive link"><small class="small vdhint">Open the video, press <b>Share → Copy link</b>, and paste it here.</small></div><div class="field"><label for="vd-cap">Title <small>(optional)</small></label><input id="vd-cap" maxlength="160" placeholder="e.g. Highlights of the event"></div><p class="formerr"></p><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn">Add video</button></div></form>`,(mm,close)=>{
   const u=$('#vd-url',mm),h=$('.vdhint',mm);u.oninput=()=>{const i=vidOf(u.value);h.innerHTML=u.value.trim()?vidHint(i)+(i&&i.thumb?`<img src="${i.thumb}" alt="" class="ytpimg">`:''):'Open the video, press <b>Share → Copy link</b>, and paste it here.'};u.focus();
   $('form',mm).onsubmit=x=>{x.preventDefault();const url=u.value.trim();if(!vidOf(url)){$('.formerr',mm).textContent='Paste the full video link, starting with https://';return}
    M.push({k:'vid',url,cap:$('#vd-cap',mm).value.trim()});close();draw()}});
 };
 draw();
 return {get:()=>M.filter(x=>x.k==='vid'||x.id).map(x=>x.k==='img'?{k:'img',id:x.id,cap:x.cap||''}:{k:'vid',url:x.url,cap:x.cap||''}),busy:()=>M.some(x=>x.busy)};
}
