import {PURPOSES,paletteFromPixels,layoutFor,newProject,normalizeProject,productionBrief} from './mix-studio-model.js?v=2';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const control=(label,input)=>{const wrap=el('label',undefined,'studio-field');wrap.append(el('span',label),input);return wrap;};
const input=(type,label,value)=>{const n=el('input');n.type=type;n.setAttribute('aria-label',label);n.value=value;return n;};
function loadImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';const timer=setTimeout(()=>{img.src='';reject(new Error('이미지 연결 지연'));},10000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(new Error('이미지의 외부 편집이 제한돼요'));};img.src=url;});}
function wrapText(ctx,text,x,y,maxWidth,size,maxLines=3,lineHeight=1.3){
 ctx.font=`600 ${size}px Arial, 'Apple SD Gothic Neo', sans-serif`;ctx.textBaseline='top';let line='',lines=[];
 for(const char of String(text||'')){if(char==='\n'||(ctx.measureText(line+char).width>maxWidth&&line)){lines.push(line);line=char==='\n'?'':char;}else line+=char;}
 if(line)lines.push(line);lines=lines.slice(0,maxLines);for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],x,y+i*size*lineHeight);return lines.length*size*lineHeight;
}
function imageLayer(ctx,img,rect,source){
 const [x,y,w,h]=rect;ctx.save();ctx.beginPath();if(source.shape==='circle')ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);else ctx.rect(x,y,w,h);ctx.clip();
 const scale=Math.max(w/img.width,h/img.height)*source.zoom,iw=img.width*scale,ih=img.height*scale;
 const ox=(iw-w)/2*(1+source.x/100),oy=(ih-h)/2*(1+source.y/100);ctx.drawImage(img,x-ox,y-oy,iw,ih);ctx.restore();
}
function patternLayer(ctx,rect,pattern,color){
 if(pattern==='none')return;const [x,y,w,h]=rect;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=.28;ctx.lineWidth=3;
 if(pattern==='stripes'){for(let a=-h;a<w+h;a+=24){ctx.beginPath();ctx.moveTo(x+a,y);ctx.lineTo(x+a+h,y+h);ctx.stroke();}}
 if(pattern==='dots'){for(let a=12;a<w;a+=28)for(let b=12;b<h;b+=28){ctx.beginPath();ctx.arc(x+a,y+b,4,0,Math.PI*2);ctx.fill();}}
 if(pattern==='grid'){for(let a=0;a<w;a+=36){ctx.beginPath();ctx.moveTo(x+a,y);ctx.lineTo(x+a,y+h);ctx.stroke();}for(let b=0;b<h;b+=36){ctx.beginPath();ctx.moveTo(x,y+b);ctx.lineTo(x+w,y+b);ctx.stroke();}}ctx.restore();
}
export function drawDraft(canvas,project,pair,assets,variant=project.variant){
 const {width:w,height:h}=PURPOSES[project.purpose];canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle=project.background;ctx.fillRect(0,0,w,h);
 if(project.purpose==='package'){ctx.strokeStyle=project.ink;ctx.globalAlpha=.4;ctx.lineWidth=2;ctx.strokeRect(w*.19,h*.08,w*.62,h*.84);ctx.globalAlpha=1;}
 const layout=layoutFor(project.purpose,variant);
 project.sources.forEach((s,i)=>{const r=layout[i].map((v,j)=>v*(j%2?h:w));patternLayer(ctx,[r[0]-18,r[1]-18,r[2]+36,r[3]+36],s.pattern,project.accent);
  if(!s.include)return;
  if(assets[i]?.image){imageLayer(ctx,assets[i].image,r,s);return;}
  if(pair[i].kind==='reading'){ctx.fillStyle=project.accent;ctx.fillRect(...r);ctx.fillStyle=project.ink;const size=Math.min(76,r[2]/7);wrapText(ctx,s.useExcerpt?s.excerpt:pair[i].title,r[0]+25,r[1]+30,r[2]-50,size,Math.floor((r[3]-60)/(size*1.3)));return;}
  ctx.fillStyle='#bdbbb5';ctx.fillRect(...r);ctx.fillStyle='#333';wrapText(ctx,`${i+1}번 이미지\n파일을 선택해주세요`,r[0]+25,r[1]+25,r[2]-50,28,3);
 });
 ctx.fillStyle=project.ink;
 const web=project.purpose==='web',pkg=project.purpose==='package',tx=w*(pkg?.23:.07),ty=h*(web?.26:pkg?.12:.075),maxW=w*(web?.43:pkg?.55:.84);
 const size=web?78:pkg?54:project.purpose==='poster'?76:64;
 const titleHeight=wrapText(ctx,project.title,tx,ty,maxW,size,web?4:2);
 if(project.subtitle){ctx.font=`400 ${Math.round(size*.28)}px Arial`;wrapText(ctx,project.subtitle,tx,ty+titleHeight+18,maxW,size*.28,web?5:3,1.5);}
 if(web){ctx.font='600 26px Arial';ctx.fillText(project.title.slice(0,15),w*.07,h*.07);ctx.font='400 20px Arial';ctx.fillText('소개     이야기     더 알아보기',w*.62,h*.07);ctx.fillStyle=project.accent;ctx.fillRect(w*.07,h*.74,w*.27,h*.09);ctx.fillStyle=project.ink;ctx.font='600 25px Arial';ctx.fillText('더 알아보기',w*.1,h*.765);}
 else{ctx.fillStyle=project.accent;ctx.fillRect(w*.07,h*.945,w*.12,5);}
 return canvas;
}
export function createMixStudio(root,{save}){
 let pair=[],project,assets=[],generation=0,main,variants,notice,brief,saveButton,exportButton,uiSources=[];
 let renderFrame=0,savedSignature='';
 const render=()=>{if(!project||!main)return;drawDraft(main,project,pair,assets);variants.forEach((v,i)=>{drawDraft(v.canvas,project,pair,assets,i);v.button.setAttribute('aria-pressed',String(i===project.variant));v.label.textContent=(i===project.variant?'선택한 안 · ':'변형안 · ')+['겹치기','넓게 펼치기','나란히'][i];});brief.value=productionBrief(project,pair);saveButton.textContent=savedSignature===JSON.stringify(project)?'무드보드에 추가됨':'무드보드에 추가';const blocked=project.sources.some((s,i)=>s.include&&pair[i].kind!=='reading'&&!assets[i]?.image);const pending=project.sources.some((s,i)=>s.include&&assets[i]?.loading);exportButton.disabled=blocked;saveButton.disabled=blocked||savedSignature===JSON.stringify(project);notice.textContent=pending?'이미지와 대표색을 준비하고 있어요.':blocked?'편집이 제한된 이미지가 있어요. 해당 파일을 선택하거나 이미지 사용을 꺼주세요.':'';};
 const schedule=()=>{cancelAnimationFrame(renderFrame);renderFrame=requestAnimationFrame(render);};
 function bind(n,fn){n.oninput=()=>{fn(n);schedule();};return n;}
 function button(text,fn){const b=el('button',text);b.type='button';b.onclick=fn;return b;}
 function snapshot(){const preview=document.createElement('canvas');preview.width=540;preview.height=Math.round(540*main.height/main.width);preview.getContext('2d').drawImage(main,0,0,preview.width,preview.height);return preview.toDataURL('image/webp',.85);}
 async function assetFor(i,url,token){
  try{const image=await loadImage(url);if(token!==generation)return;
   const probe=document.createElement('canvas');probe.width=64;probe.height=64;const ctx=probe.getContext('2d');ctx.drawImage(image,0,0,64,64);const palette=paletteFromPixels(ctx.getImageData(0,0,64,64).data);
   assets[i]={image,palette};uiSources[i].state.textContent='이미지 편집 가능 · 아래 색은 실제 이미지에서 추출했어요.';showPalette(i,palette);render();
  }catch{if(token!==generation)return;assets[i]={};uiSources[i].state.textContent='외부 이미지 편집이 제한돼요. 파일 선택으로 사용할 수 있어요.';render();}
 }
 function showPalette(i,colors){const box=uiSources[i].palette;box.replaceChildren();for(const color of colors){const b=button('',()=>{project.accent=color;root.querySelector('[aria-label="강조색"]').value=color;render();});b.className='studio-swatch';b.style.background=color;b.title=color+' 강조색으로 사용';b.setAttribute('aria-label',`${i+1}번 자료의 ${color} 강조색으로 사용`);box.append(b);}if(colors.length){box.append(button('바탕에 적용',()=>{project.background=colors[0];root.querySelector('[aria-label="바탕색"]').value=colors[0];render();}));}}
 function sourceCard(item,i){
  const s=project.sources[i],box=el('section',undefined,'studio-source'),heading=el('div',undefined,'studio-source-heading');
  if(item.kind!=='reading'){const image=el('img');image.src=s.localImage||item.image;image.alt=`${i+1}번 자료`;heading.append(image);}heading.append(el('strong',`${i+1}번 자료`),el('span',item.title));box.append(heading);
  const original=el('a','출처 확인');original.href=item.source;original.target='_blank';original.rel='noopener noreferrer';box.append(original);
  const use=input('checkbox',`${i+1}번 ${item.kind==='reading'?'자료 카드':'이미지'} 사용`,'');use.checked=s.include;box.append(control(item.kind==='reading'?'자료 카드 사용':'이미지 사용',bind(use,n=>s.include=n.checked)));
  const state=el('p',item.kind==='reading'?'아래는 제공된 발췌입니다. 전체 논문을 분석한 내용이 아닙니다.':'이미지와 대표색을 준비하고 있어요.','studio-source-state');box.append(state);
  const palette=el('div',undefined,'studio-palette');box.append(palette);uiSources[i]={state,palette};
  if(item.kind!=='reading'){
   const file=input('file',`${i+1}번 이미지 파일 선택`,'');file.accept='image/png,image/jpeg,image/webp';file.onchange=async()=>{const picked=file.files?.[0];if(!picked)return;if(!['image/png','image/jpeg','image/webp'].includes(picked.type)){state.textContent='PNG, JPG, WebP 파일을 선택해주세요.';return;}const token=generation,url=URL.createObjectURL(picked);try{const image=await loadImage(url);if(token!==generation)return;const c=document.createElement('canvas');const factor=Math.min(1,1000/image.width,1000/image.height);c.width=Math.round(image.width*factor);c.height=Math.round(image.height*factor);c.getContext('2d').drawImage(image,0,0,c.width,c.height);s.localImage=c.toDataURL('image/webp',.85);heading.querySelector('img').src=s.localImage;await assetFor(i,s.localImage,token);}catch{state.textContent='파일을 열 수 없어요.';}finally{URL.revokeObjectURL(url);}};box.append(control('파일로 교체 · 이 브라우저에서만 사용',file));
   const shape=el('select');shape.setAttribute('aria-label',`${i+1}번 이미지 형태`);for(const [value,text] of [['rect','사각형'],['circle','원형']]){const o=el('option',text);o.value=value;shape.append(o);}shape.value=s.shape;box.append(control('자르기',bind(shape,n=>s.shape=n.value)));
   for(const [key,label,min,max,step] of [['zoom','확대',1,3,.1],['x','가로 위치',-100,100,1],['y','세로 위치',-100,100,1]]){const n=input('range',`${i+1}번 ${label}`,s[key]);n.min=min;n.max=max;n.step=step;box.append(control(label,bind(n,n=>s[key]=Number(n.value))));}
  }else{
   const excerpt=el('textarea');excerpt.value=s.excerpt;excerpt.maxLength=500;excerpt.rows=4;excerpt.setAttribute('aria-label',`${i+1}번 확인한 발췌`);excerpt.placeholder='원문에서 확인한 문장이나 근거를 직접 입력해주세요.';box.append(control('확인한 발췌 · 직접 수정',bind(excerpt,n=>s.excerpt=n.value)));
   const useText=input('checkbox',`${i+1}번 발췌를 시안에 사용`,'');useText.checked=s.useExcerpt;box.append(control('이 발췌를 시안 문구로 사용',bind(useText,n=>s.useExcerpt=n.checked)));
  }
  const pattern=el('select');pattern.setAttribute('aria-label',`${i+1}번 확장 패턴`);for(const [value,text] of [['none','없음'],['stripes','줄무늬'],['dots','점'],['grid','격자']]){const o=el('option',text);o.value=value;pattern.append(o);}pattern.value=s.pattern;box.append(control('배경으로 확장할 패턴 · 직접 선택',bind(pattern,n=>s.pattern=n.value)));
  const note=input('text',`${i+1}번 가져올 요소`,s.note);note.maxLength=180;note.placeholder=item.kind==='reading'?'예: 원문에서 확인한 주장과 근거':'예: 줄무늬, 둥근 윤곽, 비대칭 구도';box.append(control('가져올 요소 · 직접 확인',bind(note,n=>s.note=n.value)));return box;
 }
 function build(){
  root.replaceChildren();uiSources=[];const heading=el('header',undefined,'studio-heading');heading.append(el('small','아이디어 믹스 · 제작실'),el('h2','두 자료로 만드는 디자인 초안'));heading.lastChild.id='mixHeading';root.append(heading);
  const purposes=el('div',undefined,'studio-purposes');purposes.setAttribute('role','group');purposes.setAttribute('aria-label','제작 목적');for(const [key,v] of Object.entries(PURPOSES)){const b=button(v.name,()=>{project.purpose=key;purposes.querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));render();});b.setAttribute('aria-pressed',String(project.purpose===key));purposes.append(b);}root.append(purposes);
  const sourceDetails=el('details',undefined,'studio-elements');sourceDetails.open=false;sourceDetails.append(el('summary','1. 가져올 요소 고르기'));const refs=el('div',undefined,'studio-sources');pair.forEach((item,i)=>refs.append(sourceCard(item,i)));sourceDetails.append(refs);root.append(sourceDetails);
  const workspace=el('section',undefined,'studio-workspace');const preview=el('div',undefined,'studio-preview');preview.append(el('h3','2. 시안 고르고 다듬기'));main=el('canvas');main.setAttribute('aria-label','선택한 디자인 초안');main.setAttribute('role','img');preview.append(main);
  const row=el('div',undefined,'studio-variants');variants=[];for(let i=0;i<3;i++){const b=button('',()=>{project.variant=i;render();}),c=el('canvas'),label=el('span');c.setAttribute('aria-hidden','true');b.setAttribute('aria-label',`시안 ${i+1} 선택`);b.append(c,label);variants.push({button:b,canvas:c,label});row.append(b);}preview.append(row);workspace.append(preview);
  const editor=el('div',undefined,'studio-editor');editor.append(el('h3','바로 수정하기'));const title=input('text','시안 제목',project.title);title.maxLength=60;editor.append(control('제목',bind(title,n=>project.title=n.value)));const subtitle=el('textarea');subtitle.rows=3;subtitle.maxLength=180;subtitle.value=project.subtitle;subtitle.setAttribute('aria-label','시안 보조 문구');editor.append(control('보조 문구',bind(subtitle,n=>project.subtitle=n.value)));
  const colors=el('div',undefined,'studio-colors');for(const [key,label] of [['background','바탕색'],['ink','글자색'],['accent','강조색']])colors.append(control(label,bind(input('color',label,project[key]),n=>project[key]=n.value)));editor.append(colors);
  editor.append(button('배치 바꾸기',()=>{project.variant=(project.variant+1)%3;render();}));
  const remix=el('select');remix.setAttribute('aria-label','다시 믹스할 요소');for(const [value,text] of [['layout','배치만 바꾸기'],['colors','색만 바꾸기']]){const o=el('option',text);o.value=value;remix.append(o);}editor.append(control('다시 믹스할 요소',remix),button('선택한 요소 다시 믹스',()=>{if(remix.value==='layout')project.variant=(project.variant+1)%3;else{const colors=assets.flatMap(a=>a.palette||[]);const index=colors.indexOf(project.accent);project.accent=colors[(index+1)%colors.length]||'#ffffff';root.querySelector('[aria-label="강조색"]').value=project.accent;}render();}));
  const details=el('details');details.append(el('summary','구체적인 제작안과 출처'));brief=el('textarea');brief.readOnly=true;brief.rows=7;brief.setAttribute('aria-label','시안 제작안');details.append(brief);for(const r of pair){const a=el('a',r.title+' · 원문');a.href=r.source;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}editor.append(details);workspace.append(editor);root.append(workspace);
  const actions=el('div',undefined,'studio-output');notice=el('p','','studio-notice');notice.setAttribute('role','status');
  exportButton=button('PNG 저장',()=>{render();try{const a=el('a');a.href=main.toDataURL('image/png');a.download=`${(project.title||'아이디어').replace(/[\\/:*?"<>|]/g,'-')}-${PURPOSES[project.purpose].name}.png`;a.click();notice.textContent='PNG 저장을 시작했어요.';}catch{notice.textContent='이미지 편집 권한을 확인해주세요. 파일을 선택하면 저장할 수 있어요.';}});
  saveButton=button('무드보드에 추가',async()=>{render();try{await save({title:project.title||'새로운 연결',brief:productionBrief(project,pair),image:snapshot(),project:structuredClone(project),references:pair.map(r=>({...r}))});savedSignature=JSON.stringify(project);render();notice.textContent='모아둔 것과 무드보드에 추가했어요. 저장한 시안도 제작실에서 다시 수정할 수 있어요.';}catch(error){notice.textContent=error.message;}});actions.append(exportButton,saveButton,notice);root.append(actions,el('p','시안은 선택한 자료를 배치한 콜라주입니다. 이미지의 형태·패턴과 글의 핵심 주장은 직접 확인해 선택해주세요.','studio-footnote'));render();
 }
 return {
  invalidate(){generation++;project=null;},
  async open(items,keyword,features=[],restored){
   const keep=project&&pair.length===items.length&&pair.every((r,i)=>r.id===items[i].id)&&!restored;
   pair=items.map(r=>({...r}));const token=++generation;project=restored?normalizeProject(restored,pair):keep?project:newProject(pair,keyword,features);assets=pair.map(item=>({loading:item.kind!=='reading'}));savedSignature='';build();
   await Promise.all(pair.map((item,i)=>item.kind==='reading'?Promise.resolve():assetFor(i,project.sources[i].localImage||item.image,token)));
  }
 };
}
