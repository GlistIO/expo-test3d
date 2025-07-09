import { CUBE_SIZE } from "../constants";

// Helper pārbaudei, vai spēlētājs savācis monētu
export function isCoinCollected(playerPos, coin) {
  const dx = playerPos.x - coin.x;
  const dy = playerPos.y - coin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < CUBE_SIZE * 0.7;
}
