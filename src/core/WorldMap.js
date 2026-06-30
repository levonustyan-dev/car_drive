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

// ── GLB template builders ─────────────────────────

// Tree: bakes rotation, scale, and centering into a wrapper Group so clones
// only need a position and a Y rotation.
function prepareTreeTemplate(gltf, targetHeight) {
  const inner = gltf.scene;

  inner.rotation.x = -Math.PI / 2;
  inner.updateMatrixWorld(true);

  const b1 = new THREE.Box3().setFromObject(inner);
  const sz = new THREE.Vector3();
  b1.getSize(sz);

  const largest = Math.max(sz.x, sz.y, sz.z);
  const scale   = largest > 0 ? targetHeight / largest : 1;
  inner.scale.setScalar(scale);
  inner.updateMatrixWorld(true);

  const b2 = new THREE.Box3().setFromObject(inner);
  inner.position.x = -(b2.min.x + b2.max.x) / 2;
  inner.position.y = -b2.min.y;
  inner.position.z = -(b2.min.z + b2.max.z) / 2;

  inner.traverse(obj => {
    if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
  });

  const wrapper = new THREE.Group();
  wrapper.add(inner);
  return wrapper;
}

// House: stored raw (no transform baked) so each clone can receive the
// rotation.x correction independently, then have its bbox re-measured for
// accurate scale and ground-contact height.
function prepareHouseTemplate(gltf) {
  const inner = gltf.scene;
  inner.traverse(obj => {
    if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
  });
  return inner;
}

let _houseLogPrinted = false;

// ── Block content ─────────────────────────────────
function fillBlock(scene, cx, cz, idx, treeT, houseT) {
  if (!treeT && !houseT) return;

  const g          = new THREE.Group();
  const rng        = seededRand(idx * 9973 + 1);
  const HALF_INNER = BLOCK / 2 - 6;

  for (let dx = -HALF_INNER; dx <= HALF_INNER; dx += 10) {
    for (let dz = -HALF_INNER; dz <= HALF_INNER; dz += 12) {
      const r   = rng();
      const px  = cx + dx + (rng() - 0.5) * 3;
      const pz  = cz + dz + (rng() - 0.5) * 3;
      const rot = rng() * Math.PI * 2;

      if (r < 0.45 && treeT) {
        // Tree: rotation/scale/centering baked into wrapper — just place
        const clone = treeT.clone(true);
        clone.position.set(px, 0, pz);
        clone.rotation.y = rot;
        g.add(clone);

      } else if (r < 0.8 && houseT) {
        const clone = houseT.clone(true);

        // Stand the raw model upright (Z-up → Y-up)
        clone.rotation.x = -Math.PI / 2;
        clone.updateMatrixWorld(true);

        // Measure bbox after rotation to get true dimensions
        const b1 = new THREE.Box3().setFromObject(clone);
        const s1 = new THREE.Vector3();
        b1.getSize(s1);
        const largest    = Math.max(s1.x, s1.y, s1.z);
        const houseScale = largest > 0 ? 5 / largest : 1;
        clone.scale.setScalar(houseScale);
        clone.updateMatrixWorld(true);

        // Remeasure after scaling to find the exact ground contact point
        const b2 = new THREE.Box3().setFromObject(clone);

        // Y rotation for variety — 90° snaps keep walls axis-aligned.
        // Applied after computing b2 because Y rotation doesn't change Y extent.
        clone.rotation.y = Math.round(rot / (Math.PI / 2)) * (Math.PI / 2);
        clone.position.set(px, -b2.min.y, pz);
        g.add(clone);

        if (!_houseLogPrinted) {
          console.log('[WorldMap] example house — rotation.x:', clone.rotation.x.toFixed(3),
            'rotation.y:', clone.rotation.y.toFixed(3),
            'scale:', houseScale.toFixed(4),
            'position.y:', clone.position.y.toFixed(3),
            '(lowest face at y=0)');
          _houseLogPrinted = true;
        }
      }
    }
  }
  scene.add(g);
}

// ── Public API ────────────────────────────────────
export function makeCity(scene) {
  // Ground planes (synchronous — visible immediately)
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

  // N-S roads (synchronous)
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

  // E-W roads (synchronous)
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

  // Block centers — used after models finish loading
  const bxs = roadLinesX.slice(0, -1).map((rx, i) => (rx + roadLinesX[i + 1]) / 2);
  const bzs = roadLinesZ.slice(0, -1).map((rz, i) => (rz + roadLinesZ[i + 1]) / 2);

  // Load GLB models, then populate all blocks (async — roads visible meanwhile)
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

  loader.load(
    'assets/tree.glb',
    gltf => {
      treeT = prepareTreeTemplate(gltf, 4.5);
      console.log('[WorldMap] tree.glb ready');
      tryDone();
    },
    undefined,
    err => { console.warn('[WorldMap] tree.glb failed:', err); tryDone(); }
  );

  loader.load(
    'assets/house3.glb',
    gltf => {
      houseT = prepareHouseTemplate(gltf);
      console.log('[WorldMap] house3.glb ready');
      tryDone();
    },
    undefined,
    err => { console.warn('[WorldMap] house3.glb failed:', err); tryDone(); }
  );
}
