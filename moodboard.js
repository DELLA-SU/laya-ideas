import {clampZoom,fitBoardZoom,boardDragDelta} from './board-geometry.js?v=1';
export function createMoodboard(getSaved,localize=async item=>item,onEditDraft=null){
  const $=s=>document.querySelector(s),surface=$('#boardSurface'),viewport=$('#boardViewport'),plane=$('#boardPlane');
  let zoom=1,worldWidth=1800,worldHeight=2200;
  let data;try{data=JSON.parse(localStorage.getItem('laya:board:v1'))||{};}catch{data={};}
  data.positions=data.positions||{};data.notes=Array.isArray(data.notes)?data.notes:[];
  data.arrows=Array.isArray(data.arrows)?data.arrows.filter(a=>a?.id&&a.from&&a.to&&a.from!==a.to):[];
  let connecting=false,fromId=null,selectedArrow=null;
  const cards=new Map(),ns='http://www.w3.org/2000/svg';let arrowLayer;
  function applyZoom(value,center=true){
    const previous=zoom,cx=(viewport.scrollLeft+viewport.clientWidth/2)/previous,cy=(viewport.scrollTop+viewport.clientHeight/2)/previous;
    zoom=clampZoom(value);surface.style.transform=`scale(${zoom})`;
    plane.style.width=worldWidth*zoom+'px';plane.style.height=worldHeight*zoom+'px';
    $('#boardZoomValue').textContent=Math.round(zoom*100)+'%';
    $('#boardZoomOut').disabled=zoom<=.25;$('#boardZoomIn').disabled=zoom>=2;
    if(center)viewport.scrollTo(Math.max(0,cx*zoom-viewport.clientWidth/2),Math.max(0,cy*zoom-viewport.clientHeight/2));
  }
  function fitBoard(){
    if(!cards.size){applyZoom(1,false);viewport.scrollTo(0,0);return;}
    const list=[...cards.values()],left=Math.min(...list.map(c=>c.offsetLeft)),top=Math.min(...list.map(c=>c.offsetTop));
    const right=Math.max(...list.map(c=>c.offsetLeft+c.offsetWidth)),bottom=Math.max(...list.map(c=>c.offsetTop+c.offsetHeight));
    applyZoom(fitBoardZoom({width:right-left,height:bottom-top},viewport.clientWidth,viewport.clientHeight),false);
    viewport.scrollTo(Math.max(0,(left+right)/2*zoom-viewport.clientWidth/2),Math.max(0,(top+bottom)/2*zoom-viewport.clientHeight/2));
  }
  $('#boardZoomOut').onclick=()=>applyZoom(zoom-.1);$('#boardZoomIn').onclick=()=>applyZoom(zoom+.1);$('#boardZoomReset').onclick=()=>applyZoom(1);$('#boardFit').onclick=fitBoard;
  $('#boardFullscreen').onclick=()=>{const active=$('#boardDialog').classList.toggle('board-fullscreen');$('#boardFullscreen').setAttribute('aria-pressed',String(active));$('#boardFullscreen').textContent=active?'창으로 보기':'화면 채우기';};
  viewport.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();applyZoom(zoom*(e.deltaY<0?1.1:1/1.1));},{passive:false});
  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('.board-card,.board-arrows g'))return;
    const start={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('board-panning');
    viewport.onpointermove=event=>viewport.scrollTo(start.left+start.x-event.clientX,start.top+start.y-event.clientY);
    const finish=()=>{viewport.onpointermove=null;viewport.classList.remove('board-panning');};viewport.onpointerup=finish;viewport.onpointercancel=finish;
  });
  function setConnecting(value){
    connecting=value;fromId=null;selectedArrow=null;
    $('#connectBoard').setAttribute('aria-pressed',String(value));
    $('#deleteBoardArrow').disabled=true;surface.classList.toggle('connecting',value);
    $('#boardStatus').textContent=value?'시작 카드 → 도착 카드 순서로 선택하세요.':'';
    cards.forEach(card=>card.classList.remove('connection-start'));drawArrows();
  }
  function chooseEndpoint(id){
    if(!connecting)return;
    if(!fromId){fromId=id;cards.get(id).classList.add('connection-start');$('#boardStatus').textContent='도착 카드를 선택하세요.';return;}
    if(fromId===id){$('#boardStatus').textContent='다른 카드를 선택하세요.';return;}
    if(!data.arrows.some(a=>a.from===fromId&&a.to===id))data.arrows.push({id:crypto.randomUUID(),from:fromId,to:id});
    persist();setConnecting(false);drawArrows();
  }
  function edgePoint(card,other){
    const x=card.offsetLeft+card.offsetWidth/2,y=card.offsetTop+card.offsetHeight/2;
    const dx=other.offsetLeft+other.offsetWidth/2-x,dy=other.offsetTop+other.offsetHeight/2-y;
    const scale=Math.min((card.offsetWidth/2+5)/(Math.abs(dx)||.001),(card.offsetHeight/2+5)/(Math.abs(dy)||.001));
    return {x:x+dx*scale,y:y+dy*scale};
  }
  function drawArrows(){
    if(!arrowLayer)return;worldWidth=Math.max(1800,...[...cards.values()].map(c=>c.offsetLeft+c.offsetWidth+30));worldHeight=Math.max(2200,...[...cards.values()].map(c=>c.offsetTop+c.offsetHeight+30));surface.style.width=worldWidth+'px';surface.style.height=worldHeight+'px';plane.style.width=worldWidth*zoom+'px';plane.style.height=worldHeight*zoom+'px';arrowLayer.setAttribute('width',worldWidth);arrowLayer.setAttribute('height',worldHeight);arrowLayer.replaceChildren();
    const defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');
    marker.id='board-arrow-head';marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','9');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','8');marker.setAttribute('markerHeight','8');marker.setAttribute('orient','auto');
    const head=document.createElementNS(ns,'path');head.setAttribute('d','M 0 0 L 10 5 L 0 10 z');head.setAttribute('fill','#111');marker.append(head);defs.append(marker);arrowLayer.append(defs);
    for(const arrow of data.arrows){
      const from=cards.get(arrow.from),to=cards.get(arrow.to);if(!from||!to)continue;
      const a=edgePoint(from,to),b=edgePoint(to,from);
      const group=document.createElementNS(ns,'g');group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`${from.dataset.title} → ${to.dataset.title} 연결 선택`);
      const line=document.createElementNS(ns,'path');line.setAttribute('d',`M ${a.x} ${a.y} L ${b.x} ${b.y}`);line.setAttribute('fill','none');line.setAttribute('stroke',selectedArrow===arrow.id?'#6750b5':'#111');line.setAttribute('stroke-width',selectedArrow===arrow.id?'3':'1.5');line.setAttribute('marker-end','url(#board-arrow-head)');
      const hit=line.cloneNode();hit.removeAttribute('marker-end');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','18');hit.style.pointerEvents='stroke';
      const select=()=>{selectedArrow=arrow.id;$('#deleteBoardArrow').disabled=false;$('#boardStatus').textContent='선택한 화살표를 삭제할 수 있어요.';drawArrows();};
      group.onclick=select;group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};group.append(line,hit);arrowLayer.append(group);
    }
  }
  const observer=new ResizeObserver(()=>drawArrows());

  function persist(){try{localStorage.setItem('laya:board:v1',JSON.stringify(data));$('#boardStatus').textContent='';}catch{$('#boardStatus').textContent='보드 저장 공간이 부족해요.';}}
  function el(tag,content,cls){const n=document.createElement(tag);if(content)n.textContent=content;if(cls)n.className=cls;return n;}
  function attach(card,id,index){
    card.dataset.boardId=id;card.dataset.title=card.querySelector('.board-handle').textContent.replace(/^↔ /,'');cards.set(id,card);observer.observe(card);
    card.addEventListener('click',e=>{if(connecting){e.preventDefault();e.stopPropagation();chooseEndpoint(id);}},{capture:true});
    const pos=data.positions[id]||{x:30+(index%5)*270,y:30+Math.floor(index/5)*370};
    card.style.left=pos.x+'px';card.style.top=pos.y+'px';
    const handle=card.querySelector('.board-handle');
    handle.onpointerdown=e=>{
      if(e.button!==0||connecting)return;e.preventDefault();handle.setPointerCapture(e.pointerId);card.style.zIndex=10;
      const start={x:e.clientX,y:e.clientY,left:parseFloat(card.style.left),top:parseFloat(card.style.top)};
      handle.onpointermove=event=>{card.style.left=Math.max(0,Math.min(worldWidth-card.offsetWidth,start.left+boardDragDelta(event.clientX-start.x,zoom)))+'px';card.style.top=Math.max(0,Math.min(worldHeight-card.offsetHeight,start.top+boardDragDelta(event.clientY-start.y,zoom)))+'px';drawArrows();};
      const finish=()=>{handle.onpointermove=null;card.style.zIndex='';data.positions[id]={x:parseFloat(card.style.left),y:parseFloat(card.style.top)};persist();};
      handle.onpointerup=finish;handle.onpointercancel=finish;
    };
    handle.onkeydown=e=>{
      const moves={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};if(!moves[e.key])return;
      e.preventDefault();const [x,y]=moves[e.key];data.positions[id]={x:Math.max(0,Math.min(1530,parseFloat(card.style.left)+x)),y:Math.max(0,Math.min(1600,parseFloat(card.style.top)+y))};card.style.left=data.positions[id].x+'px';card.style.top=data.positions[id].y+'px';persist();drawArrows();
    };
    surface.append(card);
  }
  function ref(item){
    if(item.kind==='reading'){const text=el('div',null,'board-reading');text.append(el('small',item.readingType),el('p',item.title));if(item.description)text.append(el('p',item.description));return text;}
    const img=el('img');img.src=item.image;img.alt=item.title;return img;
  }
  function render(){
    observer.disconnect();cards.clear();surface.replaceChildren();const items=getSaved();
    arrowLayer=document.createElementNS(ns,'svg');arrowLayer.classList.add('board-arrows');arrowLayer.setAttribute('width','1800');arrowLayer.setAttribute('height','2200');surface.append(arrowLayer);
    items.forEach((item,index)=>{
      const card=el('article',null,'board-card'),handle=el('button','↔ '+(item.keyword||item.title),'board-handle');handle.setAttribute('aria-label',(item.keyword||item.title)+' 카드 이동');card.append(handle);
      if(item.kind==='connection'&&item.image){const draft=el('img');draft.src=item.image;draft.alt=item.keyword;draft.className='board-draft';card.append(draft,el('p',item.idea,'board-idea'));if(onEditDraft&&item.studio){const edit=el('button','제작실에서 수정','board-edit-draft');edit.onclick=()=>{$('#boardDialog').close();onEditDraft(item);};card.append(edit);}}
      else if(item.kind==='connection'){const pair=el('div',null,'board-pair');for(const r of item.references||[])pair.append(ref(r));card.append(pair,el('p',item.idea,'board-idea'));}
      else{card.append(ref(item));const source=el('a','원문 ↗');source.href=item.source;source.target='_blank';source.rel='noopener noreferrer';card.append(source);}
      attach(card,item.id,index);
    });
    const noteLabels={memo:'메모',idea:'아이디어',question:'질문',task:'할 일',section:'섹션 제목',palette:'색상 팔레트'};
    data.notes.forEach((note,index)=>{
      const kind=note.kind||'memo',label=noteLabels[kind]||'메모';
      const card=el('article',null,'board-card board-note board-note-'+kind),handle=el('button','↔ '+label,'board-handle');handle.setAttribute('aria-label',label+' 카드 이동');card.append(handle);
      card.dataset.tone=note.tone||'neutral';
      if(kind==='palette'){
        note.colors=Array.isArray(note.colors)?note.colors:['#080813','#a0bddb','#ffffff'];
        const colors=el('div',null,'board-palette');note.colors.forEach((color,i)=>{const swatch=el('label'),input=el('input'),code=el('span',color.toUpperCase());input.type='color';input.value=color;input.setAttribute('aria-label',`${i+1}번 팔레트 색상`);input.oninput=()=>{note.colors[i]=input.value;code.textContent=input.value.toUpperCase();persist();};swatch.append(input,code);colors.append(swatch);});card.append(colors);
      }else{
        const text=el('textarea');text.value=note.text;text.placeholder={memo:'연결되는 생각을 적어보세요.',idea:'무엇을 만들고 싶은가요?',question:'무엇이 궁금한가요?',task:'다음에 할 일을 적어보세요.',section:'섹션 제목'}[kind];text.maxLength=kind==='section'?120:2000;text.setAttribute('aria-label',kind==='section'?'무드보드 섹션 제목':'브레인스토밍 메모');text.oninput=()=>{note.text=text.value;persist();};card.append(text);
      }
      const tools=el('div',null,'board-note-tools');
      if(!['section','palette'].includes(kind)){
        const tones=el('select');tones.setAttribute('aria-label','메모 색상');for(const [value,name] of [['neutral','기본'],['blue','파랑'],['purple','보라'],['green','초록']]){const option=el('option',name);option.value=value;tones.append(option);}tones.value=note.tone||'neutral';tones.onchange=()=>{note.tone=tones.value;card.dataset.tone=note.tone;persist();};tools.append(tones);
      }
      const duplicate=el('button','복제','board-remove');duplicate.onclick=()=>{const id='note-'+crypto.randomUUID();data.notes.push({...note,id,colors:note.colors?[...note.colors]:undefined});data.positions[id]={x:Math.min(1530,card.offsetLeft+35),y:Math.min(1600,card.offsetTop+35)};persist();render();};
      const remove=el('button','삭제','board-remove');remove.setAttribute('aria-label',label+' 삭제');remove.onclick=()=>{data.notes=data.notes.filter(n=>n.id!==note.id);delete data.positions[note.id];data.arrows=data.arrows.filter(a=>a.from!==note.id&&a.to!==note.id);persist();render();};
      tools.append(duplicate,remove);card.append(tools);attach(card,note.id,items.length+index);
    });
    $('#boardEmpty').hidden=items.length+data.notes.length>0;drawArrows();
  }
  $('#boardToggle').onclick=async()=>{const items=getSaved();$('#boardToggle').disabled=true;try{await Promise.all(items.flatMap(item=>[item,...(item.references||[])]).map(localize));}finally{$('#boardToggle').disabled=false;}render();$('#boardDialog').showModal();setConnecting(false);drawArrows();applyZoom(zoom,false);};
  $('#closeBoard').onclick=()=>{$('#boardDialog').close();setConnecting(false);};
  $('#connectBoard').onclick=()=>setConnecting(!connecting);
  $('#deleteBoardArrow').onclick=()=>{data.arrows=data.arrows.filter(a=>a.id!==selectedArrow);persist();selectedArrow=null;$('#deleteBoardArrow').disabled=true;drawArrows();};
  $('#boardDialog').addEventListener('keydown',e=>{if(e.key==='Escape'&&connecting){e.preventDefault();setConnecting(false);}});
  function addNote(kind){
    const id='note-'+crypto.randomUUID();data.notes.push({id,text:'',kind});
    const x=Math.min(1530,Math.max(30,(viewport.scrollLeft+viewport.clientWidth/2)/zoom-125)),y=Math.min(1600,Math.max(30,(viewport.scrollTop+viewport.clientHeight/2)/zoom-100));
    data.positions[id]={x,y};persist();render();surface.lastChild.querySelector('textarea,input')?.focus({preventScroll:true});
  }
  $('#addBoardNote').onclick=()=>addNote($('#boardNoteType').value);
  $('#addBoardSection').onclick=()=>addNote('section');$('#addBoardPalette').onclick=()=>addNote('palette');
  $('#arrangeBoard').onclick=()=>{const ids=[...getSaved().map(x=>x.id),...data.notes.map(x=>x.id)];const step=Math.max(270,...[...cards.values()].map(c=>c.offsetWidth+20)),rowHeight=Math.max(180,...[...cards.values()].map(c=>c.offsetHeight+30)),columns=Math.max(1,Math.min(5,Math.ceil(Math.sqrt(ids.length*viewport.clientWidth/Math.max(1,viewport.clientHeight)*rowHeight/step))));let y=30;for(let start=0;start<ids.length;start+=columns){const row=ids.slice(start,start+columns);row.forEach((id,i)=>{data.positions[id]={x:30+i*step,y};});y+=Math.max(180,...row.map(id=>cards.get(id)?.offsetHeight||0))+30;}persist();render();fitBoard();};
}
