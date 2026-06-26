import * as THREE from 'three';
import { scene } from './scene.js';
import { stdMat, box, cyl, mTyre, mChrome, mNpcHL, mNpcTL, mPoliceBody, mPoliceTop, mRedLight, mBlueLight } from './materials.js';
import { LANE_X, NPC_COUNT } from './constants.js';

export { mRedLight, mBlueLight };

const NPC_DEFS = [
  {w:1.7,h:0.5,l:3.8,topH:0.48,colors:[0xcc2222,0x992222]},
  {w:1.8,h:0.6,l:4.2,topH:0.55,colors:[0x2244cc,0x1a3399]},
  {w:1.85,h:0.65,l:3.5,topH:0.6,colors:[0x228833,0x1a6628]},
  {w:1.95,h:0.7,l:4.5,topH:0.0,colors:[0x886622,0x664411]},
  {w:1.7,h:0.52,l:3.6,topH:0.5,colors:[0x662288,0x441166]},
  {w:1.75,h:0.54,l:3.9,topH:0.5,colors:[0x225577,0x1a4455]},
];
const npcMats = NPC_DEFS.map(d=>({body:stdMat(d.colors[0],0.35,0.15),top:stdMat(d.colors[1],0.35,0.15)}));

function makeNPCCar(idx){
  const def=NPC_DEFS[idx%NPC_DEFS.length], mat=npcMats[idx%npcMats.length];
  const g=new THREE.Group();
  const body=box(def.w,def.h,def.l,mat.body); body.position.y=def.h/2+0.25; g.add(body);
  if(def.topH>0){ const top=box(def.w-0.1,def.topH,def.l*0.55,mat.top); top.position.set(0,def.h+0.25+def.topH/2,-0.1); g.add(top); }
  [-0.5,0.5].forEach(x=>{ const h=box(0.24,0.14,0.04,mNpcHL); h.position.set(x,def.h*0.5+0.25,def.l/2+0.02); g.add(h); });
  [-0.55,0.55].forEach(x=>{ const tl=box(0.22,0.12,0.04,mNpcTL); tl.position.set(x,def.h*0.5+0.25,-def.l/2-0.02); g.add(tl); });
  const nw=[];
  [[-(def.w/2+0.02),1.0],[def.w/2+0.02,1.0],[-(def.w/2+0.02),-1.0],[def.w/2+0.02,-1.0]].forEach(([x,z])=>{
    const wg=new THREE.Group();
    const ty=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.09,6,12),mTyre); ty.rotation.y=Math.PI/2; wg.add(ty);
    const ri=new THREE.Mesh(new THREE.CircleGeometry(0.22,8),stdMat(0x888888,0.4,0.5)); ri.rotation.y=Math.PI/2; ri.position.x=Math.sign(x)*0.09; wg.add(ri);
    wg.position.set(x,0.28,z); g.add(wg); nw.push(wg);
  });
  const lane=LANE_X[Math.floor(Math.random()*3)];
  g.position.set(lane,0,60+idx*40+Math.random()*20);
  g.userData={speed:9+Math.random()*12,lane,nw,def};
  scene.add(g); return g;
}
export const npcCars=[];
for(let i=0;i<NPC_COUNT;i++) npcCars.push(makeNPCCar(i));

// ── Police car ────────────────────────────────────
export const policeGroup=new THREE.Group();
scene.add(policeGroup);
const pBody=box(1.75,0.5,3.9,mPoliceBody); pBody.position.y=0.5; policeGroup.add(pBody);
const pTop=box(1.6,0.48,2.1,mPoliceTop); pTop.position.set(0,1.0,-0.1); policeGroup.add(pTop);
const pRoof=box(1.58,0.06,2.0,mPoliceBody); pRoof.position.set(0,1.28,-0.1); policeGroup.add(pRoof);
const pLightBar=box(1.2,0.12,0.4,stdMat(0x111111,0.5)); pLightBar.position.set(0,1.38,0); policeGroup.add(pLightBar);
const pRedBox=box(0.4,0.14,0.3,mRedLight); pRedBox.position.set(-0.3,1.46,0); policeGroup.add(pRedBox);
const pBlueBox=box(0.4,0.14,0.3,mBlueLight); pBlueBox.position.set(0.3,1.46,0); policeGroup.add(pBlueBox);
const pBF=box(1.6,0.22,0.12,mChrome); pBF.position.set(0,0.38,1.97); policeGroup.add(pBF);
const pBR=box(1.6,0.22,0.12,mChrome); pBR.position.set(0,0.38,-1.97); policeGroup.add(pBR);
[-0.55,0.55].forEach(x=>{
  const ph=box(0.3,0.18,0.05,mNpcHL); ph.position.set(x,0.6,1.98); policeGroup.add(ph);
  const pt=box(0.26,0.14,0.05,mNpcTL); pt.position.set(x,0.58,-1.98); policeGroup.add(pt);
});
export const policeWheels=[];
[[-(1.75/2+0.02),1.1],[1.75/2+0.02,1.1],[-(1.75/2+0.02),-1.1],[1.75/2+0.02,-1.1]].forEach(([x,z])=>{
  const wg=new THREE.Group();
  const ty=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.09,6,12),mTyre); ty.rotation.y=Math.PI/2; wg.add(ty);
  const ri=new THREE.Mesh(new THREE.CircleGeometry(0.22,8),stdMat(0x888888,0.4,0.5)); ri.rotation.y=Math.PI/2; ri.position.x=Math.sign(x)*0.09; wg.add(ri);
  wg.position.set(x,0.28,z); policeGroup.add(wg); policeWheels.push(wg);
});
policeGroup.position.set(0,0,9999);
