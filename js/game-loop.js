import * as THREE from 'three';
import { renderer, scene, camera, moon, HL, headlightsOn } from './scene.js';
import { BASE_MAX_SPEED, NITRO_MAX_SPEED, ACCEL, BRAKE_FORCE, STEER_SPD, ROAD_HALF,
         SEG_LEN, NUM_SEGS, BLDG_SPACING, NUM_BLDGS, FURN_SPACING, NUM_FURN,
         LANE_X, GOAL_DIST, NITRO_DURATION, NITRO_COOLDOWN_MAX,
         FUEL_SPAWN_INTERVAL, COIN_SPAWN_INTERVAL } from './constants.js';
import { carGroup, playerWheels, exhaustMat } from './car.js';
import { npcCars, policeGroup, policeWheels, mRedLight, mBlueLight } from './npcs.js';
import { spawnExhaust, updateExhaust, exhaustPts, spawnSparks, updateSparks, initRain, updateRain, rainPts } from './particles.js';
import { fuelPickups, coins } from './pickups.js';
import { segments, buildingPool, furniturePool, lampLights, treePool } from './world.js';
import { drawSpeedo, showPopup,
         domGear, domMoney, domDist, domScore, domKm, domSpeedFill, domWarning,
         domDmgFill, domProgFill, domProgPct, domFsDist, domFsScore, domFsMoney,
         domFsSpeed, domFuelFill, domNitroFill, domNitroLabel, domRainInd, domFsHighscore } from './hud.js';
import { keys, mb, setInputCallbacks } from './input.js';
import { initAudio, playBeep, playCrashSound, audioCtx, engineOsc, engineGain } from './audio.js';
import { checkCollisions } from './collision.js';

// ── Persistent high score ─────────────────────────
let highScore = parseInt(localStorage.getItem('russianCarDriver_highScore') || '0', 10);

// ── Mutable state ─────────────────────────────────
let MAX_SPEED = BASE_MAX_SPEED;
let gameRunning=false, playerZ=0, playerX=0, speed=0, money=28, score=0, dist=0;
let health=1, crashed=false, crashTimer=0, wheelRot=0, topSpeed=0;
let nearMissTimer=0, framesSinceStart=0, steerAngle=0;
let fuel=1.0;
let nitroActive=false, nitroTimer=0, nitroCooldown=0;
let isRain=false;
let lastFuelSpawnZ=0, fuelPickupIdx=0, lastCoinSpawnZ=0, coinIdx=0;
let paused=false;
let camMode=0;
const camModes=['3rd PERSON','LOW CAM','HOOD CAM','CHASE'];
const camLabel=document.getElementById('cam-mode');

// ── Pause overlay ─────────────────────────────────
const pauseOverlay=document.createElement('div');
Object.assign(pauseOverlay.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,0.65)',
  display:'none',flexDirection:'column',alignItems:'center',justifyContent:'center',
  zIndex:'25',color:'#fff',fontFamily:'Arial,sans-serif',userSelect:'none'});
pauseOverlay.innerHTML='<div style="font-size:48px;font-weight:900;letter-spacing:4px;text-shadow:0 0 30px #48f">PAUSED</div><div style="font-size:14px;color:#888;margin-top:10px">Press P or ESC to Resume</div>';
document.body.appendChild(pauseOverlay);

// ── Input callbacks ───────────────────────────────
function activateNitro(){
  if(!gameRunning||crashed||nitroActive||nitroCooldown>0) return;
  nitroActive=true; nitroTimer=NITRO_DURATION; MAX_SPEED=NITRO_MAX_SPEED;
  exhaustMat.color.setHex(0x4488ff); showPopup('⚡ NITRO!','#44aaff');
}
function onCamCycle(){ camMode=(camMode+1)%camModes.length; camLabel.textContent=camModes[camMode]; }
function togglePause(){ if(!gameRunning) return; paused=!paused; pauseOverlay.style.display=paused?'flex':'none'; }
setInputCallbacks(activateNitro, onCamCycle, togglePause);

document.getElementById('cam-btn').addEventListener('click', onCamCycle);

// ── startGame ─────────────────────────────────────
const overlay  = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

function startGame(){
  const startZ=40;
  gameRunning=true; crashed=false; playerZ=startZ; playerX=0; speed=0;
  money=28; score=0; dist=0; health=1; crashTimer=0; wheelRot=0; topSpeed=0;
  steerAngle=0; framesSinceStart=0;
  fuel=1.0; nitroActive=false; nitroTimer=0; nitroCooldown=0;
  MAX_SPEED=BASE_MAX_SPEED; exhaustMat.color.setHex(0xaaaaaa);
  paused=false; pauseOverlay.style.display='none';
  initAudio();
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();

  isRain=Math.random()<0.2;
  initRain(startZ);
  rainPts.visible=isRain;
  domRainInd.style.display=isRain?'flex':'none';
  scene.fog.density=isRain?0.028:0.016;

  lastFuelSpawnZ=startZ+120; fuelPickupIdx=0;
  fuelPickups.forEach(fp=>fp.position.set(0,0.5,9999));
  lastCoinSpawnZ=startZ+100; coinIdx=0;
  coins.forEach(c=>c.position.set(0,0.5,9999));

  carGroup.position.set(0,0,startZ); carGroup.rotation.set(0,0,0);
  segments.forEach((s,i)=>{ s.position.z=startZ-40+i*SEG_LEN; });
  buildingPool.forEach((b,i)=>{ b.position.z=startZ+i*BLDG_SPACING; });
  treePool.forEach((t,i)=>{ t.position.z=startZ+i*18; });
  let lampIdx=0;
  furniturePool.forEach(f=>{ if(f.position){ f.position.z=startZ+lampIdx*FURN_SPACING; lampIdx++; } });
  lampLights.forEach((l,i)=>{ l.position.z=startZ+Math.floor(i/2)*FURN_SPACING; });
  document.getElementById('final-stats').style.display='flex';
  document.getElementById('overlay-title').textContent='🚗 RUSSIAN CAR DRIVER';
  document.getElementById('overlay-sub').textContent='Survive the night. Avoid traffic.';
  startBtn.textContent='START ENGINE';
  domFsHighscore.textContent=highScore;
  domFsDist.textContent='—'; domFsScore.textContent='—'; domFsMoney.textContent='—'; domFsSpeed.textContent='—';
  overlay.style.display='none';
}
startBtn.addEventListener('click', startGame);

// initial overlay high score
document.getElementById('final-stats').style.display='flex';
domFsHighscore.textContent=highScore;
domFsDist.textContent='—'; domFsScore.textContent='—'; domFsMoney.textContent='—'; domFsSpeed.textContent='—';

// ── Main loop ─────────────────────────────────────
let lastT=performance.now(), exhaustTimer=0;

function animate(){
  requestAnimationFrame(animate);
  const now=performance.now();
  const dt=Math.min((now-lastT)/1000,0.05);
  lastT=now;

  if(!gameRunning||paused){ renderer.render(scene,camera); return; }
  framesSinceStart++;

  const gasDown  =keys['ArrowUp']||keys['KeyW']||mb.gas;
  const brakeDown=keys['ArrowDown']||keys['KeyS']||keys['Space']||mb.brake;
  const leftDown =keys['ArrowLeft']||keys['KeyA']||mb.left;
  const rightDown=keys['ArrowRight']||keys['KeyD']||mb.right;

  // Nitro timer
  if(nitroActive){ nitroTimer-=dt; if(nitroTimer<=0){ nitroActive=false; MAX_SPEED=BASE_MAX_SPEED; exhaustMat.color.setHex(0xaaaaaa); nitroCooldown=NITRO_COOLDOWN_MAX; } }
  if(!nitroActive&&nitroCooldown>0) nitroCooldown=Math.max(0,nitroCooldown-dt);

  if(!crashed){
    if(gasDown)    speed=Math.min(speed+ACCEL*dt,MAX_SPEED);
    else           speed=Math.max(speed-7*dt,0);
    if(brakeDown)  speed=Math.max(speed-BRAKE_FORCE*dt,0);
    const steerMult=isRain?0.75:1.0;
    const targetSteer=leftDown?-1:rightDown?1:0;
    steerAngle+=(targetSteer-steerAngle)*Math.min(dt*6,1);
    playerX=Math.max(-ROAD_HALF,Math.min(ROAD_HALF, playerX+steerAngle*STEER_SPD*steerMult*dt));

    // Fuel drain
    fuel=Math.max(0,fuel-speed*0.00008*dt);
    if(fuel<=0){ crashed=true; crashTimer=0; spawnSparks(playerX,0,playerZ); }

  } else {
    speed=Math.max(speed-35*dt,0);
    crashTimer+=dt;
    if(crashTimer>2.8){
      gameRunning=false;
      if(score>highScore){ highScore=score; localStorage.setItem('russianCarDriver_highScore',highScore); }
      document.getElementById('final-stats').style.display='flex';
      domFsHighscore.textContent=highScore;
      domFsDist.textContent=`${Math.round(dist)}m`;
      domFsScore.textContent=score;
      domFsMoney.textContent=`$${money}`;
      domFsSpeed.textContent=`${Math.round(topSpeed)} km/h`;
      document.getElementById('overlay-title').textContent='💥 WRECKED!';
      document.getElementById('overlay-sub').textContent="You didn't survive the night.";
      startBtn.textContent='RESTART';
      overlay.style.display='flex';
    }
  }

  playerZ+=speed*dt; dist+=speed*dt;
  const kmh=speed*3.6;
  if(kmh>topSpeed) topSpeed=kmh;
  score=Math.round(dist*0.5+speed*3+money*0.5);
  if(!crashed&&dist>10) money=28+Math.floor(dist/40);
  if(nearMissTimer>0) nearMissTimer=Math.max(0,nearMissTimer-dt);

  // Engine sound
  if(engineGain&&!crashed){
    const targetFreq=55+(kmh/220)*220, targetVol=speed>0.5?0.06:0.01;
    engineOsc.frequency.setTargetAtTime(targetFreq,audioCtx.currentTime,0.08);
    engineGain.gain.setTargetAtTime(targetVol,audioCtx.currentTime,0.08);
  } else if(engineGain&&crashed){
    engineGain.gain.setTargetAtTime(0,audioCtx.currentTime,0.3);
  }

  const gear=kmh<15?'1':kmh<40?'2':kmh<70?'3':kmh<110?'4':kmh<155?'5':'6';
  const rpm=Math.min(400+(kmh/220)*6800+(Math.random()-0.5)*150,7200);

  // Wheel rotation
  wheelRot+=speed*dt*2.5;
  playerWheels.forEach((w,i)=>{ w.rotation.x=wheelRot; if(i<2) w.rotation.y=steerAngle*0.35; });
  carGroup.rotation.z=steerAngle*-0.04;
  if(brakeDown&&speed>5) carGroup.rotation.x=0.018;
  else if(gasDown) carGroup.rotation.x=-0.01;
  else carGroup.rotation.x*=0.85;
  carGroup.position.set(playerX,0,playerZ);

  // Fuel pickups
  if(playerZ>lastFuelSpawnZ){ lastFuelSpawnZ+=FUEL_SPAWN_INTERVAL; const fp=fuelPickups[fuelPickupIdx%fuelPickups.length]; fuelPickupIdx++; fp.position.set(LANE_X[Math.floor(Math.random()*3)],0.5,playerZ+80+Math.random()*40); }
  fuelPickups.forEach(fp=>{
    if(fp.position.z<playerZ-10) fp.position.z=9999;
    if(fp.position.z<9000){ const fpdx=Math.abs(playerX-fp.position.x),fpdz=Math.abs(playerZ-fp.position.z);
      if(fpdx<1.0&&fpdz<1.0){ fuel=Math.min(1,fuel+0.4); fp.position.set(0,0.5,9999); showPopup('+FUEL!','#ffdd00'); playBeep(660,0.2); } }
  });

  // Coins
  if(playerZ>lastCoinSpawnZ){ lastCoinSpawnZ+=COIN_SPAWN_INTERVAL; const coin=coins[coinIdx%coins.length]; coinIdx++; coin.position.set(LANE_X[Math.floor(Math.random()*3)],0.5,playerZ+60+Math.random()*40); }
  coins.forEach(coin=>{
    if(coin.position.z<playerZ-10) coin.position.z=9999;
    if(coin.position.z<9000){ coin.rotation.y+=dt*3; const cdx=Math.abs(playerX-coin.position.x),cdz=Math.abs(playerZ-coin.position.z);
      if(cdx<1.5&&cdz<1.5){ money+=10; score+=25; coin.position.set(0,0.5,9999); showPopup('+$10 COIN!','#FFD700'); playBeep(880,0.12); } }
  });

  // Rain
  if(isRain) updateRain(dt,speed,playerZ);

  // Exhaust
  exhaustTimer+=dt;
  if(exhaustTimer>0.03){ exhaustTimer=0; if(speed>1) spawnExhaust(playerX,0,playerZ,speed); }
  updateExhaust(dt);
  exhaustPts.position.set(0,0,0);

  // Headlights
  HL[0].position.set(playerX-0.5,0.65,playerZ+1.8); HL[1].position.set(playerX+0.5,0.65,playerZ+1.8);
  HL[0].target.position.set(playerX-4,-0.2,playerZ+40); HL[1].target.position.set(playerX+4,-0.2,playerZ+40);
  HL[0].intensity=HL[1].intensity=headlightsOn?4:0;

  // Camera
  switch(camMode){
    case 0: camera.position.set(playerX*0.35,3.0,playerZ-8);camera.lookAt(playerX*0.2,1.0,playerZ+12);break;
    case 1: camera.position.set(playerX*0.4,1.2,playerZ-6);camera.lookAt(playerX*0.2,0.5,playerZ+15);break;
    case 2: camera.position.set(playerX,1.1,playerZ+1.1);camera.lookAt(playerX*0.1,0.8,playerZ+30);break;
    case 3: camera.position.set(playerX*0.5,1.8,playerZ-4.5);camera.lookAt(playerX*0.3,0.8,playerZ+10);break;
  }
  if(speed>5) camera.position.y+=Math.sin(framesSinceStart*0.3)*0.01*(speed/MAX_SPEED);

  // Moon shadow follows player
  moon.shadow.camera.position.set(playerX+40,100,playerZ-50);
  moon.target.position.set(playerX,0,playerZ); moon.target.updateMatrixWorld();

  // Recycling
  segments.forEach(seg=>{ if(seg.position.z+SEG_LEN/2<playerZ-SEG_LEN) seg.position.z+=NUM_SEGS*SEG_LEN; });
  buildingPool.forEach(b=>{ if(b.position.z<playerZ-40){ b.position.z+=NUM_BLDGS*BLDG_SPACING; b.position.x=(Math.random()>0.35?1:-1)*(12/2+5+Math.random()*8); } });
  furniturePool.forEach((f,i)=>{ if(f.position&&f.position.z<playerZ-30){ f.position.z+=NUM_FURN*FURN_SPACING; if(i<lampLights.length) lampLights[i].position.z=f.position.z; } });
  treePool.forEach(t=>{ if(t.position.z<playerZ-30) t.position.z+=30*18; });
  // Collision
  if(!crashed){
    const scoreRef={value:score}, moneyRef={value:money};
    const result=checkCollisions(playerX,playerZ,nearMissTimer,scoreRef,moneyRef);
    score=scoreRef.value; money=moneyRef.value; nearMissTimer=result.nearMissTimer;
    if(result.hit){
      health=Math.max(0,health-0.35);
      if(health<=0){ crashed=true; crashTimer=0; spawnSparks(playerX,0,playerZ); playCrashSound(); }
      else { playerX+=Math.sign(playerX<(result.npc?.position.x||0)?-1:1)*0.5; spawnSparks(playerX,0,playerZ); playBeep(180,0.15,0.1); }
    }
  }
  updateSparks(dt);

  if(crashed){ carGroup.rotation.z+=dt*1.0; carGroup.rotation.x+=dt*0.3; carGroup.position.y=Math.max(carGroup.position.y-dt*0.2,0); }

  // HUD
  drawSpeedo(kmh,rpm,health);
  domGear.textContent=crashed?'!':gear;
  domMoney.textContent=`$${money}`; domDist.textContent=`${Math.round(dist)}m`; domScore.textContent=score;
  domKm.textContent=`${Math.round(kmh)} KM/H`; domSpeedFill.style.width=`${(kmh/220)*100}%`;
  domWarning.style.display=kmh>160?'block':'none';
  const hp=health*100;
  domDmgFill.style.width=`${hp}%`;
  domDmgFill.style.background=hp<30?'#ff3300':hp<60?'linear-gradient(90deg,#ff3300,#ffaa00)':'linear-gradient(90deg,#33ff66,#ffdd00,#ff4400)';
  domFuelFill.style.width=`${fuel*100}%`;
  domFuelFill.style.background=fuel<0.2?'#ff4400':fuel<0.4?'#ffaa00':'#ffdd00';
  if(nitroActive){ domNitroFill.style.width=`${(nitroTimer/NITRO_DURATION)*100}%`; domNitroFill.style.background='#00ccff'; domNitroLabel.style.color='#00ccff'; }
  else if(nitroCooldown>0){ domNitroFill.style.width=`${(1-nitroCooldown/NITRO_COOLDOWN_MAX)*100}%`; domNitroFill.style.background='#444466'; domNitroLabel.style.color='#666688'; }
  else { domNitroFill.style.width='100%'; domNitroFill.style.background='#44aaff'; domNitroLabel.style.color='#4af'; }
  const progPct=Math.min(100,Math.round((dist/GOAL_DIST)*100));
  domProgFill.style.width=`${progPct}%`; domProgPct.textContent=`${progPct}%`;

  renderer.render(scene,camera);
}

animate();
