import { publicRequest } from './public-services.js?v=deployment-3';
import { expandPair } from './idea-expansion.js';
import { wallSize, layoutWall, readingQuota, mixWall } from './idea-wall.js?v=70-30';
import { createMoodboard } from './moodboard.js?v=arrows-20261005';
import { searchArena } from './arena.js?v=global';
import { createDrawMachine } from './draw-machine.js';
import { shuffleItems, uniqueImages, chooseBatch, chooseSourceBatch, chooseIdeaBatch } from './selection.js?v=70-30';
const $ = s => document.querySelector(s);
const machine=createDrawMachine($('#drawStage'),$('#drawCanvas'),$('#drawHeading'),$('#drawMessage'));
const pinterestPaused=window.PINTEREST_PAUSED===true;
const pinterestEnabled=!pinterestPaused&&window.REFERENCE_PROVIDER==='pinterest';
if(pinterestEnabled){$('#providerLabel').textContent='Images from Pinterest';const guide=$('.source-note a');guide.href='https://policy.pinterest.com/ko/copyright';}
const aliases = {'글래스모피즘':'glassmorphism','글라스모피즘':'glassmorphism','뉴모피즘':'neumorphism','치이카와':'chiikawa','치이카':'chiikawa','먼작귀':'chiikawa','치이카와 캐릭터':'chiikawa','여우':'red fox','기억':'memory','심리학':'psychology','뇌과학':'neuroscience','뇌':'brain','감정':'emotion','창의성':'creativity','바우하우스':'Bauhaus -concert -band -music -hardware -store','브루탈리즘':'brutalist architecture','식물':'botanical illustration','빈티지 포스터':'vintage poster -unveiling','도자기':'ceramics','건축':'architecture','타이포그래피':'typography','고양이':'cat','꽃':'flower','의자':'chair design','가구':'furniture','포스터':'poster','그래픽 디자인':'graphic design','추상':'abstract art','모더니즘':'modernism','정원':'garden','숲':'forest','바다':'sea','패턴':'pattern','직물':'textile','조각':'sculpture','일러스트':'illustration','미술':'painting'};
const read = (key, fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}};
const write = (key, value) => {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const state = {keyword:'',query:'',pool:[],seen:[],batch:[],continuation:null,exhausted:false,busy:false,savedView:false,arenaLoaded:false,pinterestPublicLoaded:false,webImagesLoaded:false,designLoaded:false,sourceMessages:[],readings:[],readingsLoaded:false,wallTarget:10};
let saved = read('laya:saved:v1',[]); if(!Array.isArray(saved)) saved=[];
const histories = read('laya:seen:v1',{});
let currentPair=[null,null],connectionId=null,activePairSlot=0;
const text = html => {const doc=new DOMParser().parseFromString(String(html || ''),'text/html');return doc.body.textContent.replace(/\s+/g,' ').trim();};
const safeURL = url => {try{const u=new URL(String(url).startsWith('//')?'https:'+url:url);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const node = (tag, content, cls) => {const el=document.createElement(tag);if(content!==undefined)el.textContent=content;if(cls)el.className=cls;return el;};
function link(label, href){const a=node('a',label);a.href=safeURL(href);a.target='_blank';a.rel='noopener noreferrer';return a;}
function busy(value){state.busy=value;$('#grid').setAttribute('aria-busy',String(value));$('#shuffle').disabled=value||state.savedView;$('#searchButton').disabled=value;$('#contentMode').disabled=value;document.querySelectorAll('[data-query]').forEach(b=>b.disabled=value);$('#savedToggle').disabled=value;$('#boardToggle').disabled=value;}
function countSaved(){$('#savedCount').textContent=saved.length;$('#savedToggle').firstChild.textContent=state.savedView?'돌아가기 · 모아둔 것 ':'모아둔 것 ';}
function saveItem(item, button){const exists=saved.some(x=>x.id===item.id);saved=exists?saved.filter(x=>x.id!==item.id):[item,...saved];const ok=write('laya:saved:v1',saved);button.textContent=exists?'+':'✓';button.classList.toggle('active',!exists);button.setAttribute('aria-pressed',String(!exists));button.setAttribute('aria-label',exists?'레퍼런스 모으기':'모은 레퍼런스 해제');countSaved();if(!ok)$('#status').textContent='브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 모아둡니다.';if(state.savedView){render(saved);title('모아둔 레퍼런스',saved.length,true);if(!saved.length)$('#empty').textContent='마음에 드는 이미지의 + 버튼을 눌러 모아보세요.';}}
function showDetail(item){if(item.kind==='reading'){showReading(item);return;}const body=$('#detailBody');body.replaceChildren();const img=node('img');img.src=item.image;img.alt=item.title;body.append(img,node('h3',item.title),node('p',`${item.provider==='Are.na'?'수집자':'작가'}: ${(item.artist || '원본에서 확인').replace(/^수집: /,'')} · ${item.license || '라이선스 원본에서 확인'}`));if(item.description)body.append(node('p',item.description));body.append(node('p','미리보기는 화면에 맞게 잘려 보일 수 있습니다. 작품을 이용하기 전에 원본의 출처와 라이선스 조건을 확인해주세요.'),link('원본 페이지 ↗',item.source));if(item.original&&safeURL(item.original))body.append(link('원작 출처 ↗',item.original));if(item.licenseURL)body.append(link(item.license,item.licenseURL));const copy=node('button','출처 정보 복사');copy.onclick=async()=>{try{await navigator.clipboard.writeText(`${item.title}\n${item.artist}\n${item.source}\n${item.license} ${item.licenseURL}`);copy.textContent='복사했어요 ✓';}catch{copy.textContent='복사할 수 없어요. 원본 링크를 이용해주세요.';}};body.append(node('br'),copy);$('#detail').showModal();}
function render(items){$('#ideaSpace').hidden=state.savedView||items.length<2;if(state.savedView){$('#pairPanel').hidden=true;currentPair=[null,null];}$('#connect').textContent='두 장 연결해보기 ↗';const grid=$('#grid');grid.replaceChildren();$('#empty').hidden=items.length>0;items.forEach((item,index)=>{if(item.kind==='connection'){grid.append(connectionCard(item));return;}if(item.kind==='reading'){grid.append(readingCard(item,index));return;}const card=node('article',undefined,'card');makeDraggable(card,item);const wrap=node('div',undefined,'image-wrap');const open=node('button',undefined,'image-open');open.setAttribute('aria-label',`${item.title} 상세 보기`);open.onclick=()=>{if(!$('#pairPanel').hidden&&!state.savedView){selectPairItem(item);return;}showDetail(item);};const img=node('img');img.src=item.image;img.alt=item.title;img.draggable=false;img.loading='eager';img.style.aspectRatio=String(item.aspectRatio||4/3);img.onload=()=>{if(['public-image-search','public-design'].includes(item.providerMode)&&img.naturalWidth&&img.naturalHeight){item.aspectRatio=img.naturalWidth/img.naturalHeight;img.style.aspectRatio=String(item.aspectRatio);}scheduleWall();};img.decoding='async';img.onerror=()=>{if(item.fallbackImage&&img.src!==item.fallbackImage){img.src=item.fallbackImage;return;}open.replaceChildren(node('span','미리보기를 불러오지 못했어요.\n눌러서 출처를 확인하세요.','broken-label'));};open.append(img);const b=node('button',saved.some(x=>x.id===item.id)?'✓':'+','save');b.classList.toggle('active',saved.some(x=>x.id===item.id));b.setAttribute('aria-pressed',String(saved.some(x=>x.id===item.id)));b.setAttribute('aria-label',saved.some(x=>x.id===item.id)?'모은 레퍼런스 해제':'레퍼런스 모으기');b.onclick=()=>saveItem(item,b);wrap.append(open,node('span',String(index+1).padStart(2,'0'),'number'),b);const title=node('h3',item.title);title.title=item.title;const credit=node('p',item.artist||'작가 정보는 원본에서 확인','credit');credit.title=item.artist;const links=node('div',undefined,'card-links');links.append(link(item.license||'이용 조건 확인',item.licenseURL||item.source),link('원본 ↗',item.source));card.append(wrap,title,credit,links);grid.append(card);});scheduleWall();}
function loading(){currentPair=[null,null];$('#pairPanel').hidden=true;$('#status').hidden=true;$('#ideaSpace').hidden=true;const grid=$('#grid');grid.replaceChildren();$('#empty').hidden=true;for(let i=0;i<10;i++){const c=node('div',undefined,'card skeleton');c.append(node('div',undefined,'image-wrap'));grid.append(c);}}
function withoutPausedPinterest(data){if(pinterestPaused&&Array.isArray(data.items))data.items=data.items.filter(item=>!/^pinterest/i.test(item.provider||'')&&!/pinterest|pinimg\.com/i.test((item.source||'')+' '+(item.image||'')));return data;}
async function fetchJSON(url){if(pinterestPaused&&url.startsWith('/api/pinterest/'))throw new Error('Pinterest 연결이 일시 중지되어 있습니다.');if(url.startsWith('/api/')){if(window.REFERENCE_API_BASE)url=window.REFERENCE_API_BASE.replace(/\/$/,'')+url;else if(window.REFERENCE_STATIC_HOST)return withoutPausedPinterest(await publicRequest(url));}const response=await fetch(url,{signal:AbortSignal.timeout(22000)});const data=await response.json();if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'검색 서비스 연결이 잠시 원활하지 않습니다.');if(data.error)throw new Error(typeof data.error==='string'?data.error:'검색 서비스에서 요청을 처리하지 못했습니다.');return withoutPausedPinterest(data);}
const expansionTerms={'위장':'camouflage','적응':'adaptation','야생':'wildlife','고요':'minimalism','보호':'shelter','계절':'season','성장':'growth','반복':'repetition','유기적 형태':'organic form','지각':'perception','연결':'connection','구조':'structure','경계':'boundary','공간':'architecture','흐름':'flow','반사':'reflection','리듬':'rhythm','대비':'contrast','배치':'composition','시각 언어':'visual language','질감':'texture','시각 디자인':'graphic design'};
async function resolveKeyword(keyword){const terms=Object.keys(expansionTerms).sort((a,b)=>b.length-a.length);if(terms.some(term=>keyword.includes(term))){let translated=keyword;for(const term of terms)translated=translated.replaceAll(term,expansionTerms[term]);for(const [term,en] of Object.entries(aliases))translated=translated.replaceAll(term,en);if(!/[가-힣]/.test(translated))return translated;}if(aliases[keyword])return aliases[keyword];if(!/[가-힣]/.test(keyword))return keyword;try{const p=new URLSearchParams({action:'wbsearchentities',search:keyword,language:'ko',uselang:'en',limit:'5',format:'json',origin:'*'});const d=await fetchJSON('https://www.wikidata.org/w/api.php?'+p);const match=d.search?.find(x=>x.match?.text?.toLowerCase()===keyword.toLowerCase());if(match?.label)return match.label;}catch{}try{const d=await fetchJSON('/api/search/resolve?'+new URLSearchParams({q:keyword}));if(d.query)return d.query;}catch{}return keyword;}
async function loadPage(){if(location.protocol!=='file:'&&!state.designLoaded){state.designLoaded=true;try{const data=await fetchJSON('/api/design/search?'+new URLSearchParams({q:state.keyword,en:state.query.replace(/\s+-\S+/g,'')}));state.pool=uniqueImages([...state.pool,...data.items]);for(const d of data.diagnostics)state.sourceMessages.push(d.provider+' '+d.count+'개'+(d.status==='unavailable'?' (연결 지연)':''));}catch{state.sourceMessages.push('무료 디자인 소스 연결 지연');}}if(location.protocol!=='file:'&&!state.webImagesLoaded){state.webImagesLoaded=true;try{const data=await fetchJSON('/api/images/search?'+new URLSearchParams({q:state.keyword,en:state.query.replace(/\s+-\S+/g,'')}));state.pool=uniqueImages([...state.pool,...data.items]);state.sourceMessages.push('키워드 이미지 검색 '+data.items.length+'개');}catch{state.sourceMessages.push('키워드 이미지 검색 연결 지연');}}if(!pinterestPaused&&window.PINTEREST_PUBLIC_ENABLED&&!pinterestEnabled&&!state.pinterestPublicLoaded){state.pinterestPublicLoaded=true;try{const data=await fetchJSON('/api/pinterest/public-search?'+new URLSearchParams({q:state.keyword,en:state.query.replace(/\s+-\S+/g,'')}));state.pool=uniqueImages([...state.pool,...data.items]);state.sourceMessages.push(data.items.length?'Pinterest 공개 페이지 '+data.items.length+'개':'Pinterest 공개 페이지에서 이미지 메타데이터를 받지 못함');}catch{state.sourceMessages.push('Pinterest 공개 페이지 연결 지연');}}if(!state.arenaLoaded){state.arenaLoaded=true;try{const d=await searchArena(state.keyword,state.query,fetchJSON);state.pool=uniqueImages([...state.pool,...d.items]);state.sourceMessages.push(`Are.na 전체 검색 ${d.items.length}개${d.partial?' (일부 채널 응답 없음)':''}`);}catch(error){state.sourceMessages.push(error.message||'Are.na 전체 검색 연결 지연');}}if(pinterestEnabled){const p=new URLSearchParams({q:state.query});if(state.continuation)p.set('bookmark',state.continuation);const d=await fetchJSON('/api/pinterest/search?'+p);state.pool=uniqueImages([...state.pool,...d.items]);state.continuation=d.bookmark||null;state.exhausted=!d.bookmark;return;}const p=new URLSearchParams({action:'query',generator:'search',gsrsearch:state.query,gsrnamespace:'6',gsrlimit:'50',prop:'imageinfo',iiprop:'url|extmetadata|sha1|size|mime',iiurlwidth:'640',format:'json',origin:'*',formatversion:'2'});if(state.continuation)Object.entries(state.continuation).forEach(([k,v])=>p.set(k,v));const data=await fetchJSON('https://commons.wikimedia.org/w/api.php?'+p);const found=(data.query?.pages||[]).sort((a,b)=>(a.index||0)-(b.index||0)).flatMap(page=>{const info=page.imageinfo?.[0];if(!info||!/^image\/(jpeg|png|webp|svg\+xml)$/.test(info.mime)||!info.thumburl||info.width<200||info.height<200)return [];const m=info.extmetadata||{};const source=safeURL(info.descriptionurl);const image=safeURL(info.thumburl);if(!source||!image)return [];return [{aspectRatio:info.width/info.height,id:String(page.pageid),hash:info.sha1||info.url,image,source,title:text(m.ObjectName?.value)||page.title.replace(/^File:/,'').replace(/_/g,' '),artist:text(m.Artist?.value)||text(m.Credit?.value),description:text(m.ImageDescription?.value).slice(0,700),license:text(m.LicenseShortName?.value),licenseURL:safeURL(m.LicenseUrl?.value)}];}).filter(item=>{const terms=state.query.replace(/\s+-\S+/g,'').toLowerCase().split(/\s+/).filter(x=>x.length>2);const content=(item.title+' '+item.description).toLowerCase();return !terms.length||terms.some(t=>content.includes(t));});state.pool=uniqueImages([...state.pool,...found]);state.continuation=data.continue||null;state.exhausted=!data.continue;}
function title(label,n,savedMode=false){$('#resultLabel').textContent=savedMode?'YOUR LITTLE COLLECTION':'YOUR NEXT INSPIRATION';$('#resultTitle').replaceChildren(document.createTextNode(label+' '),node('span',`· ${n}${savedMode?'개':'가지'}`));}
function remember(items){state.seen=[...new Set([...state.seen,...items.map(x=>x.hash)])].slice(-2000);histories[state.query.toLowerCase()]=state.seen;const keys=Object.keys(histories);if(keys.length>30)delete histories[keys[0]];write('laya:seen:v1',histories);}
async function draw(){if(state.busy||state.savedView)return;machine.start(state.keyword);busy(true);const previous=state.batch;loading();$('#status').textContent='키워드와 관련된 이미지 사이에서 한 화면을 채울 새로운 아이디어를 고르고 있어요…';try{let unused=state.pool.filter(x=>!state.seen.includes(x.hash));let pages=0;while(unused.length<80&&!state.exhausted&&pages<3){await loadPage();pages++;unused=state.pool.filter(x=>!state.seen.includes(x.hash));}state.wallTarget=wallMetrics().count;const {items,recycled}=await pickIdeas(previous);await machine.finish(items.length);state.batch=items;remember(items);render(items);fillWall();title(state.keyword,items.length);const sourceSummary=state.sourceMessages.join(' · ')+' · ';const translation=state.query!==state.keyword?`검색어: ${state.query} · `:'';$('#providerLabel').textContent=(pinterestEnabled?'Pinterest':'Wikimedia Commons')+' · '+state.sourceMessages.join(' · ');$('#status').textContent=items.length?`${sourceSummary}${translation}후보 ${state.pool.length}개 · ${recycled?'보지 않은 후보가 부족해 이전 결과 일부를 다시 골랐어요.':`새로 뽑은 이미지${items.length<10?' 새로운 후보가 부족해 '+items.length+'개를 보여드립니다.':''}`}`:`${sourceSummary}${translation}연결된 수집 경로에서 이미지를 받지 못했습니다. 원본 사이트의 검색 결과가 없다는 뜻은 아닙니다.`;if(!items.length){$('#status').hidden=false;}if(!items.length){const empty=$('#empty');empty.replaceChildren(node('p','현재 연결에서는 결과를 가져오지 못했어요. 원본 검색을 열어 확인할 수 있습니다.'));empty.append(link('Pinterest에서 검색 ↗','https://www.pinterest.com/search/pins/?'+new URLSearchParams({q:state.keyword})),node('br'),link('Are.na에서 검색 ↗','https://www.are.na/search?'+new URLSearchParams({q:JSON.stringify({term:{facet:state.keyword}})})),node('br'),link('Cosmos에서 검색 ↗','https://www.cosmos.so/search/elements/'+encodeURIComponent(state.keyword)));}}catch(error){$('#status').hidden=false;await machine.finish(0);render(previous);title(state.keyword,previous.length);$('#status').textContent=`${error.name==='TimeoutError'?'검색 응답이 늦어지고 있어요.':error.message} 다시 시도해주세요.`;if(!previous.length){$('#empty').replaceChildren(node('p','검색 연결을 확인한 뒤 다시 시도해주세요.'));const retry=node('button','다시 시도');retry.onclick=draw;$('#empty').append(retry);}}finally{machine.stop();busy(false);}}
async function search(keyword){if(state.busy)return;keyword=keyword.trim().replace(/[\u0000-\u001f]/g,'').slice(0,100);if(!keyword)return;machine.start(keyword);$('.results').hidden=false;$('#savedToggle').hidden=false;state.savedView=false;countSaved();state.keyword=keyword;$('#resultTitle').textContent=keyword;state.pool=[];state.batch=[];state.continuation=null;state.exhausted=false;state.arenaLoaded=false;state.pinterestPublicLoaded=false;state.webImagesLoaded=false;state.designLoaded=false;state.sourceMessages=[];state.readings=[];state.readingsLoaded=false;$('#readingNotice').hidden=true;$('#cosmosSearch').href='https://www.cosmos.so/search/elements/'+encodeURIComponent(keyword);$('#keyword').value=keyword;busy(true);loading();$('#status').textContent='검색어를 확인하고 있어요…';state.query=pinterestEnabled?keyword:await resolveKeyword(keyword);state.seen=Array.isArray(histories[state.query.toLowerCase()])?histories[state.query.toLowerCase()]:[];busy(false);const u=new URL(location.href);u.searchParams.set('q',keyword);history.replaceState(null,'',u);await draw();}

function connectImages(){
  if(state.busy||state.batch.length<2)return;
  if($('#pairPanel').hidden){currentPair=[null,null];activePairSlot=0;resetPairResult();}
  $('#pairPanel').hidden=false;renderPairSlots();scheduleWall();
  $('.results').scrollTo({top:0,behavior:'smooth'});
}
function resetPairResult(){connectionId=null;$('#combinationResult').hidden=true;$('#connectionStatus').textContent='';}
function selectPairItem(item,slot=activePairSlot){
  if(currentPair.some((x,index)=>index!==slot&&x?.id===item.id)){
    $('#pairSelectionStatus').textContent='서로 다른 두 개의 아이디어를 골라주세요.';return;
  }
  currentPair[slot]=item;resetPairResult();
  $('#featureA').value='';$('#featureB').value='';
  activePairSlot=currentPair[0]?1:0;
  renderPairSlots();scheduleWall();
}
function renderPairSlots(){
  const target=$('#pairImages');target.replaceChildren();$('#pairSelectionStatus').textContent='';
  currentPair.forEach((item,index)=>{
    const slot=node('div',undefined,'pair-slot'+(index===activePairSlot?' selected-slot':''));
    slot.dataset.slot=String(index);slot.setAttribute('role','button');slot.tabIndex=0;
    slot.setAttribute('aria-label',`${index+1}번 연결 칸${item?' · '+item.title:''}`);
    const activate=()=>{activePairSlot=index;renderPairSlots();};slot.onclick=activate;
    slot.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
    slot.ondragover=e=>{if(!e.dataTransfer.types.includes('application/x-reference-idea'))return;e.preventDefault();e.dataTransfer.dropEffect='copy';slot.classList.add('drag-over');};
    slot.ondragleave=()=>slot.classList.remove('drag-over');
    slot.ondrop=e=>{
      e.preventDefault();slot.classList.remove('drag-over');
      const id=e.dataTransfer.getData('application/x-reference-idea');
      const chosen=[...state.batch,...saved].find(x=>x.id===id&&x.kind!=='connection');
      if(chosen)selectPairItem(chosen,index);
    };
    if(item){
      slot.append(referencePreview(item),node('span',item.title,'slot-title'));
      const remove=node('button','×','clear-pair');remove.setAttribute('aria-label',`${index+1}번 아이디어 빼기`);
      remove.onclick=e=>{e.stopPropagation();currentPair[index]=null;activePairSlot=index;resetPairResult();renderPairSlots();scheduleWall();};slot.append(remove);
    }else{slot.append(node('span',`${index+1}`,'slot-index'),node('p','아이디어를 끌어다 놓으세요','slot-empty'));}
    target.append(slot);
  });
  const ready=currentPair.every(Boolean);
  $('#combineForm').querySelector('button').disabled=!ready;
  $('#featureA').disabled=!ready;$('#featureB').disabled=!ready;
}
function makeDraggable(card,item){
  card.draggable=true;card.dataset.ideaId=item.id;
  card.ondragstart=e=>{
    if(state.busy||state.savedView){e.preventDefault();return;}
    e.dataTransfer.setData('application/x-reference-idea',item.id);e.dataTransfer.effectAllowed='copy';
    if($('#pairPanel').hidden)connectImages();card.classList.add('dragging-idea');
  };
  card.ondragend=()=>card.classList.remove('dragging-idea');
}
$('#connect').onclick=connectImages;


function referencePreview(item){
  if(item.kind==='reading'){const el=node('div',undefined,'reference-text');el.append(node('span',item.readingType),node('p',item.title));return el;}
  const img=node('img');img.src=item.image;img.alt=item.title;img.draggable=false;img.loading='lazy';return img;
}
const translationRequests=new Map();
async function koreanReading(item,card){
  if(item.readingType!=='논문')return;
  const original=item.originalTitle||item.title;
  if(/[가-힣\u3040-\u30ff\u3400-\u9fff]/.test(original)||!/[A-Za-z]/.test(original))return;
  item.originalTitle=original;
  const translate=value=>{
    if(!translationRequests.has(value))translationRequests.set(value,fetchJSON('/api/readings/translate?'+new URLSearchParams({text:value})).catch(()=>({text:value,translated:false})));
    return translationRequests.get(value);
  };
  const result=await translate(original);
  if(result.translated){item.title=result.text;item.translation='machine';}else item.translation='unavailable';
  if(item.description&&!item.originalDescription){
    item.originalDescription=item.description;
    const excerpt=await translate(item.description);
    if(excerpt.translated)item.description=excerpt.text;
  }
  if(card.isConnected){
    card.querySelector('h3').textContent=item.title;
    card.querySelector('.reading-open').setAttribute('aria-label',item.title+' 상세 보기');
    const excerpt=card.querySelector('.reading-excerpt');if(excerpt)excerpt.textContent=item.description;
    scheduleWall();
  }
}
function showReading(item){
  const body=$('#detailBody');body.replaceChildren(node('p',`${item.readingType} · ${item.provider}`),node('h3',item.title));
  if(item.originalTitle){body.append(node('p','원문 제목: '+item.originalTitle));body.append(node('p',item.translation==='machine'?'한국어 기계번역':item.translation==='unavailable'?'번역 연결이 지연되어 원문을 표시합니다.':'한국어 번역 중'));}
  if(item.description)body.append(node('p',item.description));
  body.append(node('p',[item.artist,item.date].filter(Boolean).join(' · ')),link('원문 읽기 ↗',item.source));$('#detail').showModal();
}
function readingCard(item,index){
  const card=node('article',undefined,'card reading-card');makeDraggable(card,item);const open=node('button',undefined,'reading-open');
  open.setAttribute('aria-label',item.title+' 상세 보기');open.onclick=()=>{if(!$('#pairPanel').hidden&&!state.savedView){selectPairItem(item);return;}showReading(item);};
  open.append(node('span',`${item.readingType}${item.relatedTopic?' · 연관 주제':''}`,'reading-kind'),node('h3',item.title));
  if(item.description)open.append(node('p',item.description,'reading-excerpt'));
  const save=node('button',saved.some(x=>x.id===item.id)?'✓':'+','save');save.setAttribute('aria-label',saved.some(x=>x.id===item.id)?'모은 레퍼런스 해제':'레퍼런스 모으기');save.onclick=()=>saveItem(item,save);
  open.append(node('p',[item.provider,item.date].filter(Boolean).join(' · '),'reading-source'));card.append(open,save);koreanReading(item,card);return card;
}
async function pickIdeas(previous){
  const recent=previous.map(x=>x.hash);
  
  if(!state.readingsLoaded){
    state.readingsLoaded=true;
    try{
      const query=state.query.replace(/\s+-\S+/g,'');
      const data=await fetchJSON('/api/readings/search?'+new URLSearchParams({q:state.keyword,en:query}));
      state.readings=uniqueImages(data.items);
      if(data.unavailable.length){$('#readingNotice').textContent=data.unavailable.join(', ')+' 연결이 지연돼 나머지 자료를 보여드려요.';$('#readingNotice').hidden=false;}
    }catch{$('#readingNotice').textContent='읽을거리 연결이 지연돼 이미지를 보여드려요.';$('#readingNotice').hidden=false;}
  }
  const batch=chooseIdeaBatch(state.pool,state.readings,state.seen,recent,state.wallTarget);
  const visual=batch.items.filter(x=>x.kind!=='reading'),reading=batch.items.filter(x=>x.kind==='reading');
  if(reading.length<2){$('#readingNotice').textContent='관련 읽을거리 후보가 부족해요.';$('#readingNotice').hidden=false;}
  return {items:mixWall(shuffleItems(visual),shuffleItems(reading),wallMetrics().columns),recycled:batch.recycled};
}
$('#contentMode').onchange=()=>{if(state.keyword&&!state.busy)search(state.keyword);};

function connectionCard(item){
  const card=node('article',undefined,'card connection-card');
  const images=node('div',undefined,'connection-thumbnails');
  for(const ref of item.references||[])images.append(referencePreview(ref));
  const open=node('button',undefined,'connection-open');open.setAttribute('aria-label','연결한 아이디어 상세 보기');
  open.append(images,node('h3',item.keyword),node('p',item.idea,'connection-text'));
  open.onclick=()=>{
    const body=$('#detailBody');body.replaceChildren();
    const pictures=images.cloneNode(true);body.append(pictures,node('h3',item.keyword),node('p',item.idea,'connection-text'));
    for(const ref of item.references||[])body.append(link(ref.title+' ↗',ref.source));
    $('#detail').showModal();
  };
  const remove=node('button','모아두기 해제','remove-connection');
  remove.onclick=()=>{saved=saved.filter(x=>x.id!==item.id);const ok=write('laya:saved:v1',saved);countSaved();render(saved);if(!saved.length)$('#empty').textContent='아직 모아둔 아이디어가 없어요.';if(!ok){$('#status').hidden=false;$('#status').textContent='저장 공간을 사용할 수 없어 이번 화면에서만 변경됩니다.';}};
  card.append(open,remove);return card;
}
$('#combineForm').onsubmit=e=>{
  e.preventDefault();if(!currentPair.every(Boolean))return;
  const expansion=expandPair(currentPair,[$('#featureA').value,$('#featureB').value]);
  $('#ideaResult').value=expansion.idea;
  $('#pairSelectionStatus').textContent='';
  const keywords=$('#expansionKeywords');keywords.replaceChildren();
  for(const keyword of expansion.keywords){
    const button=node('button',keyword+' ↗');button.type='button';
    button.setAttribute('aria-label',keyword+' 새 이미지 탐색');
    button.onclick=()=>search(keyword);keywords.append(button);
  }
  $('#combinationResult').hidden=false;$('#connectionStatus').textContent='';$('#saveConnection').textContent='아이디어 모아두기 +';
};
$('#ideaResult').oninput=()=>{$('#saveConnection').textContent='아이디어 모아두기 +';$('#connectionStatus').textContent='';};
$('#saveConnection').onclick=()=>{
  if(!currentPair.every(Boolean))return;const idea=$('#ideaResult').value.trim();if(!idea){$('#ideaResult').focus();return;}
  const id=connectionId||'connection-'+crypto.randomUUID();
  const item={id,kind:'connection',keyword:state.keyword,idea,references:currentPair.map(x=>({...x})),createdAt:new Date().toISOString()};
  const next=[item,...saved.filter(x=>x.id!==id)];
  if(!write('laya:saved:v1',next)){$('#connectionStatus').textContent='저장 공간이 부족해 보관하지 못했어요.';return;}
  saved=next;connectionId=id;countSaved();$('#saveConnection').textContent='모아뒀어요 ✓';$('#connectionStatus').textContent='';
};



$('#searchForm').onsubmit=e=>{e.preventDefault();search($('#keyword').value);};$('#shuffle').onclick=draw;document.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>search(b.dataset.query));$('#savedToggle').onclick=()=>{state.savedView=!state.savedView;countSaved();$('#shuffle').disabled=state.savedView;if(state.savedView){title('모아둔 레퍼런스',saved.length,true);render(saved);$('#status').textContent='이 브라우저에 저장된 작은 수집입니다. 이미지를 누르면 출처 정보를 확인할 수 있어요.';if(!saved.length)$('#empty').textContent='마음에 드는 이미지의 + 버튼을 눌러 모아보세요.';}else{title(state.keyword,state.batch.length);render(state.batch);$('#status').textContent='새 아이디어 뽑기로 발견을 이어가세요.';}};$('#closeDetail').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}};countSaved();$('#keyword').value=new URL(location.href).searchParams.get('q')||'';

createMoodboard(()=>saved);

let wallFrame=0,fillingWall=false;
function wallMetrics(){
  const grid=$('#grid'),mobile=innerWidth<=760;
  const sidebar=innerWidth>=1600?310:innerWidth>1100?278:235;
  const width=grid.clientWidth||Math.max(260,innerWidth-(mobile?36:sidebar+60));
  const top=grid.clientWidth?grid.getBoundingClientRect().top:(mobile?280:28);
  const height=Math.max(350,innerHeight-Math.max(0,top)+20);
  return {...wallSize(width,height),height};
}
function scheduleWall(){cancelAnimationFrame(wallFrame);wallFrame=requestAnimationFrame(()=>{if(!$('#grid').children.length)return;layoutWall($('#grid'),wallMetrics().columns);if(!state.busy&&!state.savedView)fillWall();});}
function fillWall(){
  if(fillingWall||state.savedView||!state.batch.length||document.body.classList.contains('drawing'))return;
  fillingWall=true;
  try{
    let minimum=layoutWall($('#grid'),wallMetrics().columns),rounds=0;
    while(minimum<wallMetrics().height&&state.batch.length<100&&rounds++<30){
      const extra=chooseIdeaBatch(state.pool,state.readings,state.seen,state.batch.map(x=>x.hash),wallMetrics().columns,state.batch).items;
      if(!extra.length)break;
      state.batch.push(...extra);remember(extra);render(state.batch);minimum=layoutWall($('#grid'),wallMetrics().columns);
    }
    if(minimum<wallMetrics().height){$('#readingNotice').hidden=false;$('#readingNotice').textContent='이미지 후보가 부족해 비율에 맞는 자료만 보여드려요.';}
  }finally{fillingWall=false;}
}
new ResizeObserver(()=>scheduleWall()).observe($('.results'));
