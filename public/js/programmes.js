/* =====================================================================
   Aqlyon certificate programmes. Each one uses the same academy screens
   (academy.js) and the same certificate design, with its own content.
   ===================================================================== */
const PROGRAMMES={
 ai:{key:'ai',name:'AI Academy',full:'Aqlyon AI Academy',pass:AI_PASS,
  sub:'From AI fundamentals to professional AI creation',
  intro:'Learn Claude, ChatGPT, Gemini, Copilot and the video tools Kling, Runway and Higgsfield. Thirteen stages, from "What is AI?" to building images, videos, content, presentations and data reports. Pass each stage quiz to move on and earn your certificate.',
  card:'13 stages from "What is AI?" to making images, videos, content, slides and data reports with Claude, ChatGPT, Gemini, Copilot, Kling, Runway and Higgsfield.',
  level:'All levels',welcomeEm:'keep creating!',
  stages:AI_STAGES,levels:AI_LEVELS,place:AI_PLACE,use:AI_USE,useQ:'How much have you used AI tools?',
  heroTools:['claude','chatgpt','gemini','copilot','higgsfield','kling','runway'],
  levelNames:['','Starter','Explorer','Creator','Pro'],
  startLevel:(use,lv)=>{let s=1;if(use!=='never'&&lv(1)){s=2;if(lv(2)){s=3;if(lv(3)&&(use==='weekly'||use==='daily'))s=4}}return s},
  cert:{tag:'<b>AI Academy</b> &nbsp;·&nbsp; From AI Fundamentals to Professional AI Creation',title:'Certificate of <span>Achievement</span>',
   desc:'for successfully completing the <b>Aqlyon AI Academy</b> programme and passing every stage assessment, demonstrating practical skill in using AI for writing, research, images, video, presentations, data analysis and everyday workflows.',
   chips:['Claude','ChatGPT','Gemini','Microsoft Copilot','Higgsfield','Kling','Runway'],level:'Advanced AI Practitioner',ring:'AQLYON • BRAND MANAGEMENT • AI ACADEMY •',seal:'AI'}},
 dm:{key:'dm',name:'Digital Marketing',full:'Certificate in AI-Powered Digital Marketing',pass:AI_PASS,
  sub:'Certificate in AI-Powered Digital Marketing · Beginner to Intermediate',
  intro:'Learn to apply AI in social media marketing, content planning, advertising campaigns, audience research, SEO, marketing analytics and campaign optimisation. Twelve practical stages with real prompts, tool guides and a final campaign project. Pass each stage quiz to move on and earn your certificate.',
  card:'12 stages, Beginner to Intermediate: social media, content planning, ads, audience research, SEO, analytics and campaign optimisation, all with AI.',
  level:'Beginner to Intermediate',welcomeEm:'let\'s grow your brand!',
  stages:DM_STAGES,levels:DM_LEVELS,place:DM_PLACE,use:DM_USE,useQ:'How much digital marketing have you done?',
  heroTools:['chatgpt','claude','gemini','meta','gads','ga4','canva'],
  levelNames:['','Beginner','Practitioner','Intermediate'],
  startLevel:(use,lv)=>{let s=1;if(use!=='never'&&lv(1)){s=2;if(lv(2)&&(use==='regular'||use==='pro'))s=3}return s},
  cert:{tag:'<b>Digital Marketing</b> &nbsp;·&nbsp; Beginner to Intermediate',title:'<small>Certificate in</small>AI-Powered <span>Digital Marketing</span>',two:true,
   desc:'for successfully completing the <b>Certificate in AI-Powered Digital Marketing</b> and passing every stage assessment, demonstrating practical skill in applying AI to social media marketing, content planning, advertising campaigns, audience research, SEO, marketing analytics and campaign optimisation.',
   chips:['Social Media','Content Planning','Advertising','Audience Research','SEO','Analytics','Optimisation'],level:'Intermediate · AI-Powered Digital Marketer',ring:'AQLYON • BRAND MANAGEMENT • DIGITAL MARKETING •',seal:'AI'}}
};
const PROG_KEYS=Object.keys(PROGRAMMES);
