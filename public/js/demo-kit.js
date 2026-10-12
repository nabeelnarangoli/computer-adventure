/* =====================================================================
   Demo kit: quick "Watch how" explainers for steps that teach ideas
   rather than a single click path. Every builder returns a DEMO object
   (build + steps) and writes its own captions, one beat at a time.
   ===================================================================== */
const capT=t=>Math.min(5200,1300+String(t).replace(/<[^>]+>/g,'').length*42);   // time to read a caption
const C=(t,ms)=>['cap',t,ms??capT(t)];
const KINTRO='Press <b>Watch how</b>. Each part is explained as it appears.';
const dkHead=(title,sub)=>`<div class="dkhead"><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div>`;
const dkPanel=(inner,cls='')=>`<div class="dkpanel ${cls}">${inner}</div>`;

/* cards that appear one by one. items: [icon, title, text, caption] */
function kBoard(title,items,o={}){
 const cols=o.cols||(items.length<=3?items.length:items.length===4?2:3);
 const build=()=>dkPanel(dkHead(title,o.sub)+`<div class="dkgrid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${items.map(([i,t,d],n)=>`<div class="dkcard off" data-k="c${n}">${i?`<span class="dki">${i}</span>`:''}<b>${t}</b>${d?`<p>${d}</p>`:''}</div>`).join('')}</div>`+(o.foot?`<div class="dkfoot off" data-k="foot">${o.foot}</div>`:''));
 const steps=[C(o.start||`Here is how ${title.replace(/<[^>]+>/g,'').toLowerCase()} works.`)];
 items.forEach(([i,t,d,c],n)=>steps.push(['show','c'+n,250],['to','c'+n,0,0,600],['hl','c'+n,200],C(c||d||t),['unhl']));
 if(o.foot)steps.push(['show','foot'],['hl','foot',200],C(o.end||o.foot),['unhl']);else if(o.end)steps.push(C(o.end));
 return DEMO(build,steps,{cls:'plain',intro:o.intro||KINTRO,start:[50,92],alt:title});
}
/* a process that lights up step by step. items: [icon, title, caption] */
function kFlow(title,items,o={}){
 const build=()=>dkPanel(dkHead(title,o.sub)+`<div class="dkflow ${items.length>4?'many':''}">${items.map(([i,t],n)=>`${n?`<span class="dkarr off" data-k="a${n}">➜</span>`:''}<div class="dkstep off" data-k="s${n}"><span class="dkn">${n+1}</span><span class="dki">${i}</span><b>${t}</b></div>`).join('')}</div>`+(o.foot?`<div class="dkfoot off" data-k="foot">${o.foot}</div>`:''));
 const steps=[C(o.start||'Follow the steps in order.')];
 items.forEach(([i,t,c],n)=>{if(n)steps.push(['show','a'+n,200]);steps.push(['show','s'+n,250],['to','s'+n,0,0,550],['cls','s'+n,'on'],C(c||t))});
 if(o.foot)steps.push(['show','foot'],['hl','foot',200],C(o.end||o.foot),['unhl']);else if(o.end)steps.push(C(o.end));
 return DEMO(build,steps,{cls:'plain',intro:o.intro||KINTRO,start:[50,92],alt:title});
}
/* a checklist that gets ticked. items: [text, caption] */
function kCheck(title,items,o={}){
 const build=()=>dkPanel(dkHead(title,o.sub)+`<div class="dkchk">${items.map(([t],n)=>`<div class="dkci" data-k="k${n}"><span class="dkbox" data-k="b${n}"></span><span>${t}</span></div>`).join('')}</div>`+(o.foot?`<div class="dkfoot off" data-k="foot">${o.foot}</div>`:''));
 const steps=[C(o.start||'Go through the list and tick each one.')];
 items.forEach(([t,c],n)=>steps.push(['to','b'+n,0,0,550],['click',''],['cls','k'+n,'done'],C(c||t)));
 if(o.foot)steps.push(['show','foot'],['hl','foot',200],C(o.end||o.foot),['unhl']);else if(o.end)steps.push(C(o.end));
 return DEMO(build,steps,{cls:'plain',intro:o.intro||KINTRO,start:[50,92],alt:title});
}
/* a table revealed row by row. rows: [cells..., caption] */
function kTable(title,head,rows,o={}){
 const build=()=>dkPanel(dkHead(title,o.sub)+`<table class="dktbl"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map((r,n)=>`<tr class="off" data-k="r${n}">${r.slice(0,head.length).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`+(o.foot?`<div class="dkfoot off" data-k="foot">${o.foot}</div>`:''));
 const steps=[C(o.start||'Read the table one row at a time.')];
 rows.forEach((r,n)=>steps.push(['show','r'+n,250],['to','r'+n,-20,0,550],['hl','r'+n,150],C(r[head.length]||r.join(' ')),['unhl']));
 if(o.foot)steps.push(['show','foot'],['hl','foot',200],C(o.end||o.foot),['unhl']);else if(o.end)steps.push(C(o.end));
 return DEMO(build,steps,{cls:'plain',intro:o.intro||KINTRO,start:[50,92],alt:title});
}
/* a chat with an AI tool. turns: [prompt, answerHtml, captionBefore, captionAfter] (max 2 turns) */
function kChat(tool,turns,o={}){
 const steps=[...(o.pre||[])];
 turns.slice(0,2).forEach(([q,a,c1,c2],n)=>{const u='m'+(n*2+1),b='m'+(n*2+2);
  if(n)steps.push(['fn',async p=>{['m1','m2'].forEach(k=>p.q(k).classList.add('off'))},200]);
  steps.push(C(c1||'Type the prompt and send it.'),...ask(u,q,o.speed||22),...answer(b,a,400),C(c2||'Read the answer, then check it.'))});
 if(o.end)steps.push(C(o.end));
 return DEMO(()=>aiWin(tool,o),steps,{cls:'plain',noCursor:true,intro:o.intro||'Press <b>Watch how</b> to see the prompt and the answer.',alt:'AI chat demo'});
}
