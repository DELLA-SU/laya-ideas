// The supplied moustache filament is the single product character.
const look={name:'수염 전구 아저씨',asset:'guy-moustache-off.png',litAsset:'guy-moustache-on.png',background:'#080808'};
export function entranceLook(){return look;}
export function setupModePicker(){}
export function applyEntranceLook(){
 document.documentElement.style.setProperty('--entrance-bg',look.background);
 document.documentElement.style.setProperty('--entrance-backdrop',look.background);
 document.documentElement.style.setProperty('--entrance-blend','normal');return look;
}
