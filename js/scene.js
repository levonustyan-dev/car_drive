import * as THREE from 'three';

export const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.prepend(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b18);
scene.fog = new THREE.FogExp2(0x080b18, 0.016);

export const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 400);
export let camMode = 0;
export const camModes = ['3rd PERSON','LOW CAM','HOOD CAM','CHASE'];
export const camLabel = document.getElementById('cam-mode');

document.getElementById('cam-btn').addEventListener('click', () => {
  camMode = (camMode + 1) % camModes.length;
  camLabel.textContent = camModes[camMode];
});
export function setCamMode(v) { camMode = v; }

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.AmbientLight(0x0d1022, 1.2));

export const moon = new THREE.DirectionalLight(0x3355aa, 0.35);
moon.position.set(40, 100, -50);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.near = 1;
moon.shadow.camera.far  = 300;
moon.shadow.camera.left = moon.shadow.camera.bottom = -60;
moon.shadow.camera.right = moon.shadow.camera.top  =  60;
scene.add(moon);

function makeSpotlight(color, intensity, dist, angle, penumbra) {
  const s = new THREE.SpotLight(color, intensity, dist, angle, penumbra);
  s.castShadow = false;
  return s;
}
export const HL = [
  makeSpotlight(0xfff3cc, 4, 70, 0.22, 0.6),
  makeSpotlight(0xfff3cc, 4, 70, 0.22, 0.6),
];
HL.forEach(h => scene.add(h, h.target));
export let headlightsOn = true;

document.getElementById('headlight-btn').addEventListener('click', () => {
  headlightsOn = !headlightsOn;
  HL.forEach(h => h.intensity = headlightsOn ? 4 : 0);
  document.getElementById('headlight-icon').textContent = headlightsOn ? '☀' : '○';
});
