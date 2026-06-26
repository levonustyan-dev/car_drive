// ── Speedometer ───────────────────────────────────
const speedoC = document.getElementById('speedo-canvas');
const sc = speedoC.getContext('2d');

export function drawSpeedo(kmh, rpm, health) {
  const cx=75,cy=75,r=68;
  sc.clearRect(0,0,150,150);
  sc.beginPath();sc.arc(cx,cy,r+2,0,Math.PI*2);sc.fillStyle='#0a0a18';sc.fill();
  sc.strokeStyle='#1a2a44';sc.lineWidth=3;sc.stroke();
  sc.beginPath();sc.arc(cx,cy,56,Math.PI*.72,Math.PI*2.28);sc.strokeStyle='#111133';sc.lineWidth=10;sc.stroke();
  const rf=Math.min(rpm/7000,1);
  const rCol=rpm>5500?'#ff3300':rpm>3800?'#ffaa00':'#3377ff';
  sc.beginPath();sc.arc(cx,cy,56,Math.PI*.72,Math.PI*.72+rf*Math.PI*1.56);sc.strokeStyle=rCol;sc.lineWidth=10;sc.stroke();
  for(let i=0;i<=10;i++){
    const a=Math.PI*.72+(i/10)*Math.PI*1.56, inner=i%2===0?44:50;
    sc.beginPath();sc.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);sc.lineTo(cx+Math.cos(a)*62,cy+Math.sin(a)*62);
    sc.strokeStyle=i%2===0?'#99bbdd':'#445566';sc.lineWidth=i%2===0?2:1;sc.stroke();
  }
  const sa=Math.PI*0.72+Math.min(kmh/220,1)*Math.PI*1.56;
  sc.save();sc.translate(cx,cy);
  sc.beginPath();sc.moveTo(-Math.cos(sa)*6,-Math.sin(sa)*6);sc.lineTo(Math.cos(sa)*54,Math.sin(sa)*54);
  sc.strokeStyle='#ff2222';sc.lineWidth=2.5;sc.lineCap='round';sc.stroke();sc.restore();
  sc.beginPath();sc.arc(cx,cy,r-2,Math.PI*.72,Math.PI*.72+health*Math.PI*1.56);
  sc.strokeStyle=health<0.3?'#ff3300':health<0.6?'#ffaa00':'#33ff66';sc.lineWidth=4;sc.stroke();
  sc.beginPath();sc.arc(cx,cy,6,0,Math.PI*2);sc.fillStyle='#223';sc.fill();sc.strokeStyle='#4466aa';sc.lineWidth=2;sc.stroke();
  sc.fillStyle='#cceeff';sc.font='bold 20px Arial';sc.textAlign='center';sc.fillText(Math.round(kmh),cx,cy+8);
  sc.fillStyle='#5588aa';sc.font='8px Arial';sc.fillText('KM/H',cx,cy+20);
  sc.fillStyle='#445566';sc.font='7px Arial';sc.fillText(`RPM ${(rpm/1000).toFixed(1)}k`,cx,cy+30);
}

// ── DOM refs ──────────────────────────────────────
export const domGear       = document.getElementById('gear-display');
export const domMoney      = document.getElementById('money-val');
export const domDist       = document.getElementById('dist-val');
export const domScore      = document.getElementById('score-val');
export const domKm         = document.getElementById('km-readout');
export const domSpeedFill  = document.getElementById('speedbar-fill');
export const domWarning    = document.getElementById('warning');
export const domDmgFill    = document.getElementById('damage-fill');
export const domProgFill   = document.getElementById('progress-fill');
export const domProgPct    = document.getElementById('progress-pct');
export const domFsDist     = document.getElementById('fs-dist');
export const domFsScore    = document.getElementById('fs-score');
export const domFsMoney    = document.getElementById('fs-money');
export const domFsSpeed    = document.getElementById('fs-speed');
export const domFuelFill   = document.getElementById('fuel-fill');
export const domNitroFill  = document.getElementById('nitro-fill');
export const domNitroLabel = document.getElementById('nitro-label');
export const domRainInd    = document.getElementById('rain-indicator');
export const domFsHighscore= document.getElementById('fs-highscore');
const bonusPopup           = document.getElementById('bonus-popup');

// ── Popup ─────────────────────────────────────────
let popupTimeout = null;
export function showPopup(text, color='#ff0'){
  bonusPopup.textContent=text; bonusPopup.style.color=color; bonusPopup.style.opacity='1';
  if(popupTimeout) clearTimeout(popupTimeout);
  popupTimeout=setTimeout(()=>bonusPopup.style.opacity='0', 1200);
}
