// Detect original Korean titles, rather than Korean machine translations.
export function isKoreanOriginal(item) {
 if (item?.kind!=='reading') return false;
 try {if(new URL(item.source).hostname==='ko.wikipedia.org')return true;}catch{}
 const title=String(item.originalTitle||item.title||'');
 const ko=(title.match(/[가-힣]/g)||[]).length;
 const other=(title.match(/[A-Za-z\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff]/g)||[]).length;
 return ko>=2 && ko/(ko+other)>=.3 && item.translation!=='pending' && item.translation!=='unavailable';
}
export const koreanReadings=(items=[],foreign=false)=>foreign?items:items.filter(isKoreanOriginal);
export function koreanSourceLinks(keyword) {
 const query=String(keyword||'').trim().slice(0,100);
 return [
  {title:'네이버 지식백과',description:'개념과 배경을 한국어로 알아보기',url:'https://terms.naver.com/search?'+new URLSearchParams({query})},
  {title:'RISS 국내 논문',description:'국내 학술논문과 학위논문 찾기',url:'https://www.riss.kr/search/Search.do?'+new URLSearchParams({query})},
  {title:'KCI 논문 검색',description:'한국학술지인용색인에서 논문 찾기',url:'https://kci.go.kr/kciportal/po/search/poArtiSear.kci'},
 ];
}
