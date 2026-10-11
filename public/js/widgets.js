/* =====================================================================
   Practice games. Each takes (element, config). Text goes through P().
   ===================================================================== */
let PROG={};                       // the logged-in learner's progress (set by app.js)
function save(){if(window.persist)window.persist()}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function confetti(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
 const cols=['#2A6FF0','#12966A','#E0464C','#F0A500','#5B3FD9','#FF8FAB'];
 for(let i=0;i<70;i++){const c=document.createElement('i');c.className='confetti';c.style.left=Math.random()*100+'vw';c.style.background=cols[i%cols.length];c.style.animationDelay=Math.random()*.6+'s';c.style.animationDuration=(1.8+Math.random()*1.4)+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),3800)}}
const say=(m,t,cls)=>{m.className='gmsg '+(cls||'');m.innerHTML=P(t)};
const localKey=k=>'ca-'+(window.CURRENT_USER||'guest')+'-'+k;

/* ---------- bubble pop ---------- */
function wClick(el,cfg={}){
 const goal=cfg.goal||15,types=cfg.types||['click','dbl','right'];
 const lab={click:['c1','Click me'],dbl:['c2','Double-click me'],right:['c3','Right-click me']};
 el.innerHTML=P(`<h3>${cfg.title||'Bubble pop'}</h3><p class="gi">Pop each bubble the right way.</p><div class="legend">${types.includes('click')?'<span><i style="background:#2A6FF0"></i>Blue: click once</span>':''}${types.includes('dbl')?'<span><i style="background:#12966A"></i>Green: double-click (two fast clicks)</span>':''}${types.includes('right')?'<span><i style="background:#E86A1C"></i>Orange: right-click {{(click with two fingers, or hold control and click)||(right mouse button, or tap the touchpad with two fingers)}}</span>':''}</div><div class="score"><span>Popped: <b class="sc">0</b> / ${goal}</span><span>Oops: <b class="oo">0</b></span></div><div class="arena"></div><div class="gmsg"></div><button type="button" class="btn sm ghost again" hidden>Play again</button>`);
 const ar=$('.arena',el),msg=$('.gmsg',el);let sc=0,oo=0;
 function spawn(){
  if(!el.isConnected)return;if(sc>=goal){say(msg,`You popped all ${goal} bubbles! ${oo===0?'Perfect, no mistakes!':'Well done!'}`,'good');confetti();$('.again',el).hidden=false;return}
  const t=types[Math.floor(Math.random()*types.length)],b=document.createElement('button');b.type='button';b.className='bub '+lab[t][0];b.textContent=lab[t][1];
  const W=ar.clientWidth-110,H=ar.clientHeight-110;b.style.left=Math.random()*Math.max(W,10)+'px';b.style.top=Math.random()*Math.max(H,10)+'px';ar.appendChild(b);
  const hit=(kind,e)=>{e.preventDefault();if(b.dataset.gone)return;
   if(kind===t){b.dataset.gone=1;b.classList.add('pop');sc++;$('.sc',el).textContent=sc;say(msg,['Pop!','Nice!','Great!','Super!','Yes!'][sc%5],'good');setTimeout(()=>{b.remove();spawn()},260)}
   else{oo++;$('.oo',el).textContent=oo;say(msg,t==='dbl'?'Green needs two quick clicks, one after the other.':t==='right'?'Orange needs a right-click: {{press the trackpad with TWO fingers, or hold <kbd>control</kbd> and click||press the RIGHT mouse button, or tap the touchpad with two fingers}}.':'Blue needs just one normal click.','bad');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake')}};
  b.addEventListener('click',e=>{if(t==='dbl'){if(e.detail>=2)hit('dbl',e);return}if(e.ctrlKey&&!isWin())return;hit('click',e)});
  b.addEventListener('contextmenu',e=>hit('right',e));
 }
 $('.again',el).onclick=()=>{sc=0;oo=0;$('.sc',el).textContent=0;$('.oo',el).textContent=0;$('.again',el).hidden=true;ar.innerHTML='';say(msg,'');spawn()};
 spawn();
}

/* ---------- drag & sort ---------- */
function wDrag(el,cfg){
 el.innerHTML=P(`<h3>${cfg.title}</h3><p class="gi">${cfg.intro||'Press and hold on a card, move it to the right box, then let go. (Or click a card, then click a box.)'}</p><div class="pool"></div><div class="bins">${cfg.bins.map(b=>`<div class="bin" data-bin="${b.id}"><h4>${b.t}</h4></div>`).join('')}</div><div class="gmsg"></div><button type="button" class="btn sm ghost again" hidden>Play again</button>`);
 const pool=$('.pool',el),msg=$('.gmsg',el);let left=0,sel=null;
 function setup(){pool.innerHTML='';$$('.bin .chipd',el).forEach(c=>c.remove());left=cfg.items.length;$('.again',el).hidden=true;say(msg,'');
  shuffle(cfg.items).forEach(it=>{const c=document.createElement('div');c.className='chipd';c.innerHTML=P(it.t);c.dataset.bin=it.bin;c.dataset.why=it.why||'';pool.appendChild(c)})}
 function place(c,bin){if(!bin)return;if(bin.dataset.bin===c.dataset.bin){bin.appendChild(c);c.classList.add('placed');left--;say(msg,left?'Correct!':'All sorted. Brilliant!','good');if(!left){confetti();$('.again',el).hidden=false}}
  else{c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');say(msg,c.dataset.why||'Not that box. Try another one!','bad')}}
 el.addEventListener('pointerdown',e=>{const c=e.target.closest('.chipd');if(!c||c.classList.contains('placed'))return;e.preventDefault();
  const sx=e.clientX,sy=e.clientY;let g=null,moved=false;
  const mv=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;if(!moved){moved=true;g=c.cloneNode(true);g.classList.add('ghost');document.body.appendChild(g);c.classList.add('lift')}
   g.style.left=(ev.clientX-30)+'px';g.style.top=(ev.clientY-22)+'px';const over=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.bin');$$('.bin',el).forEach(b=>b.classList.toggle('over',b===over))};
  const up=ev=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);$$('.bin',el).forEach(b=>b.classList.remove('over'));
   if(moved){g.remove();c.classList.remove('lift');const bin=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.bin');if(bin&&el.contains(bin))place(c,bin);else say(msg,'Let go on top of one of the boxes.','bad')}
   else{sel&&sel.classList.remove('lift');sel=c;c.classList.add('lift');say(msg,'Now click the box it belongs in.')}};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up)});
 el.addEventListener('click',e=>{const bin=e.target.closest('.bin');if(bin&&sel&&!e.target.closest('.chipd')){sel.classList.remove('lift');const s=sel;sel=null;place(s,bin)}});
 $('.again',el).onclick=setup;setup();
}

/* ---------- scroll hunt ---------- */
function wScroll(el){
 const list=['Aardvark','Bear','Camel','Dolphin','Eagle','Falcon','Gazelle','Hedgehog','Iguana','Jellyfish','Kangaroo','Lion','Meerkat','Narwhal','Octopus','Panda','Quail','Rabbit','Seahorse','Tiger','Urchin','Vulture','Walrus','Yak','Zebra','Arabian Oryx','Beetle','Cheetah','Dugong','Elephant','Flamingo','Gecko','Hippo','Ibis','Jaguar','Koala'];
 el.innerHTML=P(`<h3>Scroll hunt</h3><p class="gi">The <b>Flamingo</b> is hiding far down this list. Put two fingers on the {{trackpad||touchpad}} and slide them to scroll down (or roll the mouse wheel). Click the Flamingo when you find it.</p><div class="scrollbox"></div><div class="gmsg"></div>`);
 const box=$('.scrollbox',el),msg=$('.gmsg',el);
 list.forEach(n=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.onclick=()=>{if(n==='Flamingo'){b.style.background='var(--good)';b.style.color='#fff';say(msg,'You found it! Now scroll back up to the top.','good');confetti()}else say(msg,'Not this one. Keep scrolling down!','bad')};box.appendChild(b)});
}

/* ---------- key finder ---------- */
const KEYINFO={space:['the space bar',['space']],enter:['{{return||Enter}}',['enter']],backspace:['{{delete||Backspace}}',['backspace']],shift:['shift',['shiftl','shiftr']],tab:['tab',['tab']],capslock:['caps lock',['capslock']],meta:['{{⌘ command||⊞ Windows}}',isWin()?['win']:['cmdl','cmdr']],alt:['{{⌥ option||Alt}}',['optl','optr']],control:['{{⌃ control||Ctrl}}',isWin()?['cmdl','cmdr']:['ctrl']],escape:['{{esc||Esc}}',['esc']],arrowleft:['the left arrow ←',['arrowleft']],arrowright:['the right arrow →',['arrowright']]};
const normKey=e=>{let k=e.key;if(k===' ')return'space';k=k.toLowerCase();return k};
function focusBox(inner){return `<div class="focusbox" tabindex="0"><div class="cover"><button type="button" class="btn wk">Click here to start</button></div>${inner}</div>`}
function bindFocus(el){const fb=$('.focusbox',el);$('.cover button',el).onclick=()=>fb.focus();return fb}
function wKeys(el,cfg={}){
 const info=k=>{const i=KEYINFO[k];if(!i)return[k.toUpperCase(),[k]];const codes=k==='meta'?(isWin()?['win']:['cmdl','cmdr']):k==='control'?(isWin()?['cmdl','cmdr']:['ctrl']):i[1];return[P(i[0]),codes]};
 const rounds=cfg.keys||(isWin()?['a','j','space','enter','shift','f','backspace','m','control','tab','5','capslock','alt','escape','q','arrowright']:['a','j','space','enter','shift','f','backspace','m','meta','tab','5','capslock','alt','escape','q','arrowright']);
 el.innerHTML=P(`<h3>Key finder</h3><p class="gi">Find the key on <b>your</b> keyboard and press it. If you get stuck, the key lights up blue in the picture.</p>`)+focusBox(`<div class="big">Press <span class="tk"></span></div><div class="kbwrap">${kb({noFn:true})}</div>`)+`<div class="score"><span>Found: <b class="sc">0</b> / ${rounds.length}</span></div><div class="gmsg"></div>`;
 const fb=bindFocus(el),msg=$('.gmsg',el);let i=0,tm;
 function show(){$$('.key.target',el).forEach(k=>k.classList.remove('target'));if(i>=rounds.length){$('.tk',el).textContent='… nothing. You found them all!';say(msg,'Key master! You know your keyboard.','good');confetti();return}
  $('.tk',el).innerHTML=`<kbd style="font-size:.8em">${esc(info(rounds[i])[0])}</kbd>`;clearTimeout(tm);tm=setTimeout(hint,5000)}
 function hint(){info(rounds[i]||'')[1].forEach(c=>$$(`[data-k="key-${c}"]`,el).forEach(k=>k.classList.add('target')))}
 fb.addEventListener('keydown',e=>{if(i>=rounds.length)return;const k=normKey(e);if(['space','tab','backspace','arrowleft','arrowright','arrowup','arrowdown','enter'].includes(k)||e.metaKey)e.preventDefault();
  info(k)[1].forEach(c=>$$(`[data-k="key-${c}"]`,el).forEach(x=>{x.classList.add('down');setTimeout(()=>x.classList.remove('down'),200)}));
  if(k===rounds[i]){i++;$('.sc',el).textContent=i;say(msg,'Yes! That is '+esc(info(k)[0])+'.','good');show()}else{say(msg,'That was '+esc(info(k)[0])+'. Try again!','bad');hint()}});
 show();
}

/* ---------- typing trainer ---------- */
const TY={
 1:{n:'Home row',lines:['asdf jkl; asdf jkl;','fj dk sl a; fj dk sl a;','sad dad had a salad','a glad lad has a flag','ask dad; ask a lass','all fall; shall a hall','flash a flag; half a glass','gh gh hag had gash ash']},
 2:{n:'+ Top row',lines:['we are here','her sister has a pet fish','the tiger is purple','your first story is great','quiet otters float','a potato is sweet','the fire is hot','we ate hot pasta at a party']},
 3:{n:'All letters',lines:['my computer is fun','i can type with ten fingers','a zebra and a camel went on a bus','mix five colours on a canvas','blue whales swim in the ocean','the quick brown fox jumps over the lazy dog']},
 4:{n:'Sentences',lines:['Dubai has the tallest building in the world.','I can save my work with one shortcut.','My favourite animal is the Arabian oryx!','Computers need clean hands and no juice.','Practice makes progress, not perfection.','Do you want to see my slides?']},
 5:{n:'Numbers & symbols',lines:['Order #4521 costs AED 36.75 (paid).','Meeting at 10:30 on 14/11 in Room 2B.','Email me at team@example.com today!','Sales rose 12% to 3,480 units in Q3.','Password tip: Blue-Kite_Rides-9!','Call +971 4 555 0199 before 5 pm.']}
};
function charCodes(ch){if(ch===' ')return['space'];const low=ch.toLowerCase();const sh={'!':'1','?':'/','"':"'",':':';','@':'2','#':'3','$':'4','%':'5','&':'7','(':'9',')':'0','_':'-','+':'='};if(sh[ch])return[sh[ch],'shiftl','shiftr'];if(ch!==low)return[low,'shiftl','shiftr'];return[low]}
function wTyping(el,cfg={}){
 let lvl=cfg.level||1;const test=!!cfg.test;PROG.wpm=PROG.wpm||{};
 el.innerHTML=P(`<h3>${cfg.title||'Typing practice'}</h3><p class="gi">${test?'Type 3 sentences as carefully as you can. Your speed is measured at the end.':'Rest your fingers on the home row: <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> and <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd>. Type what you see. The <b>blue key</b> is the next one, and its colour tells you which finger to use. Try not to look at your hands!'}</p>${test?'':`<div class="lvl">${[1,2,3,4,5].map(n=>`<button type="button" data-l="${n}" class="${n===lvl?'on':''}">Level ${n}: ${TY[n].n}</button>`).join('')}</div>`}`)+
  focusBox(`<div class="tyline" aria-live="off"></div><div class="fhint"></div><div class="kbwrap">${kb({noFn:true,fingers:true})}</div>`)+`<div class="score" style="margin-top:12px"><span>Speed: <b class="wpm">–</b> words a minute</span><span>Correct: <b class="acc">–</b></span><span>Lines: <b class="ln">0</b></span>${test?'':'<span>Your best: <b class="best">'+(PROG.wpm.best||'–')+'</b></span>'}</div><div class="gmsg"></div>`;
 const fb=bindFocus(el),line=$('.tyline',el),msg=$('.gmsg',el);
 let lines,li=0,pos=0,err=[],t0=0,totErr=0,totChars=0,tStart=0,done=0;
 function load(){lines=test?TY[cfg.testLevel||4].lines.slice(0,3):shuffle(TY[lvl].lines);li=0;start()}
 function start(){pos=0;err=[];t0=0;draw()}
 function draw(){const s=lines[li];line.innerHTML=[...s].map((c,i)=>`<span class="${i<pos?(err[i]?'x':'d'):i===pos?'c':'u'}">${c===' '?'&nbsp;':esc(c)}</span>`).join('');
  $$('.key.target',el).forEach(k=>k.classList.remove('target'));const ch=s[pos];if(ch===undefined)return;const cs=charCodes(ch);cs.forEach(c=>$$(`[data-k="key-${c}"]`,el).forEach(k=>k.classList.add('target')));
  const f=FNAME[FINGER[cs[0]]]||FNAME.th;$('.fhint',el).innerHTML=`<i style="background:${f[1]}"></i>Next: <kbd>${ch===' '?'space':esc(ch)}</kbd> with your ${f[0]}${cs.length>1?' + hold <kbd>shift</kbd> with the other hand':''}`}
 fb.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const s=lines[li];if(pos>=s.length)return;
  if(e.key.length!==1){if(['Backspace','Tab','Enter'].includes(e.key))e.preventDefault();return}e.preventDefault();
  if(!t0)t0=performance.now();if(!tStart)tStart=t0;
  if(e.key===s[pos]){pos++;totChars++;draw();if(pos>=s.length)finish()}else{err[pos]=1;totErr++;line.querySelector('.c')?.classList.add('x')}});
 function finish(){const s=lines[li];const mins=(performance.now()-t0)/60000;const wpm=Math.round((s.length/5)/Math.max(mins,.05));done++;
  const acc=Math.round(100*totChars/Math.max(1,totChars+totErr));$('.wpm',el).textContent=wpm;$('.acc',el).textContent=acc+'%';$('.ln',el).textContent=done;
  if(test){if(li>=lines.length-1){const allMin=(performance.now()-tStart)/60000;const all=Math.round((lines.join(' ').length/5)/Math.max(allMin,.05));PROG.wpm[cfg.saveAs||'final']=all;save();$('.wpm',el).textContent=all;say(msg,`Test finished! Your speed: <b>${all} words a minute</b> with ${acc}% correct.${PROG.wpm.first?` Your first measured speed was ${PROG.wpm.first}.`:''}`,'good');confetti();$$('.key.target',el).forEach(k=>k.classList.remove('target'));$('.fhint',el).textContent='';return}}
  else{if(!PROG.wpm.first)PROG.wpm.first=wpm;if(wpm>(PROG.wpm.best||0)&&acc>=80){PROG.wpm.best=wpm;$('.best',el).textContent=wpm;say(msg,'New best speed! '+wpm+' words a minute.','good')}else say(msg,acc>=90?'Great accuracy! Keep going.':'Good! Slow down a little to make fewer mistakes.','good');save()}
  setTimeout(()=>{li=(li+1)%lines.length;start()},700)}
 $$('.lvl button',el).forEach(b=>b.onclick=()=>{lvl=+b.dataset.l;$$('.lvl button',el).forEach(x=>x.classList.toggle('on',x===b));load();fb.focus()});
 load();
}

/* ---------- shortcut game ---------- */
function wShortcuts(el,cfg={}){
 const set=cfg.set||[['Undo','z'],['Select all','a'],['Save','s'],['Copy','c'],['Paste','v'],['Cut','x']];
 el.innerHTML=P(`${cfg.noCopy?'':`<h3>Copy &amp; paste mission</h3><p class="gi">1. Double-click the word <b>sunshine</b> to select it. 2. Press <kbd>⌘</kbd> + <kbd>C</kbd> to copy. 3. Click inside the white box. 4. Press <kbd>⌘</kbd> + <kbd>V</kbd> to paste. No typing allowed!</p>
 <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><span style="font-size:26px;font-weight:700;background:var(--soft);padding:10px 18px;border-radius:12px;user-select:text;-webkit-user-select:text">sunshine</span><input class="pastebox" style="font:22px var(--body);padding:10px 14px;border-radius:12px;border:2px solid var(--line);background:#fff;color:#222;min-width:0;flex:1" placeholder="Paste here" aria-label="Paste here"></div><div class="gmsg m1"></div>`}
 <h3 style="margin-top:26px">${cfg.title||'Shortcut quick-fire'}</h3><p class="gi">Press the shortcut on your keyboard. Hold <kbd>⌘</kbd> down, tap the letter, then let go. <b>Don't</b> press {{<kbd>⌘</kbd> <kbd>Q</kbd> or <kbd>⌘</kbd> <kbd>W</kbd>||<kbd>Alt</kbd> <kbd>F4</kbd> or <kbd>Ctrl</kbd> <kbd>W</kbd>}} here: those would close the browser!</p>`)+focusBox(`<div class="big" style="font-size:30px">Press the shortcut for: <span class="sq"></span></div><button type="button" class="read shint" style="margin-top:10px">Show me the keys</button><div class="kbwrap">${kb({noFn:true})}</div>`)+`<div class="score" style="margin-top:12px"><span>Done: <b class="sc">0</b> / ${set.length}</span></div><div class="gmsg m2"></div>`;
 const pb=$('.pastebox',el);let pasted=false;
 if(pb){pb.addEventListener('paste',()=>{pasted=true;setTimeout(check,30)});pb.addEventListener('input',()=>{if(!pasted&&pb.value.length>2)say($('.m1',el),'Oops, that was typing. Delete it and use ⌘ + V to paste!','bad')})}
 function check(){if(pb.value.trim().toLowerCase().includes('sunshine')){say($('.m1',el),'Mission complete! You copied and pasted like a pro.','good');confetti()}}
 const R=shuffle(set);let i=0;const fb=bindFocus(el),m2=$('.m2',el);
 function show(){$$('.key.target',el).forEach(k=>k.classList.remove('target'));if(i>=R.length){$('.sq',el).textContent='Finished!';say(m2,'Shortcut superstar! All done.','good');confetti();return}$('.sq',el).textContent=P(R[i][0])}
 $('.shint',el).onclick=()=>{if(i<R.length)['cmdl','cmdr',...(R[i][2]?['shiftl','shiftr']:[]),R[i][1]].forEach(c=>$$(`[data-k="key-${c}"]`,el).forEach(k=>k.classList.add('target')));fb.focus()};
 fb.addEventListener('keydown',e=>{if(i>=R.length)return;const k=e.key.toLowerCase();if(['meta','control','shift','alt'].includes(k))return;
  if(e.metaKey||e.ctrlKey){e.preventDefault();if(k===R[i][1]&&!!e.shiftKey===!!R[i][2]){i++;$('.sc',el).textContent=i;say(m2,'Correct!','good');show()}else say(m2,'Not that one. Try again!','bad')}
  else say(m2,'Remember to hold ⌘ while you press the letter.','bad')});
 show();
}

/* ---------- click-the-part (hotspot) ---------- */
function wHot(el,cfg){
 el.innerHTML=P(`<h3>${cfg.title||'Find it on the screen'}</h3><p class="gi">${cfg.intro||'Read the question, then click that part of the picture.'}</p><div class="qq hq"></div><div class="mac ${isWin()?'w11':''} ${cfg.cls||''}" style="cursor:pointer">${cfg.build()}</div><div class="score" style="margin-top:12px"><span>Score: <b class="sc">0</b> / ${cfg.qs.length}</span></div><div class="gmsg"></div><button type="button" class="btn sm ghost again" hidden>Play again</button>`);
 const m=$('.mac',el),msg=$('.gmsg',el);let i=0,sc=0,miss=0;
 function show(){$$('.hl',m).forEach(x=>x.classList.remove('hl'));if(i>=cfg.qs.length){$('.hq',el).textContent='All done!';say(msg,`You scored ${sc} out of ${cfg.qs.length}.`,'good');if(sc===cfg.qs.length)confetti();$('.again',el).hidden=false;return}$('.hq',el).innerHTML=P(cfg.qs[i][0]);miss=0}
 m.addEventListener('click',e=>{if(i>=cfg.qs.length)return;const want=[].concat(cfg.qs[i][1]);let n=e.target,hit=null;while(n&&n!==m.parentElement){if(n.dataset&&want.includes(n.dataset.k)){hit=n;break}n=n.parentElement}
  if(hit){if(miss===0)sc++;$('.sc',el).textContent=sc;hit.classList.add('hl');say(msg,cfg.qs[i][2]||'Yes, that\'s it!','good');i++;setTimeout(show,1200)}
  else{miss++;say(msg,miss>1?'Look for the part that is glowing yellow.':'Not quite. Try again!','bad');if(miss>1)want.forEach(k=>$$(`[data-k="${k}"]`,m).forEach(x=>x.classList.add('hl')))}});
 $('.again',el).onclick=()=>{i=0;sc=0;$('.sc',el).textContent=0;$('.again',el).hidden=true;say(msg,'');show()};
 show();
}

/* ---------- quiz ---------- */
function wQuiz(el,cfg){
 let qs,i,sc;
 function start(){qs=(cfg.shuffle?shuffle(cfg.qs).slice(0,cfg.take||cfg.qs.length):cfg.qs).map(Q=>{const s2=shuffle(Q.a.map((t,k)=>[t,k===Q.c]));return Object.assign({},Q,{a:s2.map(x=>x[0]),c:s2.findIndex(x=>x[1])})});i=0;sc=0;q()}
 function q(){if(i>=qs.length){const p=sc===qs.length;el.innerHTML=`<h3>${P(cfg.title||'Quiz')}</h3><p class="big" style="margin:10px 0">${sc} / ${qs.length}</p><p>${p?'Perfect score!':sc>=qs.length*.7?'Great work!':'Good try! Read the lesson again and have another go.'}</p><button type="button" class="btn sm ghost">Try again</button>`;$('button',el).onclick=start;if(cfg.id){PROG.quiz=PROG.quiz||{};PROG.quiz[cfg.id]=Math.max(PROG.quiz[cfg.id]||0,sc);PROG.quizMax=PROG.quizMax||{};PROG.quizMax[cfg.id]=qs.length;save()}if(p)confetti();return}
  const Q=qs[i];el.innerHTML=`<h3>${P(cfg.title||'Quiz')}</h3><div class="qn">Question ${i+1} of ${qs.length}</div><div class="qq">${P(Q.q)}</div><div class="opts">${Q.a.map((a,j)=>`<button type="button" class="qopt" data-j="${j}">${P(a)}</button>`).join('')}</div><div class="qexp" hidden></div><div style="margin-top:12px"><button type="button" class="btn sm wk nextq" hidden>Next question</button></div>`;
  let answered=false;$$('.qopt',el).forEach(b=>b.onclick=()=>{if(answered)return;answered=true;const j=+b.dataset.j;if(j===Q.c){b.classList.add('right');sc++}else{b.classList.add('wrong');$$('.qopt',el)[Q.c].classList.add('right')}
   const ex=$('.qexp',el);ex.hidden=false;ex.innerHTML=(j===Q.c?'<b>Correct!</b> ':'<b>Not quite.</b> ')+P(Q.why||'');const n=$('.nextq',el);n.hidden=false;n.focus()});
  $('.nextq',el).onclick=()=>{i++;q()}}
 start();
}

/* ---------- mini Word editor ---------- */
function wEditor(el,cfg){
 el.innerHTML=P(`<h3>${cfg.title||'Practise in Mini Word'}</h3><p class="gi">${cfg.intro||'Select some words by dragging over them, then click a button.'}</p><div class="edbar">
 <select aria-label="Style" class="eh"><option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option></select>
 <select aria-label="Font" class="ef"><option>Calibri</option><option>Georgia</option><option>Comic Sans MS</option><option>Courier New</option><option>Trebuchet MS</option></select>
 <select aria-label="Size" class="es"><option value="2">Small</option><option value="3" selected>Normal</option><option value="5">Big</option><option value="7">Huge</option></select>
 <button type="button" data-c="bold" title="Bold"><b>B</b></button><button type="button" data-c="italic" title="Italic"><i style="font-family:serif">I</i></button><button type="button" data-c="underline" title="Underline"><u>U</u></button>
 ${['#1A1A1A','#E0463E','#2A6FF0','#12966A','#8E44AD','#F08A00'].map(c=>`<button type="button" class="sw" data-color="${c}" style="background:${c}" aria-label="colour ${c}"></button>`).join('')}
 <button type="button" data-c="justifyLeft" title="Align left">${SVG.alL}</button><button type="button" data-c="justifyCenter" title="Centre">${SVG.alC}</button><button type="button" data-c="justifyRight" title="Align right">${SVG.alR}</button><button type="button" data-c="insertUnorderedList" title="Bullets">${SVG.bul}</button><button type="button" data-c="insertOrderedList" title="Numbering">1.</button><button type="button" data-c="undo" title="Undo">↶</button></div>
 <div class="edarea" contenteditable="true" spellcheck="true">${cfg.text}</div>${cfg.tasks?`<div style="margin-top:14px">${cfg.tasks.map(t=>`<label class="ck"><input type="checkbox"><span>${t}</span></label>`).join('')}</div>`:''}`);
 const ar=$('.edarea',el);
 $$('.edbar button',el).forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.onclick=()=>{ar.focus();try{if(b.dataset.color)document.execCommand('foreColor',false,b.dataset.color);else document.execCommand(b.dataset.c,false,null)}catch(e){}}});
 $('.ef',el).onchange=e=>{ar.focus();try{document.execCommand('fontName',false,e.target.value)}catch(x){}};
 $('.es',el).onchange=e=>{ar.focus();try{document.execCommand('fontSize',false,e.target.value)}catch(x){}};
 $('.eh',el).onchange=e=>{ar.focus();try{document.execCommand('formatBlock',false,e.target.value)}catch(x){}};
 $$('.ck input',el).forEach(i=>i.onchange=()=>i.closest('.ck').classList.toggle('on',i.checked));
}

/* ---------- email builder ---------- */
function wEmail(el,cfg={}){
 const pro=!!cfg.pro;
 el.innerHTML=P(`<h3>${pro?'Write a professional email':'Practice email'}</h3><p class="gi">${pro?'Write to a teacher or colleague asking for a meeting. Use CC for someone who should know. Practice only: nothing is sent.':'Write a pretend email to a relative or friend. Practice only: nothing is really sent.'}</p>
 <div class="field"><label for="em-to">To:</label><input id="em-to" placeholder="name@example.com"></div>
 ${pro?'<div class="field"><label for="em-cc">CC:</label><input id="em-cc" placeholder="manager@example.com"></div>':''}
 <div class="field"><label for="em-sub">Subject:</label><input id="em-sub" placeholder="What is your email about?"></div>
 <div class="field"><label for="em-body">Message:</label><textarea id="em-body" placeholder="Hi …,&#10;&#10;…&#10;&#10;Best regards,&#10;[name]"></textarea></div>
 <button type="button" class="btn wk">${SVG.send} Check my email</button><ul class="fb"></ul>`);
 $('.btn',el).onclick=()=>{const to=$('#em-to',el).value.trim(),s=$('#em-sub',el).value.trim(),b=$('#em-body',el).value.trim();const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const r=[[emailRe.test(to),'The address has an @ and a dot, like name@example.com'],[s.length>=(pro?8:3),pro?'The subject is clear and specific (8+ characters)':'There is a subject that says what the email is about'],[/^(hi|hello|dear|hey|good)/i.test(b),'The message starts with a greeting (Hi, Hello or Dear)'],[b.split(/\s+/).length>=(pro?30:12),pro?'The message has at least 30 words':'The message has at least 12 words'],[/(love|from|regards|thanks|thank you|bye|best|sincerely)/i.test(b.split('\n').slice(-3).join(' ')),'It ends with a sign-off and your name']];
  if(pro){const cc=$('#em-cc',el).value.trim();r.push([cc===''||emailRe.test(cc),'The CC address is valid (or left empty)']);r.push([/(when|could|would|available|time|date|\?)/i.test(b),'It asks a clear question or suggests a time'])}
  $('.fb',el).innerHTML=r.map(([ok,t])=>`<li class="${ok?'ok':'no'}">${ok?'✓':'✗'} ${t}</li>`).join('');if(r.every(x=>x[0])){confetti();$('.fb',el).insertAdjacentHTML('beforeend','<li class="ok">Perfect email! Ready to send.</li>')}};
}

/* ---------- formula engine (used by the spreadsheet games) ---------- */
function makeSheetCalc(getRaw){
 const colN=c=>c.charCodeAt(0)-64, colL=n=>String.fromCharCode(64+n);
 const stack=new Set();
 function cellVal(ref){
  const raw=getRaw(ref);if(raw==null||raw==='')return 0;
  if(String(raw)[0]==='='){if(stack.has(ref))return'#CYCLE';stack.add(ref);try{return evalF(String(raw).slice(1))}finally{stack.delete(ref)}}
  const n=Number(raw);return raw!==''&&!isNaN(n)?n:String(raw);
 }
 function rangeVals(a,b){const c1=colN(a[0]),r1=+a.slice(1),c2=colN(b[0]),r2=+b.slice(1);const rows=[];for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++){const row=[];for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++)row.push(cellVal(colL(c)+r));rows.push(row)}return{range:rows}}
 function tokenize(s){const t=[];let i=0;while(i<s.length){const ch=s[i];if(/\s/.test(ch)){i++;continue}
   if(ch==='"'){let j=i+1;while(j<s.length&&s[j]!=='"')j++;t.push({t:'str',v:s.slice(i+1,j)});i=j+1;continue}
   const m=s.slice(i).match(/^(\d+\.?\d*|\.\d+)/);if(m){t.push({t:'num',v:parseFloat(m[1])});i+=m[1].length;continue}
   const r=s.slice(i).match(/^([A-Za-z])(\d+)(?![A-Za-z(])/);if(r){t.push({t:'ref',v:r[1].toUpperCase()+r[2]});i+=r[0].length;continue}
   const id=s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_.]*/);if(id){t.push({t:'id',v:id[0].toUpperCase()});i+=id[0].length;continue}
   const op=s.slice(i).match(/^(<=|>=|<>|[-+*/^&=<>(),:;])/);if(op){t.push({t:'op',v:op[1]===';'?',':op[1]});i+=op[1].length;continue}
   throw new Error('bad')}return t}
 let T,p;
 const peek=()=>T[p],eat=v=>{if(T[p]&&T[p].v===v){p++;return true}return false};
 const num=v=>{if(v&&v.range)v=v.range[0][0];if(typeof v==='boolean')return v?1:0;const n=Number(v);if(v===''||isNaN(n))throw new Error('#VALUE!');return n};
 const flat=args=>args.flatMap(a=>a&&a.range?a.range.flat():[a]);
 const crit=(c)=>{const m=String(c).match(/^(<=|>=|<>|<|>|=)?(.*)$/);const op=m[1]||'=',val=m[2];const nv=Number(val);return x=>{const a=(val!==''&&!isNaN(nv)&&typeof x==='number')?x:String(x).toLowerCase();const b=(val!==''&&!isNaN(nv)&&typeof x==='number')?nv:val.toLowerCase();return op==='='?a==b:op==='<>'?a!=b:op==='<'?a<b:op==='>'?a>b:op==='<='?a<=b:a>=b}};
 const FN={
  SUM:a=>flat(a).filter(x=>typeof x==='number').reduce((s,x)=>s+x,0),
  AVERAGE:a=>{const v=flat(a).filter(x=>typeof x==='number');if(!v.length)throw new Error('#DIV/0!');return v.reduce((s,x)=>s+x,0)/v.length},
  MIN:a=>Math.min(...flat(a).filter(x=>typeof x==='number')),MAX:a=>Math.max(...flat(a).filter(x=>typeof x==='number')),
  COUNT:a=>flat(a).filter(x=>typeof x==='number').length,COUNTA:a=>flat(a).filter(x=>x!==''&&x!==0||x===0).length,
  ROUND:a=>{const f=10**num(a[1]??0);return Math.round(num(a[0])*f)/f},
  IF:a=>(a[0]&&a[0]!==0&&a[0]!=='')?(a[1]??true):(a[2]??false),
  AND:a=>flat(a).every(Boolean),OR:a=>flat(a).some(Boolean),
  COUNTIF:a=>a[0].range.flat().filter(crit(a[1])).length,
  SUMIF:a=>{const f=crit(a[1]);const r=a[0].range.flat(),s=(a[2]||a[0]).range.flat();return r.reduce((t,x,i)=>t+(f(x)&&typeof s[i]==='number'?s[i]:0),0)},
  VLOOKUP:a=>{const key=a[0],rows=a[1].range,col=num(a[2]);const exact=a[3]===undefined?false:!(a[3]===0||a[3]===false||String(a[3]).toUpperCase()==='FALSE');
   const k=typeof key==='string'?key.toLowerCase():key;const row=rows.find(r=>(typeof r[0]==='string'?r[0].toLowerCase():r[0])===k);if(!row)throw new Error('#N/A');return row[col-1]},
  XLOOKUP:a=>{const k=typeof a[0]==='string'?a[0].toLowerCase():a[0];const look=a[1].range.flat(),ret=a[2].range.flat();const i=look.findIndex(x=>(typeof x==='string'?x.toLowerCase():x)===k);if(i<0){if(a[3]!==undefined)return a[3];throw new Error('#N/A')}return ret[i]},
  UPPER:a=>String(a[0]).toUpperCase(),LOWER:a=>String(a[0]).toLowerCase(),LEN:a=>String(a[0]).length,CONCAT:a=>flat(a).join(''),
  TRUE:()=>true,FALSE:()=>false
 };
 function primary(){const k=peek();if(!k)throw new Error('bad');
  if(k.t==='num'){p++;return k.v}if(k.t==='str'){p++;return k.v}
  if(k.t==='ref'){p++;if(eat(':')){const b=peek();if(!b||b.t!=='ref')throw new Error('bad');p++;return rangeVals(k.v,b.v)}return cellVal(k.v)}
  if(k.t==='id'){p++;if(k.v==='TRUE'&&!(peek()&&peek().v==='('))return true;if(k.v==='FALSE'&&!(peek()&&peek().v==='('))return false;const f=FN[k.v];if(!f)throw new Error('#NAME?');if(!eat('('))throw new Error('bad');const args=[];if(!eat(')')){do{args.push(cmp())}while(eat(','));if(!eat(')'))throw new Error('bad')}return f(args)}
  if(eat('(')){const v=cmp();if(!eat(')'))throw new Error('bad');return v}
  if(eat('-'))return -num(primary());if(eat('+'))return num(primary());throw new Error('bad')}
 function pow(){let v=primary();while(eat('^'))v=num(v)**num(primary());return v}
 function mul(){let v=pow();for(;;){if(eat('*'))v=num(v)*num(pow());else if(eat('/')){const d=num(pow());if(d===0)throw new Error('#DIV/0!');v=num(v)/d}else return v}}
 function add(){let v=mul();for(;;){if(eat('+'))v=num(v)+num(mul());else if(eat('-'))v=num(v)-num(mul());else return v}}
 function cat(){let v=add();while(eat('&'))v=String(v)+String(add());return v}
 function cmp(){let v=cat();const k=peek();if(k&&k.t==='op'&&['=','<>','<','>','<=','>='].includes(k.v)){p++;const w=cat();const a=typeof v==='string'?v.toLowerCase():v,b=typeof w==='string'?w.toLowerCase():w;return k.v==='='?a==b:k.v==='<>'?a!=b:k.v==='<'?a<b:k.v==='>'?a>b:k.v==='<='?a<=b:a>=b}return v}
 function evalF(src){const sT=T,sp=p;try{T=tokenize(src);p=0;const v=cmp();if(p<T.length)throw new Error('bad');if(v&&v.range)return v.range[0][0];return v}catch(e){return /^#/.test(e.message)?e.message:'#ERROR'}finally{T=sT;p=sp}}
 return {cellVal,evalF};
}
const fmtVal=v=>typeof v==='number'?String(Math.round(v*1000)/1000):typeof v==='boolean'?(v?'TRUE':'FALSE'):String(v);

/* ---------- mini spreadsheet ---------- */
function wSheet(el,cfg){
 const cols=cfg.cols||['A','B'],raw={};cfg.rows.forEach((r,i)=>r.forEach((v,j)=>{if(v!==''&&v!=null)raw[cols[j]+(i+1)]=String(v)}));
 const calc=makeSheetCalc(ref=>raw[ref]);
 el.innerHTML=P(`<h3>${cfg.title}</h3><p class="gi">${cfg.intro}</p><div class="fxbar"><span class="nmx">A1</span><em class="fxv"></em></div><div class="shwrap"><table class="sh"><tr><th></th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>${cfg.rows.map((r,i)=>`<tr><th>${i+1}</th>${cols.map(c=>`<td class="${cfg.res&&cfg.res.includes(c+(i+1))?'res':''}"><input data-c="${c}${i+1}" aria-label="cell ${c}${i+1}"></td>`).join('')}</tr>`).join('')}</table></div>${cfg.tasks?`<ul class="fb">${cfg.tasks.map(t=>`<li class="no" data-t="${t.cell}">☐ ${t.text}</li>`).join('')}</ul>`:''}${cfg.help?`<div class="tipbox" style="margin-top:12px">${cfg.help}</div>`:''}`);
 const show=c=>{const r=raw[c]??'';return r[0]==='='?fmtVal(calc.cellVal(c)):r};
 const ok=t=>{const r=raw[t.cell]||'';if(t.formula!==false&&r[0]!=='=')return false;if(t.has&&!new RegExp(t.has,'i').test(r))return false;const v=calc.cellVal(t.cell);return typeof t.expect==='number'?Math.abs(Number(v)-t.expect)<0.011:String(fmtVal(v)).toLowerCase()===String(t.expect).toLowerCase()};
 const ins=$$('input[data-c]',el);
 function paint(){ins.forEach(i=>{if(document.activeElement!==i)i.value=show(i.dataset.c)});(cfg.tasks||[]).forEach(t=>{const li=$(`li[data-t="${t.cell}"]`,el);const g=ok(t);li.className=g?'ok':'no';li.innerHTML=(g?'✓ ':'☐ ')+P(t.text)});
  if(cfg.tasks&&cfg.tasks.every(ok)&&!el.dataset.won){el.dataset.won=1;confetti()}}
 ins.forEach(i=>{i.onfocus=()=>{i.value=raw[i.dataset.c]??'';$('.nmx',el).textContent=i.dataset.c;$('.fxv',el).textContent=raw[i.dataset.c]??''};
  i.oninput=()=>{$('.fxv',el).textContent=i.value};
  i.onblur=()=>{raw[i.dataset.c]=i.value;paint()};
  i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();raw[i.dataset.c]=i.value;const c=i.dataset.c[0],r=+i.dataset.c.slice(1);const nx=$(`input[data-c="${c}${r+1}"]`,el);(nx||i).focus();if(!nx)i.blur();paint()}}});
 paint();
}

/* ---------- sort & filter table ---------- */
function wSortFilter(el,cfg){
 const head=cfg.head,data=cfg.data.map(r=>[...r]);let sortCol=-1,dir=1,filt={};
 el.innerHTML=P(`<h3>${cfg.title}</h3><p class="gi">${cfg.intro}</p><div class="sfwrap shwrap"><table class="sh sf"><thead><tr>${head.map((h,i)=>`<th><button type="button" class="sfb" data-i="${i}">${h} <span class="arr"></span></button>${cfg.filter?.includes(i)?`<select data-f="${i}" aria-label="filter ${h}"><option value="">All</option>${[...new Set(data.map(r=>r[i]))].sort().map(v=>`<option>${esc(v)}</option>`).join('')}</select>`:''}</th>`).join('')}</tr></thead><tbody></tbody></table></div><ul class="fb">${cfg.tasks.map((t,i)=>`<li class="no" data-ti="${i}">☐ ${t.text}</li>`).join('')}</ul>`);
 function rows(){let r=data.filter(row=>Object.entries(filt).every(([i,v])=>!v||String(row[i])===v));if(sortCol>=0)r=[...r].sort((a,b)=>(typeof a[sortCol]==='number'?a[sortCol]-b[sortCol]:String(a[sortCol]).localeCompare(String(b[sortCol])))*dir);return r}
 function paint(){const r=rows();$('tbody',el).innerHTML=r.map(row=>`<tr>${row.map(v=>`<td style="padding:8px 10px">${esc(v)}</td>`).join('')}</tr>`).join('');
  $$('.sfb',el).forEach(b=>$('.arr',b).textContent=+b.dataset.i===sortCol?(dir>0?'▲':'▼'):'');
  const st={sortCol,dir,filt,rows:r};cfg.tasks.forEach((t,i)=>{const g=t.check(st);const li=$(`li[data-ti="${i}"]`,el);li.className=g?'ok':'no';li.innerHTML=(g?'✓ ':'☐ ')+P(t.text);if(g)t.done=true});
  if(cfg.tasks.every(t=>t.done)&&!el.dataset.won){el.dataset.won=1;confetti()}}
 $$('.sfb',el).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(sortCol===i)dir=-dir;else{sortCol=i;dir=1}paint()});
 $$('select[data-f]',el).forEach(s=>s.onchange=()=>{filt[s.dataset.f]=s.value;paint()});
 paint();
}

/* ---------- chart maker ---------- */
function wChart(el){
 const data=[['Mango',6],['Banana',4],['Apple',5],['Strawberry',8],['Dates',3]];const cols=['#2A6FF0','#F0A500','#E0464C','#12966A','#8E44AD'];let type='bar';
 el.innerHTML=`<h3>Make a chart</h3><p class="gi">Change the names and the numbers. The chart updates by itself, just like in Excel!</p><div class="chartrow"><div><div class="field"><label for="ch-t">Chart title</label><input id="ch-t" value="Our favourite fruits"></div><div class="shwrap"><table class="sh" style="min-width:0;width:100%"><tr><th></th><th>A: Item</th><th>B: Votes</th></tr>${data.map((d,i)=>`<tr><th>${i+2}</th><td><input data-i="${i}" data-f="0" value="${d[0]}" aria-label="item ${i+1}"></td><td><input data-i="${i}" data-f="1" value="${d[1]}" inputmode="numeric" aria-label="votes ${i+1}"></td></tr>`).join('')}</table></div><div class="lvl" style="margin-top:12px"><button type="button" data-ty="bar" class="on">Column chart</button><button type="button" data-ty="pie">Pie chart</button></div></div><div class="chartbox"></div></div>`;
 function draw(){const t=esc($('#ch-t',el).value);const vals=data.map(d=>Math.max(0,+d[1]||0));const mx=Math.max(1,...vals);let s='';
  if(type==='bar'){const bw=60,gap=26,x0=50,h=220;s=`<svg viewBox="0 0 480 330"><text x="240" y="28" text-anchor="middle" font-weight="700" font-size="20" fill="#222">${t}</text>`;
   for(let g=0;g<=4;g++){const y=300-g*h/4;s+=`<line x1="${x0-6}" x2="460" y1="${y}" y2="${y}" stroke="#e5e5ea"/><text x="${x0-10}" y="${y+4}" font-size="12" text-anchor="end" fill="#666">${Math.round(mx*g/4)}</text>`}
   data.forEach((d,i)=>{const bh=vals[i]/mx*h,x=x0+10+i*(bw+gap);s+=`<rect x="${x}" y="${300-bh}" width="${bw}" height="${bh}" rx="4" fill="${cols[i]}"/><text x="${x+bw/2}" y="${294-bh}" text-anchor="middle" font-size="14" font-weight="700" fill="#222">${vals[i]}</text><text x="${x+bw/2}" y="320" text-anchor="middle" font-size="13" fill="#444">${esc(d[0]).slice(0,11)}</text>`});s+='</svg>'}
  else{const tot=vals.reduce((a,b)=>a+b,0)||1;let a=-Math.PI/2;s=`<svg viewBox="0 0 480 330"><text x="240" y="28" text-anchor="middle" font-weight="700" font-size="20" fill="#222">${t}</text>`;
   data.forEach((d,i)=>{const f=vals[i]/tot;if(!f)return;const a2=a+f*2*Math.PI,cx=170,cy=180,r=120;s+=f>=.999?`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cols[i]}"/>`:`<path d="M${cx},${cy} L${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} A${r},${r} 0 ${f>.5?1:0} 1 ${cx+r*Math.cos(a2)},${cy+r*Math.sin(a2)} Z" fill="${cols[i]}" stroke="#fff" stroke-width="2"/>`;a=a2});
   data.forEach((d,i)=>{s+=`<rect x="320" y="${90+i*34}" width="18" height="18" rx="4" fill="${cols[i]}"/><text x="346" y="${104+i*34}" font-size="15" fill="#222">${esc(d[0]).slice(0,12)} (${vals[i]})</text>`});s+='</svg>'}
  $('.chartbox',el).innerHTML=s}
 $$('input[data-i]',el).forEach(i=>i.oninput=()=>{data[+i.dataset.i][+i.dataset.f]=i.value;draw()});$('#ch-t',el).oninput=draw;
 $$('[data-ty]',el).forEach(b=>b.onclick=()=>{type=b.dataset.ty;$$('[data-ty]',el).forEach(x=>x.classList.toggle('on',x===b));draw()});draw();
}

/* ---------- drawing studio ---------- */
function wDraw(el,cfg={}){
 const cols=['#1A1A1A','#FFFFFF','#E0463E','#FF8FAB','#F08A00','#FFD60A','#12966A','#2A6FF0','#8E44AD','#8B5A2B'];
 el.innerHTML=P(`<h3>${cfg.title||'Drawing studio'}</h3><p class="gi">${cfg.intro||'Pick a colour and a tool, then press and drag on the white page to draw.'}</p><div class="drawtools">${cols.map((c,i)=>`<button type="button" class="sw ${i===7?'on':''}" data-col="${c}" style="background:${c};${c==='#FFFFFF'?'box-shadow:inset 0 0 0 1px #bbb':''}" aria-label="colour"></button>`).join('')}</div><div class="drawtools">${[['brush','Brush'],['circle','Circle'],['rect','Rectangle'],['fill','Fill page'],['eraser','Eraser']].map((t,i)=>`<button type="button" class="t ${i===0?'on':''}" data-tool="${t[0]}">${t[1]}</button>`).join('')}<span style="width:8px"></span>${[['4','Thin'],['10','Medium'],['22','Thick']].map((s,i)=>`<button type="button" class="t sz ${i===1?'on':''}" data-size="${s[0]}">${s[1]}</button>`).join('')}<button type="button" class="t clr">Start again</button></div><canvas class="pad" width="1000" height="750"></canvas><p class="gi" style="margin-top:10px">Your drawing is kept on this computer. To save a copy as a picture, take a screenshot ({{⇧ + ⌘ + 4||⊞ Windows + Shift + S}}) and drag a box around it.</p>`);
 const cv=$('canvas',el),cx=cv.getContext('2d');let col=cols[7],tool='brush',size=10,snap=null,sx=0,sy=0,down=false;const key=localKey('drawing-'+(cfg.id||'main'));
 cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
 try{const d=localStorage.getItem(key);if(d){const im=new Image();im.onload=()=>cx.drawImage(im,0,0);im.src=d}}catch(e){}
 const keep=()=>{try{localStorage.setItem(key,cv.toDataURL('image/jpeg',.8))}catch(e){}};
 const Pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
 cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);[sx,sy]=Pt(e);down=true;
  if(tool==='fill'){cx.fillStyle=col;cx.fillRect(0,0,cv.width,cv.height);down=false;keep();return}
  snap=cx.getImageData(0,0,cv.width,cv.height);cx.lineCap='round';cx.lineJoin='round';cx.lineWidth=size;cx.strokeStyle=tool==='eraser'?'#fff':col;cx.beginPath();cx.moveTo(sx,sy);if(tool==='brush'||tool==='eraser'){cx.lineTo(sx+.1,sy);cx.stroke()}});
 cv.addEventListener('pointermove',e=>{if(!down)return;const[x,y]=Pt(e);
  if(tool==='brush'||tool==='eraser'){cx.lineTo(x,y);cx.stroke()}
  else{cx.putImageData(snap,0,0);cx.fillStyle=col;cx.beginPath();if(tool==='circle'){cx.ellipse((sx+x)/2,(sy+y)/2,Math.abs(x-sx)/2,Math.abs(y-sy)/2,0,0,Math.PI*2)}else cx.rect(Math.min(sx,x),Math.min(sy,y),Math.abs(x-sx),Math.abs(y-sy));cx.fill()}});
 const end=()=>{if(down){down=false;keep()}};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
 $$('[data-col]',el).forEach(b=>b.onclick=()=>{col=b.dataset.col;$$('[data-col]',el).forEach(x=>x.classList.toggle('on',x===b));if(tool==='eraser'){tool='brush';$$('[data-tool]',el).forEach(x=>x.classList.toggle('on',x.dataset.tool==='brush'))}});
 $$('[data-tool]',el).forEach(b=>b.onclick=()=>{tool=b.dataset.tool;$$('[data-tool]',el).forEach(x=>x.classList.toggle('on',x===b))});
 $$('[data-size]',el).forEach(b=>b.onclick=()=>{size=+b.dataset.size;$$('[data-size]',el).forEach(x=>x.classList.toggle('on',x===b))});
 $('.clr',el).onclick=()=>{cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);keep()};
}

/* ---------- password strength checker (nothing is saved or sent) ---------- */
function wPassword(el){
 el.innerHTML=`<h3>Password strength lab</h3><p class="gi">Type a <b>made-up</b> password (never your real one). Nothing you type here is saved or sent anywhere.</p><div class="field"><label for="pw-in">Test password</label><input id="pw-in" type="text" autocomplete="off" spellcheck="false" placeholder="e.g. Blue-Kite_Rides-9!"></div><div class="pwbar"><i></i></div><p class="big pwl" style="font-size:24px;margin:10px 0">Start typing…</p><ul class="fb pwr"></ul>`;
 const inp=$('#pw-in',el);
 inp.oninput=()=>{const v=inp.value;let pool=0;if(/[a-z]/.test(v))pool+=26;if(/[A-Z]/.test(v))pool+=26;if(/\d/.test(v))pool+=10;if(/[^a-zA-Z0-9]/.test(v))pool+=32;
  let bits=v.length*Math.log2(Math.max(pool,1));const common=/(password|123456|qwerty|abc123|letmein|iloveyou|admin|welcome|111111)/i.test(v);if(common)bits=Math.min(bits,10);if(/(.)\1\1/.test(v))bits-=10;
  const lv=bits<35?0:bits<55?1:bits<75?2:3;const names=['Weak','Okay','Strong','Very strong'],colors=['#E0463E','#F0A500','#12966A','#0B7A55'];
  $('.pwbar i',el).style.width=Math.min(100,Math.max(4,bits/90*100))+'%';$('.pwbar i',el).style.background=colors[lv];$('.pwl',el).textContent=v?names[lv]:'Start typing…';
  const r=[[v.length>=12,'At least 12 characters'],[/[a-z]/.test(v)&&/[A-Z]/.test(v),'Mix of small and CAPITAL letters'],[/\d/.test(v),'At least one number'],[/[^a-zA-Z0-9]/.test(v),'At least one symbol, like ! - _'],[!common,'Not a common password'],[v.split(/[-_ .]/).filter(w=>w.length>=3).length>=3,'Bonus: 3+ words (a passphrase is easy to remember)']];
  $('.pwr',el).innerHTML=v?r.map(([ok,t])=>`<li class="${ok?'ok':'no'}">${ok?'✓':'✗'} ${t}</li>`).join(''):''};
}

/* ---------- HTML playground ---------- */
function wHtml(el,cfg){
 el.innerHTML=`<h3>${cfg.title||'HTML playground'}</h3><p class="gi">${P(cfg.intro||'Change the code on the left. The web page on the right updates as you type.')}</p><div class="htmlpg"><textarea spellcheck="false" aria-label="HTML code">${esc(cfg.start)}</textarea><iframe sandbox="" title="Your web page"></iframe></div>${cfg.tasks?`<ul class="fb">${cfg.tasks.map((t,i)=>`<li class="no" data-ti="${i}">☐ ${t.text}</li>`).join('')}</ul>`:''}`;
 const ta=$('textarea',el),fr=$('iframe',el);
 const run=()=>{fr.srcdoc=ta.value;(cfg.tasks||[]).forEach((t,i)=>{const g=new RegExp(t.re,'i').test(ta.value);const li=$(`li[data-ti="${i}"]`,el);li.className=g?'ok':'no';li.innerHTML=(g?'✓ ':'☐ ')+t.text;if(g)t.done=true});if(cfg.tasks&&cfg.tasks.every(t=>t.done)&&!el.dataset.won){el.dataset.won=1;confetti()}};
 let tm;ta.oninput=()=>{clearTimeout(tm);tm=setTimeout(run,300)};
 ta.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.value=ta.value.slice(0,s)+'  '+ta.value.slice(ta.selectionEnd);ta.selectionStart=ta.selectionEnd=s+2}};
 run();
}

/* ---------- prompt builder (AI) ---------- */
function wPrompt(el){
 el.innerHTML=`<h3>Prompt builder</h3><p class="gi">Good AI prompts have four parts. Fill them in and watch your prompt grow. Then copy it into an AI tool (with permission).</p>
 <div class="field"><label for="pr-role">1. Role: who should the AI act as?</label><input id="pr-role" placeholder="a friendly science teacher"></div>
 <div class="field"><label for="pr-task">2. Task: what exactly should it do?</label><input id="pr-task" placeholder="explain how volcanoes erupt"></div>
 <div class="field"><label for="pr-ctx">3. Context: who is it for, what do you already know?</label><input id="pr-ctx" placeholder="for a 10-year-old who knows what lava is"></div>
 <div class="field"><label for="pr-fmt">4. Format: how should the answer look?</label><input id="pr-fmt" placeholder="5 short bullet points and one fun fact"></div>
 <div class="promptout" aria-live="polite"></div><button type="button" class="btn sm ghost cpy">Copy prompt</button><ul class="fb"></ul>`;
 const v=id=>$('#'+id,el).value.trim();
 const paint=()=>{const r=v('pr-role'),t=v('pr-task'),c=v('pr-ctx'),f=v('pr-fmt');const txt=[r&&`Act as ${r}.`,t&&`Please ${t}`+(t.endsWith('.')?'':'.'),c&&`This is ${c}.`,f&&`Give me the answer as ${f}.`,'If anything is unclear, ask me a question first.'].filter(Boolean).join(' ');
  $('.promptout',el).textContent=txt;const sc=[r,t,c,f].filter(x=>x.length>=6).length;$('.fb',el).innerHTML=`<li class="${sc===4?'ok':'no'}">${sc===4?'✓ A strong prompt! All four parts are there.':`☐ ${sc} of 4 parts filled in well.`}</li><li class="ok">✓ Remember: check AI answers against a trusted source, and never share private information with AI tools.</li>`};
 $$('input',el).forEach(i=>i.oninput=paint);
 $('.cpy',el).onclick=async()=>{const t=$('.promptout',el).textContent;try{await navigator.clipboard.writeText(t);$('.cpy',el).textContent='Copied!'}catch(e){const r=document.createRange();r.selectNodeContents($('.promptout',el));const s=getSelection();s.removeAllRanges();s.addRange(r);$('.cpy',el).textContent='Selected: press ⌘ + C'.replace('⌘',isWin()?'Ctrl':'⌘')}};
 paint();
}

/* ---------- certificate ---------- */
function wCert(el,cfg={}){
 el.innerHTML=`<h3>Your certificate</h3><p class="gi">Finish the quiz and the test above, then press the button.</p><button type="button" class="btn wk">Show my certificate</button><div class="certout"></div>`;
 $('.btn',el).onclick=()=>{const d=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});const full=window.CURRENT_NAME||UNAME;const sp=PROG.wpm?.[cfg.wpmKey||'final'];
  $('.certout',el).innerHTML=`<div class="cert"><div class="k">Certificate of achievement</div><p style="margin:14px 0 0;color:var(--muted)">This certifies that</p><h2>${esc(full)}</h2><p style="margin:0 0 6px">has completed the ${esc(cfg.track||'')} course of Computer Adventure and is officially a</p><div class="e">${esc(cfg.label||'Computer Expert')}</div><p style="margin:16px 0 0;color:var(--muted)">${d} · ${isWin()?'Windows':'Mac'}${sp?` · typing speed ${sp} words a minute`:''}</p></div>`;confetti()};
}

const WIDGETS={click:wClick,drag:wDrag,scroll:wScroll,keys:wKeys,typing:wTyping,shortcuts:wShortcuts,hot:wHot,quiz:wQuiz,editor:wEditor,email:wEmail,sheet:wSheet,sortfilter:wSortFilter,chart:wChart,draw:wDraw,password:wPassword,html:wHtml,prompt:wPrompt,cert:wCert};
