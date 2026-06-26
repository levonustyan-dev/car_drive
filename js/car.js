import * as THREE from 'three';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader';
import { scene } from './scene.js';
import { stdMat, box, cyl, mBody, mGlass, mChrome, mTyre, mRim, mTL, mHL2, mPlastic, mUnder, mExhaust } from './materials.js';

export const carGroup = new THREE.Group();
scene.add(carGroup);

// ── Procedural VAZ-2107 body ──────────────────────
const und=box(1.6,0.12,3.6,mUnder); und.position.y=0.22; carGroup.add(und);
const bodyL=box(1.72,0.48,3.8,mBody); bodyL.position.y=0.5; carGroup.add(bodyL);
const bodyU=box(1.55,0.5,2.15,mBody); bodyU.position.set(0,1.0,-0.08); carGroup.add(bodyU);
const roof=box(1.52,0.06,2.1,mBody); roof.position.set(0,1.28,-0.08); carGroup.add(roof);
const hood=box(1.68,0.06,1.45,mBody); hood.position.set(0,0.78,1.05); hood.rotation.x=-0.04; carGroup.add(hood);
const trunk=box(1.68,0.06,1.1,mBody); trunk.position.set(0,0.76,-1.3); trunk.rotation.x=0.04; carGroup.add(trunk);
const bF=box(1.6,0.22,0.12,mChrome); bF.position.set(0,0.38,1.95); carGroup.add(bF);
const bR=box(1.6,0.22,0.12,mChrome); bR.position.set(0,0.38,-1.95); carGroup.add(bR);
const grille=box(0.9,0.22,0.06,mPlastic); grille.position.set(0,0.55,1.94); carGroup.add(grille);
[-0.55,0.55].forEach(x=>{
  const hl=box(0.32,0.2,0.06,mHL2); hl.position.set(x,0.6,1.96); carGroup.add(hl);
  const ring=box(0.36,0.24,0.04,mChrome); ring.position.set(x,0.6,1.93); carGroup.add(ring);
});
[-0.6,0.6].forEach(x=>{ const tl=box(0.28,0.2,0.06,mTL); tl.position.set(x,0.58,-1.96); carGroup.add(tl); });
const wsF=box(1.46,0.46,0.06,mGlass); wsF.position.set(0,0.97,0.93); wsF.rotation.x=-0.28; carGroup.add(wsF);
const wsR=box(1.46,0.40,0.06,mGlass); wsR.position.set(0,0.97,-1.1); wsR.rotation.x=0.28; carGroup.add(wsR);
[-0.875,0.875].forEach(x=>{ const sw=box(0.06,0.38,1.4,mGlass); sw.position.set(x,1.02,-0.08); carGroup.add(sw); });
[-0.87,0.87].forEach(x=>{ const dl=box(0.04,0.35,1.85,mChrome); dl.position.set(x,0.56,-0.08); carGroup.add(dl); });
[-0.92,0.92].forEach(x=>{ const mir=box(0.1,0.06,0.18,mBody); mir.position.set(x,1.08,0.8); carGroup.add(mir); });
const ant=cyl(0.01,0.01,0.5,4,mChrome); ant.position.set(0.6,1.36,-0.5); carGroup.add(ant);
const exhaustPipe=cyl(0.04,0.05,0.3,5,mExhaust);
exhaustPipe.rotation.z=Math.PI/2; exhaustPipe.position.set(-0.6,0.2,-2.0); carGroup.add(exhaustPipe);

// ── Wheels ────────────────────────────────────────
function makeDetailedWheel(x,z){
  const g=new THREE.Group();
  const ty=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.1,10,16),mTyre);
  ty.rotation.y=Math.PI/2; ty.castShadow=true; g.add(ty);
  const rimFace=new THREE.Mesh(new THREE.CircleGeometry(0.28,12),mRim);
  rimFace.rotation.y=Math.PI/2; rimFace.position.x=Math.sign(x)*0.1; g.add(rimFace);
  const hub=cyl(0.06,0.06,0.22,6,stdMat(0x888888,0.3,0.7)); hub.rotation.z=Math.PI/2; g.add(hub);
  for(let i=0;i<5;i++){
    const spoke=box(0.04,0.04,0.22,mRim);
    spoke.rotation.z=i*Math.PI/2.5;
    spoke.position.set(Math.sign(x)*0.02,Math.sin(i*Math.PI/2.5)*0.14,Math.cos(i*Math.PI/2.5)*0.14);
    g.add(spoke);
  }
  g.position.set(x,0.32,z);
  return g;
}
export const playerWheels=[
  makeDetailedWheel(-0.94,1.2), makeDetailedWheel(0.94,1.2),
  makeDetailedWheel(-0.94,-1.2), makeDetailedWheel(0.94,-1.2),
];
playerWheels.forEach(w=>carGroup.add(w));

// ── Audi S3 3DS loader ────────────────────────────
export let carLoaded = false;
export const exhaustMat = new THREE.PointsMaterial({color:0xaaaaaa,size:0.12,transparent:true,opacity:0.4,sizeAttenuation:true});

(function loadAudiModel(){
  const tdsLoader = new TDSLoader();
  tdsLoader.setResourcePath('Audi_S3/');
  tdsLoader.load('Audi_S3.3DS', (object) => {
    object.scale.set(0.0055, 0.0055, 0.0055);
    object.rotation.x = Math.PI;
    object.rotation.y = Math.PI;
    object.position.y = 0.75;
    object.traverse(m => {
      if(m.isMesh){
        m.castShadow = true; m.receiveShadow = true;
        if(m.material){
          const mats = Array.isArray(m.material)?m.material:[m.material];
          mats.forEach(mat=>{ if(mat.map) mat.map.encoding=THREE.sRGBEncoding; mat.envMapIntensity=0.5; });
        }
      }
    });
    const keepSet = new Set(playerWheels);
    [...carGroup.children].forEach(c=>{ if(!keepSet.has(c)) carGroup.remove(c); });
    carGroup.add(object);
    carLoaded = true;
    console.log('Audi S3 model loaded ✓');
  }, undefined, (err) => {
    console.warn('Could not load Audi_S3.3DS — using procedural car.', err);
    carLoaded = true;
  });
})();
