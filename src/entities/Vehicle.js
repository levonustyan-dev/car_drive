import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Vehicle {
  constructor(scene) {
    this.carGroup = new THREE.Group();
    this.wheels   = [];

    const placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.9, 4.0),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 1.2 })
    );
    placeholder.position.y = 0.7;
    this.carGroup.add(placeholder);

    scene.add(this.carGroup);
    this._loadGLB();
  }

  _loadGLB() {
    const loader = new GLTFLoader();
    loader.load('car.glb', (gltf) => {
      const obj = gltf.scene;

      const bbox = new THREE.Box3().setFromObject(obj);
      const maxDim = Math.max(...bbox.getSize(new THREE.Vector3()).toArray());
      obj.scale.setScalar(4.0 / maxDim);

      obj.rotation.y = 0;

      const bbox2 = new THREE.Box3().setFromObject(obj);
      const center = bbox2.getCenter(new THREE.Vector3());
      obj.position.set(-center.x, -bbox2.min.y, -center.z);

      const allNodes = [];
      obj.traverse(n => { allNodes.push(n.name + ' (' + n.type + ')'); });
      console.log('ALL NODES:\n' + allNodes.join('\n'));

      obj.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });

      [...this.carGroup.children].forEach(c => this.carGroup.remove(c));
      this.carGroup.add(obj);
      console.log('Car loaded ✓');
    }, undefined, err => console.error('GLB load failed', err));
  }

  update(speed, dt) {
    this.wheels.forEach(w => { w.rotation.x += speed * dt * 2.5; });
  }
}
