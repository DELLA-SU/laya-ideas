import {applyEntranceLook} from './entrance-looks.js?v=moustache-1';
export function playGuyIntro(){
 const look=applyEntranceLook(),root=document.querySelector('#guyIntro'),canvas=document.querySelector('#introCanvas');
 if(!root||!canvas)return;
 const main=document.querySelector('main'),skip=document.querySelector('#skipIntro'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),off=new Image(),on=new Image();
 let frame=0,start=0,done=false,width=0,height=0,fallback=0,offLayer=null,onLayer=null;
 main.inert=true;root.focus({preventScroll:true});
 function feather(image){
  const layer=document.createElement('canvas');layer.width=image.naturalWidth;layer.height=image.naturalHeight;const c=layer.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='destination-in';
  const vertical=c.createLinearGradient(0,0,0,layer.height);for(const [at,alpha] of [[0,0],[.06,1],[.88,1],[1,0]])vertical.addColorStop(at,`rgba(0,0,0,${alpha})`);c.fillStyle=vertical;c.fillRect(0,0,layer.width,layer.height);
  const horizontal=c.createLinearGradient(0,0,layer.width,0);for(const [at,alpha] of [[0,0],[.08,1],[.92,1],[1,0]])horizontal.addColorStop(at,`rgba(0,0,0,${alpha})`);c.fillStyle=horizontal;c.fillRect(0,0,layer.width,layer.height);return layer;
 }
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 function finish(){if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(fallback);document.body.classList.remove('intro-playing');main.inert=false;root.inert=true;window.removeEventListener('resize',resize);if(reduced.matches){root.hidden=true;return;}const fade=root.animate([{opacity:1},{opacity:0}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});fade.finished.catch(()=>{}).finally(()=>{root.hidden=true;});}
 skip.onclick=finish;root.onkeydown=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();finish();}};
 function ideas(t,x,y,w,h){
  if(reduced.matches||t<1.35)return;
  const cx=x+w*.497,cy=y+h*.35,rx=Math.min(width*.30,w*.20),ry=Math.min(height*.21,h*.27);
  const gather=Math.min(1,Math.max(0,(t-3.3)/1.5)),pull=1-Math.pow(1-gather,3),fade=Math.min(1,(t-1.35)*2)*(1-Math.min(1,Math.max(0,(t-4.55)/.35)));
  if(fade>0)for(let i=0;i<9;i++){
   const angle=i*Math.PI*2/9+t*.32,px=cx+Math.cos(angle)*rx*(1-pull),py=cy+Math.sin(angle)*ry*(1-pull),size=i%3===0?3:1.8;
   ctx.save();ctx.globalAlpha=fade*(.6+(i%3)*.18);ctx.fillStyle='#fff';ctx.shadowColor='#ffd39a';ctx.shadowBlur=10;
   if(i%3===0&&gather<.7){ctx.font="600 21px Arial, 'Apple SD Gothic Neo', sans-serif";ctx.textAlign='center';ctx.fillText('?',px,py);}else{ctx.beginPath();ctx.arc(px,py,size,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  const aha=(t-4.8)/1.05;
  if(aha>0&&aha<1){
   const radius=Math.min(width*.22,h*.22)*aha;ctx.save();ctx.globalAlpha=Math.sin(Math.PI*aha)*.8;ctx.strokeStyle='#ffe1b2';ctx.shadowColor='#ffd39a';ctx.shadowBlur=14;ctx.lineWidth=1.5;
   for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*radius*.72,cy+Math.sin(a)*radius*.72);ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);ctx.stroke();}ctx.restore();
  }
 }
 function paint(now){
  if(done)return;ctx.fillStyle=look.background;ctx.fillRect(0,0,width,height);
  if(offLayer){
   if(!start)start=now;const t=(now-start)/1000;
   const progress=Math.min(t/5.6,1),settled=1-Math.pow(1-progress,3);
   const nod=reduced.matches?0:Math.sin(Math.PI*Math.min(1,Math.max(0,(t-4.8)/.75)))*.02;
   const zoom=reduced.matches?1:1.08-.08*settled+nod,scale=Math.max(width/off.naturalWidth,height/off.naturalHeight)*.86*zoom;
   const w=off.naturalWidth*scale,h=off.naturalHeight*scale,x=(width-w)/2,y=(height-h)/2;
   ctx.drawImage(offLayer,x,y,w,h);
   if(onLayer){const energy=reduced.matches?.7:t<.7?0:t<.85?.7:t<1.02?.12:t<1.17?.85:t<1.32?.28:Math.min(1,(t-1.32)*1.8)*(t>2&&t<4.8?.9+.08*Math.sin(t*2.4):1);ctx.save();ctx.globalAlpha=energy;ctx.drawImage(onLayer,x,y,w,h);ctx.restore();}
   ideas(t,x,y,w,h);
   if(t>(reduced.matches?1.1:6.8)){finish();return;}
  }frame=requestAnimationFrame(paint);
 }
 off.onload=()=>offLayer=feather(off);on.onload=()=>onLayer=feather(on);off.onerror=finish;off.src=new URL('./assets/'+look.asset,import.meta.url).href;on.src=new URL('./assets/'+look.litAsset,import.meta.url).href;
 resize();window.addEventListener('resize',resize);window.addEventListener('pagehide',finish,{once:true});frame=requestAnimationFrame(paint);fallback=setTimeout(finish,12000);
}
