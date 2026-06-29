export function updateCamera(camera, playerX, playerZ) {
  camera.position.set(playerX, 3.5, playerZ - 12);
  camera.lookAt(playerX, 0.5, playerZ + 20);
}
