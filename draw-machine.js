import {createBalls,stepBalls} from './lottery-physics.js';
export function createDrawMachine(stage,canvas,heading,message){
  const ctx=canvas.getContext('2d'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const photograph=new Image();photograph.src=new URL('./assets/lottery-machine-empty.png',import.meta.url).href;
  const colors=[['#ffb7d5','#f23d88','#a0084a'],['#fff2a0','#f5cc22','#9e7108'],['#b3edff','#159edc','#005174'],['#c4f4bd','#41bc4e','#10571c'],['#ffcea4','#f47d23','#973803']];
  let active=false,frame=0,started=0,lastTime=0,release=0,total=10,balls=createBalls(),selected=[];
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const scale=Math.min(devicePixelRatio||1,2);canvas.width=360*scale;canvas.height=390*scale;ctx.setTransform(scale,0,0,scale,0,0);
  function ball(x,y,r,color,label,rotation=0,depth=0){
    const palette=colors[color];ctx.save();
    ctx.shadowColor='#24354225';ctx.shadowBlur=2;ctx.shadowOffsetY=1;
    const fill=ctx.createRadialGradient(x-r*.38,y-r*.45,r*.02,x+r*.15,y+r*.12,r*1.1);
    fill.addColorStop(0,palette[0]);fill.addColorStop(.35,palette[1]);fill.addColorStop(.72,palette[1]);fill.addColorStop(1,palette[2]);
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.shadowColor='transparent';
    ctx.save();ctx.beginPath();ctx.arc(x,y,r*.91,0,Math.PI*2);ctx.clip();ctx.translate(x,y);ctx.rotate(rotation);
    const labelOffset=Math.sin(rotation*.6)*r*.35;ctx.scale(.82+.18*Math.cos(rotation*.6),1);
    ctx.fillStyle='#10181ee0';ctx.font=`bold ${r*1.0}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,labelOffset,1);ctx.restore();
    ctx.beginPath();ctx.ellipse(x-r*.36,y-r*.43,r*.3,r*.16,-.6,0,Math.PI*2);ctx.fillStyle='#ffffff70';ctx.fill();
    if(depth<0){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=`rgba(230,235,239,${-depth/700})`;ctx.fill();}
    ctx.restore();
  }
  function paddle(angle){
    ctx.save();ctx.translate(180,141);ctx.rotate(angle);ctx.lineWidth=1;
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);const g=ctx.createLinearGradient(0,-5,0,5);g.addColorStop(0,'#ffffffaa');g.addColorStop(.5,'#909aa44d');g.addColorStop(1,'#ffffffaa');ctx.fillStyle=g;ctx.strokeStyle='#8b98a34d';ctx.beginPath();ctx.roundRect(8,-5,83,10,3);ctx.fill();ctx.stroke();}
    ctx.fillStyle='#949ca5';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function paint(time){
    ctx.clearRect(0,0,360,390);
    const elapsed=(time-started)/1000;
    const released=release?Math.min((time-release)/1200,1):0;
    const energy=active&&!reducedMotion.matches?Math.min(elapsed/1.1,1)*(release?1-released*.8:1):0;
    if(!reducedMotion.matches){const delta=Math.min((time-lastTime)/1000||0,.05);const n=Math.max(1,Math.ceil(delta*120));for(let i=0;i<n;i++)stepBalls(balls,delta/n,energy,elapsed+i*delta/n);}lastTime=time;
    if(photograph.complete&&photograph.naturalWidth)ctx.drawImage(photograph,0,0,360,360);
    ctx.save();ctx.beginPath();ctx.arc(180,141,113,0,Math.PI*2);ctx.clip();
    paddle(active?elapsed*2.6:0);
    for(const b of [...balls].sort((a,b)=>a.z-b.z)){
      if(b.selected)continue;const perspective=1+b.z/850;
      ball(180+b.x*perspective,141+b.y*perspective,b.r*(1+b.z/650),b.color,b.label,b.spin,b.z);
    }
    // A fixed glass veil and fixed highlights keep the globe anchored over moving balls.
    const glass=ctx.createRadialGradient(155,111,22,180,141,113);glass.addColorStop(0,'#ffffff00');glass.addColorStop(.75,'#ffffff00');glass.addColorStop(1,'#e5edf35c');ctx.fillStyle=glass;ctx.fillRect(65,26,230,230);ctx.restore();
    ctx.save();ctx.strokeStyle='#ffffffa0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(180,141,114,-2.62,-1.82);ctx.stroke();ctx.restore();
    if(release){
      for(let i=0;i<selected.length;i++){
        const b=selected[i],p=Math.max(0,Math.min((released-i*.047)/.5,1));
        if(p===0)continue;
        const x=p<.5?180+65*(p*2):245+((20+i*35)-245)*((p-.5)*2);
        const y=p<.5?230+65*(p*2):295+80*((p-.5)*2);
        ball(x,y,11,b.color,String(i+1),p*4);
      }
    }
    if(active&&!reducedMotion.matches)frame=requestAnimationFrame(paint);
  }
  photograph.onload=()=>{if(!active){lastTime=performance.now();for(let i=0;i<180;i++)stepBalls(balls,1/120,0,0);paint(lastTime);}};
  photograph.onerror=()=>{heading.hidden=false;heading.textContent='추첨기 이미지를 불러오지 못했어요.';};
  function stop(){active=false;cancelAnimationFrame(frame);stage.hidden=true;document.body.classList.remove('drawing');document.body.classList.remove('landing');}
  return {
    start(keyword){
      if(active)return;active=true;release=0;started=lastTime=performance.now();total=10;balls=createBalls();selected=[];
      for(let i=0;i<180;i++)stepBalls(balls,1/120,0,0);
      heading.hidden=false;message.hidden=false;heading.textContent=`‘${keyword}’ 아이디어 뽑는 중`;message.textContent='공을 섞으며 새로운 실마리를 찾고 있어요.';stage.hidden=false;document.body.classList.add('drawing');paint(started);
    },
    async finish(count){
      if(!active)return;total=Math.min(count,10);
      if(count>0){
        if(!reducedMotion.matches)await wait(Math.max(0,4000-(performance.now()-started)));
        selected=[...balls].sort((a,b)=>b.y-a.y).slice(0,total);selected.forEach(b=>b.selected=true);
        heading.textContent=`${count}가지 실마리를 뽑았어요.`;message.textContent='잠시 후 이미지가 나타납니다.';release=performance.now();
        if(!reducedMotion.matches)await wait(1350);
      }
      stop();
    },stop
  };
}
