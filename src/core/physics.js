const MAX_SPEED = 30;
const ACCEL     = 18;
const BRAKE     = 40;
const TURN_SPD  = 1.8; // radians/sec

export const state = {
  speed:   0,
  steer:   0,     // -1/0/1, used for body lean in main.js
  angle:   0,     // car heading (radians), applied to carGroup.rotation.y
  playerX: 0,
  playerZ: 160,
};

export function updatePhysics(dt, keys) {
  const gas   = keys['ArrowUp']    || keys['KeyW'];
  const brake = keys['ArrowDown']  || keys['KeyS'];
  const left  = keys['ArrowLeft']  || keys['KeyA'];
  const right = keys['ArrowRight'] || keys['KeyD'];

  if (gas)   state.speed = Math.min(state.speed + ACCEL * dt,  MAX_SPEED);
  if (brake) state.speed = Math.max(state.speed - BRAKE * dt, -MAX_SPEED * 0.3);
  if (!gas && !brake) {
    if (state.speed > 0) state.speed = Math.max(state.speed - 8 * dt, 0);
    else                 state.speed = Math.min(state.speed + 8 * dt, 0);
  }

  // Steering only works when the car is moving
  if (Math.abs(state.speed) > 0.1) {
    if (left)  state.angle -= TURN_SPD * dt;
    if (right) state.angle += TURN_SPD * dt;
  }
  state.steer = left ? -1 : right ? 1 : 0;

  state.playerX += Math.sin(state.angle) * state.speed * dt;
  state.playerZ += Math.cos(state.angle) * state.speed * dt;
}
