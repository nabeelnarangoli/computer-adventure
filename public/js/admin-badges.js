/* =====================================================================
   Admin → event → "🪪 Download badges (PDF)": every confirmed person's badge in one PDF,
   one badge per page at the badge's printed size (A6, ID card…), ready for a print shop.
   Each badge is drawn by the real badge page (/badge/batch in a hidden frame), so the PDF
   matches exactly what people see on their phones, QR code included.
   ===================================================================== */
async function badgesPdf(e,btn){
 const label=btn.innerHTML,say=t=>{btn.textContent=t};
 btn.disabled=true;say('Preparing badges…');
 let frame=null;
 try{
  const [{badges}]=await Promise.all([AAPI.call(`/admin/events/${e.id}/badges`),ctScript('/js/vendor/jspdf.umd.min.js')]);
  if(!badges.length){toast('No confirmed registrations yet, so there are no active badges to download.',true);return}
  // a hidden, full-size frame so the badge lays out exactly as on screen
  frame=document.createElement('iframe');frame.src='/badge/batch';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
  frame.style.cssText='position:fixed;left:-12000px;top:0;width:720px;height:1100px;border:0;opacity:0;pointer-events:none';
  const waiters=new Map();let ready;const isReady=new Promise(r=>ready=r);
  const onMsg=ev=>{if(ev.origin!==location.origin||ev.source!==frame.contentWindow||!ev.data)return;if(ev.data.ready)return ready();const w=waiters.get(ev.data.i);if(w){waiters.delete(ev.data.i);w(ev.data)}};
  addEventListener('message',onMsg);document.body.appendChild(frame);
  try{
   await Promise.race([isReady,new Promise((_,no)=>setTimeout(()=>no(new Error('The badge page did not load. Check your internet and try again.')),20000))]);
   const {jsPDF}=window.jspdf;let doc=null;
   for(let i=0;i<badges.length;i++){
    say(`Drawing badge ${i+1} of ${badges.length}…`);
    const res=await new Promise((ok,no)=>{waiters.set(i,ok);frame.contentWindow.postMessage({i,badge:badges[i]},location.origin);setTimeout(()=>{if(waiters.has(i)){waiters.delete(i);no(new Error('A badge took too long to draw.'))}},30000)});
    if(res.error)throw new Error(res.error);
    const [w,h]=res.mm,orient=w>h?'landscape':'portrait';
    if(!doc)doc=new jsPDF({orientation:orient,unit:'mm',format:[w,h],compress:true});else doc.addPage([w,h],orient);
    doc.addImage(new Uint8Array(res.buf),'JPEG',0,0,w,h,undefined,'FAST');
   }
   doc.setProperties({title:`${e.title} – badges`,creator:'Aqlyon'});
   say('Saving the PDF…');
   const blob=doc.output('blob'),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${e.slug||'event'}-badges.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),8000);
   toast(`${badges.length} badge${badges.length===1?'':'s'} downloaded as one PDF (${(blob.size/1048576).toFixed(1)} MB)`);
  }finally{removeEventListener('message',onMsg)}
 }catch(err){toast(err.message,true)}
 finally{if(frame)frame.remove();btn.disabled=false;btn.innerHTML=label}
}
