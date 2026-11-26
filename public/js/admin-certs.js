/* =====================================================================
   Admin → event → 🎓 Certificates
   Design the certificate (saved on the event as e.cert), preview it live, pick who gets one,
   then Generate: every certificate is drawn in the browser (cert-render.js), placed on an A4
   landscape PDF page, and all PDFs are downloaded together in one ZIP file.
   Nothing is made or sent automatically.
   ===================================================================== */
const CT={e:null,D:null,regs:[],who:'ok',picked:new Set(),q:'',combined:true,imgs:{},busy:false,focus:null};
const ctLoaded={};
function ctScript(src){return ctLoaded[src]||(ctLoaded[src]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>{delete ctLoaded[src];no(new Error('Could not load '+src))};document.head.appendChild(s)}))}
const ctImg=id=>{if(!id)return Promise.resolve(null);return new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src='/api/img/'+id})};
async function ctLoadImgs(){const D=CT.D,ids={logo:D.logo,logo2:D.logo2};(D.signs||[]).forEach((s,i)=>ids['sign'+i]=s.img);
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
function ctP(p){
 const e=CT.e,D=CT.D,iss=D.issued?ctDay(D.issued):ctDay(e.end||e.start)||new Date();
 return {name:p.name,event:e.title,date:ctDateText(e),venue:e.mode==='online'?'Online':(e.locationName||''),organiser:D.org||'',ref:p.ref,
  issued:iss?iss.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'',year:iss?iss.getFullYear():new Date().getFullYear(),answers:p.answers};
}
const ctChosen=()=>{const all=ctPeople();return CT.who==='pick'?all.filter(p=>CT.picked.has(p.key)):CT.who==='in'?all.filter(p=>p.ok&&p.in):all.filter(p=>p.ok)};

/* ---- page ---- */
async function certView(e){
 const main=$('.adm');CT.e=e;CT.D=JSON.parse(JSON.stringify({...CERT_DEFAULT,org:(e.badge&&e.badge.org)||'',...(e.cert||{})}));
 if(!CT.D.signs||!CT.D.signs.length)CT.D.signs=[{name:'',title:'',img:''}];
 main.innerHTML=`${evHeadHTML(e,'certs')}<p class="lead">Loading…</p>`;bindEvHead(e);history.replaceState(null,'','#events/'+e.id+'/certificates');
 try{CT.regs=(await AAPI.call(`/admin/events/${e.id}/regs`)).regs}catch(err){CT.regs=[];toast(err.message,true)}
 CT.picked=new Set();CT.q='';CT.saved=JSON.stringify(CT.D);
 ctDraw();certLoadFonts().then(ctPreview);
}
function ctDraw(){
 const e=CT.e,D=CT.D,main=$('.adm');
 const chips=[['name','Name'],['event','Event name'],['date','Event date'],['venue','Venue'],['organiser','Organiser'],['ref','Ref no.'],...ctQFields(e).map(f=>[f.label,f.label])];
 const sw=['#0D2B22','#123E7C','#0B1F3A','#6B1E2E','#3B2A6B','#7A4A12','#1F2937','#0F5257'];
 const tx=(id,label,val,max,hint)=>`<div class="field"><label for="${id}">${label}${hint?` <small>${hint}</small>`:''}</label><input id="${id}" class="ctt" maxlength="${max}" value="${esc(val||'')}"></div>`;
 const imgBox=(k,label,id)=>`<div class="ctimg" data-k="${k}">${id?`<img src="/api/img/${id}" alt="">`:'<span>None</span>'}<label class="btn sm ghost">${id?'Change':'Upload'} ${label}<input type="file" accept="image/*" hidden></label>${id?'<button type="button" class="linkbtn ctrm">Remove</button>':''}</div>`;
 main.innerHTML=`${evHeadHTML(e,'certs')}
 <div class="ctwrap">
 <div class="ctform">
  <fieldset class="qset"><legend>Design</legend>
   <div class="cttpls">${CERT_TPLS.map(([v,n,d])=>`<label class="cttpl ${D.tpl===v?'on':''}" title="${esc(d)}"><input type="radio" name="cttpl" value="${v}" ${D.tpl===v?'checked':''}>${CERT_ART[v]?`<img src="/img/cert/${v}-thumb.jpg" alt="" loading="lazy">`:`<canvas width="360" height="255" data-tpl="${v}"></canvas>`}<b>${n}</b></label>`).join('')}</div>
   <div class="field ctcolf" ${CERT_ART[D.tpl]?'hidden':''}><label>Main colour</label><div class="ctsw">${sw.map(c=>`<button type="button" class="ctswb ${D.color.toLowerCase()===c.toLowerCase()?'on':''}" data-c="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<input type="color" id="ctcol" value="${esc(D.color)}" aria-label="Pick any colour"></div></div>
   <div class="field"><label>Name written in</label><div class="rrow"><label class="radio"><input type="radio" name="ctns" value="script" ${!['serif','sans'].includes(D.nameStyle)?'checked':''}><span>Handwriting style</span></label><label class="radio"><input type="radio" name="ctns" value="serif" ${D.nameStyle==='serif'?'checked':''}><span>Classic serif</span></label><label class="radio"><input type="radio" name="ctns" value="sans" ${D.nameStyle==='sans'?'checked':''}><span>Modern bold</span></label></div></div>
  </fieldset>
  <fieldset class="qset"><legend>Wording</legend>
   ${tx('ct-title','Title',D.title,40)}${tx('ct-sub','Second line',D.subtitle,60,'e.g. of Participation, of Achievement, of Appreciation')}
   ${tx('ct-pre','Line above the name',D.pre,120)}
   <div class="field"><label for="ct-body">Text below the name</label><textarea id="ct-body" class="ctt" rows="3" maxlength="600">${esc(D.body)}</textarea></div>
   <div class="ctchips"><small>Insert into the box you are typing in:</small>${chips.map(([k,l])=>`<button type="button" class="chip" data-ph="${esc(k)}">{${esc(l)}}</button>`).join('')}</div>
   ${tx('ct-foot','Small line at the bottom',D.footer,160,'optional')}
  </fieldset>
  <fieldset class="qset"><legend>Organiser</legend>
   ${tx('ct-org','Organiser name',D.org,90,'shown at the top')}
   <div class="ctimgs">${imgBox('logo','logo',D.logo)}${imgBox('logo2','second logo',D.logo2)}</div>
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
  <div class="ctpv"><canvas width="1400" height="990" aria-label="Certificate preview"></canvas><p class="small ctpvn"></p></div>
  <section class="ctgen"><h2>Generate certificates</h2>
   <div class="field"><label for="ctwho">Who gets one</label><select id="ctwho"><option value="ok" ${CT.who==='ok'?'selected':''}>Everyone confirmed</option><option value="in" ${CT.who==='in'?'selected':''}>Only people who checked in</option><option value="pick" ${CT.who==='pick'?'selected':''}>Choose people…</option></select></div>
   <div class="ctpick"></div>
   <label class="chk"><input type="checkbox" id="ctcomb" ${CT.combined?'checked':''}> Also add one PDF with all certificates (easy to print in one go)</label>
   <p class="ctcount"></p>
   <button type="button" class="btn ctgo">🎓 Generate &amp; download ZIP</button>
   <div class="ctprog" hidden><div class="ctbar"><i></i></div><p class="small"></p></div>
  </section>
 </div></div>`;
 ctBind();ctWho();ctPreview();ctMark();certLoadFonts().then(ctThumbs);
}
// small previews of the drawn templates in the chosen colour (picture templates use their own thumbnail)
let ctTT=null;
function ctThumbs(){$$('.cttpl canvas').forEach(c=>drawCert(c,{...CERT_DEFAULT,tpl:c.dataset.tpl,color:CT.D.color,body:'',pre:'',signs:[{name:' ',title:''}],showId:false},{name:'Your Name',year:new Date().getFullYear(),answers:{}},{}))}
function ctRead(){
 const D=CT.D,v=s=>$(s).value;
 D.title=v('#ct-title');D.subtitle=v('#ct-sub');D.pre=v('#ct-pre');D.body=v('#ct-body');D.footer=v('#ct-foot');D.org=v('#ct-org');
 D.showId=$('#ct-id').checked;D.issued=v('#ct-iss');D.nameStyle=($('input[name=ctns]:checked')||{}).value||'script';
 $$('.ctsign').forEach(el=>{const s=D.signs[+el.dataset.i];if(s){s.name=$('.ctsn',el).value;s.title=$('.ctst',el).value}});
}
const ctMark=()=>{const s=$('.ctsaved');if(!s)return;if(JSON.stringify(CT.D)!==CT.saved)s.textContent='Not saved yet';else if(s.textContent==='Not saved yet')s.textContent=''};
let ctT=null;const ctLater=()=>{clearTimeout(ctT);ctT=setTimeout(()=>{ctRead();ctPreview();ctMark()},180)};
function ctBind(){
 const D=CT.D;
 $$('input[name=cttpl]').forEach(r=>r.onchange=()=>{D.tpl=r.value;$$('.cttpl').forEach(l=>l.classList.toggle('on',l.contains(r)));$('.ctcolf').hidden=!!CERT_ART[D.tpl];ctLater()});
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
 $('#ctwho').onchange=ev=>{CT.who=ev.target.value;ctWho()};
 $('#ctcomb').onchange=ev=>CT.combined=ev.target.checked;
 $('.ctgo').onclick=ctGenerate;
}
async function ctSave(say){
 ctRead();const b=$('.ctsave');if(b)b.disabled=true;
 try{const d=await AAPI.call('/admin/events/'+CT.e.id,{method:'PATCH',body:{cert:CT.D}});CT.e.cert=(d.event||{}).cert||CT.D;const i=EVENTS.findIndex(x=>x.id===CT.e.id);if(i>=0)EVENTS[i].cert=CT.e.cert;
  CT.saved=JSON.stringify(CT.D);const s=$('.ctsaved');if(s)s.textContent='Saved ✓';if(say)toast('Certificate design saved');return true}
 catch(err){toast(err.message,true);return false}finally{if(b)b.disabled=false}
}
let ctPvN=0;
async function ctPreview(){
 const cv=$('.ctpv canvas');if(!cv)return;const n=++ctPvN;
 const all=ctPeople(),list=ctChosen(),p=list[0]||all[0]||{name:'Aisha Rahman',ref:'AQ-000000-1',answers:{}};
 const imgs=await ctLoadImgs();if(n!==ctPvN)return;
 drawCert(cv,CT.D,ctP(p),imgs);
 const t=$('.ctpvn');if(t)t.textContent=list[0]||all[0]?`Preview with ${p.name}'s details`:'Preview with a sample name';
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
function ctCount(){const n=ctChosen().length;$('.ctcount').innerHTML=n?`<b>${n}</b> certificate${n===1?'':'s'} will be made, each as its own A4 PDF.`:'Nobody selected yet.';$('.ctgo').disabled=!n||CT.busy;ctPreview()}

/* ---- generate: draw → PDF (A4 landscape) → ZIP ---- */
async function ctGenerate(){
 if(CT.busy)return;const list=ctChosen();if(!list.length)return;
 CT.busy=true;const go=$('.ctgo'),pg=$('.ctprog'),bar=$('.ctbar i'),msg=$('.ctprog p');go.disabled=true;pg.hidden=false;
 const say=(t,f)=>{msg.textContent=t;bar.style.width=Math.round(f*100)+'%'};
 try{
  say('Saving the design…',0);await ctSave(false);
  say('Getting ready…',0);await Promise.all([ctScript('/js/vendor/jspdf.umd.min.js'),ctScript('/js/vendor/jszip.min.js'),certLoadFonts()]);
  const imgs=await ctLoadImgs(),{jsPDF}=window.jspdf,zip=new JSZip();
  const cv=document.createElement('canvas');cv.width=2480;cv.height=1754;   // A4 at about 212 dpi
  const all=CT.combined&&list.length>1?new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true}):null;
  const used=new Set(),safe=s=>String(s).replace(/[\\/:*?"<>|\x00-\x1f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,70)||'Certificate';
  const pad=String(list.length).length<3?3:String(list.length).length;
  for(let i=0;i<list.length;i++){
   const p=list[i];say(`Making ${i+1} of ${list.length}: ${p.name}`,i/list.length);
   drawCert(cv,CT.D,ctP(p),imgs);const jpg=cv.toDataURL('image/jpeg',.9);
   const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
   doc.setProperties({title:`${CT.D.title||'Certificate'} – ${p.name}`,subject:CT.e.title,author:CT.D.org||'',creator:'Aqlyon'});
   doc.addImage(jpg,'JPEG',0,0,297,210,undefined,'FAST');
   let fn=`${String(i+1).padStart(pad,'0')} - ${safe(p.name)}`;if(used.has(fn))fn+=' '+p.ref;used.add(fn);
   zip.file(fn+'.pdf',doc.output('arraybuffer'));
   if(all){if(i)all.addPage('a4','landscape');all.addImage(jpg,'JPEG',0,0,297,210,undefined,'FAST')}
   if(i%4===3)await new Promise(r=>setTimeout(r,0));   // let the page breathe
  }
  if(all){all.setProperties({title:`${CT.e.title} – certificates`,creator:'Aqlyon'});zip.file(`All certificates (${list.length}).pdf`,all.output('arraybuffer'))}
  say('Packing the ZIP file…',.99);
  const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${CT.e.slug||'event'}-certificates.zip`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),8000);
  say(`Done: ${list.length} certificate${list.length===1?'':'s'} downloaded (${(blob.size/1048576).toFixed(1)} MB).`,1);toast('Certificates downloaded');
 }catch(err){say('Something went wrong: '+err.message,0);toast(err.message,true)}
 finally{CT.busy=false;go.disabled=false}
}
