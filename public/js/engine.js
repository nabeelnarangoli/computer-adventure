/* =====================================================================
   Aqlyon Digital Skill Academy — animation engine
   Draws pretend Mac or Windows screens and plays scripted demos on them.
   ===================================================================== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let SPEED=1;const sleep=ms=>new Promise(r=>setTimeout(r,ms*SPEED));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-');

/* ---------- learner context: platform, audience, name ---------- */
let PLAT='mac', AUD='child', UNAME='Alesha';
function setContext({platform,kind,name}={}){if(platform)PLAT=platform;if(kind)AUD=kind;if(name)UNAME=name.split(' ')[0]}
const isWin=()=>PLAT==='win';
/* P() turns lesson text into this learner's version:
   {{mac text||windows text}}, [name], [initial], Mac key symbols → Windows keys, kid ↔ adult wording */
function P(s){
 if(s==null)return '';s=String(s);
 s=s.replace(/\{\{([\s\S]*?)\|\|([\s\S]*?)\}\}/g,(m,a,b)=>isWin()?b:a);
 s=s.replace(/\[\[((?:(?!\]\]|\[\[|\|\|)[\s\S])*)\|\|((?:(?!\]\]|\[\[)[\s\S])*)\]\]/g,(m,a,b)=>AUD==='adult'?b:a).replace(/\[\[((?:(?!\]\]|\[\[)[\s\S])*)\]\]/g,(m,a)=>AUD==='adult'?'':a);
 s=s.replace(/\[name\]/g,esc(UNAME)).replace(/\[initial\]/g,esc((UNAME[0]||'A').toUpperCase()));
 if(isWin())s=s.replace(/<kbd>return<\/kbd>/g,'<kbd>Enter</kbd>').replace(/<kbd>delete<\/kbd>/g,'<kbd>Backspace</kbd>').replace(/<kbd>esc<\/kbd>/g,'<kbd>Esc</kbd>').replace(/<kbd>⌘<\/kbd>/g,'<kbd>Ctrl</kbd>').replace(/<kbd>⌥<\/kbd>/g,'<kbd>Alt</kbd>').replace(/<kbd>⇧<\/kbd>/g,'<kbd>Shift</kbd>').replace(/⌘/g,'Ctrl').replace(/⌥/g,'Alt').replace(/⇧/g,'Shift');
 if(AUD==='adult')s=s.replace(/Show Mum or Dad/g,'Show a friend or family member').replace(/Teach Mum or Dad/g,'Teach a friend or family member').replace(/Mum or Dad/g,'a friend or family member').replace(/Mum &amp; Dad|Mum & Dad/g,'family members').replace(/Ask a grown-up/g,'Ask someone you trust').replace(/ask a grown-up/g,'ask someone you trust').replace(/a grown-up/g,'someone you trust').replace(/grown-ups/g,'people you trust').replace(/your family/g,'friends or family');
 return s;
}

const SVG={
 cursor:'<svg viewBox="0 0 24 24"><path d="M4 2.5l14.5 10.8-6.3.9 3.9 7.4-3 1.6-3.9-7.5L4 20.4z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>',
 play:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFD84D"/><path d="M10 7.5l7 4.5-7 4.5z" fill="#1A1E3A"/></svg>',
 replay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
 speak:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
 star:'<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="currentColor"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 back:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
 map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
 laptop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg>',
 warm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="2"/><path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M7 14.5h10"/></svg>',
 bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
 game:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h4M8 7v4M15 8h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6l-.6 5.6A2.8 2.8 0 0 0 7 16.3L8.6 14h6.8l1.6 2.3a2.8 2.8 0 0 0 4.9-2.1l-.6-5.6A4 4 0 0 0 17.3 5z"/></svg>',
 flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
 chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/></svg>',
 help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 3.8M12 17h.01"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
 logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
 wifi:'<svg viewBox="0 0 24 18"><path d="M12 16.5l2.6-3.1a4 4 0 0 0-5.2 0zM5.7 9.2l1.8 2.1a7 7 0 0 1 9 0l1.8-2.1a9.8 9.8 0 0 0-12.6 0zM1.7 4.5l1.8 2.1a13 13 0 0 1 17 0l1.8-2.1a15.8 15.8 0 0 0-20.6 0z" fill="#1d1d1f"/></svg>',
 cc:'<svg viewBox="0 0 24 18"><rect x="1" y="1.5" width="22" height="6" rx="3" fill="none" stroke="#1d1d1f" stroke-width="1.8"/><circle cx="17" cy="4.5" r="2" fill="#1d1d1f"/><rect x="1" y="10.5" width="22" height="6" rx="3" fill="none" stroke="#1d1d1f" stroke-width="1.8"/><circle cx="7" cy="13.5" r="2" fill="#1d1d1f"/></svg>',
 vol:'<svg viewBox="0 0 24 18"><path d="M3 6v6h4l5 4V2L7 6z" fill="#1d1d1f"/><path d="M15 5.5a5 5 0 0 1 0 7M17.5 3a8.5 8.5 0 0 1 0 12" stroke="#1d1d1f" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
 bat:'<svg viewBox="0 0 26 14"><rect x="1" y="1" width="21" height="12" rx="3" fill="none" stroke="#1d1d1f" stroke-width="1.6"/><rect x="3.5" y="3.5" width="14" height="7" rx="1.2" fill="#1d1d1f"/><rect x="23" y="4.5" width="2" height="5" rx="1" fill="#1d1d1f"/></svg>',
 search:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="#666" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
 alL:'<svg viewBox="0 0 20 20" stroke="#333" stroke-width="2"><path d="M3 5h14M3 9h9M3 13h14M3 17h9"/></svg>',
 alC:'<svg viewBox="0 0 20 20" stroke="#333" stroke-width="2"><path d="M3 5h14M5.5 9h9M3 13h14M5.5 17h9"/></svg>',
 alR:'<svg viewBox="0 0 20 20" stroke="#333" stroke-width="2"><path d="M3 5h14M8 9h9M3 13h14M8 17h9"/></svg>',
 bul:'<svg viewBox="0 0 20 20"><circle cx="4" cy="6" r="1.6" fill="#333"/><circle cx="4" cy="14" r="1.6" fill="#333"/><path d="M8 6h10M8 14h10" stroke="#333" stroke-width="2"/></svg>',
 pic:'<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#8fd3ff"/><path d="M2 17l6-6 5 5 3-3 6 6v1H2z" fill="#4caf50"/><circle cx="16.5" cy="8.5" r="2" fill="#FFE066"/></svg>',
 table:'<svg viewBox="0 0 24 24" fill="none" stroke="#185ABD" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M3 15h18M9 4v16M15 4v16"/></svg>',
 shapes:'<svg viewBox="0 0 24 24"><circle cx="8" cy="9" r="5" fill="#FF6B8B"/><rect x="11" y="11" width="10" height="9" rx="1" fill="#2F7BF6"/></svg>',
 chart:'<svg viewBox="0 0 24 24"><rect x="4" y="12" width="4" height="8" fill="#2F7BF6"/><rect x="10" y="6" width="4" height="14" fill="#107C41"/><rect x="16" y="9" width="4" height="11" fill="#F0A500"/></svg>',
 sigma:'<svg viewBox="0 0 24 24"><path d="M17 5H6l6 7-6 7h11" fill="none" stroke="#107C41" stroke-width="2.4" stroke-linejoin="round"/></svg>',
 clip:'<svg viewBox="0 0 24 24" width="1.3em" height="1.3em" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"><path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L14.8 7"/></svg>',
 send:'<svg viewBox="0 0 24 24" width="1.3em" height="1.3em"><path d="M3 11l18-8-8 18-2-8z" fill="#2F7BF6"/></svg>',
 reply:'<svg viewBox="0 0 24 24" width="1.3em" height="1.3em" fill="none" stroke="#555" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 7L4 12l6 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/></svg>',
 shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
 power:'<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round"><path d="M12 3v9"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>',
};
const APPLE='<svg viewBox="0 0 20 24"><path d="M10.4 6.6c-.3-2.6 1.6-5 4-5.4.3 2.6-1.7 4.9-4 5.4z" fill="#1d1d1f"/><path d="M10 8.1C8.2 6.9 3.9 6.5 2.3 10.6c-1.6 4.2 1.3 11 4.3 11.9 1.5.4 2.2-.6 3.4-.6s1.9 1 3.4.6c3-.9 5.9-7.7 4.3-11.9C16.1 6.5 11.8 6.9 10 8.1z" fill="#1d1d1f"/></svg>';
const WINLOGO='<svg viewBox="0 0 20 20"><rect x="1" y="1" width="8.5" height="8.5" rx=".8" fill="#2B7DE9"/><rect x="10.5" y="1" width="8.5" height="8.5" rx=".8" fill="#2B7DE9"/><rect x="1" y="10.5" width="8.5" height="8.5" rx=".8" fill="#2B7DE9"/><rect x="10.5" y="10.5" width="8.5" height="8.5" rx=".8" fill="#2B7DE9"/></svg>';

/* ---------- app icons (simple generic drawings) ---------- */
const G={
 finder:'<svg viewBox="0 0 24 24"><circle cx="8.5" cy="9.5" r="1.6" fill="#fff"/><circle cx="15.5" cy="9.5" r="1.6" fill="#fff"/><path d="M6 15c3.5 3 8.5 3 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
 explorer:'<svg viewBox="0 0 24 24"><path d="M2 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="#FFC83D"/><path d="M2 10h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="#F4A920"/></svg>',
 launch:'<svg viewBox="0 0 24 24" fill="#fff"><rect x="3" y="3" width="5" height="5" rx="1.2"/><rect x="9.5" y="3" width="5" height="5" rx="1.2"/><rect x="16" y="3" width="5" height="5" rx="1.2"/><rect x="3" y="9.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="16" y="9.5" width="5" height="5" rx="1.2"/><rect x="3" y="16" width="5" height="5" rx="1.2"/><rect x="9.5" y="16" width="5" height="5" rx="1.2"/><rect x="16" y="16" width="5" height="5" rx="1.2"/></svg>',
 safari:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fff"/><path d="M16.5 7.5l-3 6-6 3 3-6z" fill="#E0463E"/><path d="M13.5 13.5l-6 3 3-6z" fill="#8a8a95"/></svg>',
 edge:'<svg viewBox="0 0 24 24"><path d="M21 14c0 4-4 7-8.5 7S4 18 3.5 13.5C3 8 7 3 12.5 3S21 7 21 11c0 2.5-2 3.5-4 3.5H9.5c.3 2.3 2.3 3.6 4.6 3.6 2 0 4.1-.9 5.9-2.4z" fill="#fff"/><path d="M9.6 11.2c.4-1.8 1.8-3 3.6-3s3 1.2 3 3z" fill="#1aa3e8"/></svg>',
 mail:'<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="#fff"/><path d="M3 6.5l9 6.5 9-6.5" stroke="#2F7BF6" stroke-width="1.8" fill="none"/></svg>',
 settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-dasharray="3 2.2"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>',
 trash:'<svg viewBox="0 0 24 24"><path d="M6 7h12l-1.2 13.5a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3z" fill="#fff" stroke="#9aa0ab" stroke-width="1.2"/><path d="M9.5 10v8M12 10v8M14.5 10v8" stroke="#b5bac3" stroke-width="1.2"/><rect x="5" y="4.5" width="14" height="2.5" rx="1" fill="#e2e5ea"/></svg>',
 textedit:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1.5" fill="#fff"/><path d="M8 8h8M8 11h8M8 14h5" stroke="#999" stroke-width="1.4"/><path d="M15 18l5-9 1.4.8-5 9z" fill="#F0A500"/></svg>',
 calc:'<svg viewBox="0 0 24 24" fill="#fff"><rect x="5" y="3" width="14" height="5" rx="1"/><circle cx="7.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="16.5" cy="12" r="1.6" fill="#FF9F0A"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="12" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6" fill="#FF9F0A"/></svg>',
 notes:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#fff"/><rect x="3" y="3" width="18" height="5" rx="2" fill="#FFD60A"/><path d="M6 12h12M6 15.5h12M6 19h8" stroke="#ccc" stroke-width="1.2"/></svg>',
 preview:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1.5" fill="#fff"/><path d="M3 16l5-5 4 4 3-3 6 6" fill="#4caf50"/><circle cx="16" cy="9" r="1.8" fill="#FFB020"/></svg>',
 store:'<svg viewBox="0 0 24 24"><path d="M4 8h16l-1 12H5z" fill="#fff"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#fff" stroke-width="2" fill="none"/></svg>',
};
const APPS_MAC={
 finder:['Finder','#1E88F0',G.finder], launch:['Launchpad','#6A6F7C',G.launch], safari:['Safari','#1F8BF2',G.safari], mail:['Mail','#3C9BFF',G.mail],
 word:['Word','#185ABD','W'], ppt:['PowerPoint','#C43E1C','P'], excel:['Excel','#107C41','X'], settings:['System Settings','#8A8F9A',G.settings],
 trash:['Trash','#E9ECF1',G.trash], textedit:['TextEdit','#F4F4F6',G.textedit], calc:['Calculator','#3a3a40',G.calc], notes:['Notes','#F7F7F4',G.notes], preview:['Preview','#63B7F7',G.preview], store:['App Store','#1E88F0',G.store]
};
const APPS_WIN=Object.assign({},APPS_MAC,{
 finder:['File Explorer','#FFF4D6',G.explorer], launch:['All apps','#5B6170',G.launch], safari:['Microsoft Edge','#0C59A4',G.edge], mail:['Outlook','#0A64C8',G.mail],
 settings:['Settings','#5D6B7B',G.settings], trash:['Recycle Bin','#E9ECF1',G.trash], textedit:['Notepad','#3D8BE0',G.textedit], calc:['Calculator','#3a3a40',G.calc],
 notes:['Sticky Notes','#F7E27A',G.notes], preview:['Photos','#2C7BE5',G.preview], store:['Microsoft Store','#2B2B2B',G.store]
});
const appInfo=a=>(isWin()?APPS_WIN:APPS_MAC)[a]||APPS_MAC[a];
function ic(app,k,cls=''){const a=appInfo(app);return `<span class="ic ${cls}" ${k?`data-k="${k}"`:''} style="background:${a[1]}" title="${a[0]}">${a[2]}</span>`}

/* ================= scene building blocks ================= */
function menubar(app='Finder',menus=['File','Edit','View','Go','Window','Help']){
 if(isWin())return '';
 return `<div class="mb" data-k="mb"><span class="mbi" data-k="apple">${APPLE}</span><b class="mbi" data-k="appname">${app}</b>${menus.map(m=>`<span class="mbi" data-k="m-${slug(m)}">${m}</span>`).join('')}<span class="mbr"><span class="mbi" data-k="wifi">${SVG.wifi}</span><span class="mbi" data-k="cc">${SVG.cc}</span><span class="mbi" data-k="clock">Wed 4:00 PM</span></span></div>`;
}
const DOCK_DEFAULT=['finder','launch','safari','mail','word','ppt','excel','settings','|','trash'];
function dock(list=DOCK_DEFAULT,run=['finder']){
 if(isWin()){
  const apps=list.filter(a=>!['|','trash','launch'].includes(a));
  return `<div class="tbar" data-k="dock"><div class="tbc"><span class="tbi start" data-k="apple">${WINLOGO}</span><span class="tbsearch" data-k="wsearch">${SVG.search} Search</span>${apps.map(a=>ic(a,'d-'+a,run.includes(a)?'run':'')).join('')}</div><div class="tray"><span class="mbi" data-k="wifi">${SVG.wifi}</span><span class="mbi" data-k="cc">${SVG.vol}</span><span class="mbi">${SVG.bat}</span><span class="mbi tclock" data-k="clock">4:00 PM<br>11/10/2026</span></div></div>`;
 }
 return `<div class="dock" data-k="dock">${list.map(a=>a==='|'?'<span class="dsep"></span>':ic(a,'d-'+a,run.includes(a)?'run':'')).join('')}</div>`;
}
function desk(extra='',o={}){
 const icons=(o.icons||[]).slice();
 if(isWin()&&!o.noDock&&!o.noTrashIcon)icons.unshift(['d-trash','Recycle Bin','rbin',2,6]);
 return (o.noMenu?'':menubar(o.app||'Finder',o.menus))+icons.map(deskIcon).join('')+extra+(o.noDock?'':dock(o.dock,o.run));
}
function fileIcon([k,name,type,cls='']){const t={pdf:'PDF',docx:'DOCX',ppt:'PPTX',xls:'XLSX',zip:'ZIP'}[type]||'';return `<div class="di ${cls}" data-k="${k}"><span class="fic ${type}" data-t="${t}"></span><span class="fn" data-k="${k}-n">${name}</span></div>`}
function deskIcon([k,name,type,x,y,cls='']){return fileIcon([k,name,type,cls]).replace('class="di','style="left:'+x+'%;top:'+y+'%" class="di')}
function win(k,title,body,pos,cls=''){
 if(isWin())return `<div class="win w11 ${cls}" data-k="${k}" style="left:${pos[0]}%;top:${pos[1]}%;width:${pos[2]}%;height:${pos[3]}%"><div class="tb" data-k="${k}-tb"><span class="tt" data-k="${k}-title">${title}</span><span class="wc"><i data-k="${k}-min">─</i><i data-k="${k}-full">☐</i><i class="x" data-k="${k}-close">✕</i></span></div><div class="wb">${body}</div></div>`;
 return `<div class="win ${cls}" data-k="${k}" style="left:${pos[0]}%;top:${pos[1]}%;width:${pos[2]}%;height:${pos[3]}%"><div class="tb" data-k="${k}-tb"><span class="lt"><i class="r" data-k="${k}-close"></i><i class="y" data-k="${k}-min"></i><i class="g" data-k="${k}-full"></i></span><span class="tt" data-k="${k}-title">${title}</span></div><div class="wb">${body}</div></div>`;
}
/* menu(k, items, x, y, hidden, anchor): with an anchor key the menu opens just under that element */
function menu(k,items,x,y,hidden=true,anchor=''){
 return `<div class="menu ${hidden?'off':''}" data-k="${k}" ${anchor?`data-anchor="${anchor}"`:''} style="left:${x}%;top:${y}%">${items.map(it=>it==='-'?'<hr>':`<div data-k="${it[0]}">${it[1]}${it[2]?`<small>${it[2]}</small>`:''}</div>`).join('')}</div>`;
}
function dlg(k,title,text,btns,hidden=true){return `<div class="dlg ${hidden?'off':''}" data-k="${k}"><b>${title}</b>${text}<div class="row">${btns.map(b=>`<span class="b2 ${b[2]||''}" data-k="${b[0]}">${b[1]}</span>`).join('')}</div></div>`}
/* Apple menu on a Mac / Start menu on Windows (same keys, so demos can share steps) */
const appleMenu=(hidden=true)=>{
 if(isWin())return `<div class="startm ${hidden?'off':''}" data-k="amenu"><div class="sms">${SVG.search} Search for apps, settings and documents</div><b class="smh">Pinned</b><div class="smg">${['word','excel','ppt','safari','mail','settings','calc','notes','finder'].map(a=>`<div data-k="${a==='settings'?'am-settings':'sp-'+a}">${ic(a)}<span>${appInfo(a)[0]}</span></div>`).join('')}</div><div class="smf"><span class="smu" data-k="am-user"><span class="av sm">[initial]</span>[name]</span><span class="smp" data-k="am-power">${SVG.power}</span></div></div><div class="menu off" data-k="pwm" data-anchor="am-power" data-up="1" style="left:50%;top:50%"><div data-k="am-sleep">Sleep</div><div data-k="am-shut">Shut down</div><div data-k="am-restart">Restart</div></div><div class="menu off" data-k="um" data-anchor="am-user" data-up="1" style="left:30%;top:50%"><div data-k="am-lock">Lock</div><div data-k="am-logout">Sign out</div></div>`;
 return menu('amenu',[['am-about','About This Mac'],'-',['am-settings','System Settings…'],['am-store','App Store…'],'-',['am-force','Force Quit…','⌥⌘⎋'],'-',['am-sleep','Sleep'],['am-restart','Restart…'],['am-shut','Shut Down…'],'-',['am-lock','Lock Screen','⌃⌘Q'],['am-logout','Log Out [name]…']],1,3.6,hidden);
};
const FINDER_LABEL_WIN={'Recents':'Home','iCloud Drive':'OneDrive'};
function finderBody(items,sel='Documents',side=['Recents','Desktop','Documents','Downloads','iCloud Drive']){
 const lab=s=>isWin()?(FINDER_LABEL_WIN[s]||s):s;
 const bar=isWin()?`<div class="cmdbar"><span class="cbn" data-k="m-file">＋ New ▾</span><span>✂</span><span>⧉</span><span>📋</span><span data-k="cb-rename">✎</span><span data-k="cb-share">⤴</span><span data-k="cb-del">🗑</span><span>Sort ▾</span><span>View ▾</span></div>`:'';
 return `${bar}<div class="fnd"><div class="side" data-k="side">${isWin()?'':'<div class="sh">Favourites</div>'}${side.map(s=>`<div class="si ${s===sel?'on':''}" data-k="fs-${slug(s)}"><i></i>${lab(s)}</div>`).join('')}</div><div class="fgrid" data-k="fgrid">${items.map(fileIcon).join('')}</div></div>`;
}
const WTABS=['Home','Insert','Draw','Design','Layout','References','Review','View'];
function ribbon(tabs,on,tools,app){const t=isWin()?`<span data-k="m-file" class="ftab" style="background:${app}">File</span>`:'';return `<div class="rib" style="--app:${app}"><div class="rtabs">${t}${tabs.map(x=>`<span data-k="t-${slug(x)}" class="${x===on?'on':''}">${x}</span>`).join('')}</div><div class="rtools" data-k="rtools">${tools}</div></div>`}
const homeTools=`<span class="rbox" data-k="font">Calibri</span><span class="rbox sm" data-k="size">12</span><span class="rb" data-k="bold"><b>B</b></span><span class="rb" data-k="ital"><i style="font-family:serif">I</i></span><span class="rb" data-k="und"><u>U</u></span><span class="rb" data-k="color">A<em class="cbar"></em></span><span class="rsep"></span><span class="rb" data-k="al-left">${SVG.alL}</span><span class="rb" data-k="al-center">${SVG.alC}</span><span class="rb" data-k="al-right">${SVG.alR}</span><span class="rb" data-k="bullets">${SVG.bul}</span><span class="rsep"></span><span class="rbox" data-k="styles" style="min-width:12cqw">Normal · Heading 1</span>`;
const insertTools=`<span class="rbig" data-k="i-pics">${SVG.pic}Pictures</span><span class="rbig" data-k="i-shapes">${SVG.shapes}Shapes</span><span class="rbig" data-k="i-table">${SVG.table}Table</span><span class="rbig" data-k="i-chart">${SVG.chart}Chart</span>`;
function wordBody(doc='',tab='Home'){return ribbon(WTABS,tab,tab==='Insert'?insertTools:homeTools,'#185ABD')+`<div class="docbg" data-k="docbg"><div class="page" data-k="doc">${doc}</div></div>`}
function wordWin(doc='',o={}){return win('word',o.title||'Document1',wordBody(doc,o.tab),o.pos||[3,6,94,80],o.cls||'')}
const PTABS=['Home','Insert','Design','Transitions','Animations','Slide Show'];
function pptBody(o={}){
 const n=o.slides||1;const tools=o.tools||`<span class="rbig" data-k="p-new">${SVG.pic.replace('#8fd3ff','#FFD8C8')}New Slide</span><span class="rbig" data-k="p-layout">▦ Layout</span><span class="rsep"></span><span class="rb"><b>B</b></span><span class="rb"><i style="font-family:serif">I</i></span><span class="rbox" style="min-width:8cqw">Aptos</span>`;
 return ribbon(PTABS,o.tab||'Home',tools,'#C43E1C')+`<div class="pp"><div class="thumbs" data-k="thumbs">${Array.from({length:n},(_,i)=>`<div class="th ${i===0?'on':''}" data-n="${i+1}" data-k="th${i+1}">${o.thumbTxt?.[i]||''}</div>`).join('')}</div><div class="slidearea"><div class="slide ${o.theme||''}" data-k="slide">${o.slide||'<div class="ph" data-k="ptitle">Click to add title</div><div class="ph sub" data-k="psub">Click to add subtitle</div>'}</div></div></div>${o.notes?`<div class="pnotes" data-k="pnotes">${o.notes}</div>`:''}`;
}
function pptWin(o={}){return win('ppt',o.title||'Presentation1',pptBody(o),o.pos||[3,6,94,80])}
function excelBody(data={},o={}){
 const cols=o.cols||['A','B','C','D','E'];let g='<div class="hd"></div>'+cols.map(c=>`<div class="hd" data-k="col-${c}">${c}</div>`).join('');
 for(let r=1;r<=(o.rows||9);r++){g+=`<div class="hd" data-k="row-${r}">${r}</div>`+cols.map(c=>{const v=data[c+r];const num=typeof v==='number'||/^[=\d]/.test(v||'');return `<div data-k="c-${c}${r}" class="${num?'num':''}">${v??''}</div>`}).join('')}
 return ribbon(['Home','Insert','Draw','Page Layout','Formulas','Data'],o.tab||'Home',o.tools||`<span class="rbox" style="min-width:7cqw">Aptos</span><span class="rbox sm">12</span><span class="rb"><b>B</b></span><span class="rsep"></span><span class="rbig" data-k="x-sum">${SVG.sigma}AutoSum</span><span class="rbig" data-k="x-sort">⇅ Sort &amp; Filter</span><span class="rbig" data-k="x-cf">▤ Conditional</span>`,'#107C41')+`<div class="xl"><div class="fx"><span class="nm" data-k="x-name">A1</span><span class="fxl">fx</span><span class="fv" data-k="x-fx"></span></div><div class="grid" data-k="grid" style="grid-template-columns:3cqw repeat(${cols.length},minmax(0,1fr))">${g}</div>${o.extra||''}</div>`;
}
function excelWin(data,o={}){return win('excel',o.title||'Book1',excelBody(data,o),o.pos||[3,6,94,80])}
function browserBody(url='',page='',tab='New Tab'){return `<div class="br"><div class="btabs" data-k="btabs"><span class="btab on" data-k="tab1">${tab}</span><span class="bplus" data-k="newtab">+</span></div><div class="bbar"><span class="bb" data-k="back">‹</span><span class="bb" data-k="fwd">›</span><span class="bb" data-k="reload" style="font-size:1.6cqw">↻</span><span class="addr" data-k="addr">${url}</span><span class="bb" data-k="bm" style="font-size:1.7cqw">☆</span></div><div class="bpage" data-k="page">${page}</div></div>`}
function browserWin(url,page,o={}){return win('br',o.title||'',browserBody(url,page,o.tab),o.pos||[4,6,92,80])}
const searchPage=(q='')=>`<div class="sh1">Search</div><div class="sbox" data-k="sbox">${SVG.search}<span data-k="q">${q}</span></div>`;
function mailBody(o={}){return `<div class="mtools"><span data-k="send">${SVG.send}</span><span data-k="clip">${SVG.clip}</span><span data-k="replyb">${SVG.reply}</span></div><div class="mail"><div class="mf"><b>To:</b><span data-k="to">${o.to||''}</span></div>${o.cc!==undefined?`<div class="mf"><b>Cc:</b><span data-k="cc2">${o.cc}</span></div><div class="mf"><b>Bcc:</b><span data-k="bcc">${o.bcc||''}</span></div>`:''}<div class="mf"><b>Subject:</b><span data-k="subj">${o.subj||''}</span></div><div class="mbody" data-k="mbody">${o.body||''}</div></div>`}
function ccPanel(hidden=true){return `<div class="ccp ${isWin()?'qs':''} ${hidden?'off':''}" data-k="ccp"><div class="cct" data-k="cc-wifi"><span class="ccd" data-k="cc-wdot">${SVG.wifi.replace('#1d1d1f','#fff')}</span><span>Wi-Fi<br><small style="font-weight:400;color:#666" data-k="cc-wname">HomeWiFi</small></span></div><div class="sl">{{Display||Brightness}}<div class="bar"><div class="fillb" data-k="cc-bright" style="width:45%"></div></div></div><div class="sl">{{Sound||Volume}}<div class="bar"><div class="fillb" data-k="cc-vol" style="width:30%"></div></div></div></div>`}
function spotlight(hidden=true){return `<div class="spot ${isWin()?'wsrch':''} ${hidden?'off':''}" data-k="spot"><div class="sin">${SVG.search}<span data-k="spq"></span></div><div class="sres off" data-k="spres"></div></div>`}
function saveDlg(o={}){return `<div class="pdlg ${o.hidden===false?'':'off'}" data-k="save"><div class="r"><b>{{Save As:||File name:}}</b><span class="fld" data-k="sv-name">${o.name||'Untitled'}</span></div><div class="r"><b>{{Where:||Folder:}}</b><span class="fld" data-k="sv-where">${o.where||'Documents'}</span></div>${o.format?`<div class="r"><b>{{File Format:||Save as type:}}</b><span class="fld" data-k="sv-fmt">${o.format}</span></div>`:''}<div class="row"><span class="b2" data-k="sv-cancel">Cancel</span><span class="b2 pri" data-k="sv-save">${o.btn||'Save'}</span></div></div>`}
function tpInset(){return `<div class="tp" data-k="tp"><i class="fg fg1"></i><i class="fg fg2"></i></div>`}

/* ---------- keyboard ---------- */
const KB_MAC=[
 [['esc','esc',1.2,'fr'],['☀︎−','f1',1,'fr'],['☀︎+','f2',1,'fr'],['F3','f3',1,'fr'],['F4','f4',1,'fr'],['F5','f5',1,'fr'],['F6','f6',1,'fr'],['F7','f7',1,'fr'],['F8','f8',1,'fr'],['F9','f9',1,'fr'],['mute','f10',1,'fr'],['vol−','f11',1,'fr'],['vol+','f12',1,'fr'],['⏻','power',1,'fr']],
 [['`','`'],['1','1','!'],['2','2','@'],['3','3','#'],['4','4','$'],['5','5','%'],['6','6','^'],['7','7','&'],['8','8','*'],['9','9','('],['0','0',')'],['-','-','_'],['=','=','+'],['delete','backspace',1.6,'sm']],
 [['tab','tab',1.6,'sm'],['Q','q'],['W','w'],['E','e'],['R','r'],['T','t'],['Y','y'],['U','u'],['I','i'],['O','o'],['P','p'],['[','['],[']',']'],['\\','\\']],
 [['caps lock','capslock',1.9,'sm caps'],['A','a'],['S','s'],['D','d'],['F','f',1,'bump'],['G','g'],['H','h'],['J','j',1,'bump'],['K','k'],['L','l'],[';',';'],["'","'"],['return','enter',1.9,'sm']],
 [['shift','shiftl',2.4,'sm'],['Z','z'],['X','x'],['C','c'],['V','v'],['B','b'],['N','n'],['M','m'],[',',','],['.','.'],['/','/'],['shift','shiftr',2.4,'sm']],
 [['fn','fn',1,'sm'],['⌃<br><small>control</small>','ctrl',1,'sm'],['⌥<br><small>option</small>','optl',1,'sm'],['⌘<br><small>command</small>','cmdl',1.3,'sm'],['','space',5.4],['⌘<br><small>command</small>','cmdr',1.3,'sm'],['⌥<br><small>option</small>','optr',1,'sm'],['←','arrowleft',1,'sm'],['↑↓','arrowup',1,'sm'],['→','arrowright',1,'sm']]
];
/* Windows laptop layout: Ctrl keys use the "cmd" codes because Ctrl does the job ⌘ does on a Mac */
const KB_WIN=[
 [['Esc','esc',1.2,'fr'],['F1','f1',1,'fr'],['F2','f2',1,'fr'],['F3','f3',1,'fr'],['F4','f4',1,'fr'],['F5','f5',1,'fr'],['F6','f6',1,'fr'],['F7','f7',1,'fr'],['F8','f8',1,'fr'],['F9','f9',1,'fr'],['F10','f10',1,'fr'],['F11','f11',1,'fr'],['F12','f12',1,'fr'],['PrtSc','prtsc',1,'fr'],['Del','del',1,'fr']],
 [['`','`'],['1','1','!'],['2','2','@'],['3','3','#'],['4','4','$'],['5','5','%'],['6','6','^'],['7','7','&'],['8','8','*'],['9','9','('],['0','0',')'],['-','-','_'],['=','=','+'],['Backspace','backspace',1.9,'sm']],
 [['Tab','tab',1.6,'sm'],['Q','q'],['W','w'],['E','e'],['R','r'],['T','t'],['Y','y'],['U','u'],['I','i'],['O','o'],['P','p'],['[','['],[']',']'],['\\','\\']],
 [['Caps Lock','capslock',1.9,'sm caps'],['A','a'],['S','s'],['D','d'],['F','f',1,'bump'],['G','g'],['H','h'],['J','j',1,'bump'],['K','k'],['L','l'],[';',';'],["'","'"],['Enter','enter',1.9,'sm']],
 [['Shift','shiftl',2.4,'sm'],['Z','z'],['X','x'],['C','c'],['V','v'],['B','b'],['N','n'],['M','m'],[',',','],['.','.'],['/','/'],['Shift','shiftr',2.4,'sm']],
 [['Ctrl','cmdl',1.2,'sm'],['Fn','fn',1,'sm'],[WINLOGO.replace('<svg','<svg width="1.6cqw" height="1.6cqw"'),'win',1,'sm'],['Alt','optl',1,'sm'],['','space',5.6],['Alt','optr',1,'sm'],['Ctrl','cmdr',1.2,'sm'],['←','arrowleft',1,'sm'],['↑↓','arrowup',1,'sm'],['→','arrowright',1,'sm']]
];
const FINGER={};
'`1qaz'.split('').forEach(c=>FINGER[c]='lp');'2wsx'.split('').forEach(c=>FINGER[c]='lr');'3edc'.split('').forEach(c=>FINGER[c]='lm');'45rtfgvb'.split('').forEach(c=>FINGER[c]='li');
'67yhnujm'.split('').forEach(c=>FINGER[c]='ri');'8ik,'.split('').forEach(c=>FINGER[c]='rm');'9ol.'.split('').forEach(c=>FINGER[c]='rr');"0p;/-=[]'\\".split('').forEach(c=>FINGER[c]='rp');
Object.assign(FINGER,{space:'th',shiftl:'lp',shiftr:'rp',tab:'lp',capslock:'lp',enter:'rp',backspace:'rp'});
const FNAME={lp:['left little finger','#FF8FAB'],lr:['left ring finger','#FFB65C'],lm:['left middle finger','#E8C800'],li:['left pointer finger','#5CC24F'],ri:['right pointer finger','#3AA7F0'],rm:['right middle finger','#7D6BFF'],rr:['right ring finger','#D96BE6'],rp:['right little finger','#FF7F5C'],th:['thumb','#9A9AA5']};
function kb(o={}){
 const base=isWin()?KB_WIN:KB_MAC;const rows=o.noFn?base.slice(1):base;
 return `<div class="kb ${o.fingers?'fingers':''}" data-k="${o.k||'kb'}">${rows.map(r=>`<div class="kr">${r.map(([l,c,w,cls])=>`<span class="key ${cls||''}" data-k="key-${c}" data-f="${FINGER[c]||''}" style="flex-grow:${w||1}">${l}</span>`).join('')}</div>`).join('')}</div>`;
}
const KEYALIAS={'⌘':['cmdl','cmdr'],'⇧':['shiftl','shiftr'],'⌥':['optl'],'⌃':['ctrl'],'shift':['shiftl'],'return':['enter'],'space':['space'],'delete':['backspace'],'esc':['esc'],'caps':['capslock'],'tab':['tab'],'→':['arrowright'],'←':['arrowleft'],'⊞':['win'],'win':['win'],'ctrl':['cmdl'],'alt':['optl'],'enter':['enter'],'backspace':['backspace'],'prtsc':['prtsc'],'del':['del']};
function keyCodes(label){const l=String(label).toLowerCase();if(KEYALIAS[label])return KEYALIAS[label];if(KEYALIAS[l])return KEYALIAS[l];if(l==='⏻'||l==='power')return['power'];if(/^f\d+$/.test(l))return[l];return[l]}
const WINKEYLABEL={'⌘':'Ctrl','⌥':'Alt','⇧':'Shift','⌃':'Ctrl','return':'Enter','delete':'Backspace','esc':'Esc','space':'Space','tab':'Tab','⊞':'⊞ Win','⏻':'⏻'};
const keyLabel=k=>isWin()?(WINKEYLABEL[k]||P(k)):(k==='⊞'?'⌘':P(k));

/* ================= demo player ================= */
let PLAYERS=[];
class Player{
 constructor(host,d){this.h=host;this.d=d;this.t=0;PLAYERS.push(this);this.draw()}
 draw(){
  const d=this.d;
  this.h.innerHTML=`<div class="stage"><div class="mac ${isWin()?'w11':''} ${d.cls||''}" style="${d.ratio?`aspect-ratio:${d.ratio}`:''}" role="img" aria-label="${esc(P(d.alt||'Animated picture of a computer screen'))}">${P(d.build())}<div class="cur" ${d.noCursor?'hidden':''}>${SVG.cursor}</div><div class="keys"></div></div><button type="button" class="playov">${SVG.play}<span>Watch how</span></button></div><div class="dcap"><span class="dtxt" aria-live="polite">${P(d.intro||'Press <b>Watch how</b> to see it move.')}</span><button type="button" class="mini replay" hidden>${SVG.replay} Watch again</button></div>`;
  this.m=$('.mac',this.h);this.c=$('.cur',this.m);this.k=$('.keys',this.m);this.cap=$('.dtxt',this.h);
  $('.playov',this.h).onclick=()=>this.play();$('.replay',this.h).onclick=()=>this.play();
  [this.cx,this.cy]=d.start||[50,60];this.setCur();
 }
 q(k){return this.m.querySelector(`[data-k="${k}"]`)}
 qa(k){return [...this.m.querySelectorAll(`[data-k="${k}"]`)]}
 setCur(){this.c.style.left=this.cx+'%';this.c.style.top=this.cy+'%'}
 pos(k,dx=0,dy=0){const e=typeof k==='string'?this.q(k):k;if(!e)return[this.cx,this.cy];const a=this.m.getBoundingClientRect(),b=e.getBoundingClientRect();return[(b.left+b.width/2-a.left)/a.width*100+dx,(b.top+b.height/2-a.top)/a.height*100+dy]}
 rel(e){const a=this.m.getBoundingClientRect(),b=e.getBoundingClientRect();return{l:(b.left-a.left)/a.width*100,t:(b.top-a.top)/a.height*100,w:b.width/a.width*100,h:b.height/a.height*100,b:(b.bottom-a.top)/a.height*100}}
 async play(){
  PLAYERS=PLAYERS.filter(p=>p.h.isConnected);
  PLAYERS.forEach(p=>{if(p!==this&&p.running){p.t++;p.running=false;p.draw()}});
  const my=++this.t;this.draw();this.running=true;$('.playov',this.h).hidden=true;
  const ok=()=>my===this.t&&this.h.isConnected;
  await this.run(this.d.steps,ok);
  if(ok()){this.running=false;const r=$('.replay',this.h);if(r)r.hidden=false}
 }
 async run(steps,ok){for(const a of steps){if(!ok())return;try{await this.x(a,ok)}catch(e){console.error(e)}}}
 rip(cls='',lab=''){const r=document.createElement('div');r.className='rip '+cls;r.style.left=this.cx+'%';r.style.top=this.cy+'%';this.m.appendChild(r);setTimeout(()=>r.remove(),700);
  if(lab){const l=document.createElement('div');l.className='riplab '+(cls==='r'?'':'b');l.textContent=P(lab);l.style.left=this.cx+'%';l.style.top=this.cy+'%';this.m.appendChild(l);setTimeout(()=>l.remove(),1000)}}
 async x(a,ok){
  const [op,...p]=a;const q=k=>this.q(k);
  if(window.DEMO_DEBUG&&['to','show','hide','cls','set','style','type','erase','drag','tag','hl'].includes(op)&&typeof p[0]==='string'&&!this.q(p[0]))console.warn('MISSING',PLAT,op,p[0]);
  switch(op){
   case'if':if(p[0]===PLAT)await this.run(p[1],ok);break;
   case'cap':this.cap.innerHTML=P(p[0]);await sleep(p[1]??1100);break;
   case'move':this.cx=p[0];this.cy=p[1];this.setCur();await sleep(p[2]??800);break;
   case'to':{const[x,y]=this.pos(p[0],p[1]||0,p[2]||0);this.cx=x;this.cy=y;this.setCur();await sleep(p[3]??850);break}
   case'click':this.rip('',p[0]??'click');await sleep(p[1]??500);break;
   case'dbl':this.rip('','double-click');await sleep(160);this.rip('');await sleep(p[0]??600);break;
   case'rclick':this.rip('r',p[0]??'right-click');await sleep(p[1]??600);break;
   case'show':this.qa(p[0]).forEach(e=>{if(e.dataset.anchor){const an=this.q(e.dataset.anchor);if(an){const r=this.rel(an);e.style.left=Math.min(r.l,70)+'%';e.style.top=(e.dataset.up?r.t-.4-e.offsetHeight/this.m.clientHeight*100:r.b+.4)+'%'}}e.classList.remove('off')});await sleep(p[1]??400);break;
   case'hide':this.qa(p[0]).forEach(e=>e.classList.add('off'));await sleep(p[1]??350);break;
   case'cls':this.qa(p[0]).forEach(e=>e.classList.toggle(p[1],p[2]!==false));await sleep(p[3]??300);break;
   case'set':{const e=q(p[0]);if(e)e.innerHTML=P(p[1]);await sleep(p[2]??250);break}
   case'style':{const e=q(p[0]);if(e)Object.assign(e.style,p[1]);await sleep(p[2]??300);break}
   case'type':{const e=q(p[0]);if(!e)break;e.classList.add('caret');for(const ch of P(p[1])){if(!ok())return;if(ch==='\n')e.insertAdjacentHTML('beforeend','<br>');else e.insertAdjacentText('beforeend',ch);await sleep(p[2]??75)}e.classList.remove('caret');await sleep(250);break}
   case'erase':{const e=q(p[0]);if(!e)break;e.classList.add('caret');for(let i=0;i<p[1];i++){if(!ok())return;e.textContent=e.textContent.slice(0,-1);await sleep(p[2]??55)}e.classList.remove('caret');await sleep(200);break}
   case'keys':{const ks=p[0];this.k.innerHTML=ks.map(x=>`<kbd>${keyLabel(x)}</kbd>`).join('<span>+</span>');this.k.classList.add('on');
     const codes=ks.flatMap(keyCodes);codes.forEach(c=>this.qa('key-'+c).forEach(e=>e.classList.add('down')));
     await sleep(p[1]??1300);this.k.classList.remove('on');codes.forEach(c=>this.qa('key-'+c).forEach(e=>e.classList.remove('down')));await sleep(250);break}
   case'press':{for(const c of p[0]){if(!ok())return;const codes=keyCodes(c);codes.forEach(k=>this.qa('key-'+k).forEach(e=>e.classList.add('down')));if(p[1]){const e=q(p[1]);if(e){if(c==='space')e.insertAdjacentText('beforeend',' ');else if(c==='return')e.insertAdjacentHTML('beforeend','<br>');else if(c==='delete')e.textContent=e.textContent.slice(0,-1);else if(c.length===1)e.insertAdjacentText('beforeend',p[3]?c.toUpperCase():c)}}
     await sleep(p[2]??300);codes.forEach(k=>this.qa('key-'+k).forEach(e=>e.classList.remove('down')));await sleep(90)}break}
   case'hold':keyCodes(p[0]).forEach(k=>this.qa('key-'+k).forEach(e=>e.classList.toggle('down',p[1]!==false)));await sleep(p[2]??300);break;
   case'drag':{const s=q(p[0]);if(!s)break;const o=p[2]||{};
     await this.x(['to',p[0]],ok);this.rip('',o.lab??'press & hold');await sleep(450);
     const r=this.rel(s);const g=s.cloneNode(true);g.removeAttribute('data-k');$$('[data-k]',g).forEach(e=>e.removeAttribute('data-k'));g.classList.add('ghost');g.style.position='absolute';g.style.left=r.l+'%';g.style.top=r.t+'%';g.style.width=r.w+'%';g.style.margin='0';
     if(o.plus)g.insertAdjacentHTML('beforeend','<span class="plus">+</span>');
     this.m.appendChild(g);if(!o.copy)s.classList.add('dim');const offx=this.cx-r.l,offy=this.cy-r.t;g.getBoundingClientRect();
     const [tx,ty]=typeof p[1]==='string'?this.pos(p[1],o.dx||0,o.dy||0):p[1];
     if(typeof p[1]==='string'&&o.drop!==false){const t=q(p[1]);setTimeout(()=>t&&t.classList.add('drop'),700)}
     this.c.style.transition='left .8s cubic-bezier(.45,.05,.25,1),top .8s cubic-bezier(.45,.05,.25,1)';
     g.style.left=(tx-offx)+'%';g.style.top=(ty-offy)+'%';this.cx=tx;this.cy=ty;this.setCur();await sleep(1000);
     this.c.style.transition='';this.rip('','let go');
     if(typeof p[1]==='string'){const t=q(p[1]);t&&t.classList.remove('drop')}
     g.remove();s.classList.remove('dim');
     if(o.into){const t=q(o.into);if(t){if(o.copy){const cl=s.cloneNode(true);cl.dataset.k=s.dataset.k+'-copy';t.appendChild(cl)}else t.appendChild(s)}}
     else if(o.gone)s.classList.add('off');
     else if(o.place){s.style.left=(tx-offx)+'%';s.style.top=(ty-offy)+'%'}
     await sleep(450);break}
   case'tag':{const e=q(p[0]);if(!e)break;const r=this.rel(e);const t=document.createElement('div');const up=P(p[2]||'')==='up';t.className='tag'+(up?' up':'');t.innerHTML=P(p[1]);
     t.style.left=Math.min(90,Math.max(10,r.l+r.w/2))+'%';t.style.top=(up?r.t-1.5:r.b+1.5)+'%';this.m.appendChild(t);await sleep(p[3]??1300);break}
   case'untag':$$('.tag',this.m).forEach(t=>t.remove());await sleep(p[0]??150);break;
   case'hl':this.qa(p[0]).forEach(e=>e.classList.add('hl'));await sleep(p[1]??800);break;
   case'unhl':$$('.hl',this.m).forEach(e=>e.classList.remove('hl'));await sleep(p[0]??100);break;
   case'curs':this.c.classList.toggle('cross',p[0]==='cross');this.c.hidden=p[0]==='none';await sleep(100);break;
   case'add':this.m.insertAdjacentHTML('beforeend',P(p[0]));await sleep(p[1]??300);break;
   case'rm':this.qa(p[0]).forEach(e=>e.remove());await sleep(p[1]??100);break;
   case'wait':await sleep(p[0]);break;
   case'fn':await p[0](this);await sleep(p[1]??0);break;
  }
 }
}

/* ---------- read aloud ---------- */
const canSpeak=()=>{try{return 'speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined'}catch(e){return false}};
function speakText(html){
 try{const d=document.createElement('div');d.innerHTML=html;let t=d.textContent;
  t=t.replace(/⌘/g,' Command ').replace(/⇧/g,' Shift ').replace(/⌥/g,' Option ').replace(/⌃/g,' Control ').replace(/\s+\+\s+/g,' plus ').replace(/→/g,' then ').replace(/⎋/g,' escape ');
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=.92;u.pitch=1.05;speechSynthesis.speak(u)}catch(e){}
}
const READS={};
function readBtn(html){if(!canSpeak())return'';const id='r'+Math.random().toString(36).slice(2);READS[id]=html;return `<button type="button" class="read" data-read="${id}">${SVG.speak} Read to me</button>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-read]');if(b)speakText(READS[b.dataset.read]||'')});
