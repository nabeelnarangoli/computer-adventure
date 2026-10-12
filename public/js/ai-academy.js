/* =====================================================================
   AQLYON AI ACADEMY — screens
   #ai            academy map (levels, stages, certificate)
   #ai-start      level check (placement)
   #ai-<stage>    stage page with learn, prompts, practice and the quiz gate
   #ai-cert       certificate
   Progress lives in PROG.ai = {place, st:{id:{best,tries,passed}}, ck:{id:[..]}, cert}
   ===================================================================== */
const AQ_LOGO='/img/aqlyon-logo.png';
const AQ_LEVEL_NAME=['','Starter','Explorer','Creator','Pro'];
const aiP=()=>{PROG.ai=PROG.ai||{};PROG.ai.st=PROG.ai.st||{};PROG.ai.ck=PROG.ai.ck||{};return PROG.ai};
const aiStage=id=>AI_STAGES.find(s=>s.id===id);
const aiPassed=id=>!!aiP().st[id]?.passed;
const aiPassedCount=()=>AI_STAGES.filter(s=>aiPassed(s.id)).length;
const aiAllPassed=()=>aiPassedCount()===AI_STAGES.length;
function aiUnlocked(s){
 const i=AI_STAGES.indexOf(s);if(i===0)return true;
 if(s.final)return AI_STAGES.filter(x=>!x.final).every(x=>aiPassed(x.id));
 if(aiPassed(s.id)||aiPassed(AI_STAGES[i-1].id))return true;
 return s.lvl<=(aiP().place?.start||1);
}
const aiNext=()=>AI_STAGES.find(s=>!aiPassed(s.id)&&aiUnlocked(s))||AI_STAGES.find(s=>!aiPassed(s.id));
const aiScore=()=>{const a=aiP();return Math.round(AI_STAGES.reduce((t,s)=>t+Math.min(5,a.st[s.id]?.best||0),0)/(AI_STAGES.length*5)*100)};
const LOCK='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const SPARK='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" fill="currentColor"/></svg>';

function aiHead(sub=''){return `<div class="aqhead"><img src="${AQ_LOGO}" alt="Aqlyon Brand Management" class="aqlogo"><div><p class="aqk">AI Academy</p><p class="aqsub">${sub||'From AI fundamentals to professional AI creation'}</p></div></div>`}

/* ---------- academy map ---------- */
function aiHome(){
 const a=aiP();const n=aiPassedCount(),T=AI_STAGES.length,nx=aiNext(),C=2*Math.PI*34;
 const first=!a.place&&n===0;
 let h=topbar()+`<main class="wrap aiac"><section class="aqhero">${aiHead()}
 <div class="aqhgrid"><div><h1>${first?`Welcome, ${esc(USER.name.split(' ')[0])}!`:`Hi ${esc(USER.name.split(' ')[0])}, <em>keep creating!</em>`}</h1>
 <p class="lead">${P('Learn Claude, ChatGPT, Gemini, Copilot and the video tools Kling, Runway and Higgsfield. Thirteen stages, from "What is AI?" to building images, videos, content, presentations and data reports. Pass each stage quiz to move on and earn your certificate.')}</p>
 ${first?`<div class="row2"><a class="btn aqbtn" href="#ai-start">Find my level ${SVG.next}</a><a class="btn ghost" href="#ai-ai1">Start from the beginning</a></div><p class="small" style="margin-top:10px">The level check has 7 quick questions and opens the stages you are ready for.</p>`
 :`<div class="prog"><svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="9"/><circle cx="42" cy="42" r="34" fill="none" stroke="var(--aqg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-n/T)}" transform="rotate(-90 42 42)"/><text x="42" y="50" text-anchor="middle">${n}</text></svg><div><b>${n===T?'All stages passed!':`${n} of ${T} stages passed`}</b><span>${n===T?'Your certificate is ready.':`<span data-noi18n>Next:</span> <span class="tu">${esc(P(nx.t))}</span>`}</span></div></div>
 <a class="btn aqbtn" href="${n===T?'#ai-cert':'#ai-'+nx.id}">${n===T?'See my certificate':n===0?'Start stage 1':'Continue'} ${SVG.next}</a>`}
 </div><div class="aqtools" aria-hidden="true">${Object.keys(AI_TOOLS).map(k=>toolChip(k)).join('')}</div></div>
 ${a.place?`<p class="aqplace"><span class="lvl2">${esc(AQ_LEVEL_NAME[a.place.start]||'Starter')}</span> ${a.place.start>1?`Your level check opened Levels 1 to ${a.place.start}. Earlier stages are open: take their quiz to collect them for your certificate.`:'Your level check says: start at Level 1. Every stage builds on the last.'} <a href="#ai-start" class="aqretake">Retake level check</a></p>`:''}</section>`;
 let num=0;
 AI_LEVELS.forEach(L=>{const st=AI_STAGES.filter(s=>s.lvl===L.n);const got=st.every(s=>aiPassed(s.id));
  h+=`<section class="week ${L.c}"><div class="wkhead"><span class="pill">Level ${L.n}</span><h2>${esc(L.t)}</h2><span class="small aqlsub">${esc(L.sub)}</span><span class="badge ${got?'got':''}">${medal(got)}${got?'Level complete':`${st.filter(s=>aiPassed(s.id)).length} / ${st.length}`}</span></div><div class="days">${st.map(s=>{num++;const ok=aiPassed(s.id),un=aiUnlocked(s),isNx=nx&&nx.id===s.id&&!ok;const r=aiP().st[s.id];
   return `<a class="tile ${ok?'done':''} ${isNx?'next':''} ${un?'':'locked'}" href="#ai-${s.id}">${ok?`<span class="ok">${SVG.check}</span>`:un?'':`<span class="ok lk">${LOCK}</span>`}<span class="dn">${num}</span><span class="dt">${esc(P(s.t))}</span>${ok?`<span class="nx sc">Quiz ${r.best}/5</span>`:isNx?'<span class="nx">Up next</span>':un?'':'<span class="nx lk2">Locked</span>'}</a>`}).join('')}</div></section>`});
 const all=aiAllPassed();
 h+=`<section class="sec"><div class="aqcertcard ${all?'ready':''}"><div class="aqcmini">${certHTML({name:USER.name,date:new Date().toISOString().slice(0,10),score:all?aiScore():94,id:'AQL-AI-0000-00000',demo:!all})}</div><div><h2>${all?'Your certificate is ready!':'Your certificate'}</h2><p>${all?'You passed every stage. Open your certificate to save it as a PDF or print it.':`Pass all ${T} stage quizzes to earn the <b>Aqlyon AI Academy</b> certificate with your name, date, final score and a unique certificate number.`}</p>${all?`<a class="btn aqbtn" href="#ai-cert">Open my certificate ${SVG.next}</a>`:`<p class="small">${n} of ${T} stages passed.</p>`}</div></div></section>`;
 if(PROG.plan&&PROG.plan.length&&PROG.track!=='ai')h+=`<p class="small" style="margin-top:30px"><a href="#home">${SVG.back} Back to my computer course</a></p>`;
 h+=`</main>`;app.innerHTML=h;fitCerts();
}

/* ---------- level check ---------- */
function aiPlacement(){
 let step=-1,use=null;const ans=[];const qs=AI_PLACE.map(Q=>{const s=shuffle(Q.a.map((t,k)=>[t,k===Q.c]));return {...Q,opts:s}});
 const total=qs.length+1;
 const shell=inner=>topbar()+`<main class="wrap aiac setup"><div class="aqhero sm">${aiHead('Level check')}</div><div class="pq">${inner}</div></main>`;
 function show(){
  if(step===-1){app.innerHTML=shell(`<div class="pqbar"><i style="width:0%"></i></div><div class="qn">Question 1 of ${total}</div><h2 class="pqq">How much have you used AI tools?</h2><div class="opts">${AI_USE.map(([k,t])=>`<button type="button" class="qopt" data-use="${k}">${esc(t)}</button>`).join('')}</div><p class="pqhint">There are no wrong answers here. This just helps us open the right stages for you.</p>`);
   $$('[data-use]').forEach(b=>b.onclick=()=>{use=b.dataset.use;step=0;show()});return}
  if(step>=qs.length)return finish();
  const Q=qs[step];
  app.innerHTML=shell(`<div class="pqbar"><i style="width:${(step+1)/total*100}%"></i></div><div class="qn">Question ${step+2} of ${total}</div><h2 class="pqq">${P(esc(Q.q))}</h2><div class="opts">${Q.opts.map(([t,ok])=>`<button type="button" class="qopt" data-ok="${ok?1:0}">${P(esc(t))}</button>`).join('')}<button type="button" class="qopt unsure" data-ok="0">I'm not sure</button></div><p class="pqhint">Choose "I'm not sure" rather than guessing.</p>`);
  $$('.qopt').forEach(b=>b.onclick=()=>{ans.push({lvl:Q.lvl,ok:b.dataset.ok==='1'});step++;show()});
 }
 function finish(){
  const lv=l=>ans.filter(a=>a.lvl===l).every(a=>a.ok);
  let start=1;if(use!=='never'&&lv(1)){start=2;if(lv(2)){start=3;if(lv(3)&&(use==='weekly'||use==='daily'))start=4}}
  const a=aiP();a.place={use,start,right:ans.filter(x=>x.ok).length,asked:ans.length,date:new Date().toISOString().slice(0,10)};persist();
  const first=AI_STAGES.find(s=>s.lvl===start);
  app.innerHTML=shell(`<div class="resulthead"><span class="lvl2">${AQ_LEVEL_NAME[start]}</span><h1>Your AI Academy path is ready</h1><p class="lead">You got ${a.place.right} of ${ans.length} right. ${start===1?'We\'ll start at Level 1, step by step. Every stage builds on the one before.':`Levels 1 to ${start} are open for you. You can jump to <b>${esc(P(first.t))}</b>. To earn the certificate, you'll still pass the quiz for every stage, including the earlier ones (that's quick if you already know them).`}</p></div>
  <div class="planlist">${AI_LEVELS.map(L=>`<div class="pl ${L.c} ${L.n<=start?'':'known'}"><span class="pill">Level ${L.n}</span><b>${esc(L.t)}</b><span class="pln">${AI_STAGES.filter(s=>s.lvl===L.n).length} stages</span>${L.n<=start?'<span class="chip2 refresh">Open</span>':'<span class="chip2">Unlocks as you pass</span>'}</div>`).join('')}</div>
  <div class="row2"><a class="btn aqbtn" href="#ai-${first.id}">Start ${esc(P(first.t))} ${SVG.next}</a><a class="btn ghost" href="#ai">See all stages</a></div>`);
 }
 show();
}

/* ---------- stage page ---------- */
function aiStagePage(id){
 const s=aiStage(id);if(!s)return aiHome();const L=AI_LEVELS.find(l=>l.n===s.lvl);const i=AI_STAGES.indexOf(s);
 const prev=AI_STAGES[i-1],next=AI_STAGES[i+1];
 if(!aiUnlocked(s)){
  const need=s.final?AI_STAGES.filter(x=>!x.final&&!aiPassed(x.id)):[prev];
  app.innerHTML=topbar()+`<main class="wrap aiac ${L.c}"><div class="lhead"><div class="crumb"><a href="#ai">${SVG.back} AI Academy</a><span class="pill">Level ${s.lvl} · ${esc(L.t)}</span></div><h1>${LOCK} ${esc(P(s.t))}</h1><p class="goal">This stage opens when you pass the quiz for ${s.final?`all earlier stages. Still to pass: ${need.map(x=>`<a href="#ai-${x.id}">${esc(P(x.t))}</a>`).join(', ')}.`:`<a href="#ai-${prev.id}">${esc(P(prev.t))}</a>.`}</p><p><a class="btn aqbtn" href="#ai-${need[0].id}">Go to ${esc(P(need[0].t))} ${SVG.next}</a></p></div></main>`;return}
 const a=aiP();a.last=id;persist();const checks=a.ck[id]||[];const r=a.st[id];
 let h=topbar()+`<main class="wrap aiac ${L.c}"><div class="lhead"><div class="crumb"><a href="#ai">${SVG.back} AI Academy</a><span class="pill">Level ${s.lvl} · ${esc(L.t)}</span><span>Stage ${i+1} of ${AI_STAGES.length}</span></div><h1>${esc(P(s.t))}</h1><p class="goal">${P(s.goal)}</p><div class="plan"><span class="chip">About ${s.mins} min</span><span class="chip">${s.learn.length} parts</span><span class="chip">Quiz: ${AI_PASS} of 5 to pass</span>${r?.passed?`<span class="chip okc">${SVG.check} Passed ${r.best}/5</span>`:''}</div></div>`;
 h+=`<section class="sec">${sech(SVG.bulb,'Learn','',P('Read each part. Press <b>Watch how</b> where there is a moving picture.'))}${s.learn.map((x,j)=>`<article class="step ${x.demo?'':'nodemo'}"><div class="txt"><span class="sn">${j+1}</span><h3>${P(x.h)}</h3>${P(x.p)}${readBtn(P('<p>'+x.h+'.</p>'+x.p))}</div>${x.demo?`<div class="demo" data-i="${j}"></div>`:''}</article>`).join('')}</section>`;
 if(s.prompts)h+=`<section class="sec">${sech(SVG.chat,'Prompts to copy','','Copy a prompt, paste it into the AI tool and replace the [brackets] with your own details.')}<div class="pcards">${s.prompts.map((p,j)=>`<div class="pcard"><b>${P(p.l)}</b><pre data-noi18n>${esc(p.t)}</pre><button type="button" class="btn sm ghost cpp" data-j="${j}">Copy prompt</button></div>`).join('')}</div></section>`;
 h+=`<section class="sec">${sech(SVG.laptop,'Try it yourself','',P('Do these in a real AI tool[[ with a parent]]. Tick each one when it\'s done.'))}${s.tryit.map((m,j)=>`<label class="ck ${checks[j]?'on':''}"><input type="checkbox" data-ck="${j}" ${checks[j]?'checked':''}><span>${P(m)}</span></label>`).join('')}</section>`;
 if(s.practice)h+=`<section class="sec">${sech(SVG.game,'Practice','','A quick game before the quiz.')}<div class="game aqgame"></div></section>`;
 h+=`<section class="sec">${sech(SVG.flag,s.final?'Final assessment':'Stage quiz','',`Answer 5 questions. Get ${AI_PASS} or more right to ${s.final?'earn your certificate':'unlock the next stage'}. You can retry as many times as you like.`)}<div class="game aqquiz"></div></section>`;
 h+=`<nav class="pn">${prev?`<a class="btn ghost" href="#ai-${prev.id}">${SVG.back} Previous stage</a>`:'<span></span>'}${next&&aiUnlocked(next)?`<a class="btn ghost" href="#ai-${next.id}">Next stage ${SVG.next}</a>`:''}</nav></main>`;
 app.innerHTML=h;
 $$('.demo').forEach(d=>new Player(d,s.learn[+d.dataset.i].demo));
 $$('.cpp').forEach(b=>b.onclick=async()=>{const t=s.prompts[+b.dataset.j].t;try{await navigator.clipboard.writeText(t);b.textContent='Copied ✓'}catch(e){const pre=b.previousElementSibling;const rg=document.createRange();rg.selectNodeContents(pre);const sl=getSelection();sl.removeAllRanges();sl.addRange(rg);b.textContent='Selected: copy it now'}});
 $$('[data-ck]').forEach(c=>c.onchange=()=>{const arr=a.ck[id]||[];arr[+c.dataset.ck]=c.checked;a.ck[id]=arr;persist();c.closest('.ck').classList.toggle('on',c.checked)});
 if(s.practice){const el=$('.aqgame');try{WIDGETS[s.practice.type](el,deepP(s.practice))}catch(e){console.error(e);el.textContent='This game could not load.'}}
 aiQuiz($('.aqquiz'),s);
}

/* ---------- quiz gate ---------- */
function aiQuiz(el,s){
 const a=aiP();let qs,i,sc;
 const nextS=()=>AI_STAGES[AI_STAGES.indexOf(s)+1];
 function intro(){const r=a.st[s.id];
  el.innerHTML=r?.passed?`<h3>${SVG.check} Passed: ${r.best} / 5</h3><p>${s.final?'You passed the final assessment.':'You passed this stage.'} You can retake the quiz for a better score; your best score counts.</p><div class="row">${s.final||aiAllPassed()?`<a class="btn aqbtn" href="${aiAllPassed()?'#ai-cert':'#ai'}">${aiAllPassed()?'Open my certificate':'Back to the stages'} ${SVG.next}</a>`:`<a class="btn aqbtn" href="#ai-${nextS().id}">Next stage ${SVG.next}</a>`}<button type="button" class="btn ghost go">Retake quiz</button></div>`
  :`<h3>${s.final?'Final assessment':'Stage quiz'}</h3><p>${r?.tries?`Best so far: ${r.best} / 5 after ${r.tries} ${r.tries===1?'try':'tries'}. `:''}Ready? Read the lesson first, then press start.</p><button type="button" class="btn aqbtn go">${r?.tries?'Retry quiz':'Start the quiz'} ${SVG.next}</button>`;
  $('.go',el).onclick=start}
 function start(){qs=shuffle(s.quiz).map(Q=>{const o=shuffle(Q.a.map((t,k)=>[t,k===Q.c]));return {...Q,a:o.map(x=>x[0]),c:o.findIndex(x=>x[1])}});i=0;sc=0;q()}
 function q(){
  if(i>=qs.length)return end();
  const Q=qs[i];el.innerHTML=`<h3>${s.final?'Final assessment':'Stage quiz'}</h3><div class="qdots">${qs.map((_,k)=>`<i class="${k<i?'d':k===i?'c':''}"></i>`).join('')}</div><div class="qn">Question ${i+1} of ${qs.length}</div><div class="qq">${P(Q.q)}</div><div class="opts">${Q.a.map((t,j)=>`<button type="button" class="qopt" data-j="${j}">${P(t)}</button>`).join('')}</div><div class="qexp" hidden></div><div style="margin-top:12px"><button type="button" class="btn sm wk nextq" hidden>${i+1<qs.length?'Next question':'See my result'}</button></div>`;
  let done=false;$$('.qopt',el).forEach(b=>b.onclick=()=>{if(done)return;done=true;const j=+b.dataset.j;
   if(j===Q.c){b.classList.add('right');sc++}else{b.classList.add('wrong');$$('.qopt',el)[Q.c].classList.add('right')}
   const ex=$('.qexp',el);ex.hidden=false;ex.innerHTML=(j===Q.c?'<b class="tu">Correct!</b> ':'<b class="tu">Not quite.</b> ')+(Q.why?'<span class="tu">'+P(Q.why)+'</span>':'');const n=$('.nextq',el);n.hidden=false;n.focus()});
  $('.nextq',el).onclick=()=>{i++;q()};
 }
 function end(){
  const r=a.st[s.id]||{best:0,tries:0};const wasPassed=!!r.passed;r.tries++;r.best=Math.max(r.best,sc);r.last=sc;
  const pass=sc>=AI_PASS;if(pass&&!r.passed)r.passed=new Date().toISOString().slice(0,10);a.st[s.id]=r;persist();
  if(pass){confetti();const nx=nextS();const all=aiAllPassed();
   el.innerHTML=`<div class="qres pass"><p class="big">${sc} / 5</p><h3>${sc===5?'Perfect score!':'You passed!'}</h3><p>${all?'You have passed every stage of the Aqlyon AI Academy. Your certificate is ready!':s.final?'Final assessment passed.':wasPassed?'Your best score is saved.':`<b>${esc(P(nx.t))}</b> is now unlocked.`}</p><div class="row">${all?`<a class="btn aqbtn" href="#ai-cert">Get my certificate ${SVG.next}</a>`:nx&&!s.final?`<a class="btn aqbtn" href="#ai-${nx.id}">Next stage ${SVG.next}</a>`:`<a class="btn aqbtn" href="#ai">Back to the stages ${SVG.next}</a>`}<button type="button" class="btn ghost again">Retry for a better score</button></div></div>`;
  }else{
   el.innerHTML=`<div class="qres fail"><p class="big">${sc} / 5</p><h3>Nearly there!</h3><p>You need ${AI_PASS} of 5 to pass. Read the lesson again (especially the parts you missed), then retry. The questions come in a new order each time.</p><div class="row"><button type="button" class="btn aqbtn again">Retry quiz</button><button type="button" class="btn ghost top">Review the lesson</button></div></div>`;
   $('.top',el).onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  }
  $('.again',el).onclick=start;
 }
 intro();
}

/* ---------- certificate ---------- */
const fmtLong=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}catch(e){return d}};
function certHTML(c){
 const nm=String(c.name||'');const fs=nm.length>26?64:nm.length>20?80:98;
 return `<div class="aqcert" data-noi18n><div class="aqscale"><div class="cx">
  <div class="gridbg"></div><div class="f1"></div><div class="f2"></div>
  ${['tl','tr','bl','br'].map(k=>`<div class="corner ${k}"><svg viewBox="0 0 120 120"><path d="M0 0H120L0 120Z" fill="#1FA870"/><path d="M0 96 96 0" stroke="#0F1110" stroke-width="6"/><path d="M0 108 108 0" stroke="#FFF200" stroke-width="2"/><rect x="14" y="14" width="22" height="22" fill="#0F1110"/></svg></div>`).join('')}
  ${c.demo?'<div class="sample">Sample</div>':''}
  <div class="inner"><img class="logo" src="${AQ_LOGO}" alt="Aqlyon Brand Management"><div class="ctag"><b>AI Academy</b> &nbsp;·&nbsp; From AI Fundamentals to Professional AI Creation</div>
  <h1>Certificate of <span>Achievement</span></h1><div class="rule"><i></i><em></em><i></i></div>
  <div class="present">This certificate is proudly presented to</div><div class="name" style="font-size:${fs}px">${esc(nm)}</div><div class="nameline"></div>
  <div class="desc">for successfully completing the <b>Aqlyon AI Academy</b> programme and passing every stage assessment, demonstrating practical skill in using AI for writing, research, images, video, presentations, data analysis and everyday workflows.</div>
  <div class="tools">${['Claude','ChatGPT','Gemini','Microsoft Copilot','Higgsfield','Kling','Runway'].map(t=>`<span>${t}</span>`).join('')}</div>
  <div class="level"><small>Level achieved ·</small> Advanced AI Practitioner</div></div>
  <div class="bottom"><div class="sig"><div class="v">${esc(fmtLong(c.date))}</div><div class="l">Date of issue</div></div><div class="sig"><div class="v">Final score ${c.score}%</div><div class="l">Assessment result</div></div>
  <div class="seal"><svg viewBox="0 0 220 220"><defs><path id="aqring" d="M110,110 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><circle cx="110" cy="110" r="104" fill="#FFF200"/><circle cx="110" cy="110" r="99" fill="#1FA870"/><circle cx="110" cy="110" r="92" fill="#0F1110"/><circle cx="110" cy="110" r="64" fill="none" stroke="#2DB384" stroke-width="1.5"/><text font-family="Montserrat" font-weight="800" font-size="12.5" fill="#2DB384"><textPath href="#aqring" textLength="482" lengthAdjust="spacing">AQLYON • BRAND MANAGEMENT • AI ACADEMY •</textPath></text><text x="110" y="106" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="40" fill="#fff">AI</text><text x="110" y="126" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="11" letter-spacing="2.5" fill="#FFF200">CERTIFIED</text><path d="M110 136l3.2 6.6 7.2 1-5.2 5 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5 7.2-1z" fill="#FFF200"/><g fill="none" stroke="#2DB384" stroke-width="2" stroke-linecap="round"><path d="M58 128c4 16 14 26 30 32"/><path d="M162 128c-4 16-14 26-30 32"/></g><g fill="#2DB384"><ellipse cx="60" cy="136" rx="4" ry="8" transform="rotate(-30 60 136)"/><ellipse cx="68" cy="148" rx="4" ry="8" transform="rotate(-45 68 148)"/><ellipse cx="80" cy="157" rx="4" ry="8" transform="rotate(-65 80 157)"/><ellipse cx="160" cy="136" rx="4" ry="8" transform="rotate(30 160 136)"/><ellipse cx="152" cy="148" rx="4" ry="8" transform="rotate(45 152 148)"/><ellipse cx="140" cy="157" rx="4" ry="8" transform="rotate(65 140 157)"/></g></svg></div>
  <div class="sig"><div class="v">${esc(c.id)}</div><div class="l">Certificate ID</div></div><div class="sig"><div class="v script">N. Abdul</div><div class="l">Signature</div></div></div>
  <div class="issued">Issued by <b>Aqlyon Brand Management</b></div>
 </div></div></div>`;
}
function loadCertFonts(){if(document.getElementById('aqfonts'))return;const l=document.createElement('link');l.id='aqfonts';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;800;900&family=Cormorant+Garamond:wght@500;700&family=Great+Vibes&display=swap';document.head.appendChild(l)}
function fitCerts(){loadCertFonts();$$('.aqcert').forEach(c=>{const sc=c.querySelector('.aqscale');const k=c.clientWidth/1600;sc.style.transform=`scale(${k})`;c.style.height=(1131*k)+'px'})}
window.addEventListener('resize',()=>{if($('.aqcert'))fitCerts()});
window.addEventListener('beforeprint',()=>$$('.aqcert').forEach(c=>{c.querySelector('.aqscale').style.transform='';c.style.height=''}));
window.addEventListener('afterprint',()=>fitCerts());

async function aiCertPage(){
 if(!aiAllPassed()){location.hash='#ai';return}
 const a=aiP();
 app.innerHTML=topbar()+`<main class="wrap aiac"><div class="lhead"><div class="crumb"><a href="#ai">${SVG.back} AI Academy</a></div><h1>Your certificate</h1></div><div class="certslot"><p class="lead">Preparing your certificate…</p></div></main>`;
 if(!a.cert){
  try{clearTimeout(saveTimer);await flush();const d=await API.call('/ai/cert',{method:'POST'});a.cert=d.cert;persist()}
  catch(e){$('.certslot').innerHTML=`<p class="formerr">${esc(e.message)}</p><button type="button" class="btn retry">Try again</button>`;$('.retry').onclick=aiCertPage;return}
 }
 const c=a.cert;
 $('.certslot').innerHTML=`<p class="lead">Congratulations, ${esc(USER.name.split(' ')[0])}! You completed all ${AI_STAGES.length} stages of the Aqlyon AI Academy with a final score of <b>${c.score}%</b>.</p><div class="row2 noprint" style="margin:14px 0 20px"><button type="button" class="btn aqbtn pr">Save as PDF or print</button><a class="btn ghost" href="#ai">${SVG.back} Back to the stages</a></div>${certHTML(c)}<p class="small noprint" style="margin-top:14px">Tip: in the print window choose <b>Save as PDF</b>, landscape, and turn on <b>Background graphics</b>.</p>`;
 fitCerts();$('.pr').onclick=()=>window.print();confetti();
}

function aiRoute(h){
 if(h==='#ai'||h==='#ai-')return aiHome();
 if(h==='#ai-start')return aiPlacement();
 if(h==='#ai-cert')return aiCertPage();
 const m=h.match(/^#ai-(ai\d+)$/);if(m)return aiStagePage(m[1]);
 aiHome();
}
