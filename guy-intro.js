import {applyEntranceLook} from './entrance-looks.js?v=moustache-1';
export function playGuyIntro(){
 const look=applyEntranceLook(),root=document.querySelector('#guyIntro'),canvas=document.querySelector('#introCanvas');
 if(!root||!canvas)return;
 const main=document.querySelector('main'),skip=document.querySelector('#skipIntro'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),off=new Image(),on=new Image();
 let frame=0,start=0,done=false,width=0,height=0,fallback=0;
 main.inert=true;root.focus({preventScroll:true});
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 function finish(){if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(fallback);document.body.classList.remove('intro-playing');main.inert=false;root.inert=true;window.removeEventListener('resize',resize);if(reduced.matches){root.hidden=true;return;}const fade=root.animate([{opacity:1},{opacity:0}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});fade.finished.catch(()=>{}).finally(()=>{root.hidden=true;});}
 skip.onclick=finish;root.onkeydown=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();finish();}};
 function paint(now){
  if(done)return;ctx.fillStyle=look.background;ctx.fillRect(0,0,width,height);
  if(off.naturalWidth){
   if(!start)start=now;const t=(now-start)/1000;
   const progress=Math.min(t/5.6,1),settled=1-Math.pow(1-progress,3);
   const zoom=reduced.matches?1:1.08-.08*settled,scale=Math.max(width/off.naturalWidth,height/off.naturalHeight)*.86*zoom;
   const w=off.naturalWidth*scale,h=off.naturalHeight*scale,x=(width-w)/2,y=(height-h)/2;
   ctx.drawImage(off,x,y,w,h);
   if(on.naturalWidth){const energy=reduced.matches?.7:t<.7?0:t<.85?.7:t<1.02?.12:t<1.17?.85:t<1.32?.28:Math.min(1,(t-1.32)*1.8);ctx.save();ctx.globalAlpha=energy;ctx.drawImage(on,x,y,w,h);ctx.restore();}
   if(t>(reduced.matches?1.1:6.8)){finish();return;}
  }frame=requestAnimationFrame(paint);
 }
 off.onerror=finish;off.src=new URL('./assets/'+look.asset,import.meta.url).href;on.src=new URL('./assets/'+look.litAsset,import.meta.url).href;
 resize();window.addEventListener('resize',resize);window.addEventListener('pagehide',finish,{once:true});frame=requestAnimationFrame(paint);fallback=setTimeout(finish,12000);
}
