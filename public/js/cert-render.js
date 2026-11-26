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
const CERT_PLACES=['','First Place','Second Place','Third Place'],CERT_RANK=['','1st','2nd','3rd'],CERT_BLANK='____________';
function certFill(text,P){
 const pl=+P.place||0,B=!!P.blank;   // blank certificates: anything about one person becomes a line to write on
 const map={name:B?CERT_BLANK:P.name,event:P.event,date:P.date,venue:P.venue,organiser:P.organiser,organizer:P.organiser,ref:B?'':P.ref,place:pl?CERT_PLACES[pl]:(B?CERT_BLANK:''),position:pl?CERT_PLACES[pl]:(B?CERT_BLANK:''),rank:pl?CERT_RANK[pl]:(B?CERT_BLANK:'')};
 return String(text||'').replace(/\{([^{}]{1,60})\}/g,(m,k)=>{const key=k.trim().toLowerCase();if(key in map)return map[key]||'';if(B)return CERT_BLANK;const a=Object.entries(P.answers||{}).find(([l])=>l.trim().toLowerCase()===key);return a?a[1]:''}).replace(/\s+([,.])/g,'$1').replace(/\s{2,}/g,' ').trim();
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
const CERT_METAL={gold:['#9C6F1E','#E3C06B','#B8892B','#F0D489','#A47422','#5A3D0C'],silver:['#7D838A','#E9ECEF','#A3A9B0','#F7F8FA','#80868D','#33383E'],bronze:['#7A4520','#E0A774','#9E6233','#EFC49A','#85502A','#3F230D']};
function certMetal(ctx,x0,y0,x1,y1,m){const c=CERT_METAL[m]||CERT_METAL.gold,g=ctx.createLinearGradient(x0,y0,x1,y1);[0,.28,.5,.72,1].forEach((t,i)=>g.addColorStop(t,c[i]));return g}
// a place medal: 1st gold, 2nd silver, 3rd bronze
function certMedal(ctx,cx,cy,r,place){certSeal(ctx,cx,cy,r,CERT_RANK[place].toUpperCase(),'PLACE',['','gold','silver','bronze'][place],true)}
function certSeal(ctx,cx,cy,r,label,sub,metal='gold',big=false){
 ctx.save();const ink=(CERT_METAL[metal]||CERT_METAL.gold)[5];
 // ribbon tails
 ctx.fillStyle=certMetal(ctx,cx-r,cy,cx+r,cy+r*2,metal);
 for(const d of [-1,1]){ctx.beginPath();ctx.moveTo(cx+d*r*.25,cy+r*.55);ctx.lineTo(cx+d*r*.72,cy+r*1.45);ctx.lineTo(cx+d*r*.5,cy+r*1.3);ctx.lineTo(cx+d*r*.32,cy+r*1.55);ctx.lineTo(cx+d*r*-.05,cy+r*.7);ctx.closePath();ctx.fill()}
 // serrated edge
 ctx.beginPath();const n=36;for(let i=0;i<=n*2;i++){const a=i*Math.PI/n,rr=i%2?r:r*.9;ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}ctx.closePath();
 ctx.fillStyle=certMetal(ctx,cx-r,cy-r,cx+r,cy+r,metal);ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=r*.12;ctx.shadowOffsetY=r*.04;ctx.fill();ctx.shadowColor='transparent';
 ctx.lineWidth=r*.035;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(cx,cy,r*.74,0,7);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r*.66,0,7);ctx.stroke();
 ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
 if(big){ctx.font=`700 ${r*.42}px Cinzel`;ctx.fillText(label,cx,cy-r*.1);ctx.font=`700 ${r*.15}px Cinzel`;ctx.letterSpacing=`${r*.03}px`;ctx.fillText(sub,cx,cy+r*.26);ctx.letterSpacing='0px'}
 else{ctx.font=`700 ${r*.2}px Cinzel`;ctx.fillText(label,cx,cy-r*.12);ctx.font=`600 ${r*.14}px Cinzel`;ctx.fillText(sub,cx,cy+r*.16)}
 // stars
 if(!big){ctx.font=`${r*.14}px serif`;ctx.fillText('★',cx-r*.32,cy+r*.42);ctx.fillText('★',cx,cy+r*.46);ctx.fillText('★',cx+r*.32,cy+r*.42)}
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

/* ---- movable elements: each part of the certificate can be moved and resized ----
   D.layout[template][key] = {x, y, s}: offset as a fraction of the width/height, and a size factor.
   Keys: logo, logo2, logo3, org, title, pre, name, body, signs, seal, meta.
   While drawing, every part's box is recorded in canvas._hits so the admin preview can pick it up. */
let CERT_R=null;
function certBeginLayout(cv,D){CERT_R={lay:(D.layout&&D.layout[D.tpl])||{},W:cv.width,H:cv.height,hits:[]};cv._hits=CERT_R.hits}
function certEl(ctx,key,ax,ay,fn){
 const R=CERT_R;if(!R)return fn();const o=R.lay[key]||{},dx=(+o.x||0)*R.W,dy=(+o.y||0)*R.H,s=+o.s||1;
 ctx.save();ctx.translate(ax+dx,ay+dy);ctx.scale(s,s);ctx.translate(-ax,-ay);let b=null;try{b=fn()}finally{ctx.restore()}
 if(b)R.hits.push({key,ax:ax+dx,ay:ay+dy,x0:ax+dx+(b[0]-ax)*s,y0:ay+dy+(b[1]-ay)*s,x1:ax+dx+(b[2]-ax)*s,y1:ay+dy+(b[3]-ay)*s});
}
// box of a line of text drawn at (x, y) with the current font
function certTB(ctx,txt,x,y,size,align){const w=ctx.measureText(String(txt||'')).width,x0=align==='center'?x-w/2:align==='right'?x-w:x;return [x0,y-size*.85,x0+w,y+size*.3]}
const certU=(a,b)=>!a?b:!b?a:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])];
function certImgSize(img,maxW,maxH){if(!img)return [0,0];const k=Math.min(maxW/img.width,maxH/img.height);return [img.width*k,img.height*k]}
function certImgBox(ctx,img,cx,cy,maxW,maxH,mode){const [w,h]=certImgSize(img,maxW,maxH);certImg(ctx,img,cx,cy,maxW,maxH,mode);return [cx-w/2,cy-h/2,cx+w/2,cy+h/2]}

function drawCert(cv,D0,P,imgs={}){
 if(D0&&typeof CERT_ART!=='undefined'&&CERT_ART[D0.tpl])return drawArtCert(cv,Object.assign({},CERT_DEFAULT,D0),P,imgs,CERT_ART[D0.tpl]);
 const D=Object.assign({},CERT_DEFAULT,D0||{}),W=cv.width,H=cv.height,u=W/1000,ctx=cv.getContext('2d'),C=/^#[0-9a-f]{6}$/i.test(D.color)?D.color:'#0D2B22';
 const tpl=D.tpl,dark=tpl==='elegant';
 certBeginLayout(cv,D);
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
 const L=imgs.logo,L2=imgs.logo2,L3=imgs.logo3,place=+P.place||0,logos=[['logo',L],['logo2',L2],['logo3',L3]].filter(x=>x[1]);
 if(tpl==='modern'){
  const pw=W*.27;let y=u*110;
  const big=logos.find(x=>x[0]==='logo');
  if(big){const bw=pw*.62,bh=u*120,by=y-u*10;certEl(ctx,'logo',pw/2,by+bh/2,()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(pw/2-bw/2,by,bw,bh,u*14);ctx.fill();certImg(ctx,L,pw/2,by+bh/2,bw*.82,bh*.78);return [pw/2-bw/2,by,pw/2+bw/2,by+bh]});y+=bh+u*36}
  const sm=logos.filter(x=>x[0]!=='logo');
  if(sm.length){const bw=sm.length===2?pw*.38:pw*.5,bh=u*76;sm.forEach(([k,im],i)=>{const x=sm.length===2?pw/2+(i?1:-1)*pw*.21:pw/2;certEl(ctx,k,x,y+bh/2,()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x-bw/2,y,bw,bh,u*12);ctx.fill();certImg(ctx,im,x,y+bh/2,bw*.8,bh*.76);return [x-bw/2,y,x+bw/2,y+bh]})});y+=bh+u*30}
  if(D.org)certEl(ctx,'org',pw/2,y,()=>{ctx.fillStyle='#fff';const f=certFit(ctx,s=>`600 ${s}px Montserrat`,D.org.toUpperCase(),u*17,u*11,pw*.78,3);ctx.letterSpacing=`${u*1.6}px`;certText(ctx,f.lines,pw/2,y+f.s,f.s*1.35);const mw=Math.max(...f.lines.map(l=>ctx.measureText(l).width));ctx.letterSpacing='0px';return [pw/2-mw/2,y,pw/2+mw/2,y+f.s*1.35*f.lines.length]});
 }else{
  const lh=u*50,n=logos.length;
  logos.forEach(([k,im],i)=>{const x=cx+(i-(n-1)/2)*u*(dark?140:160);
   certEl(ctx,k,x,top+lh/2,()=>{if(dark){ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.roundRect(x-u*62,top-u*6,u*124,lh+u*12,u*10);ctx.fill();certImg(ctx,im,x,top+lh/2,u*108,lh);return [x-u*62,top-u*6,x+u*62,top+lh+u*6]}
    return certImgBox(ctx,im,x,top+lh/2,u*140,lh,'multiply')})});
  if(n)top+=lh+u*12;
  if(D.org){const oy=top+u*13;certEl(ctx,'org',cx,oy,()=>{ctx.fillStyle=dark?'#E3C06B':C;ctx.font=`600 ${u*13.5}px Montserrat`;ctx.letterSpacing=`${u*2.4}px`;ctx.textAlign='center';const t=D.org.toUpperCase();ctx.fillText(t,cx,oy);const b=certTB(ctx,t,cx,oy,u*13.5,'center');ctx.letterSpacing='0px';return b});top+=u*22}
 }
 /* ---- title ---- */
 const tTop=tpl==='modern'?u*150:top+u*50;
 let y=tTop+u*32;
 certEl(ctx,'title',cx,tTop,()=>{
  ctx.fillStyle=dark?gold:C;ctx.textAlign='center';
  const f=certFit(ctx,s=>`700 ${s}px Cinzel`,(D.title||'').toUpperCase(),u*50,u*28,colW,1);ctx.letterSpacing=`${u*4.5}px`;ctx.fillText(f.lines[0]||'',cx,tTop);let b=certTB(ctx,f.lines[0]||'',cx,tTop,f.s,'center');ctx.letterSpacing='0px';
  if(D.subtitle){ctx.fillStyle=dark?'#E8D3A0':soft;ctx.font=`600 ${u*17}px Cinzel`;ctx.letterSpacing=`${u*5.5}px`;ctx.fillText(D.subtitle.toUpperCase(),cx,y);b=certU(b,certTB(ctx,D.subtitle.toUpperCase(),cx,y,u*17,'center'));ctx.letterSpacing='0px';y+=u*10}
  y+=u*14;ctx.strokeStyle=dark?'rgba(227,192,107,.8)':gold;ctx.lineWidth=u*1.3;ctx.beginPath();ctx.moveTo(cx-u*110,y);ctx.lineTo(cx-u*13,y);ctx.moveTo(cx+u*13,y);ctx.lineTo(cx+u*110,y);ctx.stroke();
  ctx.save();ctx.translate(cx,y);ctx.rotate(Math.PI/4);ctx.fillStyle=dark?'#E3C06B':gold;ctx.fillRect(-u*4.5,-u*4.5,u*9,u*9);ctx.restore();
  return certU(b,[cx-u*110,y-u*7,cx+u*110,y+u*7])});
 /* ---- presented to + name ---- */
 y+=u*38;const py=y;
 if(D.pre)certEl(ctx,'pre',cx,py,()=>{ctx.fillStyle=soft;ctx.textAlign='center';ctx.font=`italic 500 ${u*20}px "Cormorant Garamond"`;const t=certFill(D.pre,P);ctx.fillText(t,cx,py);return certTB(ctx,t,cx,py,u*20,'center')});
 const script=!['serif','sans'].includes(D.nameStyle);y+=script?u*70:u*62;const ny=y;y+=u*18;const uy=y;
 certEl(ctx,'name',cx,ny,()=>{
  const nf=script?s=>`400 ${s}px "Great Vibes"`:D.nameStyle==='sans'?s=>`600 ${s}px Montserrat`:s=>`700 ${s}px "Cormorant Garamond"`;
  const f=certFit(ctx,nf,P.name||'',script?u*72:D.nameStyle==='sans'?u*48:u*56,u*30,colW*.95,1);ctx.font=nf(f.s);ctx.textAlign='center';
  ctx.fillStyle=dark?'#FFFFFF':ink;ctx.fillText(f.lines[0]||'',cx,ny);
  ctx.strokeStyle=dark?'rgba(227,192,107,.75)':gold;ctx.lineWidth=u*1.1;ctx.beginPath();ctx.moveTo(cx-colW*.32,uy);ctx.lineTo(cx+colW*.32,uy);ctx.stroke();
  return certU(certTB(ctx,f.lines[0]||'',cx,ny,f.s,'center'),[cx-colW*.32,ny-u*40,cx+colW*.32,uy+u*3])});
 /* ---- body: as large as fits above the signatures ---- */
 const baseY=H-u*(tpl==='modern'?112:128);           // signature line
 const limit=baseY-u*72;                               // the body ends above the signature images
 y+=u*36;const byy=y;
 certEl(ctx,'body',cx,byy,()=>{ctx.fillStyle=dark?'rgba(246,241,228,.92)':'#30362F';ctx.textAlign='center';
  const bodyTxt=certFill(D.body,P);let bs=u*22,bl=[];
  for(;bs>=u*14;bs-=u*1){ctx.font=`500 ${bs}px "Cormorant Garamond"`;bl=certLines(ctx,bodyTxt,colW*.86);if(bl.length<=4&&byy+(bl.length-1)*bs*1.3<=limit)break}
  bl=bl.slice(0,4);certText(ctx,bl,cx,byy,bs*1.3);const mw=Math.max(0,...bl.map(l=>ctx.measureText(l).width));return bl.length?[cx-mw/2,byy-bs*.85,cx+mw/2,byy+(bl.length-1)*bs*1.3+bs*.3]:null});
 /* ---- signatures, seal, footer ---- */
 const signs=(D.signs||[]).filter(s=>s&&(s.name||s.title||s.img)).slice(0,3);
 const sealR=u*44,hasSeal=tpl!=='modern';
 let slots=[];
 if(signs.length===1)slots=hasSeal?[cx+colW*.3]:[cx+colW*.28];
 else if(signs.length===2)slots=[cx-colW*.34,cx+colW*.34];
 else if(signs.length===3)slots=hasSeal?[cx-colW*.42,cx-colW*.2,cx+colW*.42]:[cx-colW*.36,cx,cx+colW*.36];
 const sw=u*170;
 if(signs.length)certEl(ctx,'signs',cx,baseY,()=>{let b=null;
  signs.forEach((s,i)=>{const x=slots[i];if(x==null)return;
   const im=imgs['sign'+(D.signs||[]).indexOf(s)];if(im)certImg(ctx,im,x,baseY-u*28,sw*.9,u*50,dark?'invert':'multiply');
   ctx.strokeStyle=dark?'rgba(246,241,228,.6)':'#8B8F87';ctx.lineWidth=u*1;ctx.beginPath();ctx.moveTo(x-sw/2,baseY);ctx.lineTo(x+sw/2,baseY);ctx.stroke();
   ctx.fillStyle=dark?'#FFFFFF':ink;ctx.textAlign='center';const nf=certFit(ctx,z=>`600 ${z}px Montserrat`,s.name||'',u*14,u*10,sw*1.15,1);ctx.font=`600 ${nf.s}px Montserrat`;ctx.fillText(nf.lines[0]||'',x,baseY+u*22);
   ctx.fillStyle=soft;const tf=certFit(ctx,z=>`500 ${z}px Montserrat`,s.title||'',u*12,u*7.5,sw*1.4,1);ctx.font=`500 ${tf.s}px Montserrat`;ctx.fillText(s.title||'',x,baseY+u*40,sw*1.4);
   b=certU(b,[x-sw*.7,baseY-u*55,x+sw*.7,baseY+u*44])});return b});
 const yr=String(P.year||new Date().getFullYear());
 if(hasSeal){const sx=signs.length===3?cx+colW*.11:signs.length===2?cx:signs.length===1?cx-colW*.28:cx,sy=baseY-u*6,r=place?sealR*1.08:sealR;
  certEl(ctx,'seal',sx,sy,()=>{place?certMedal(ctx,sx,sy,r,place):certSeal(ctx,sx,sy,r,'CERTIFIED',yr);return [sx-r,sy-r,sx+r,sy+r*1.55]})}
 else{const sx=W*.135,sy=H-u*150,r=place?u*56:u*52;   // modern: medal in the panel
  certEl(ctx,'seal',sx,sy,()=>{place?certMedal(ctx,sx,sy,r,place):certSeal(ctx,sx,sy,r,'AWARD',yr);return [sx-r,sy-r,sx+r,sy+r*1.55]})}
 // certificate number and issue date
 const meta=[D.showId&&P.ref?`Certificate No. ${P.ref}`:'',P.issued?`Issued ${P.issued}`:''].filter(Boolean).join('   ·   ');
 const my=H-u*(tpl==='modern'?50:54),fy=H-u*(tpl==='modern'?66:70);
 if(meta||D.footer)certEl(ctx,'meta',cx,my,()=>{ctx.font=`500 ${u*10.5}px Montserrat`;ctx.fillStyle=dark?'rgba(246,241,228,.65)':'#7A7F77';ctx.letterSpacing=`${u*.8}px`;ctx.textAlign='center';let b=null;
  if(meta){ctx.fillText(meta,cx,my);b=certTB(ctx,meta,cx,my,u*10.5,'center')}
  if(D.footer){const t=certFill(D.footer,P);ctx.fillText(t,cx,fy);b=certU(b,certTB(ctx,t,cx,fy,u*10.5,'center'))}
  ctx.letterSpacing='0px';return b});
 ctx.letterSpacing='0px';ctx.restore();CERT_R=null;
}

/* =====================================================================
   Picture templates: a ready-made background (public/img/cert/<id>.jpg, A4 landscape 2480x1754,
   made from licensed vector designs with their sample text removed) plus a layout that says
   where each piece of text goes. x values are fractions of the width, y of the height,
   sizes are in u (1/1000 of the width). Colours come from the design, not the colour picker.
   ===================================================================== */
const CERT_ART={
 crimson:{name:'Crimson',desc:'Navy and red folded corners',title:'#1A2230',accent:'#E31E3C',
  cx:.5,colW:.58,logo:{y:.085,h:.075},org:{y:.19},titleY:.30,subY:.355,preY:.44,nameY:.535,lineY:.575,bodyY:.625,
  signY:.835,slots:{1:[.28],2:[.28,.685],3:[.17,.33,.685]},seal:{x:.49,y:.795,r:46}},
 mosaic:{name:'Mosaic',desc:'Colourful geometric frame with laurel',title:'#22285A',accent:'#F26B2A',nameColor:'#F26B2A',
  cx:.5,colW:.5,orgBand:{x:.05,y:.083,color:'#FFFFFF'},laurel:{x:.15,y:.305,r:.045},titleY:.245,subY:.295,preY:.40,nameY:.49,lineY:.53,bodyY:.585,
  signY:.75,slots:{1:[.5],2:[.33,.67],3:[.3,.5,.7]},meta:{y:.85}},
 ribbon:{medal:{x:.72,y:.79,r:44},name:'Red ribbon',desc:'Folded red ribbon with a wax seal',title:'#1B1F2A',accent:'#D71A3A',
  cx:.645,colW:.5,logo:{y:.07,h:.075},org:{y:.175},titleY:.27,subY:.32,preY:.405,nameY:.495,lineY:.535,bodyY:.585,
  signY:.835,slots:{1:[.555],2:[.555,.885],3:[.47,.6,.885]},meta:{y:.925,x:.645}},
 fluid:{medal:{x:.22,y:.25,r:44},name:'Fluid',desc:'Soft colour gradients on light grey',title:'#1C1C1C',accent:'#3B7DD8',
  cx:.5,colW:.56,logo:{y:.12,h:.07},org:{y:.215},titleY:.31,subY:.355,preY:.44,nameY:.525,lineY:.565,bodyY:.615,
  signY:.775,slots:{1:[.5],2:[.37,.63],3:[.33,.5,.67]},meta:{y:.87}},
 blocks:{medal:{x:.78,y:.26,r:52},name:'Blocks',desc:'Bauhaus blocks down the left side',title:'#14193A',accent:'#F04E23',align:'left',
  x0:.255,colW:.6,logo:{y:.075,h:.075},org:{y:.18},titleY:.29,subY:.34,preY:.43,nameY:.515,lineY:.555,bodyY:.605,
  signY:.82,slots:{1:[.385],2:[.385,.62],3:[.385,.585,.785]},meta:{y:.905,x:.31}},
 orbit:{medal:{x:.83,y:.45,r:44},name:'Orbit',desc:'Orange and blue 3D circles',title:'#263C8C',accent:'#F39C12',nameColor:'#263C8C',
  cx:.515,colW:.46,logo:{y:.018,h:.055},org:{y:.105,w:.3,lines:2},titleY:.27,subY:.315,preY:.39,nameY:.47,lineY:.505,bodyY:.55,
  signY:.745,slots:{1:[.515],2:[.355,.665],3:[.33,.515,.70]},meta:{y:.835}},
 panel:{medal:{x:.2,y:.655,r:50},name:'Blue panel',desc:'Bold blue side panel with shapes',title:'#FFFFFF',accent:'#3366BF',
  cx:.70,colW:.44,panel:{cx:.24,w:.32,logoY:.12,logoH:.1,orgY:.27,titleY:.445,subY:.49},preY:.36,nameY:.445,lineY:.485,bodyY:.535,
  signY:.855,slots:{1:[.70],2:[.60,.80],3:[.55,.70,.85]},meta:{y:.935,x:.70},ink:'#1F2430'},
};
Object.entries(CERT_ART).forEach(([k,a])=>CERT_TPLS.push([k,a.name,a.desc]));

function drawArtCert(cv,D,P,imgs,A){
 const W=cv.width,H=cv.height,u=W/1000,ctx=cv.getContext('2d'),X=f=>f*W,Y=f=>f*H;
 certBeginLayout(cv,D);
 ctx.save();ctx.clearRect(0,0,W,H);ctx.textBaseline='alphabetic';
 if(imgs.bg)ctx.drawImage(imgs.bg,0,0,W,H);else{ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H)}
 const left=A.align==='left',ax=left?X(A.x0):X(A.cx),al=left?'left':'center',colW=X(A.colW),ink=A.ink||A.title,soft='#555B66';
 const spaced=(txt,x,y,font,ls,col,align=al)=>{ctx.font=font;ctx.fillStyle=col;ctx.textAlign=align;ctx.letterSpacing=`${ls}px`;ctx.fillText(txt,x,y);const b=certTB(ctx,txt,x,y,parseFloat(font.split(' ')[1]),align);ctx.letterSpacing='0px';return b};
 const fitSpaced=(txt,font,size,min,maxW,ls)=>{let s=size;for(;s>min;s-=1){ctx.font=font(s);ctx.letterSpacing=`${ls*s}px`;if(ctx.measureText(txt).width<=maxW)break}ctx.letterSpacing='0px';return s};
 const L=imgs.logo,L2=imgs.logo2,L3=imgs.logo3,place=+P.place||0,logos=[['logo',L],['logo2',L2],['logo3',L3]].filter(x=>x[1]);
 const yr=String(P.year||new Date().getFullYear());
 /* logos & organiser */
 if(A.panel){const p=A.panel,pcx=X(p.cx),pw=X(p.w),bh=Y(p.logoH),n=logos.length,bw=n===3?pw*.29:n===2?pw*.42:pw*.55;
  logos.forEach(([k,im],i)=>{const x=pcx+(i-(n-1)/2)*(bw+pw*.04),ly=Y(p.logoY);certEl(ctx,k,x,ly+bh/2,()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x-bw/2,ly,bw,bh,u*10);ctx.fill();certImg(ctx,im,x,ly+bh/2,bw*.84,bh*.76);return [x-bw/2,ly,x+bw/2,ly+bh]})});
  if(D.org){const oy=Y(p.orgY);certEl(ctx,'org',pcx,oy,()=>{const f=certFit(ctx,s=>`600 ${s}px Montserrat`,D.org.toUpperCase(),u*14,u*9,pw*.9,2);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.letterSpacing=`${u*1.4}px`;certText(ctx,f.lines,pcx,oy+f.s,f.s*1.35);const mw=Math.max(...f.lines.map(l=>ctx.measureText(l).width));ctx.letterSpacing='0px';return [pcx-mw/2,oy,pcx+mw/2,oy+f.s*1.35*f.lines.length]})}
  certEl(ctx,'title',pcx,Y(p.titleY),()=>{const t=(D.title||'').toUpperCase(),ts=fitSpaced(t,s=>`700 ${s}px Montserrat`,u*44,u*20,pw*.9,.08);let b=spaced(t,pcx,Y(p.titleY),`700 ${ts}px Montserrat`,ts*.08,'#fff','center');
   if(D.subtitle){const st=D.subtitle.toUpperCase(),ss=fitSpaced(st,s=>`500 ${s}px Montserrat`,u*15,u*9,pw*.9,.18);b=certU(b,spaced(st,pcx,Y(p.subY),`500 ${ss}px Montserrat`,ss*.18,'#fff','center'))}return b});
 }else{
  const inLaurel=A.laurel&&!place?(L3?'logo3':L?'logo':null):null;
  if(A.orgBand){ // organiser written in the dark top band, with the logos that are not in the laurel
   let x=X(A.orgBand.x);const bh=u*34,cy=Y(A.orgBand.y);
   logos.filter(([k])=>k!==inLaurel).forEach(([k,im])=>{const [w]=certImgSize(im,u*80,bh),x0=x;certEl(ctx,k,x0+w/2,cy,()=>certImgBox(ctx,im,x0+w/2,cy,u*80,bh));x+=w+u*14});
   if(D.org){const ox=x;certEl(ctx,'org',ox,cy,()=>{const f=certFit(ctx,s=>`700 ${s}px Montserrat`,D.org.toUpperCase(),u*14,u*9,X(.5),1);ctx.fillStyle=A.orgBand.color;ctx.textAlign='left';ctx.letterSpacing=`${u*1.2}px`;ctx.fillText(f.lines[0]||'',ox,cy+f.s*.36);const b=certTB(ctx,f.lines[0]||'',ox,cy+f.s*.36,f.s,'left');ctx.letterSpacing='0px';return b})}
  }
  if(A.logo){const lh=Y(A.logo.h),ly=Y(A.logo.y)+lh/2;
   if(left){let x=X(A.x0);logos.forEach(([k,im])=>{const [w]=certImgSize(im,u*140,lh),x0=x;certEl(ctx,k,x0+w/2,ly,()=>certImgBox(ctx,im,x0+w/2,ly,u*140,lh,'multiply'));x+=w+u*36})}   // left edges line up with the text
   else logos.forEach(([k,im],i)=>{const x=ax+(i-(logos.length-1)/2)*u*165;certEl(ctx,k,x,ly,()=>certImgBox(ctx,im,x,ly,u*140,lh,'multiply'))});
   if(D.org&&A.org){const oy=Y(logos.length?A.org.y:A.logo.y+.03);certEl(ctx,'org',ax,oy,()=>{ctx.fillStyle=A.title;ctx.textAlign=al;const n=A.org.lines||1,f=certFit(ctx,s=>`600 ${s}px Montserrat`,D.org.toUpperCase(),u*13,u*8,(A.org.w?X(A.org.w):colW)*.88,n);ctx.letterSpacing=`${u*2}px`;certText(ctx,f.lines,ax,oy,f.s*1.45,al);let b=null;f.lines.forEach((l,i)=>b=certU(b,certTB(ctx,l,ax,oy+i*f.s*1.45,f.s,al)));ctx.letterSpacing='0px';return b})}
  }
  /* title */
  certEl(ctx,'title',ax,Y(A.titleY),()=>{const t=(D.title||'').toUpperCase(),ts=fitSpaced(t,s=>`700 ${s}px Montserrat`,u*54,u*24,colW,.06);let b=spaced(t,ax,Y(A.titleY),`700 ${ts}px Montserrat`,ts*.06,A.title);
   if(D.subtitle){const st=D.subtitle.toUpperCase(),ss=fitSpaced(st,s=>`500 ${s}px Montserrat`,u*16,u*9,colW,.22);b=certU(b,spaced(st,ax,Y(A.subY),`500 ${ss}px Montserrat`,ss*.22,A.accent))}return b});
  /* laurel badge: the place for winners, else the event logo or organiser logo, else the year */
  if(A.laurel){const lx=X(A.laurel.x),ly=Y(A.laurel.y),r=X(A.laurel.r);
   if(place)certEl(ctx,'seal',lx,ly,()=>{ctx.textAlign='center';ctx.fillStyle=A.accent;ctx.font=`700 ${u*30}px Montserrat`;ctx.fillText(CERT_RANK[place].toUpperCase(),lx,ly+u*4);ctx.fillStyle=A.title;ctx.font=`700 ${u*9.5}px Montserrat`;ctx.letterSpacing=`${u*1.6}px`;ctx.fillText('PLACE',lx+u*.8,ly+u*19);ctx.letterSpacing='0px';return [lx-r,ly-r*.8,lx+r,ly+r*.8]});
   else if(inLaurel){const im=inLaurel==='logo3'?L3:L;certEl(ctx,inLaurel,lx,ly,()=>certImgBox(ctx,im,lx,ly,r*1.35,r*1.15,'multiply'))}
   else certEl(ctx,'seal',lx,ly,()=>{ctx.fillStyle=A.title;ctx.textAlign='center';ctx.font=`700 ${u*19}px Montserrat`;ctx.fillText(yr,lx,ly+u*7);return [lx-r,ly-r*.8,lx+r,ly+r*.8]})}
 }
 /* presented to */
 if(D.pre)certEl(ctx,'pre',ax,Y(A.preY),()=>{const pt=certFill(D.pre,P).toUpperCase(),ps=fitSpaced(pt,s=>`500 ${s}px Montserrat`,u*12.5,u*8,colW,.12);return spaced(pt,ax,Y(A.preY),`500 ${ps}px Montserrat`,ps*.12,soft)});
 /* name + underline in the accent colour */
 certEl(ctx,'name',ax,Y(A.nameY),()=>{
  const st=D.nameStyle==='sans'?'sans':D.nameStyle==='serif'?'serif':'script';
  const nf=st==='script'?s=>`400 ${s}px "Great Vibes"`:st==='serif'?s=>`700 ${s}px "Cormorant Garamond"`:s=>`600 ${s}px Montserrat`;
  const f=certFit(ctx,nf,P.name||'',st==='script'?u*68:st==='serif'?u*54:u*44,u*24,colW,1);ctx.font=nf(f.s);ctx.fillStyle=A.nameColor||ink;ctx.textAlign=al;ctx.fillText(f.lines[0]||'',ax,Y(A.nameY));
  const lw=left?colW*.8:colW*.78,x0=left?ax:ax-lw/2,ly=Y(A.lineY);ctx.strokeStyle=A.accent;ctx.lineWidth=u*1.6;ctx.beginPath();ctx.moveTo(x0,ly);ctx.lineTo(x0+lw,ly);ctx.stroke();
  return certU(certTB(ctx,f.lines[0]||'',ax,Y(A.nameY),f.s,al),[x0,Y(A.nameY)-u*36,x0+lw,ly+u*3])});
 /* body: as large as fits above the signatures */
 const by=Y(A.bodyY);
 certEl(ctx,'body',ax,by,()=>{const limit=Y(A.signY)-u*62,body=certFill(D.body,P);let bs=u*16,bl=[];
  for(;bs>=u*10;bs-=u*.5){ctx.font=`400 ${bs}px Montserrat`;bl=certLines(ctx,body,colW*.95);if(bl.length<=4&&by+(bl.length-1)*bs*1.55<=limit)break}
  bl=bl.slice(0,4);ctx.fillStyle='#3A404A';certText(ctx,bl,ax,by,bs*1.55,al);let b=null;bl.forEach((l,i)=>b=certU(b,certTB(ctx,l,ax,by+i*bs*1.55,bs,al)));return b});
 /* seal or place medal */
 const sm=A.seal||(place?A.medal:null);
 if(sm&&!(A.laurel&&place)){const sx=X(sm.x),sy=Y(sm.y),r=u*(sm.r||46)*(place?1.05:1);certEl(ctx,'seal',sx,sy,()=>{place?certMedal(ctx,sx,sy,r,place):certSeal(ctx,sx,sy,r,'CERTIFIED',yr);return [sx-r,sy-r,sx+r,sy+r*1.55]})}
 /* signatures */
 const signs=(D.signs||[]).filter(s=>s&&(s.name||s.title||s.img)).slice(0,3),slots=(A.slots[signs.length]||[]),sw=u*150,base=Y(A.signY);
 if(signs.length)certEl(ctx,'signs',X(slots[0]||.5),base,()=>{let b=null;
  signs.forEach((s,i)=>{const x=X(slots[i]);if(!x)return;
   const im=imgs['sign'+(D.signs||[]).indexOf(s)];if(im)certImg(ctx,im,x,base-u*26,sw*.95,u*48,'multiply');
   ctx.strokeStyle='#9AA0A8';ctx.lineWidth=u*1;ctx.beginPath();ctx.moveTo(x-sw/2,base);ctx.lineTo(x+sw/2,base);ctx.stroke();
   ctx.textAlign='center';ctx.fillStyle=ink;const n=certFit(ctx,z=>`700 ${z}px Montserrat`,(s.name||'').toUpperCase(),u*12,u*8,sw*1.2,1);ctx.font=`700 ${n.s}px Montserrat`;ctx.letterSpacing=`${u*.6}px`;ctx.fillText(n.lines[0]||'',x,base+u*20);ctx.letterSpacing='0px';
   ctx.fillStyle='#6A707A';const tt=certFit(ctx,z=>`500 ${z}px Montserrat`,s.title||'',u*10.5,u*7,sw*1.35,1);ctx.font=`500 ${tt.s}px Montserrat`;ctx.fillText(s.title||'',x,base+u*35,sw*1.4);
   b=certU(b,[x-sw*.7,base-u*52,x+sw*.7,base+u*39])});return b});
 /* certificate number, issue date, footer */
 const meta=[D.showId&&P.ref?`Certificate No. ${P.ref}`:'',P.issued?`Issued ${P.issued}`:''].filter(Boolean).join('   ·   ');
 const m=A.meta||{y:A.signY+.075},mx=m.x!=null?X(m.x):ax,my=Y(m.y);
 if(meta||D.footer)certEl(ctx,'meta',mx,my,()=>{ctx.font=`500 ${u*9.5}px Montserrat`;ctx.fillStyle='#7A808A';ctx.letterSpacing=`${u*.6}px`;ctx.textAlign=al;let b=null;
  if(meta){ctx.fillText(meta,mx,my);b=certTB(ctx,meta,mx,my,u*9.5,al)}
  if(D.footer){const t=certFill(D.footer,P);ctx.fillText(t,mx,my+u*15);b=certU(b,certTB(ctx,t,mx,my+u*15,u*9.5,al))}
  ctx.letterSpacing='0px';return b});
 ctx.letterSpacing='0px';ctx.restore();CERT_R=null;
}
