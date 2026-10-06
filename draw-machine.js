import {entranceLook} from './entrance-looks.js?v=concepts-5';
export function createDrawMachine(stage,canvas,heading,message){
  const ctx=canvas.getContext('2d'),look=entranceLook();
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const photograph=new Image();
  const scale=Math.min(devicePixelRatio||1,2);
  canvas.width=480*scale;canvas.height=480*scale;ctx.setTransform(scale,0,0,scale,0,0);
  let active=false,frame=0,started=0,illuminated=false;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function paint(time){
    ctx.clearRect(0,0,480,480);
    const elapsed=Math.max(0,(time-started)/1000);
    const ignition=reducedMotion.matches?1:Math.min(elapsed/.65,1);
    const energy=active?(illuminated?1:ignition*(.7+.06*Math.sin(elapsed*2.3))):0;
    if(photograph.complete&&photograph.naturalWidth){
      ctx.save();ctx.drawImage(photograph,0,0,photograph.naturalWidth/2,photograph.naturalHeight/2,0,0,480,480);
      // Feather the photographic edges into the page without cropping the glass.
      ctx.globalCompositeOperation='destination-in';
      const fade=ctx.createLinearGradient(0,0,0,480);
      fade.addColorStop(0,'transparent');fade.addColorStop(.08,'#fff');fade.addColorStop(.82,'#fff');fade.addColorStop(1,'transparent');
      ctx.fillStyle=fade;ctx.fillRect(0,0,480,480);
      const sides=ctx.createLinearGradient(0,0,480,0);
      sides.addColorStop(0,'transparent');sides.addColorStop(.20,'#fff');sides.addColorStop(.80,'#fff');sides.addColorStop(1,'transparent');
      ctx.fillStyle=sides;ctx.fillRect(0,0,480,480);ctx.restore();
    }
    if(active){
      ctx.save();ctx.globalCompositeOperation='screen';
      const glow=ctx.createRadialGradient(240,116,4,240,126,125);
      glow.addColorStop(0,`rgba(255,192,67,${energy*.6})`);
      glow.addColorStop(.42,`rgba(243,159,43,${energy*.25})`);glow.addColorStop(1,'rgba(243,159,43,0)');
      ctx.fillStyle=glow;ctx.fillRect(95,8,290,265);
      ctx.globalAlpha=look.filament?energy:0;ctx.strokeStyle='#ffedb5';ctx.lineWidth=1.4;
      ctx.shadowColor='#ffa42b';ctx.shadowBlur=15;ctx.beginPath();
      for(let x=213;x<=267;x+=.3){const y=115.5+1.8*Math.sin((x-213)*5.9);if(x===213)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
      ctx.stroke();ctx.restore();
    }
    if(active&&!reducedMotion.matches)frame=requestAnimationFrame(paint);
  }
  photograph.onload=()=>paint(performance.now());
  photograph.onerror=()=>{heading.hidden=false;heading.textContent='전구 이미지를 불러오지 못했어요.';};
  photograph.src=new URL('./assets/'+look.asset,import.meta.url).href;
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
