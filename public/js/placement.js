/* =====================================================================
   Placement check: adaptive questions → level → personal course plan
   Each question is tagged with the unit it tests. "I'm not sure" counts as not known.
   ===================================================================== */
const PLACEMENT=[
 /* stage 1 — very first basics (unit B1) */
 {u:'B1',s:1,q:'To open a folder on the computer, you usually…',a:['Double-click it','Click it once','Press the power button'],c:0},
 {u:'B1',s:1,q:'Which key do you hold to type a CAPITAL letter?',a:['Shift','{{⌘ command||Ctrl}}','Space bar'],c:0},
 {u:'B1',s:1,q:'What does {{⌘ + C||Ctrl + C}} do?',a:['Copies what you selected','Closes the computer','Changes the colour'],c:0},
 /* stage 2 — files, internet, safety (B2) */
 {u:'B2',s:2,q:'You deleted a file by mistake. Where can you usually get it back?',a:['{{The Trash||The Recycle Bin}}','The printer','The clock'],c:0},
 {u:'B2',s:2,q:'A search result is labelled "Sponsored". What is it?',a:['An advert','The most accurate answer','A virus'],c:0},
 {u:'B2',s:2,q:'Which password is strongest?',a:['Blue-Kite_Rides-9!','password123','your pet\'s name'],c:0},
 /* stage 3 — Word & PowerPoint (B3) */
 {u:'B3',s:3,q:'How do you make a document look the same on every computer before you send it?',a:['Save it as a PDF','Make the font bigger','Print it twice'],c:0},
 {u:'B3',s:3,q:'In PowerPoint, the movement between one slide and the next is called…',a:['A transition','An animation','A margin'],c:0},
 /* stage 4 — Excel, screenshots, troubleshooting (B4) */
 {u:'B4',s:4,q:'In Excel, what does =SUM(B2:B6) do?',a:['Adds all the numbers from B2 to B6','Counts the letters in B2','Deletes B2 to B6'],c:0},
 {u:'B4',s:4,q:'An app is frozen and won\'t respond. What do you press?',a:['{{⌥ + ⌘ + esc (Force Quit)||Ctrl + Shift + Esc (Task Manager)}}','⌘ + C','The space bar'],c:0},
 /* stage 5 — advanced (A units) */
 {u:'A1',s:5,q:'Which shortcut moves the cursor one whole word to the right?',a:['{{⌥ + →||Ctrl + →}}','⌘ + W','{{⌃ + W||Alt + W}}'],c:0},
 {u:'A1',s:5,q:'How do you see all your open windows and add a second desktop?',a:['{{Mission Control (⌃ + ↑)||Task View (⊞ + Tab)}}','Double-click the wallpaper','Settings → Fonts'],c:0},
 {u:'A2',s:5,q:'What does Word need to build an automatic table of contents?',a:['Heading styles on your titles','Bold text on your titles','A picture on every page'],c:0},
 {u:'A2',s:5,q:'Your teacher wants to see exactly what you changed in their document. You turn on…',a:['Track Changes','Read Mode','Dark Mode'],c:0},
 {u:'A3',s:5,q:'What does =IF(B2>=50,"Pass","Fail") show when B2 is 42?',a:['Fail','Pass','42'],c:0},
 {u:'A3',s:5,q:'Which function finds "Bag" in a price list and brings back its price?',a:['XLOOKUP (or VLOOKUP)','COUNT','ROUND'],c:0},
 {u:'A4',s:5,q:'You want someone to suggest changes to your shared file but not edit it directly. Give them…',a:['Can comment','Can edit','Owner'],c:0},
 {u:'A4',s:5,q:'A teammate deleted a section of your shared document. Fastest fix?',a:['Version history → Restore','Rewrite it from memory','Delete the file'],c:0},
 {u:'A5',s:5,q:'An email from "app1e-id-verify.com" says your account closes in 24 hours. It is most likely…',a:['Phishing','A real warning','A newsletter'],c:0},
 {u:'A5',s:5,q:'Why turn on two-step verification?',a:['Logging in also needs something you have, like your phone','It makes your password shorter','It speeds up your internet'],c:0},
 {u:'A6',s:5,q:'Which AI prompt will give the most useful answer?',a:['"Act as a coach. Make a 4-week beginner running plan, 3 days a week, as a table."','"running"','"help me"'],c:0},
 {u:'A6',s:5,q:'In HTML, which tag makes the biggest heading?',a:['<h1>','<p>','<li>'],c:0}
];
const GOALS=[
 ['basics','Everyday computer basics'],['docs','Documents & presentations'],['data','Spreadsheets & numbers'],
 ['safety','Internet safety & security'],['team','Cloud, sharing & online meetings'],['create','Design, video, coding & AI']
];
const GOAL_UNITS={docs:['A2'],data:['A3'],safety:['A5'],team:['A4'],create:['A6'],basics:['A1']};
const FREQ=[['never','I have hardly ever used a computer'],['some','I use one sometimes'],['often','I use one most days (school, home or work)'],['pro','I use one all day for work or study']];

/* run the adaptive placement in `el`; calls done(result) */
function runPlacement(el,done,maxStage=5){
 const asked=[];let stage=1,queue=PLACEMENT.filter(q=>q.s===1),i=0;
 const total=()=>asked.length+queue.length-i;
 function next(){
  if(i>=queue.length){
   const right=s=>asked.filter(a=>a.s===s&&a.ok).length,cnt=s=>asked.filter(a=>a.s===s).length;
   if(stage===1&&right(1)<=1)return finish();                              // brand-new learner: stop early
   if(stage===4){const b=asked.filter(a=>a.s<=4);if(b.filter(a=>a.ok).length/b.length<0.7)return finish()}  // not ready for advanced questions
   if(stage>=maxStage)return finish();
   stage++;queue=PLACEMENT.filter(q=>q.s===stage);i=0;
  }
  const Q=queue[i];const opts=shuffle(Q.a.map((t,k)=>[t,k===Q.c]));
  const shown=asked.length+1;
  el.innerHTML=`<div class="pq"><div class="pqbar"><i style="width:${Math.min(100,(asked.length/(asked.length+(queue.length-i)+ (stage<5?6:0)))*100)}%"></i></div><div class="qn">Question ${shown}</div><h2 class="pqq">${P(esc(Q.q))}</h2><div class="opts">${opts.map(([t,ok],j)=>`<button type="button" class="qopt" data-ok="${ok?1:0}">${P(esc(t))}</button>`).join('')}<button type="button" class="qopt unsure" data-ok="0" data-unsure="1">I'm not sure</button></div><p class="pqhint">No pressure: this just helps us skip what you already know. Choose "I'm not sure" rather than guessing.</p></div>`;
  $$('.qopt',el).forEach(b=>b.onclick=()=>{asked.push({u:Q.u,s:Q.s,ok:b.dataset.ok==='1',unsure:!!b.dataset.unsure});i++;next()});
 }
 function finish(){
  const units={};asked.forEach(a=>{units[a.u]=units[a.u]||{asked:0,right:0};units[a.u].asked++;if(a.ok)units[a.u].right++});
  const basic=asked.filter(a=>a.s<=4),adv=asked.filter(a=>a.s===5);
  const bs=basic.length?basic.filter(a=>a.ok).length/basic.length:0,as=adv.length?adv.filter(a=>a.ok).length/adv.length:0;
  let level='Beginner';if(basic.length>3)level='Basic';if(basic.length>=10&&bs>=0.7)level='Intermediate';if(adv.length&&as>=0.5)level='Advanced';if(adv.length&&as>=0.85)level='Expert';
  done({level,units,basicScore:Math.round(bs*100),advScore:Math.round(as*100),asked:asked.length,date:new Date().toISOString().slice(0,10)});
 }
 next();
}

/* turn placement + track + goals into an ordered plan of units */
function buildPlan(placement,track,goals=[]){
 const known=u=>{const r=placement?.units?.[u];return !!r&&r.asked>=2&&r.right===r.asked};
 const weak=u=>{const r=placement?.units?.[u];return !r||r.right<r.asked};
 const basicUnits=UNITS.filter(u=>u.track==='basic'),advUnits=UNITS.filter(u=>u.track==='advanced');
 let order=[...advUnits.filter(u=>!u.grad)];
 const pri=[...new Set(goals.flatMap(g=>GOAL_UNITS[g]||[]))];
 order.sort((a,b)=>(pri.includes(a.id)?0:1)-(pri.includes(b.id)?0:1));
 order.push(advUnits.find(u=>u.grad));
 const plan=[];
 if(track==='basic'||track==='auto'){
  basicUnits.filter(u=>!u.grad).forEach(u=>plan.push({u:u.id,s:known(u.id)?'known':'learn'}));
  const anyLearn=plan.some(p=>p.s==='learn');
  plan.push({u:'B5',s:anyLearn||track==='basic'?'learn':'known'});
 }
 if(track==='advanced'){
  basicUnits.filter(u=>!u.grad&&weak(u.id)).forEach(u=>plan.push({u:u.id,s:'refresh'}));
 }
 if(track==='advanced'||track==='auto'){
  order.forEach(u=>plan.push({u:u.id,s:!u.grad&&known(u.id)?'known':'learn'}));
 }
 return plan;
}
const recommendTrack=pl=>!pl?'basic':(pl.level==='Beginner'||pl.level==='Basic')?'basic':'auto';
