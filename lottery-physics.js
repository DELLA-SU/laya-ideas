export const DRUM_RADIUS=106;
export function createBalls(random=Math.random,count=36){
  const balls=[];
  for(let i=0;i<count;i++){
    const r=10.5+random()*1.5;let p;
    for(let attempt=0;attempt<2500;attempt++){
      p={x:(random()-.5)*170,y:15+random()*75,z:(random()-.5)*130};
      if(Math.hypot(p.x,p.y,p.z)>DRUM_RADIUS-r-1)continue;
      if(balls.every(b=>Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z)>=r+b.r))break;
    }
    balls.push({...p,r,vx:0,vy:0,vz:0,spin:random()*Math.PI*2,spinSpeed:(random()-.5)*6,color:i%5,label:String(i%10+1),selected:false});
  }
  return balls;
}
export function stepBalls(balls,dt,energy,time){
  for(const b of balls){
    if(b.selected)continue;
    // Gravity, a rotating mixing force, and stronger upward transport on the right.
    b.vx+=(b.y*3.1*energy+Math.sin(time*4+b.color*2)*85*energy)*dt;
    b.vy+=(460-b.x*4.2*energy-(b.x>8&&b.y>0?900*energy:0))*dt;
    b.vz+=(Math.sin(time*3+b.x*.04+b.color)*165*energy)*dt;
    const drag=Math.exp(-.6*dt);b.vx*=drag;b.vy*=drag;b.vz*=drag;
    const speed=Math.hypot(b.vx,b.vy,b.vz);
    if(speed>360){b.vx*=360/speed;b.vy*=360/speed;b.vz*=360/speed;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
    b.spin+=(b.spinSpeed+b.vx*.035)*dt;
  }
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
    const a=balls[i],b=balls[j];if(a.selected||b.selected)continue;
    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.hypot(dx,dy,dz),min=a.r+b.r;
    if(d<min&&d>.0001){
      const nx=dx/d,ny=dy/d,nz=dz/d,overlap=(min-d)*.51;
      a.x-=nx*overlap;a.y-=ny*overlap;a.z-=nz*overlap;
      b.x+=nx*overlap;b.y+=ny*overlap;b.z+=nz*overlap;
      const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny+(b.vz-a.vz)*nz;
      if(relative<0){const impulse=relative*.86;a.vx+=impulse*nx;a.vy+=impulse*ny;a.vz+=impulse*nz;b.vx-=impulse*nx;b.vy-=impulse*ny;b.vz-=impulse*nz;}
      a.spinSpeed=a.vx*.025;b.spinSpeed=b.vx*.025;
    }
  }
  for(const b of balls){
    if(b.selected)continue;
    const d=Math.hypot(b.x,b.y,b.z),limit=DRUM_RADIUS-b.r;
    if(d>limit){
      const nx=b.x/d,ny=b.y/d,nz=b.z/d;b.x=nx*limit;b.y=ny*limit;b.z=nz*limit;
      const outward=b.vx*nx+b.vy*ny+b.vz*nz;
      if(outward>0){b.vx-=1.72*outward*nx;b.vy-=1.72*outward*ny;b.vz-=1.72*outward*nz;}
    }
  }
}
