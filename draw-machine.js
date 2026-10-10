import {entranceLook} from './entrance-looks.js?v=iris-1';
export function createDrawMachine(stage,canvas,heading,message){
 const look=entranceLook(),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),off=new Image(),on=new Image();
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=1672*dpr;canvas.height=941*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 let active=false,frame=0,start=0,illuminated=false;
 function paint(now){
  ctx.clearRect(0,0,1672,941);if(off.naturalWidth)ctx.drawImage(off,0,0,1672,941);
  if(active&&on.naturalWidth){const energy=illuminated?1:reduced.matches?.65:.55+.15*Math.sin((now-start)/650);ctx.save();ctx.globalAlpha=energy;ctx.drawImage(on,0,0,1672,941);ctx.restore();}
  if(active&&!reduced.matches)frame=requestAnimationFrame(paint);
 }
 off.onload=()=>paint(performance.now());on.onload=()=>paint(performance.now());
 off.src=new URL('./assets/'+look.asset,import.meta.url).href;on.src=new URL('./assets/'+look.litAsset,import.meta.url).href;
 function stop(){active=false;cancelAnimationFrame(frame);stage.hidden=true;document.body.classList.remove('drawing','landing');}
 return {start(keyword){if(active)return;active=true;illuminated=false;start=performance.now();heading.hidden=false;message.hidden=false;heading.textContent='아이디어를 밝히는 중';message.textContent=`‘${keyword}’에서 새로운 영감을 찾고 있어요.`;stage.hidden=false;document.body.classList.add('drawing');paint(start);},async finish(count){if(!active)return;if(count>0){illuminated=true;heading.textContent='아이디어가 떠올랐다!';message.textContent='';paint(performance.now());if(!reduced.matches)await new Promise(resolve=>setTimeout(resolve,450));}stop();},stop};
}
