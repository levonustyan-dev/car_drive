import * as THREE from 'three';
import { initInput, keys } from './core/input.js';
import { state, updatePhysics } from './core/physics.js';
import { updateCamera } from './core/camera.js';
import { Vehicle } from './entities/Vehicle.js';
import { StateManager, States } from './systems/StateManager.js';
import { MissionSystem } from './systems/MissionSystem.js';
import { TrafficSystem } from './systems/TrafficSystem.js';
import { makeCity, ROAD, roadLinesX, roadLinesZ, CITY_SPAN, OZ } from './core/WorldMap.js';
import { HUD } from './ui/HUD.js';

// ── Renderer ──────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ── Scene ─────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 80, 300);

// ── Camera ────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 400);

// ── Lighting ──────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(20, 50, -30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -60;
sun.shadow.camera.right = sun.shadow.camera.top = 60;
scene.add(sun);


// ── World ─────────────────────────────────────────
makeCity(scene);

// ── State ─────────────────────────────────────────
const stateManager = new StateManager();
stateManager.setState(States.MENU);

window.addEventListener('keydown', e => {
  if (e.code === 'Enter' && stateManager.getState() === States.MENU) {
    stateManager.setState(States.PLAYING);
  } else if (e.code === 'Escape') {
    if (stateManager.getState() === States.PLAYING) stateManager.setState(States.PAUSED);
    else if (stateManager.getState() === States.PAUSED) stateManager.setState(States.PLAYING);
  } else if (e.code === 'KeyF' && missionSystem.isNearTrigger()) {
    missionSystem.startMission('m1');
  }
});

// ── Vehicle & Input ───────────────────────────────
initInput();
const vehicle = new Vehicle(scene);

// ── Mission ───────────────────────────────────────
const missionSystem = new MissionSystem(scene);

// ── Traffic ───────────────────────────────────────
const trafficSystem = new TrafficSystem(scene);

// ── HUD ───────────────────────────────────────────
const hud = new HUD();

// ── Minimap ───────────────────────────────────────
const mmCtx = document.getElementById('mmCanvas').getContext('2d');
const MM = 140, MM_RANGE = 160;

function w2mm(wx, wz) {
  const px = MM / 2 + (wx - state.playerX) / MM_RANGE * MM;
  const py = MM / 2 - (wz - state.playerZ) / MM_RANGE * MM;
  return [px, py];
}

function drawMinimap() {
  mmCtx.fillStyle = '#3a7d2c';
  mmCtx.fillRect(0, 0, MM, MM);

  // N-S roads
  mmCtx.fillStyle = '#333';
  for (const rx of roadLinesX) {
    const [x0] = w2mm(rx - ROAD / 2, 0);
    const [x1] = w2mm(rx + ROAD / 2, 0);
    mmCtx.fillRect(x0, 0, x1 - x0, MM);
  }

  // E-W roads
  for (const rz of roadLinesZ) {
    const [, y0] = w2mm(0, rz + ROAD / 2);
    const [, y1] = w2mm(0, rz - ROAD / 2);
    mmCtx.fillRect(0, y0, MM, y1 - y0);
  }

  // Waypoint line + dot
  const _wpTarget = missionSystem.getCurrentTarget();
  if (_wpTarget) {
    const [wpx, wpy] = w2mm(_wpTarget.x, _wpTarget.z);
    mmCtx.strokeStyle = '#ffdd00';
    mmCtx.lineWidth = 2;
    mmCtx.beginPath(); mmCtx.moveTo(MM / 2, MM / 2); mmCtx.lineTo(wpx, wpy); mmCtx.stroke();
    mmCtx.fillStyle = '#ffdd00';
    mmCtx.beginPath(); mmCtx.arc(wpx, wpy, 4, 0, Math.PI * 2); mmCtx.fill();
  }

  // Player dot + direction indicator
  mmCtx.fillStyle = '#fff';
  mmCtx.beginPath(); mmCtx.arc(MM / 2, MM / 2, 4, 0, Math.PI * 2); mmCtx.fill();
  mmCtx.strokeStyle = '#4af';
  mmCtx.lineWidth = 2;
  mmCtx.beginPath(); mmCtx.moveTo(MM / 2, MM / 2 + 5); mmCtx.lineTo(MM / 2, MM / 2 - 10); mmCtx.stroke();
  mmCtx.strokeStyle = 'rgba(255,255,255,0.3)';
  mmCtx.lineWidth = 1;
  mmCtx.strokeRect(0, 0, MM, MM);
}

// ── Animate ───────────────────────────────────────
let lastT = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt  = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;

  if (stateManager.getState() === States.PLAYING) updatePhysics(dt, keys);

  const margin = 5;
  state.playerX = Math.max(-CITY_SPAN / 2 + margin, Math.min(CITY_SPAN / 2 - margin, state.playerX));
  state.playerZ = Math.max(OZ - CITY_SPAN / 2 + margin, Math.min(OZ + CITY_SPAN / 2 - margin, state.playerZ));

  const { speed, steer, angle, playerX, playerZ } = state;

  missionSystem.update(dt, { x: playerX, z: playerZ }, speed);
  trafficSystem.update(dt);
  hud.update({ x: playerX, z: playerZ }, missionSystem.getCurrentTarget());

  vehicle.update(speed, dt);
  vehicle.carGroup.position.set(playerX, 0, playerZ);
  vehicle.carGroup.rotation.y = angle;
  vehicle.carGroup.rotation.z = steer * -0.04;

  sun.position.set(playerX + 20, 50, playerZ - 30);

  updateCamera(camera, playerX, playerZ);
  drawMinimap();

  document.getElementById('speed').textContent = Math.round(speed * 3.6) + ' km/h';
  const blink = Math.floor(now / 400) % 2 === 0;
  const left  = keys['ArrowLeft']  || keys['KeyA'];
  const right = keys['ArrowRight'] || keys['KeyD'];
  document.getElementById('sigL').className = 'sig' + (left  && blink ? ' on' : '');
  document.getElementById('sigR').className = 'sig' + (right && blink ? ' on' : '');

  renderer.render(scene, camera);
}

animate();
