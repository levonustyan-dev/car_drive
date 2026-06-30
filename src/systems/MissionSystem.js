import * as THREE from 'three';
import { Waypoint } from '../entities/Waypoint.js';

const MISSIONS = [
  { id: 'm1', title: 'Pizza Delivery', type: 'delivery',
    description: "Pick up the pizza from Mario's restaurant, then deliver it to the customer on Oak Street. Follow the yellow marker.",
    pickupPos: { x: 0, z: 300 }, dropPos: { x: 0, z: 600 }, reward: 500 },
  { id: 'm2', title: 'Street Race', type: 'race',
    description: "Race to the finish line across town in under 30 seconds. Every second counts!",
    goalPos: { x: 0, z: 800 }, timeLimit: 30, reward: 1000 },
  { id: 'm3', title: 'Getaway', type: 'drive',
    description: "The police are closing in. Drive 500 meters without stopping or dropping below 20 km/h.",
    distance: 500, reward: 750 },
];

console.log('[MissionSystem] m1 pickup:', MISSIONS[0].pickupPos, ' m1 dropoff:', MISSIONS[0].dropPos, ' m2 goal:', MISSIONS[1].goalPos);

const TRIGGER_Z  = 200;
const TRIGGER_R  = 4;
const PROMPT_R   = 8;
const GOAL_REACH = 8;

// ── Minimal EventEmitter ─────────────────────────
class EventEmitter {
  constructor() { this._listeners = {}; }

  on(event, cb) {
    (this._listeners[event] = this._listeners[event] || []).push(cb);
    return this;
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }
}

// ── MissionSystem ────────────────────────────────
export class MissionSystem extends EventEmitter {
  constructor(scene) {
    super();
    this._current          = null;
    this._timer            = 0;
    this._distanceTraveled = 0;
    this._nearTrigger      = false;
    this._phase            = null; // delivery: 'pickup' | 'deliver'

    this._triggerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(TRIGGER_R, TRIGGER_R, 0.2, 40),
      new THREE.MeshStandardMaterial({
        color: 0xffdd00, emissive: 0xffdd00,
        emissiveIntensity: 0.8, roughness: 0.3,
      })
    );
    this._triggerMesh.position.set(0, 0.1, TRIGGER_Z);
    scene.add(this._triggerMesh);

    this._pickupWp  = new Waypoint(scene, { x: 0, z: 0 });
    this._pickupWp.hide();
    this._dropoffWp = new Waypoint(scene, { x: 0, z: 0 });
    this._dropoffWp.hide();

    this._prompt = document.getElementById('mission-prompt');
  }

  // ── Public API ───────────────────────────────────

  startMission(id) {
    if (this._current) return;
    const def = MISSIONS.find(m => m.id === id);
    if (!def) return;
    this._current          = { ...def };
    this._timer            = def.timeLimit || 0;
    this._distanceTraveled = 0;
    this._phase            = def.type === 'delivery' ? 'pickup' : null;

    if (def.type === 'delivery') {
      this._pickupWp.moveTo(def.pickupPos);
      this._dropoffWp.moveTo(def.dropPos);
      this._pickupWp.show();
    }

    this._setPrompt(false);
    this.emit('mission:start', this._current);
  }

  update(dt, playerPos, playerSpeed) {
    this._animateTrigger(dt);
    this._pickupWp.update(dt);
    this._dropoffWp.update(dt);
    this._checkProximity(playerPos);
    if (!this._current) return;

    const m = this._current;

    if (m.type === 'race') {
      this._timer -= dt;
      if (this._timer <= 0) { this.failMission(); return; }
      if (this._dist(playerPos, m.goalPos) < GOAL_REACH) this.completeMission();

    } else if (m.type === 'delivery') {
      if (this._phase === 'pickup' && this._dist(playerPos, m.pickupPos) < GOAL_REACH) {
        this._phase = 'deliver';
        this._pickupWp.hide();
        this._dropoffWp.show();
      } else if (this._phase === 'deliver' && this._dist(playerPos, m.dropPos) < GOAL_REACH) {
        this.completeMission();
      }

    } else if (m.type === 'drive') {
      if (playerSpeed > 1) {
        this._distanceTraveled += playerSpeed * dt;
        if (this._distanceTraveled >= m.distance) this.completeMission();
      } else {
        this._distanceTraveled = 0;
      }
    }
  }

  completeMission() {
    const m = this._current;
    this._end();
    this.emit('mission:complete', m);
  }

  failMission() {
    const m = this._current;
    this._end();
    this.emit('mission:fail', m);
  }

  getCurrentMission() { return this._current; }
  isNearTrigger()     { return this._nearTrigger; }

  getCurrentTarget() {
    if (!this._current) return null;
    const m = this._current;
    if (m.type === 'delivery') return this._phase === 'pickup' ? m.pickupPos : m.dropPos;
    if (m.type === 'race')     return m.goalPos;
    return null; // drive type has no fixed positional target
  }

  // ── Private ──────────────────────────────────────

  _end() {
    this._current          = null;
    this._timer            = 0;
    this._distanceTraveled = 0;
    this._phase            = null;
    this._pickupWp.hide();
    this._dropoffWp.hide();
  }

  _dist(a, b) {
    const dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  _checkProximity(playerPos) {
    if (this._current) { this._setPrompt(false); return; }
    const dx   = playerPos.x;
    const dz   = playerPos.z - TRIGGER_Z;
    const near = (dx * dx + dz * dz) < PROMPT_R * PROMPT_R;
    if (near !== this._nearTrigger) this._setPrompt(near);
  }

  _setPrompt(visible) {
    this._nearTrigger          = visible;
    this._prompt.style.display = visible ? 'block' : 'none';
  }

  _animateTrigger(dt) {
    this._triggerMesh.rotation.y += dt;
  }
}
