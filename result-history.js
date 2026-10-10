const key='ideation-guy:result-history:v1';
export function resultSignature(keyword,items){return JSON.stringify([keyword,items.map(x=>x.hash||x.id)]);}
export function createResultHistory(storage,limit=30){
 let entries=[];
 try{const saved=JSON.parse(storage.getItem(key)||'[]');if(Array.isArray(saved))entries=saved.filter(x=>typeof x.keyword==='string'&&Array.isArray(x.items)&&x.items.length&&x.items.every(i=>i&&typeof i.id==='string')).slice(0,limit);}catch{}
 function record(keyword,items){
  if(!items.length)return;
  const signature=resultSignature(keyword,items),copy=JSON.parse(JSON.stringify(items));
  entries=[{keyword,items:copy,signature,createdAt:Date.now()},...entries.filter(x=>x.signature!==signature)].slice(0,limit);
  try{storage.setItem(key,JSON.stringify(entries));}catch{}
 }
 return {record,list:()=>entries.map(x=>({...x,items:JSON.parse(JSON.stringify(x.items))}))};
}
