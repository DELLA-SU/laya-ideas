export function wallSize(width,height){
  const columns=Math.max(2,Math.min(6,Math.floor((width+20)/220)));
  const rows=Math.max(columns===2&&height>=300?2:1,Math.min(4,Math.floor((height+20)/250)));
  const count=columns*rows;
  return {columns,count};
}
export function layoutWall(grid,columns,gap=20,fitHeight=0){
  const width=grid.clientWidth,cardWidth=(width-(columns-1)*gap)/columns;
  if(fitHeight>0){
    const rows=Math.max(1,Math.ceil(grid.children.length/columns));
    const height=Math.max(1,(fitHeight-(rows-1)*gap)/rows);
    Array.from(grid.children).forEach((card,index)=>{
      card.style.width=cardWidth+'px';card.style.height=height+'px';
      card.style.left=(index%columns)*(cardWidth+gap)+'px';
      card.style.top=Math.floor(index/columns)*(height+gap)+'px';
    });
    grid.style.height=fitHeight+'px';return fitHeight;
  }
  const bottoms=Array(columns).fill(0);
  for(const card of grid.children){
    card.style.width=cardWidth+'px';
    const column=bottoms.indexOf(Math.min(...bottoms));
    card.style.left=(column*(cardWidth+gap))+'px';card.style.top=bottoms[column]+'px';
    bottoms[column]+=card.offsetHeight+gap;
  }
  grid.style.height=Math.max(0,...bottoms)+'px';
  return Math.min(...bottoms)-gap;
}
export function readingQuota(count){return Math.max(2,Math.round(count*.30));}
export function mixWall(images,readings,columns){
  const items=[...images];
  readings.forEach((item,index)=>items.splice(Math.min(items.length,1+index*columns),0,item));
  return items;
}
