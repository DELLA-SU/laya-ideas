export const PURPOSES={poster:{name:'포스터',width:1080,height:1350},brand:{name:'브랜딩',width:1080,height:1080},package:{name:'패키지',width:1080,height:1080},web:{name:'웹 화면',width:1440,height:900},free:{name:'자유 탐색',width:1200,height:900}};
export function paletteFromPixels(pixels,limit=4){
 const bins=new Map();
 for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<200)continue;const rgb=[pixels[i],pixels[i+1],pixels[i+2]];const key=rgb.map(v=>Math.min(255,Math.round(v/32)*32)).join(',');const bin=bins.get(key)||{count:0,sums:[0,0,0]};bin.count++;rgb.forEach((v,j)=>bin.sums[j]+=v);bins.set(key,bin);}
 const chosen=[];
 for(const bin of [...bins.values()].sort((a,b)=>b.count-a.count)){
  const rgb=bin.sums.map(v=>Math.round(v/bin.count));if(chosen.some(other=>Math.hypot(...rgb.map((v,j)=>v-other[j]))<65))continue;
  chosen.push(rgb);if(chosen.length===limit)break;
 }
 return chosen.map(rgb=>'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''));
}
export function layoutFor(purpose,variant=0){
 const v=((variant%3)+3)%3;
 const rows={poster:[[[.07,.27,.56,.62],[.58,.42,.34,.42]],[[.06,.28,.88,.42],[.59,.60,.34,.32]],[[.06,.28,.43,.61],[.51,.28,.43,.61]]],brand:[[[.06,.3,.6,.62],[.64,.24,.3,.36]],[[.06,.30,.42,.62],[.51,.30,.43,.62]],[[.07,.32,.86,.44],[.66,.65,.25,.28]]],package:[[[.23,.3,.37,.5],[.55,.43,.24,.31]],[[.23,.32,.55,.31],[.48,.60,.3,.23]],[[.23,.32,.26,.49],[.51,.32,.27,.49]]],web:[[[.56,.22,.29,.62],[.79,.48,.16,.33]],[[.55,.22,.4,.41],[.70,.58,.25,.29]],[[.56,.24,.18,.60],[.76,.24,.18,.6]]],free:[[[.07,.30,.57,.6],[.56,.42,.36,.45]],[[.06,.3,.88,.38],[.62,.60,.30,.30]],[[.06,.28,.43,.61],[.51,.28,.43,.61]]]};
 return (rows[purpose]||rows.poster)[v];
}
export function newProject(pair,keyword='',features=[]){
 return {version:1,purpose:'poster',variant:0,title:String(keyword||'새로운 연결').slice(0,60),subtitle:'',background:'#e8e6df',ink:'#151515',accent:'#b8332a',sources:pair.map((item,i)=>({include:true,shape:'rect',pattern:'none',zoom:1,x:0,y:0,note:features[i]||'',excerpt:item.kind==='reading'?String(item.description||'').slice(0,220):'',useExcerpt:false,localImage:''}))};
}
export function normalizeProject(value,pair){
 const base=newProject(pair),p={...base,...value};p.purpose=PURPOSES[p.purpose]?p.purpose:'poster';p.variant=Math.max(0,Math.min(2,Number(p.variant)||0));
 for(const key of ['background','ink','accent'])if(!/^#[0-9a-f]{6}$/i.test(p[key]))p[key]=base[key];
 p.title=String(p.title||'').slice(0,60);p.subtitle=String(p.subtitle||'').slice(0,180);
 p.sources=pair.map((_,i)=>{const s={...base.sources[i],...(value?.sources?.[i]||{})};s.zoom=Math.max(1,Math.min(3,Number(s.zoom)||1));for(const k of ['x','y'])s[k]=Math.max(-100,Math.min(100,Number(s[k])||0));s.pattern=['none','stripes','dots','grid'].includes(s.pattern)?s.pattern:'none';s.shape=s.shape==='circle'?'circle':'rect';s.localImage=/^data:image\/(png|jpeg|webp);base64,/.test(s.localImage)?s.localImage:'';s.note=String(s.note||'').slice(0,180);s.excerpt=String(s.excerpt||'').slice(0,500);return s;});return p;
}
export function productionBrief(project,pair){
 const arrangement=['첫 자료를 크게, 두 번째 자료를 오른쪽에 겹쳐 배치','첫 자료를 넓은 띠로, 두 번째 자료를 오른쪽 아래에 배치','두 자료를 같은 크기로 나란히 배치'][project.variant];
 return `${PURPOSES[project.purpose].name} 초안 · ${project.title}\n${arrangement}.\n바탕 ${project.background}, 글자 ${project.ink}, 강조 ${project.accent}.\n`+project.sources.map((s,i)=>`${i+1}번 자료: ${s.include?(pair[i]?.kind==='reading'?'자료 카드 사용':'이미지 사용'):'이미지 제외'}${s.shape==='circle'?' · 원형 자르기':''}${s.pattern!=='none'?' · '+({stripes:'줄무늬',dots:'점',grid:'격자'}[s.pattern]):''}${s.note?' · 사용자가 고른 요소: '+s.note:''}${s.useExcerpt&&s.excerpt?'\n사용자가 확인한 문구: '+s.excerpt:''}`).join('\n');
}
