/* Aqlyon Career Discovery Centre — website interactions */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS='http://www.w3.org/2000/svg';

/* ---------- header + menu ---------- */
const hdr=$('.hdr');const onScroll=()=>hdr.classList.toggle('scrolled',scrollY>8);addEventListener('scroll',onScroll,{passive:true});onScroll();
const menu=$('.menu'),nav=$('#nav');
menu.onclick=()=>{const o=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',o);nav.classList.toggle('open',o)};
nav.addEventListener('click',e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}});
$('.yr').textContent=new Date().getFullYear();

/* ---------- content ---------- */
const QUESTIONS=[
 {q:'Who am I?',a:'Personality and learning profile: how the student thinks, works with others, takes decisions and learns best.',row:'Personality',val:'Investigative, independent'},
 {q:'What am I good at?',a:'Aptitude across numerical, verbal, logical, spatial, abstract, mechanical and analytical reasoning.',row:'Strengths',val:'Analytical, numerical'},
 {q:'What do I enjoy?',a:'Interest discovery across ten areas, from science and technology to creative, social and outdoor work.',row:'Interests',val:'Biology, technology'},
 {q:'Which careers fit me?',a:'The career clusters that match the whole profile, explained clearly, not a list of 500 jobs.',row:'Career fit',val:'Healthcare + Technology'},
 {q:'Which subjects should I choose?',a:'Subject and stream recommendations for Grade 11 and 12, matched to the careers that fit.',row:'Subjects',val:'Science with Computer Science'},
 {q:'Which degree?',a:'Five to eight career options, each mapped to the degrees that lead there.',row:'Degree',val:'Biomedical Eng., Bioinformatics'},
 {q:'Which university?',a:'A university shortlist with entrance exams, eligibility and deadlines.',row:'Universities',val:'Shortlist of 6'},
 {q:'India, UAE or abroad?',a:'A side-by-side comparison of tuition, competition, entrance exams, family proximity and visas.',row:'Where to study',val:'India and abroad compared'},
 {q:'What should I do next?',a:'A personal action plan with an admission timeline, skill goals and follow-up sessions.',row:'Next step',val:'Action plan + timeline'}
];
const CLUSTERS=[
 {n:'Healthcare',s:'Healthcare',i:'🩺',c:['Medicine','Dentistry','Pharmacy','Physiotherapy','Nursing','Biomedical Science','Public Health'],d:'For students drawn to biology, people and care.'},
 {n:'Engineering & Technology',s:'Engineering & Tech',i:'⚙️',c:['Artificial Intelligence','Software','Cybersecurity','Robotics','Mechanical','Electrical','Biomedical Engineering'],d:'For builders, problem-solvers and logical thinkers.'},
 {n:'Business',s:'Business',i:'📈',c:['Finance','Accounting','Marketing','Entrepreneurship','Business Analytics','Management'],d:'For organisers, persuaders and future founders.'},
 {n:'Law & Public Policy',s:'Law & Policy',i:'⚖️',c:['Law','International Relations','Political Science','Public Policy'],d:'For debaters, readers and people who care about fairness.'},
 {n:'Creative',s:'Creative',i:'🎨',c:['Design','Architecture','Animation','Media','Film','Advertising'],d:'For visual thinkers, makers and storytellers.'},
 {n:'Science & Research',s:'Science & Research',i:'🔬',c:['Biotechnology','Genetics','Chemistry','Physics','Environmental Science','Data Science'],d:'For the curious who want to know how things work.'},
 {n:'Social & Human Services',s:'Social & Human',i:'🤝',c:['Psychology','Education','Social Work','Human Resources'],d:'For listeners, helpers and natural teachers.'},
 {n:'Emerging Careers',s:'Emerging careers',i:'🚀',c:['AI','Prompt Engineering','UX Design','Climate Tech','FinTech','HealthTech','EdTech','Bioinformatics'],d:'Fields that barely existed ten years ago and are growing fast.'}
];
const LAYERS=[
 {k:'A',n:'Interest',items:['Scientific','Social','Artistic','Business','Technology','Communication','Helping','Creative','Outdoor','Research']},
 {k:'B',n:'Aptitude',items:['Numerical','Verbal','Logical','Spatial','Abstract','Mechanical','Analytical']},
 {k:'C',n:'Personality',items:['Leadership','Social interaction','Creativity','Risk orientation','Detail orientation','Independence','Teamwork']},
 {k:'D',n:'Learning profile',items:['Preferred learning approach','Study habits','Concentration','Motivation']},
 {k:'E',n:'Academic profile',items:['Maths','Biology','Physics','Chemistry','English','Social Science','Computer Science']}
];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- hero motion: the Q asks, the paths answer ---------- */
const g=$('.branches');
if(g){
 const tail=[366,282],N=CLUSTERS.length;const nodes=[];
 CLUSTERS.forEach((c,i)=>{
  const y=140+i*(452/(N-1)),x=486-Math.abs(i-3.5)*7;
  const p=document.createElementNS(NS,'path');p.id='bp'+i;
  p.setAttribute('d',`M${tail[0]} ${tail[1]} C ${tail[0]+50} ${tail[1]}, ${x-70} ${y}, ${x} ${y}`);
  g.appendChild(p);const len=Math.ceil(p.getTotalLength());p.style.setProperty('--len',len);p.style.setProperty('--d',(.6+i*.09)+'s');
  const w=Math.round(c.s.length*9.4+30);
  const wrap=document.createElementNS(NS,'g');wrap.setAttribute('transform',`translate(${x} ${y})`);
  const n=document.createElementNS(NS,'g');n.setAttribute('class','node');n.style.setProperty('--d',(1.3+i*.09)+'s');
  n.innerHTML=`<circle r="6"/><rect x="12" y="-17" width="${w}" height="34" rx="17"/><text x="27" y="6">${esc(c.s)}</text>`;
  wrap.appendChild(n);g.appendChild(wrap);nodes.push([p,n]);
 });
 const pulse=document.createElementNS(NS,'circle');pulse.setAttribute('class','pulse');pulse.setAttribute('r','7');pulse.setAttribute('opacity','0');
 pulse.innerHTML='<animateMotion dur="1.2s" fill="freeze" begin="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".6 0 .2 1"><mpath href="#bp0"/></animateMotion>';
 g.appendChild(pulse);
 const qt=$('.bubble span');let qi=0,ci=-1,timer=null;
 const step=()=>{
  qi=(qi+1)%QUESTIONS.length;qt.classList.add('out');
  setTimeout(()=>{qt.textContent=QUESTIONS[qi].q;qt.classList.remove('out')},350);
  nodes.forEach(([p,n])=>{p.classList.remove('on');n.classList.remove('on')});
  ci=(ci+3)%N;const [p,n]=nodes[ci];p.classList.add('on');
  if(!RM){const m=pulse.querySelector('mpath');m.setAttribute('href','#bp'+ci);pulse.setAttribute('opacity','1');try{pulse.querySelector('animateMotion').beginElement()}catch(e){}}
  const mine=ci;setTimeout(()=>{if(ci===mine)n.classList.add('on')},RM?0:1100);
 };
 const start=()=>{if(!timer)timer=setInterval(step,2800)},stop=()=>{clearInterval(timer);timer=null};
 setTimeout(()=>{step();start()},2400);
 new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?start():stop())).observe($('.hvis'));
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
}

/* ---------- mascot follows the pointer (eyes + gentle lean); idles on touch screens ---------- */
(()=>{const m=$('.mascot'),body=$('.mbody'),eyes=$$('.iris');if(!m)return;
 let tx=0,ty=0,cx=0,cy=0,last=0,raf=0,vis=true;
 addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=m.getBoundingClientRect();const ox=r.left+r.width*.47,oy=r.top+r.height*.27;
  tx=Math.max(-1,Math.min(1,(e.clientX-ox)/(innerWidth*.45)));ty=Math.max(-1,Math.min(1,(e.clientY-oy)/(innerHeight*.45)));last=performance.now()},{passive:true});
 const tick=t=>{raf=requestAnimationFrame(tick);if(!vis)return;
  if(t-last>2600){tx=Math.sin(t/1700)*.55;ty=Math.sin(t/2300)*.25}
  cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
  const k=m.clientWidth/540;eyes.forEach(i=>i.style.transform=`translate(${(cx*5.5*k).toFixed(2)}px,${(cy*2.6*k).toFixed(2)}px)`);
 
 };
 raf=requestAnimationFrame(tick);
 new IntersectionObserver(es=>es.forEach(e=>vis=e.isIntersecting)).observe(m);
})();

/* ---------- nine questions: the profile builds as you scroll ---------- */
const ql=$('.qlist'),pr=$('.prows');
ql.innerHTML=QUESTIONS.map((x,i)=>`<li data-i="${i}"><span class="qn">Question ${i+1} of 9</span><h3>${esc(x.q)}</h3><p>${esc(x.a)}</p></li>`).join('');
pr.innerHTML=QUESTIONS.map(x=>`<li role="listitem"><span>${esc(x.row)}</span><b><em>${esc(x.val)}</em></b></li>`).join('');
const rows=$$('li',pr),items=$$('li',ql),pct=$('.pct i');
const setQ=i=>{items.forEach((el,k)=>el.classList.toggle('on',k===i));rows.forEach((r,k)=>{r.classList.toggle('on',k<=i);r.classList.toggle('cur',k===i)});pct.textContent=i+1};
const qo=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setQ(+e.target.dataset.i)}),{rootMargin:'-45% 0px -45% 0px'});items.forEach(el=>qo.observe(el));

/* ---------- 5D track lights up once ---------- */
const dt=$('.dtrack');
new IntersectionObserver((es,o)=>es.forEach(e=>{if(!e.isIntersecting)return;o.disconnect();dt.style.setProperty('--prog','100%');$$('li',dt).forEach((li,k)=>setTimeout(()=>li.classList.add('lit'),RM?0:k*320))}),{threshold:.4}).observe(dt);

/* ---------- assessment layers ---------- */
const at=$('.atabs'),as=$('.astack');
at.innerHTML=LAYERS.map((l,i)=>`<button type="button" role="tab" id="lt${i}" aria-controls="ly${i}" aria-selected="${i===0}"><i>${l.k}</i>${esc(l.n)}</button>`).join('');
as.innerHTML=LAYERS.map((l,i)=>`<div class="layer c${i}" id="ly${i}" role="tabpanel" aria-labelledby="lt${i}"><h4><i>${l.k}</i>${esc(l.n)}</h4><ul>${l.items.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`).join('');
const lays=$$('.layer',as),tabs=$$('button',at);
const pick=sel=>{tabs.forEach((t,i)=>t.setAttribute('aria-selected',i===sel));
 const order=[sel,...LAYERS.map((_,i)=>i).filter(i=>i!==sel)];
 order.forEach((idx,k)=>{const el=lays[idx];el.style.zIndex=10-k;el.style.top='224px';el.style.transform=`translateY(${-k*54}px) scale(${1-k*.04})`;el.style.opacity=1;el.setAttribute('aria-hidden',k?'true':'false')})};
tabs.forEach((t,i)=>{t.onclick=()=>pick(i);t.onkeydown=e=>{const d=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();const n=(i+d+tabs.length)%tabs.length;tabs[n].focus();pick(n)}}});
lays.forEach((l,i)=>l.onclick=()=>pick(i));
pick(0);

/* ---------- career clusters ---------- */
const cl=$('.clist'),cp=$('.cpanel');
cl.innerHTML=CLUSTERS.map((c,i)=>`<button type="button" role="tab" aria-selected="${i===0}"><span class="ci" aria-hidden="true">${c.i}</span><b>${esc(c.n)}</b></button>`).join('');
const cbt=$$('button',cl);
const showC=i=>{cbt.forEach((b,k)=>b.setAttribute('aria-selected',k===i));const c=CLUSTERS[i];cp.innerHTML=`<h3>${esc(c.n)}</h3><p>${esc(c.d)}</p><ul>${c.c.map((t,k)=>`<li style="--i:${k}">${esc(t)}</li>`).join('')}</ul>`};
cbt.forEach((b,i)=>b.onclick=()=>showC(i));showC(0);

/* ---------- consultation form (Netlify Forms) ---------- */
const f=$('.cform'),msg=$('.fmsg');
f.addEventListener('submit',async e=>{
 e.preventDefault();const b=$('button[type=submit]',f);b.disabled=true;msg.className='fmsg';msg.textContent='Sending…';
 try{const r=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()});
  if(!r.ok)throw new Error();f.reset();msg.classList.add('ok');msg.textContent='Thank you. We’ll call you back soon to arrange your consultation.'}
 catch(err){msg.classList.add('err');msg.textContent='Your request didn’t go through. Please call or WhatsApp us on +91 95392 44342.'}
 finally{b.disabled=false}
});
})();
