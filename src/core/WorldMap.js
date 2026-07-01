import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const ROAD      = 12;
export const BLOCK     = 60;
export const CELL      = BLOCK + ROAD;
export const N         = 4;
export const OX        = 0;
export const OZ        = 160;
export const CITY_SPAN = N * CELL + ROAD;

export const roadLinesX = Array.from({ length: N + 1 }, (_, i) => OX + (i - N / 2) * CELL);
export const roadLinesZ = Array.from({ length: N + 1 }, (_, i) => OZ + (i - N / 2) * CELL);

export const houseColliders = [];

// ── Materials ─────────────────────────────────────
function mat(color, rough = 0.8, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
const mAsphalt  = mat(0x2a2a38, 0.97);
const mYellow   = mat(0xffdd00, 0.85);
const mWhite    = mat(0xffffff, 0.85);
const mGrass    = mat(0x3a7d2c, 0.95);
const mSidewalk = mat(0xaaaaaa, 0.9);

// ── Geometry helpers ──────────────────────────────
function box(w, h, d, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// ── Seeded RNG ────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Procedural house ──────────────────────────────
const _WALL_COLORS = [0xE8D5B0, 0xC4A882, 0xB5C4B1, 0xD4956A, 0xE8C4A0, 0xBFD0B8];
const _ROOF_COLORS = [0x8B2020, 0x4A3728, 0x555555, 0x7A3B1E];

function makeHouse(g, cx, cz, rng) {
  const isSmall   = rng() < 0.45;
  const wallColor = _WALL_COLORS[Math.floor(rng() * _WALL_COLORS.length)];
  const roofColor = _ROOF_COLORS[Math.floor(rng() * _ROOF_COLORS.length)];

  // Dimensions and position vary by type
  let W, H, D, px, pz;
  if (isSmall) {
    W = 6; H = 4; D = 5;
    const sx = rng() < 0.5 ? 1 : -1;
    const sz = rng() < 0.5 ? 1 : -1;
    px = cx + sx * BLOCK * 0.18;
    pz = cz + sz * BLOCK * 0.18;
  } else {
    W = 5; H = 10; D = 5;
    rng(); rng(); // consume sign picks for sequence stability
    px = cx;
    pz = cz;
  }

  const grp  = new THREE.Group();
  grp.position.set(px, 0, pz);

  const mWall = mat(wallColor, 0.85);
  const mRoof = mat(roofColor, 0.85);
  const mWin  = mat(0xD0E8F8, 0.15, 0.15);
  const mDoor = mat(0x4A2F1A, 0.9);

  // Main walls
  const walls = box(W, H, D, mWall);
  walls.position.y = H / 2;
  grp.add(walls);

  // Roof: ConeGeometry(size*0.7, size*0.5, 4) rotated 45° on Y
  const size  = Math.max(W, D);
  const roofH = size * 0.5;
  const roof  = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.7, roofH, 4),
    mRoof
  );
  roof.castShadow = true;
  roof.rotation.y = Math.PI / 4;
  roof.position.y = H + roofH / 2;
  grp.add(roof);

  // Windows — one per wall face; tall buildings get a second row
  const winW = isSmall ? 0.85 : 1.05;
  const winH = isSmall ? 0.8  : 1.15;
  const row1Y = isSmall ? H * 0.62 : H * 0.3;

  const addWinRow = (y) => {
    // Front (+Z) and back (−Z)
    for (const s of [-1, 1]) {
      const w = box(winW, winH, 0.1, mWin);
      w.position.set(0, y, s * (D / 2 + 0.02));
      grp.add(w);
    }
    // Left (−X) and right (+X)
    for (const s of [-1, 1]) {
      const w = box(0.1, winH, winW, mWin);
      w.position.set(s * (W / 2 + 0.02), y, 0);
      grp.add(w);
    }
  };

  addWinRow(row1Y);
  if (!isSmall) addWinRow(H * 0.65); // second floor windows on tall building

  // Door on front face (+Z), slightly off-centre
  const doorH = isSmall ? 2.0 : 2.5;
  const door  = box(isSmall ? 0.9 : 1.1, doorH, 0.1, mDoor);
  door.position.set(W * 0.18, doorH / 2, D / 2 + 0.02);
  grp.add(door);

  g.add(grp);
}

// ── GLB template helpers ──────────────────────────
function _wrapTemplate(inner, scale) {
  inner.scale.setScalar(scale);
  inner.updateMatrixWorld(true);

  const b = new THREE.Box3().setFromObject(inner);
  inner.position.set(
    -(b.min.x + b.max.x) / 2,
    -b.min.y,
    -(b.min.z + b.max.z) / 2
  );

  inner.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const wrapper = new THREE.Group();
  wrapper.add(inner);
  return wrapper;
}

function prepareTreeTemplate(gltf, targetHeight) {
  const inner = gltf.scene;
  inner.rotation.x = -Math.PI / 2;
  inner.updateMatrixWorld(true);

  const b  = new THREE.Box3().setFromObject(inner);
  const sz = new THREE.Vector3();
  b.getSize(sz);
  const largest = Math.max(sz.x, sz.y, sz.z);
  return _wrapTemplate(inner, largest > 0 ? targetHeight / largest : 1);
}

// House: already Y-up, min.y≈0 (confirmed from raw bbox: x±3, y 0→4.7, z±2).
// No rotation needed — scale so Y (height=4.7) reaches targetHeight.
function prepareHouseTemplate(gltf, targetHeight) {
  const inner = gltf.scene;
  const b0    = new THREE.Box3().setFromObject(inner);
  const sz0   = new THREE.Vector3();
  b0.getSize(sz0);
  return _wrapTemplate(inner, sz0.y > 0 ? targetHeight / sz0.y : 1);
}

// ── Block placement ───────────────────────────────
const _TREE_OFFSETS = [
  [ BLOCK * 0.3,  BLOCK * 0.3],
  [-BLOCK * 0.3,  BLOCK * 0.3],
  [ BLOCK * 0.3, -BLOCK * 0.3],
  [-BLOCK * 0.3, -BLOCK * 0.3],
];

function fillBlock(scene, cx, cz, idx, treeT, houseT) {
  const g   = new THREE.Group();
  const rng = seededRand(idx * 9973 + 1);

  // One house per block — GLB if loaded, procedural fallback
  if (houseT) {
    const clone = houseT.clone(true);
    clone.rotation.y = Math.floor(rng() * 4) * (Math.PI / 2);
    clone.position.set(cx, 0, cz);
    clone.updateMatrixWorld(true);
    const hb = new THREE.Box3().setFromObject(clone);
    houseColliders.push(hb);
    g.add(clone);
  } else {
    makeHouse(g, cx, cz, rng);
  }

  // Trees near the four block corners
  if (treeT) {
    for (const [dx, dz] of _TREE_OFFSETS) {
      if (rng() < 0.8) {
        const clone = treeT.clone(true);
        clone.position.set(cx + dx, 0, cz + dz);
        clone.rotation.y = rng() * Math.PI * 2;
        g.add(clone);
      } else {
        rng();
      }
    }
  }

  scene.add(g);
}

// ── Public API ────────────────────────────────────
export function makeCity(scene) {
  // Ground planes
  const groundBase = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SPAN + 200, CITY_SPAN + 200),
    mGrass
  );
  groundBase.rotation.x = -Math.PI / 2;
  groundBase.position.set(OX, -0.06, OZ);
  groundBase.receiveShadow = true;
  scene.add(groundBase);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3 * CITY_SPAN + 300, 3 * CITY_SPAN + 300, 8, 8),
    mGrass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(OX, -0.06, OZ);
  ground.receiveShadow = true;
  scene.add(ground);

  // N-S roads
  for (const rx of roadLinesX) {
    const road = box(ROAD, 0.08, CITY_SPAN, mAsphalt);
    road.position.set(rx, -0.04, OZ);
    scene.add(road);

    const cl = box(0.14, 0.01, CITY_SPAN, mYellow);
    cl.position.set(rx, 0.04, OZ);
    scene.add(cl);

    for (const s of [-1, 1]) {
      const el = box(0.12, 0.01, CITY_SPAN, mWhite);
      el.position.set(rx + s * (ROAD / 2 - 0.3), 0.04, OZ);
      scene.add(el);

      const sw = box(2, 0.06, CITY_SPAN, mSidewalk);
      sw.position.set(rx + s * (ROAD / 2 + 1), 0.02, OZ);
      scene.add(sw);
    }
  }

  // E-W roads
  for (const rz of roadLinesZ) {
    const road = box(CITY_SPAN, 0.08, ROAD, mAsphalt);
    road.position.set(OX, -0.04, rz);
    scene.add(road);

    const cl = box(CITY_SPAN, 0.01, 0.14, mYellow);
    cl.position.set(OX, 0.04, rz);
    scene.add(cl);

    for (const s of [-1, 1]) {
      const el = box(CITY_SPAN, 0.01, 0.12, mWhite);
      el.position.set(OX, 0.04, rz + s * (ROAD / 2 - 0.3));
      scene.add(el);

      const sw = box(CITY_SPAN, 0.06, 2, mSidewalk);
      sw.position.set(OX, 0.02, rz + s * (ROAD / 2 + 1));
      scene.add(sw);
    }
  }

  // Block centers
  const bxs = roadLinesX.slice(0, -1).map((rx, i) => (rx + roadLinesX[i + 1]) / 2);
  const bzs = roadLinesZ.slice(0, -1).map((rz, i) => (rz + roadLinesZ[i + 1]) / 2);

  // Load tree.glb + house3.glb in parallel; populate blocks when both finish
  const loader  = new GLTFLoader();
  let treeT     = null;
  let houseT    = null;
  let remaining = 2;

  function onAllLoaded() {
    bxs.forEach((bx, bi) =>
      bzs.forEach((bz, bj) => fillBlock(scene, bx, bz, bi * N + bj, treeT, houseT))
    );
  }
  function tryDone() { if (--remaining === 0) onAllLoaded(); }

  loader.load('assets/tree.glb',
    gltf => { treeT  = prepareTreeTemplate(gltf, 4.5); console.log('[WorldMap] tree.glb ready');   tryDone(); },
    undefined,
    err  => { console.warn('[WorldMap] tree.glb failed:', err);                                     tryDone(); }
  );

  // raw height=4.7 → scale=8/4.7 → final height=8 units
  loader.load('assets/house3.glb',
    gltf => { houseT = prepareHouseTemplate(gltf, 8);  console.log('[WorldMap] house3.glb ready'); tryDone(); },
    undefined,
    err  => { console.warn('[WorldMap] house3.glb failed, using procedural:', err);                 tryDone(); }
  );
}
