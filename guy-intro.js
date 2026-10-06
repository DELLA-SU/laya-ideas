import {applyEntranceLook} from './entrance-looks.js?v=modes-1';
export function playGuyIntro(){
  const look=applyEntranceLook();
  const root=document.querySelector('#guyIntro'),canvas=document.querySelector('#introCanvas');
  if(!root||!canvas)return;
  const main=document.querySelector('main'),skip=document.querySelector('#skipIntro');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ctx=canvas.getContext('2d'),sheet=new Image();
  let frame=0,started=0,done=false,ready=false,width=0,height=0;
  main.inert=true;root.focus({preventScroll:true});
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
  function finish(){if(done)return;done=true;cancelAnimationFrame(frame);root.hidden=true;document.body.classList.remove('intro-playing');main.inert=false;window.removeEventListener('resize',resize);}
  skip.onclick=finish;
  root.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();finish();}});
  function portrait(index,alpha,size,x,y,brightness){
    if(alpha<=0)return;
    const cell=sheet.naturalWidth/2;
    ctx.save();ctx.globalAlpha=alpha;ctx.filter=`brightness(${brightness})`;
    ctx.drawImage(sheet,(index%2)*cell,Math.floor(index/2)*cell,cell,cell,x,y,size,size);ctx.restore();
  }
  function paint(now){
    if(done)return;
    if(!ready){ctx.fillStyle=look.background;ctx.fillRect(0,0,width,height);frame=requestAnimationFrame(paint);return;}
    if(!started)started=now;
    const t=(now-started)/1000;
    ctx.fillStyle=look.background;ctx.fillRect(0,0,width,height);
    if(reduced.matches){portrait(0,1,Math.max(height*1.12,width*.65),(width-Math.max(height*1.12,width*.65))/2,0,1);if(t>1.2)finish();else frame=requestAnimationFrame(paint);return;}
    const turn=smooth((t-3.0)/2.0)*3;
    const index=Math.min(3,Math.floor(turn)),blend=smooth(turn-index);
    const zoom=1.08-.08*smooth(t/2.5);
    const size=Math.min(height*1.2,width*1.85)*zoom;
    const x=(width-size)/2,y=height*.01;
    // Two brief warm ignition dips lead into a steady illuminated scene.
    const ignition=t<.5?.08:t<.82?.68:t<1.1?.18:t<1.5?1:.78;
    const reveal=smooth(t/.45),out=1-smooth((t-5.6)/.9);
    portrait(index,reveal*out*(1-blend),size,x,y,.4+ignition*.65);
    if(index<3)portrait(index+1,reveal*out*blend,size,x,y,.4+ignition*.65);
    const light=ignition*reveal*out;
    ctx.save();ctx.globalCompositeOperation='screen';
    const anchors=[[.51,.25,.12],[.528,.26,.11],[.556,.25,.065],[.505,.25,.11]];
    const a=anchors[index],b=anchors[Math.min(index+1,3)];
    const filamentX=x+size*(a[0]+(b[0]-a[0])*blend),bulbY=y+size*(a[1]+(b[1]-a[1])*blend);
    const filamentWidth=size*(a[2]+(b[2]-a[2])*blend);
    ctx.globalAlpha=look.filament?light:0;ctx.strokeStyle='#fff1bc';ctx.lineWidth=1.6;ctx.shadowColor='#ffae30';ctx.shadowBlur=22;ctx.beginPath();
    for(let dx=0;dx<=filamentWidth;dx+=.6){const fx=filamentX-filamentWidth/2+dx,fy=bulbY+Math.sin(dx*2.2)*2.2;if(dx===0)ctx.moveTo(fx,fy);else ctx.lineTo(fx,fy);}
    ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;
    const halo=ctx.createRadialGradient(width/2,bulbY,0,width/2,bulbY,size*.27);
    halo.addColorStop(0,`rgba(${look.light.join(',')},${light*.38})`);halo.addColorStop(.45,`rgba(222,135,36,${light*.12})`);halo.addColorStop(1,'rgba(222,135,36,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    const atmosphere=ctx.createRadialGradient(width/2,height*.35,0,width/2,height*.35,height);
    atmosphere.addColorStop(0,`rgba(120,70,17,${light*.035})`);atmosphere.addColorStop(1,'transparent');
    ctx.fillStyle=atmosphere;ctx.fillRect(0,0,width,height);ctx.restore();
    if(t>=6.5){finish();return;}frame=requestAnimationFrame(paint);
  }
  sheet.onload=()=>{ready=true;};
  sheet.onerror=finish;
  sheet.src=new URL('./assets/'+look.asset,import.meta.url).href;
  resize();window.addEventListener('resize',resize);window.addEventListener('pagehide',finish,{once:true});frame=requestAnimationFrame(paint);
  // Keep the search usable if a slow image connection never completes.
  setTimeout(()=>{if(!ready)finish();},9000);
}
