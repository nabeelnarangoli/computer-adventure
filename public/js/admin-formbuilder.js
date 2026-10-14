/* =====================================================================
   Admin: registration form builder (like Google Forms) inside the event editor.
   Name, email and mobile are always asked. WhatsApp, country, education level and
   student/parent can be switched off. "＋ Add field" opens a picker where any number of
   question types and ready-made questions can be ticked and added at once.
   ===================================================================== */
const FB_STD=[['whatsapp','WhatsApp number'],['country','Country'],['education','Education level'],['role','Student or parent']];
const FB_VALID=[['text','Any text'],['number','Number'],['email','Email address'],['url','Web link'],['phone','Phone number']];

function formBuilder(box,FORM,ev){
 const fields=()=>FORM.fields;
 const optEditor=(f,key,label,addLabel)=>`<div class="fbopts" data-list="${key}"><p class="fbsub">${label}</p>${(f[key]||[]).map((o,i)=>`<div class="fbopt"><span class="fbmark">${key==='options'?(f.type==='checkboxes'?'☐':f.type==='dropdown'?(i+1)+'.':'◯'):key==='rows'?(i+1)+'.':'▢'}</span><input value="${esc(o)}" data-o="${i}" maxlength="${key==='options'?120:80}" aria-label="${label} ${i+1}"><button type="button" class="fbx" data-rmo="${i}" aria-label="Remove">×</button></div>`).join('')}
  <div class="fboptadd"><button type="button" class="linkbtn" data-addo>＋ ${addLabel}</button><button type="button" class="linkbtn" data-paste>Paste a list</button>${key==='options'&&f.type!=='dropdown'?`<label class="fbinl"><input type="checkbox" data-k="other" ${f.other?'checked':''}> Add "Other" with a text box</label>`:''}</div></div>`;
 const editor=f=>{
  switch(f.type){
   case 'choice':case 'checkboxes':case 'dropdown':return optEditor(f,'options','Options','Add option');
   case 'short':return `<div class="fbrow"><label>Answer must be<select data-k="valid">${FB_VALID.map(([v,t])=>`<option value="${v}" ${f.valid===v?'selected':''}>${t}</option>`).join('')}</select></label>${f.valid==='number'?`<label>Lowest<input type="number" data-k="min" value="${f.min??''}"></label><label>Highest<input type="number" data-k="max" value="${f.max??''}"></label>`:''}</div>`;
   case 'scale':return `<div class="fbrow"><label>From<select data-k="scaleMin">${[0,1].map(n=>`<option ${+f.scaleMin===n?'selected':''}>${n}</option>`).join('')}</select></label><label>To<select data-k="scaleMax">${[2,3,4,5,6,7,8,9,10].map(n=>`<option ${+f.scaleMax===n?'selected':''}>${n}</option>`).join('')}</select></label><label>Label at the start<input data-k="minLabel" maxlength="40" value="${esc(f.minLabel||'')}" placeholder="e.g. Not at all"></label><label>Label at the end<input data-k="maxLabel" maxlength="40" value="${esc(f.maxLabel||'')}" placeholder="e.g. Very much"></label></div>`;
   case 'rating':return `<div class="fbrow"><label>Number of stars<select data-k="stars">${[3,4,5,6,7,8,9,10].map(n=>`<option ${+f.stars===n?'selected':''}>${n}</option>`).join('')}</select></label></div>`;
   case 'grid':case 'checkgrid':return `<div class="fbgrid">${optEditor(f,'rows','Rows','Add row')}${optEditor(f,'cols','Columns','Add column')}</div>`;
   case 'file':return `<div class="fbrow"><label>Allowed files<select data-k="accept">${[['image,pdf','Photo or PDF'],['image','Photo only'],['pdf','PDF only']].map(([v,t])=>`<option value="${v}" ${f.accept===v?'selected':''}>${t}</option>`).join('')}</select></label><p class="fbsub">Up to 3 MB per file. You can open the files from Registrations.</p></div>`;
  }
  return '';
 };
 const card=(f,i)=>`<div class="fbcard ${f.type==='section'?'sec':''}" data-i="${i}">
  <div class="fbtop"><span class="fbnum">${f.type==='section'?'T':i+1}</span><input class="fblabel" data-k="label" value="${esc(f.label)}" placeholder="${f.type==='section'?'Section title':'Question'}" maxlength="200" aria-label="Question">
   <select class="fbtype" data-type aria-label="Question type">${FF.TYPES.map(t=>`<option value="${t.t}" ${f.type===t.t?'selected':''}>${t.ic} ${t.name}</option>`).join('')}</select></div>
  <input class="fbhelp" data-k="help" value="${esc(f.help||'')}" placeholder="${f.type==='section'?'Description (optional)':'Description or hint (optional)'}" maxlength="500" aria-label="Description">
  ${editor(f)}
  <div class="fbfoot">${f.type==='section'?'':`<label class="fbreq"><input type="checkbox" data-k="required" ${f.required?'checked':''}><span>Required</span></label>`}
   <span class="fbtools"><button type="button" data-mv="-1" ${i?'':'disabled'} aria-label="Move up" title="Move up">↑</button><button type="button" data-mv="1" ${i<fields().length-1?'':'disabled'} aria-label="Move down" title="Move down">↓</button><button type="button" data-dup aria-label="Duplicate" title="Duplicate">⧉</button><button type="button" data-del aria-label="Delete" title="Delete">🗑</button></span></div></div>`;
 const draw=()=>{
  box.innerHTML=`<div class="fbhead"><b>Registration form</b><small>Choose the questions people answer when they register.</small></div>
  <div class="fbfixed">${['Full name','Email','Mobile number'].map(t=>`<span class="fbchip lock" title="Always asked">🔒 ${t}</span>`).join('')}
   ${FB_STD.map(([k,t])=>`<label class="fbchip tog ${FORM.std[k]?'on':''}"><input type="checkbox" data-std="${k}" ${FORM.std[k]?'checked':''}><span>${t}</span></label>`).join('')}</div>
  <p class="fbsub">🔒 Always asked (needed for the badge and emails). Tap the others to switch them on or off.</p>
  <div class="fbcards">${fields().map(card).join('')}</div>
  ${fields().length?'':'<p class="fbempty">No extra questions yet.</p>'}
  <div class="fbbtns"><button type="button" class="btn sm fbadd">＋ Add field</button><button type="button" class="btn ghost sm fbprev">👁 Preview form</button></div>`;
  bind();
 };
 const bind=()=>{
  $$('[data-std]',box).forEach(c=>c.onchange=()=>{FORM.std[c.dataset.std]=c.checked;c.closest('.fbchip').classList.toggle('on',c.checked)});
  $('.fbadd',box).onclick=()=>fbPicker(FORM,added=>{FORM.fields.push(...added);draw();const cs=$$('.fbcard',box);const first=cs[cs.length-added.length];if(first){mScroll(first);first.classList.add('fbnew');const l=$('.fblabel',first);if(l&&!l.value)l.focus({preventScroll:true})}});
  $('.fbprev',box).onclick=()=>fbPreview(FORM,ev);
  $$('.fbcard',box).forEach(c=>{const i=+c.dataset.i,f=fields()[i];
   $$('[data-k]',c).forEach(inp=>{const k=inp.dataset.k;const up=()=>{let v=inp.type==='checkbox'?inp.checked:inp.value;if(['scaleMin','scaleMax','stars'].includes(k))v=+v;f[k]=v;if(k==='valid')draw()};inp.oninput=up;inp.onchange=up});
   $('[data-type]',c).onchange=x=>{const t=x.target.value,nb=FF.blank(t);const keep={id:f.id,label:f.label,help:f.help,required:t==='section'?false:f.required};
    if(FF.OPT_TYPES.includes(t)&&f.options)keep.options=f.options;fields()[i]={...nb,...keep};draw()};
   $$('[data-list]',c).forEach(L=>{const key=L.dataset.list;
    $$('[data-o]',L).forEach(inp=>inp.oninput=()=>{f[key][+inp.dataset.o]=inp.value});
    $$('[data-o]',L).forEach(inp=>inp.onkeydown=k=>{if(k.key==='Enter'){k.preventDefault();f[key].splice(+inp.dataset.o+1,0,'');draw();const n=$$(`.fbcard[data-i="${i}"] [data-list="${key}"] [data-o]`,box)[+inp.dataset.o+1];if(n)n.focus({preventScroll:true})}});
    $$('[data-rmo]',L).forEach(b=>b.onclick=()=>{if(f[key].length<=1)return toast('Keep at least one.',true);f[key].splice(+b.dataset.rmo,1);draw()});
    $('[data-addo]',L).onclick=()=>{const n=f[key].length+1;f[key].push(key==='options'?'Option '+n:key==='rows'?'Row '+n:'Column '+n);draw();const ins=$$(`.fbcard[data-i="${i}"] [data-list="${key}"] [data-o]`,box);const last=ins[ins.length-1];if(last){last.focus({preventScroll:true});last.select()}};
    $('[data-paste]',L).onclick=()=>modal(`<h2>Paste a list</h2><p class="small">One item per line. This replaces the current ${key==='options'?'options':key}.</p><textarea class="pastebox" rows="8">${esc(f[key].join('\n'))}</textarea><div class="mrow"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn pasteok">Use this list</button></div>`,(pm,close)=>{const ta=$('.pastebox',pm);ta.focus();$('.pasteok',pm).onclick=()=>{const items=[...new Set(ta.value.split('\n').map(x=>x.trim()).filter(Boolean))];if(!items.length)return toast('The list is empty.',true);f[key]=items.slice(0,key==='options'?50:20);close();draw()}});
   });
   $$('[data-mv]',c).forEach(b=>b.onclick=()=>{const j=i+ +b.dataset.mv;if(j<0||j>=fields().length)return;[fields()[i],fields()[j]]=[fields()[j],fields()[i]];draw()});
   $('[data-dup]',c).onclick=()=>{const copyF={...JSON.parse(JSON.stringify(f)),id:FF.nid()};fields().splice(i+1,0,copyF);draw()};
   $('[data-del]',c).onclick=async()=>{if(ev&&ev.counts&&ev.counts.total&&f.type!=='section'&&!await confirmBox('Delete this question?',`Answers already given to <b>${esc(f.label||'this question')}</b> will no longer show in Registrations or the Excel file.`,'Delete question',true))return;fields().splice(i,1);draw()};
  });
 };
 draw();
}

/* picker: tick any number of question types and ready-made questions, then add them all */
function fbPicker(FORM,onAdd){
 const have=new Set(FORM.fields.map(f=>f.label.toLowerCase()));
 const pick=new Map();   // key -> count
 modal(`<h2>Add fields</h2><p class="small">Tick everything you need, then press <b>Add</b>. Tap a question type again to add more than one.</p>
 <h3 class="fbph">Question types</h3><div class="fbtiles">${FF.TYPES.map(t=>`<button type="button" class="fbtile" data-key="t:${t.t}"><span class="ic">${t.ic}</span><b>${t.name}</b><small>${t.desc}</small><i class="cnt"></i></button>`).join('')}</div>
 <h3 class="fbph">Ready-made questions</h3><div class="fbtiles pre">${FF.PRESETS.map((p,i)=>`<button type="button" class="fbtile" data-key="p:${i}" ${have.has(p.label.toLowerCase())?'data-had="1"':''}><span class="ic">${(FF.TYPES.find(t=>t.t===p.type)||{}).ic||'?'}</span><b>${esc(p.label)}</b><small>${FF.typeName(p.type)}${p.options?' · '+esc(p.options.slice(0,3).join(', '))+(p.options.length>3?'…':''):''}${have.has(p.label.toLowerCase())?' · already in your form':''}</small><i class="cnt"></i></button>`).join('')}</div>
 <div class="mrow fbpickbar"><span class="fbpicked small">Nothing selected</span><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn fbdo" disabled>Add</button></div>`,(m,close)=>{
  m.querySelector('.modal').classList.add('wide','fbpick');
  const sync=()=>{let n=0;$$('.fbtile',m).forEach(b=>{const c=pick.get(b.dataset.key)||0;n+=c;b.classList.toggle('on',c>0);$('.cnt',b).textContent=c>1?'×'+c:c?'✓':''});
   $('.fbpicked',m).textContent=n?`${n} field${n>1?'s':''} selected`:'Nothing selected';const d=$('.fbdo',m);d.disabled=!n;d.textContent=n?`Add ${n} field${n>1?'s':''}`:'Add'};
  $$('.fbtile',m).forEach(b=>{b.onclick=()=>{const k=b.dataset.key,c=pick.get(k)||0;
    if(k.startsWith('t:'))pick.set(k,c>=5?0:c+1);else pick.set(k,c?0:1);sync()};
   b.oncontextmenu=x=>{x.preventDefault();pick.set(b.dataset.key,0);sync()}});
  $('.fbdo',m).onclick=()=>{const out=[];
   $$('.fbtile',m).forEach(b=>{const k=b.dataset.key,c=pick.get(k)||0;for(let j=0;j<c;j++){if(k.startsWith('t:'))out.push(FF.blank(k.slice(2)));else out.push(FF.fromPreset(FF.PRESETS[+k.slice(2)]))}});
   if(FORM.fields.length+out.length>40)return toast('A form can have up to 40 fields.',true);
   close();onAdd(out);toast(`${out.length} field${out.length>1?'s':''} added. Edit the wording below.`)};
 });
}

/* preview: the form exactly as visitors see it (answers are not saved) */
function fbPreview(FORM,ev){
 const std=FORM.std,sel=t=>`<select disabled><option>${t}</option></select>`;
 modal(`<h2>Form preview</h2><p class="small">This is what people see when they press Register${ev&&ev.title?` for <b>${esc(ev.title)}</b>`:''}. Try it: answers are not saved.</p>
 <form class="pvform" novalidate>
  <label>Full name <span class="req">*</span><input></label><label>Email <span class="req">*</span><input type="email"></label><label>Mobile number <span class="req">*</span><input type="tel"></label>
  ${std.whatsapp?'<label>WhatsApp number <span class="req">*</span><input type="tel" placeholder="Same as mobile"></label>':''}
  ${std.country?`<label>Country <span class="req">*</span>${sel('India')}</label>`:''}${std.education?`<label>Education level <span class="req">*</span>${sel('Choose…')}</label>`:''}${std.role?`<label>I am a <span class="req">*</span>${sel('Student / Parent')}</label>`:''}
  ${FORM.fields.map(f=>FF.render(f,'pv')).join('')}
  <p class="err" role="alert"></p><div class="mrow"><button type="button" class="btn ghost" data-close>Close</button><button type="submit" class="btn">Check my answers</button></div></form>`,(m)=>{
  m.querySelector('.modal').classList.add('wide');const f=$('.pvform',m);
  $$('.othtxt',f).forEach(t=>t.addEventListener('input',()=>{const o=t.closest('.opt').querySelector('input[value=__other]');if(t.value&&o)o.checked=true}));
  f.onsubmit=x=>{x.preventDefault();$$('.ff.bad',f).forEach(b=>b.classList.remove('bad'));const err=$('.err',f);
   for(const q of FORM.fields){const msg=FF.check(q,FF.read(q,f,'pv'));if(msg){const b=$(`[data-f="${q.id}"]`,f);if(b){b.classList.add('bad');mScroll(b)}err.textContent=msg;return}}
   err.textContent='';toast('All answers look good. This is only a preview, so nothing was saved.')};
 });
}
