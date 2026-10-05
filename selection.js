export function shuffleItems(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function readingTitleKey(title='') {
  return title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
}
export function readingSourceKey(source='') {
  try {
    const url=new URL(source),host=url.hostname.toLowerCase();
    const path=decodeURIComponent(url.pathname).replace(/\/+$/,'');
    if(['doi.org','dx.doi.org','www.doi.org'].includes(host))return 'doi:'+path.replace(/^\//,'').toLowerCase();
    for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key)||/^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key);
    url.searchParams.sort();url.hash='';url.protocol='https:';url.pathname=path;return url.href;
  } catch {return source;}
}
export function sameReading(a,b) {
  if(a.kind!=='reading'||b.kind!=='reading')return false;
  const title=readingTitleKey(a.originalTitle||a.title),source=readingSourceKey(a.source);
  return Boolean((title&&title===readingTitleKey(b.originalTitle||b.title))||(source&&source===readingSourceKey(b.source)));
}
export function uniqueImages(items) {
  const ids = new Set(), hashes = new Set(), urls = new Set(), readingTitles=new Set(), readingSources=new Set();
  return items.filter(item => {
    if(item.kind==='reading'){
      const title=readingTitleKey(item.originalTitle||item.title),source=readingSourceKey(item.source);
      const duplicate=(title&&readingTitles.has(title))||(source&&readingSources.has(source));
      if(title)readingTitles.add(title);if(source)readingSources.add(source);
      if(duplicate)return false;
    }
    if (ids.has(item.id) || hashes.has(item.hash) || urls.has(item.image)) return false;
    ids.add(item.id); hashes.add(item.hash); urls.add(item.image); return true;
  });
}
export function chooseBatch(pool, seen, previous = [], size = 10) {
  const unique = uniqueImages(pool), used = new Set(seen), recent = new Set(previous);
  const fresh = unique.filter(x => !used.has(x.hash));
  if (fresh.length >= size) return {items:diversePick(fresh,size),recycled:false};
  // Prefer fewer new results while more search pages can still be fetched.
  if (fresh.length) return {items:shuffleItems(fresh).slice(0,size),recycled:false};
  const older = unique.filter(x => !recent.has(x.hash));
  const items=diversePick(older,size);
  // If the whole source has <=10 images, repeat only when no alternative remains.
  return {items:items.length?items:shuffleItems(unique).slice(0,size),recycled:true};
}
export function isCommons(item) {
  if(item.provider==='Wikimedia Commons')return true;
  try{return new URL(item.source).hostname==='commons.wikimedia.org';}catch{return false;}
}
// The cap includes cards already added while filling the viewport.
export function chooseSourceBatch(pool,seen,previous,size,current=[]) {
  const candidates=uniqueImages(pool).filter(x=>!current.some(item=>item.hash===x.hash));
  const allowance=Math.max(0,3-current.filter(isCommons).length);
  const commons=chooseBatch(candidates.filter(isCommons),seen,previous,Math.min(size,allowance));
  const target=Math.max(0,size-commons.items.length);
  const others=chooseBatch(candidates.filter(x=>!isCommons(x)),seen,previous,target);
  // A partial fresh set must not leave the viewport empty when older alternatives exist.
  if(others.items.length<target){
    const remaining=candidates.filter(x=>!isCommons(x)&&!previous.includes(x.hash)&&!others.items.some(y=>y.hash===x.hash));
    const supplement=chooseBatch(remaining,[],[],target-others.items.length).items;
    if(supplement.length){others.items.push(...supplement);others.recycled=true;}
  }
  return {items:[...commons.items,...others.items],recycled:commons.recycled||others.recycled};
}
export function chooseIdeaBatch(images,readings,seen,previous,size,current=[]) {
  const currentReading=current.filter(x=>x.kind==='reading').length;
  const currentImages=current.length-currentReading;
  const readingTarget=Math.max(0,Math.min(size,Math.round((current.length+size)*.30)-currentReading));
  const texts=chooseBatch(uniqueImages(readings).filter(x=>!current.some(c=>c.hash===x.hash||sameReading(c,x))),seen,previous,readingTarget);
  const visuals=chooseSourceBatch(images,seen,previous,size-texts.items.length,current);
  // Missing images must never be replaced by a wall of text.
  const readingAllowance=Math.max(0,Math.round((currentImages+visuals.items.length)*3/7)-currentReading);
  return {items:[...visuals.items,...texts.items.slice(0,readingAllowance)],recycled:visuals.recycled||texts.recycled};
}
function diversePick(candidates,size) {
  const randomized=shuffleItems(candidates), picked=[], deferred=[], counts=new Map();
  for (const item of randomized) {
    const author=item.artist?.trim().toLowerCase();
    if (author && (counts.get(author)||0)>=2) {deferred.push(item);continue;}
    if (author) counts.set(author,(counts.get(author)||0)+1);
    picked.push(item);
  }
  return [...picked,...deferred].slice(0,size);
}
