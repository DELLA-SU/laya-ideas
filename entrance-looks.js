const looks={
  best:{name:'전구 아저씨',asset:'guy-turnaround.png',background:'#050505',light:[255,189,69],filament:true},
  black:{spotlight:true,name:'검은 목티',asset:'guy-black-turtleneck.png',background:'#050505',light:[255,189,69],filament:true},
  prince:{name:'가로등 귀공자',asset:'guy-prince.png',background:'#34204e',light:[255,211,139],filament:false},
  bulbprince:{name:'전구 귀공자',asset:'guy-bulb-prince.png',background:'#34204e',light:[255,211,139],filament:false},
  tv:{name:'아이디어 TV',asset:'guy-tv.png',background:'#09121c',light:[255,143,56],filament:false}
};
const userModes=['black','bulbprince','tv'];
const preferenceKey='ideation-guy:appearance:v1';
function savedMode(){try{const mode=localStorage.getItem(preferenceKey);return userModes.includes(mode)?mode:'black';}catch{return 'black';}}
export function entranceLook(){return looks[new URL(location.href).searchParams.get('look')]||looks[savedMode()];}
export function setupModePicker(){
  const explicit=new URL(location.href).searchParams.get('look');
  const selected=userModes.includes(explicit)?explicit:savedMode();
  if(userModes.includes(explicit)){try{localStorage.setItem(preferenceKey,explicit);}catch{}}
  document.querySelectorAll('[data-entrance-mode]').forEach(button=>{
    const mode=button.dataset.entranceMode;
    button.setAttribute('aria-pressed',String(mode===selected));
    button.addEventListener('click',()=>{
      if(mode===selected)return;
      try{localStorage.setItem(preferenceKey,mode);}catch{}
      const url=new URL(location.href);url.searchParams.set('look',mode);location.assign(url.href);
    });
  });
}

export function applyEntranceLook(){const look=entranceLook();document.documentElement.style.setProperty('--entrance-blend',look.spotlight?'lighten':'normal');document.documentElement.style.setProperty('--entrance-bg',look.background);document.documentElement.style.setProperty('--entrance-backdrop',look.spotlight?'radial-gradient(ellipse 52% 62% at 50% 36%, #302b25 0%, #1c1a17 32%, #10100f 58%, #050505 88%)':look.background);return look;}
