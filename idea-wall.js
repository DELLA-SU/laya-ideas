export function wallSize(width,height){
  const columns=Math.max(2,Math.min(6,Math.floor((width+20)/220)));
  const cardWidth=(width-(columns-1)*20)/columns;
  const count=Math.min(100,Math.max(columns*2,Math.ceil(height/(cardWidth*.95+20))*columns+columns));
  return {columns,count};
}
export function layoutWall(grid,columns,gap=20){
  const width=grid.clientWidth,cardWidth=(width-(columns-1)*gap)/columns;
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
