import {isKoreanOriginal} from './korean-sources.js?v=1';
// Browser-accessible public APIs for GitHub Pages. No credentials are embedded.
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const https=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'';}catch{return '';}};
export const relevant=(title,query)=>{const tokens=query.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];return tokens.length>0&&tokens.every(t=>title.toLowerCase().includes(t));};
const reading=(type,title,source,provider,description='',date='')=>({id:'reading-'+source,hash:source,image:'text:'+source,kind:'reading',readingType:type,title:clean(title),source,provider,description:clean(description).slice(0,220),date,artist:provider,license:'원문 이용 조건 확인',licenseURL:''});
async function previewWorks(url){if(typeof Image==='undefined')return true;return new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve(false),4000);img.onload=()=>{clearTimeout(timer);resolve(true);};img.onerror=()=>{clearTimeout(timer);resolve(false);};img.src=url;});}
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw new Error('공개 API 응답 지연');return r.json();}
export async function publicRequest(path){
 const url=new URL(path,'https://local.invalid'),p=url.searchParams,q=p.get('q')||'',en=p.get('en')||q;
 if(url.pathname==='/api/search/resolve') {const d=await get('https://api.mymemory.translated.net/get?'+new URLSearchParams({q,langpair:'ko|en'}));return {query:d.responseStatus===200?clean(d.responseData?.translatedText)||q:q};}
 if(url.pathname==='/api/readings/translate') {const value=p.get('text')||'';if(new TextEncoder().encode(value).length>500)return {text:value,translated:false};const d=await get('https://api.mymemory.translated.net/get?'+new URLSearchParams({q:value,langpair:'en|ko'}));const valueKo=clean(d.responseData?.translatedText);return {text:d.responseStatus===200&&valueKo?valueKo:value,translated:d.responseStatus===200&&!!valueKo&&valueKo!==value};}
 if(url.pathname==='/api/design/search') {
  const d=await get('https://api.artic.edu/api/v1/artworks/search?'+new URLSearchParams({q:en,limit:'50',fields:'id,title,image_id,artist_display,is_public_domain,thumbnail'})).catch(()=>({data:[]}));
  const items=(d.data||[]).filter(x=>x.image_id&&x.is_public_domain&&x._score>1).map(x=>({id:'artic-'+x.id,hash:'artic-'+x.image_id,image:'https://www.artic.edu/iiif/2/'+encodeURIComponent(x.image_id)+'/full/843,/0/default.jpg',source:'https://www.artic.edu/artworks/'+x.id,title:x.title,artist:x.artist_display,description:x.thumbnail?.alt_text||'',aspectRatio:x.thumbnail?.width/x.thumbnail?.height||1,provider:'Art Institute of Chicago',providerMode:'public-design',license:'Public domain · CC0',licenseURL:'https://www.artic.edu/open-access/open-access-images'}));
  const diagnostics=[];const output=[];
  const loaded=await Promise.all(items.map(x=>previewWorks(x.image)));const valid=items.filter((x,i)=>loaded[i]);output.push(...valid);diagnostics.push({provider:'Art Institute of Chicago',count:valid.length,status:valid.length||!items.length?'ok':'unavailable'});
  try{
   const search=await get('https://collectionapi.metmuseum.org/public/collection/v1.1/search?'+new URLSearchParams({q:en,hasImages:'true',title:'true',limit:'50'}));
   const ids=(search.objectIDs||[]).slice(0,50);const works=[];
   for(let n=0;n<ids.length;n+=8){const batch=await Promise.allSettled(ids.slice(n,n+8).map(id=>get('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+id)));for(const r of batch)if(r.status==='fulfilled'&&r.value.isPublicDomain&&https(r.value.primaryImageSmall))works.push(r.value);}
   const met=works.map(x=>({id:'met-'+x.objectID,hash:x.primaryImage,image:x.primaryImageSmall,source:https(x.objectURL)||'https://www.metmuseum.org/art/collection/search/'+x.objectID,title:x.title,artist:x.artistDisplayName,description:x.medium,provider:'The Metropolitan Museum of Art',providerMode:'public-design',license:'Public domain · CC0',licenseURL:'https://www.metmuseum.org/about-the-met/policies-and-documents/open-access'}));
   const loadedMet=await Promise.all(met.map(x=>previewWorks(x.image)));const validMet=met.filter((x,i)=>loadedMet[i]);output.push(...validMet);diagnostics.push({provider:'The Met',count:validMet.length,status:validMet.length||!met.length?'ok':'unavailable'});
  }catch{diagnostics.push({provider:'The Met',count:0,status:'unavailable'});}
  return {items:output,diagnostics};
 }
 if(url.pathname==='/api/readings/search') {
  const native=p.get('lang')==='ko';
  const language=native||/[가-힣]/.test(q)?'ko':'en';
  const term=native?q:en;
  const wiki='https://'+language+'.wikipedia.org/w/api.php?'+new URLSearchParams({action:'query',generator:'search',gsrsearch:'intitle:'+q,gsrlimit:'8',prop:'extracts|info',inprop:'url',exintro:'1',explaintext:'1',exchars:'300',exlimit:'max',format:'json',formatversion:'2',origin:'*'});
  const cross='https://api.crossref.org/works?'+new URLSearchParams({'query.title':term,filter:'type:journal-article',rows:native?'25':'12',select:'DOI,title,container-title,published'});
  const results=await Promise.allSettled([get(wiki),get(cross)]),items=[],unavailable=[];
  if(results[0].status==='fulfilled')for(const x of results[0].value.query?.pages||[]){if(https(x.fullurl))items.push(reading('백과',x.title,x.fullurl,'위키백과',x.extract));}else unavailable.push('위키백과');
  if(results[1].status==='fulfilled')for(const x of results[1].value.message?.items||[]){if(x.DOI&&x.title?.[0]&&relevant(x.title[0],term))items.push(reading('논문',x.title[0],'https://doi.org/'+x.DOI.toLowerCase(),x['container-title']?.[0]||'Crossref','',(x.published?.['date-parts']?.[0]||[]).join('-')));}else unavailable.push('Crossref');
  return {items:native?items.filter(isKoreanOriginal):items,unavailable};
 }
 if(['/api/images/search','/api/pinterest/public-search'].includes(url.pathname))return {items:[]};
 if(url.pathname==='/api/arena/search')throw new Error('Are.na 전체 검색은 인증 서버 연결 후 사용할 수 있습니다.');
 throw new Error('이 기능은 인증 서버 연결 후 사용할 수 있습니다.');
}
