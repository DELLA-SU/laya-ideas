export function createDrawMachine(stage,canvas,heading,message){
  const ctx=canvas.getContext('2d');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const photograph=new Image();
  const scale=Math.min(devicePixelRatio||1,2);
  canvas.width=480*scale;canvas.height=480*scale;ctx.setTransform(scale,0,0,scale,0,0);
  let active=false,frame=0,started=0,illuminated=false;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function paint(time){
    ctx.clearRect(0,0,480,480);
    const elapsed=Math.max(0,(time-started)/1000);
    const energy=active?(illuminated?1: .45+.16*Math.sin(elapsed*2.8)):0;
    if(photograph.complete&&photograph.naturalWidth){
      ctx.save();ctx.filter=active?`brightness(${1+energy*.08})`:'none';
      ctx.drawImage(photograph,0,0,480,480);ctx.restore();
    }
    if(active){
      ctx.save();ctx.globalCompositeOperation='screen';
      const glow=ctx.createRadialGradient(240,234,3,240,234,145);
      glow.addColorStop(0,`rgba(255,202,89,${energy*.42})`);
      glow.addColorStop(.4,`rgba(255,185,62,${energy*.14})`);glow.addColorStop(1,'rgba(255,185,62,0)');
      ctx.fillStyle=glow;ctx.fillRect(70,55,340,350);ctx.restore();
    }
    if(active&&!reducedMotion.matches)frame=requestAnimationFrame(paint);
  }
  photograph.onload=()=>paint(performance.now());
  photograph.onerror=()=>{heading.hidden=false;heading.textContent='전구 이미지를 불러오지 못했어요.';};
  photograph.src=new URL('./assets/idea-bulb.png',import.meta.url).href;
  function stop(){active=false;cancelAnimationFrame(frame);stage.hidden=true;document.body.classList.remove('drawing','landing');}
  return {
    start(keyword){
      if(active)return;active=true;illuminated=false;started=performance.now();
      heading.hidden=false;message.hidden=false;heading.textContent='아이디어를 밝히는 중';
      message.textContent=`‘${keyword}’에서 새로운 영감을 찾고 있어요.`;
      stage.hidden=false;document.body.classList.add('drawing');paint(started);
    },
    async finish(count){
      if(!active)return;
      if(count>0){
        if(!reducedMotion.matches)await wait(Math.max(0,900-(performance.now()-started)));
        illuminated=true;heading.textContent='아이디어가 떠올랐다!';message.textContent='';paint(performance.now());
        if(!reducedMotion.matches)await wait(550);
      }
      stop();
    },stop
  };
}
