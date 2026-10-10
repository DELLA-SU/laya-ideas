// Localized display metadata; original titles and links remain available for attribution.
export const needsKorean = value => /[A-Za-z\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff]/u.test(String(value || ''));
export function displayTitle(item) {
  return item.translation==='machine'||!needsKorean(item.title)?item.title:'한국어 제목을 준비하고 있어요';
}
export function createKoreanDisplay({translate,storage,limit=500,concurrency=3}) {
  const key='ideation-guy:korean-display:v1',pending=new Map(),items=new WeakMap(),queue=[];
  let cache={},running=0;
  try {cache=JSON.parse(storage?.getItem(key)||'{}');if(!cache||Array.isArray(cache)||typeof cache!=='object')cache={};} catch {}
  function pump(){while(running<concurrency&&queue.length){running++;const job=queue.shift();job().finally(()=>{running--;pump();});}}
  async function text(value){
    value=String(value||'').trim();if(!value||!needsKorean(value))return value;
    if(typeof cache[value]==='string'&&/[가-힣]/.test(cache[value]))return cache[value];
    if(pending.has(value))return pending.get(value);
    const request=new Promise(resolve=>{queue.push(async()=>{
      try {
        const result=await translate(value);
        const ko=typeof result==='string'?result:result?.translated?result.text:'';
        if(!/[가-힣]/.test(ko||''))return resolve(null);
        delete cache[value];cache[value]=ko;
        while(Object.keys(cache).length>limit)delete cache[Object.keys(cache)[0]];
        try{storage?.setItem(key,JSON.stringify(cache));}catch{}
        resolve(ko);
      }catch{resolve(null);}
    });pump();});
    pending.set(value,request);
    try{return await request;}finally{pending.delete(value);}
  }
  function localize(item){
    if(item.kind==='connection')return Promise.resolve(item);
    if(items.has(item))return items.get(item);
    const fields=['title','description'].map(field=>{
      const originalKey=field==='title'?'originalTitle':'originalDescription';
      const original=item[originalKey]||item[field]||'';
      if(!needsKorean(original))return Promise.resolve();
      item[originalKey]=original;
      if(typeof cache[original]==='string'&&/[가-힣]/.test(cache[original])){
        item[field]=cache[original];if(field==='title')item.translation='machine';return Promise.resolve();
      }
      if(field==='title')item.title='한국어 제목을 준비하고 있어요';else item.description='한국어 설명을 준비하고 있어요';
      return text(original).then(ko=>{
        item[field]=ko||(field==='title'?'한국어 제목을 불러오지 못했어요':'한국어 설명을 불러오지 못했어요');
        if(field==='title')item.translation=ko?'machine':'unavailable';
      });
    });
    const request=Promise.all(fields).then(()=>item).finally(()=>items.delete(item));
    items.set(item,request);return request;
  }
  return {text,localize};
}
export async function translatePublicKorean(value,fetcher=fetch){
  // Auto-detection also handles non-English and mixed-language source metadata.
  const chunks=String(value).match(/[\s\S]{1,1200}/gu)||[];
  const output=[];
  for(const q of chunks){
    const url='https://translate.googleapis.com/translate_a/single?'+new URLSearchParams({client:'gtx',sl:'auto',tl:'ko',dt:'t',q});
    const response=await fetcher(url,{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('번역 연결 지연');
    const data=await response.json();
    const translated=data?.[0]?.map(row=>typeof row?.[0]==='string'?row[0]:'').join('');
    if(!translated)throw new Error('번역 응답 없음');
    output.push(translated);
  }
  const ko=output.join('');if(!/[가-힣]/.test(ko))throw new Error('한국어 번역 응답 없음');return ko;
}
