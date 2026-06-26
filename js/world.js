import * as THREE from 'three';
import { scene } from './scene.js';
import {
  ROAD_WIDTH, SEG_LEN, NUM_SEGS, BLDG_SPACING, NUM_BLDGS, FURN_SPACING, NUM_FURN
} from './constants.js';
import {
  stdMat, box, cyl,
  mAsphalt, mAsphaltLine, mYellowLine, mCurb,
  mBarrier, mBarrierMid, mBarrierTop,
  mGuardPost, mGuardRail, mGravel, mTerrain, mRock, mHill, mReflector
} from './materials.js';

// ── Road ──────────────────────────────────────────
function addJerseyBarrier(g, x, len) {
  const base = box(0.7,0.3,len,mBarrier); base.position.set(x,0.15,0); g.add(base);
  const mid  = box(0.5,0.4,len,mBarrierMid); mid.position.set(x,0.55,0); g.add(mid);
  const top2 = box(0.25,0.15,len,mBarrierTop); top2.position.set(x,0.82,0); g.add(top2);
  for(let z=-len/2; z<len/2; z+=20){
    const ref=box(0.06,0.06,0.06,mReflector); ref.position.set(x-0.12,0.9,z); g.add(ref);
  }
}
function addGuardrail(g, x, len) {
  for(let z=-len/2+2; z<len/2; z+=6){
    const post=box(0.08,0.75,0.08,mGuardPost); post.position.set(x,0.375,z); g.add(post);
  }
  const rail=box(0.06,0.18,len,mGuardRail); rail.position.set(x,0.58,0); g.add(rail);
}
function makeRoadSegment(z) {
  const g=new THREE.Group();
  const road=box(ROAD_WIDTH+0.4,0.08,SEG_LEN,mAsphalt); road.position.y=-0.04; g.add(road);
  const center=box(0.14,0.01,SEG_LEN,mYellowLine); center.position.set(0,0.04,0); g.add(center);
  [-ROAD_WIDTH/2+0.3, ROAD_WIDTH/2-0.3].forEach(x=>{
    const s=box(0.12,0.01,SEG_LEN,mAsphaltLine); s.position.set(x,0.04,0); g.add(s);
  });
  [-1,1].forEach(s=>{
    const curb=box(0.6,0.14,SEG_LEN,mCurb); curb.position.set(s*(ROAD_WIDTH/2+0.3),0.04,0); g.add(curb);
  });
  addJerseyBarrier(g, ROAD_WIDTH/2+0.9, SEG_LEN);
  addGuardrail(g, -(ROAD_WIDTH/2+0.9), SEG_LEN);
  [-1,1].forEach(s=>{
    const grav=box(4,0.06,SEG_LEN,mGravel); grav.position.set(s*(ROAD_WIDTH/2+3),-0.01,0); g.add(grav);
    const terr=box(50,0.1,SEG_LEN,mTerrain); terr.position.set(s*(ROAD_WIDTH/2+28),-0.05,0); g.add(terr);
  });
  for(let i=0;i<2;i++){
    const rx=-(ROAD_WIDTH/2+3+Math.random()*14), rz=-SEG_LEN/2+Math.random()*SEG_LEN, rs=0.4+Math.random()*2;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(rs,0),mRock);
    rock.position.set(rx,rs*0.35,rz); rock.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);
    rock.castShadow=true; g.add(rock);
  }
  const hill=new THREE.Mesh(new THREE.BoxGeometry(20,5,SEG_LEN),mHill);
  hill.position.set(-(ROAD_WIDTH/2+15),1,0); hill.receiveShadow=true; g.add(hill);
  g.position.z=z;
  return g;
}

export const segments=[];
for(let i=0;i<NUM_SEGS;i++){
  const s=makeRoadSegment(i*SEG_LEN); scene.add(s); segments.push(s);
}

// ── Buildings ─────────────────────────────────────
const bldgPalette=[0x3d4f5f,0x4a5040,0x5f4a3d,0x3d3d50,0x4a4040].map(c=>stdMat(c,0.95));
const winMatLit=[
  new THREE.MeshStandardMaterial({color:0xffcc77,emissive:0xdd9933,emissiveIntensity:1.5,roughness:0.1}),
  new THREE.MeshStandardMaterial({color:0xaaccff,emissive:0x6699cc,emissiveIntensity:1.5,roughness:0.1}),
];
const winMatDark=new THREE.MeshStandardMaterial({color:0x222233,roughness:0.5});

function makeBuilding(z) {
  const g=new THREE.Group();
  const floors=4+Math.floor(Math.random()*8);
  const w=7+Math.random()*8, d=6+Math.random()*6, h=floors*3;
  const bMat=bldgPalette[Math.floor(Math.random()*bldgPalette.length)];
  const base=box(w,h,d,bMat); base.position.y=h/2; g.add(base);
  const winRows=floors, winCols=Math.floor(w/2);
  for(let row=0;row<winRows;row++) for(let col=0;col<winCols;col++){
    const lit=Math.random()>0.3;
    const wm=lit?winMatLit[Math.random()>0.5?0:1]:winMatDark;
    const win=box(0.7,1.0,0.06,wm); win.position.set(-w/2+1.2+col*(w/winCols),2+row*3,d/2+0.04); g.add(win);
  }
  if(Math.random()>0.5){ const p=box(w*0.5,2.5,d*0.5,bMat); p.position.y=h+1.25; g.add(p); }
  if(Math.random()>0.7){ const t=cyl(0.6,0.8,1.2,8,stdMat(0x554433,0.9)); t.position.set(w*0.3,h+1.2,d*0.2); g.add(t); }
  const side=Math.random()>0.3?1:-1;
  g.position.set(side>0?(ROAD_WIDTH/2+5+Math.random()*8):-(ROAD_WIDTH/2+5+Math.random()*8),0,z);
  return g;
}
export const buildingPool=[];
for(let i=0;i<NUM_BLDGS;i++){ const b=makeBuilding(i*BLDG_SPACING); scene.add(b); buildingPool.push(b); }

// ── Street furniture ──────────────────────────────
const mLampPole =stdMat(0x445566,0.7,0.3);
const mLampHouse=stdMat(0x334455,0.5,0.5);
const mLampGlow =new THREE.MeshStandardMaterial({color:0xffee88,emissive:0xffcc44,emissiveIntensity:3});
const mSignPost =stdMat(0x888888,0.6,0.3);
const signMats  =[stdMat(0xdd2222,0.3,0.1),stdMat(0x2255dd,0.3,0.1),stdMat(0xdd2222,0.3,0.1)];

function makeStreetLamp(z,side){
  const g=new THREE.Group();
  const pole=cyl(0.06,0.07,5,6,mLampPole); pole.position.y=2.5; g.add(pole);
  const arm=box(1.4,0.07,0.07,mLampPole); arm.position.set(side*0.7,5.1,0); g.add(arm);
  const housing=box(0.35,0.22,0.5,mLampHouse); housing.position.set(side*1.35,4.98,0); g.add(housing);
  const bulb=box(0.2,0.08,0.35,mLampGlow); bulb.position.set(side*1.35,4.87,0); g.add(bulb);
  const pl=new THREE.PointLight(0xffcc44,1.5,18,2);
  pl.position.set(side*(ROAD_WIDTH/2+1.4),4.85,z); scene.add(pl);
  g.position.set(side*(ROAD_WIDTH/2+0.8),0,z);
  return {mesh:g, light:pl};
}
function makeTrafficSign(z,side){
  const g=new THREE.Group();
  const post=cyl(0.04,0.04,2.5,5,mSignPost); post.position.y=1.25; g.add(post);
  const sign=box(0.6,0.6,0.04,signMats[Math.floor(Math.random()*3)]); sign.position.set(0,2.7,0); g.add(sign);
  g.position.set(side*(ROAD_WIDTH/2+0.9)+side*0.3,0,z);
  return g;
}
export const furniturePool=[], lampLights=[];
for(let i=0;i<NUM_FURN;i++){
  const z=i*FURN_SPACING;
  const {mesh:lL,light:lightL}=makeStreetLamp(z,1);
  const {mesh:lR,light:lightR}=makeStreetLamp(z,-1);
  scene.add(lL,lR); furniturePool.push(lL,lR); lampLights.push(lightL,lightR);
  if(i%4===0){ const sign=makeTrafficSign(z+7,Math.random()>0.5?1:-1); scene.add(sign); furniturePool.push(sign); }
}

// ── Trees ─────────────────────────────────────────
const mTrunk=stdMat(0x3d2b1f,0.95), mLeaf=stdMat(0x1a3a1a,0.95);
function makeTree(x,z){
  const g=new THREE.Group();
  const trunk=cyl(0.12,0.18,1.5,5,mTrunk); trunk.position.y=0.75; g.add(trunk);
  for(let i=0;i<2;i++){
    const r=0.8+Math.random()*0.4;
    const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),mLeaf);
    leaf.position.set((Math.random()-0.5)*0.6,1.8+i*0.9,(Math.random()-0.5)*0.6);
    leaf.castShadow=true; g.add(leaf);
  }
  g.position.set(x,0,z); return g;
}
export const treePool=[];
for(let i=0;i<30;i++){
  const side=Math.random()>0.5?1:-1;
  const x=side*(ROAD_WIDTH/2+5+Math.random()*10), z=i*18+Math.random()*10;
  const t=makeTree(x,z); scene.add(t); treePool.push(t);
}

// ── Stars + Moon ──────────────────────────────────
const sv=[];
for(let i=0;i<1500;i++) sv.push((Math.random()-0.5)*600,40+Math.random()*120,(Math.random()-0.5)*600);
const starGeo=new THREE.BufferGeometry();
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(sv,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:0.28,sizeAttenuation:true})));
const moonMesh=new THREE.Mesh(new THREE.CircleGeometry(8,24),new THREE.MeshBasicMaterial({color:0xddeeff}));
moonMesh.position.set(-120,90,-300); moonMesh.lookAt(0,0,0); scene.add(moonMesh);
