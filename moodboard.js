export function createMoodboard(getSaved,localize=async item=>item,onEditDraft=null){
  const $=s=>document.querySelector(s),surface=$('#boardSurface');
  let data;try{data=JSON.parse(localStorage.getItem('laya:board:v1'))||{};}catch{data={};}
  data.positions=data.positions||{};data.notes=Array.isArray(data.notes)?data.notes:[];
  data.arrows=Array.isArray(data.arrows)?data.arrows.filter(a=>a?.id&&a.from&&a.to&&a.from!==a.to):[];
  let connecting=false,fromId=null,selectedArrow=null;
  const cards=new Map(),ns='http://www.w3.org/2000/svg';let arrowLayer;
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
    if(!arrowLayer)return;arrowLayer.replaceChildren();
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
      handle.onpointermove=event=>{card.style.left=Math.max(0,Math.min(1530,start.left+event.clientX-start.x))+'px';card.style.top=Math.max(0,Math.min(1600,start.top+event.clientY-start.y))+'px';drawArrows();};
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
    arrowLayer=document.createElementNS(ns,'svg');arrowLayer.classList.add('board-arrows');arrowLayer.setAttribute('width','1800');arrowLayer.setAttribute('height','2000');surface.append(arrowLayer);
    items.forEach((item,index)=>{
      const card=el('article',null,'board-card'),handle=el('button','↔ '+(item.keyword||item.title),'board-handle');handle.setAttribute('aria-label',(item.keyword||item.title)+' 카드 이동');card.append(handle);
      if(item.kind==='connection'&&item.image){const draft=el('img');draft.src=item.image;draft.alt=item.keyword;draft.className='board-draft';card.append(draft,el('p',item.idea,'board-idea'));if(onEditDraft&&item.studio){const edit=el('button','제작실에서 수정','board-edit-draft');edit.onclick=()=>{$('#boardDialog').close();onEditDraft(item);};card.append(edit);}}
      else if(item.kind==='connection'){const pair=el('div',null,'board-pair');for(const r of item.references||[])pair.append(ref(r));card.append(pair,el('p',item.idea,'board-idea'));}
      else{card.append(ref(item));const source=el('a','원문 ↗');source.href=item.source;source.target='_blank';source.rel='noopener noreferrer';card.append(source);}
      attach(card,item.id,index);
    });
    data.notes.forEach((note,index)=>{
      const card=el('article',null,'board-card board-note'),handle=el('button','↔ 메모','board-handle');handle.setAttribute('aria-label','메모 카드 이동');
      const text=el('textarea');text.value=note.text;text.placeholder='연결되는 생각을 적어보세요.';text.maxLength=2000;text.setAttribute('aria-label','브레인스토밍 메모');text.oninput=()=>{note.text=text.value;persist();};
      const remove=el('button','메모 삭제','board-remove');remove.onclick=()=>{data.notes=data.notes.filter(n=>n.id!==note.id);delete data.positions[note.id];data.arrows=data.arrows.filter(a=>a.from!==note.id&&a.to!==note.id);persist();render();};
      card.append(handle,text,remove);attach(card,note.id,items.length+index);
    });
    $('#boardEmpty').hidden=items.length+data.notes.length>0;drawArrows();
  }
  $('#boardToggle').onclick=async()=>{const items=getSaved();$('#boardToggle').disabled=true;try{await Promise.all(items.flatMap(item=>[item,...(item.references||[])]).map(localize));}finally{$('#boardToggle').disabled=false;}render();$('#boardDialog').showModal();setConnecting(false);drawArrows();};
  $('#closeBoard').onclick=()=>{$('#boardDialog').close();setConnecting(false);};
  $('#connectBoard').onclick=()=>setConnecting(!connecting);
  $('#deleteBoardArrow').onclick=()=>{data.arrows=data.arrows.filter(a=>a.id!==selectedArrow);persist();selectedArrow=null;$('#deleteBoardArrow').disabled=true;drawArrows();};
  $('#boardDialog').addEventListener('keydown',e=>{if(e.key==='Escape'&&connecting){e.preventDefault();setConnecting(false);}});
  $('#addBoardNote').onclick=()=>{const id='note-'+crypto.randomUUID();data.notes.push({id,text:''});const index=getSaved().length+data.notes.length-1,columns=Math.max(1,Math.min(5,Math.floor($('#boardViewport').clientWidth/270)));data.positions[id]={x:30+(index%columns)*270,y:30+Math.floor(index/columns)*370};persist();render();surface.lastChild.querySelector('textarea').focus({preventScroll:true});};
  $('#arrangeBoard').onclick=()=>{const ids=[...getSaved().map(x=>x.id),...data.notes.map(x=>x.id)];const columns=Math.max(1,Math.min(5,Math.floor($('#boardViewport').clientWidth/270)));ids.forEach((id,i)=>{data.positions[id]={x:30+(i%columns)*270,y:30+Math.floor(i/columns)*370};});persist();render();$('#boardViewport').scrollTo(0,0);};
}
