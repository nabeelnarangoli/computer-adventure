/* =====================================================================
   AQLYON AI ACADEMY — course content
   13 stages in 4 levels. Each stage: learn sections, "which tool" guide,
   prompts to copy, try-it checklist, optional practice game and a 5-question quiz.
   Text helpers: [[child wording||adult wording]] and {{Mac||Windows}} (see P() in engine.js).
   ===================================================================== */
const AI_PASS=4;          // correct answers needed out of 5
const AI_LEVELS=[
 {n:1,t:'Foundations',sub:'What AI is and how to talk to it',c:'w1'},
 {n:2,t:'Everyday AI',sub:'Writing, research, slides and data',c:'w2'},
 {n:3,t:'Creative Studio',sub:'Images, video and content',c:'w3'},
 {n:4,t:'AI Pro',sub:'Workflows and your final project',c:'w5'}
];
const AI_TOOLS={
 claude:{n:'Claude',by:'Anthropic',c:'#D97757',l:'C'},
 chatgpt:{n:'ChatGPT',by:'OpenAI',c:'#10A37F',l:'G'},
 gemini:{n:'Gemini',by:'Google',c:'#4285F4',l:'✦'},
 copilot:{n:'Microsoft Copilot',by:'Microsoft',c:'#0F6CBD',l:'Co'},
 higgsfield:{n:'Higgsfield',by:'Higgsfield AI',c:'#111111',l:'H'},
 kling:{n:'Kling',by:'Kuaishou',c:'#6C3BFF',l:'K'},
 runway:{n:'Runway',by:'Runway',c:'#2B2B2B',l:'R'}
};
const toolChip=k=>{const t=AI_TOOLS[k];return `<span class="tchip" data-noi18n><i style="background:${t.c}">${t.l}</i>${t.n}</span>`};

/* ---------- demo scenes ---------- */
const aiWin=(tool,o={})=>{const t=AI_TOOLS[tool];return `<div class="aichat ai2"><div class="aihead"><i class="tdot" style="background:${t.c}">${t.l}</i>${t.n}${o.file?`<span class="afile off" data-k="file">📎 ${o.file}</span>`:''}</div><div class="aimsgs" data-k="am">${[1,2,3,4].map(i=>`<div class="aim ${i%2?'user':'bot'} off" data-k="m${i}"></div>`).join('')}</div><div class="aiin"><span data-k="ain"></span><span class="aisend">➤</span></div></div>`};
const ask=(k,txt,speed=26)=>[['type','ain',txt,speed],['fn',async p=>{p.q(k).innerHTML=p.q('ain').innerHTML;p.q('ain').textContent=''},0],['show',k,400]];
const answer=(k,html,wait=1300)=>[['set',k,'<span class="dots"><i></i><i></i><i></i></span>',0],['show',k,700],['set',k,html,0],['wait',wait]];
const DESERT=`<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B1B5A"/><stop offset=".55" stop-color="#E9636B"/><stop offset="1" stop-color="#FFC46B"/></linearGradient></defs><rect width="320" height="200" fill="url(#dsky)"/><circle cx="235" cy="118" r="26" fill="#FFE29A"/><path d="M0 140 C60 118 120 150 180 132 S280 118 320 128 V200 H0Z" fill="#C9783E"/><path d="M0 162 C80 146 150 176 230 156 S300 150 320 158 V200 H0Z" fill="#A65A2A"/><g fill="#3A1F12" stroke="#3A1F12" stroke-linecap="round"><path stroke="none" d="M96 150C96 138 104 132 112 132C116 120 128 118 134 128C140 126 146 130 148 136L156 124C158 118 164 116 168 118L172 120L170 124L164 124L156 142C154 150 150 154 142 154L104 154C99 154 96 153 96 150Z"/><path fill="none" stroke-width="3.2" d="M104 152L102 172M112 153L113 172M138 153L136 172M146 152L148 172"/><path fill="none" stroke-width="2" d="M96 146C92 150 91 156 92 160"/></g><g fill="#fff" opacity=".8"><circle cx="40" cy="30" r="1.2"/><circle cx="90" cy="18" r="1"/><circle cx="160" cy="34" r="1.3"/><circle cx="280" cy="22" r="1"/></g></svg>`;
const imgGen=()=>`<div class="gen"><div class="genbar"><b>Image generator</b><span class="chips"><span data-k="ar1">1:1</span><span data-k="ar2">16:9</span><span data-k="ar3">9:16</span></span></div><div class="genp"><span data-k="gp"></span></div><div class="genout"><div class="frame" data-k="fr"><div class="art blur off" data-k="art">${DESERT}</div></div></div></div>`;
const vidGen=()=>`<div class="gen"><div class="genbar"><b>Video generator</b><span class="chips"><span data-k="cm">🎥 Camera: slow push-in</span><span>5 s</span></span></div><div class="genp"><span data-k="gp"></span></div><div class="genout"><div class="frame wide" data-k="fr"><div class="art off" data-k="art">${DESERT}</div><div class="vbar"><i data-k="vb"></i></div></div></div></div>`;
const slideGen=()=>`<div class="gen"><div class="genbar"><b>AI slide maker</b></div><div class="genp"><span data-k="gp"></span></div><div class="sgrid">${[['Why recycle?','♻️','3 big reasons'],['What goes in the blue bin','🧴','Paper · cans · plastic'],['Our class challenge','🏆','1 bag less a week']].map(([t,e,s],i)=>`<div class="sl off" data-k="s${i}"><b>${t}</b><i>${e}</i><small>${s}</small></div>`).join('')}</div></div>`;

/* ======================================================================
   STAGES
   ====================================================================== */
const AI_STAGES=[
/* ------------------------------ LEVEL 1 ------------------------------ */
{id:'ai1',lvl:1,t:'What is AI?',goal:'Understand what artificial intelligence is, how AI chat tools work, and what they can and can\'t do.',mins:30,
learn:[
 {h:'AI in one sentence',p:`<p><b>Artificial intelligence (AI)</b> is software that learns patterns from huge amounts of examples, so it can do jobs that normally need human thinking: understanding language, recognising pictures, making predictions, or creating new text, images and video.</p><p>[[You already use AI every day: video suggestions on YouTube, face unlock on a phone, and voice helpers like Siri all use AI.||You already use AI every day: streaming recommendations, spam filters, face unlock, maps that predict traffic and voice assistants all use AI.]]</p>`},
 {h:'From "smart" software to generative AI',p:`<div class="recap"><div><b>Traditional AI</b>Sorts and predicts: "Is this email spam?", "Which video will you like?"</div><div><b>Machine learning</b>The computer learns rules from examples instead of a person writing every rule.</div><div><b>Generative AI</b>Creates something new: text, images, music, video, code, slides.</div><div><b>Large language model (LLM)</b>The "brain" behind chat tools like Claude, ChatGPT, Gemini and Copilot.</div></div>`},
 {h:'How a chat AI actually works',p:`<p>An LLM was trained on a gigantic library of text. When you type a message, it predicts the best next word, then the next, then the next, very fast, until it has written an answer.</p><p>That is why it is great with language, but it does not "know" things the way a person does. It can sound confident and still be <b>wrong</b>. This is called a <b>hallucination</b>.</p>`,
  demo:DEMO(()=>aiWin('claude'),[['cap','You type a question…',200],...ask('m1','Why is the sky blue?'),['cap','The AI predicts the answer word by word.',200],['set','m2','',0],['show','m2',200],['type','m2','Sunlight is made of many colours. Blue light is scattered the most by the air, so blue reaches our eyes from every direction.',30],['cap','Fast and fluent. Still worth checking important facts!']],{cls:'plain',noCursor:true})},
 {h:'Strengths and limits',p:`<div class="cheat"><div><b>✓ Great at</b>Explaining, summarising, brainstorming, drafting, translating, rewriting, coding help, making images and video.</div><div><b>✗ Weak at</b>Guaranteed facts, very recent news (unless it can search), exact maths without tools, knowing your private situation.</div><div><b>⚠ Remember</b>AI has no feelings or opinions of its own and can copy biases from its training data.</div></div>`}
],
tryit:['Find three things you used today that have AI inside (phone, apps, websites).','Ask an AI tool "Explain what an LLM is in two sentences", [[with a parent||then]] check the answer against another source.','Write down one thing AI is good at and one thing it is bad at.'],
practice:{type:'drag',title:'AI or not AI?',intro:'Sort each example.',bins:[{id:'g',t:'Generative AI (creates)'},{id:'p',t:'Predictive AI (sorts or suggests)'},{id:'n',t:'Not AI'}],items:[{t:'Writing a story from a prompt',bin:'g'},{t:'Making a picture of a camel on the moon',bin:'g'},{t:'Netflix suggesting a film',bin:'p'},{t:'Email spam filter',bin:'p'},{t:'A light switch',bin:'n'},{t:'A calculator adding 2 + 2',bin:'n'}]},
quiz:[
 {q:'What does "generative AI" do?',a:['Creates new content like text, images or video','Only stores files','Makes the internet faster'],c:0,why:'Generative AI generates something new from your prompt.'},
 {q:'What is an LLM?',a:['A large language model: the "brain" of AI chat tools','A type of laptop','A video file format'],c:0,why:'Claude, ChatGPT, Gemini and Copilot all run on large language models.'},
 {q:'An AI says something confidently but it is false. This is called…',a:['A hallucination','A screenshot','A download'],c:0,why:'AI predicts likely words, so it can produce fluent but wrong answers.'},
 {q:'Which job is AI weakest at without help?',a:['Guaranteeing that a fact is true','Summarising a long text','Brainstorming ideas'],c:0,why:'Always check important facts, numbers and dates.'},
 {q:'How does a chat AI write its answer?',a:['It predicts the next word, again and again','It copies one web page','A person types it in secret'],c:0,why:'LLMs generate text one piece at a time based on patterns they learned.'}]},

{id:'ai2',lvl:1,t:'Meet your AI tools',goal:'Get to know Claude, ChatGPT, Gemini, Copilot and the video tools, and learn which tool to pick for each job.',mins:35,
learn:[
 {h:'The four big AI assistants',p:`<div class="toolgrid">
  <div>${toolChip('claude')}<p>Excellent at writing, long documents, careful reasoning and code. Can create documents, slides, spreadsheets and small apps for you. Good choice for "think it through with me" work.</p></div>
  <div>${toolChip('chatgpt')}<p>The best-known all-rounder: chat, voice conversations, image creation, file and data analysis, web search and custom assistants (GPTs).</p></div>
  <div>${toolChip('gemini')}<p>Google's assistant. Built into Gmail, Docs, Sheets, Slides and Drive. Strong at research (Deep Research), images and video (Veo).</p></div>
  <div>${toolChip('copilot')}<p>Microsoft's assistant. Works inside Word, Excel, PowerPoint, Outlook and Teams{{||, and on Windows itself}}. Great if your school or work uses Microsoft 365.</p></div></div>`},
 {h:'Creative tools for images and video',p:`<div class="toolgrid">
  <div>${toolChip('kling')}<p>Turns text or a still image into realistic video clips with smooth motion. Popular for people, animals and products in action.</p></div>
  <div>${toolChip('runway')}<p>A professional video studio: generate clips, keep characters consistent with reference images, and <b>edit real footage</b> with AI (remove objects, change style or angle).</p></div>
  <div>${toolChip('higgsfield')}<p>A creator platform that brings several top image and video models together, with ready-made cinematic camera moves, effects and templates.</p></div></div><p class="small">AI tools change fast: model names (like "Kling 3.0" or "Gen-4.5") are updated every few months. The skills you learn here stay the same.</p>`},
 {h:'Which tool for which job?',p:`<table class="ttable"><tr><th>Job</th><th>Good first choice</th></tr>
  <tr><td>Write or improve an essay, email or post</td><td>${toolChip('claude')} ${toolChip('chatgpt')}</td></tr>
  <tr><td>Research a topic with sources</td><td>${toolChip('gemini')} ${toolChip('chatgpt')} ${toolChip('claude')}</td></tr>
  <tr><td>Work inside Word, Excel, PowerPoint, Outlook</td><td>${toolChip('copilot')}</td></tr>
  <tr><td>Work inside Gmail, Docs, Sheets, Slides</td><td>${toolChip('gemini')}</td></tr>
  <tr><td>Make an image</td><td>${toolChip('chatgpt')} ${toolChip('gemini')} ${toolChip('higgsfield')}</td></tr>
  <tr><td>Make a short video</td><td>${toolChip('kling')} ${toolChip('runway')} ${toolChip('higgsfield')}</td></tr>
  <tr><td>Analyse a spreadsheet</td><td>${toolChip('chatgpt')} ${toolChip('claude')} ${toolChip('copilot')}</td></tr></table>`},
 {h:'Accounts, prices and age rules',p:`<p>Most tools have a <b>free plan</b> with limits and a <b>paid plan</b> with more use and better models. Video tools usually work with <b>credits</b>: each clip costs credits, so plan your shots before you generate.</p>[[<div class="tipbox"><b>Young learners:</b> many AI tools are only for people over 13, and some are for adults only. Always use them <b>together with a parent</b>, on a grown-up's account, and never share personal details.</div>||<p>Check each tool's age rules and your school's or company's AI policy before you sign up.</p>]]`}
],
tryit:['Open two different AI assistants and ask both the same question. Compare the answers.','Look at the free and paid plans of one tool you might use.','Make your own "which tool for which job" list for the things you do most.'],
practice:{type:'drag',title:'Pick the right tool',intro:'Drag each job to the best tool type.',bins:[{id:'c',t:'AI assistant (Claude, ChatGPT, Gemini, Copilot)'},{id:'v',t:'Video tool (Kling, Runway, Higgsfield)'},{id:'o',t:'Built-in assistant (Copilot in Excel, Gemini in Gmail)'}],items:[{t:'Draft a thank-you email',bin:'c'},{t:'Turn a product photo into a 5-second clip',bin:'v'},{t:'Summarise this inbox thread inside Gmail',bin:'o'},{t:'Explain photosynthesis simply',bin:'c'},{t:'Add a camera move to a still image',bin:'v'},{t:'Make a chart from my Excel table',bin:'o'}]},
quiz:[
 {q:'You work all day in Word, Excel and Outlook. Which assistant is built in?',a:['Microsoft Copilot','Kling','Runway'],c:0,why:'Copilot works inside the Microsoft 365 apps.'},
 {q:'Which assistant is built into Gmail, Google Docs and Sheets?',a:['Gemini','Higgsfield','Kling'],c:0,why:'Gemini is Google\'s assistant across Workspace.'},
 {q:'You want to remove an object from real video footage with AI. Which tool fits best?',a:['Runway','Copilot in Excel','A calculator'],c:0,why:'Runway includes AI video editing for existing footage.'},
 {q:'Why plan your shots before using a video tool?',a:['Each clip uses credits','Videos cannot be deleted','It makes the computer cooler'],c:0,why:'Video generation is expensive, so tools charge credits per clip.'},
 {q:'Which tool brings several image and video models together with ready-made camera moves?',a:['Higgsfield','Outlook','Notepad'],c:0,why:'Higgsfield is a creator platform built around many models and cinematic presets.'}]},

{id:'ai3',lvl:1,t:'Talking to AI: prompting',goal:'Write clear prompts with Role, Task, Context and Format, and improve answers with follow-ups.',mins:40,
learn:[
 {h:'A prompt is an instruction',p:`<p>What you type to an AI is called a <b>prompt</b>. The AI only knows what you tell it. A short, vague prompt gets a general, average answer. A clear prompt gets exactly what you need.</p>`,
  demo:DEMO(()=>aiWin('chatgpt'),[['cap','A vague prompt…',200],...ask('m1','write about camels'),...answer('m2','Camels are large mammals found in deserts. They have humps… (a long, general essay)',1200),['cap','…gets a general answer. Now a clear one:',300],...ask('m3','Act as a nature presenter. Write 4 fun facts about Arabian camels for [[9-year-olds||a family travel blog]]. Use bullet points and one emoji each.',18),...answer('m4','🐪 They can drink 100 litres in 10 minutes<br>👀 Two rows of eyelashes keep sand out<br>🔥 Their hump stores fat, not water<br>🦶 Wide feet work like snowshoes on sand',1300),['cap','Clear prompt, useful answer!']],{cls:'plain',noCursor:true})},
 {h:'The 4-part recipe: Role, Task, Context, Format',p:`<div class="cheat"><div><b>Role</b>Who should the AI be? "Act as a friendly maths tutor…"</div><div><b>Task</b>What exactly should it do? "…explain fractions…"</div><div><b>Context</b>Who is it for, what do you know, what is the goal? "…for a 10-year-old who finds them confusing…"</div><div><b>Format</b>How should it look? "…in 5 short steps with one example each."</div></div>`},
 {h:'Follow-ups make it great',p:`<p>The first answer is a first draft. Keep talking:</p><ul><li>"Make it shorter / simpler / more formal."</li><li>"Give me 3 different versions."</li><li>"Use an example from [[school||my industry]]."</li><li>"What questions should I ask you to get a better answer?"</li><li>"Explain step 2 in more detail."</li></ul>`},
 {h:'Pro tips',p:`<ul><li><b>Give examples</b> of what you like: "Write it in the style of this sample: …"</li><li><b>Set limits</b>: word count, reading level, number of ideas.</li><li><b>Ask it to ask you</b>: "Ask me 3 questions before you start."</li><li><b>One big job? Split it</b> into steps: outline first, then each section.</li></ul>`}
],
prompts:[{l:'Explain anything',t:'Act as a patient teacher. Explain [topic] to [who] who already knows [what they know]. Use 5 short bullet points and one real-life example.'},{l:'Get better questions',t:'I want to [goal]. Before you answer, ask me 3 questions that will help you give me the best result.'}],
tryit:['Use the prompt builder below to write a 4-part prompt.','Try it in an AI tool[[ with a parent]], then ask two follow-up questions.','Compare the first answer with the final one. What improved?'],
practice:{type:'prompt'},
quiz:[
 {q:'Which prompt will give the most useful answer?',a:['"Act as a tutor. Explain fractions to a 10-year-old in 5 short steps with examples."','"fractions"','"help"'],c:0,why:'It includes role, task, context and format.'},
 {q:'In the 4-part recipe, "for a 10-year-old who finds it confusing" is the…',a:['Context','Format','Role'],c:0,why:'Context tells the AI who it is for and the situation.'},
 {q:'"Give me the answer as a table with 3 columns" is the…',a:['Format','Role','Task'],c:0,why:'Format describes how the answer should look.'},
 {q:'The first answer is too long. Best next step?',a:['Ask a follow-up: "Make it 3 bullet points"','Close the tool forever','Copy it anyway'],c:0,why:'Follow-ups are the fastest way to improve an answer.'},
 {q:'You have a big task. What is the smart approach?',a:['Split it into steps: outline first, then each part','Put everything in one word','Ask for it all in one emoji'],c:0,why:'Breaking work into steps gives better, more controllable results.'}]},

{id:'ai4',lvl:1,t:'Safe, smart and honest AI',goal:'Check facts, protect privacy, spot deepfakes and bias, and use AI honestly at school or work.',mins:30,
learn:[
 {h:'Check before you trust',p:`<p>Treat AI answers like advice from a clever friend who sometimes makes things up. <b>Always check</b> numbers, dates, quotes, health, money, legal and news facts in a trusted source. Ask the AI: "What are your sources?" and then open them yourself.</p>`},
 {h:'Protect privacy',p:`<p>Never paste these into an AI tool:</p><div class="cheat"><div><b>🔒 Passwords and codes</b>PINs, one-time codes, login details.</div><div><b>🪪 ID numbers</b>Passport, Emirates ID, bank or card numbers.</div><div><b>🏠 Personal details</b>Home address, phone numbers, private family information.</div><div><b>💼 Confidential work</b>[[Other people\'s secrets or photos without asking.||Client data, contracts or company secrets, unless your company\'s approved AI tool allows it.]]</div></div>`},
 {h:'Bias and deepfakes',p:`<p>AI learns from human data, so it can repeat <b>stereotypes</b>. If an answer feels unfair, challenge it.</p><p><b>Deepfakes</b> are fake photos, videos or voices made with AI. Be suspicious of shocking clips, check who posted them, and look for odd hands, eyes, text or lighting. Never make fake content of real people without their permission.</p>`},
 {h:'Be honest about AI',p:`<ul><li>Follow your [[school\'s||school\'s or company\'s]] rules about AI.</li><li>Use AI to <b>learn and improve</b> your work, not to hand in work that isn't yours.</li><li>Say when you used AI, especially for images, video and published content.</li><li>Respect copyright: don't ask for copies of other people's songs, books, characters or logos.</li></ul>`}
],
tryit:['Ask an AI a question with a number in the answer. Check the number on a trusted website.','Make your [[family\'s||personal]] AI rules: what you will and won\'t share.','Find out your [[school\'s||school\'s or workplace\'s]] AI policy.'],
practice:{type:'drag',title:'Safe to share with AI?',intro:'Sort each item.',bins:[{id:'y',t:'OK to share'},{id:'n',t:'Never share'}],items:[{t:'A paragraph you wrote and want feedback on',bin:'y'},{t:'Your password',bin:'n'},{t:'A public article to summarise',bin:'y'},{t:'Your passport or ID number',bin:'n'},{t:'Your home address',bin:'n'},{t:'A list of party ideas',bin:'y'}]},
quiz:[
 {q:'The AI gives you a statistic for your report. What should you do?',a:['Check it in a trusted source','Copy it without checking','Make it bigger'],c:0,why:'AI can hallucinate numbers, so verify them.'},
 {q:'Which is safe to paste into an AI tool?',a:['A public article you want summarised','Your bank card number','Your password'],c:0,why:'Public text is fine. Never share secrets or ID numbers.'},
 {q:'A shocking video of a famous person appears online. It might be…',a:['A deepfake, so check the source','Always real','A virus'],c:0,why:'AI can fake faces and voices. Check who posted it and look for clues.'},
 {q:'Your [[teacher||manager]] says no AI for this task. What do you do?',a:['Follow the rule','Use it secretly','Ask a friend to use it for you'],c:0,why:'Honesty matters more than any shortcut.'},
 {q:'Why can AI answers be unfair sometimes?',a:['It learned from human data that contains bias','It is angry','The screen is too small'],c:0,why:'Training data reflects human stereotypes, so challenge unfair answers.'}]},

/* ------------------------------ LEVEL 2 ------------------------------ */
{id:'ai5',lvl:2,t:'Writing and content with AI',goal:'Use AI to brainstorm, draft, rewrite and polish emails, posts, stories and articles in your own voice.',mins:45,
learn:[
 {h:'The writing workflow',p:`<div class="flow"><span>1. Brainstorm</span><span>2. Outline</span><span>3. Draft</span><span>4. Edit in your voice</span><span>5. Check</span></div><p>AI is a writing partner, not a replacement. You decide the message, the facts and the final words.</p>`},
 {h:'Best tools for writing',p:`<table class="ttable"><tr><th>Need</th><th>Tool</th></tr><tr><td>Long, natural, well-structured writing; editing a whole document</td><td>${toolChip('claude')}</td></tr><tr><td>Quick drafts, many variations, social captions</td><td>${toolChip('chatgpt')}</td></tr><tr><td>Writing inside Gmail or Google Docs</td><td>${toolChip('gemini')}</td></tr><tr><td>Writing inside Word or Outlook</td><td>${toolChip('copilot')}</td></tr></table>`},
 {h:'Keep your own voice',p:`<p>Give the AI a sample of your writing and say: "Match this tone: friendly, short sentences, no fancy words." For [[a club or school project||a brand]], write a small <b>voice guide</b>: 3 words that describe the tone, words to use, words to avoid.</p>`,
  demo:DEMO(()=>aiWin('claude'),[...ask('m1','Rewrite this to sound friendly and short: "We regret to inform you that the event has been postponed."',20),...answer('m2','Quick update: we\'ve moved the event to a new date. 🙌 Details coming soon. Thanks for your patience!',1100),...ask('m3','Give me 2 more versions, one formal.',30),...answer('m4','1) Heads up: new date coming soon!<br>2) Please note the event has been rescheduled. We will share the new date shortly.',1200),['cap','Pick one, then edit it in your own words.']],{cls:'plain',noCursor:true})},
 {h:'Content ideas that work',p:`<div class="recap"><div><b>Emails</b>"Draft a polite email asking for…"</div><div><b>Social posts</b>"5 Instagram captions for…, under 20 words, with hashtags."</div><div><b>Blog / article</b>"Outline first, then write section 1."</div><div><b>Stories</b>"Help me brainstorm a twist for my story about…"</div><div><b>Proofreading</b>"Fix spelling and grammar only. Don't change my style."</div></div>`}
],
prompts:[{l:'Social captions',t:'Write 5 Instagram captions for [topic/product]. Audience: [who]. Tone: [3 words]. Under 25 words each, 3 relevant hashtags, one call to action.'},{l:'Polish without changing voice',t:'Fix the spelling, grammar and clarity of this text. Keep my words and style. List what you changed at the end:\n\n[paste text]'}],
tryit:['Ask AI for 10 ideas for a post or story, then choose your favourite.','Get an outline, write one section yourself, and ask AI for feedback.','Rewrite the same message for 3 audiences (friend, teacher or boss, customer).'],
quiz:[
 {q:'What is the best first step when writing a long article with AI?',a:['Ask for an outline','Ask for the final article in one go with no details','Skip planning'],c:0,why:'An outline lets you control the structure before the writing.'},
 {q:'How do you keep your own voice?',a:['Give the AI a sample and describe your tone','Use every word the AI suggests','Write in capitals'],c:0,why:'Examples and a short voice guide steer the style.'},
 {q:'You only want mistakes fixed, not a rewrite. Prompt?',a:['"Fix spelling and grammar only. Keep my style."','"Make it amazing"','"Rewrite everything"'],c:0,why:'Clear limits stop the AI from changing your words.'},
 {q:'You write emails all day in Outlook. Which assistant is right there?',a:['Copilot','Kling','Higgsfield'],c:0,why:'Copilot is built into Outlook and Word.'},
 {q:'Who is responsible for the facts in an AI-assisted post?',a:['You','The AI','Nobody'],c:0,why:'You publish it, so you check it.'}]},

{id:'ai6',lvl:2,t:'Research and learning',goal:'Use AI to research topics with sources, summarise documents and build study plans.',mins:40,
learn:[
 {h:'Search vs. chat vs. deep research',p:`<div class="cheat"><div><b>Quick question</b>A normal chat answer. Fast, but check it.</div><div><b>Web search mode</b>The AI searches the web and shows <b>links</b>. Open them to confirm.</div><div><b>Deep research</b>The AI reads many sources for several minutes and writes a full report with citations. Available in ${toolChip('gemini')} ${toolChip('chatgpt')} ${toolChip('claude')}.</div></div>`},
 {h:'Summarise long documents',p:`<p>Upload a PDF or paste an article and ask: "Summarise this in 5 bullet points, then list 3 questions it doesn't answer." Claude and Gemini handle very long documents well. Google's <b>NotebookLM</b> (part of the Gemini family) answers questions using only the files you give it, and can even make a podcast-style audio summary.</p>`},
 {h:'Learn faster with AI as a tutor',p:`<ul><li>"Quiz me on this chapter, one question at a time, and explain my mistakes."</li><li>"Explain it like I'm [[10||new to the subject]], then like an expert."</li><li>"Make me a 2-week study plan, 30 minutes a day."</li><li>"Give me a memory trick for these 6 words."</li></ul><p><b>Rule:</b> AI should help you <i>think</i>, not think for you.</p>`},
 {h:'Read the sources',p:`<p>When an AI gives citations, open at least two. Check that the source really says what the AI claims, that it is trustworthy (government, university, well-known news or [[encyclopedia for kids||official organisation]]), and that it is recent.</p>`}
],
prompts:[{l:'Research with sources',t:'Research [topic]. Give me a short summary, 5 key facts with a source link for each, and one thing experts disagree about.'},{l:'Study tutor',t:'You are my tutor for [subject]. Quiz me with one question at a time about [topic]. Wait for my answer, then tell me if I\'m right and why.'}],
tryit:['Ask a research question with web search on. Open two of the sources.','Upload or paste a long article and get a 5-point summary.','Ask the AI to quiz you on something you are learning.'],
quiz:[
 {q:'What does "deep research" mode do?',a:['Reads many sources and writes a report with citations','Deletes old files','Makes images'],c:0,why:'It searches and reads widely before answering.'},
 {q:'Which tool answers questions using only the files you give it?',a:['NotebookLM','Kling','Runway'],c:0,why:'NotebookLM is grounded in your own sources.'},
 {q:'The AI gives you a source link. What do you do?',a:['Open it and check it says the same thing','Trust it without opening','Delete it'],c:0,why:'AI can misquote or invent sources.'},
 {q:'Best way to use AI for studying?',a:['Ask it to quiz you and explain mistakes','Copy its answers into homework','Never read the topic'],c:0,why:'Active practice helps you learn.'},
 {q:'Which source is usually most trustworthy?',a:['An official or university website','A random comment','An anonymous post with no date'],c:0,why:'Check who wrote it, why and when.'}]},

{id:'ai7',lvl:2,t:'Presentations with AI',goal:'Go from idea to a clear, good-looking slide deck with AI, then make it your own.',mins:40,
learn:[
 {h:'Start with the story, not the slides',p:`<p>Ask AI for a <b>slide-by-slide outline</b> first: title, one main point per slide, and speaker notes. Fix the story, then build the slides.</p>`,
  demo:DEMO(slideGen,[['cap','Describe the talk…',200],['type','gp','3 slides for a [[class||team]] talk about recycling, simple words, one emoji each',28],['cap','The AI builds an outline and slides.',300],['show','s0',500],['show','s1',500],['show','s2',800],['cap','Now edit the words, pictures and colours yourself.']],{cls:'plain',noCursor:true})},
 {h:'Tools for slides',p:`<table class="ttable"><tr><th>Where you work</th><th>Use</th></tr><tr><td>PowerPoint</td><td>${toolChip('copilot')}: "Create a presentation about…" or "from this Word document"</td></tr><tr><td>Google Slides</td><td>${toolChip('gemini')}: generate slides and images in the side panel</td></tr><tr><td>Any</td><td>${toolChip('claude')} ${toolChip('chatgpt')}: write the outline and notes, or create a ready-made deck file you can download</td></tr><tr><td>Pictures for slides</td><td>${toolChip('chatgpt')} ${toolChip('gemini')} (see the Images stage)</td></tr></table>`},
 {h:'Make AI slides look professional',p:`<ul><li><b>One idea per slide</b>, a short title and 3 points maximum.</li><li>Big, simple pictures instead of paragraphs.</li><li>Same fonts and colours on every slide ([[your club||your brand]] colours).</li><li>Put the details in the <b>speaker notes</b>, not on the slide.</li><li>Check every fact and number the AI added.</li></ul>`},
 {h:'Practise with AI',p:`<p>Paste your speaker notes and ask: "Act as my audience. Ask me 3 hard questions about this talk." Or: "Time my notes: how long will this take to say?"</p>`}
],
prompts:[{l:'Deck outline',t:'Create a [number]-slide outline for a presentation about [topic] for [audience]. For each slide: a title under 6 words, 3 short bullet points and speaker notes. Goal of the talk: [goal].'}],
tryit:['Get an outline for a 6-slide talk on a topic you like.','Build the slides with Copilot, Gemini or by hand from the outline.','Ask AI to play your audience and ask you 3 questions.'],
quiz:[
 {q:'What should you ask AI for first?',a:['A slide-by-slide outline','Fifty slides at once','Random pictures'],c:0,why:'Fix the story before building slides.'},
 {q:'You build decks in PowerPoint. Which assistant is built in?',a:['Copilot','Gemini in Gmail','Kling'],c:0,why:'Copilot works inside PowerPoint.'},
 {q:'Where should long details go?',a:['Speaker notes','In tiny text on the slide','Nowhere'],c:0,why:'Slides stay clean, notes help you speak.'},
 {q:'How many main ideas per slide?',a:['One','Ten','As many as fit'],c:0,why:'One idea per slide keeps the audience focused.'},
 {q:'A good way to rehearse with AI?',a:['Ask it to act as your audience and ask hard questions','Ask it to give the talk for you','Skip practice'],c:0,why:'Practice questions prepare you for the real thing.'}]},

{id:'ai8',lvl:2,t:'Data and analytics with AI',goal:'Ask questions of spreadsheets, find trends, make charts and check the numbers.',mins:45,
learn:[
 {h:'Talk to your data',p:`<p>Upload a spreadsheet (CSV or Excel) and ask in plain words: "Which month had the highest sales?", "Show a chart of sales by region", "What is unusual in this data?". The AI writes and runs the calculations for you.</p>`,
  demo:DEMO(()=>aiWin('chatgpt',{file:'sales.xlsx'}),[['show','file',500],...ask('m1','Which region sold the most? Make a bar chart.'),...answer('m2','<b>North</b> sold the most (2,340 units).<div class="mini-chart"><i style="height:90%"><b>N</b></i><i style="height:62%"><b>S</b></i><i style="height:48%"><b>E</b></i><i style="height:35%"><b>W</b></i></div>',1400),...ask('m3','Show me the calculation you used.'),...answer('m4','I added the "Units" column for each region: North = 820 + 760 + 760 = 2,340.',1100),['cap','Ask how it calculated, so you can check it.']],{cls:'plain',noCursor:true})},
 {h:'Tools for data',p:`<table class="ttable"><tr><th>Where your data is</th><th>Use</th></tr><tr><td>Excel</td><td>${toolChip('copilot')}: formulas, charts, PivotTables, "highlight the top 10"</td></tr><tr><td>Google Sheets</td><td>${toolChip('gemini')}: formulas, tables and summaries</td></tr><tr><td>Any file you upload</td><td>${toolChip('chatgpt')} ${toolChip('claude')}: analysis, charts, cleaned-up files and reports</td></tr></table>`},
 {h:'Questions that give insight',p:`<div class="recap"><div><b>Describe</b>"Summarise this data in 5 bullet points."</div><div><b>Compare</b>"Compare this year with last year."</div><div><b>Explain</b>"Why might sales have dropped in June?"</div><div><b>Predict</b>"If the trend continues, what happens next month?"</div><div><b>Clean</b>"Find duplicates and empty cells."</div></div>`},
 {h:'Check the numbers',p:`<ul><li>Ask: "Show me the formula or calculation."</li><li>Spot-check 2 or 3 numbers yourself.</li><li>Make sure it used the right columns and dates.</li><li>[[Never upload other people\'s private information.||Remove names, emails and personal data before uploading, unless your approved company tool allows it.]]</li></ul>`}
],
prompts:[{l:'Analyse a spreadsheet',t:'I\'ve uploaded [file]. Each row is [what one row means]. 1) Summarise the data. 2) Find the top 3 trends. 3) Make one clear chart. 4) Show the calculations you used.'},{l:'Excel formula helper',t:'In Excel, column A has [..] and column B has [..]. Write a formula that [goal], and explain how it works.'}],
tryit:['Make a small table (for example your weekly spending or screen time) and ask AI 3 questions about it.','Ask for a chart and the calculation behind it.','Check two of the numbers yourself.'],
practice:{type:'drag',title:'Good data question?',intro:'Sort each prompt.',bins:[{id:'g',t:'Clear data question'},{id:'b',t:'Too vague'}],items:[{t:'Which product had the most returns in March?',bin:'g'},{t:'data?',bin:'b'},{t:'Compare average sales per store for 2025 and 2026',bin:'g'},{t:'tell me stuff',bin:'b'},{t:'Make a line chart of visitors per week',bin:'g'},{t:'numbers',bin:'b'}]},
quiz:[
 {q:'Your data is in Excel. Which assistant is built in?',a:['Copilot','Runway','Kling'],c:0,why:'Copilot in Excel can write formulas and make charts.'},
 {q:'How do you check an AI\'s data answer?',a:['Ask for the calculation and spot-check numbers','Trust it fully','Change the font'],c:0,why:'Seeing the working lets you catch mistakes.'},
 {q:'Which is the clearest data question?',a:['"Compare average sales per store in 2025 and 2026"','"numbers?"','"do data"'],c:0,why:'It names the measure, the groups and the time.'},
 {q:'What should you remove before uploading data to a public AI tool?',a:['Personal information like names and emails','The column titles','All the numbers'],c:0,why:'Protect people\'s privacy.'},
 {q:'"Why might sales have dropped in June?" is an example of asking AI to…',a:['Explain','Delete','Print'],c:0,why:'Explaining questions help you find reasons behind the numbers.'}]},

/* ------------------------------ LEVEL 3 ------------------------------ */
{id:'ai9',lvl:3,t:'Create images with AI',goal:'Write image prompts like a designer, edit images with words and keep a consistent style.',mins:50,
learn:[
 {h:'The image prompt formula',p:`<div class="cheat"><div><b>Subject</b>What is in it? "a camel walking"</div><div><b>Setting</b>Where and when? "desert dunes at sunset"</div><div><b>Style</b>"flat illustration", "photo", "3D cartoon", "watercolour"</div><div><b>Composition</b>"wide shot", "close-up", "from below", "centred"</div><div><b>Light and colour</b>"golden light", "pastel colours", "high contrast"</div><div><b>Format</b>Aspect ratio: 1:1 post, 9:16 story or reel, 16:9 slide or YouTube</div></div>`,
  demo:DEMO(imgGen,[['cap','Write the prompt…',200],['type','gp','A camel walking over desert dunes at sunset, flat illustration, warm colours, wide shot',24],['cls','ar2','pick',true,300],['cls','fr','w169',true,400],['cap','Generating…',300],['show','art',300],['cls','art','blur',false,1300],['cap','Not quite right? Edit with words: "add stars to the sky".']],{cls:'plain',noCursor:true})},
 {h:'Which image tool?',p:`<table class="ttable"><tr><th>Need</th><th>Tool</th></tr><tr><td>Easy images from a chat, then change them by talking ("make the sky pink")</td><td>${toolChip('chatgpt')} ${toolChip('gemini')}</td></tr><tr><td>Edit your own photo with words, keep the same person or product across pictures</td><td>${toolChip('gemini')} ${toolChip('chatgpt')}</td></tr><tr><td>Stylish, realistic fashion and portrait looks, many models in one place</td><td>${toolChip('higgsfield')}</td></tr><tr><td>Images inside Microsoft apps</td><td>${toolChip('copilot')}</td></tr><tr><td>Write and improve your image prompts</td><td>${toolChip('claude')}</td></tr></table>`},
 {h:'Edit, don\'t restart',p:`<p>Change one thing at a time: "Same image, but make it night", "Remove the text", "Move the camel to the left". To keep a <b>consistent character or product</b>, upload a reference picture and say "keep this exact character".</p><p>Tip: AI is getting better at text in images, but always check spelling of words, logos and prices.</p>`},
 {h:'Use images responsibly',p:`<ul><li>Don't copy famous characters, logos or artists' exact styles.</li><li>Never create fake pictures of real people [[||without permission, or anything misleading]].</li><li>Label AI images when you share them where it matters.</li>${'[[<li>Kids: create images with a parent.</li>||<li>Check the tool\'s licence before using images commercially.</li>]]'}</ul>`}
],
prompts:[{l:'Social post image',t:'Create a [style] image of [subject] in [setting]. [Lighting/colours]. [Composition]. Aspect ratio [1:1 / 9:16 / 16:9]. Leave empty space at the top for a headline. No text in the image.'},{l:'Prompt improver',t:'Improve this image prompt with more detail about style, composition, lighting and colour. Give me 3 versions: [your prompt]'}],
tryit:['Write a 6-part image prompt and generate an image[[ with a parent]].','Make 3 edits with words without starting again.','Make the same image in 1:1 and 9:16.'],
practice:{type:'drag',title:'Name that prompt part',intro:'Match each phrase to its part of the image formula.',bins:[{id:'s',t:'Subject'},{id:'st',t:'Style'},{id:'c',t:'Composition'},{id:'f',t:'Format'}],items:[{t:'a red sports car',bin:'s'},{t:'watercolour painting',bin:'st'},{t:'close-up from below',bin:'c'},{t:'9:16 vertical',bin:'f'},{t:'a smiling robot chef',bin:'s'},{t:'3D cartoon',bin:'st'}]},
quiz:[
 {q:'Which aspect ratio fits an Instagram story or reel?',a:['9:16','16:9','1:1'],c:0,why:'9:16 is tall and fills a phone screen.'},
 {q:'"Wide shot, from below" describes the…',a:['Composition','Subject','File size'],c:0,why:'Composition is how the picture is framed.'},
 {q:'The image is nearly perfect, but the sky should be pink. Best move?',a:['Edit with words: "same image, make the sky pink"','Start a totally new prompt','Give up'],c:0,why:'Editing keeps what you liked.'},
 {q:'How do you keep the same character in several images?',a:['Upload a reference image and ask to keep it','Change the prompt every time','Use a smaller font'],c:0,why:'Reference images help tools keep consistency.'},
 {q:'Which is responsible use of AI images?',a:['Label AI images and avoid fake pictures of real people','Copy a famous logo','Make fake photos of a classmate'],c:0,why:'Be honest and respect people and creators.'}]},

{id:'ai10',lvl:3,t:'Create video with Kling, Runway and Higgsfield',goal:'Plan, prompt and generate short AI video clips with camera moves, and edit them into a finished video.',mins:60,
learn:[
 {h:'Two ways to make AI video',p:`<div class="cheat"><div><b>Text to video</b>Describe the scene and the AI creates the clip.</div><div><b>Image to video</b>Start from your own picture (often made in the Images stage) and bring it to life. This gives you <b>much more control</b> and is how most pros work.</div></div>`},
 {h:'The video prompt formula',p:`<div class="cheat"><div><b>Subject + action</b>"A camel slowly walks forward"</div><div><b>Scene</b>"over desert dunes at sunset"</div><div><b>Camera</b>"slow push-in", "drone shot", "orbit", "handheld"</div><div><b>Style and mood</b>"cinematic, warm, peaceful"</div><div><b>Length and format</b>5 or 10 seconds, 9:16 or 16:9</div></div><p>Keep each clip to <b>one simple action</b>. Long, complicated actions are where AI video goes wrong.</p>`,
  demo:DEMO(vidGen,[['cap','Start from your image, add motion…',200],['type','gp','The camel slowly walks forward, sand blowing, slow push-in camera, cinematic',24],['cap','Generating a 5-second clip…',300],['show','art',200],['cls','art','push',true,200],['cls','vb','go',true,4200],['cap','One clear action plus one camera move = a great clip.']],{cls:'plain',noCursor:true})},
 {h:'Which video tool?',p:`<table class="ttable"><tr><th>Tool</th><th>Best for</th></tr><tr><td>${toolChip('kling')}</td><td>Realistic motion of people, animals and products; image-to-video; start and end frames; lip sync.</td></tr><tr><td>${toolChip('runway')}</td><td>Professional control: reference images for consistent characters, editing real footage with AI (remove or replace objects, change style or camera angle), animating characters from your own acting.</td></tr><tr><td>${toolChip('higgsfield')}</td><td>Fast social content: one place to try many video models (including Kling and Google Veo), ready-made cinematic camera moves, effects and templates.</td></tr><tr><td>${toolChip('gemini')} ${toolChip('chatgpt')}</td><td>Write your script, storyboard and shot prompts. Gemini can also create video with Google's Veo model.</td></tr></table>`},
 {h:'The pro workflow',p:`<div class="flow"><span>1. Script (Claude / ChatGPT)</span><span>2. Shot list</span><span>3. Key images (image tool)</span><span>4. Animate (Kling / Runway / Higgsfield)</span><span>5. Edit, music, captions</span></div><p>Generate 2–3 versions of each shot, keep the best, and join them in a video editor (CapCut, Premiere, Clipchamp, iMovie). Add voice-over, music and captions there.</p>[[<div class="tipbox"><b>Young learners:</b> video tools are made for adults and use paid credits. Make videos together with a parent.</div>||<p class="small">Credits: video is the most expensive kind of AI generation. Test ideas with short, low-resolution clips first.</p>]]`}
],
prompts:[{l:'Shot list from an idea',t:'I\'m making a [length]-second [platform] video about [topic] for [audience]. Write a shot list of [number] shots. For each shot: what we see, one simple action, camera move, and a ready-to-use AI video prompt.'},{l:'Video prompt',t:'[Subject] [one simple action], [setting], [camera move], [style and mood], [lighting]. 5 seconds, [9:16 or 16:9].'}],
tryit:['Write a 4-shot list for a 20-second video with an AI assistant.','Turn one of your AI images into a 5-second clip[[ with a parent]].','Try the same prompt with two different camera moves and compare.'],
quiz:[
 {q:'Why do pros often use image-to-video instead of text-to-video?',a:['It gives much more control over the look','It is always free','It needs no prompt'],c:0,why:'Starting from a chosen image fixes the style and subject.'},
 {q:'"Slow push-in", "orbit" and "drone shot" are…',a:['Camera moves','File types','Fonts'],c:0,why:'Camera moves add cinematic motion.'},
 {q:'What makes an AI video clip most likely to look good?',a:['One simple action per clip','Ten actions in one clip','No description at all'],c:0,why:'Complex actions cause glitches.'},
 {q:'You want to remove a sign from real footage you filmed. Which tool?',a:['Runway','Copilot in Excel','NotebookLM'],c:0,why:'Runway can edit existing video with AI.'},
 {q:'Where do you add music, voice-over and captions?',a:['In a video editor after generating the clips','Inside the image prompt','In a spreadsheet'],c:0,why:'Clips are joined and finished in an editor.'}]},

{id:'ai11',lvl:3,t:'Build a content campaign',goal:'Combine writing, images and video tools into one campaign for social media.',mins:60,
learn:[
 {h:'One idea, many pieces',p:`<p>A <b>campaign</b> is a set of content around one message, for example [[a school bake sale||a product launch or an event]]. With AI you can create a full set in an afternoon.</p><div class="recap"><div><b>Message</b>One sentence: what should people feel and do?</div><div><b>Audience</b>Who are they and where do they scroll?</div><div><b>Pieces</b>Poster, 3 posts, 1 short video, captions, email</div><div><b>Plan</b>What goes out on which day</div></div>`},
 {h:'Which tool for each piece',p:`<table class="ttable"><tr><th>Piece</th><th>Tool</th></tr><tr><td>Strategy, message, calendar, captions, email</td><td>${toolChip('claude')} ${toolChip('chatgpt')}</td></tr><tr><td>Key visuals and posters</td><td>${toolChip('chatgpt')} ${toolChip('gemini')} ${toolChip('higgsfield')}</td></tr><tr><td>Reels and short videos</td><td>${toolChip('kling')} ${toolChip('higgsfield')} ${toolChip('runway')}</td></tr><tr><td>Results report</td><td>${toolChip('chatgpt')} ${toolChip('claude')} ${toolChip('copilot')}</td></tr></table>`},
 {h:'Make it look like one brand',p:`<p>Write a <b>mini brand kit</b> and paste it into every prompt: colours, fonts, tone of voice, logo rules, words to use and avoid. Save it in a Claude <b>Project</b>, a ChatGPT <b>custom GPT</b> or a Gemini <b>Gem</b> so you don't repeat it every time.</p>`},
 {h:'Repurpose and measure',p:`<p>Turn one long piece into many: a blog post → 5 captions → 1 carousel → a 15-second video script. After posting, give AI your numbers (views, likes, clicks) and ask: "What worked best and what should we try next week?"</p>`}
],
prompts:[{l:'Campaign plan',t:'Act as a social media strategist. Create a 1-week content plan for [event/product] aimed at [audience] on [platforms]. Include: key message, 5 post ideas with captions, 1 short video concept with a shot list, and the best day to post each.'},{l:'Brand kit',t:'Create a one-page brand kit for [name]: 3 tone-of-voice words, colour palette with hex codes, font suggestions, words to use, words to avoid, and 3 example captions.'}],
tryit:['Choose a real [[school, club or family||work or personal]] event and write its one-sentence message.','Use AI to make a 1-week plan, a poster image and 3 captions.','Make one 10-second video clip for it.','Put everything in one folder and share it with someone for feedback.'],
quiz:[
 {q:'What is a content campaign?',a:['A set of content around one message','One random post','A spreadsheet formula'],c:0,why:'All pieces support the same message.'},
 {q:'How do you keep every AI piece "on brand"?',a:['Use a brand kit in every prompt or in a Project / GPT / Gem','Use different colours each time','Never mention the brand'],c:0,why:'Saved instructions keep style consistent.'},
 {q:'Turning one blog post into captions, a carousel and a video script is called…',a:['Repurposing','Deleting','Formatting a disk'],c:0,why:'Repurposing gets more value from one idea.'},
 {q:'Which tool is best for planning the campaign and writing captions?',a:['Claude or ChatGPT','A calculator','Runway only'],c:0,why:'AI assistants are best at strategy and writing.'},
 {q:'After posting, how can AI help?',a:['Analyse the results and suggest what to try next','Delete the posts','Buy followers'],c:0,why:'Use data to improve the next campaign.'}]},

/* ------------------------------ LEVEL 4 ------------------------------ */
{id:'ai12',lvl:4,t:'Advanced prompting and AI workflows',goal:'Save your instructions, chain prompts, use examples and structured outputs, and understand AI agents.',mins:50,
learn:[
 {h:'Save your setup',p:`<div class="cheat"><div><b>Claude Projects</b>Upload files and instructions once; every chat in the project uses them.</div><div><b>Custom GPTs</b>Build your own ChatGPT helper with its own instructions and files.</div><div><b>Gemini Gems</b>Personal expert assistants inside Gemini.</div><div><b>Custom instructions / memory</b>Tell the tool once how you like answers.</div></div>`},
 {h:'Pro prompt techniques',p:`<div class="recap"><div><b>Few-shot examples</b>Show 2–3 examples of the result you want. The AI copies the pattern.</div><div><b>Prompt chaining</b>Step 1 research → step 2 outline → step 3 draft → step 4 critique.</div><div><b>Structured output</b>"Answer as a table" or "as JSON with these fields".</div><div><b>Self-check</b>"Review your answer for errors and weak points, then improve it."</div><div><b>Constraints</b>Word limits, reading level, must-include and must-avoid lists.</div></div>`},
 {h:'Let AI build things for you',p:`<p>Modern assistants can create real files: documents, spreadsheets with formulas, slide decks, charts, simple web pages and apps. Describe what you need, test it, then ask for changes. ${toolChip('claude')} is especially strong at building small tools and documents; ${toolChip('chatgpt')} and ${toolChip('copilot')} can also produce files.</p>`},
 {h:'AI agents and automation',p:`<p>An <b>AI agent</b> can do several steps on its own: search the web, read files, fill in a form, write a report. Agents save hours on repetitive work, but you stay in charge:</p><ul><li>Give clear goals and limits.</li><li>Check the work before anything is sent, paid or published.</li><li>Only connect the accounts and files it really needs.</li></ul>`}
],
prompts:[{l:'Few-shot example',t:'Write product descriptions in this exact style.\nExample 1: [example]\nExample 2: [example]\nNow write one for: [new product]'},{l:'Self-critique',t:'Here is my draft: [paste]. Act as a strict editor. List the 5 biggest weaknesses, then rewrite it fixing them.'}],
tryit:['Create a Project, GPT or Gem with your brand kit or study notes.','Run a 3-step prompt chain: outline → draft → critique and improve.','Ask an AI to build a small tool (a quiz, a budget sheet or a checklist).'],
quiz:[
 {q:'Showing the AI 2–3 examples of what you want is called…',a:['Few-shot prompting','Screen sharing','Formatting'],c:0,why:'Examples teach the pattern you want.'},
 {q:'Where can you save instructions and files so every chat uses them?',a:['A Claude Project, custom GPT or Gemini Gem','The recycle bin','A screenshot'],c:0,why:'Saved setups stop you repeating context.'},
 {q:'Research → outline → draft → critique is an example of…',a:['Prompt chaining','A virus','Lip sync'],c:0,why:'Chaining splits a big job into steps.'},
 {q:'What must you do when an AI agent works for you?',a:['Set limits and check before anything is sent or paid','Give it every password','Never look at the results'],c:0,why:'You stay responsible for what the agent does.'},
 {q:'"Review your answer for errors, then improve it" is a…',a:['Self-check prompt','Image prompt','Camera move'],c:0,why:'Asking the AI to critique itself improves quality.'}]},

{id:'ai13',lvl:4,t:'Final project and certificate',goal:'Plan and create a complete AI project using the right tools at every step, then pass the final assessment.',mins:90,final:true,
learn:[
 {h:'Choose your project',p:`<div class="recap"><div><b>Launch campaign</b>[[A school event or bake sale||A product, service or event launch]]: plan, poster, 3 posts, 1 video.</div><div><b>Explainer</b>A topic you love: research report, 6-slide deck and a 20-second video.</div><div><b>Data story</b>Analyse a real spreadsheet, make charts and present what you found.</div><div><b>Mini business</b>Name, brand kit, logo idea, price list, pitch deck and promo clip.</div></div>`},
 {h:'Your AI tool map',p:`<table class="ttable"><tr><th>Step</th><th>Tool</th></tr><tr><td>1. Research and plan</td><td>${toolChip('gemini')} ${toolChip('claude')}</td></tr><tr><td>2. Write the content</td><td>${toolChip('claude')} ${toolChip('chatgpt')}</td></tr><tr><td>3. Images</td><td>${toolChip('chatgpt')} ${toolChip('gemini')} ${toolChip('higgsfield')}</td></tr><tr><td>4. Video</td><td>${toolChip('kling')} ${toolChip('runway')} ${toolChip('higgsfield')}</td></tr><tr><td>5. Slides</td><td>${toolChip('copilot')} ${toolChip('gemini')}</td></tr><tr><td>6. Data and results</td><td>${toolChip('chatgpt')} ${toolChip('claude')} ${toolChip('copilot')}</td></tr></table>`},
 {h:'Checklist before you present',p:`<ul><li>Every fact and number checked.</li><li>No private information used.</li><li>AI-made images and video labelled where needed.</li><li>Everything matches your brand kit.</li><li>You can explain which tool you used for each step and why.</li></ul><p>Present your project to [[your family or class||your team, friends or family]]. Then pass the final quiz below to earn your <b>Aqlyon AI Academy certificate</b>.</p>`}
],
tryit:['Pick your project and write its one-sentence goal.','Create each part with the right tool.','Run the checklist.','Present your project to at least two people.'],
quiz:[
 {q:'You need a researched report with citations. Best first tool?',a:['Gemini or ChatGPT deep research','Kling','A video editor'],c:0,why:'Deep research reads and cites many sources.'},
 {q:'You want a 5-second clip from your own product photo. Which approach?',a:['Image-to-video in Kling, Runway or Higgsfield','Ask Excel','Text in a Word document'],c:0,why:'Image-to-video animates your picture.'},
 {q:'A complete prompt for a chat AI includes…',a:['Role, task, context and format','Only one word','Your password'],c:0,why:'The 4-part recipe gives clear results.'},
 {q:'Before publishing AI content you should…',a:['Check facts, privacy and label AI media','Publish immediately','Remove your name'],c:0,why:'Responsible use protects you and your audience.'},
 {q:'Which pairing is right?',a:['Copilot → PowerPoint and Excel; Gemini → Google Docs and Sheets','Kling → spreadsheets; Runway → email','Calculator → video'],c:0,why:'Each assistant lives inside its own family of apps.'}]}
];

/* ---------- AI placement questions ---------- */
const AI_PLACE=[
 {lvl:1,q:'What does an AI chat tool like ChatGPT or Claude do when it answers?',a:['Predicts the answer word by word from patterns it learned','Looks up one web page and copies it','Asks a person to type the answer'],c:0},
 {lvl:1,q:'An AI gives a confident but false answer. This is called…',a:['A hallucination','A firewall','A download'],c:0},
 {lvl:2,q:'Which prompt is strongest?',a:['"Act as a tutor. Explain fractions to a 10-year-old in 5 steps with examples."','"fractions"','"help me pls"'],c:0},
 {lvl:2,q:'You want AI help inside Excel and PowerPoint. Which assistant is built in?',a:['Microsoft Copilot','Kling','Higgsfield'],c:0},
 {lvl:3,q:'Which aspect ratio fits a vertical phone video (reel or story)?',a:['9:16','16:9','4:3'],c:0},
 {lvl:3,q:'What is "image-to-video"?',a:['Animating a still picture into a short clip','Printing a video','Saving a video as a photo'],c:0}
];
const AI_USE=[['never','I have never used an AI tool'],['tried','I have tried ChatGPT or similar a few times'],['weekly','I use AI tools every week'],['daily','I use AI every day, for work or study']];
