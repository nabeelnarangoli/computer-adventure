/* =====================================================================
   Admin → event → 🎓 Certificates
   Design the certificate (saved on the event as e.cert), preview it live, pick who gets one,
   then Generate: every certificate is drawn in the browser (cert-render.js), placed on an A4
   landscape PDF page, and all PDFs are downloaded together in one ZIP file.
   Three kinds, chosen at the top: Participation (everyone, or chosen people), Winners (people given
   1st, 2nd or 3rd place, with their own wording and a gold/silver/bronze medal), and Blank (no name,
   to write in by hand; anything about one person prints as a line).
   Nothing is made or sent automatically.
   ===================================================================== */
const CT={e:null,D:null,regs:[],kind:'part',who:'ok',picked:new Set(),q:'',wq:'',wplace:1,blank:{0:true,1:false,2:false,3:false},copies:1,combined:true,imgs:{},busy:false,focus:null};
const CT_WIN={title:'Certificate',subtitle:'of Achievement',pre:'This certificate is proudly presented to',body:'for winning {place} in {event}, held on {date} at {venue}.'};
const CT_KINDS=[['part','🎓 Participation'],['win','🏆 Winners (1st, 2nd, 3rd)'],['blank','📄 Blank (write the name later)']];
const ctRank=n=>CERT_RANK[n]+' Place';
const ctLoaded={};
function ctScript(src){return ctLoaded[src]||(ctLoaded[src]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>{delete ctLoaded[src];no(new Error('Could not load '+src))};document.head.appendChild(s)}))}
const ctImg=id=>{if(!id)return Promise.resolve(null);return new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src='/api/img/'+id})};
// the design being edited: each type (participation, winners, blank) has its own complete design
const ctCur=()=>CT.kind==='win'?CT.D.win:CT.kind==='blank'?CT.D.blank:CT.D;
async function ctLoadImgs(){const D=ctCur(),ids={logo:D.logo,logo2:D.logo2,logo3:D.logo3};(D.signs||[]).forEach((s,i)=>ids['sign'+i]=s.img);
 const out={};if(CERT_ART[D.tpl]){const src='/img/cert/'+D.tpl+'.jpg';if(!CT.imgs[src])CT.imgs[src]=new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});out.bg=await CT.imgs[src]}await Promise.all(Object.entries(ids).map(async([k,id])=>{if(!id){out[k]=null;return}if(!CT.imgs[id])CT.imgs[id]=ctImg(id);out[k]=await CT.imgs[id]}));return out}

/* ---- the words that go on the certificate ---- */
const ctDay=s=>{const d=new Date(String(s).slice(0,10)+'T12:00:00');return isNaN(d)?'':d};
function ctDateText(e){
 const a=ctDay(e.start),b=e.end?ctDay(e.end):null;if(!a)return '';
 const f=(d,o)=>d.toLocaleDateString('en-GB',o);
 if(!b||+b===+a)return f(a,{day:'numeric',month:'long',year:'numeric'});
 if(a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth())return `${a.getDate()}–${f(b,{day:'numeric',month:'long',year:'numeric'})}`;
 if(a.getFullYear()===b.getFullYear())return `${f(a,{day:'numeric',month:'long'})} – ${f(b,{day:'numeric',month:'long',year:'numeric'})}`;
 return `${f(a,{day:'numeric',month:'long',year:'numeric'})} – ${f(b,{day:'numeric',month:'long',year:'numeric'})}`;
}
const ctQFields=e=>((e.form||{}).fields||[]).filter(f=>f.type!=='section'&&f.type!=='file'&&f.label);
// everyone who can get a certificate: one per person on a booking (when the form asks details for each person), else one per booking
function ctPeople(){
 const e=CT.e,QF=ctQFields(e),okSt=['confirmed','approved'];
 const out=[];
 CT.regs.forEach(r=>{
  const ppl=r.people&&r.people.length?r.people:null;
  const base={};QF.filter(f=>!f.each).forEach(f=>{const v=FF.show(f,(r.answers||{})[f.id]);if(v)base[f.label]=v});
  const add=(name,ref,attended,pAns)=>{const answers={...base};if(pAns)QF.filter(f=>f.each).forEach(f=>{const v=FF.show(f,pAns[f.id]);if(v)answers[f.label]=v});
   out.push({key:ref,name:name||r.name||'',ref,ok:okSt.includes(r.status),in:!!attended,answers,booker:r.name})};
  if(ppl)ppl.forEach((p,i)=>add(p.name,`${r.ref}-${i+1}`,p.attended,p.answers||{}));
  else add(r.name,r.ref,r.attended,null);
 });
 return out.filter(p=>p.name);
}
function ctP(p,place=0,blank=false){
 const e=CT.e,D=ctCur(),iss=D.issued?ctDay(D.issued):ctDay(e.end||e.start)||new Date();
 return {name:blank?'':p.name,place,blank,event:e.title,date:ctDateText(e),venue:e.mode==='online'?'Online':(e.locationName||''),organiser:D.org||'',ref:blank?'':p.ref,
  issued:iss?iss.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'',year:iss?iss.getFullYear():new Date().getFullYear(),answers:p.answers};
}
// the design with the right wording: winners (and blank 1st–3rd) use the Winners wording
// blank 1st–3rd certificates: the blank design with the winners' wording
const ctDesign=place=>{const D=ctCur();if(CT.kind!=='blank'||!place)return D;const W=CT.D.win;return {...D,title:W.title,subtitle:W.subtitle,pre:W.pre,body:W.body}};
const ctWords=ctCur;
// what Generate will make: [{P, file, copies}]
function ctItems(){
 if(CT.kind==='win'){const by=new Map(ctPeople().map(p=>[p.ref,p]));return CT.D.winners.map(w=>({w,p:by.get(w.ref)})).filter(x=>x.p).sort((a,b)=>a.w.place-b.w.place||a.p.name.localeCompare(b.p.name)).map(({w,p})=>({P:ctP(p,w.place),file:`${ctRank(w.place)} - ${p.name}`}))}
 if(CT.kind==='blank')return [0,1,2,3].filter(k=>CT.blank[k]).map(k=>({P:ctP({name:'',ref:'',answers:{}},k,true),file:`Blank - ${k?ctRank(k):'Participation'}`,copies:CT.copies}));
 return ctChosen().map(p=>({P:ctP(p),file:p.name,num:true}));
}
const ctChosen=()=>{const all=ctPeople();return CT.who==='pick'?all.filter(p=>CT.picked.has(p.key)):CT.who==='in'?all.filter(p=>p.ok&&p.in):all.filter(p=>p.ok)};

/* ---- page ---- */
async function certView(e){
 const main=$('.adm');CT.e=e;CT.D=JSON.parse(JSON.stringify({...CERT_DEFAULT,org:(e.badge&&e.badge.org)||'',...(e.cert||{})}));
 if(!CT.D.signs||!CT.D.signs.length)CT.D.signs=[{name:'',title:'',img:''}];
 // winners' and blank certificates start as a copy of the participation design (older saves kept only the winners' wording)
 const base=()=>{const b=JSON.parse(JSON.stringify(CT.D));delete b.win;delete b.blank;delete b.winners;return b};
 const w=CT.D.win||{},bl=CT.D.blank||{};
 CT.D.win=w.full?{...CERT_DEFAULT,...w}:{...base(),...CT_WIN,...(w.title||w.body?{title:w.title,subtitle:w.subtitle,pre:w.pre,body:w.body}:{}),full:true};
 CT.D.blank=bl.full?{...CERT_DEFAULT,...bl}:{...base(),full:true};
 [CT.D.win,CT.D.blank].forEach(d=>{if(!d.signs||!d.signs.length)d.signs=[{name:'',title:'',img:''}]});
 CT.D.winners=CT.D.winners||[];
 main.innerHTML=`${evHeadHTML(e,'certs')}<p class="lead">Loading…</p>`;bindEvHead(e);history.replaceState(null,'','#events/'+e.id+'/certificates');
 try{CT.regs=(await AAPI.call(`/admin/events/${e.id}/regs`)).regs}catch(err){CT.regs=[];toast(err.message,true)}
 CT.picked=new Set();CT.q='';CT.saved=JSON.stringify(CT.D);
 ctDraw();certLoadFonts().then(ctPreview);
}
function ctDraw(){
 const e=CT.e,D=ctCur(),main=$('.adm');
 const W=ctWords(),blank=CT.kind==='blank';
 const chips=[...(CT.kind==='win'?[['place','Place']]:[]),['name','Name'],['event','Event name'],['date','Event date'],['venue','Venue'],['organiser','Organiser'],['ref','Ref no.'],...ctQFields(e).map(f=>[f.label,f.label])];
 const sw=['#0D2B22','#123E7C','#0B1F3A','#6B1E2E','#3B2A6B','#7A4A12','#1F2937','#0F5257'];
 const tx=(id,label,val,max,hint)=>`<div class="field"><label for="${id}">${label}${hint?` <small>${hint}</small>`:''}</label><input id="${id}" class="ctt" maxlength="${max}" value="${esc(val||'')}"></div>`;
 const imgBox=(k,label,id)=>`<div class="ctimg" data-k="${k}">${id?`<img src="/api/img/${id}" alt="">`:'<span>None</span>'}<label class="btn sm ghost">${id?'Change':'Upload'} ${label}<input type="file" accept="image/*" hidden></label>${id?'<button type="button" class="linkbtn ctrm">Remove</button>':''}</div>`;
 main.innerHTML=`${evHeadHTML(e,'certs')}
 <div class="ctkinds" role="tablist">${CT_KINDS.map(([k,l])=>`<button type="button" role="tab" data-kind="${k}" class="${CT.kind===k?'on':''}" aria-selected="${CT.kind===k}">${l}</button>`).join('')}</div>
 <div class="ctwrap">
 <div class="ctform">
  <fieldset class="qset"><legend>Design for ${CT.kind==='win'?'winners':CT.kind==='blank'?'blank certificates':'participation'}</legend>
   <p class="small ctown">Each type has its own design: changes here do not affect the ${CT_KINDS.filter(k=>k[0]!==CT.kind).map(k=>k[1].replace(/^\S+ /,'').replace(/ \(.*/,'')).join(' or ')} certificate. <span class="ctcopy">Copy design from: ${CT_KINDS.filter(k=>k[0]!==CT.kind).map(([k,l])=>`<button type="button" class="linkbtn" data-copy="${k}">${l.replace(/^\S+ /,'').replace(/ \(.*/,'')}</button>`).join(' · ')}</span></p>
   <div class="cttpls">${CERT_TPLS.map(([v,n,d])=>`<label class="cttpl ${D.tpl===v?'on':''}" title="${esc(d)}"><input type="radio" name="cttpl" value="${v}" ${D.tpl===v?'checked':''}>${CERT_ART[v]?`<img src="/img/cert/${v}-thumb.jpg" alt="" loading="lazy">`:`<canvas width="360" height="255" data-tpl="${v}"></canvas>`}<b>${n}</b></label>`).join('')}</div>
   <div class="field ctcolf" ${CERT_ART[D.tpl]?'hidden':''}><label>Main colour</label><div class="ctsw">${sw.map(c=>`<button type="button" class="ctswb ${D.color.toLowerCase()===c.toLowerCase()?'on':''}" data-c="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<input type="color" id="ctcol" value="${esc(D.color)}" aria-label="Pick any colour"></div></div>
   <div class="field"><label>Name written in</label><div class="rrow"><label class="radio"><input type="radio" name="ctns" value="script" ${!['serif','sans'].includes(D.nameStyle)?'checked':''}><span>Handwriting style</span></label><label class="radio"><input type="radio" name="ctns" value="serif" ${D.nameStyle==='serif'?'checked':''}><span>Classic serif</span></label><label class="radio"><input type="radio" name="ctns" value="sans" ${D.nameStyle==='sans'?'checked':''}><span>Modern bold</span></label></div></div>
  </fieldset>
  <fieldset class="qset"><legend>${CT.kind==='win'?'Wording for winners':'Wording'}</legend>
   ${blank?`<p class="small">The name is left empty, and anything about one person (like {Category}) prints as a line to write on. Blank 1st, 2nd and 3rd certificates use the <button type="button" class="linkbtn" data-kind="win">Winners</button> wording with this design.</p>`:''}${`
   ${CT.kind==='win'?'<p class="small">Use {Place} for First Place, Second Place or Third Place. Everything else (design, logos, signatures) is shared with the participation certificate.</p>':''}
   ${tx('ct-title','Title',W.title,40)}${tx('ct-sub','Second line',W.subtitle,60,'e.g. of Participation, of Achievement, of Appreciation')}
   ${tx('ct-pre','Line above the name',W.pre,120)}
   <div class="field"><label for="ct-body">Text below the name</label><textarea id="ct-body" class="ctt" rows="3" maxlength="600">${esc(W.body)}</textarea></div>
   <div class="ctchips"><small>Insert into the box you are typing in:</small>${chips.map(([k,l])=>`<button type="button" class="chip" data-ph="${esc(k)}">{${esc(l)}}</button>`).join('')}</div>`}
   ${tx('ct-foot','Small line at the bottom',D.footer,160,'optional')}
  </fieldset>
  <fieldset class="qset"><legend>Organiser and logos</legend>
   ${tx('ct-org','Organiser name',D.org,90,'shown at the top')}
   <div class="ctimgs">${imgBox('logo','logo',D.logo)}${imgBox('logo2','second logo',D.logo2)}${imgBox('logo3','event logo',D.logo3)}</div>
  </fieldset>
  <fieldset class="qset"><legend>Signatures</legend>
   <p class="small">For a clean signature, sign in dark ink on plain white paper and take a straight, bright photo. The white is removed automatically.</p>
   <div class="ctsigns">${D.signs.map((s,i)=>`<div class="ctsign" data-i="${i}">
    <div class="f2"><div class="field"><label>Name</label><input class="ctsn" maxlength="60" value="${esc(s.name)}"></div><div class="field"><label>Position</label><input class="ctst" maxlength="80" value="${esc(s.title)}"></div></div>
    ${imgBox('sign'+i,'signature',s.img)}${D.signs.length>1?'<button type="button" class="linkbtn ctsdel">Remove this signature</button>':''}</div>`).join('')}</div>
   ${D.signs.length<3?'<button type="button" class="btn sm ghost ctsadd">+ Add a signature</button>':''}
  </fieldset>
  <fieldset class="qset"><legend>Details</legend>
   <label class="chk"><input type="checkbox" id="ct-id" ${D.showId?'checked':''}> Print a certificate number (the person's registration ref)</label>
   <div class="field"><label for="ct-iss">Issue date <small>(empty = the event date)</small></label><input type="date" id="ct-iss" value="${esc(D.issued)}"></div>
  </fieldset>
  <p><button type="button" class="btn ctsave">Save design</button> <span class="small ctsaved"></span></p>
 </div>
 <div class="ctside">
  <div class="ctpv"><canvas width="1400" height="990" tabindex="0" aria-label="Certificate preview. Click a part to select it, then drag it or use the arrow keys to move it."></canvas><p class="small ctpvn"></p>
   <div class="ctmove"></div></div>
  <section class="ctgen"><h2>${CT.kind==='win'?'Winners':CT.kind==='blank'?'Blank certificates':'Generate certificates'}</h2>
   ${CT.kind==='part'?`<div class="field"><label for="ctwho">Who gets one</label><select id="ctwho"><option value="ok" ${CT.who==='ok'?'selected':''}>Everyone confirmed</option><option value="in" ${CT.who==='in'?'selected':''}>Only people who checked in</option><option value="pick" ${CT.who==='pick'?'selected':''}>Choose people…</option></select></div>
   <div class="ctpick"></div>`:CT.kind==='win'?`<div class="ctwin"></div>`:`
   <div class="field"><label>Which certificates</label><div class="ctbk">${[0,1,2,3].map(k=>`<label class="chk"><input type="checkbox" data-bk="${k}" ${CT.blank[k]?'checked':''}> ${k?['','🥇','🥈','🥉'][k]+' '+ctRank(k):'Participation'}</label>`).join('')}</div></div>
   <div class="field"><label for="ctcopies">Copies of each</label><input type="number" id="ctcopies" min="1" max="500" value="${CT.copies}" style="max-width:120px"></div>`}
   ${CT.kind!=='blank'?`<label class="chk"><input type="checkbox" id="ctcomb" ${CT.combined?'checked':''}> Also add one PDF with all certificates (easy to print in one go)</label>`:''}
   <p class="ctcount"></p>
   <button type="button" class="btn ctgo">🎓 Generate &amp; download ZIP</button>
   <div class="ctprog" hidden><div class="ctbar"><i></i></div><p class="small"></p></div>
  </section>
 </div></div>`;
 ctMoveBar();ctBindMove();
 ctBind();CT.kind==='win'?ctWin():CT.kind==='part'?ctWho():ctCount();ctMark();certLoadFonts().then(ctThumbs);
}
// small previews of the drawn templates in the chosen colour (picture templates use their own thumbnail)
let ctTT=null;
function ctThumbs(){$$('.cttpl canvas').forEach(c=>drawCert(c,{...CERT_DEFAULT,tpl:c.dataset.tpl,color:ctCur().color,body:'',pre:'',signs:[{name:' ',title:''}],showId:false},{name:'Your Name',year:new Date().getFullYear(),answers:{}},{}))}
function ctRead(){
 const D=ctCur(),v=s=>$(s).value;
 if($('#ct-title')){const W=ctWords();W.title=v('#ct-title');W.subtitle=v('#ct-sub');W.pre=v('#ct-pre');W.body=v('#ct-body')}
 D.footer=v('#ct-foot');D.org=v('#ct-org');
 D.showId=$('#ct-id').checked;D.issued=v('#ct-iss');D.nameStyle=($('input[name=ctns]:checked')||{}).value||'script';
 $$('.ctsign').forEach(el=>{const s=D.signs[+el.dataset.i];if(s){s.name=$('.ctsn',el).value;s.title=$('.ctst',el).value}});
}
const ctMark=()=>{const s=$('.ctsaved');if(!s)return;if(JSON.stringify(CT.D)!==CT.saved)s.textContent='Not saved yet';else if(s.textContent==='Not saved yet')s.textContent=''};
let ctT=null;const ctLater=()=>{clearTimeout(ctT);ctT=setTimeout(()=>{ctRead();ctPreview();ctMark()},180)};
function ctBind(){
 const D=ctCur();
 $$('input[name=cttpl]').forEach(r=>r.onchange=()=>{D.tpl=r.value;CT.sel=null;ctMoveBar();$$('.cttpl').forEach(l=>l.classList.toggle('on',l.contains(r)));$('.ctcolf').hidden=!!CERT_ART[D.tpl];ctLater()});
 $$('.ctswb').forEach(b=>b.onclick=()=>{D.color=b.dataset.c;$('#ctcol').value=b.dataset.c;$$('.ctswb').forEach(x=>x.classList.toggle('on',x===b));ctLater();ctThumbs()});
 $('#ctcol').oninput=ev=>{D.color=ev.target.value;$$('.ctswb').forEach(x=>x.classList.remove('on'));ctLater();clearTimeout(ctTT);ctTT=setTimeout(ctThumbs,250)};
 $$('.ctform input:not([type=file]):not([name=cttpl]),.ctform textarea').forEach(i=>{i.addEventListener('input',ctLater);i.addEventListener('change',ctLater)});
 $$('.ctt').forEach(i=>i.addEventListener('focus',()=>CT.focus=i));
 $$('[data-ph]').forEach(b=>{b.onmousedown=ev=>ev.preventDefault();b.onclick=()=>{const i=CT.focus||$('#ct-body'),t=`{${b.dataset.ph}}`,a=i.selectionStart??i.value.length,z=i.selectionEnd??a;
  const pad=(a>0&&!/\s$/.test(i.value.slice(0,a))?' ':'');i.value=(i.value.slice(0,a)+pad+t+i.value.slice(z)).slice(0,+i.maxLength||600);i.focus();const p=a+pad.length+t.length;i.setSelectionRange(p,p);ctLater()}});
 $$('.ctimg').forEach(box=>{const k=box.dataset.k;
  const set=id=>{ctRead();if(k.startsWith('sign'))D.signs[+k.slice(4)].img=id;else D[k]=id;ctDraw()};
  $('input[type=file]',box).onchange=async ev=>{const f=ev.target.files[0];if(!f)return;box.classList.add('busy');
   try{const img=await prepImage(f);const d=await AAPI.call('/admin/upload',{method:'POST',body:{type:img.type,data:img.data}});set(d.id)}catch(err){toast(err.message,true);box.classList.remove('busy')}};
  const rm=$('.ctrm',box);if(rm)rm.onclick=()=>set('')});
 const add=$('.ctsadd');if(add)add.onclick=()=>{ctRead();D.signs.push({name:'',title:'',img:''});ctDraw()};
 $$('.ctsdel').forEach(b=>b.onclick=()=>{ctRead();D.signs.splice(+b.closest('.ctsign').dataset.i,1);ctDraw()});
 $('.ctsave').onclick=()=>ctSave(true);
 $$('[data-kind]').forEach(b=>b.onclick=()=>{ctRead();CT.kind=b.dataset.kind;CT.focus=null;CT.sel=null;ctDraw()});
 // copy another type's design (template, colours, logos, signatures, positions) but keep this type's wording
 $$('[data-copy]').forEach(b=>b.onclick=()=>{ctRead();const k=b.dataset.copy,src=JSON.parse(JSON.stringify(k==='win'?CT.D.win:k==='blank'?CT.D.blank:CT.D));delete src.win;delete src.blank;delete src.winners;
  const cur=ctCur(),keep={title:cur.title,subtitle:cur.subtitle,pre:cur.pre,body:cur.body};const next={...src,...keep,full:true};
  if(CT.kind==='part'){Object.keys(next).forEach(x=>{if(!['full'].includes(x))CT.D[x]=next[x]})}else if(CT.kind==='win')CT.D.win=next;else CT.D.blank=next;
  toast('Design copied. Wording kept.');ctDraw()});
 const who=$('#ctwho');if(who)who.onchange=ev=>{CT.who=ev.target.value;ctWho()};
 const comb=$('#ctcomb');if(comb)comb.onchange=ev=>CT.combined=ev.target.checked;
 $$('[data-bk]').forEach(c=>c.onchange=()=>{CT.blank[c.dataset.bk]=c.checked;ctCount()});
 const cp=$('#ctcopies');if(cp)cp.oninput=()=>{CT.copies=Math.min(500,Math.max(1,parseInt(cp.value,10)||1));ctCount()};
 $('.ctgo').onclick=ctGenerate;
}
async function ctSave(say){
 ctRead();const b=$('.ctsave');if(b)b.disabled=true;
 try{const d=await AAPI.call('/admin/events/'+CT.e.id,{method:'PATCH',body:{cert:CT.D}});CT.e.cert=(d.event||{}).cert||CT.D;const i=EVENTS.findIndex(x=>x.id===CT.e.id);if(i>=0)EVENTS[i].cert=CT.e.cert;
  CT.saved=JSON.stringify(CT.D);const s=$('.ctsaved');if(s)s.textContent='Saved ✓';if(say)toast('Certificate design saved');return true}
 catch(err){toast(err.message,true);return false}finally{if(b)b.disabled=false}
}
/* ---- moving parts in the preview: click to select, drag or use arrow keys, size slider ---- */
const CT_PARTS={logo:'Logo',logo2:'Second logo',logo3:'Event logo',org:'Organiser name',title:'Title',pre:'Line above the name',name:'Name',body:'Text',signs:'Signatures',seal:'Seal / medal',meta:'Certificate number'};
const ctLay=()=>{const D=ctCur();D.layout=D.layout||{};return D.layout[D.tpl]=D.layout[D.tpl]||{}};
const ctPart=k=>{const L=ctLay();return L[k]=L[k]||{x:0,y:0,s:1}};
function ctRender(){   // redraw the preview from what was last loaded (fast, used while dragging)
 const cv=$('.ctpv canvas');if(!cv||!CT.pv)return;const {P,imgs}=CT.pv;
 drawCert(cv,ctDesign(P.place),P,imgs);
 const ctx=cv.getContext('2d'),hits=cv._hits||[],k=cv.width/1000;
 const box=(h,col,dash)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=k*1.6;ctx.setLineDash(dash?[k*6,k*4]:[]);ctx.strokeRect(h.x0-k*5,h.y0-k*5,h.x1-h.x0+k*10,h.y1-h.y0+k*10);ctx.restore()};
 const hv=hits.find(h=>h.key===CT.hover&&h.key!==CT.sel);if(hv)box(hv,'rgba(91,63,217,.45)',true);
 const sl=hits.find(h=>h.key===CT.sel);if(sl){box(sl,'#5B3FD9',false);ctx.save();ctx.fillStyle='#5B3FD9';ctx.font=`700 ${k*11}px Montserrat`;const t=CT_PARTS[sl.key]||sl.key,w=ctx.measureText(t).width;ctx.fillRect(sl.x0-k*5,sl.y0-k*24,w+k*14,k*18);ctx.fillStyle='#fff';ctx.fillText(t,sl.x0+k*2,sl.y0-k*10.5);ctx.restore()}
}
function ctMoveBar(){
 const bar=$('.ctmove');if(!bar)return;const L=ctLay(),moved=Object.keys(L).length;
 if(!CT.sel){bar.innerHTML=`<p class="small">✋ Click any part of the certificate (name, logo, title…) to move or resize it.${moved?' <button type="button" class="linkbtn ctrall">Reset all positions</button>':''}</p>`}
 else{const o=ctPart(CT.sel);bar.innerHTML=`<div class="ctmv"><b>${esc(CT_PARTS[CT.sel]||CT.sel)}</b>
  <label class="ctsz">Size <input type="range" min="30" max="250" step="5" value="${Math.round((o.s||1)*100)}" aria-label="Size"><span>${Math.round((o.s||1)*100)}%</span></label>
  <span class="ctnudge"><button type="button" class="btn sm ghost" data-nd="-1,0" aria-label="Move left">←</button><button type="button" class="btn sm ghost" data-nd="0,-1" aria-label="Move up">↑</button><button type="button" class="btn sm ghost" data-nd="0,1" aria-label="Move down">↓</button><button type="button" class="btn sm ghost" data-nd="1,0" aria-label="Move right">→</button></span>
  <button type="button" class="linkbtn ctr1">Reset</button><button type="button" class="linkbtn ctdone">Done</button></div>
  <p class="small">Drag it in the preview, or use the arrow keys (hold Shift for bigger steps). Positions are saved for the ${esc((CERT_TPLS.find(t=>t[0]===ctCur().tpl)||[])[1]||'')} template.</p>`}
 const ra=$('.ctrall',bar);if(ra)ra.onclick=()=>{const D=ctCur();D.layout[D.tpl]={};ctRender();ctMoveBar();ctMark()};
 const rng=$('input[type=range]',bar);if(rng)rng.oninput=()=>{ctPart(CT.sel).s=+rng.value/100;$('.ctsz span',bar).textContent=rng.value+'%';ctRender();ctMark()};
 $$('[data-nd]',bar).forEach(b=>b.onclick=ev=>{const [x,y]=b.dataset.nd.split(',').map(Number);ctNudge(x,y,ev.shiftKey)});
 const r1=$('.ctr1',bar);if(r1)r1.onclick=()=>{delete ctLay()[CT.sel];ctRender();ctMoveBar();ctMark()};
 const dn=$('.ctdone',bar);if(dn)dn.onclick=()=>{CT.sel=null;ctRender();ctMoveBar()};
}
function ctNudge(x,y,big){if(!CT.sel)return;const o=ctPart(CT.sel),st=big?.01:.002;o.x=+(o.x+x*st).toFixed(4);o.y=+(o.y+y*st*1.414).toFixed(4);ctRender();ctMark()}
function ctBindMove(){
 const cv=$('.ctpv canvas');if(!cv)return;
 const at=ev=>{const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)/r.width*cv.width,(ev.clientY-r.top)/r.height*cv.height]};
 const hitAt=([x,y])=>{const pad=cv.width/200;return [...(cv._hits||[])].reverse().find(h=>x>=h.x0-pad&&x<=h.x1+pad&&y>=h.y0-pad&&y<=h.y1+pad)};
 let drag=null,raf=0;const later=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;ctRender()})};
 cv.onpointerdown=ev=>{const p=at(ev),h=hitAt(p);if(!h){if(CT.sel){CT.sel=null;ctRender();ctMoveBar()}return}
  ev.preventDefault();cv.focus();if(CT.sel!==h.key){CT.sel=h.key;ctMoveBar()}const o=ctPart(h.key);drag={p,x:o.x,y:o.y,id:ev.pointerId};cv.setPointerCapture(ev.pointerId);later()};
 cv.onpointermove=ev=>{const p=at(ev);
  if(drag){const o=ctPart(CT.sel);o.x=+(drag.x+(p[0]-drag.p[0])/cv.width).toFixed(4);o.y=+(drag.y+(p[1]-drag.p[1])/cv.height).toFixed(4);later();return}
  const h=hitAt(p),k=h?h.key:null;cv.style.cursor=h?'move':'default';if(k!==CT.hover){CT.hover=k;later()}};
 const end=()=>{if(drag){drag=null;ctMark()}};cv.onpointerup=end;cv.onpointercancel=end;
 cv.onpointerleave=()=>{if(!drag&&CT.hover){CT.hover=null;later()}};
 cv.onkeydown=ev=>{const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];if(m&&CT.sel){ev.preventDefault();ctNudge(m[0],m[1],ev.shiftKey)}else if(ev.key==='Escape'&&CT.sel){CT.sel=null;ctRender();ctMoveBar()}};
}
let ctPvN=0;
async function ctPreview(){
 const cv=$('.ctpv canvas');if(!cv)return;const n=++ctPvN;
 const items=ctItems(),all=ctPeople(),sample=all[0]||{name:'Aisha Rahman',ref:'AQ-000000-1',answers:{}};
 let it=items[0]||{P:CT.kind==='blank'?ctP(sample,0,true):ctP(sample,CT.kind==='win'?CT.wplace:0)};
 if(CT.kind==='win'){   // show the place chosen above: the winner clicked in the list, else the first winner with that place, else a sample
  it=items.find(x=>x.P.ref===CT.pvRef&&x.P.place===CT.wplace)||items.find(x=>x.P.place===CT.wplace)||{P:ctP(sample,CT.wplace)}}
 const imgs=await ctLoadImgs();if(n!==ctPvN)return;
 CT.pv={P:it.P,imgs};ctRender();
 const t=$('.ctpvn');if(t)t.textContent=it.P.blank?`Preview: blank ${it.P.place?ctRank(it.P.place):'participation'} certificate`:items[0]||all[0]?`Preview with ${it.P.name}'s details${it.P.place?' · '+ctRank(it.P.place):''}`:'Preview with a sample name';
}
function ctWho(){
 const box=$('.ctpick'),all=ctPeople();
 if(CT.who!=='pick'){box.innerHTML='';return ctCount()}
 const q=CT.q.toLowerCase(),shown=all.filter(p=>!q||(p.name+' '+p.ref+' '+(p.booker||'')).toLowerCase().includes(q));
 box.innerHTML=`<div class="ctpbar"><input type="search" class="ctq" placeholder="Search name or ref" value="${esc(CT.q)}"><button type="button" class="linkbtn ctall">Select shown</button><button type="button" class="linkbtn ctnone">Clear</button></div>
  <div class="ctlist">${shown.map(p=>`<label class="chk"><input type="checkbox" data-k="${esc(p.key)}" ${CT.picked.has(p.key)?'checked':''}> <span>${esc(p.name)} <small>${esc(p.ref)}${p.ok?'':' · not confirmed'}${p.in?' · checked in':''}</small></span></label>`).join('')||'<p class="small">Nobody matches.</p>'}</div>`;
 const q2=$('.ctq',box);q2.oninput=()=>{CT.q=q2.value;const pos=q2.selectionStart;ctWho();const n=$('.ctq');n.focus();n.setSelectionRange(pos,pos)};
 $$('[data-k]',box).forEach(c=>c.onchange=()=>{c.checked?CT.picked.add(c.dataset.k):CT.picked.delete(c.dataset.k);ctCount()});
 $('.ctall',box).onclick=()=>{shown.forEach(p=>CT.picked.add(p.key));ctWho()};
 $('.ctnone',box).onclick=()=>{CT.picked.clear();ctWho()};
 ctCount();
}
function ctCount(){const items=ctItems(),n=items.length,pages=items.reduce((t,x)=>t+(x.copies||1),0);
 $('.ctcount').innerHTML=!n?(CT.kind==='win'?'No winners added yet.':CT.kind==='blank'?'Tick at least one certificate.':'Nobody selected yet.'):CT.kind==='blank'?`<b>${n}</b> PDF${n===1?'':'s'} with <b>${CT.copies}</b> cop${CT.copies===1?'y':'ies'} each (${pages} A4 page${pages===1?'':'s'}).`:`<b>${n}</b> certificate${n===1?'':'s'} will be made, each as its own A4 PDF.`;
 $('.ctgo').disabled=!n||CT.busy;ctPreview()}
/* winners: give people 1st, 2nd or 3rd place (more than one person can share a place, e.g. one per category) */
function ctWin(){
 const box=$('.ctwin'),all=ctPeople(),D=CT.D,by=new Map(all.map(p=>[p.ref,p]));
 const q=CT.wq.toLowerCase().trim(),taken=new Set(D.winners.map(w=>w.ref));
 const hits=q?all.filter(p=>!taken.has(p.ref)&&(p.name+' '+p.ref+' '+Object.values(p.answers).join(' ')+' '+(p.booker||'')).toLowerCase().includes(q)).slice(0,8):[];
 const info=p=>Object.entries(p.answers).filter(([,v])=>String(v).length<40).slice(0,2).map(([,v])=>v).join(' · ');
 box.innerHTML=`<div class="field"><label>Add a winner</label><div class="ctplaces">${[1,2,3].map(k=>`<label class="radio"><input type="radio" name="ctpl" value="${k}" ${CT.wplace===k?'checked':''}><span>${['','🥇','🥈','🥉'][k]} ${ctRank(k)}</span></label>`).join('')}</div>
  <input type="search" class="ctwq" placeholder="Search name, ref or answer (e.g. a category)" value="${esc(CT.wq)}"></div>
  ${q?`<div class="ctlist">${hits.map(p=>`<div class="cthit"><span>${esc(p.name)} <small>${esc(p.ref)}${info(p)?' · '+esc(info(p)):''}</small></span><button type="button" class="btn sm" data-add="${esc(p.ref)}">+ ${ctRank(CT.wplace)}</button></div>`).join('')||'<p class="small">Nobody matches (or already a winner).</p>'}</div>`:''}
  ${[1,2,3].map(k=>{const ws=D.winners.filter(w=>w.place===k&&by.get(w.ref));return ws.length?`<div class="ctwg"><h3>${['','🥇','🥈','🥉'][k]} ${ctRank(k)}</h3>${ws.map(w=>{const p=by.get(w.ref);return `<div class="cthit"><span><button type="button" class="linkbtn ctpvw" data-pv="${esc(p.ref)}" data-pl="${k}" title="Show in the preview">${esc(p.name)}</button> <small>${esc(p.ref)}${info(p)?' · '+esc(info(p)):''}</small></span><button type="button" class="linkbtn" data-del="${esc(w.ref)}" aria-label="Remove ${esc(p.name)}">Remove</button></div>`}).join('')}</div>`:''}).join('')}`;
 $$('input[name=ctpl]',box).forEach(r=>r.onchange=()=>{CT.wplace=+r.value;CT.pvRef=null;ctWin()});
 const s=$('.ctwq',box);s.oninput=()=>{CT.wq=s.value;const pos=s.selectionStart;ctWin();const n=$('.ctwq');n.focus();n.setSelectionRange(pos,pos)};
 $$('[data-add]',box).forEach(b=>b.onclick=()=>{D.winners.push({ref:b.dataset.add,place:CT.wplace});CT.wq='';ctWin();ctMark();$('.ctwq').focus()});
 $$('[data-pv]',box).forEach(b=>b.onclick=()=>{CT.pvRef=b.dataset.pv;CT.wplace=+b.dataset.pl;ctWin()});
 $$('[data-del]',box).forEach(b=>b.onclick=()=>{D.winners=D.winners.filter(w=>w.ref!==b.dataset.del);ctWin();ctMark()});
 ctCount();
}

/* ---- generate: draw → PDF (A4 landscape) → ZIP ---- */
async function ctGenerate(){
 if(CT.busy)return;const list=ctItems();if(!list.length)return;
 CT.busy=true;const go=$('.ctgo'),pg=$('.ctprog'),bar=$('.ctbar i'),msg=$('.ctprog p');go.disabled=true;pg.hidden=false;
 const say=(t,f)=>{msg.textContent=t;bar.style.width=Math.round(f*100)+'%'};
 try{
  say('Saving the design…',0);await ctSave(false);
  say('Getting ready…',0);await Promise.all([ctScript('/js/vendor/jspdf.umd.min.js'),ctScript('/js/vendor/jszip.min.js'),certLoadFonts()]);
  const imgs=await ctLoadImgs(),{jsPDF}=window.jspdf,zip=new JSZip();
  const cv=document.createElement('canvas');cv.width=2480;cv.height=1754;   // A4 at about 212 dpi
  const all=CT.combined&&CT.kind!=='blank'&&list.length>1?new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true}):null;
  const used=new Set(),safe=s=>String(s).replace(/[\\/:*?"<>|\x00-\x1f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,70)||'Certificate';
  const pad=String(list.length).length<3?3:String(list.length).length;
  for(let i=0;i<list.length;i++){
   const it=list[i],P=it.P,Dk=ctDesign(P.place);say(`Making ${i+1} of ${list.length}: ${it.file}`,i/list.length);
   drawCert(cv,Dk,P,imgs);const jpg=cv.toDataURL('image/jpeg',.9);
   const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
   doc.setProperties({title:`${Dk.title||'Certificate'} – ${P.name||it.file}`,subject:CT.e.title,author:ctCur().org||'',creator:'Aqlyon'});
   for(let c=0;c<(it.copies||1);c++){if(c)doc.addPage('a4','landscape');doc.addImage(jpg,'JPEG',0,0,297,210,'cert','FAST')}   // the same image is stored once however many copies
   let fn=it.num?`${String(i+1).padStart(pad,'0')} - ${safe(it.file)}`:safe(it.file);if(used.has(fn))fn+=' '+P.ref;used.add(fn);
   zip.file(fn+'.pdf',doc.output('arraybuffer'));
   if(all){if(i)all.addPage('a4','landscape');all.addImage(jpg,'JPEG',0,0,297,210,undefined,'FAST')}
   if(i%4===3)await new Promise(r=>setTimeout(r,0));   // let the page breathe
  }
  if(all){all.setProperties({title:`${CT.e.title} – certificates`,creator:'Aqlyon'});zip.file(`All ${CT.kind==='win'?'winner ':''}certificates (${list.length}).pdf`,all.output('arraybuffer'))}
  say('Packing the ZIP file…',.99);
  const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${CT.e.slug||'event'}-${CT.kind==='win'?'winner-certificates':CT.kind==='blank'?'blank-certificates':'certificates'}.zip`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),8000);
  say(`Done: ${list.length} PDF${list.length===1?'':'s'} downloaded (${(blob.size/1048576).toFixed(1)} MB).`,1);toast('Certificates downloaded');
 }catch(err){say('Something went wrong: '+err.message,0);toast(err.message,true)}
 finally{CT.busy=false;go.disabled=false}
}
