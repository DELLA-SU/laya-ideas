export function createFlashlight(results,grid,toggle,value){
 const key='ideation-guy:flashlight:v1';let enabled=true;
 const editor=results.querySelector('#pairPanel');
 try{enabled=localStorage.getItem(key)!=='off';}catch{}
 const mask=document.createElement('div');mask.className='flashlight-mask';mask.setAttribute('aria-hidden','true');mask.hidden=true;document.body.append(mask);
 let timer=0,frame=0,generation=0,ready=false,previewing=false,point=null;
 function sync(){
  toggle.setAttribute('aria-checked',String(enabled));value.textContent=enabled?'ON':'OFF';
  const r=results.getBoundingClientRect(),g=grid.getBoundingClientRect();
  const top=Math.max(0,r.top,g.top),bottom=Math.min(innerHeight,r.bottom,g.bottom),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right);
  mask.hidden=!enabled||!ready||previewing||results.hidden||(editor&&!editor.hidden)||bottom<=top||!grid.children.length||document.body.classList.contains('drawing');
  mask.style.left=left+'px';mask.style.top=top+'px';mask.style.width=Math.max(0,right-left)+'px';mask.style.height=Math.max(0,bottom-top)+'px';
  mask.style.setProperty('--light-x',point?point.x-left+'px':'-1000px');mask.style.setProperty('--light-y',point?point.y-top+'px':'-1000px');
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);}
 function clear(){generation++;clearTimeout(timer);ready=false;previewing=false;point=null;sync();}
 function preview(){
  const current=++generation;clearTimeout(timer);ready=!!grid.children.length;previewing=true;sync();
  timer=setTimeout(()=>{if(current!==generation)return;previewing=false;sync();},2000);
 }
 toggle.onclick=()=>{enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}if(enabled)preview();else sync();};
 results.addEventListener('pointermove',e=>{point={x:e.clientX,y:e.clientY};schedule();},{passive:true});
 results.addEventListener('pointerdown',e=>{point={x:e.clientX,y:e.clientY};schedule();},{passive:true});
 results.addEventListener('pointerleave',()=>{point=null;schedule();});
 grid.addEventListener('focusin',e=>{const r=e.target.getBoundingClientRect();point={x:r.left+r.width/2,y:r.top+r.height/2};schedule();});
 results.addEventListener('scroll',schedule,{passive:true});window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
 if(editor)new MutationObserver(schedule).observe(editor,{attributes:true,attributeFilter:['hidden']});
 new ResizeObserver(schedule).observe(grid);sync();
 return {preview,clear};
}
