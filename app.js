import {createKoreanDisplay,displayTitle,needsKorean,translatePublicKorean} from './korean-display.js?v=ko-1';
import {createResultHistory,resultSignature} from './result-history.js?v=1';
import {createReferenceCache} from './reference-cache.js?v=archive-1';
import {createFlashlight} from './flashlight.js?v=stars-2';
import { playGuyIntro } from './guy-intro.js?v=moustache-1';
import { publicRequest } from './public-services.js?v=ko-sources-1';
import { createMixStudio } from './mix-studio.js?v=2';
import {koreanReadings,koreanSourceLinks} from './korean-sources.js?v=1';
import { wallSize, layoutWall, readingQuota, mixWall } from './idea-wall.js?v=viewport-1';
import { createMoodboard } from './moodboard.js?v=studio-1';
import { searchArena } from './arena.js?v=public-channels-1';
import { createDrawMachine } from './draw-machine.js?v=moustache-1';
import { shuffleItems, uniqueImages, chooseBatch, chooseSourceBatch, chooseIdeaBatch } from './selection.js?v=viewport-1';
const $ = s => document.querySelector(s);
const koreanDisplay=createKoreanDisplay({
 storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},
 translate:async value=>{try{return await translatePublicKorean(value);}catch{return publicRequest('/api/readings/translate?'+new URLSearchParams({text:value}));}}
});
const referenceCache=createReferenceCache();
const resultHistory=createResultHistory({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)});
let viewingHistory=false;
const flashlight=createFlashlight($('.results'),$('#grid'),$('#flashlightToggle'),$('#flashlightValue'));
const machine=createDrawMachine($('#drawStage'),$('#drawCanvas'),$('#drawHeading'),$('#drawMessage'));
playGuyIntro();
const pinterestPaused=window.PINTEREST_PAUSED===true;
const pinterestEnabled=!pinterestPaused&&window.REFERENCE_PROVIDER==='pinterest';
if(pinterestEnabled){$('#providerLabel').textContent='Images from Pinterest';const guide=$('.source-note a');guide.href='https://policy.pinterest.com/ko/copyright';}
const aliases = {'글래스모피즘':'glassmorphism','글라스모피즘':'glassmorphism','뉴모피즘':'neumorphism','치이카와':'chiikawa','치이카':'chiikawa','먼작귀':'chiikawa','치이카와 캐릭터':'chiikawa','여우':'red fox','기억':'memory','심리학':'psychology','뇌과학':'neuroscience','뇌':'brain','감정':'emotion','창의성':'creativity','바우하우스':'Bauhaus -concert -band -music -hardware -store','브루탈리즘':'brutalist architecture','식물':'botanical illustration','빈티지 포스터':'vintage poster -unveiling','도자기':'ceramics','건축':'architecture','타이포그래피':'typography','고양이':'cat','꽃':'flower','의자':'chair design','가구':'furniture','포스터':'poster','그래픽 디자인':'graphic design','추상':'abstract art','모더니즘':'modernism','정원':'garden','숲':'forest','바다':'sea','패턴':'pattern','직물':'textile','조각':'sculpture','일러스트':'illustration','미술':'painting'};
const read = (key, fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}};
const write = (key, value) => {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const state = {keyword:'',query:'',pool:[],seen:[],batch:[],continuation:null,exhausted:false,busy:false,savedView:false,arenaLoaded:false,pinterestPublicLoaded:false,webImagesLoaded:false,designLoaded:false,cosmosLoaded:false,sourceMessages:[],readings:[],readingsLoaded:false,wallTarget:10};
let includeForeign=read('ideation-guy:foreign-readings',false)===true;
let saved = read('laya:saved:v1',[]); if(!Array.isArray(saved)) saved=[];
const histories = read('laya:seen:v1',{});
let currentPair=[null,null],connectionId=null,activePairSlot=0,mixRound=0;
const text = html => {const doc=new DOMParser().parseFromString(String(html || ''),'text/html');return doc.body.textContent.replace(/\s+/g,' ').trim();};
const safeURL = url => {try{const u=new URL(String(url).startsWith('//')?'https:'+url:url);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const node = (tag, content, cls) => {const el=document.createElement(tag);if(content!==undefined)el.textContent=content;if(cls)el.className=cls;return el;};
function link(label, href){const a=node('a',label);a.href=safeURL(href);a.target='_blank';a.rel='noopener noreferrer';return a;}
function busy(value){state.busy=value;$('#grid').setAttribute('aria-busy',String(value));$('#shuffle').disabled=value||state.savedView;$('#searchButton').disabled=value;$('#contentMode').disabled=value;document.querySelectorAll('[data-query]').forEach(b=>b.disabled=value);$('#savedToggle').disabled=value;$('#boardToggle').disabled=value;updateHistoryButton();}
function countSaved(){$('#savedCount').textContent=saved.length;$('#savedLabel').textContent=state.savedView?'돌아가기 · 모아둔 것':'모아둔 것';}
function saveItem(item, button){const exists=saved.some(x=>x.id===item.id);saved=exists?saved.filter(x=>x.id!==item.id):[item,...saved];const ok=write('laya:saved:v1',saved);button.textContent=exists?'+':'✓';button.classList.toggle('active',!exists);button.setAttribute('aria-pressed',String(!exists));button.setAttribute('aria-label',exists?'레퍼런스 모으기':'모은 레퍼런스 해제');countSaved();if(!ok)$('#status').textContent='브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 모아둡니다.';if(state.savedView){render(saved);title('모아둔 레퍼런스',saved.length,true);if(!saved.length)$('#empty').textContent='마음에 드는 이미지의 + 버튼을 눌러 모아보세요.';}}
async function showDetail(item){await koreanDisplay.localize(item);if(item.kind==='reading'){showReading(item);return;}const body=$('#detailBody');body.replaceChildren();const img=node('img');img.src=item.image;img.alt=item.title;body.append(img,node('h3',item.title),node('p',`${item.provider==='Are.na'?'수집자':'작가'}: ${(item.artist || '원본에서 확인').replace(/^수집: /,'')} · ${item.license || '라이선스 원본에서 확인'}`));if(item.description)body.append(node('p',item.description));body.append(node('p','미리보기는 화면에 맞게 잘려 보일 수 있습니다. 작품을 이용하기 전에 원본의 출처와 라이선스 조건을 확인해주세요.'),link('원본 페이지 ↗',item.source));if(item.original&&safeURL(item.original))body.append(link('원작 출처 ↗',item.original));if(item.licenseURL)body.append(link(item.license,item.licenseURL));const copy=node('button','출처 정보 복사');copy.onclick=async()=>{try{await navigator.clipboard.writeText(`${item.title}\n${item.artist}\n${item.source}\n${item.license} ${item.licenseURL}`);copy.textContent='복사했어요 ✓';}catch{copy.textContent='복사할 수 없어요. 원본 링크를 이용해주세요.';}};body.append(node('br'),copy);$('#detail').showModal();}
function render(items){if($('#pairPanel').hidden)items=items.slice(0,wallMetrics().count);$('#ideaSpace').hidden=state.savedView||items.length<2;if(state.savedView){$('#pairPanel').hidden=true;currentPair=[null,null];}updateConnectButton();const grid=$('#grid');grid.replaceChildren();$('#empty').hidden=items.length>0;items.forEach((item,index)=>{if(item.kind!=='connection')void koreanItem(item);if(item.kind==='connection'){grid.append(connectionCard(item));return;}if(item.kind==='reading'){grid.append(readingCard(item,index));return;}const card=node('article',undefined,'card');makeDraggable(card,item);const wrap=node('div',undefined,'image-wrap');const open=node('button',undefined,'image-open');open.setAttribute('aria-label',`${item.title} 상세 보기`);open.onclick=()=>{if(!$('#pairPanel').hidden&&!state.savedView){selectPairItem(item);return;}showDetail(item);};const img=node('img');img.src=item.image;img.alt=item.title;img.draggable=false;img.loading='eager';img.style.aspectRatio=String(item.aspectRatio||4/3);img.onload=()=>{if(['public-image-search','public-design'].includes(item.providerMode)&&img.naturalWidth&&img.naturalHeight){item.aspectRatio=img.naturalWidth/img.naturalHeight;img.style.aspectRatio=String(item.aspectRatio);}scheduleWall();};img.decoding='async';img.onerror=()=>{if(item.fallbackImage&&img.src!==item.fallbackImage){img.src=item.fallbackImage;return;}open.replaceChildren(node('span','미리보기를 불러오지 못했어요.\n눌러서 출처를 확인하세요.','broken-label'));};open.append(img);const b=node('button',saved.some(x=>x.id===item.id)?'✓':'+','save');b.classList.toggle('active',saved.some(x=>x.id===item.id));b.setAttribute('aria-pressed',String(saved.some(x=>x.id===item.id)));b.setAttribute('aria-label',saved.some(x=>x.id===item.id)?'모은 레퍼런스 해제':'레퍼런스 모으기');b.onclick=()=>saveItem(item,b);wrap.append(open,node('span',String(index+1).padStart(2,'0'),'number'),b);const title=node('h3',item.title);title.title=item.title;const credit=node('p',item.artist||'작가 정보는 원본에서 확인','credit');credit.title=item.artist;const links=node('div',undefined,'card-links');links.append(link(item.license||'이용 조건 확인',item.licenseURL||item.source),link('원본 ↗',item.source));card.append(wrap,title,credit,links);grid.append(card);});scheduleWall();}
function loading(){$('#pairPanel').hidden=true;$('#status').hidden=true;$('#ideaSpace').hidden=true;const grid=$('#grid');grid.replaceChildren();$('#empty').hidden=true;for(let i=0;i<10;i++){const c=node('div',undefined,'card skeleton');c.append(node('div',undefined,'image-wrap'));grid.append(c);}}
function withoutPausedPinterest(data){if(pinterestPaused&&Array.isArray(data.items))data.items=data.items.filter(item=>!/^pinterest/i.test(item.provider||'')&&!/pinterest|pinimg\.com/i.test((item.source||'')+' '+(item.image||'')));return data;}
async function fetchJSON(url){if(pinterestPaused&&url.startsWith('/api/pinterest/'))throw new Error('Pinterest 연결이 일시 중지되어 있습니다.');const path=url;const remote=url.startsWith('/api/')&&window.REFERENCE_API_BASE;if(remote)url=window.REFERENCE_API_BASE.replace(/\/$/,'')+url;else if(url.startsWith('/api/')&&window.REFERENCE_STATIC_HOST)return withoutPausedPinterest(await publicRequest(url));try{const response=await fetch(url,{signal:AbortSignal.timeout(22000)});const data=await response.json();if(!response.ok||data.error)throw new Error(typeof data.error==='string'?data.error:'검색 서비스 연결이 잠시 원활하지 않습니다.');return withoutPausedPinterest(data);}catch(error){if(remote&&/^\/api\/(design\/search|readings\/(search|translate)|search\/resolve)/.test(path))return withoutPausedPinterest(await publicRequest(path));throw error;}}
const expansionTerms={'위장':'camouflage','적응':'adaptation','야생':'wildlife','고요':'minimalism','보호':'shelter','계절':'season','성장':'growth','반복':'repetition','유기적 형태':'organic form','지각':'perception','연결':'connection','구조':'structure','경계':'boundary','공간':'architecture','흐름':'flow','반사':'reflection','리듬':'rhythm','대비':'contrast','배치':'composition','시각 언어':'visual language','질감':'texture','시각 디자인':'graphic design'};
async function resolveKeyword(keyword){const terms=Object.keys(expansionTerms).sort((a,b)=>b.length-a.length);if(terms.some(term=>keyword.includes(term))){let translated=keyword;for(const term of terms)translated=translated.replaceAll(term,expansionTerms[term]);for(const [term,en] of Object.entries(aliases))translated=translated.replaceAll(term,en);if(!/[가-힣]/.test(translated))return translated;}if(aliases[keyword])return aliases[keyword];if(!/[가-힣]/.test(keyword))return keyword;try{const p=new URLSearchParams({action:'wbsearchentities',search:keyword,language:'ko',uselang:'en',limit:'5',format:'json',origin:'*'});const d=await fetchJSON('https://www.wikidata.org/w/api.php?'+p);const match=d.search?.find(x=>x.match?.text?.toLowerCase()===keyword.toLowerCase());if(match?.label)return match.label;}catch{}try{const d=await fetchJSON('/api/search/resolve?'+new URLSearchParams({q:keyword}));if(d.query)return d.query;}catch{}return keyword;}
async function loadPage(){const jobs=[];const params=new URLSearchParams({q:state.keyword,en:state.query.replace(/\s+-\S+/g,'')});
if(location.protocol!=='file:'&&!state.designLoaded){state.designLoaded=true;jobs.push(fetchJSON('/api/design/search?'+params).then(data=>{state.pool=uniqueImages([...state.pool,...(data.items||[])]);for(const d of data.diagnostics||[])state.sourceMessages.push(d.provider+' '+d.count+'개'+(d.status==='unavailable'?' (응답 없음)':''));}).catch(()=>state.sourceMessages.push('디자인 수집 연결 지연')));}
if(location.protocol!=='file:'&&!state.webImagesLoaded){state.webImagesLoaded=true;jobs.push(fetchJSON('/api/images/search?'+params).then(data=>{state.pool=uniqueImages([...state.pool,...(data.items||[])]);state.sourceMessages.push('키워드 이미지 검색 '+data.items.length+'개');}).catch(()=>state.sourceMessages.push('키워드 이미지 검색 연결 지연')));}
if(!pinterestPaused&&window.PINTEREST_PUBLIC_ENABLED&&!pinterestEnabled&&!state.pinterestPublicLoaded){state.pinterestPublicLoaded=true;jobs.push(fetchJSON('/api/pinterest/public-search?'+params).then(data=>{state.pool=uniqueImages([...state.pool,...(data.items||[])]);state.sourceMessages.push(data.items.length?'Pinterest 공개 페이지 '+data.items.length+'개':'Pinterest 공개 페이지 메타데이터 없음');}).catch(()=>state.sourceMessages.push('Pinterest 공개 페이지 응답 없음')));}
if(!state.arenaLoaded){state.arenaLoaded=true;jobs.push(searchArena(state.keyword,state.query,fetchJSON).then(d=>{state.pool=uniqueImages([...state.pool,...d.items]);state.sourceMessages.push(`Are.na ${d.scope==='all'?'전체 검색':'공개 채널 검색'} ${d.items.length}개${d.partial?' (일부 응답 없음)':''}`);}).catch(error=>state.sourceMessages.push(error.message||'Are.na 연결 지연')));}
if(!state.cosmosLoaded){state.cosmosLoaded=true;jobs.push(fetchJSON('/api/cosmos/search?'+params).then(d=>{state.pool=uniqueImages([...state.pool,...(d.items||[])]);state.sourceMessages.push('Cosmos 공개 검색 '+(d.items||[]).length+'개');}).catch(()=>state.sourceMessages.push('Cosmos 공개 검색 응답 없음')));}
await Promise.all(jobs);
if(pinterestEnabled){const p=new URLSearchParams({q:state.query});if(state.continuation)p.set('bookmark',state.continuation);const d=await fetchJSON('/api/pinterest/search?'+p);state.pool=uniqueImages([...state.pool,...d.items]);state.continuation=d.bookmark||null;state.exhausted=!d.bookmark;return;}const p=new URLSearchParams({action:'query',generator:'search',gsrsearch:state.query,gsrnamespace:'6',gsrlimit:'50',prop:'imageinfo',iiprop:'url|extmetadata|sha1|size|mime',iiurlwidth:'640',format:'json',origin:'*',formatversion:'2'});if(state.continuation)Object.entries(state.continuation).forEach(([k,v])=>p.set(k,v));const data=await fetchJSON('https://commons.wikimedia.org/w/api.php?'+p).catch(()=>{state.sourceMessages.push('Commons 응답 지연');return {};});const found=(data.query?.pages||[]).sort((a,b)=>(a.index||0)-(b.index||0)).flatMap(page=>{const info=page.imageinfo?.[0];if(!info||!/^image\/(jpeg|png|webp|svg\+xml)$/.test(info.mime)||!info.thumburl||info.width<200||info.height<200)return [];const m=info.extmetadata||{};const source=safeURL(info.descriptionurl);const image=safeURL(info.thumburl);if(!source||!image)return [];return [{aspectRatio:info.width/info.height,id:String(page.pageid),hash:info.sha1||info.url,image,source,title:text(m.ObjectName?.value)||page.title.replace(/^File:/,'').replace(/_/g,' '),artist:text(m.Artist?.value)||text(m.Credit?.value),description:text(m.ImageDescription?.value).slice(0,700),license:text(m.LicenseShortName?.value),licenseURL:safeURL(m.LicenseUrl?.value)}];}).filter(item=>{const terms=state.query.replace(/\s+-\S+/g,'').toLowerCase().split(/\s+/).filter(x=>x.length>2);const content=(item.title+' '+item.description).toLowerCase();return !terms.length||terms.some(t=>content.includes(t));});state.pool=uniqueImages([...state.pool,...found]);state.continuation=data.continue||null;state.exhausted=!data.continue;}
function title(label,n,savedMode=false){$('#resultLabel').textContent=savedMode?'YOUR LITTLE COLLECTION':'YOUR NEXT INSPIRATION';$('#resultTitle').replaceChildren(document.createTextNode(label+' '),node('span',`· ${n}${savedMode?'개':'가지'}`));}
function remember(items){state.seen=[...new Set([...state.seen,...items.map(x=>x.hash)])].slice(-2000);histories[state.query.toLowerCase()]=state.seen;const keys=Object.keys(histories);if(keys.length>30)delete histories[keys[0]];write('laya:seen:v1',histories);}
async function draw(){if(state.busy||state.savedView)return;if(state.batch.length)resultHistory.record(state.keyword,state.batch);const restoredDraw=state.restored;viewingHistory=false;$('#pairPanel').hidden=true;updateConnectButton();if(state.restored)machine.stop();else machine.start(state.keyword);busy(true);const previous=state.batch;if(!previous.length)loading();$('#status').textContent='키워드와 관련된 이미지 사이에서 한 화면을 채울 새로운 아이디어를 고르고 있어요…';try{if(state.restored){state.restored=false;await loadPage();}let unused=state.pool.filter(x=>!state.seen.includes(x.hash));let pages=0;while(unused.length<80&&!state.exhausted&&pages<3){await loadPage();pages++;unused=state.pool.filter(x=>!state.seen.includes(x.hash));}state.wallTarget=wallMetrics().count;const {items,recycled}=await pickIdeas(previous);await machine.finish(items.length);state.batch=items;remember(items);render(items);fillWall();resultHistory.record(state.keyword,state.batch);updateHistoryButton();if(!restoredDraw)flashlight.preview();void referenceCache.save(state.keyword,{query:state.query,pool:state.pool,readings:state.readings});title(state.keyword,items.length);const sourceSummary=state.sourceMessages.join(' · ')+' · ';const translation=state.query!==state.keyword?`검색어: ${state.query} · `:'';$('#providerLabel').textContent=(pinterestEnabled?'Pinterest':'Wikimedia Commons')+' · '+state.sourceMessages.join(' · ');$('#status').textContent=items.length?`${sourceSummary}${translation}후보 ${state.pool.length}개 · ${recycled?'보지 않은 후보가 부족해 이전 결과 일부를 다시 골랐어요.':`새로 뽑은 이미지${items.length<10?' 새로운 후보가 부족해 '+items.length+'개를 보여드립니다.':''}`}`:`${sourceSummary}${translation}연결된 수집 경로에서 이미지를 받지 못했습니다. 원본 사이트의 검색 결과가 없다는 뜻은 아닙니다.`;if(items.length){$('#status').hidden=false;$('#status').textContent=`‘${state.keyword}’에서 찾은 영감 · ${state.batch.length}가지`;}if(!items.length){$('#status').hidden=false;}if(!items.length){const empty=$('#empty');empty.replaceChildren(node('p','현재 연결에서는 결과를 가져오지 못했어요. 원본 검색을 열어 확인할 수 있습니다.'));empty.append(link('Pinterest에서 검색 ↗','https://www.pinterest.com/search/pins/?'+new URLSearchParams({q:state.keyword})),node('br'),link('Are.na에서 검색 ↗','https://www.are.na/search?'+new URLSearchParams({q:JSON.stringify({term:{facet:state.keyword}})})),node('br'),link('Cosmos에서 검색 ↗','https://www.cosmos.so/search/elements/'+encodeURIComponent(state.keyword)));}}catch(error){$('#status').hidden=false;await machine.finish(0);render(previous);title(state.keyword,previous.length);$('#status').textContent=`${error.name==='TimeoutError'?'검색 응답이 늦어지고 있어요.':error.message} 다시 시도해주세요.`;if(!previous.length){$('#empty').replaceChildren(node('p','검색 연결을 확인한 뒤 다시 시도해주세요.'));const retry=node('button','다시 시도');retry.onclick=draw;$('#empty').append(retry);}}finally{machine.stop();busy(false);}}
async function search(keyword){if(state.busy)return;keyword=keyword.trim().replace(/[\u0000-\u001f]/g,'').slice(0,100);if(!keyword)return;if(state.batch.length)resultHistory.record(state.keyword,state.batch);viewingHistory=false;machine.start(keyword);flashlight.clear();$('.results').hidden=false;$('#savedToggle').hidden=false;state.savedView=false;countSaved();state.keyword=keyword;$('#resultTitle').textContent=keyword;state.pool=[];state.batch=[];state.continuation=null;state.exhausted=false;state.arenaLoaded=false;state.pinterestPublicLoaded=false;state.webImagesLoaded=false;state.designLoaded=false;state.cosmosLoaded=false;state.sourceMessages=[];state.readings=[];state.readingsLoaded=false;$('#readingNotice').hidden=true;$('#cosmosSearch').href='https://www.cosmos.so/search/elements/'+encodeURIComponent(keyword);$('#keyword').value=keyword;busy(true);loading();$('#status').textContent='검색어를 확인하고 있어요…';const restored=!pinterestEnabled?await referenceCache.get(keyword):null;state.query=pinterestEnabled?keyword:restored?.query||await resolveKeyword(keyword);state.seen=Array.isArray(histories[state.query.toLowerCase()])?histories[state.query.toLowerCase()]:[];if(restored?.pool?.length){state.pool=withoutPausedPinterest({items:restored.pool}).items;state.readings=koreanReadings(restored.readings||[],includeForeign);state.restored=true;state.batch=chooseIdeaBatch(state.pool,state.readings,[],[],wallMetrics().count).items;render(state.batch);resultHistory.record(keyword,state.batch);updateHistoryButton();flashlight.preview();title(keyword,state.batch.length);$('#status').hidden=false;$('#status').textContent='저장된 자료를 먼저 보여드려요. 새 자료를 확인하고 있어요…';state.sourceMessages.push('이 브라우저에 누적된 이미지 '+state.pool.length+'개');}else state.restored=false;busy(false);const u=new URL(location.href);u.searchParams.set('q',keyword);history.replaceState(null,'',u);await draw();}

function connectImages(){
  if(state.busy||state.batch.length<2)return;
  $('#pairPanel').hidden=false;updateConnectButton();renderPairSlots();scheduleWall();
  $('.results').scrollTo({top:0,behavior:'smooth'});
}
function resetPairResult(){mixRequest++;connectionId=null;mixRound=0;$('#mixDialog').close();mixStudio.invalidate();}
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
function updateConnectButton(){const open=!$('#pairPanel').hidden;$('#connectLabel').textContent=open?'두 장 연결 닫기':'두 장 연결하기';$('#connectIcon').textContent=open?'×':'↗';$('#connect').setAttribute('aria-expanded',String(open));}
$('#connect').onclick=()=>{if($('#pairPanel').hidden)connectImages();else{$('#pairPanel').hidden=true;updateConnectButton();scheduleWall();}};


function referencePreview(item){
  if(item.kind==='reading'){const el=node('div',undefined,'reference-text');void koreanDisplay.localize(item).then(()=>{if(el.isConnected)el.querySelector('p').textContent=item.title;});el.append(node('span',item.readingType),node('p',displayTitle(item)));return el;}
  const img=node('img');img.src=item.image;img.alt=displayTitle(item);img.draggable=false;img.loading='lazy';return img;
}
async function koreanItem(item,card){
  await koreanDisplay.localize(item);
  const target=card?.isConnected?card:[...$('#grid').children].find(el=>el.dataset.ideaId===item.id);
  if(target?.isConnected){
    const heading=target.querySelector('h3');if(heading){heading.textContent=item.title;heading.title=item.title;}
    const open=target.querySelector('.reading-open,.image-open');if(open)open.setAttribute('aria-label',item.title+' 상세 보기');
    const excerpt=target.querySelector('.reading-excerpt');if(excerpt)excerpt.textContent=item.description;
    const image=target.querySelector('img');if(image)image.alt=item.title;
    scheduleWall();
  }
  if(!$('#pairPanel').hidden&&currentPair.some(ref=>ref===item))renderPairSlots();
}
async function showReading(item){await koreanDisplay.localize(item);
  const body=$('#detailBody');body.replaceChildren(node('p',`${item.readingType} · 한국어 자료`),node('h3',item.title));
  if(item.originalTitle)body.append(node('p',item.translation==='machine'?'한국어 기계번역':'한국어 번역을 준비하지 못했어요. 원문 링크에서 확인해주세요.'));
  if(item.description)body.append(node('p',item.description));
  body.append(node('p',item.date||''),link('출처와 원문 확인 ↗',item.source));$('#detail').showModal();
}
function readingCard(item,index){
  const card=node('article',undefined,'card reading-card');makeDraggable(card,item);const open=node('button',undefined,'reading-open');
  open.setAttribute('aria-label',item.title+' 상세 보기');open.onclick=()=>{if(!$('#pairPanel').hidden&&!state.savedView){selectPairItem(item);return;}showReading(item);};
  open.append(node('span',`${item.readingType}${item.relatedTopic?' · 연관 주제':''}`,'reading-kind'),node('h3',item.title));
  if(item.description)open.append(node('p',item.description,'reading-excerpt'));
  const save=node('button',saved.some(x=>x.id===item.id)?'✓':'+','save');save.setAttribute('aria-label',saved.some(x=>x.id===item.id)?'모은 레퍼런스 해제':'레퍼런스 모으기');save.onclick=()=>saveItem(item,save);
  open.append(node('p',[needsKorean(item.provider)?(item.readingType==='논문'?'학술 자료':'자료 출처'):item.provider,item.date].filter(Boolean).join(' · '),'reading-source'));card.append(open,save);koreanItem(item,card);return card;
}
async function pickIdeas(previous){
  const recent=previous.map(x=>x.hash);

  if(!state.readingsLoaded){
    state.readingsLoaded=true;
    try{
      const query=state.query.replace(/\s+-\S+/g,'');
      const koQuery=/[가-힣]/.test(state.keyword)?state.keyword:await koreanDisplay.text(state.keyword);
      const data=await publicRequest('/api/readings/search?'+new URLSearchParams({q:koQuery,en:query,lang:'ko'}));
      let items=data.items||[];
      if(includeForeign){const extra=await fetchJSON('/api/readings/search?'+new URLSearchParams({q:state.keyword,en:query}));items.push(...(extra.items||[]));}
      state.readings=uniqueImages(koreanReadings([...items,...state.readings],includeForeign));
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
  if(item.image){const preview=node('img');preview.src=item.image;preview.alt=item.keyword;preview.className='studio-saved-preview';images.append(preview);}else for(const ref of item.references||[])images.append(referencePreview(ref));
  const open=node('button',undefined,'connection-open');open.setAttribute('aria-label','연결한 아이디어 상세 보기');
  open.append(images,node('h3',item.keyword),node('p',item.idea,'connection-text'));
  open.onclick=()=>{
    const body=$('#detailBody');body.replaceChildren();
    const pictures=images.cloneNode(true);body.append(pictures,node('h3',item.keyword),node('p',item.idea,'connection-text'));
    for(const ref of item.references||[])body.append(link(ref.title+' ↗',ref.source));
    if(item.studio){const edit=node('button','제작실에서 수정');edit.onclick=async()=>{$('#detail').close();$('#mixDialog').showModal();await mixStudio.open(item.references,item.keyword,[],item.studio);};body.append(edit);}
    $('#detail').showModal();
  };
  const remove=node('button','모아두기 해제','remove-connection');
  remove.onclick=()=>{saved=saved.filter(x=>x.id!==item.id);const ok=write('laya:saved:v1',saved);countSaved();render(saved);if(!saved.length)$('#empty').textContent='아직 모아둔 아이디어가 없어요.';if(!ok){$('#status').hidden=false;$('#status').textContent='저장 공간을 사용할 수 없어 이번 화면에서만 변경됩니다.';}};
  card.append(open,remove);return card;
}
let mixRequest=0;
const mixStudio=createMixStudio($('#mixStudio'),{
 save:async draft=>{
  const id='connection-'+crypto.randomUUID();
  const item={id,kind:'connection',keyword:draft.title,idea:draft.brief,image:draft.image,studio:draft.project,references:draft.references,createdAt:new Date().toISOString()};
  const next=[item,...saved];
  if(!write('laya:saved:v1',next))throw new Error('저장 공간이 부족해요. PNG로 저장해주세요.');
  saved=next;countSaved();return id;
 }
});
async function createIdeaMix(){
 if(!currentPair.every(Boolean))return;
 const request=++mixRequest,pair=[...currentPair];
 $('#pairSelectionStatus').textContent='제작실을 열고 있어요…';
 await Promise.all(pair.map(item=>koreanDisplay.localize(item)));
 if(request!==mixRequest||pair.some((item,i)=>item!==currentPair[i])||$('#pairPanel').hidden)return;
 $('#pairSelectionStatus').textContent='';
 if(!$('#mixDialog').open)$('#mixDialog').showModal();
 await mixStudio.open(pair,state.keyword,[$('#featureA').value,$('#featureB').value]);
 $('#mixDialog').scrollTop=0;
}
$('#combineForm').onsubmit=e=>{e.preventDefault();createIdeaMix();};
$('#closeMix').onclick=()=>$('#mixDialog').close();
$('#foreignReadings').checked=includeForeign;
$('#foreignReadings').onchange=()=>{includeForeign=$('#foreignReadings').checked;write('ideation-guy:foreign-readings',includeForeign);state.readings=koreanReadings(state.readings,includeForeign);state.readingsLoaded=false;$('#koreanSourcesDialog').close();if(state.keyword&&!state.busy)draw();};
$('#koreanSourcesToggle').onclick=()=>{
 const keyword=$('#keyword').value.trim()||state.keyword;
 $('#koreanSourcesQuery').textContent=keyword?'검색어 · '+keyword:'검색창에 찾고 싶은 단어를 입력해주세요.';
 const box=$('#koreanSourceLinks');box.replaceChildren();
 for(const source of koreanSourceLinks(keyword)){
  const a=link('',source.url);a.className='korean-source-card';a.append(node('strong',source.title),node('span',source.description),node('span','↗','tool-icon'));box.append(a);
 }
 $('#koreanSourcesDialog').showModal();
};
$('#closeKoreanSources').onclick=()=>$('#koreanSourcesDialog').close();

$('#searchForm').onsubmit=e=>{e.preventDefault();search($('#keyword').value);};$('#shuffle').onclick=()=>viewingHistory?search(state.keyword):draw();document.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>search(b.dataset.query));$('#savedToggle').onclick=()=>{state.savedView=!state.savedView;countSaved();$('#shuffle').disabled=state.savedView;if(state.savedView){title('모아둔 레퍼런스',saved.length,true);render(saved.slice(0,wallMetrics().count));flashlight.preview();$('#status').textContent='이 브라우저에 저장된 작은 수집입니다. 이미지를 누르면 출처 정보를 확인할 수 있어요.';if(!saved.length)$('#empty').textContent='마음에 드는 이미지의 + 버튼을 눌러 모아보세요.';}else{title(state.keyword,state.batch.length);render(state.batch);flashlight.preview();$('#status').textContent='새 아이디어 뽑기로 발견을 이어가세요.';}};$('#closeDetail').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}};countSaved();$('#keyword').value=new URL(location.href).searchParams.get('q')||'';

function previousResults(){const current=resultSignature(state.keyword,state.batch);return resultHistory.list().filter(entry=>entry.signature!==current);}
function updateHistoryButton(){const count=previousResults().length;$('#historyCount').textContent=String(count);$('#historyToggle').disabled=state.busy||!count;}
function restoreResult(entry){
 if(state.busy)return;
 machine.stop();flashlight.clear();$('#mixDialog').close();$('#pairPanel').hidden=true;updateConnectButton();state.savedView=false;viewingHistory=true;
 state.keyword=entry.keyword;state.batch=entry.items.map(item=>({...item}));$('#keyword').value=entry.keyword;$('.results').hidden=false;
 $('#savedToggle').hidden=false;$('#shuffle').disabled=false;countSaved();render(state.batch);title(entry.keyword,state.batch.length);flashlight.preview();updateHistoryButton();
 const url=new URL(location.href);url.searchParams.set('q',entry.keyword);history.replaceState(null,'',url);$('#historyDialog').close();
}
$('#historyToggle').onclick=()=>{
 const list=$('#historyList');list.replaceChildren();
 for(const entry of previousResults()){
  const button=node('button',undefined,'history-entry');button.type='button';
  const previews=node('div',undefined,'history-previews');for(const item of entry.items.slice(0,4))previews.append(referencePreview(item));
  const info=node('div',undefined,'history-info');info.append(node('span',entry.keyword),node('small',new Date(entry.createdAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' · '+entry.items.length+'개'));
  button.append(previews,info,node('span','↗','tool-icon'));button.setAttribute('aria-label',entry.keyword+' 지난 결과 '+entry.items.length+'개 다시 보기');button.onclick=()=>restoreResult(entry);list.append(button);
 }
 $('#historyDialog').showModal();
};
$('#closeHistory').onclick=()=>$('#historyDialog').close();updateHistoryButton();
createMoodboard(()=>saved,item=>koreanDisplay.localize(item),async item=>{$('#mixDialog').showModal();await mixStudio.open(item.references,item.keyword,[],item.studio);$('#mixDialog').scrollTop=0;});

let wallFrame=0,fillingWall=false;
function wallMetrics(){
  const grid=$('#grid'),mobile=innerWidth<=760;
  const sidebar=innerWidth>=1600?310:innerWidth>1100?278:235;
  const width=grid.clientWidth||Math.max(260,innerWidth-(mobile?36:sidebar+60));
  const top=grid.clientWidth?grid.getBoundingClientRect().top:(mobile?280:28);
  const results=grid.closest('.results'),reserve=parseFloat(getComputedStyle(results).paddingBottom)||0;
  const height=Math.max(80,Math.min(innerHeight,results.getBoundingClientRect().bottom||innerHeight)-Math.max(0,top)-reserve);
  const fullHeight=Math.max(80,results.getBoundingClientRect().height-(parseFloat(getComputedStyle(results).paddingTop)||0)-reserve);
  return {...wallSize(width,$('#pairPanel').hidden?height:fullHeight),height};
}
function scheduleWall(){cancelAnimationFrame(wallFrame);wallFrame=requestAnimationFrame(()=>{if(!$('#grid').children.length)return;layoutWall($('#grid'),wallMetrics().columns,20,wallMetrics().height);if(!state.busy&&!state.savedView&&!viewingHistory&&$('#pairPanel').hidden)fillWall();});}
function fillWall(){
  if(fillingWall||viewingHistory||!$('#pairPanel').hidden||state.savedView||!state.batch.length||document.body.classList.contains('drawing'))return;
  fillingWall=true;
  try{
    const metrics=wallMetrics();state.wallTarget=metrics.count;
    if(state.batch.length>metrics.count){if($('#grid').children.length!==metrics.count)render(state.batch);}
    else if(state.batch.length<metrics.count){
      const extra=chooseIdeaBatch(state.pool,state.readings,state.seen,state.batch.map(x=>x.hash),metrics.count-state.batch.length,state.batch).items;
      if(extra.length){state.batch.push(...extra);remember(extra);render(state.batch);}
    }
    layoutWall($('#grid'),metrics.columns,20,metrics.height);
    if(!state.busy){$('#status').textContent=`‘${state.keyword}’에서 찾은 영감 · ${state.batch.length}가지`;}
  }finally{fillingWall=false;}
}
new ResizeObserver(()=>scheduleWall()).observe($('.results'));
