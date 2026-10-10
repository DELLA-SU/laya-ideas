export function clampZoom(value){return Math.max(.25,Math.min(2,value));}
export function fitBoardZoom(bounds,width,height,padding=24){
  return clampZoom(Math.min((width-padding*2)/Math.max(1,bounds.width),(height-padding*2)/Math.max(1,bounds.height)));
}
export function boardDragDelta(delta,zoom){return delta/zoom;}
