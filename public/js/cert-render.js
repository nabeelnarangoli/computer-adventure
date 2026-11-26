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
 if(D0&&typeof CERT_ART!=='undefined'&&CERT_ART[D0.tpl])return drawArtCert(cv,Object.assign({},CERT_DEFAULT,D0),P,imgs,CERT_ART[D0.tpl]);
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
 ribbon:{name:'Red ribbon',desc:'Folded red ribbon with a wax seal',title:'#1B1F2A',accent:'#D71A3A',
  cx:.645,colW:.5,logo:{y:.07,h:.075},org:{y:.175},titleY:.27,subY:.32,preY:.405,nameY:.495,lineY:.535,bodyY:.585,
  signY:.835,slots:{1:[.555],2:[.555,.885],3:[.47,.6,.885]},meta:{y:.925,x:.645}},
 fluid:{name:'Fluid',desc:'Soft colour gradients on light grey',title:'#1C1C1C',accent:'#3B7DD8',
  cx:.5,colW:.56,logo:{y:.12,h:.07},org:{y:.215},titleY:.31,subY:.355,preY:.44,nameY:.525,lineY:.565,bodyY:.615,
  signY:.775,slots:{1:[.5],2:[.37,.63],3:[.33,.5,.67]},meta:{y:.87}},
 blocks:{name:'Blocks',desc:'Bauhaus blocks down the left side',title:'#14193A',accent:'#F04E23',align:'left',
  x0:.255,colW:.6,logo:{y:.075,h:.075},org:{y:.18},titleY:.29,subY:.34,preY:.43,nameY:.515,lineY:.555,bodyY:.605,
  signY:.82,slots:{1:[.40],2:[.40,.65],3:[.38,.565,.75]},meta:{y:.905,x:.30}},
 orbit:{name:'Orbit',desc:'Orange and blue 3D circles',title:'#263C8C',accent:'#F39C12',nameColor:'#263C8C',
  cx:.515,colW:.46,logo:{y:.018,h:.055},org:{y:.105,w:.3,lines:2},titleY:.27,subY:.315,preY:.39,nameY:.47,lineY:.505,bodyY:.55,
  signY:.745,slots:{1:[.515],2:[.355,.665],3:[.33,.515,.70]},meta:{y:.835}},
 panel:{name:'Blue panel',desc:'Bold blue side panel with shapes',title:'#FFFFFF',accent:'#3366BF',
  cx:.70,colW:.44,panel:{cx:.24,w:.32,logoY:.12,logoH:.1,orgY:.27,titleY:.445,subY:.49},preY:.36,nameY:.445,lineY:.485,bodyY:.535,
  signY:.855,slots:{1:[.70],2:[.60,.80],3:[.55,.70,.85]},meta:{y:.935,x:.70},ink:'#1F2430'},
};
Object.entries(CERT_ART).forEach(([k,a])=>CERT_TPLS.push([k,a.name,a.desc]));

function drawArtCert(cv,D,P,imgs,A){
 const W=cv.width,H=cv.height,u=W/1000,ctx=cv.getContext('2d'),X=f=>f*W,Y=f=>f*H;
 ctx.save();ctx.clearRect(0,0,W,H);ctx.textBaseline='alphabetic';
 if(imgs.bg)ctx.drawImage(imgs.bg,0,0,W,H);else{ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H)}
 const left=A.align==='left',ax=left?X(A.x0):X(A.cx),al=left?'left':'center',colW=X(A.colW),ink=A.ink||A.title,soft='#555B66';
 const spaced=(txt,x,y,font,ls,col,align=al)=>{ctx.font=font;ctx.fillStyle=col;ctx.textAlign=align;ctx.letterSpacing=`${ls}px`;ctx.fillText(txt,x,y);ctx.letterSpacing='0px'};
 const fitSpaced=(txt,font,size,min,maxW,ls)=>{let s=size;for(;s>min;s-=1){ctx.font=font(s);ctx.letterSpacing=`${ls*s}px`;if(ctx.measureText(txt).width<=maxW)break}ctx.letterSpacing='0px';return s};
 const L=imgs.logo,L2=imgs.logo2;
 /* logos & organiser */
 if(A.panel){const p=A.panel,pcx=X(p.cx),pw=X(p.w);
  const shown=[L,L2].filter(Boolean),bh=Y(p.logoH);
  shown.forEach((im,i)=>{const x=shown.length===2?pcx+(i?1:-1)*pw*.24:pcx,bw=shown.length===2?pw*.42:pw*.55;ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x-bw/2,Y(p.logoY),bw,bh,u*10);ctx.fill();certImg(ctx,im,x,Y(p.logoY)+bh/2,bw*.84,bh*.76)});
  if(D.org){const f=certFit(ctx,s=>`600 ${s}px Montserrat`,D.org.toUpperCase(),u*14,u*9,pw*.9,2);ctx.fillStyle='#fff';ctx.letterSpacing=`${u*1.4}px`;certText(ctx,f.lines,pcx,Y(p.orgY)+f.s,f.s*1.35);ctx.letterSpacing='0px'}
  const t=(D.title||'').toUpperCase(),ts=fitSpaced(t,s=>`700 ${s}px Montserrat`,u*44,u*20,pw*.9,.08);spaced(t,pcx,Y(p.titleY),`700 ${ts}px Montserrat`,ts*.08,'#fff','center');
  if(D.subtitle){const st=D.subtitle.toUpperCase(),ss=fitSpaced(st,s=>`500 ${s}px Montserrat`,u*15,u*9,pw*.9,.18);spaced(st,pcx,Y(p.subY),`500 ${ss}px Montserrat`,ss*.18,'#fff','center')}
 }else{
  if(A.orgBand){ // organiser written in the dark top band
   let x=X(A.orgBand.x);const bh=u*34,cy=Y(A.orgBand.y);
   if(L2){const w=certImg(ctx,L2,x+u*40,cy,u*80,bh);x+=u*88}   // second logo next to the name (the first goes in the laurel)
   if(D.org){const f=certFit(ctx,s=>`700 ${s}px Montserrat`,D.org.toUpperCase(),u*14,u*9,X(.5),1);ctx.fillStyle=A.orgBand.color;ctx.textAlign='left';ctx.letterSpacing=`${u*1.2}px`;ctx.fillText(f.lines[0]||'',x,cy+f.s*.36);ctx.letterSpacing='0px'}
  }
  if(A.logo){const shown=[L,L2].filter(Boolean),lh=Y(A.logo.h);
   shown.forEach((im,i)=>{const x=left?X(A.x0)+u*70+i*u*160:shown.length===2?ax+(i?1:-1)*u*85:ax;certImg(ctx,im,x,Y(A.logo.y)+lh/2,u*140,lh,'multiply')});
   if(D.org&&A.org){ctx.fillStyle=A.title;ctx.textAlign=al;const n=A.org.lines||1,f=certFit(ctx,s=>`600 ${s}px Montserrat`,D.org.toUpperCase(),u*13,u*8,(A.org.w?X(A.org.w):colW)*.88,n);ctx.letterSpacing=`${u*2}px`;certText(ctx,f.lines,ax,Y(shown.length?A.org.y:A.logo.y+.03),f.s*1.45,al);ctx.letterSpacing='0px'}
  }
  /* title */
  const t=(D.title||'').toUpperCase(),ts=fitSpaced(t,s=>`700 ${s}px Montserrat`,u*54,u*24,colW,.06);spaced(t,ax,Y(A.titleY),`700 ${ts}px Montserrat`,ts*.06,A.title);
  if(D.subtitle){const st=D.subtitle.toUpperCase(),ss=fitSpaced(st,s=>`500 ${s}px Montserrat`,u*16,u*9,colW,.22);spaced(st,ax,Y(A.subY),`500 ${ss}px Montserrat`,ss*.22,A.accent)}
 }
 /* laurel badge: first logo inside, or the year */
 if(A.laurel){const lx=X(A.laurel.x),ly=Y(A.laurel.y),r=X(A.laurel.r);
  if(L)certImg(ctx,L,lx,ly,r*1.35,r*1.15,'multiply');
  else{ctx.fillStyle=A.title;ctx.textAlign='center';ctx.font=`700 ${u*19}px Montserrat`;ctx.fillText(String(P.year||''),lx,ly+u*7)}}
 /* presented to */
 const ct=A.cx!=null&&!left?ax:ax;
 if(D.pre){const pt=certFill(D.pre,P).toUpperCase(),ps=fitSpaced(pt,s=>`500 ${s}px Montserrat`,u*12.5,u*8,colW,.12);spaced(pt,ct,Y(A.preY),`500 ${ps}px Montserrat`,ps*.12,soft)}
 /* name */
 const st=D.nameStyle==='sans'?'sans':D.nameStyle==='serif'?'serif':'script';
 const nf=st==='script'?s=>`400 ${s}px "Great Vibes"`:st==='serif'?s=>`700 ${s}px "Cormorant Garamond"`:s=>`600 ${s}px Montserrat`;
 const f=certFit(ctx,nf,P.name||'',st==='script'?u*68:st==='serif'?u*54:u*44,u*24,colW,1);ctx.font=nf(f.s);ctx.fillStyle=A.nameColor||ink;ctx.textAlign=al;ctx.fillText(f.lines[0]||'',ct,Y(A.nameY));
 // underline in the accent colour
 const lw=left?colW*.8:colW*.78;ctx.strokeStyle=A.accent;ctx.lineWidth=u*1.6;ctx.beginPath();if(left){ctx.moveTo(ax,Y(A.lineY));ctx.lineTo(ax+lw,Y(A.lineY))}else{ctx.moveTo(ax-lw/2,Y(A.lineY));ctx.lineTo(ax+lw/2,Y(A.lineY))}ctx.stroke();
 /* body: as large as fits above the signatures */
 const by=Y(A.bodyY),limit=Y(A.signY)-u*62,body=certFill(D.body,P);let bs=u*16,bl=[];
 for(;bs>=u*10;bs-=u*.5){ctx.font=`400 ${bs}px Montserrat`;bl=certLines(ctx,body,colW*.95);if(bl.length<=4&&by+(bl.length-1)*bs*1.55<=limit)break}
 ctx.fillStyle='#3A404A';certText(ctx,bl.slice(0,4),ct,by,bs*1.55,al);
 /* seal */
 if(A.seal)certSeal(ctx,X(A.seal.x),Y(A.seal.y),u*A.seal.r,'CERTIFIED',String(P.year||new Date().getFullYear()));
 /* signatures */
 const signs=(D.signs||[]).filter(s=>s&&(s.name||s.title||s.img)).slice(0,3),slots=(A.slots[signs.length]||[]),sw=u*150,base=Y(A.signY);
 signs.forEach((s,i)=>{const x=X(slots[i]);if(!x)return;
  const im=imgs['sign'+(D.signs||[]).indexOf(s)];if(im)certImg(ctx,im,x,base-u*26,sw*.95,u*48,'multiply');
  ctx.strokeStyle='#9AA0A8';ctx.lineWidth=u*1;ctx.beginPath();ctx.moveTo(x-sw/2,base);ctx.lineTo(x+sw/2,base);ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle=ink;const n=certFit(ctx,z=>`700 ${z}px Montserrat`,(s.name||'').toUpperCase(),u*12,u*8,sw*1.2,1);ctx.letterSpacing=`${u*.6}px`;ctx.fillText(n.lines[0]||'',x,base+u*20);ctx.letterSpacing='0px';
  ctx.fillStyle='#6A707A';const tt=certFit(ctx,z=>`500 ${z}px Montserrat`,s.title||'',u*10.5,u*7,sw*1.35,1);ctx.font=`500 ${tt.s}px Montserrat`;ctx.fillText(s.title||'',x,base+u*35,sw*1.4)});
 /* certificate number, issue date, footer */
 ctx.font=`500 ${u*9.5}px Montserrat`;ctx.fillStyle='#7A808A';ctx.letterSpacing=`${u*.6}px`;
 const meta=[D.showId&&P.ref?`Certificate No. ${P.ref}`:'',P.issued?`Issued ${P.issued}`:''].filter(Boolean).join('   ·   ');
 const m=A.meta||{y:A.signY+.075},mx=m.x!=null?X(m.x):ax;
 if(meta){ctx.textAlign=al;ctx.fillText(meta,mx,Y(m.y))}
 if(D.footer){ctx.textAlign=al;ctx.fillText(certFill(D.footer,P),mx,Y(m.y)+u*15)}
 ctx.letterSpacing='0px';ctx.restore();
}
