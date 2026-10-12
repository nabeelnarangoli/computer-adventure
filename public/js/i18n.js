/* =====================================================================
   Subtitle languages. English stays the main text; the chosen language
   appears as a smaller line under each piece of text.
   Translations live in /js/i18n/<code>.js and are keyed by the English
   text (whitespace collapsed, numbers -> {0},{1}…, learner name -> {N}).
   ===================================================================== */
const LANGS=[
 {code:'',name:'English only',native:'English only'},
 {code:'ml',name:'Malayalam',native:'മലയാളം',font:'Noto+Sans+Malayalam:wght@400;600'},
 {code:'hi',name:'Hindi',native:'हिन्दी',font:'Noto+Sans+Devanagari:wght@400;600'},
 {code:'ar',name:'Arabic',native:'العربية',font:'Noto+Sans+Arabic:wght@400;600',rtl:true}
];
window.I18N=window.I18N||{};
let SUBLANG='';

const I18N_SKIP='.aqcert,.aqtools,script,style,svg,kbd,code,pre,input,textarea,select,.mac,.sub,[contenteditable],[data-noi18n],.arena,.bins,.pool,.scrollbox,.kbwrap,.tyline,.edarea,.shwrap,.sfwrap,.chartbox,.htmlpg,.cert,.certout,.promptout,.pastebox,.pad,.focusbox';
const I18N_TINY='.langbtn,.aqnav,.tchip,.qdots,.pill,.chip,.chip2,.savestate,.stars,.brand,.userbtn,.sn,.time,.tag2,.lvl2,.dn,.ok,.nx,.qn';

/* key from English text: returns {key, nums} */
function i18nKey(txt){
 let t=String(txt).replace(/\s+/g,' ').trim();
 const nm=(window.CURRENT_NAME||'').trim();
 if(nm){const first=nm.split(' ')[0];[nm,first].forEach(n=>{if(n.length>1)t=t.split(n).join('{N}')})}
 const nums=[];t=t.replace(/\d+(?:[.,:]\d+)*/g,m=>'{'+(nums.push(m)-1)+'}');
 return {key:t,nums};
}
const hasWords=t=>/[A-Za-z]{2,}/.test(t);

/* find "text units": the nearest non-inline ancestor of each text node */
function i18nUnits(root){
 const units=new Map(),disp=new Map();
 const isBlock=el=>{if(disp.has(el))return disp.get(el);const d=getComputedStyle(el).display;const b=el.matches('.tu')||!d.startsWith('inline')||el.matches('button,a.btn,label,.qopt');disp.set(el,b);return b};
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
 while((n=w.nextNode())){
  if(!/[A-Za-z]/.test(n.nodeValue))continue;
  const p=n.parentElement;if(!p||p.closest(I18N_SKIP))continue;
  let u=p;while(u&&u!==root&&!isBlock(u))u=u.parentElement;
  if(!u||u.closest(I18N_TINY))continue;
  if(!units.has(u))units.set(u,[]);units.get(u).push(n);
 }
 /* also count kbd text inside a unit so "Press ⌘ + Z" keeps its keys */
 const out=[];
 units.forEach((nodes,u)=>{
  let t='';const w2=document.createTreeWalker(u,NodeFilter.SHOW_TEXT);let x;
  while((x=w2.nextNode())){const pe=x.parentElement;if(pe.closest('.sub,svg,script,style,input,textarea'))continue;
   let uu=pe;while(uu&&uu!==u&&!(units.has(uu)))uu=uu.parentElement;if(uu!==u)continue;t+=x.nodeValue}
  t=t.replace(/\s+/g,' ').trim();if(hasWords(t))out.push([u,t]);
 });
 return out;
}

function i18nLookup(txt){
 const d=window.I18N[SUBLANG];if(!d)return null;
 const {key,nums}=i18nKey(txt);let v=d[key];if(!v)return null;
 const first=(window.CURRENT_NAME||'').split(' ')[0];
 return v.replace(/\{(\d+)\}/g,(m,i)=>nums[+i]??m).replace(/\{N\}/g,first);
}

let i18nBusy=false;
function i18nApply(root=document.getElementById('app')){
 if(!root)return;i18nBusy=true;
 try{
  if(!SUBLANG||!window.I18N[SUBLANG]){root.querySelectorAll('.sub').forEach(s=>s.remove());return}
  const L=LANGS.find(l=>l.code===SUBLANG);
  for(const [u,t] of i18nUnits(root)){
   const old=[...u.children].find(c=>c.classList.contains('sub'));
   if(old&&u.dataset.i18t===t)continue;
   if(old)old.remove();
   u.dataset.i18t=t;
   const tr=i18nLookup(t);if(!tr)continue;
   const s=document.createElement('span');s.className='sub';s.lang=SUBLANG;if(L.rtl)s.dir='rtl';s.textContent=tr;
   u.appendChild(s);
  }
 }finally{i18nBusy=false}
}

let i18nT=0;
const i18nObs=new MutationObserver(ms=>{
 if(i18nBusy||!SUBLANG)return;
 if(!ms.some(m=>{const t=m.target.nodeType===1?m.target:m.target.parentElement;return t&&!t.closest('.mac,.sub')&&![...m.addedNodes].every(a=>a.nodeType===1&&a.classList.contains('sub'))}))return;
 clearTimeout(i18nT);i18nT=setTimeout(()=>i18nApply(),40);
});

function loadLangFont(L){
 if(!L||!L.font||document.getElementById('font-'+L.code))return;
 const l=document.createElement('link');l.id='font-'+L.code;l.rel='stylesheet';
 l.href=`https://fonts.googleapis.com/css2?family=${L.font}&display=swap`;document.head.appendChild(l);
}
function loadLang(code){
 return new Promise(res=>{
  if(!code||window.I18N[code])return res();
  const s=document.createElement('script');s.src=`/js/i18n/${code}.js?v=1`;s.onload=()=>res();s.onerror=()=>res();document.head.appendChild(s);
 });
}
async function setSubLang(code){
 SUBLANG=code||'';document.documentElement.dataset.sub=SUBLANG;
 const L=LANGS.find(l=>l.code===SUBLANG);loadLangFont(L);
 await loadLang(SUBLANG);
 const app=document.getElementById('app');
 if(app&&!i18nObs._on){i18nObs.observe(app,{childList:true,subtree:true,characterData:true});i18nObs._on=true}
 i18nApply();
}
/* translated text for speech or alerts (falls back to English) */
const tr=t=>(SUBLANG&&i18nLookup(t))||'';
