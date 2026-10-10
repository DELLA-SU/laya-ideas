// Device-local fallback while the shared collector is unavailable or refreshing.
// Stores preview metadata, not image files, credentials, memos or visitor identity.
const MAX_ITEMS=240,MAX_QUERIES=50,TTL=30*86400000;
export const keywordKey=value=>String(value).normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const https=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
const identity=item=>item.kind==='reading'?item.source:item.hash||item.image;
export function mergeReferences(fresh=[],previous=[]){
 const seen=new Set();return [...fresh,...previous].filter(item=>{
  if(!item||!https(item.source)||!item.title||(!https(item.image)&&item.kind!=='reading'))return false;
  const key=identity(item);if(!key||seen.has(key))return false;seen.add(key);return true;
 }).slice(0,MAX_ITEMS).map(item=>{
  const result={};for(const key of ['id','hash','title','image','fallbackImage','source','provider','providerMode','description','aspectRatio','artist','license','licenseURL','kind','readingType','date','originalTitle','originalDescription','translation'])if(item[key]!==undefined)result[key]=typeof item[key]==='string'?item[key].slice(0,key==='description'||key==='originalDescription'?700:2000):item[key];return result;
 });
}
export function createReferenceCache(storage=globalThis.indexedDB){
 let connection;
 function open(){if(!storage)return Promise.resolve(null);if(!connection)connection=new Promise(resolve=>{
  const request=storage.open('ideation-reference-cache',1);request.onupgradeneeded=()=>request.result.createObjectStore('queries',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);
 });return connection;}
 async function get(keyword){try{const db=await open();if(!db)return null;return await new Promise(resolve=>{const r=db.transaction('queries').objectStore('queries').get(keywordKey(keyword));r.onsuccess=()=>resolve(r.result&&Date.now()-r.result.updatedAt<TTL?r.result:null);r.onerror=()=>resolve(null);});}catch{return null;}}
 async function save(keyword,value){try{
  const previous=await get(keyword),pool=mergeReferences(value.pool,previous?.pool),readings=mergeReferences(value.readings,previous?.readings);if(!pool.length)return false;
  const db=await open();if(!db)return false;
  const record={key:keywordKey(keyword),query:value.query,pool,readings,updatedAt:Date.now()};
  return await new Promise(resolve=>{
   const tx=db.transaction('queries','readwrite'),store=tx.objectStore('queries');store.put(record);
   const all=store.getAll();all.onsuccess=()=>{const sorted=all.result.sort((a,b)=>b.updatedAt-a.updatedAt);for(const r of sorted)if(Date.now()-r.updatedAt>=TTL||sorted.indexOf(r)>=MAX_QUERIES)store.delete(r.key);};
   tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);
  });
 }catch{return false;}}
 async function stats(){try{const db=await open();if(!db)return {queries:0,images:0};return await new Promise(resolve=>{const r=db.transaction('queries').objectStore('queries').getAll();r.onsuccess=()=>{const records=r.result.filter(x=>Date.now()-x.updatedAt<TTL);resolve({queries:records.length,images:records.reduce((n,r)=>n+r.pool.length,0)});};r.onerror=()=>resolve({queries:0,images:0});});}catch{return {queries:0,images:0};}}
 return {get,save,stats};
}
