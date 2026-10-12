/* =====================================================================
   Aqlyon mascot for the academy app
   mascot(pose,{say,cls}) returns the HTML for one mascot with an optional speech bubble.
   Poses with eye layers (present, think, sit, desk) follow the pointer with their eyes;
   the body never moves. The other poses (wave, celebrate, thumbs, cert) pop in once.
   ===================================================================== */
const MASCOTS={
 present:{w:540,h:792,ox:.47,oy:.27,eyes:[[36.11,24.24,8.889],[50,23.11,8.519]]},
 think:{w:520,h:1025,ox:.48,oy:.26,eyes:[[32.69,25.17,11.54],[51.15,21.17,11.54]]},
 sit:{w:520,h:831,ox:.43,oy:.23,eyes:[[30.58,20.10,9.615],[46.15,18.89,9.615]]},
 desk:{w:552,h:506,ox:.52,oy:.30,eyes:[[41.30,29.05,7.971],[53.99,27.08,7.971]]},
 wave:{w:437,h:760},celebrate:{w:716,h:760},thumbs:{w:347,h:760},cert:{w:480,h:760}
};
function mascot(pose,{say='',cls=''}={}){
 const M=MASCOTS[pose],src=`/img/m/${pose}`;
 const eyes=M.eyes?M.eyes.map(([l,t,w],i)=>`<img src="${src}-iris-${'lr'[i]}.png" alt="" class="iris" style="left:${l}%;top:${t}%;width:${w}%">`).join(''):'';
 return `<figure class="masc m-${pose} ${cls}">${say?`<p class="mbub">${say}</p>`:''}<div class="mimg ${M.eyes?'':'pop'}" style="aspect-ratio:${M.w}/${M.h}" aria-hidden="true" ${M.eyes?`data-eyes data-w="${M.w}" data-ox="${M.ox}" data-oy="${M.oy}"`:''}><img src="${src}.webp" alt="" class="mbase" width="${M.w}" height="${M.h}">${eyes}</div></figure>`;
}
/* eyes: one loop for the whole app, so mascots added on any screen just work */
(()=>{let px=null,py=null,last=0;const S=new WeakMap();
 const still=matchMedia('(prefers-reduced-motion: reduce)');
 addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;px=e.clientX;py=e.clientY;last=performance.now()},{passive:true});
 const tick=t=>{requestAnimationFrame(tick);
  document.querySelectorAll('[data-eyes]').forEach(m=>{
   const r=m.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!r.width)return;
   let o=S.get(m);if(!o){o={cx:0,cy:0,ph:Math.random()*9,eyes:[...m.querySelectorAll('.iris')]};S.set(m,o)}
   let tx=0,ty=0;
   if(px!==null&&t-last<2600){tx=Math.max(-1,Math.min(1,(px-(r.left+r.width*+m.dataset.ox))/(innerWidth*.45)));ty=Math.max(-1,Math.min(1,(py-(r.top+r.height*+m.dataset.oy))/(innerHeight*.45)))}
   else if(!still.matches){tx=Math.sin(t/1700+o.ph)*.55;ty=Math.sin(t/2300+o.ph)*.25}
   o.cx+=(tx-o.cx)*.08;o.cy+=(ty-o.cy)*.08;const k=r.width/+m.dataset.w;
   o.eyes.forEach(i=>i.style.transform=`translate(${(o.cx*5.5*k).toFixed(2)}px,${(o.cy*2.6*k).toFixed(2)}px)`)});
 };
 requestAnimationFrame(tick);
})();
