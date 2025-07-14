export default {
  id: 1,
  playerStart: { x: 0, y: 0 },
  obstacles: [
    { x: 0.5, y: 0, size: 0.5 },
    { x: -0.8, y: 0.8, size: 0.3 },
  ],
  pickups: [
    { 
      id: "coin_scene1_1", 
      x: -1, 
      y: 1, 
      type: "coin", 
      value: 2,
      message: "A valuable coin worth 2!" 
    },
    { 
      id: "special_gem", 
      x: 0, 
      y: -1.2, 
      type: "key", // Using key texture for now, but could be "gem" 
      value: 5,
      message: "A rare gem! Worth 5 points!" 
    },
  ],
  exits: {
    left: null,
    right: { scene: 0, yRange: [-0.5, 0.5] },
    top: null,
    bottom: null,
  },
  bg: null,
};
