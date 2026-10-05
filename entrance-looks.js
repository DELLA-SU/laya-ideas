const looks={
  best:{name:'전구 아저씨',asset:'guy-turnaround.png',background:'#050505',light:[255,189,69],filament:true},
  black:{name:'검은 티셔츠',asset:'guy-black.png',background:'#050505',light:[255,189,69],filament:true},
  prince:{name:'가로등 귀공자',asset:'guy-prince.png',background:'#34204e',light:[255,211,139],filament:false},
  tv:{name:'아이디어 TV',asset:'guy-tv.png',background:'#09121c',light:[255,143,56],filament:false}
};
export function entranceLook(){return looks[new URL(location.href).searchParams.get('look')]||looks.best;}
export function applyEntranceLook(){const look=entranceLook();document.documentElement.style.setProperty('--entrance-bg',look.background);return look;}
