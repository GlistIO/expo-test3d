export default {
  id: 0,
  playerStart: { x: 0, y: 0 },
  obstacles: [
    { x: 0.5, y: 0, size: 0.5 },
  ],
  pickups: [
    { 
      id: "coin_1", 
      x: -1, 
      y: 1, 
      type: "coin", 
      value: 1,
      message: "Found a shiny coin!" 
    },
    { 
      id: "key_1", 
      x: 1, 
      y: 0, 
      type: "key", 
      value: 1,
      message: "A mysterious key..." 
    },
    { 
      id: "coin_2", 
      x: -0.5, 
      y: -1, 
      type: "coin", 
      value: 1,
      message: "Another coin!" 
    },
  ],
  exits: {
    left: { scene: 1, yRange: [-0.5, 0.5] },
    right: null,
    top: null,
    bottom: null,
  },
  bg: null,
};
