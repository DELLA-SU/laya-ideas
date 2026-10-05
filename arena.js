// Read-only public channel API. This does not call the Premium global search API.

const https=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:'';}catch{return '';}};
export function normalizeBlock(block,channel={title:'Are.na 전체 검색',keywords:[]}){
  if(block.type!=='Image'||block.visibility==='private'||!block.image)return null;
  const image=https(block.image.medium?.src||block.image.src);
  if(!image)return null;
  return {aspectRatio:block.image.aspect_ratio||block.image.width/block.image.height,id:`arena-${block.id}`,hash:https(block.image.src)||image,image,
    source:`https://www.are.na/block/${block.id}`,provider:'Are.na',
    title:block.title||'Untitled',artist:`수집: ${block.user?.name||'Are.na 사용자'}`,
    description:block.description?.plain||'',original:https(block.source?.url),
    license:'이용 조건 원본 확인',licenseURL:'',channel:channel.title,
    keywords:channel.keywords};
}
export function matchBlocks(items,keyword,translated=keyword){
  const terms=[keyword,translated].map(t=>t.trim().toLowerCase()).filter(Boolean);
  const alias={'치이카와':'chiikawa','치이카와 캐릭터':'chiikawa','하치와레':'hachiware','우사기':'usagi'};
  if(alias[keyword])terms.push(alias[keyword]);
  return items.filter(item=>terms.some(term=>
    `${item.title} ${item.description}`.toLowerCase().includes(term)||
    item.keywords.some(k=>k.toLowerCase()===term)));
}
export async function searchArena(keyword,translated,fetchJSON){
  const data=await fetchJSON('/api/arena/search?'+new URLSearchParams({q:keyword,en:translated.replace(/\s+-\S+/g,'')}));
  return {items:(data.data||[]).map(block=>normalizeBlock(block)).filter(Boolean),scope:'all',partial:false};
}
