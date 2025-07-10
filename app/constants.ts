export const WORLD_LEFT = -2;
export const WORLD_RIGHT = 2;
export const WORLD_TOP = 2;
export const WORLD_BOTTOM = -2;

export const CUBE_SIZE = 0.3;
export const OBSTACLE_SIZE = 0.5;
export const STEP = 0.2;

export const MIN_X = WORLD_LEFT + CUBE_SIZE / 2;
export const MAX_X = WORLD_RIGHT - CUBE_SIZE / 2;
export const MIN_Y = WORLD_BOTTOM + CUBE_SIZE / 2;
export const MAX_Y = WORLD_TOP - CUBE_SIZE / 2;

export const OBSTACLE = { x: 0.5, y: 0, size: OBSTACLE_SIZE };

export const SPRITE_COLS = 4;
export const SPRITE_ROWS = 4;

export const EXIT_MARGIN = 0.2;

export const DIRECTIONS = {
  up: 3,
  left: 1,
  right: 2,
  down: 0,
};
export const COLORS = {
  up: 0x0074d9,
  down: 0xffdc00,
  left: 0x2ecc40,
  right: 0xff4136,
};

export const WALK_FRAMES = [0, 1, 0, 3];
export const WALK_FRAME_COUNT = WALK_FRAMES.length;
