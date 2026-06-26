import * as THREE from 'three';
import { scene } from './scene.js';
import { cyl, mFuelPickup, mCoin } from './materials.js';

export const fuelPickups = [];
function makeFuelPickup(){
  const g=new THREE.Group();
  const c=cyl(0.15,0.15,0.5,8,mFuelPickup); c.rotation.x=Math.PI/2; g.add(c);
  const pl=new THREE.PointLight(0xffdd00,1.2,5,2); g.add(pl);
  g.position.set(0,0.5,9999); scene.add(g); return g;
}
for(let i=0;i<6;i++) fuelPickups.push(makeFuelPickup());

export const coins = [];
function makeCoin(){
  const g=new THREE.Group();
  const c=cyl(0.3,0.3,0.08,16,mCoin); c.rotation.x=Math.PI/2; g.add(c);
  g.position.set(0,0.5,9999); scene.add(g); return g;
}
for(let i=0;i<8;i++) coins.push(makeCoin());
