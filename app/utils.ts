import { CUBE_SIZE, MIN_X, MAX_X, MIN_Y, MAX_Y, STEP } from "./constants";

export function willCollide(x, y, obstacles) {
  // Check world boundaries
  if (x < MIN_X || x > MAX_X || y < MIN_Y || y > MAX_Y) {
    return true;
  }
  
  // Check obstacle collisions
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

export function getSafeDestination(playerPos, targetPos, obstacles) {
  const dx = targetPos.x - playerPos.x;
  const dy = targetPos.y - playerPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 0.01) {
    return playerPos;
  }
  
  const dirX = dx / distance;
  const dirY = dy / distance;
  
  // Try direct path first
  const directPath = getDirectPath(playerPos, targetPos, obstacles);
  if (directPath) {
    return directPath;
  }
  
  // If direct path is blocked, try sliding along walls
  const slideResult = trySlideMovement(playerPos, dirX, dirY, obstacles);
  if (slideResult) {
    return slideResult;
  }
  
  // If sliding doesn't work, try corner navigation
  const cornerResult = tryCornerNavigation(playerPos, targetPos, obstacles);
  if (cornerResult) {
    return cornerResult;
  }
  
  // Last resort: stay in place
  return playerPos;
}

function getDirectPath(start, target, obstacles) {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 0.01) return start;
  
  const stepSize = Math.min(STEP * 0.5, distance);
  const dirX = dx / distance;
  const dirY = dy / distance;
  
  const newX = start.x + dirX * stepSize;
  const newY = start.y + dirY * stepSize;
  
  if (!willCollide(newX, newY, obstacles)) {
    return { x: newX, y: newY };
  }
  
  return null;
}

function trySlideMovement(playerPos, dirX, dirY, obstacles) {
  const stepSize = STEP * 0.5;
  
  // Try horizontal movement only
  const horizontalX = playerPos.x + dirX * stepSize;
  if (!willCollide(horizontalX, playerPos.y, obstacles)) {
    return { x: horizontalX, y: playerPos.y };
  }
  
  // Try vertical movement only
  const verticalY = playerPos.y + dirY * stepSize;
  if (!willCollide(playerPos.x, verticalY, obstacles)) {
    return { x: playerPos.x, y: verticalY };
  }
  
  return null;
}

function tryCornerNavigation(playerPos, targetPos, obstacles) {
  const stepSize = STEP * 0.3;
  
  // Try multiple angles around obstacles
  const angles = [
    Math.PI / 6,    // 30 degrees
    -Math.PI / 6,   // -30 degrees
    Math.PI / 4,    // 45 degrees
    -Math.PI / 4,   // -45 degrees
    Math.PI / 3,    // 60 degrees
    -Math.PI / 3,   // -60 degrees
  ];
  
  const dx = targetPos.x - playerPos.x;
  const dy = targetPos.y - playerPos.y;
  const baseAngle = Math.atan2(dy, dx);
  
  for (const angleOffset of angles) {
    const angle = baseAngle + angleOffset;
    const newX = playerPos.x + Math.cos(angle) * stepSize;
    const newY = playerPos.y + Math.sin(angle) * stepSize;
    
    if (!willCollide(newX, newY, obstacles)) {
      return { x: newX, y: newY };
    }
  }
  
  return null;
}

// Enhanced collision detection for better corner handling
export function getCollisionNormal(playerPos, obstacles) {
  let normalX = 0;
  let normalY = 0;
  
  for (let obj of obstacles) {
    const dx = playerPos.x - obj.x;
    const dy = playerPos.y - obj.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < (CUBE_SIZE / 2 + obj.size / 2 + 0.1)) {
      // Add to the normal vector pointing away from the obstacle
      normalX += dx / distance;
      normalY += dy / distance;
    }
  }
  
  // Normalize the result
  const length = Math.sqrt(normalX * normalX + normalY * normalY);
  if (length > 0) {
    return { x: normalX / length, y: normalY / length };
  }
  
  return { x: 0, y: 0 };
}
