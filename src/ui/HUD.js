export class HUD {
  constructor() {
    this._container = document.getElementById('nav-arrow');
    this._icon      = document.getElementById('nav-arrow-icon');
    this._distEl    = document.getElementById('nav-dist');
  }

  // playerPos: {x, z}  target: {x, z} | null
  // Camera always faces +Z, so screen-up = world +Z — no heading offset needed.
  update(playerPos, target) {
    if (!target) {
      this._container.style.display = 'none';
      return;
    }

    this._container.style.display = 'flex';

    const dx   = target.x - playerPos.x;
    const dz   = target.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const deg  = Math.atan2(dx, dz) * (180 / Math.PI);

    this._icon.style.transform = `rotate(${deg}deg)`;
    this._distEl.textContent   = Math.round(dist) + ' m';
  }
}
