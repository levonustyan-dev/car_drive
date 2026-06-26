import * as THREE from 'three';
import { scene } from './scene.js';
import { exhaustMat } from './car.js';

// ── Exhaust ───────────────────────────────────────
const EXHAUST_COUNT = 60;
const exhaustPositions = new Float32Array(EXHAUST_COUNT * 3);
const exhaustGeo = new THREE.BufferGeometry();
exhaustGeo.setAttribute('position', new THREE.BufferAttribute(exhaustPositions, 3));
export const exhaustPts = new THREE.Points(exhaustGeo, exhaustMat);
scene.add(exhaustPts);
const exhaustData = Array.from({length:EXHAUST_COUNT}, ()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,maxLife:1}));

export function spawnExhaust(px,py,pz,spd){
  const p=exhaustData.find(p=>p.life<=0); if(!p)return;
  p.x=px-0.6; p.y=py+0.2; p.z=pz-2.0;
  p.vx=(Math.random()-0.5)*0.05; p.vy=0.02+Math.random()*0.04; p.vz=-(0.1+spd*0.02);
  p.maxLife=p.life=0.5+Math.random()*0.5;
}
export function updateExhaust(dt){
  for(let i=0;i<EXHAUST_COUNT;i++){
    const p=exhaustData[i];
    if(p.life>0){ p.life-=dt; p.x+=p.vx; p.y+=p.vy; p.z+=p.vz;
      exhaustPositions[i*3]=p.x; exhaustPositions[i*3+1]=p.y; exhaustPositions[i*3+2]=p.z;
    } else { exhaustPositions[i*3]=1e8; exhaustPositions[i*3+1]=1e8; exhaustPositions[i*3+2]=1e8; }
  }
  exhaustGeo.attributes.position.needsUpdate=true;
}

// ── Sparks ────────────────────────────────────────
const SPARK_COUNT = 80;
const sparkPos = new Float32Array(SPARK_COUNT * 3);
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
export const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({color:0xffaa00,size:0.18,transparent:true,opacity:0,sizeAttenuation:true}));
scene.add(sparks);
const sparkData = Array.from({length:SPARK_COUNT}, ()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0}));
const sparkMat = sparks.material;
let sparksActive = false;

export function spawnSparks(px,py,pz){
  sparksActive=true; sparkMat.opacity=1;
  sparkData.forEach(p=>{ p.x=px; p.y=py+0.5; p.z=pz; p.vx=(Math.random()-0.5)*0.4; p.vy=Math.random()*0.3; p.vz=(Math.random()-0.5)*0.4; p.life=1; });
}
export function updateSparks(dt){
  if(!sparksActive)return;
  let any=false;
  for(let i=0;i<SPARK_COUNT;i++){
    const p=sparkData[i];
    if(p.life>0){ any=true; p.life-=dt*1.5; p.x+=p.vx; p.y+=p.vy; p.z+=p.vz; p.vy-=0.02;
      sparkPos[i*3]=p.x; sparkPos[i*3+1]=p.y; sparkPos[i*3+2]=p.z;
    } else { sparkPos[i*3]=1e8; sparkPos[i*3+1]=1e8; sparkPos[i*3+2]=1e8; }
  }
  sparkGeo.attributes.position.needsUpdate=true;
  if(!any){ sparksActive=false; sparkMat.opacity=0; }
  else sparkMat.opacity=Math.max(0,sparkData[0].life);
}

// ── Rain ──────────────────────────────────────────
const RAIN_COUNT = 200;
const rainPositions = new Float32Array(RAIN_COUNT * 3);
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainMat = new THREE.PointsMaterial({color:0xaaccff,size:0.18,transparent:true,opacity:0.55,sizeAttenuation:true});
export const rainPts = new THREE.Points(rainGeo, rainMat);
scene.add(rainPts);
const rainData = Array.from({length:RAIN_COUNT}, ()=>({x:0,y:0,z:0}));

function resetRainParticle(p,pz){ p.x=(Math.random()-0.5)*30; p.y=15+Math.random()*5; p.z=pz+5+Math.random()*45; }
export function initRain(pz){ rainData.forEach(p=>resetRainParticle(p,pz)); }
export function updateRain(dt,playerSpeed,pz){
  for(let i=0;i<RAIN_COUNT;i++){
    const p=rainData[i]; p.z+=playerSpeed*dt; p.y-=8*dt; p.x-=2*dt;
    if(p.y<0||p.z<pz-10) resetRainParticle(p,pz);
    rainPositions[i*3]=p.x; rainPositions[i*3+1]=p.y; rainPositions[i*3+2]=p.z;
  }
  rainGeo.attributes.position.needsUpdate=true;
}
