import { ROAD_HALF } from './constants.js';

export function checkCollisions(carX, carZ, nearMissTimer, scoreRef, moneyRef) {
  if(Math.abs(carX) > ROAD_HALF+0.2) return {hit:true, npc:null, nearMissTimer};
  return {hit:false, npc:null, nearMissTimer};
}
