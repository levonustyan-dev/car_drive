import * as THREE from 'three';

const SPEED_THRESHOLD = 25;   // m/s (~90 km/h) triggers escalation
const ESCALATE_TIME   = 3;    // seconds above threshold to gain one star
const DECAY_TIME      = 8;    // seconds below threshold to clear all stars
const MAX_STARS       = 3;
const POLICE_SPEED    = 12;   // m/s seek speed — slower than player max so escape is possible
const NPC_HEIGHT      = 0.4;
const SPAWN_OFFSET    = 60;   // units behind player on first spawn

export class WantedLevel {
  constructor(scene) {
    this._stars      = 0;
    this._fastTimer  = 0;  // accumulates while speed > threshold
    this._slowTimer  = 0;  // accumulates while speed <= threshold and stars > 0
    this._spawned    = false;

    this._police = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.5, metalness: 0.3 })
    );
    this._police.castShadow = true;
    this._police.visible    = false;
    this._police.position.set(0, NPC_HEIGHT, 0);
    scene.add(this._police);
  }

  update(dt, speed, playerPos) {
    const fast = speed > SPEED_THRESHOLD;

    if (fast) {
      this._slowTimer = 0;
      this._fastTimer += dt;
      if (this._fastTimer >= ESCALATE_TIME && this._stars < MAX_STARS) {
        this._stars++;
        this._fastTimer = 0;
      }
    } else {
      this._fastTimer = 0;
      if (this._stars > 0) {
        this._slowTimer += dt;
        if (this._slowTimer >= DECAY_TIME) {
          this._stars      = 0;
          this._slowTimer  = 0;
        }
      }
    }

    if (this._stars >= 2) {
      if (!this._spawned) {
        this._police.position.set(playerPos.x, NPC_HEIGHT, playerPos.z - SPAWN_OFFSET);
        this._police.visible = true;
        this._spawned        = true;
      }

      const dx   = playerPos.x - this._police.position.x;
      const dz   = playerPos.z - this._police.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 1) {
        const inv = POLICE_SPEED * dt / dist;
        this._police.position.x += dx * inv;
        this._police.position.z += dz * inv;
        this._police.rotation.y  = Math.atan2(dx, dz);
      }
    } else {
      this._police.visible = false;
      this._spawned        = false;
    }
  }

  getStars() { return this._stars; }
}
