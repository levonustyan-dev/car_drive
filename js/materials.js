import * as THREE from 'three';

export function stdMat(color, rough=0.8, metal=0, opts={}) {
  return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal, ...opts });
}
export function box(w,h,d,m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function cyl(rt,rb,h,seg,m) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), m);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export const mAsphalt     = stdMat(0x1c1c28, 0.97);
export const mAsphaltLine = stdMat(0xffffff, 0.85);
export const mYellowLine  = stdMat(0xffdd00, 0.85);
export const mCurb        = stdMat(0xbbbbcc, 0.85);
export const mBarrier     = stdMat(0xbbbbcc, 0.7, 0.1);
export const mBarrierMid  = stdMat(0xccccdd, 0.6, 0.1);
export const mBarrierTop  = stdMat(0xddddee, 0.5, 0.15);
export const mGuardPost   = stdMat(0x667788, 0.7, 0.3);
export const mGuardRail   = stdMat(0x99aacc, 0.4, 0.6);
export const mTerrain     = stdMat(0x1a2415, 0.98);
export const mRock        = stdMat(0x2e2d28, 0.97);
export const mGravel      = stdMat(0x3a3830, 0.95);
export const mHill        = stdMat(0x1a2415, 0.98);
export const mReflector   = new THREE.MeshStandardMaterial({color:0xff3300,emissive:0xff2200,emissiveIntensity:3});
export const mBody        = stdMat(0xdddddd, 0.25, 0.15);
export const mGlass       = stdMat(0x223344, 0.05, 0.4, {transparent:true, opacity:0.65});
export const mChrome      = stdMat(0xcccccc, 0.15, 0.8);
export const mTyre        = stdMat(0x111111, 0.95, 0.0);
export const mRim         = stdMat(0x999999, 0.3, 0.7);
export const mTL          = new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff0000,emissiveIntensity:2.5,roughness:0.2});
export const mHL2         = new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffeecc,emissiveIntensity:3,roughness:0.1});
export const mPlastic     = stdMat(0x222222, 0.9, 0.0);
export const mUnder       = stdMat(0x1a1a1a, 0.95);
export const mExhaust     = stdMat(0x555555, 0.5, 0.4);
export const mPoliceBody  = stdMat(0xddddff, 0.3, 0.1);
export const mPoliceTop   = stdMat(0x1133cc, 0.3, 0.1);
export const mRedLight    = new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff0000,emissiveIntensity:3,roughness:0.2});
export const mBlueLight   = new THREE.MeshStandardMaterial({color:0x0022ff,emissive:0x0044ff,emissiveIntensity:3,roughness:0.2});
export const mFuelPickup  = new THREE.MeshStandardMaterial({color:0xffdd00,emissive:0xffaa00,emissiveIntensity:2,roughness:0.3});
export const mCoin        = new THREE.MeshStandardMaterial({color:0xFFD700,emissive:0xFFAA00,emissiveIntensity:1.5,roughness:0.3,metalness:0.5});
export const mNpcHL       = new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffcc,emissiveIntensity:2.5});
export const mNpcTL       = new THREE.MeshStandardMaterial({color:0xff2200,emissive:0xff0000,emissiveIntensity:2});
