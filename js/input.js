import { camModes, camLabel } from './scene.js';

export const keys = {};
export const mb = {left:false, right:false, gas:false, brake:false, nitro:false};

// camMode is managed in game-loop; expose a setter callback
let _onNitro = ()=>{};
let _onCamCycle = ()=>{};
let _onPause = ()=>{};
export function setInputCallbacks(onNitro, onCamCycle, onPause){
  _onNitro = onNitro; _onCamCycle = onCamCycle; _onPause = onPause;
}

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if(e.code === 'KeyC') _onCamCycle();
  if(e.code === 'KeyN') _onNitro();
  if(e.code === 'KeyP' || e.code === 'Escape') _onPause();
});
window.addEventListener('keyup', e => keys[e.code] = false);

['btn-left','btn-right','btn-gas','btn-brake','btn-nitro'].forEach((id,i) => {
  const k = ['left','right','gas','brake','nitro'][i];
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('pointerdown', ()=>{ mb[k]=true; if(k==='nitro') _onNitro(); });
  el.addEventListener('pointerup',   ()=>mb[k]=false);
  el.addEventListener('pointerleave',()=>mb[k]=false);
});
