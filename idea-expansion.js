// Suggestions use published card metadata, not visual recognition or AI generation.
const associations = [
  [/fox|여우|vulpes/i, ['위장', '적응', '야생']],
  [/snow|winter|arctic|눈|겨울|북극|inverno/i, ['고요', '보호', '계절']],
  [/plant|botan|flower|식물|꽃/i, ['성장', '반복', '유기적 형태']],
  [/brain|neuro|psych|뇌|심리|memory|기억/i, ['지각', '연결', '기억']],
  [/architecture|building|건축|공간/i, ['구조', '경계', '공간']],
  [/audio|audiogram|sound|hearing|오디오|소리|청각/i, ['소리', '진동', '감각']],
  [/orca|orcinus|whale|범고래|고래|오르카|오르시누스|킬러웨일/i, ['유영', '수면', '군집']],
  [/water|sea|ocean|바다|물결/i, ['흐름', '반사', '리듬']],
  [/poster|graphic|type|포스터|그래픽|문자/i, ['대비', '배치', '시각 언어']],
];
function subject(item,index) {
  return String(item.translation==='unavailable'?'':item.title || item.description || '새로운 형태').replace(/[A-Za-z\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff][A-Za-z0-9\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff’".:-]*/gu, '')
    .replace(/\([^)]*\)|\b\d{4,}\b|\.(jpg|png|jpeg)$/gi, '')
    .replace(/[_·]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 55) || concepts(item)[0] || `${index+1}번 자료`;
}
function concepts(item) {
  const metadata = [item.originalTitle,item.originalDescription,item.title,item.description].filter(Boolean).join(' ');
  return [...new Set(associations.filter(([pattern]) => pattern.test(metadata)).flatMap(([, words]) => words))];
}
function withParticle(word, particles) {
  const code=word.charCodeAt(word.length-1);
  const final=code>=0xac00 && code<=0xd7a3 && (code-0xac00)%28!==0;
  return word+(final?particles[0]:particles[1]);
}
export function expandPair(pair, features = [], remix = 0) {
  if (pair.length !== 2 || pair.some(item => !item)) throw new Error('두 자료를 선택해주세요.');
  const subjects = pair.map(subject);
  const a = features[0]?.trim().replace(/[A-Za-z]+/g,'').trim() || concepts(pair[0])[0] || subjects[0];
  const b = features[1]?.trim().replace(/[A-Za-z]+/g,'').trim() || concepts(pair[1]).find(word => word !== a) || subjects[1];
  const keywords = [...new Set([
    `${a} ${b}`, `${a} 패턴`, `${b} 공간`,
    `${subjects[0]} ${subjects[1]}`, `${b} 질감`, `${a} 시각 디자인`,
  ])];
  const rounds = [
    [
      {lens:'역할 뒤집기',title:`${withParticle(b,'을를')} 입은 ${a}`,insight:`${withParticle(a,'은는')} 주인공, ${withParticle(b,'은는')} 배경이라는 역할을 바꾸면 어떨까요? ${withParticle(b,'이가')} 움직이고 ${withParticle(a,'이가')} 그 흔적을 받아주는 장면을 상상해보세요.`,visual:`${b}의 변화가 일어나는 부분만 선명하고, ${withParticle(a,'은는')} 겹친 실루엣으로 남는 포스터.`,experiment:`${a}의 윤곽 세 개에 ${b}의 서로 다른 상태를 넣어 작은 포스터 시리즈를 만드세요.`},
      {lens:'감각 번역',title:`눈으로 만나는 ${b}`,insight:`${a}에서 느껴지는 움직임을 ${b}의 감각으로 번역해보세요. 움직임은 선의 간격, 강도는 밝기, 멈춤은 여백으로 바꿉니다.`,visual:`${a}의 실루엣을 중심에 두고 ${withParticle(b,'을를')} 연상시키는 선과 점이 주변으로 퍼지는 설치 장면.`,experiment:`${withParticle(a,'과와')} ${withParticle(b,'을를')} 표현할 동사 하나씩 골라, 두 동사가 반복되는 5초 모션 스케치를 만드세요.`},
      {lens:'엉뚱한 제품',title:`${a} × ${b} 실험실`,insight:`${a}의 형태가 ${withParticle(b,'을를')} 다루는 도구가 된다면 어떨까요? 보기 위한 이미지를 직접 조작하는 작은 물건으로 옮겨봅니다.`,visual:`${a}의 윤곽과 ${b}의 리듬을 가진 손바닥 크기 오브제. 눌렀을 때 형태나 빛이 달라집니다.`,experiment:`종이, 반투명 필름, 작은 빛 하나로 만질 수 있는 샘플을 만들어보세요.`}
    ],
    [
      {lens:'크기 바꾸기',title:`거대한 ${b}, 작은 ${a}`,insight:`두 요소의 크기를 극단적으로 바꾸면 익숙한 관계가 낯설어집니다. ${withParticle(a,'을를')} 아주 작게, ${withParticle(b,'을를')} 공간 전체로 키워보세요.`,visual:`거대한 ${b}의 패턴 안에 작은 ${withParticle(a,'이가')} 숨어 있는 초현실적인 장면.`,experiment:'같은 구도를 1:1, 1:10, 1:100 비율로 그려 가장 의외인 장면을 고르세요.'},
      {lens:'시간 섞기',title:`${withParticle(a,'이가')} 남긴 ${b}`,insight:`${withParticle(a,'이가')} 사라진 뒤 ${b}만 남는 순간을 상상해보세요. 대상보다 대상이 남긴 흔적이 이야기를 이끌게 합니다.`,visual:`${withParticle(a,'은는')} 흐릿한 잔상, ${withParticle(b,'은는')} 선명한 흔적으로 남는 긴 노출 느낌의 포스터.`,experiment:'시작·중간·끝 세 장 중 마지막 장에서 주인공을 지우고 흔적만 남겨보세요.'},
      {lens:'참여하는 장면',title:`당신이 켜는 ${a}`,insight:`관람자의 행동이 ${withParticle(a,'과와')} ${withParticle(b,'을를')} 이어주는 세 번째 재료가 된다면 어떨까요? 가까이 가거나 손을 대야만 두 요소가 연결됩니다.`,visual:`어두운 공간에서 사람의 손 주변으로 ${withParticle(a,'과와')} ${b}의 패턴이 천천히 드러나는 인터랙티브 설치.`,experiment:'마우스 거리 하나를 입력값으로 삼아 형태·빛·속도 중 한 가지만 바꾸는 프로토타입을 만드세요.'}
    ]
  ];
  const row=rounds[Math.abs(Math.trunc(Number(remix)||0))%rounds.length];
  const suggestions=row.map(concept=>({...concept,
    idea:`${subjects[0]} × ${subjects[1]}\n\n${concept.title}\n\n인사이트\n${concept.insight}\n\n시각화 방향\n${concept.visual}\n\n작은 실험\n${concept.experiment}`,
    prompt:`콘셉트: ${concept.title}. 참고 요소: ${subjects.join(' / ')}. 연결할 특징: ${a} + ${b}. ${concept.visual} 두 요소가 하나의 새로운 장면으로 결합되게 표현하세요. 현대적인 실험 디자인, 명확한 중심 구도, 섬세한 재질과 조명. 이미지 안에 글자나 로고를 넣지 마세요.`
  }));
  return { keywords, subjects, features:[a,b], suggestions, idea:suggestions[0].idea };

}
