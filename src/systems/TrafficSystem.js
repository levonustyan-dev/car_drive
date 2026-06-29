import * as THREE from 'three';
import { roadLinesX, roadLinesZ } from '../core/WorldMap.js';

const SPEED       = 6;
const REACH_DIST  = 0.8;
const NPC_HEIGHT  = 0.4; // half of box height 0.8, sits on road surface

const NPC_CONFIGS = [
  { bi: 0, bj: 0, color: 0xff3333, startWp: 0 },
  { bi: 2, bj: 0, color: 0x33cc33, startWp: 1 },
  { bi: 1, bj: 1, color: 0x3399ff, startWp: 2 },
  { bi: 3, bj: 1, color: 0xff9900, startWp: 3 },
  { bi: 0, bj: 2, color: 0xcc33ff, startWp: 0 },
  { bi: 2, bj: 2, color: 0x00cccc, startWp: 2 },
];

function blockWaypoints(bi, bj) {
  const x0 = roadLinesX[bi],     x1 = roadLinesX[bi + 1];
  const z0 = roadLinesZ[bj],     z1 = roadLinesZ[bj + 1];
  // Clockwise: NW → NE → SE → SW
  return [
    new THREE.Vector3(x0, NPC_HEIGHT, z0),
    new THREE.Vector3(x1, NPC_HEIGHT, z0),
    new THREE.Vector3(x1, NPC_HEIGHT, z1),
    new THREE.Vector3(x0, NPC_HEIGHT, z1),
  ];
}

class NPC {
  constructor(scene, waypoints, color, startWp) {
    this._waypoints = waypoints;
    this._wpIdx     = startWp % waypoints.length;

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 4),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 })
    );
    this.mesh.castShadow = true;

    const start = waypoints[this._wpIdx];
    this.mesh.position.copy(start);
    this._faceTarget();
    scene.add(this.mesh);
  }

  _faceTarget() {
    const curr = this._waypoints[this._wpIdx];
    const next = this._waypoints[(this._wpIdx + 1) % this._waypoints.length];
    const dx = next.x - curr.x;
    const dz = next.z - curr.z;
    this.mesh.rotation.y = Math.atan2(dx, dz);
  }

  update(dt) {
    const target = this._waypoints[(this._wpIdx + 1) % this._waypoints.length];
    const dx = target.x - this.mesh.position.x;
    const dz = target.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < REACH_DIST) {
      this._wpIdx = (this._wpIdx + 1) % this._waypoints.length;
      this.mesh.position.set(target.x, NPC_HEIGHT, target.z);
      this._faceTarget();
    } else {
      const inv = SPEED * dt / dist;
      this.mesh.position.x += dx * inv;
      this.mesh.position.z += dz * inv;
    }
  }
}

export class TrafficSystem {
  constructor(scene) {
    this._npcs = NPC_CONFIGS.map(({ bi, bj, color, startWp }) =>
      new NPC(scene, blockWaypoints(bi, bj), color, startWp)
    );
  }

  update(dt) {
    this._npcs.forEach(npc => npc.update(dt));
  }
}
