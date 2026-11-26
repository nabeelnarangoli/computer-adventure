/* =====================================================================
   Certificates: drawing (shared by the admin preview and the PDF generator)
   drawCert(canvas, D, P, imgs) draws one A4-landscape certificate on a canvas of any size.
     D = the event's certificate design (e.cert, see netlify/lib/events.mjs cleanCert)
     P = one recipient: {name, event, date, venue, organiser, ref, answers:{label: value}}
     imgs = {logo, logo2, sign0, sign1, sign2} loaded Image objects (or null)
   Templates: classic (ivory, double frame, gold seal), modern (colour panel), elegant (dark, gold frame).
   Fonts (public/fonts/cert, SIL Open Font Licence): Cinzel, Cormorant Garamond, Great Vibes, Montserrat.
   ===================================================================== */
const CERT_FONTS=[['Cinzel','600','normal','cinzel-latin-600-normal'],['Cinzel','700','normal','cinzel-latin-700-normal'],
 ['Cormorant Garamond','500','normal','cormorant-garamond-latin-500-normal'],['Cormorant Garamond','600','normal','cormorant-garamond-latin-600-normal'],
 ['Cormorant Garamond','700','normal','cormorant-garamond-latin-700-normal'],['Cormorant Garamond','500','italic','cormorant-garamond-latin-500-italic'],
 ['Great Vibes','400','normal','great-vibes-latin-400-normal'],['Montserrat','400','normal','montserrat-latin-400-normal'],
 ['Montserrat','500','normal','montserrat-latin-500-normal'],['Montserrat','600','normal','montserrat-latin-600-normal'],['Montserrat','700','normal','montserrat-latin-700-normal']];
let certFontsReady=null;
function certLoadFonts(){
 if(!certFontsReady)certFontsReady=Promise.all(CERT_FONTS.map(([f,w,s,file])=>{const ff=new FontFace(f,`url(/fonts/cert/${file}.woff2)`,{weight:w,style:s});return ff.load().then(x=>document.fonts.add(x)).catch(()=>null)}));
 return certFontsReady;
}
const CERT_DEFAULT={tpl:'classic',color:'#0D2B22',title:'Certificate',subtitle:'of Participation',pre:'This certificate is proudly presented to',
 body:'for actively participating in {event}, held on {date} at {venue}.',nameStyle:'script',org:'',logo:'',logo2:'',signs:[{name:'',title:'',img:''}],showId:true,issued:'',footer:''};
const CERT_TPLS=[['classic','Classic','Ivory paper, double frame and a gold seal'],['modern','Modern','Clean white with a colour panel'],['elegant','Elegant','Deep colour with a gold frame']];

// fill {placeholders}: {name} {event} {date} {venue} {organiser} {ref}, and any registration question by its label, e.g. {Category}
function certFill(text,P){
 const map={name:P.name,event:P.event,date:P.date,venue:P.venue,organiser:P.organiser,organizer:P.organiser,ref:P.ref};
 return String(text||'').replace(/\{([^{}]{1,60})\}/g,(m,k)=>{const key=k.trim().toLowerCase();if(key in map)return map[key]||'';const a=Object.entries(P.answers||{}).find(([l])=>l.trim().toLowerCase()===key);return a?a[1]:''}).replace(/\s+([,.])/g,'$1').replace(/\s{2,}/g,' ').trim();
}
const certMix=(hex,w,amt)=>{const h=hex.replace('#','');const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));const t=w==='w'?255:0;return '#'+c.map(v=>Math.round(v+(t-v)*amt).toString(16).padStart(2,'0')).join('')};
function certGold(ctx,x0,y0,x1,y1){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#9C6F1E');g.addColorStop(.28,'#E3C06B');g.addColorStop(.5,'#B8892B');g.addColorStop(.72,'#F0D489');g.addColorStop(1,'#A47422');return g}
// wrap text to lines that fit maxW; returns lines
function certLines(ctx,text,maxW){const words=String(text).split(/\s+/).filter(Boolean),lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t}if(cur)lines.push(cur);return lines}
// largest font size (down to min) at which the text fits in maxW on at most maxLines lines
function certFit(ctx,font,text,size,min,maxW,maxLines){for(let s=size;s>=min;s-=2){ctx.font=font(s);const l=certLines(ctx,text,maxW);if(l.length<=maxLines)return {s,lines:l}}ctx.font=font(min);return {s:min,lines:certLines(ctx,text,maxW).slice(0,maxLines)}}
function certText(ctx,lines,x,y,lh,align='center'){ctx.textAlign=align;lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lh));return y+(lines.length-1)*lh}
// draw an image to fit a box, keeping its shape; mode multiply hides a white background, invert makes dark ink light
function certImg(ctx,img,cx,cy,maxW,maxH,mode){if(!img)return 0;const k=Math.min(maxW/img.width,maxH/img.height);const w=img.width*k,h=img.height*k;ctx.save();
 if(mode==='multiply')ctx.globalCompositeOperation='multiply';if(mode==='invert'){ctx.filter='invert(1)';ctx.globalCompositeOperation='screen'}ctx.drawImage(img,cx-w/2,cy-h/2,w,h);ctx.restore();return w}

// gold rosette seal with ribbon tails
function certSeal(ctx,cx,cy,r,label,sub){
 ctx.save();
 // ribbon tails
 ctx.fillStyle=certGold(ctx,cx-r,cy,cx+r,cy+r*2);
 for(const d of [-1,1]){ctx.beginPath();ctx.moveTo(cx+d*r*.25,cy+r*.55);ctx.lineTo(cx+d*r*.72,cy+r*1.45);ctx.lineTo(cx+d*r*.5,cy+r*1.3);ctx.lineTo(cx+d*r*.32,cy+r*1.55);ctx.lineTo(cx+d*r*-.05,cy+r*.7);ctx.closePath();ctx.fill()}
 // serrated edge
 ctx.beginPath();const n=36;for(let i=0;i<=n*2;i++){const a=i*Math.PI/n,rr=i%2?r:r*.9;ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}ctx.closePath();
 ctx.fillStyle=certGold(ctx,cx-r,cy-r,cx+r,cy+r);ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=r*.12;ctx.shadowOffsetY=r*.04;ctx.fill();ctx.shadowColor='transparent';
 ctx.lineWidth=r*.035;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(cx,cy,r*.74,0,7);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r*.66,0,7);ctx.stroke();
 ctx.fillStyle='#5A3D0C';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font=`700 ${r*.2}px Cinzel`;ctx.fillText(label,cx,cy-r*.12);ctx.font=`600 ${r*.14}px Cinzel`;ctx.fillText(sub,cx,cy+r*.16);
 // stars
 ctx.font=`${r*.14}px serif`;ctx.fillText('★',cx-r*.32,cy+r*.42);ctx.fillText('★',cx,cy+r*.46);ctx.fillText('★',cx+r*.32,cy+r*.42);
 ctx.restore();ctx.textBaseline='alphabetic';
}
// corner flourish for the classic frame
function certCorner(ctx,x,y,sx,sy,u,col){
 ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);ctx.strokeStyle=col;ctx.lineWidth=u*2.2;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(0,u*70);ctx.lineTo(0,0);ctx.lineTo(u*70,0);ctx.stroke();
 ctx.lineWidth=u*1.4;ctx.beginPath();ctx.moveTo(u*12,u*58);ctx.bezierCurveTo(u*12,u*26,u*26,u*12,u*58,u*12);ctx.stroke();
 ctx.beginPath();ctx.arc(u*22,u*22,u*6,0,7);ctx.fillStyle=col;ctx.fill();
 ctx.beginPath();ctx.moveTo(u*36,u*30);ctx.quadraticCurveTo(u*48,u*30,u*54,u*22);ctx.moveTo(u*30,u*36);ctx.quadraticCurveTo(u*30,u*48,u*22,u*54);ctx.stroke();
 ctx.restore();
}

function drawCert(cv,D0,P,imgs={}){
 const D=Object.assign({},CERT_DEFAULT,D0||{}),W=cv.width,H=cv.height,u=W/1000,ctx=cv.getContext('2d'),C=/^#[0-9a-f]{6}$/i.test(D.color)?D.color:'#0D2B22';
 const tpl=D.tpl,dark=tpl==='elegant';
 ctx.save();ctx.clearRect(0,0,W,H);ctx.textBaseline='alphabetic';
 const ink=dark?'#F6F1E4':'#1E2420',soft=dark?'rgba(246,241,228,.78)':'#4A524D',gold=certGold(ctx,0,0,W,H);
 let cx=W/2,colW=W*.72,top=0;   // text column
 /* ---- background & frame ---- */
 if(tpl==='classic'){
  ctx.fillStyle='#FBF7EC';ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.65);g.addColorStop(0,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(214,196,150,.18)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=C;const b=u*22;ctx.fillRect(0,0,W,b);ctx.fillRect(0,H-b,W,b);ctx.fillRect(0,0,b,H);ctx.fillRect(W-b,0,b,H);
  ctx.strokeStyle=gold;ctx.lineWidth=u*3.2;ctx.strokeRect(u*34,u*34,W-u*68,H-u*68);ctx.lineWidth=u*1.1;ctx.strokeRect(u*42,u*42,W-u*84,H-u*84);
  const m=u*50;certCorner(ctx,m,m,1,1,u,gold);certCorner(ctx,W-m,m,-1,1,u,gold);certCorner(ctx,m,H-m,1,-1,u,gold);certCorner(ctx,W-m,H-m,-1,-1,u,gold);
  // faint guilloche watermark
  ctx.save();ctx.globalAlpha=.07;ctx.strokeStyle=C;ctx.lineWidth=u*.8;for(let i=0;i<18;i++){ctx.beginPath();ctx.ellipse(W/2,H/2+u*10,u*(120+i*9),u*(70+i*5),i*.17,0,7);ctx.stroke()}ctx.restore();
  top=u*68;
 }else if(tpl==='modern'){
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
  const pw=W*.27;ctx.fillStyle=C;ctx.fillRect(0,0,pw,H);
  ctx.fillStyle=certMix(C,'w',.12);ctx.beginPath();ctx.moveTo(pw*.35,H);ctx.lineTo(pw,H*.45);ctx.lineTo(pw,H);ctx.closePath();ctx.fill();
  ctx.fillStyle=certMix(C,'k',.18);ctx.beginPath();ctx.moveTo(0,H*.72);ctx.lineTo(pw*.7,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
  ctx.fillStyle=gold;ctx.fillRect(pw,0,u*7,H);
  ctx.strokeStyle='#E7E2D6';ctx.lineWidth=u*1.2;ctx.strokeRect(pw+u*36,u*36,W-pw-u*72,H-u*72);
  cx=pw+(W-pw)/2;colW=(W-pw)*.8;top=u*96;
 }else{ // elegant
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,certMix(C,'k',.1));g.addColorStop(1,certMix(C,'k',.45));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.08;ctx.strokeStyle='#E3C06B';ctx.lineWidth=u*.8;for(let i=0;i<26;i++){ctx.beginPath();ctx.arc(W/2,H*1.15,u*(160+i*16),Math.PI*1.05,Math.PI*1.95);ctx.stroke()}ctx.restore();
  ctx.strokeStyle=gold;ctx.lineWidth=u*4;ctx.strokeRect(u*28,u*28,W-u*56,H-u*56);ctx.lineWidth=u*1.2;ctx.strokeRect(u*40,u*40,W-u*80,H-u*80);
  for(const [x,y] of [[u*40,u*40],[W-u*40,u*40],[u*40,H-u*40],[W-u*40,H-u*40]]){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=gold;ctx.fillRect(-u*9,-u*9,u*18,u*18);ctx.restore()}
  top=u*66;
 }
 /* ---- logos & organiser ---- */
 const L=imgs.logo,L2=imgs.logo2;
 if(tpl==='modern'){
  const pw=W*.27;let y=u*110;
  if(L){ctx.fillStyle='#fff';const bw=pw*.62,bh=u*120;ctx.beginPath();ctx.roundRect(pw/2-bw/2,y-u*10,bw,bh,u*14);ctx.fill();certImg(ctx,L,pw/2,y-u*10+bh/2,bw*.82,bh*.78);y+=bh+u*36}
  if(L2){ctx.fillStyle='#fff';const bw=pw*.5,bh=u*84;ctx.beginPath();ctx.roundRect(pw/2-bw/2,y,bw,bh,u*12);ctx.fill();certImg(ctx,L2,pw/2,y+bh/2,bw*.8,bh*.76);y+=bh+u*30}
  if(D.org){ctx.fillStyle='#fff';const f=certFit(ctx,s=>`600 ${s}px Montserrat`,D.org.toUpperCase(),u*17,u*11,pw*.78,3);ctx.letterSpacing=`${u*1.6}px`;certText(ctx,f.lines,pw/2,y+f.s,f.s*1.35);ctx.letterSpacing='0px'}
 }else{
  const lh=u*50;let shown=[L,L2].filter(Boolean);
  if(dark)shown.forEach((im,i)=>{const x=shown.length===2?cx+(i?1:-1)*u*70:cx;ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.roundRect(x-u*62,top-u*6,u*124,lh+u*12,u*10);ctx.fill();certImg(ctx,im,x,top+lh/2,u*108,lh)});
  else shown.forEach((im,i)=>certImg(ctx,im,shown.length===2?cx+(i?1:-1)*u*80:cx,top+lh/2,u*140,lh,'multiply'));
  if(shown.length)top+=lh+u*12;
  if(D.org){ctx.fillStyle=dark?'#E3C06B':C;ctx.font=`600 ${u*13.5}px Montserrat`;ctx.letterSpacing=`${u*2.4}px`;ctx.textAlign='center';ctx.fillText(D.org.toUpperCase(),cx,top+u*13);ctx.letterSpacing='0px';top+=u*22}
 }
 /* ---- title ---- */
 const tTop=tpl==='modern'?u*150:top+u*50;
 ctx.fillStyle=dark?gold:C;ctx.textAlign='center';
 let f=certFit(ctx,s=>`700 ${s}px Cinzel`,(D.title||'').toUpperCase(),u*50,u*28,colW,1);ctx.letterSpacing=`${u*4.5}px`;ctx.fillText(f.lines[0]||'',cx,tTop);ctx.letterSpacing='0px';
 let y=tTop+u*32;
 if(D.subtitle){ctx.fillStyle=dark?'#E8D3A0':soft;ctx.font=`600 ${u*17}px Cinzel`;ctx.letterSpacing=`${u*5.5}px`;ctx.fillText(D.subtitle.toUpperCase(),cx,y);ctx.letterSpacing='0px';y+=u*10}
 // ornament rule
 y+=u*14;ctx.strokeStyle=dark?'rgba(227,192,107,.8)':gold;ctx.lineWidth=u*1.3;ctx.beginPath();ctx.moveTo(cx-u*110,y);ctx.lineTo(cx-u*13,y);ctx.moveTo(cx+u*13,y);ctx.lineTo(cx+u*110,y);ctx.stroke();
 ctx.save();ctx.translate(cx,y);ctx.rotate(Math.PI/4);ctx.fillStyle=dark?'#E3C06B':gold;ctx.fillRect(-u*4.5,-u*4.5,u*9,u*9);ctx.restore();
 /* ---- presented to + name ---- */
 y+=u*38;ctx.fillStyle=soft;ctx.font=`italic 500 ${u*20}px "Cormorant Garamond"`;ctx.fillText(certFill(D.pre,P),cx,y);
 const script=D.nameStyle!=='serif';y+=script?u*70:u*62;
 f=certFit(ctx,s=>script?`400 ${s}px "Great Vibes"`:`700 ${s}px "Cormorant Garamond"`,P.name||'',script?u*72:u*56,u*30,colW*.95,1);
 ctx.fillStyle=dark?'#FFFFFF':ink;ctx.fillText(f.lines[0]||'',cx,y);
 y+=u*18;ctx.strokeStyle=dark?'rgba(227,192,107,.75)':gold;ctx.lineWidth=u*1.1;ctx.beginPath();ctx.moveTo(cx-colW*.32,y);ctx.lineTo(cx+colW*.32,y);ctx.stroke();
 /* ---- body: as large as fits above the signatures ---- */
 const baseY=H-u*(tpl==='modern'?112:128);           // signature line
 const limit=baseY-u*72;                               // the body ends above the signature images
 y+=u*36;ctx.fillStyle=dark?'rgba(246,241,228,.92)':'#30362F';
 const bodyTxt=certFill(D.body,P);let bs=u*22,bl;
 for(;bs>=u*14;bs-=u*1){ctx.font=`500 ${bs}px "Cormorant Garamond"`;bl=certLines(ctx,bodyTxt,colW*.86);if(bl.length<=4&&y+(bl.length-1)*bs*1.3<=limit)break}
 certText(ctx,bl.slice(0,4),cx,y,bs*1.3);
 /* ---- signatures, seal, footer ---- */
 const signs=(D.signs||[]).filter(s=>s&&(s.name||s.title||s.img)).slice(0,3);
 const sealR=u*44,hasSeal=tpl!=='modern';
 let slots=[];
 if(signs.length===1)slots=hasSeal?[cx+colW*.3]:[cx+colW*.28];
 else if(signs.length===2)slots=[cx-colW*.34,cx+colW*.34];
 else if(signs.length===3)slots=hasSeal?[cx-colW*.4,cx+colW*.4,null]:[cx-colW*.36,cx,cx+colW*.36];
 if(signs.length===3&&hasSeal)slots=[cx-colW*.42,cx-colW*.2,cx+colW*.42];
 const sw=u*170;
 signs.forEach((s,i)=>{const x=slots[i];if(x==null)return;
  const im=imgs['sign'+(D.signs||[]).indexOf(s)];if(im)certImg(ctx,im,x,baseY-u*28,sw*.9,u*50,dark?'invert':'multiply');
  ctx.strokeStyle=dark?'rgba(246,241,228,.6)':'#8B8F87';ctx.lineWidth=u*1;ctx.beginPath();ctx.moveTo(x-sw/2,baseY);ctx.lineTo(x+sw/2,baseY);ctx.stroke();
  ctx.fillStyle=dark?'#FFFFFF':ink;ctx.font=`600 ${u*14}px Montserrat`;ctx.textAlign='center';const nf=certFit(ctx,z=>`600 ${z}px Montserrat`,s.name||'',u*14,u*10,sw*1.15,1);ctx.fillText(nf.lines[0]||'',x,baseY+u*22);
  ctx.fillStyle=soft;const tf=certFit(ctx,z=>`500 ${z}px Montserrat`,s.title||'',u*12,u*7.5,sw*1.4,1);ctx.font=`500 ${tf.s}px Montserrat`;ctx.fillText(s.title||'',x,baseY+u*40,sw*1.4)});
 if(hasSeal){const sx=signs.length===3?cx+colW*.11:signs.length===2?cx:signs.length===1?cx-colW*.28:cx;const yr=String(P.year||new Date().getFullYear());certSeal(ctx,sx,baseY-u*6,sealR,'CERTIFIED',yr)}
 else{ // modern: small gold medal in the panel
  certSeal(ctx,W*.135,H-u*150,u*52,'AWARD',String(P.year||new Date().getFullYear()))}
 // certificate number and issue date
 ctx.font=`500 ${u*10.5}px Montserrat`;ctx.fillStyle=dark?'rgba(246,241,228,.65)':'#7A7F77';ctx.letterSpacing=`${u*.8}px`;
 const meta=[D.showId&&P.ref?`Certificate No. ${P.ref}`:'',P.issued?`Issued ${P.issued}`:''].filter(Boolean).join('   ·   ');
 if(meta){ctx.textAlign='center';ctx.fillText(meta,cx,H-u*(tpl==='modern'?50:54))}
 if(D.footer){ctx.textAlign='center';ctx.fillText(certFill(D.footer,P),cx,H-u*(tpl==='modern'?66:70))}
 ctx.letterSpacing='0px';ctx.restore();
}
