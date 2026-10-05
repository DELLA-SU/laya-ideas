// Suggestions use published card metadata, not visual recognition or AI generation.
const associations = [
  [/fox|여우|vulpes/i, ['위장', '적응', '야생']],
  [/snow|winter|arctic|눈|겨울|북극|inverno/i, ['고요', '보호', '계절']],
  [/plant|botan|flower|식물|꽃/i, ['성장', '반복', '유기적 형태']],
  [/brain|neuro|psych|뇌|심리|memory|기억/i, ['지각', '연결', '기억']],
  [/architecture|building|건축|공간/i, ['구조', '경계', '공간']],
  [/water|sea|ocean|바다|물결/i, ['흐름', '반사', '리듬']],
  [/poster|graphic|type|포스터|그래픽|문자/i, ['대비', '배치', '시각 언어']],
];
function subject(item) {
  return String(item.title || item.description || '새로운 형태')
    .replace(/\([^)]*\)|\b\d+\b|\.(jpg|png|jpeg)$/gi, '')
    .replace(/[_·]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 55) || '새로운 형태';
}
function concepts(item) {
  const metadata = [item.title, item.description].filter(Boolean).join(' ');
  return [...new Set(associations.filter(([pattern]) => pattern.test(metadata)).flatMap(([, words]) => words))];
}
export function expandPair(pair, features = []) {
  if (pair.length !== 2 || pair.some(item => !item)) throw new Error('두 자료를 선택해주세요.');
  const subjects = pair.map(subject);
  const a = features[0]?.trim() || concepts(pair[0])[0] || subjects[0];
  const b = features[1]?.trim() || concepts(pair[1]).find(word => word !== a) || subjects[1];
  const keywords = [...new Set([
    `${a} ${b}`, `${a} 패턴`, `${b} 공간`,
    `${subjects[0]} ${subjects[1]}`, `${b} 질감`, `${a} 시각 디자인`,
  ])];
  return { keywords, idea: `${subjects[0]} × ${subjects[1]}\n\n연결 방향: ${a} + ${b}\n\n‘${a}’을 형태의 출발점으로 삼고 ‘${b}’을 재료나 공간으로 옮겨보세요. 두 자료에서 출발한 패턴, 오브제, 장면으로 확장할 수 있습니다.` };
}
