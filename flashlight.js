export function createFlashlight(results,grid,toggle,value){
 const key='ideation-guy:flashlight:v1';let enabled=true;
 const editor=results.querySelector('#pairPanel');
 try{enabled=localStorage.getItem(key)!=='off';}catch{}
 const mask=document.createElement('div');mask.className='flashlight-mask';mask.setAttribute('aria-hidden','true');mask.hidden=true;document.body.append(mask);
 const stars=document.createElement('div');stars.className='flashlight-stars';
 for(let i=0;i<90;i++){
  const star=document.createElement('i'),sparkle=i%15===0;
  star.className=sparkle?'star-cross':'star-dot';
  if(sparkle||i%9===0)star.classList.add('star-twinkle');
  star.style.left=((i*37.73+11)%100)+'%';star.style.top=((i*61.37+7)%100)+'%';
  star.style.setProperty('--star-size',(sparkle?14+(i%3)*4:1.1+(i%5)*.3)+'px');
  star.style.setProperty('--star-brightness',String(sparkle?.68:.38+(i%5)*.07));
  star.style.setProperty('--star-duration',(8+i%7)+'s');
  star.style.setProperty('--star-delay',-(i%13)+'s');stars.append(star);
 }mask.append(stars);
 let frame=0,ready=false,point=null;
 function sync(){
  toggle.setAttribute('aria-checked',String(enabled));value.textContent=enabled?'ON':'OFF';
  const r=results.getBoundingClientRect(),g=grid.getBoundingClientRect();
  const top=Math.max(0,r.top,g.top),bottom=Math.min(innerHeight,r.bottom,g.bottom),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right);
  const card=point?.card?.isConnected?point.card:grid.querySelector('.card'),cardWidth=card?.getBoundingClientRect().width||200,core=Math.max(52,cardWidth/2+4)*1.32,feather=Math.max(22,cardWidth*.13);
  for(const [key,radius] of Object.entries({'light-core':core,'light-soft':core+feather*.25,'light-mid':core+feather*.50,'light-edge':core+feather*.75,'light-end':core+feather,'star-clear':core+feather*.72,'star-return':core+feather+25}))mask.style.setProperty('--'+key,radius+'px');
  mask.hidden=!enabled||!ready||results.hidden||(editor&&!editor.hidden)||bottom<=top||!grid.children.length||document.body.classList.contains('drawing');
  mask.style.left=left+'px';mask.style.top=top+'px';mask.style.width=Math.max(0,right-left)+'px';mask.style.height=Math.max(0,bottom-top)+'px';
  mask.style.setProperty('--light-x',point?point.x-left+'px':'-1000px');mask.style.setProperty('--light-y',point?point.y-top+'px':'-1000px');
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);}
 function clear(){ready=false;point=null;sync();}
 function preview(){
  ready=!!grid.children.length;sync();
 }
 toggle.onclick=()=>{enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}if(enabled)preview();else sync();};
 results.addEventListener('pointermove',e=>{point={x:e.clientX,y:e.clientY,card:e.target.closest('.card')};schedule();},{passive:true});
 results.addEventListener('pointerdown',e=>{point={x:e.clientX,y:e.clientY,card:e.target.closest('.card')};schedule();},{passive:true});
 results.addEventListener('pointerleave',()=>{point=null;schedule();});
 grid.addEventListener('focusin',e=>{const r=e.target.getBoundingClientRect();point={x:r.left+r.width/2,y:r.top+r.height/2,card:e.target.closest('.card')};schedule();});
 results.addEventListener('scroll',schedule,{passive:true});window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
 if(editor)new MutationObserver(schedule).observe(editor,{attributes:true,attributeFilter:['hidden']});
 new ResizeObserver(schedule).observe(grid);sync();
 return {preview,clear};
}
