/* =====================================================================
   Admin: SEO & Google ranking (the same SEO assistant as aqlyondm.com)
   - Overview: average score, problems to fix, whole-site checks, Google snapshot
   - Pages: every public page checked live (home, academy, each published event)
   - Keywords: where each focus keyword (education consultation, career help, …) appears, and how it does on Google
   - Search Console: clicks, impressions, positions, top searches, quick wins
   - AI assistant: keyword ideas, content ideas, titles & descriptions, 30-day plan
   - Action plan: off-site checklist (saved on the server)
   - Settings: focus keywords, Search Console, Google verification file, AI key
   Server: netlify/lib/seo.mjs (/api/admin/seo/*). Rules: public/js/seo-checks.js
   ===================================================================== */
const SEO={settings:null,report:null,gsc:null,days:28,tab:'overview'};
const SEO_TABS=[['overview','Overview'],['pages','Pages'],['keywords','Keywords'],['gsc','Search Console'],['ai','AI assistant'],['plan','Action plan'],['settings','Settings']];
const seoFmt=n=>Number(n||0).toLocaleString('en-GB'),seoPct=n=>(n*100).toFixed(1)+'%',seoPos=n=>n?n.toFixed(1):'–';
const seoGrade=s=>s>=80?'good':s>=55?'ok':'bad',SEO_GRADE={good:'Good',ok:'Could be better',bad:'Needs work'};
const seoCopy=(text,show)=>`<div class="seocopy"><span>${esc(show||text)}</span><button type="button" data-copy="${esc(text)}">Copy</button></div>`;
const seoIssue=c=>`<div class="seoissue"><span class="seodot ${c.status}"></span><div><b>${esc(c.text)}</b>${c.fix?`<p>${esc(c.fix)}</p>`:''}</div></div>`;

async function seoView(sub){
 const main=$('.adm');SEO.tab=sub||SEO.tab||'overview';
 main.innerHTML=`<div class="admhead"><h1>SEO &amp; Google ranking</h1></div><nav class="seotabs" aria-label="SEO sections">${SEO_TABS.map(([k,t])=>`<button type="button" data-seo="${k}" aria-pressed="${k===SEO.tab}">${t}</button>`).join('')}</nav><div class="seomain"><p class="lead">Checking your pages…</p></div>`;
 $$('[data-seo]',main).forEach(b=>b.onclick=()=>seoGo(b.dataset.seo));
 try{
  SEO.settings=await AAPI.call('/admin/seo/settings');
  if(!SEO.report)SEO.report=await seoCrawl();
 }catch(e){$('.seomain').innerHTML=`<p class="formerr">${esc(e.message)}</p>`;return}
 seoGo(SEO.tab);
}
function seoGo(tab){
 SEO.tab=tab;history.replaceState(null,'','#seo/'+tab);
 $$('[data-seo]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.seo===tab));
 ({overview:seoOverview,pages:seoPages,keywords:seoKeywords,gsc:seoGsc,ai:seoAi,plan:seoPlan,settings:seoSettings})[tab]();
}
document.addEventListener('click',e=>{const c=e.target.closest('.seomain [data-copy]');if(!c)return;navigator.clipboard?navigator.clipboard.writeText(c.dataset.copy).then(()=>toast('Copied'),()=>toast('Copy failed. Select the text instead.',true)):toast('Select the text to copy it.',true)});

/* ---------------- live site check ---------------- */
// the public pages: home, the academy and every published event page
async function seoPageList(){
 const list=[{url:'/',type:'Home page'},{url:'/academy',type:'Academy'}];
 try{const d=await (await fetch('/api/events',{cache:'no-store'})).json();[...(d.upcoming||[]),...(d.past||[])].forEach(e=>list.push({url:'/events/'+e.slug,type:'Event'+(e.state==='ended'?' (past)':''),title:e.title}))}catch(e){}
 return list;
}
const seoText=el=>(el&&el.textContent||'').replace(/\s+/g,' ').trim();
async function seoFetchDoc(url){const r=await fetch(url,{cache:'no-store'});const html=await r.text();return {ok:r.ok,status:r.status,doc:new DOMParser().parseFromString(html,'text/html')}}
async function seoCrawl(){
 const KW=(SEO.settings&&SEO.settings.keywords)||[];
 const list=await seoPageList(),pages=[],linkCache={};
 const alive=async h=>{if(!(h in linkCache))linkCache[h]=fetch(h,{method:'GET',cache:'no-store'}).then(r=>r.ok).catch(()=>false);return linkCache[h]};
 for(const P of list){
  let f;try{f=await seoFetchDoc(P.url)}catch(e){pages.push({...P,score:0,grade:'bad',checks:[{id:'down',status:'bad',text:'The page could not be opened.',fix:'Check the address.'}],passed:0,words:0});continue}
  const d=f.doc,q=s=>d.querySelector(s),meta=n=>((q(`meta[name="${n}"]`)||q(`meta[property="${n}"]`))||{getAttribute:()=>''}).getAttribute('content')||'';
  const scope=(q('main')||d.body).cloneNode(true);$$('script,style,template,form,[aria-hidden=true]',scope).forEach(x=>x.remove());
  const doc={h1s:[...scope.querySelectorAll('h1')].map(seoText),
   headings:[...scope.querySelectorAll('h1,h2,h3,h4')].map(el=>({level:+el.tagName[1],text:seoText(el)})),
   paragraphs:[...scope.querySelectorAll('p,li,dd')].map(seoText).filter(Boolean),
   links:[...scope.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),text:seoText(a)})),
   images:[...scope.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt')||''})),
   text:seoText(scope)};
  const title=seoText(q('title')),description=meta('description'),keyword=meta('seo:focus');
  const res=SEOChecks.analyze({keyword,seoTitle:title,metaDescription:description,slug:P.url.split('/').filter(Boolean).pop()||'',doc,kind:'page'});
  const tech=[];
  if(!f.ok)tech.push({id:'down',group:'Technical',status:'bad',text:`The page answers with an error (${f.status}).`,fix:'Fix or unpublish this page.'});
  if(/noindex/i.test(meta('robots')))tech.push({id:'noindex',group:'Technical',status:'bad',text:'The page tells Google not to list it (noindex).',fix:'Remove the noindex tag if this page should appear on Google.'});
  if(!q('link[rel="canonical"]'))tech.push({id:'canonical',group:'Technical',status:'bad',text:'No canonical link.',fix:'Every page should say which address is the main one.'});
  if(!meta('og:image'))tech.push({id:'og',group:'Technical',status:'ok',text:'No share image (og:image).',fix:'Add an image so links look good on WhatsApp and social media.'});
  if(!q('script[type="application/ld+json"]'))tech.push({id:'schema',group:'Technical',status:'ok',text:'No structured data.',fix:'Structured data helps Google show richer results (business details, events, FAQs).'});
  const internal=[...new Set(doc.links.map(l=>l.href).filter(h=>/^\/(?!\/)/.test(h)&&!/^\/(api|admin)/.test(h)).map(h=>h.split('#')[0]).filter(Boolean))].slice(0,25);
  const broken=[];for(const h of internal)if(!(await alive(h)))broken.push(h);
  if(broken.length)tech.push({id:'broken',group:'Technical',status:'bad',text:`${broken.length} link${broken.length>1?'s':''} to pages that don't exist: ${broken.slice(0,3).join(', ')}`,fix:'Fix or remove these links.'});
  res.checks.push(...tech);
  const pts={good:2,ok:1,bad:0},score=Math.round(res.checks.reduce((t,c)=>t+pts[c.status],0)/(res.checks.length*2)*100);
  pages.push({...P,title,description,keyword,words:res.words,score,grade:seoGrade(score),checks:res.checks.filter(c=>c.status!=='good'),passed:res.checks.filter(c=>c.status==='good').length,
   cover:SEOChecks.coverage(KW.length?KW:['education consultation','career help','education support','career support'],{title,description,doc}),schema:[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{try{const j=JSON.parse(s.textContent);return (j['@graph']||[j]).flatMap(x=>[].concat(x['@type']||[]))}catch(e){return ['?']}})});
 }
 // whole-site checks
 const site=[];
 const dup=(key,label)=>{const m=new Map();pages.forEach(p=>{if(p[key])m.set(p[key],[...(m.get(p[key])||[]),p.url])});for(const [v,urls] of m)if(urls.length>1)site.push({status:'bad',text:`${urls.length} pages share the same ${label}: “${v.slice(0,70)}”`,fix:`Give each page its own ${label}.`})};
 dup('title','title');dup('description','meta description');
 try{const r=await fetch('/sitemap.xml',{cache:'no-store'}),t=r.ok?await r.text():'';const n=(t.match(/<loc>/g)||[]).length;
  site.push(r.ok?{status:'good',text:`sitemap.xml lists ${n} page${n===1?'':'s'}, including every published event.`,fix:''}:{status:'bad',text:'sitemap.xml is missing.',fix:'Google uses the sitemap to find every page.'})}catch(e){}
 try{const t=await (await fetch('/robots.txt',{cache:'no-store'})).text();
  site.push(/Disallow: \/\s*$/m.test(t)?{status:'ok',text:'robots.txt asks search engines to stay away from this address.',fix:'That is right for the staging/preview address. On aqlyonacademy.com the live robots.txt allows Google and points to the sitemap.'}:{status:/Sitemap:/.test(t)?'good':'ok',text:/Sitemap:/.test(t)?'robots.txt allows Google and points to the sitemap.':'robots.txt has no sitemap line.',fix:''})}catch(e){}
 const home=pages.find(p=>p.url==='/');
 if(home){const types=[...new Set(home.schema)].join(', ');site.push({status:/FAQPage/.test(types)&&/(Organization|LocalBusiness)/.test(types)?'good':'ok',text:`Home page structured data: ${types||'none'}.`,fix:/FAQPage/.test(types)?'':'Business details and an FAQ in structured data can give richer Google results.'})}
 const evs=pages.filter(p=>p.type.startsWith('Event')).length;
 site.push({status:evs?'good':'ok',text:`${evs} event page${evs===1?'':'s'} published`,fix:evs?'':'Each published event gets its own page on Google. Career talks and workshops are a good way to be found.'});
 const all=[...pages.flatMap(p=>p.checks),...site];
 return {generated:new Date().toISOString(),pages:pages.sort((a,b)=>a.score-b.score),site_checks:site,
  summary:{pages:pages.length,avg:pages.length?Math.round(pages.reduce((t,p)=>t+p.score,0)/pages.length):0,bad:all.filter(c=>c.status==='bad').length,ok:all.filter(c=>c.status==='ok').length}};
}

/* ---------------- overview ---------------- */
function seoRing(score,size=96){const r=size/2-8,c=2*Math.PI*r,col={good:'#1E9E62',ok:'#C9820F',bad:'#D93A3F'}[seoGrade(score)];
 return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Score ${score} out of 100"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-score/100)}" transform="rotate(-90 ${size/2} ${size/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-weight="700" font-size="${size*.3}">${score}</text></svg>`}
const SEO_LABELS={kw:'No focus keyword set','title-len':'Google title too long or too short','desc-len':'Meta description missing or the wrong length','kw-desc':'Keyword missing from the meta description','kw-title':'Keyword missing from (or late in) the title','links-int':'No links to other pages on the site',length:'Not enough text','kw-intro':'Keyword missing from the opening paragraph','kw-sub':'Keyword not in any subheading','kw-density':'Keyword used too little or too much',broken:'Broken links',subheadings:'Too few subheadings',canonical:'Missing canonical link',og:'No share image',h1:'Wrong number of main headings (H1)',sentences:'Long sentences',paragraphs:'Long paragraphs','kw-url':'Keyword not in the web address',schema:'No structured data',noindex:'Hidden from Google (noindex)',down:'Page not opening'};
function seoTopIssues(){const by={};SEO.report.pages.forEach(p=>p.checks.forEach(c=>{const k=c.id+'|'+c.status;(by[k]=by[k]||{id:c.id,status:c.status,fix:c.fix,sample:c.text,pages:[]}).pages.push(p.url)}));
 return Object.values(by).map(x=>({...x,label:SEO_LABELS[x.id]||x.sample})).sort((a,b)=>(a.status==='bad'?0:1)-(b.status==='bad'?0:1)||b.pages.length-a.pages.length)}
function seoOverview(){
 const R=SEO.report,m=$('.seomain'),issues=seoTopIssues();
 m.innerHTML=`<div class="seohead"><p>Checked ${R.summary.pages} pages just now (${esc(new Date(R.generated).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))}). <button type="button" class="linkbtn seorecheck">Check again</button></p></div>
 <div class="seogrid g4"><div class="seocard seoring">${seoRing(R.summary.avg)}<div><b class="seobig">${SEO_GRADE[seoGrade(R.summary.avg)]}</b><p class="small">Average SEO score across your pages</p></div></div>
 <div class="seocard seostat"><b>${R.summary.bad}</b><span>problems to fix</span></div><div class="seocard seostat"><b>${R.summary.ok}</b><span>improvements suggested</span></div><div class="seocard seostat"><b>${(SEO.settings.keywords||[]).length}</b><span>focus keywords</span></div></div>
 <div class="seosec" id="gscSnap"></div>
 <div class="seosec"><h2>Fix these first</h2><div class="seocard">${issues.length?issues.slice(0,10).map(x=>`<div class="seoissue"><span class="seodot ${x.status}"></span><div><b>${esc(x.label)} <small>· ${x.pages.length} page${x.pages.length>1?'s':''}</small></b><p>${esc(x.fix)}</p></div></div>`).join(''):'<p class="seoempty">Nothing to fix. Nice work.</p>'}</div><p class="small">Open <button type="button" class="linkbtn" data-go="pages">Pages</button> to see the problems on each page.</p></div>
 <div class="seosec"><h2>Whole-site checks</h2><div class="seocard">${R.site_checks.map(seoIssue).join('')}</div></div>`;
 $('.seorecheck',m).onclick=seoRecheck;$$('[data-go]',m).forEach(b=>b.onclick=()=>seoGo(b.dataset.go));
 const snap=$('#gscSnap');
 if(SEO.settings.gscConnected){snap.innerHTML='<h2>Google search, last 28 days</h2><div class="seocard">Loading Search Console…</div>';seoLoadGsc(28).then(d=>snap.innerHTML='<h2>Google search, last 28 days</h2>'+seoGscStats(d)).catch(e=>snap.innerHTML=`<h2>Google search</h2><div class="seocard"><p class="formerr">${esc(e.message)}</p></div>`)}
 else snap.innerHTML='<div class="seocard"><b>See your real Google clicks and rankings here.</b><p class="small">Connect Google Search Console in Settings (about 10 minutes, once).</p><button class="btn ghost sm" type="button" data-go="settings">Connect Search Console</button></div>',$('[data-go]',snap).onclick=()=>seoGo('settings');
}
async function seoRecheck(){$('.seomain').innerHTML='<p class="lead">Checking your pages…</p>';SEO.report=await seoCrawl();seoGo(SEO.tab)}

/* ---------------- pages ---------------- */
function seoPages(){
 const R=SEO.report,m=$('.seomain');
 m.innerHTML=`<div class="seohead"><p>Lowest scores first. Open a page to see what to fix. <button type="button" class="linkbtn seorecheck">Check again</button></p></div><div class="seocard">${R.pages.map((p,i)=>`<div class="seopage"><button type="button" aria-expanded="false"><span class="seoscore ${p.grade}">${p.score}</span><span><span class="u">${esc(p.title||p.url)}</span><br><span class="small">${esc(p.url)} · ${esc(p.type)} · ${p.words} words${p.keyword?` · keyword <span class="seokw">${esc(p.keyword)}</span>`:''}</span></span><span class="seopill ${p.grade}">${p.checks.filter(c=>c.status==='bad').length} to fix</span></button>
  <div class="seobody" hidden>${p.checks.length?p.checks.sort((a,b)=>(a.status==='bad'?0:1)-(b.status==='bad'?0:1)).map(seoIssue).join(''):'<p>All checks passed.</p>'}<p class="small">${p.passed} checks passed.${p.type.startsWith('Event')?' An event page uses the event name as its Google title and the summary as its description: edit them in Events.':''}</p>
  <div class="seorow"><a class="btn ghost sm" href="${esc(p.url)}" target="_blank" rel="noopener">Open page ↗</a><button class="btn sm" type="button" data-improve="${i}">✨ Get AI suggestions</button></div><div class="seoaiout"></div></div></div>`).join('')}</div>`;
 $('.seorecheck',m).onclick=seoRecheck;
 $$('.seopage>button',m).forEach(b=>b.onclick=()=>{const body=b.nextElementSibling;body.hidden=!body.hidden;b.setAttribute('aria-expanded',!body.hidden)});
 $$('[data-improve]',m).forEach(b=>b.onclick=()=>seoImprove(b,R.pages[+b.dataset.improve]));
}
async function seoPageText(url){const {doc}=await seoFetchDoc(url);const s=doc.querySelector('main')||doc.body;$$('script,style,form,[aria-hidden=true]',s).forEach(x=>x.remove());return seoText(s)}
async function seoImprove(b,p){
 const out=b.parentNode.nextElementSibling;
 if(!SEO.settings.aiConnected){out.innerHTML='<div class="seocard"><p>Connect the AI assistant in <button type="button" class="linkbtn" data-go="settings">Settings</button> first.</p></div>';$('[data-go]',out).onclick=()=>seoGo('settings');return}
 b.disabled=true;b.textContent='Thinking…';
 try{const text=await seoPageText(p.url);const d=await AAPI.call('/admin/seo/ai',{method:'POST',body:{task:'improve',input:{url:p.url,title:p.title,description:p.description,issues:p.checks.map(c=>c.text),text}}});out.innerHTML=seoRenderAi(d)}
 catch(e){out.innerHTML=`<p class="formerr">${esc(e.message)}</p>`}
 b.disabled=false;b.textContent='✨ Get AI suggestions';
}

/* ---------------- keywords ---------------- */
function seoKeywords(){
 const R=SEO.report,m=$('.seomain'),KW=SEO.settings.keywords;
 const yes=v=>v?'<span class="seoyes" title="Yes">✓</span>':'<span class="seono" title="No">✕</span>';
 m.innerHTML=`<div class="seohead"><p>Your focus keywords: ${KW.map(k=>`<span class="seokw">${esc(k)}</span>`).join(' ')} <button type="button" class="linkbtn" data-go="settings">Change</button></p></div>
 <div id="kwGsc"></div>
 ${[...R.pages].sort((a,b)=>(a.url==='/'?0:a.url==='/academy'?1:2)-(b.url==='/'?0:b.url==='/academy'?1:2)).map(p=>`<div class="seosec"><h2>${esc(p.type)}: ${esc(p.url)}</h2><div class="seocard seotw"><table class="seot"><thead><tr><th>Keyword</th><th>Google title</th><th>Description</th><th>Main heading</th><th class="n">Subheadings</th><th class="n">Times in the text</th></tr></thead><tbody>${p.cover.map(c=>`<tr><td><b>${esc(c.keyword)}</b></td><td>${yes(c.title)}</td><td>${yes(c.description)}</td><td>${yes(c.h1)}</td><td class="n">${c.subheadings}</td><td class="n">${c.mentions}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}
 <p class="small">The home page should carry every focus keyword; other pages can focus on one or two. Use each keyword where it reads naturally: about 1–2% of the words is plenty.</p>`;
 $$('[data-go]',m).forEach(b=>b.onclick=()=>seoGo(b.dataset.go));
 const g=$('#kwGsc');
 if(SEO.settings.gscConnected){g.innerHTML='<div class="seocard">Loading Google data for your keywords…</div>';seoLoadGsc(28).then(d=>{g.innerHTML=`<div class="seosec"><h2>On Google, last 28 days</h2><div class="seocard seotw"><table class="seot"><thead><tr><th>Keyword</th><th class="n">Searches that include it</th><th class="n">Clicks</th><th class="n">Impressions</th><th class="n">Average position</th><th>Top searches</th></tr></thead><tbody>${(d.keywords||[]).map(k=>`<tr><td><b>${esc(k.keyword)}</b></td><td class="n">${k.searches}</td><td class="n">${seoFmt(k.clicks)}</td><td class="n">${seoFmt(k.impressions)}</td><td class="n">${seoPos(k.position)}</td><td>${k.top.map(t=>esc(t.key)).join(', ')||'<span class="muted">Not showing yet</span>'}</td></tr>`).join('')}</tbody></table></div></div>`}).catch(e=>g.innerHTML=`<div class="seocard"><p class="formerr">${esc(e.message)}</p></div>`)}
 else g.innerHTML='<div class="seocard"><b>Connect Search Console to see how each keyword ranks on Google.</b><p class="small">Clicks, impressions and position for every search that contains your keywords.</p><button class="btn ghost sm" type="button" data-go="settings">Connect Search Console</button></div>',$('[data-go]',g).onclick=()=>seoGo('settings');
}

/* ---------------- Search Console ---------------- */
function seoLoadGsc(days){return AAPI.call('/admin/seo/gsc?days='+days).then(d=>{if(d.connected===false)throw new Error('Search Console is not connected.');SEO.gsc=d;return d})}
function seoDelta(cur,prev,invert){if(!prev)return'';const ch=(cur-prev)/prev,good=invert?ch<0:ch>0;if(!isFinite(ch)||Math.abs(ch)<.005)return'';return `<span class="seodelta ${good?'up':'down'}">${ch>0?'▲':'▼'} ${Math.abs(ch*100).toFixed(0)}%</span>`}
function seoGscStats(d){const c=d.current,p=d.previous;
 return `<div class="seogrid g4"><div class="seocard seostat"><b>${seoFmt(c.clicks)}${seoDelta(c.clicks,p.clicks)}</b><span>clicks from Google</span></div><div class="seocard seostat"><b>${seoFmt(c.impressions)}${seoDelta(c.impressions,p.impressions)}</b><span>times you appeared in results</span></div><div class="seocard seostat"><b>${seoPct(c.ctr)}${seoDelta(c.ctr,p.ctr)}</b><span>click-through rate</span></div><div class="seocard seostat"><b>${seoPos(c.position)}${seoDelta(c.position,p.position,true)}</b><span>average position (lower is better)</span></div></div>
 <p class="small">${esc(d.range.startDate)} to ${esc(d.range.endDate)}, compared with the period before. Google's data is about 2 days behind.</p>`}
function seoChart(daily){
 if(!daily.length)return '<p class="seoempty">No data yet for this period.</p>';
 const W=900,H=220,P=30,maxC=Math.max(1,...daily.map(x=>x.clicks)),maxI=Math.max(1,...daily.map(x=>x.impressions)),X=i=>P+i*(W-2*P)/Math.max(1,daily.length-1);
 const line=(k,max)=>daily.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+(H-P-x[k]/max*(H-2*P)).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily clicks and impressions"><line x1="${P}" y1="${H-P}" x2="${W-P}" y2="${H-P}" stroke="var(--line)"/><path d="${line('impressions',maxI)}" fill="none" stroke="#6F9CEB" stroke-width="2.5"/><path d="${line('clicks',maxC)}" fill="none" stroke="#1E9E62" stroke-width="3"/><text x="${P}" y="${H-8}" font-size="12" fill="currentColor">${esc(daily[0].date)}</text><text x="${W-P}" y="${H-8}" font-size="12" fill="currentColor" text-anchor="end">${esc(daily[daily.length-1].date)}</text></svg>
 <div class="seolegend"><span><i style="background:#1E9E62"></i>Clicks (max ${seoFmt(maxC)})</span><span><i style="background:#6F9CEB"></i>Impressions (max ${seoFmt(maxI)})</span></div>`}
function seoTable(rows,label,link){
 if(!rows.length)return '<p class="seoempty">No data yet.</p>';
 return `<div class="seotw"><table class="seot"><thead><tr><th>${label}</th><th class="n">Clicks</th><th class="n">Impressions</th><th class="n">CTR</th><th class="n">Position</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${link?`<a href="${esc(r.key)}" target="_blank" rel="noopener">${esc(r.key.replace(/^https?:\/\/[^/]+/,'')||'/')}</a>`:esc(r.key)}</td><td class="n">${seoFmt(r.clicks)}</td><td class="n">${seoFmt(r.impressions)}</td><td class="n">${seoPct(r.ctr)}</td><td class="n">${seoPos(r.position)}</td></tr>`).join('')}</tbody></table></div>`}
function seoGsc(){
 const m=$('.seomain');
 if(!SEO.settings.gscConnected){m.innerHTML='<div class="seohead"><p>Your real performance on Google: clicks, impressions, positions and the searches that find you.</p></div>'+seoGscSetup();seoBindSettings();return}
 m.innerHTML=`<div class="seohead seohrow"><p>${esc(SEO.settings.gscSite)}</p><label class="seoinl">Period <select id="seodays"><option value="7">Last 7 days</option><option value="28">Last 28 days</option><option value="90">Last 3 months</option></select></label></div><div id="seog"><div class="seocard">Loading…</div></div>`;
 $('#seodays').value=String(SEO.days);
 const draw=()=>{SEO.days=+$('#seodays').value;$('#seog').innerHTML='<div class="seocard">Loading…</div>';
  seoLoadGsc(SEO.days).then(d=>{$('#seog').innerHTML=seoGscStats(d)+`<div class="seosec seocard">${seoChart(d.daily)}</div>
  <div class="seosec"><h2>Quick wins</h2><p class="small">Searches where you already appear on page 1–2 but not at the top. Improving the page that ranks for these is the fastest way to more clicks.</p><div class="seocard">${seoTable(d.quickWins,'Search')}</div></div>
  <div class="seogrid g2 seosec"><div><h2>Top searches</h2><div class="seocard">${seoTable(d.queries.slice(0,25),'Search')}</div></div><div><h2>Top pages</h2><div class="seocard">${seoTable(d.pages.slice(0,25),'Page',true)}</div></div></div>
  <div class="seogrid g2 seosec"><div><h2>Devices</h2><div class="seocard">${seoTable(d.devices,'Device')}</div></div><div><h2>Countries</h2><div class="seocard">${seoTable(d.countries.map(r=>({...r,key:r.key.toUpperCase()})),'Country')}</div></div></div>`}).catch(e=>$('#seog').innerHTML=`<div class="seocard"><p class="formerr">${esc(e.message)}</p></div>`)};
 $('#seodays').onchange=draw;draw();
}

/* ---------------- AI assistant ---------------- */
const SEO_AI=[
 ['keywords','🔑 Keyword ideas','Find the searches parents and students use, built around your focus keywords.','<div class="field"><label>Topic or service</label><input name="topic" placeholder="e.g. stream selection after 10th, study abroad, career counselling"></div><div class="field"><label>Location</label><input name="location" placeholder="e.g. Koyilandy, Kozhikode, Kerala, Dubai"></div>'],
 ['ideas','💡 Content ideas','10 topics (articles, FAQ answers, events, Google Business posts) with outlines.','<div class="field"><label>Focus (optional)</label><input name="topic" placeholder="e.g. parents of Grade 10 students in the UAE"></div><div class="field"><label>Location</label><input name="location" placeholder="e.g. Kerala and the UAE"></div>'],
 ['meta','🏷️ Titles & descriptions','Better Google titles and meta descriptions for any page.','<div class="field"><label>Page</label><select name="url"></select></div><div class="field"><label>Focus keyword (optional)</label><input name="keyword"></div>'],
 ['plan','📅 30-day ranking plan','A week-by-week plan for your team.','<div class="field"><label>Where are you now? (optional)</label><textarea name="situation" rows="3" placeholder="e.g. new website, Google Business Profile not set up yet, few reviews"></textarea></div>'],
];
function seoAi(){
 const m=$('.seomain'),on=SEO.settings.aiConnected;
 m.innerHTML=`<div class="seohead"><p>Ideas and wording to help you rank. Always read and adjust before using.</p></div>${on?'':'<div class="seocard seosec"><b>Connect the AI assistant first.</b><p class="small">Add an Anthropic API key in Settings.</p><button class="btn ghost sm" type="button" data-go="settings">Open Settings</button></div>'}
 <div class="seogrid g2">${SEO_AI.map(([k,t,d,f])=>`<form class="seocard seoform" data-task="${k}"><div><h2>${t}</h2><p class="small">${d}</p></div>${f}<div class="seorow"><button class="btn sm" type="submit" ${on?'':'disabled'}>Generate</button></div><div class="seoaiout"></div></form>`).join('')}</div>`;
 $$('[data-go]',m).forEach(b=>b.onclick=()=>seoGo(b.dataset.go));
 const sel=$('[data-task="meta"] select',m);sel.innerHTML=SEO.report.pages.map(p=>`<option value="${esc(p.url)}">${esc(p.url)} (${p.score})</option>`).join('');
 $$('form[data-task]',m).forEach(f=>f.onsubmit=async e=>{e.preventDefault();const task=f.dataset.task,b=$('button[type=submit]',f),out=$('.seoaiout',f);
  const input={};$$('input,select,textarea',f).forEach(x=>{if(x.name)input[x.name]=x.value});
  b.disabled=true;b.textContent='Thinking… (up to a minute)';out.innerHTML='';
  try{if(task==='meta'){const p=SEO.report.pages.find(x=>x.url===input.url)||{};input.title=p.title;input.description=p.description;input.keyword=input.keyword||p.keyword;input.text=await seoPageText(input.url)}
   out.innerHTML=seoRenderAi(await AAPI.call('/admin/seo/ai',{method:'POST',body:{task,input}}))}
  catch(err){out.innerHTML=`<p class="formerr">${esc(err.message)}</p>`}
  b.disabled=false;b.textContent='Generate'});
}
const seoList=items=>'<ul>'+(items||[]).map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>';
function seoRenderAi(d){
 const x=d.data;let h='<div class="seocard seoaicard">';
 if(!x)return h+`<pre class="seomd">${esc(d.text)}</pre></div>`;
 if(d.task==='keywords'){h+=`<div class="seotw"><table class="seot"><thead><tr><th>Keyword</th><th>Intent</th><th>Use on</th><th>Why</th></tr></thead><tbody>${(x.keywords||[]).map(k=>`<tr><td><b>${esc(k.keyword)}</b> <button type="button" class="linkbtn sm" data-copy="${esc(k.keyword)}">Copy</button></td><td>${esc(k.intent)}</td><td>${esc(k.use)}</td><td>${esc(k.why)}</td></tr>`).join('')}</tbody></table></div>`;if(x.tips&&x.tips.length)h+='<h3>Tips</h3>'+seoList(x.tips)}
 else if(d.task==='ideas')h+=(x.ideas||[]).map((i,n)=>`<h3>${n+1}. ${esc(i.title)}</h3><p class="small">Keyword <span class="seokw">${esc(i.keyword)}</span> · ${esc(i.format||'')} · for ${esc(i.audience)}</p>${seoList(i.outline)}`).join('');
 else if(d.task==='meta'){if(x.keyword)h+=`<p>Suggested keyword: <span class="seokw">${esc(x.keyword)}</span></p>`;h+='<h3>Titles</h3>'+(x.titles||[]).map(t=>seoCopy(t,`${t}  (${t.length} chars)`)).join('')+'<h3>Meta descriptions</h3>'+(x.descriptions||[]).map(t=>seoCopy(t,`${t}  (${t.length} chars)`)).join('')+(x.notes?`<p class="small">${esc(x.notes)}</p>`:'')}
 else if(d.task==='improve')h+=`<p>${esc(x.summary)}</p><h3>What to do</h3>${(x.actions||[]).map(a=>seoIssue({status:a.priority==='high'?'bad':a.priority==='medium'?'ok':'good',text:a.action,fix:a.why})).join('')}${x.title?'<h3>Suggested title</h3>'+seoCopy(x.title):''}${x.description?'<h3>Suggested meta description</h3>'+seoCopy(x.description):''}${x.missing_topics&&x.missing_topics.length?'<h3>Topics to add</h3>'+seoList(x.missing_topics):''}`;
 else if(d.task==='plan')h+=(x.weeks||[]).map(w=>`<h3>Week ${esc(w.week)}: ${esc(w.focus)}</h3>${seoList(w.tasks)}`).join('')+(x.ongoing&&x.ongoing.length?'<h3>Every month</h3>'+seoList(x.ongoing):'');
 return h+`<p class="small">AI requests today: ${d.usage.today} of ${d.usage.limit}. Send the new wording to Claude to update the website.</p></div>`;
}

/* ---------------- action plan ---------------- */
const SEO_PLAN=[
 ['sitemap','Submit your sitemap to Google','In Search Console → Sitemaps, add sitemap.xml. Google then finds every page and every new event automatically.'],
 ['gbp','Claim and complete the Google Business Profile for the Koyilandy centre','business.google.com: category “Educational consultant” (add “Career guidance service”), services, opening hours, photos of the centre, the website link and the WhatsApp number. Post an update or event every week.'],
 ['nap','Use the same name, address and phone everywhere','“Aqlyon Career Discovery Centre”, the exact centre address and +91 95392 44342, as on the website, so Google trusts the listing.'],
 ['reviews','Ask parents for Google reviews','Send the review link on WhatsApp after each counselling session or report. Reply to every review. Reviews are one of the biggest local ranking factors.'],
 ['dirs','List the centre in education directories','India: Justdial, Sulekha, UrbanPro, Shiksha, CollegeDunia. UAE (online sessions): Yellow Pages UAE, Connect.ae. Keep name, address and phone identical everywhere.'],
 ['schools','Get links from schools and partners','Ask partner schools, PTAs, KMCC and community associations to link to the website from their pages and event posts (“Career guidance by Aqlyon Career Discovery Centre”).'],
 ['events','Publish every career talk and workshop as an event','Each event gets its own page on Google and in the sitemap. Write a clear summary that uses a keyword, e.g. “free career help session for Grade 10 parents”.'],
 ['social','Link your social profiles to the website','Instagram, Facebook, YouTube and WhatsApp Business should all link to aqlyonacademy.com.'],
 ['faq','Keep the FAQ up to date','Add the questions parents ask most often. The FAQ on the home page also appears as structured data for Google.'],
 ['bing','Also verify the site in Bing Webmaster Tools','Import from Google Search Console in one click. Bing also powers several AI search tools.'],
 ['monthly','Check Search Console every month','Look at Quick wins and the Keywords tab: improve the pages that already appear on page 1–2.'],
];
function seoPlan(){
 const done=SEO.settings.plan||{},n=SEO_PLAN.filter(c=>done[c[0]]).length;
 $('.seomain').innerHTML=`<div class="seohead seohrow"><p>Most ranking gains come from work outside the website. Tick items off as you go (saved for everyone who uses this admin).</p><span class="seopill ${n===SEO_PLAN.length?'good':n?'ok':'bad'}">${n} of ${SEO_PLAN.length} done</span></div>
 <div class="seocard"><ul class="seocheck">${SEO_PLAN.map(([k,t,d])=>`<li><input type="checkbox" id="sp-${k}" data-k="${k}" ${done[k]?'checked':''}><label for="sp-${k}"><b>${esc(t)}</b><span>${esc(d)}</span></label></li>`).join('')}</ul></div>
 <div class="seosec seocard"><h2>Want a plan made for you?</h2><p class="small">The AI assistant can turn this into a week-by-week plan for your situation.</p><button class="btn ghost sm" type="button" data-go="ai">Open AI assistant → 30-day plan</button></div>`;
 $('[data-go]').onclick=()=>seoGo('ai');
 $$('.seocheck input').forEach(c=>c.onchange=async()=>{const plan={...(SEO.settings.plan||{}),[c.dataset.k]:c.checked};try{SEO.settings=await AAPI.call('/admin/seo/settings',{method:'PATCH',body:{plan}});seoPlan()}catch(e){c.checked=!c.checked;toast(e.message,true)}});
}

/* ---------------- settings ---------------- */
function seoGscSetup(){
 const s=SEO.settings;
 return `<div class="seocard seoform" id="gscForm"><h2>Google Search Console ${s.gscConnected?'<span class="seopill good">Connected</span>':'<span class="seopill bad">Not connected</span>'}</h2>
 <ol class="seosteps"><li>In <a href="https://search.google.com/search-console" target="_blank" rel="noopener">Search Console</a>, add <b>aqlyonacademy.com</b> as a property and verify it. A <b>Domain</b> property is best (verify with the DNS record Google shows, at your domain provider). Or choose a <b>URL prefix</b> property with the <b>HTML file</b> method: paste the file name Google gives you in “Google verification file” below, save, then press Verify in Google.</li>
 <li>In <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a>, create a project (e.g. “Aqlyon Academy SEO”), then go to <b>APIs &amp; Services → Library</b> and enable <b>Google Search Console API</b>.</li>
 <li>Go to <b>IAM &amp; Admin → Service accounts → Create service account</b> (any name). Open it → <b>Keys → Add key → Create new key → JSON</b>. A .json file downloads.</li>
 <li>Back in Search Console → <b>Settings → Users and permissions → Add user</b>: paste the service account email (it ends in <code>iam.gserviceaccount.com</code>) with <b>Restricted</b> permission.</li>
 <li>Paste the whole .json file below, enter the property name, and save.</li></ol>
 ${s.gscEmail?`<p class="small">Connected with ${esc(s.gscEmail)}. Paste a new key only if you want to replace it.</p>`:''}
 <div class="field"><label for="gscKey">Service account key (.json file contents)</label><textarea id="gscKey" rows="4" placeholder='{ "type": "service_account", … }' spellcheck="false"></textarea></div>
 <div class="field"><label for="gscSite">Search Console property</label><input id="gscSite" value="${esc(s.gscSite)}" placeholder="sc-domain:aqlyonacademy.com"><small class="small">Domain property: <code>sc-domain:aqlyonacademy.com</code>. URL-prefix property: <code>https://aqlyonacademy.com/</code> (with the slash).</small></div>
 <p class="formerr" id="gscErr"></p><div class="seorow"><button class="btn sm" type="button" id="gscSave">Save and test</button>${s.gscConnected?'<button class="btn ghost sm" type="button" id="gscOff">Disconnect</button>':''}</div></div>`}
function seoBindSettings(){
 const set=async(body,btn,err,ok)=>{btn.disabled=true;if(err)err.textContent='';try{SEO.settings=await AAPI.call('/admin/seo/settings',{method:'PATCH',body});if(ok)await ok();seoGo(SEO.tab)}catch(e){if(err)err.textContent=e.message;else toast(e.message,true);btn.disabled=false}};
 const gs=$('#gscSave');if(gs)gs.onclick=()=>{const body={gscSite:$('#gscSite').value};if($('#gscKey').value.trim())body.gscCredentials=$('#gscKey').value;set(body,gs,$('#gscErr'),async()=>{await seoLoadGsc(7);toast('Search Console connected')})};
 const go=$('#gscOff');if(go)go.onclick=()=>set({gscCredentials:'',gscSite:''},go,null,()=>toast('Disconnected'));
 const as=$('#aiSave');if(as)as.onclick=()=>{const body={model:$('#aiModel').value};if($('#aiKey').value.trim())body.anthropicKey=$('#aiKey').value.trim();set(body,as,$('#aiErr'),()=>toast('Saved'))};
 const ao=$('#aiOff');if(ao)ao.onclick=()=>set({anthropicKey:''},ao,null,()=>toast('Removed'));
 const ks=$('#kwSave');if(ks)ks.onclick=()=>set({keywords:$('#kwList').value.split('\n')},ks,$('#kwErr'),async()=>{toast('Keywords saved');SEO.report=await seoCrawl()});
 const kr=$('#kwReset');if(kr)kr.onclick=()=>{$('#kwList').value=SEO.settings.defaultKeywords.join('\n')};
 const vs=$('#vfSave');if(vs)vs.onclick=()=>set({verifyFile:$('#vfName').value},vs,$('#vfErr'),()=>toast('Saved. Now press Verify in Search Console.'));
}
function seoSettings(){
 const s=SEO.settings;
 $('.seomain').innerHTML=`<div class="seohead"><p>Keys are stored on the server and never shown again after saving.</p></div><div class="seogrid g2">
 <div class="seocard seoform"><h2>Focus keywords</h2><p class="small">The searches you most want to be found for. The Keywords tab checks each one on every page, and the AI assistant builds around them. One per line.</p>
 <div class="field"><label for="kwList">Keywords</label><textarea id="kwList" rows="6">${esc(s.keywords.join('\n'))}</textarea></div><p class="formerr" id="kwErr"></p><div class="seorow"><button class="btn sm" type="button" id="kwSave">Save keywords</button><button class="btn ghost sm" type="button" id="kwReset">Use the starting list</button></div></div>
 <div class="seocard seoform"><h2>Google verification file</h2><p class="small">Only for a URL-prefix property with the <b>HTML file</b> method. Google asks you to upload a file like <code>google1a2b3c4d5e6f7a8b.html</code>: paste its name here instead and the website serves it for you.</p>
 <div class="field"><label for="vfName">File name</label><input id="vfName" value="${esc(s.verifyFile)}" placeholder="google1a2b3c4d5e6f7a8b.html"></div>${s.verifyFile?`<p class="small">Served at <a href="/${esc(s.verifyFile)}" target="_blank" rel="noopener">/${esc(s.verifyFile)}</a></p>`:''}<p class="formerr" id="vfErr"></p><div class="seorow"><button class="btn sm" type="button" id="vfSave">Save</button></div></div>
 ${seoGscSetup()}
 <div class="seocard seoform"><h2>AI assistant ${s.aiConnected?'<span class="seopill good">Connected</span>':'<span class="seopill bad">Not connected</span>'}</h2>
 <ol class="seosteps"><li>Go to <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a>, sign in and add a payment method under <b>Billing</b> (you pay per use; a keyword list costs a few cents). You can reuse the key from aqlyondm.com.</li><li>Open <b>API keys → Create key</b>, copy it (it starts with <code>sk-ant-</code>) and paste it below.</li><li>Optional: set a monthly spend limit in the console.</li></ol>
 <div class="field"><label for="aiKey">Anthropic API key</label><input id="aiKey" type="password" autocomplete="off" placeholder="${s.aiConnected?'Saved. Paste a new key to replace it.':'sk-ant-…'}"></div>
 <div class="field"><label for="aiModel">Model</label><input id="aiModel" value="${esc(s.model)}"><small class="small">Leave as it is unless you want a different Claude model.</small></div>
 <p class="small">Limited to 150 requests a day to keep costs predictable.</p><p class="formerr" id="aiErr"></p><div class="seorow"><button class="btn sm" type="button" id="aiSave">Save</button>${s.aiConnected?'<button class="btn ghost sm" type="button" id="aiOff">Remove key</button>':''}</div></div></div>`;
 seoBindSettings();
}
