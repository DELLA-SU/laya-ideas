export function installMotion(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),active=new Set();
 const ease='cubic-bezier(.22,1,.36,1)';
 function enter(element,delay=0,distance=7){
  if(reduced.matches||!element||element.hidden||!element.isConnected)return;
  const animation=element.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{duration:320,delay,easing:ease,fill:'backwards'});
  active.add(animation);animation.finished.catch(()=>{}).finally(()=>active.delete(animation));
 }
 for(const id of ['grid','boardSurface']){
  const root=document.getElementById(id);if(!root)continue;
  new MutationObserver(records=>{
   const additions=records.flatMap(record=>[...record.addedNodes]).filter(node=>node.nodeType===1&&node.matches('.card,.board-card'));
   additions.forEach((node,index)=>enter(node,Math.min(index*18,72)));
  }).observe(root,{childList:true});
 }
 const slots=document.getElementById('pairImages');
 let slotKeys=[];
 if(slots)new MutationObserver(()=>{
  const next=[...slots.children].map(slot=>slot.dataset.referenceId||'');
  [...slots.children].forEach((slot,i)=>{if(next[i]&&next[i]!==slotKeys[i]){
   if(!reduced.matches){const animation=slot.animate([{opacity:.4,transform:'translateY(6px) scale(.94)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:420,easing:ease});active.add(animation);animation.finished.catch(()=>{}).finally(()=>active.delete(animation));}
  }});slotKeys=next;
 }).observe(slots,{childList:true});
 const panel=document.getElementById('pairPanel');
 if(panel)new MutationObserver(()=>{if(!panel.hidden)enter(panel,0,8);}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 let drawing=document.body.classList.contains('drawing'),intro=document.body.classList.contains('intro-playing');
 new MutationObserver(()=>{
  const nextDrawing=document.body.classList.contains('drawing'),nextIntro=document.body.classList.contains('intro-playing');
  if(drawing&&!nextDrawing)enter(document.querySelector('.idea-actions'),0,5);
  if(intro&&!nextIntro)enter(document.querySelector('.search-area'),30,8);
  drawing=nextDrawing;intro=nextIntro;
 }).observe(document.body,{attributes:true,attributeFilter:['class']});
 const studio=document.getElementById('mixStudio');
 if(studio)studio.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button&&(button.closest('.studio-purposes,.studio-variants')||['배치 바꾸기','선택한 요소 다시 믹스'].includes(button.textContent)))enter(studio.querySelector('.studio-preview>canvas'),0,6);
 });
 if(studio)studio.addEventListener('toggle',event=>{
  if(event.target.matches('.studio-elements')&&event.target.open)studio.querySelectorAll('.studio-source').forEach((source,i)=>enter(source,i*30,9));
 },true);
 reduced.addEventListener('change',()=>{if(reduced.matches){active.forEach(animation=>animation.cancel());active.clear();}});
}
