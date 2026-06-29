import * as THREE from 'three';

export const ROAD  = 12;
export const BLOCK = 60;
const  CELL  = BLOCK + ROAD;        // 72 — center-to-center road spacing
const  N     = 4;                   // 4×4 grid of blocks

const OX        = 0;
const OZ        = 160;              // matches physics playerZ start
const CITY_SPAN = N * CELL + ROAD;  // 300 — outer edge to outer edge

// Road centerlines in world space
// X: [-144, -72, 0, 72, 144]
// Z: [16, 88, 160, 232, 304]
export const roadLinesX = Array.from({ length: N + 1 }, (_, i) => OX + (i - N / 2) * CELL);
export const roadLinesZ = Array.from({ length: N + 1 }, (_, i) => OZ + (i - N / 2) * CELL);

// ── Materials ────────────────────────────────────
function mat(color, rough = 0.8, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
const mAsphalt   = mat(0x2a2a38, 0.97);
const mYellow    = mat(0xffdd00, 0.85);
const mWhite     = mat(0xffffff, 0.85);
const mGrass     = mat(0x3a7d2c, 0.95);
const mSidewalk  = mat(0xaaaaaa, 0.9);
const mTreeTrunk = mat(0x7a4f2a, 0.9);
const mLeaves    = mat(0x2d7a1f, 0.8);
const mDoor      = mat(0x8b5e3c, 0.9);
const mWindow    = mat(0x88bbff, 0.3, 0.1);

// ── Geometry helpers ─────────────────────────────
function box(w, h, d, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
function cyl(rt, rb, h, seg, m) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.castShadow = true;
  return mesh;
}

// ── Procedural content ───────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function makeTree(g, x, z, rng) {
  const h = 2.5 + rng() * 2;
  const trunk = cyl(0.12, 0.18, h * 0.4, 6, mTreeTrunk);
  trunk.position.set(x, h * 0.2, z);
  g.add(trunk);
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.9 + rng() * 0.5, h * 0.7, 7), mLeaves);
  top.castShadow = true;
  top.position.set(x, h * 0.4 + h * 0.35, z);
  g.add(top);
}

function makeHouse(g, x, z, rng, side) {
  const W = 4 + rng() * 3, D = 5 + rng() * 3, H = 3 + rng() * 1.5;
  const wallColor = [0xe8d8b0, 0xd4c4a0, 0xc8b090, 0xf0e0c0][Math.floor(rng() * 4)];
  const wall = box(W, H, D, mat(wallColor, 0.9));
  wall.position.set(x, H / 2, z);
  g.add(wall);
  const roofH = 1.5 + rng();
  const roofColor = [0xb03020, 0x704020, 0x506080, 0x888888][Math.floor(rng() * 4)];
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(W, D) * 0.72, roofH, 4), mat(roofColor, 0.85));
  roof.castShadow = true;
  roof.rotation.y = Math.PI / 4;
  roof.position.set(x, H + roofH / 2, z);
  g.add(roof);
  const door = box(0.9, 2, 0.1, mDoor);
  door.position.set(x, 1, z + side * D / 2);
  g.add(door);
  [-W * 0.25, W * 0.25].forEach(wx => {
    const win = box(0.8, 0.7, 0.1, mWindow);
    win.position.set(x + wx, H * 0.6, z + side * D / 2);
    g.add(win);
  });
}

function fillBlock(scene, cx, cz, idx) {
  const g   = new THREE.Group();
  const rng = seededRand(idx * 9973 + 1);
  const HALF_INNER = BLOCK / 2 - 6; // 24 — margin from road edge

  for (let dx = -HALF_INNER; dx <= HALF_INNER; dx += 10) {
    for (let dz = -HALF_INNER; dz <= HALF_INNER; dz += 12) {
      const r  = rng();
      const px = cx + dx + (rng() - 0.5) * 3;
      const pz = cz + dz + (rng() - 0.5) * 3;
      if (r < 0.45) {
        makeTree(g, px, pz, rng);
      } else if (r < 0.8) {
        makeHouse(g, px, pz, rng, 1);
      } else {
        rng(); rng(); // consume to keep sequence stable across branches
      }
    }
  }
  scene.add(g);
}

// ── Public API ───────────────────────────────────
export function makeCity(scene) {
  // Grass ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SPAN + 200, CITY_SPAN + 200),
    mGrass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(OX, -0.05, OZ);
  ground.receiveShadow = true;
  scene.add(ground);

  // N-S roads (run along Z axis, one per X in roadLinesX)
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

  // E-W roads (run along X axis, one per Z in roadLinesZ)
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

  // Block interiors — trees and houses
  const bxs = roadLinesX.slice(0, -1).map((rx, i) => (rx + roadLinesX[i + 1]) / 2);
  const bzs = roadLinesZ.slice(0, -1).map((rz, i) => (rz + roadLinesZ[i + 1]) / 2);
  bxs.forEach((bx, bi) =>
    bzs.forEach((bz, bj) => fillBlock(scene, bx, bz, bi * N + bj))
  );
}
