import * as THREE from 'three';

export class Waypoint {
  constructor(scene, position) {
    this._group = new THREE.Group();
    this._group.position.set(position.x, 0, position.z);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffee00,
      emissive: 0xffee00,
      emissiveIntensity: 1.0,
      roughness: 0.3,
    });

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 8, 8),
      mat
    );
    beam.position.y = 4;
    this._group.add(beam);

    this._diamond = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), mat);
    this._diamond.rotation.y = Math.PI / 4;
    this._diamond.rotation.x = Math.PI / 4;
    this._diamond.position.y = 9;
    this._group.add(this._diamond);

    scene.add(this._group);
  }

  update(dt) {
    this._diamond.rotation.y += dt * 1.2;
  }

  moveTo(position) {
    this._group.position.set(position.x, 0, position.z);
  }

  show() { this._group.visible = true; }
  hide() { this._group.visible = false; }
}
