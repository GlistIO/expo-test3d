import { CUBE_SIZE, OBSTACLE, MIN_X, MAX_X, MIN_Y, MAX_Y, STEP } from "./constants";

export function willCollide(newX, newY) {
  const half = CUBE_SIZE / 2;
  const oHalf = OBSTACLE.size / 2;
  return (
    Math.abs(newX - OBSTACLE.x) < half + oHalf &&
    Math.abs(newY - OBSTACLE.y) < half + oHalf
  );
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
