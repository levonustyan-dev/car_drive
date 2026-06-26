import { ROAD_HALF } from './constants.js';
import { npcCars } from './npcs.js';
import { showPopup } from './hud.js';

// nearMissTimer is owned by game-loop; pass it in and get back updated value
export function checkCollisions(carX, carZ, nearMissTimer, scoreRef, moneyRef) {
  for(const npc of npcCars){
    const dx=Math.abs(carX-npc.position.x);
    const dz=Math.abs(carZ-npc.position.z);
    if(dx<1.55&&dz<3.3) return {hit:true, npc, nearMissTimer};
    if(dx<2.0&&dz<4&&dx>1.55&&!nearMissTimer){
      scoreRef.value  += 50;
      moneyRef.value  += 5;
      showPopup('+50 NEAR MISS!');
      return {hit:false, npc:null, nearMissTimer:1.5};
    }
  }
  if(Math.abs(carX) > ROAD_HALF+0.2) return {hit:true, npc:null, nearMissTimer};
  return {hit:false, npc:null, nearMissTimer};
}
