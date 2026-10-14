/* Participant badge at /badge/<token>: shows the event pass with a QR code for check-in,
   and lets the person save it as an image or print it. Data comes from window.BADGE. */
(()=>{
const B=window.BADGE,E=B.event,$=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TZN={'Asia/Kolkata':'IST','Asia/Dubai':'GST','Asia/Riyadh':'AST','Asia/Qatar':'AST','Europe/London':'UK time'};
const fmt=(ms,o)=>new Intl.DateTimeFormat('en-GB',{timeZone:E.tz||'Asia/Kolkata',...o}).format(ms);
const day=fmt(E.startUTC,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const time=fmt(E.startUTC,{hour:'numeric',minute:'2-digit',hour12:true})+(E.endUTC?' – '+fmt(E.endUTC,{hour:'numeric',minute:'2-digit',hour12:true}):'')+' '+(TZN[E.tz]||E.tzLabel||'');
const place=E.mode==='online'?'Online event':E.locationName;
const first=String(B.name).trim().split(/\s+/)[0];

// QR code as a list of dark squares (drawn as SVG on screen and on a canvas for the saved image)
const qr=qrcode(0,'M');qr.addData(B.qr);qr.make();const N=qr.getModuleCount();
const qrSVG=()=>{let d='';for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(qr.isDark(y,x))d+=`M${x+4} ${y+4}h1v1h-1z`;
 return `<svg viewBox="0 0 ${N+8} ${N+8}" role="img" aria-label="QR code for check-in" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0D2B22"/></svg>`};

const ROLE_CLS={Student:'stu',Parent:'par'};
const state=!B.valid?(B.status==='pending'?'pending':'off'):B.attended?'in':'ok';
const at=B.attended?new Date(B.attended).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true}):'';

$('#badge').innerHTML=`
<p class="bdgtop"><a href="/events/${esc(E.slug)}"><img src="/img/aqlyon-q.png" alt="" width="28" height="28"><span><b>Aqlyon</b> Career Discovery Centre</span></a></p>
<article class="bdg st-${state}" aria-label="Event badge for ${esc(B.name)}">
 <header class="bdghd"><span class="bdgkick">Event pass</span><h1>${esc(E.title)}</h1>
  <p class="bdgwhen"><b>${esc(day)}</b><span>${esc(time)}</span></p><p class="bdgwhere">${esc(place)}</p></header>
 <div class="bdgcut" aria-hidden="true"></div>
 <section class="bdgwho"><p class="bdglbl">Participant</p><h2>${esc(B.name)}</h2>
  <p class="bdgchips">${B.role?`<span class="chip ${ROLE_CLS[B.role]||''}">${esc(B.role)}</span>`:''}${B.seats>1?`<span class="chip adm">Admits ${B.seats}</span>`:''}</p></section>
 <section class="bdgqr">${state==='ok'||state==='in'?`<div class="qrbox">${qrSVG()}</div>${state==='in'?`<p class="stamp">✓ Checked in · ${esc(at)}</p>`:''}<p class="bdgref">Ref <b>${esc(B.ref)}</b></p><p class="bdghint">Show this QR code at the entrance</p>`
  :state==='pending'?`<div class="qrbox off"><span>⏳</span></div><p class="bdgref">Ref <b>${esc(B.ref)}</b></p><p class="bdgwarn">Your badge is not active yet. It will work once your registration is approved. Open this page again after you get the confirmation.</p>`
  :`<div class="qrbox off"><span>✕</span></div><p class="bdgref">Ref <b>${esc(B.ref)}</b></p><p class="bdgwarn bad">This registration is ${esc(B.status)}, so the badge can't be used. Contact Aqlyon Career Discovery Centre if this is a mistake.</p>`}</section>
</article>
${state==='ok'||state==='in'?`<div class="bdgbtns"><button type="button" class="btn" id="save">Save badge image</button><button type="button" class="btn line" id="print">Print</button></div>
<p class="bdgnote">Tip: save the image to your phone so you can show it without internet. Hi ${esc(first)}, see you there!</p>`:''}
<p class="bdgnote"><a href="/events/${esc(E.slug)}">Event details</a>${E.mapUrl&&E.mode!=='online'?` · <a href="${esc(E.mapUrl)}" target="_blank" rel="noopener">Directions</a>`:''}</p>`;

const pr=$('#print');if(pr)pr.onclick=()=>print();
const sv=$('#save');if(sv)sv.onclick=async()=>{sv.disabled=true;sv.textContent='Preparing…';
 try{const blob=await drawImage();const name=`${E.slug}-badge-${B.ref}.png`;
  const file=new File([blob],name,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({files:[file],title:E.title})}catch(x){}}
  else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
 }catch(x){alert('Could not make the image. Take a screenshot instead.')}
 sv.disabled=false;sv.textContent='Save badge image'};

// the same badge drawn on a canvas, 1080 × 1700, for the saved image
async function drawImage(){
 try{await Promise.all(['500 30px "Instrument Sans"','600 30px "Instrument Sans"','700 30px "Instrument Sans"','800 60px "Bricolage Grotesque"'].map(f=>document.fonts.load(f)));await document.fonts.ready}catch(x){}
 const W=1080,H=1700,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 const DISP='"Bricolage Grotesque", system-ui, sans-serif',BODY='"Instrument Sans", system-ui, sans-serif';
 const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
 const wrap=(t,x,y,maxW,lh,maxLines)=>{const words=String(t).split(/\s+/);let line='',n=0;for(let i=0;i<words.length;i++){const test=line?line+' '+words[i]:words[i];
  if(g.measureText(test).width>maxW&&line){if(n===maxLines-1){while(g.measureText(line+'…').width>maxW)line=line.slice(0,-1);g.fillText(line+'…',x,y);return y+lh}g.fillText(line,x,y);y+=lh;n++;line=words[i]}else line=test}g.fillText(line,x,y);return y+lh};
 g.fillStyle='#E3F3EA';g.fillRect(0,0,W,H);
 const X=70,Y=70,CW=W-140,CH=H-140;
 g.save();rr(X,Y,CW,CH,48);g.clip();g.fillStyle='#fff';g.fillRect(X,Y,CW,CH);
 // header
 g.fillStyle='#0D2B22';g.fillRect(X,Y,CW,560);
 const logo=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src='/img/aqlyon-q.png'});
 if(logo)g.drawImage(logo,X+60,Y+56,64,64);
 g.fillStyle='#fff';g.font=`700 34px ${BODY}`;g.textBaseline='middle';g.fillText('Aqlyon',X+140,Y+76);g.font=`500 26px ${BODY}`;g.fillStyle='#BFE3CF';g.fillText('Career Discovery Centre',X+140,Y+108);
 g.textBaseline='alphabetic';g.fillStyle='#FFE24A';g.font=`700 26px ${BODY}`;g.fillText('EVENT PASS',X+60,Y+200);
 g.fillStyle='#fff';g.font=`800 64px ${DISP}`;let y=wrap(E.title,X+60,Y+275,CW-120,72,2);
 g.font=`600 32px ${BODY}`;g.fillStyle='#fff';g.fillText(day,X+60,y+20);g.fillStyle='#BFE3CF';g.font=`500 30px ${BODY}`;g.fillText(time,X+60,y+64);
 wrap(place,X+60,y+108,CW-120,38,1);
 g.restore();
 // perforation
 g.fillStyle='#E3F3EA';g.beginPath();g.arc(X,Y+560,30,0,7);g.arc(X+CW,Y+560,30,0,7);g.fill();
 g.strokeStyle='#CDEBDA';g.setLineDash([16,14]);g.lineWidth=4;g.beginPath();g.moveTo(X+50,Y+560);g.lineTo(X+CW-50,Y+560);g.stroke();g.setLineDash([]);
 // participant
 g.fillStyle='#4A5F56';g.font=`600 26px ${BODY}`;g.fillText('PARTICIPANT',X+60,Y+640);
 g.fillStyle='#0D2B22';g.font=`800 60px ${DISP}`;y=wrap(B.name,X+60,Y+710,CW-120,66,2);
 let cx=X+60;const chip=(t,bg,fg)=>{g.font=`700 28px ${BODY}`;const w=g.measureText(t).width+44;rr(cx,y-14,w,52,26);g.fillStyle=bg;g.fill();g.fillStyle=fg;g.fillText(t,cx+22,y+21);cx+=w+14};
 if(B.role)chip(B.role,B.role==='Parent'?'#FFF3B0':'#CDEBDA','#0D2B22');if(B.seats>1)chip('Admits '+B.seats,'#0D2B22','#fff');
 // QR
 const QS=520,qx=(W-QS)/2,qy=Y+CH-QS-200;const cell=QS/(N+8);
 g.fillStyle='#fff';g.fillRect(qx,qy,QS,QS);g.fillStyle='#0D2B22';
 for(let r=0;r<N;r++)for(let k=0;k<N;k++)if(qr.isDark(r,k))g.fillRect(Math.floor(qx+(k+4)*cell),Math.floor(qy+(r+4)*cell),Math.ceil(cell),Math.ceil(cell));
 g.strokeStyle='#D5E5DB';g.lineWidth=3;rr(qx-6,qy-6,QS+12,QS+12,24);g.stroke();
 g.textAlign='center';g.fillStyle='#0D2B22';g.font=`700 34px ${BODY}`;g.fillText('Ref '+B.ref,W/2,qy+QS+64);
 g.fillStyle='#4A5F56';g.font=`500 28px ${BODY}`;g.fillText('Show this QR code at the entrance',W/2,qy+QS+110);
 return await new Promise(res=>c.toBlob(res,'image/png'));
}
})();
