import { CUBE_SIZE, OBSTACLE, MIN_X, MAX_X, MIN_Y, MAX_Y, STEP } from "./constants";

export function willCollide(x, y, obstacles) {
  for (let obj of obstacles) {
    const half = obj.size / 2;
    if (
      Math.abs(x - obj.x) < CUBE_SIZE / 2 + half &&
      Math.abs(y - obj.y) < CUBE_SIZE / 2 + half
    ) {
      return true;
    }
  }
  return false;
}

export function getSafeDestination(x, y, dx, dy) {
  const TOTAL = STEP;
  const SUBSTEP = 0.01;
  let travelled = 0;
  let lastSafe = { x, y };

  while (travelled < TOTAL) {
    let nx = x + dx * travelled;
    let ny = y + dy * travelled;
    if (nx < MIN_X || nx > MAX_X || ny < MIN_Y || ny > MAX_Y) break;
    if (willCollide(nx, ny)) break;
    lastSafe = { x: nx, y: ny };
    travelled += SUBSTEP;
  }
  return lastSafe;
}
